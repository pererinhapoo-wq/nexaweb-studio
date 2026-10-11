# Guia de Integração: Correção de Segurança dos Anexos em Quarentena (NexaWeb V3)

Este documento descreve as correções pontuais implementadas para a segurança e consistência dos anexos em quarentena no NexaWeb, cobrindo descarte atômico em duas fases com lease, exclusão de registros resolvidos (`DELETED`) das consultas e métricas, validação estrita de estados nas RPCs de Retry e Descarte, e a nova suíte de testes de regressão automatizados.

> **IMPORTANTE:** Nenhuma instrução SQL foi executada no banco de dados e nenhuma conexão externa foi aberta com o Supabase. O script SQL original foi preservado intacto. A aplicação destas alterações em homologação/produção deve seguir a ordem deste guia.

---

## 1. Problemas Identificados e Soluções Implementadas

### 1.1 Descarte e Consistência entre Banco e Storage
* **Problema anterior:** A exclusão física no Storage ocorria antes de a operação ser validada e registrada de forma atômica no banco de dados. Se o banco falhasse ou ocorresse concorrência, o arquivo era apagado sem registro consistente.
* **Correção:** Estabeleceu-se um fluxo de **duas fases atômicas com lease de operação**:
  1. **Fase 1 (Claim Atômico):** A RPC `admin_dismiss_quarantined_attachment` valida existência, permissões, justificativa (mínimo 5 caracteres), estado (`DELETION_FAILED`, `DELETING` ou `PENDING`) e ausência de lease ativo com bloqueio `FOR UPDATE`. O registro transiciona para `DELETING`, recebe um `cleanup_lease_token` (UUID) e um lease temporal de 120 segundos.
  2. **Fase 2 (Remoção Física no Storage):** Somente após o claim ser confirmado no banco, o arquivo é removido do bucket `nexaweb-vault`.
  3. **Tratamento de Falha no Storage:** Se a remoção física falhar, o lease é liberado com segurança via `record_attachment_cleanup_failure`, o item retorna a `DELETION_FAILED` com o erro registrado e HTTP 500 é retornado ao administrador. O item permanece em quarentena para recuperação.
  4. **Fase 3 (Confirmação Atômica):** A RPC `admin_dismiss_quarantined_attachment` é chamada com o `p_lease_token`. Apenas se o lease ativo coincidir e estiver vigente, o registro transiciona para `DELETED`, preenche `quarantine_resolved_at = now()`, grava a justificativa auditada e limpa o token. Se a confirmação falhar, o sistema informa o erro e não reporta falso sucesso.

### 1.2 Consulta de Quarentena
* **Problema anterior:** Registros com `cleanup_attempts >= 10` que já haviam sido dispensados ou excluídos (`state = 'DELETED'`) continuavam aparecendo na lista de quarentena administrativa.
* **Correção:**
  - A RPC `get_quarantined_attachments` agora inclui explicitamente `WHERE cleanup_attempts >= coalesce(p_min_attempts, 10) AND state != 'DELETED' AND quarantine_resolved_at IS NULL`.
  - A consulta alternativa (fallback) em `api/admin-projects.ts` foi sincronizada: `.neq('state', 'DELETED').is('quarantine_resolved_at', null).gte('cleanup_attempts', 10)`.
  - A consulta alternativa em `api/cron-cleanup-attachments.ts` foi padronizada com os mesmos filtros.

### 1.3 Validação das RPCs de Retry e Descarte
* **RPCs Reais Existentes no Projeto:**
  - `admin_retry_quarantined_attachment(p_attachment_id uuid)`
  - `admin_dismiss_quarantined_attachment(p_attachment_id uuid, p_justification text, p_lease_token uuid default null)`
* **Correções Implementadas:**
  - **Rejeição de `DELETED`:** Ambas as RPCs rejeitam imediatamente registros já excluídos com o código explícito `ALREADY_DELETED`.
  - **Validação de Estados Inválidos:** Registros que não estejam em estado compatível com quarentena (ex: `READY`) são rejeitados com `INVALID_STATE`.
  - **Bloqueio Concorrente (`FOR UPDATE`):** Ambas as RPCs utilizam `FOR UPDATE` e verificam `cleanup_lease_expires_at > now()`, retornando `LEASE_ACTIVE` em caso de concorrência com workers do Sweeper ou outros administradores.
  - **Retornos Explícitos Padronizados:**
    - Sucesso: `status: 'QUEUED_FOR_RETRY'`, `status: 'CLAIMED_FOR_DISMISS'`, `status: 'DISMISSED'`
    - Falha: `ATTACHMENT_NOT_FOUND`, `ALREADY_DELETED`, `INVALID_STATE`, `NOT_IN_QUARANTINE`, `LEASE_ACTIVE`, `JUSTIFICATION_REQUIRED`, `LEASE_EXPIRED`, `LEASE_MISMATCH`.

### 1.4 Métricas do Cron e Consultas Alternativas
* **Problema anterior:** A contagem total de quarentena calculada em `api/cron-cleanup-attachments.ts` contabilizava todos os registros com `cleanup_attempts >= 10`, incluindo itens já resolvidos como `DELETED`.
* **Correção:**
  - A métrica `quarantinedCount` agora utiliza estritamente `.neq('state', 'DELETED').is('quarantine_resolved_at', null).gte('cleanup_attempts', 10)`.
  - Mantém preservada a regra estrita de quarentena a partir da 10ª tentativa.

---

## 2. Inventário de Arquivos do Pacote

