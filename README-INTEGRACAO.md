# Guia de Integração: Revisão e Recuperação de Anexos em Quarentena (NexaWeb V4)

Este documento descreve as correções técnicas e o fortalecimento de segurança implementados no ciclo de vida de anexos em quarentena do NexaWeb, atendendo à revisão obrigatória da V4. As alterações preservam a compatibilidade com a V3, mantêm o site e a interface existentes intactos e garantem que nenhuma operação seja marcada como concluída sem confirmação válida no banco de dados.

> **IMPORTANTE:** Nenhuma instrução SQL foi executada no banco de dados e nenhuma conexão externa foi aberta com o Supabase. Os scripts SQL anteriores foram preservados. A aplicação em homologação ou produção deve seguir este guia.

---

## 1. Problemas Abordados e Soluções Implementadas

### 1.1 Preservação da Recuperação após Falha Física
* **Problema:** Se a remoção no Storage falhasse durante um descarte administrativo, o erro anterior corria o risco de limpar metadados de intenção ou deixar o registro preso indefinidamente, especialmente quando já acumulava 10 ou mais tentativas de limpeza.
* **Solução:** Na RPC `record_attachment_cleanup_failure`:
  - A coluna `pending_dismiss_justification` é **estritamente preservada** quando o registro pertencer a um descarte administrativo pendente.
  - O histórico de tentativas (`cleanup_attempts`) é mantido inalterado (>= 10).
  - O histórico de auditoria registra explicitamente a nota de falha física (`[FALHA_DISMISS_STORAGE: ...]`), diferenciando esse fluxo de falhas ordinárias de limpeza (`[FALHA_STORAGE: ...]`).
  - O registro permanece elegível para retomada pelo Sweeper assim que o lease expirar.

### 1.2 Fortalecimento da Confirmação Administrativa
* **Problema:** Um processo poderia tentar confirmar descarte com token antigo, ou confirmar registros que não possuíam intenção administrativa pendente.
* **Solução:** Na RPC `admin_dismiss_quarantined_attachment` (Fase 2 - Confirmação):
  - Exige estado válido (`state = 'DELETING'`).
  - Exige intenção administrativa pendente (`pending_dismiss_justification IS NOT NULL`). Rejeita chamadas que não representem descartes administrativos com `NOT_A_PENDING_DISMISS`.
  - Exige token ativo não nulo, coincidente e com lease não expirado (`cleanup_lease_expires_at > now()`).
  - Rejeita tokens defasados de processos anteriores com `LEASE_MISMATCH` e reservas expiradas com `LEASE_EXPIRED`.
  - Limpa `pending_dismiss_justification` apenas após a confirmação atômica bem-sucedida para `state = 'DELETED'`.

### 1.3 Revisão e Preservação da Contagem de Tentativas
* **Problema:** Zerar artificialmente `cleanup_attempts` para `0` em retries manuais mascarava o histórico real de falhas anteriores e comprometia a auditoria do sistema.
* **Solução:** Na RPC `admin_retry_quarantined_attachment`:
  - **Não zera** `cleanup_attempts`. O valor acumulado (ex: 10, 11, etc.) é preservado de forma íntegra.
  - Registra a intenção administrativa preenchendo a nova coluna `admin_retry_requested_at = now()`.
  - Adiciona nota de auditoria nas `quarantine_notes` explicitando a ação administrativa e o volume prévio de tentativas mantido.
  - A RPC `claim_attachments_for_cleanup` captura o registro pelo critério de retry manual autorizado (`admin_retry_requested_at IS NOT NULL`), limpa a flag e avança o contador de tentativas de forma transparente.

### 1.4 Integração Real do Sweeper (Cron) e Recuperação Segura
* **Problema:** O Sweeper precisava diferenciar descartes administrativos pendentes de limpezas ordinárias e recuperar arquivos que já foram removidos fisicamente do Storage sem falhar nem reexecutar comandos desnecessários.
* **Solução:** Em `api/cron-cleanup-attachments.ts`:
  - A RPC `claim_attachments_for_cleanup` retorna `is_pending_dismiss` e `dismiss_justification`.
  - O Cron verifica antecipadamente a existência do arquivo no Storage:
    1. **Se o arquivo já não existe no Storage:** O cron detecta a situação e prossegue imediatamente para a confirmação atômica no banco (`admin_dismiss_quarantined_attachment` com o lease ativo do cron), sem emitir novo comando `storage.remove`.
    2. **Se o arquivo ainda existe no Storage:** Executa a exclusão física e, em caso de sucesso, confirma no banco.
  - Falhas de listagem, de remoção física e de confirmação de banco são tratadas e reportadas de forma estritamente separada.
  - Um registro **nunca** é marcado como `DELETED` se a confirmação no banco falhar ou se o token for rejeitado.

### 1.5 Compatibilidade Integral das RPCs na Migração V4
* O arquivo `MIGRACAO_UPLOADS_QUARENTENA_V4.sql` reúne todas as definições e atualizações:
  - `claim_attachments_for_cleanup(batch_size, lease_seconds)`
  - `admin_dismiss_quarantined_attachment(attachment_id, justification, lease_token)`
  - `admin_retry_quarantined_attachment(attachment_id)`
  - `confirm_attachment_deleted(attachment_id, lease_token)`
  - `record_attachment_cleanup_failure(attachment_id, lease_token, error)`
  - `get_quarantined_attachments(min_attempts, limit)`
  - Permissões estritas revogando acesso público e concedendo execução exclusivamente a `service_role`.

