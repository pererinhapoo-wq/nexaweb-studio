# Guia de Integração: Limite Seguro de Retentativas em Quarentena (NexaWeb V4.1)

Este documento descreve as correções pontuais implementadas na versão **V4.1** para solucionar o ciclo infinito de tentativas de descarte administrativo pendente no NexaWeb, introduzindo limite finito para falhas físicas no Storage, pausa automática com registro auditável, reautorização administrativa e diferenciação estrita de erros sem perda da capacidade de recuperação.

> **IMPORTANTE:** Nenhuma instrução SQL foi executada no banco de dados e nenhuma conexão externa foi aberta com o Supabase. As migrações anteriores (V3 e V4) foram preservadas intactas. A aplicação destas alterações em homologação ou produção deve seguir este guia.

---

## 1. Problemas Abordados e Soluções Implementadas na V4.1

### 1.1 Limite Finito de Retentativas e Pausa Automática
* **Problema:** Na versão V4, a preservação de `pending_dismiss_justification` garantia a recuperabilidade, mas permitia que falhas repetidas e persistentes de Storage (ex: bucket indisponível, permissões incorretas no provedor de nuvem) fossem reivindicadas infinitamente pelo Sweeper a cada expiração de lease.
* **Solução:**
  - Adicionado o contador específico `dismiss_failure_count` (separado de `cleanup_attempts`).
  - Adicionadas as colunas `dismiss_paused_at` e `dismiss_pause_reason` em `public.project_attachments`.
  - Na RPC `record_attachment_cleanup_failure`, cada falha física de descarte pendente incrementa `dismiss_failure_count`.
  - Ao atingir o limite configurado (padrão de 5 falhas consecutivas), novas tentativas físicas automáticas são **pausadas**:
    - `dismiss_paused_at = now()`
    - `dismiss_pause_reason = 'LIMITE_FALHAS_ATINGIDO: 5 falhas consecutivas (...)'`
    - Adiciona nota de auditoria explícita em `quarantine_notes` com a data e o total de falhas.
  - A RPC `claim_attachments_for_cleanup` exclui expressamente registros com `dismiss_paused_at IS NOT NULL`, impedindo novas tentativas automáticas enquanto a operação estiver pausada.
  - O registro **não é descartado silenciosamente**: permanece em quarentena (`DELETION_FAILED`), visível para os administradores no painel com indicação clara do motivo da pausa.

### 1.2 Preservação Integral de Dados e Histórico de Auditoria
* O contador histórico geral `cleanup_attempts` **não é zerado nem adulterado** (mantém o valor original acumulado, ex: 10, 14, etc.).
* `pending_dismiss_justification` é **estritamente preservada** durante todo o período de pausa.
* Nenhum anexo é marcado como `DELETED` sem confirmação válida e atômica da operação.

### 1.3 Reautorização Administrativa Segura
* Nova RPC `admin_reauthorize_quarantined_attachment(p_attachment_id uuid, p_justification text default null)`:
  - Permite ao administrador reautorizar uma operação pausada após corrigir a causa raiz externa (ex: credenciais do Storage ou restauração de infraestrutura).
  - Limpa a pausa (`dismiss_paused_at = null`, `dismiss_pause_reason = null`), zera o contador de falhas consecutivas (`dismiss_failure_count = 0`) e agenda a retomada pelo Sweeper (`admin_retry_requested_at = now()`).
  - Permite atualizar ou manter a justificativa auditada e preserva `cleanup_attempts`.
  - Integrada à rota `/api/admin-projects?action=quarantine-reauthorize` e ao painel `AdminDashboard.tsx` com botão dedicado de **Reautorizar**.

### 1.4 Diferenciação Estrita de Falhas no Cron e Sweeper
* **Falha ao Listar o Storage (`storage.list`):** Não presume que o arquivo existe nem que foi removido. Registra a falha técnica via `record_attachment_cleanup_failure` sem chamar confirmação e mantém o anexo recuperável.
* **Falha ao Remover o Arquivo (`storage.remove`):** Contabiliza falha física no `dismiss_failure_count`, pausa se atingir o limite e preserva o histórico.
* **Arquivo Já Ausente do Storage (`!fileExists`):** Detecta que o arquivo já foi excluído em ciclo anterior e **não reexecuta** `storage.remove`. Prossegue diretamente para a confirmação atômica no banco usando o lease ativo.
* **Falha de Confirmação no Banco:** Se a remoção física tiver ocorrido mas a confirmação no banco falhar, o anexo **não é marcado como DELETED**. Permanece em quarentena com `pending_dismiss_justification` para reconciliação segura no ciclo seguinte sem nova exclusão física.

---

## 2. Inventário de Arquivos do Pacote de Entrega