| Arquivo | Caminho no Repositório | Estado | Descrição |
| :--- | :--- | :--- | :--- |
| `MIGRACAO_UPLOADS_PENDENTE.sql` | `MIGRACAO_UPLOADS_PENDENTE.sql` | **Preservado Intacto** | Migração SQL original preservada sem alterações. |
| `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` | `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` | **Novo (Revisado V3)** | Script SQL contendo apenas as correções de quarentena, retry e descarte atômico com lease em duas fases. |
| `api/admin-projects.ts` | `api/admin-projects.ts` | **Corrigido** | Fluxo atômico de descarte (Fase 1 Claim -> Storage -> Fase 2 Confirm), tratamento de erros e fallback de quarentena sem `DELETED`. |
| `api/cron-cleanup-attachments.ts` | `api/cron-cleanup-attachments.ts` | **Corrigido** | Métricas e consultas de quarentena excluindo registros `DELETED` e resolvidos, mantendo consistência com o banco. |
| `tests/quarantine-security-regression.test.mjs` | `tests/quarantine-security-regression.test.mjs` | **Novo** | Suíte cobrindo especificamente os 10 cenários obrigatórios de segurança de quarentena (24 asserções). |
| `tests/cron-sweeper-simulation.test.mjs` | `tests/cron-sweeper-simulation.test.mjs` | **Atualizado** | Suíte completa com 69 testes simulados cobrindo fluxo atômico de duas fases, leases, CSRF e sweeper. |
| `tests/test-upload-suite.mjs` | `tests/test-upload-suite.mjs` | **Existente** | Suíte de testes do upload de briefings (22 testes). |
| `tests/test-e2e-handler.mjs` | `tests/test-e2e-handler.mjs` | **Existente** | Testes ponta a ponta dos handlers serverless. |
| `README-INTEGRACAO.md` | `README-INTEGRACAO.md` | **Atualizado** | Documentação técnica, comandos de validação e limitações. |
| `MANIFESTO-ENTREGA.txt` | `MANIFESTO-ENTREGA.txt` | **Atualizado** | Manifesto com SHA-256 e tamanho em bytes de cada arquivo. |

---

## 3. Comandos Executados e Resultados Reais de Validação

Todas as verificações foram executadas localmente e aprovadas com código de saída 0:

### 3.1 Suíte de Regressão Obrigatória de Quarentena (10 Cenários)
* **Comando:** `node tests/quarantine-security-regression.test.mjs`
* **Resultado:** 24 testes executados, 24 aprovados, 0 falhas (100% de sucesso).
* **Cenários Cobertos:**
  1. Arquivo não é removido do Storage se a validação/transição inicial for rejeitada.
  2. Transição validada no banco (Fase 1 Claim) precede estritamente a exclusão física no Storage.
  3. Falha no Storage reverte lease para `DELETION_FAILED` e não produz falso sucesso no banco.
  4. Falha na confirmação (Fase 3) não é apresentada como sucesso e não marca `DELETED`.
  5. Registros `DELETED` e resolvidos são estritamente excluídos da RPC `get_quarantined_attachments`.
  6. A consulta alternativa (fallback) não inclui registros `DELETED` ou com `quarantine_resolved_at`.
  7. As métricas do cron excluem anexos `DELETED` e contam apenas pendentes elegíveis.
  8. Retry em registro `DELETED` é rejeitado com `ALREADY_DELETED`.
  9. Retry em registro `READY` é rejeitado com `INVALID_STATE`.
  10. Retry em registro com menos de 10 tentativas é rejeitado com `NOT_IN_QUARANTINE`.
  11. Descarte repetido de registro já resolvido como `DELETED` é rejeitado com `ALREADY_DELETED`.
  12. Operações concorrentes (Retry e Dismiss simultâneos) são bloqueadas com `LEASE_ACTIVE`.
  13. Proteção CSRF e autorização de sessão administrativa validadas.
  14. Permissões de execução de todas as RPCs restritas exclusivamente a `service_role`.

### 3.2 Suíte de Simulação do Sweeper e RPCs
* **Comando:** `node tests/cron-sweeper-simulation.test.mjs`
* **Resultado:** 69 testes executados, 69 aprovados, 0 falhas.

### 3.3 Suíte de Upload de Briefings
* **Comando:** `node tests/test-upload-suite.mjs`
* **Resultado:** 22 testes executados, 22 aprovados, 0 falhas.

### 3.4 Checagem Estática de Tipos TypeScript
* **Comando:** `npx tsc --noEmit`
* **Resultado:** 0 erros de tipagem, compilação estática bem-sucedida.

### 3.5 Build de Produção
* **Comando:** `npm run build`
* **Resultado:** Build concluído com sucesso em 1.06s gerando todos os assets estáticos em `dist/`.

---

## 4. Limitações e Orientações para Implantação

1. **Ambiente Local:** Todos os testes foram executados contra mocks em memória e simulações locais. Nenhuma alteração foi realizada em instâncias reais de produção ou banco Supabase ativo.
2. **Execução SQL em Produção:** Para aplicar a nova migração revisada, execute o arquivo `MIGRACAO_UPLOADS_QUARENTENA_V3.sql` no SQL Editor do painel Supabase utilizando a role administrativa (`postgres` / `service_role`).
3. **Bucket Privado:** Nenhuma alteração foi necessária no bucket privado `nexaweb-vault`, mantendo-se estritamente privado com TTL máximo de 60 segundos para URLs assinadas administrativas.