---

## 2. Inventário de Arquivos do Pacote de Entrega

| Arquivo | Caminho no Repositório | Estado | Descrição |
| :--- | :--- | :--- | :--- |
| `MIGRACAO_UPLOADS_PENDENTE.sql` | `MIGRACAO_UPLOADS_PENDENTE.sql` | **Preservado** | Migração SQL original intacta. |
| `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` | `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` | **Preservado** | Migração SQL da versão V3 preservada. |
| `MIGRACAO_UPLOADS_QUARENTENA_V4.sql` | `MIGRACAO_UPLOADS_QUARENTENA_V4.sql` | **Novo (V4)** | Migração revisada com preservação de justificativa, histórico auditável de retry e todas as RPCs integradas. |
| `api/admin-projects.ts` | `api/admin-projects.ts` | **Corrigido** | Retry e descarte administrativo com lease atômico, auditoria e fallback sincronizado. |
| `api/cron-cleanup-attachments.ts` | `api/cron-cleanup-attachments.ts` | **Corrigido** | Processamento de `is_pending_dismiss`, recuperação de arquivos ausentes e métricas sem registros DELETED. |
| `api/create-briefing.ts` | `api/create-briefing.ts` | **Preservado** | Geração segura de tickets HMAC de 15 minutos. |
| `api/upload-briefing.ts` | `api/upload-briefing.ts` | **Preservado** | Validação binária mágica e cotas por projeto. |
| `api/_session.ts` | `api/_session.ts` | **Preservado** | Sessão de cliente assinada via HMAC SHA-256. |
| `api/_portal-session.ts` | `api/_portal-session.ts` | **Preservado** | Sessão de portal assinada com cookies seguros. |
| `src/components/AdminDashboard.tsx` | `src/components/AdminDashboard.tsx` | **Preservado** | Painel administrativo com suporte a quarentena, retry e dismiss. |
| `src/components/ContactModal.tsx` | `src/components/ContactModal.tsx` | **Preservado** | Formulário de contato com modal acessível. |
| `tests/quarantine-security-regression.test.mjs` | `tests/quarantine-security-regression.test.mjs` | **Atualizado (V4)** | 49 testes cobrindo todo o ciclo de vida, recuperação e concorrência da V4. |
| `tests/cron-sweeper-simulation.test.mjs` | `tests/cron-sweeper-simulation.test.mjs` | **Atualizado (V4)** | 70 testes simulados cobrindo retry auditável, sweeper e RPCs. |
| `tests/test-upload-suite.mjs` | `tests/test-upload-suite.mjs` | **Existente** | Suíte de testes de upload de briefings (22 testes). |
| `tests/test-e2e-handler.mjs` | `tests/test-e2e-handler.mjs` | **Existente** | Testes ponta a ponta dos handlers serverless. |
| `vercel.json` | `vercel.json` | **Preservado** | Configuração de rotas e cron triggers na Vercel. |
| `README-INTEGRACAO.md` | `README-INTEGRACAO.md` | **Atualizado** | Documentação técnica completa da V4. |
| `MANIFESTO-ENTREGA.txt` | `MANIFESTO-ENTREGA.txt` | **Atualizado** | Manifesto com hashes SHA-256 e tamanhos exatos. |

---

## 3. Resultados dos Testes Automatizados Locais

Todas as suítes foram executadas e aprovadas com código de saída 0:

1. **Suíte de Regressão V4 (`tests/quarantine-security-regression.test.mjs`):**
   - **49 testes executados / 49 aprovados (100% de sucesso)**
   - Cenários cobertos:
     - Descarte administrativo iniciado com 10 ou mais tentativas.
     - Rejeição de descarte fora da quarentena (< 10 tentativas).
     - Ordem estrita entre banco e Storage.
     - Falha física no Storage preservando `pending_dismiss_justification` e contador histórico.
     - Falha de confirmação não marcando falso sucesso `DELETED`.
     - Expiração de reserva (lease timeout) e rejeição com `LEASE_EXPIRED`.
     - Rejeição estrita de token antigo / defasado com `LEASE_MISMATCH`.
     - Retomada pelo Cron de registros com `cleanup_attempts >= 10` e justificativa pendente.
     - Recuperação pelo Cron de arquivos já ausentes no Storage sem nova tentativa de exclusão física.
     - Concorrência segura e bloqueio atômico de workers simultâneos (`LEASE_ACTIVE`).
     - Idempotência e rejeição com `ALREADY_DELETED` em registros já resolvidos.
     - Preservação auditável do contador no retry manual (`admin_retry_requested_at`).
     - Exclusão de registros `DELETED` nas consultas e métricas do Cron.
     - Proteção de sessão administrativa, CSRF e acesso exclusivo de `service_role`.

2. **Suíte do Sweeper e RPCs (`tests/cron-sweeper-simulation.test.mjs`):**
   - **70 testes executados / 70 aprovados (100% de sucesso)**

3. **Suíte de Uploads de Briefings (`tests/test-upload-suite.mjs`):**
   - **22 testes executados / 22 aprovados (100% de sucesso)**

4. **Verificação de Tipos TypeScript (`npx tsc --noEmit`):**
   - **0 erros encontrados (Código 0)**

5. **Build de Produção (`npm run build`):**
   - **Sucesso em 1.05s**