| Arquivo | Caminho no Repositório | Estado | Descrição |
| :--- | :--- | :--- | :--- |
| `MIGRACAO_UPLOADS_PENDENTE.sql` | `MIGRACAO_UPLOADS_PENDENTE.sql` | **Preservado** | Migração original intacta. |
| `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` | `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` | **Preservado** | Migração V3 original intacta. |
| `MIGRACAO_UPLOADS_QUARENTENA_V4.sql` | `MIGRACAO_UPLOADS_QUARENTENA_V4.sql` | **Preservado** | Migração V4 original intacta. |
| `MIGRACAO_UPLOADS_QUARENTENA_V4_1.sql` | `MIGRACAO_UPLOADS_QUARENTENA_V4_1.sql` | **Novo (V4.1)** | Migração revisada com limite finito de retentativas, pausa de descarte e reautorização administrativa. |
| `api/admin-projects.ts` | `api/admin-projects.ts` | **Atualizado** | Endpoint com ação `quarantine-reauthorize`, suporte CSRF e fallback sincronizado. |
| `api/cron-cleanup-attachments.ts` | `api/cron-cleanup-attachments.ts` | **Atualizado** | Sweeper com diferenciação de erros, exclusão de itens pausados e reporte de `is_paused`. |
| `src/components/AdminDashboard.tsx` | `src/components/AdminDashboard.tsx` | **Atualizado** | Exibição de status de pausa, motivo da falha e botão de reautorização administrativa. |
| `src/components/ContactModal.tsx` | `src/components/ContactModal.tsx` | **Preservado** | Formulário de contato acessível. |
| `api/create-briefing.ts` | `api/create-briefing.ts` | **Preservado** | Geração segura de tickets HMAC. |
| `api/upload-briefing.ts` | `api/upload-briefing.ts` | **Preservado** | Validação binária e cotas de briefing. |
| `api/_session.ts` | `api/_session.ts` | **Preservado** | Sessão de cliente assinada via HMAC. |
| `api/_portal-session.ts` | `api/_portal-session.ts` | **Preservado** | Sessão do portal com cookies seguros. |
| `tests/quarantine-security-regression.test.mjs` | `tests/quarantine-security-regression.test.mjs` | **Atualizado (V4.1)** | Suíte com 52 testes cobrindo os 10 cenários obrigatórios da V4.1. |
| `tests/cron-sweeper-simulation.test.mjs` | `tests/cron-sweeper-simulation.test.mjs` | **Atualizado (V4.1)** | Suíte completa com 71 testes simulados do ciclo de vida e permissões. |
| `tests/test-upload-suite.mjs` | `tests/test-upload-suite.mjs` | **Existente** | Suíte de upload de briefings (22 testes). |
| `tests/test-e2e-handler.mjs` | `tests/test-e2e-handler.mjs` | **Existente** | Testes ponta a ponta dos handlers serverless. |
| `vercel.json` | `vercel.json` | **Preservado** | Configurações de rotas e cron triggers. |
| `README-INTEGRACAO.md` | `README-INTEGRACAO.md` | **Atualizado** | Guia técnico e relatório de validação da V4.1. |
| `MANIFESTO-ENTREGA.txt` | `MANIFESTO-ENTREGA.txt` | **Atualizado** | Manifesto com hashes SHA-256 e tamanhos exatos. |

---

## 3. Resultados dos Testes Automatizados Locais

Todas as suítes foram executadas no ambiente local e aprovadas com código de saída 0:

1. **Suíte de Regressão V4.1 (`tests/quarantine-security-regression.test.mjs`):**
   - **52 testes executados / 52 aprovados (100% de sucesso)**
   - Cenários obrigatórios validados:
     - Falhas repetidas de remoção até atingir o limite de 5 tentativas.
     - Confirmação de que o Cron deixa de repetir a operação física após o limite.
     - Preservação integral da justificativa e do histórico após a pausa.
     - Reautorização administrativa (`admin_reauthorize_quarantined_attachment`) e retomada segura pelo Cron.
     - Arquivo removido no Storage com confirmação no banco falhando (não marca DELETED).
     - Recuperação posterior pelo Cron quando o arquivo já não existe no Storage (sem novo `remove`).
     - Falha de listagem no Storage sem presumir sucesso.
     - Rejeição estrita de tokens antigos (`LEASE_MISMATCH`) e leases expirados (`LEASE_EXPIRED`).
     - Concorrência atômica entre múltiplos workers (`LEASE_ACTIVE`).
     - Garantia de que registros resolvidos (`DELETED`) não voltam à fila nem aceitam novas mutações.

2. **Suíte do Sweeper e RPCs (`tests/cron-sweeper-simulation.test.mjs`):**
   - **71 testes executados / 71 aprovados (100% de sucesso)**

3. **Suíte de Upload de Briefings (`tests/test-upload-suite.mjs`):**
   - **22 testes executados / 22 aprovados (100% de sucesso)**

4. **Verificação de Tipos TypeScript (`npx tsc --noEmit`):**
   - **0 erros de tipagem (Código 0)**

5. **Build de Produção (`npm run build`):**
   - **Compilação concluída com sucesso em 1.09s**

---

## 4. O que Requer Revisão Manual pelo DBA / Administrador

1. **Aplicação do Script SQL:** Executar `MIGRACAO_UPLOADS_QUARENTENA_V4_1.sql` no SQL Editor do painel Supabase utilizando a role de serviço / administrador (`postgres` / `service_role`).
2. **Definição de Limite Personalizado:** Caso a equipe queira alterar o limite padrão de 5 falhas consecutivas para outro valor (ex: 3 ou 10), o 4º argumento de `record_attachment_cleanup_failure` pode ser customizado.
3. **Monitoramento:** No painel `/admin`, monitorar anexos sinalizados com o badge `PAUSADO` e utilizar o botão `Reautorizar` após checar a integridade do bucket no Supabase.
