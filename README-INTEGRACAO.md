# Guia de Integração: Arquitetura de Segurança de Uploads e Limpeza (NexaWeb)

Este pacote contém todos os arquivos novos e modificados que compõem a solução auditada e corrigida de segurança de uploads, isolamento de buckets, proteção contra CSRF e rotina automática de limpeza (Sweeper) com quarentena para a plataforma NexaWeb.

> **IMPORTANTE:** Nenhuma instrução SQL foi executada no banco de produção e nenhum deploy ou publicação foi realizado. Siga as instruções abaixo de forma sequencial em ambiente de staging antes da promoção definitiva.

---

## 1. Lista Completa dos Arquivos Incluídos e Destinos no Projeto

| Arquivo no Pacote | Caminho de Destino no Projeto Principal | Natureza | Função Principal |
| :--- | :--- | :--- | :--- |
| `MIGRACAO_UPLOADS_PENDENTE.sql` | `MIGRACAO_UPLOADS_PENDENTE.sql` (ou Supabase SQL Editor) | **Novo** | Script transacional (`BEGIN; ... COMMIT;`) contendo criação e verificação estrita dos buckets (`nexaweb-vault` e `nexaweb-public`), tabela `public.project_attachments` (com `reservation_expires_at` anulável), RLS restrito a `service_role` e 7 RPCs atômicas com `SECURITY DEFINER`. |
| `api/cron-cleanup-attachments.ts` | `api/cron-cleanup-attachments.ts` | **Novo** | Endpoint serverless da rotina de limpeza agendada (Sweeper). Autenticação via `CRON_SECRET` com `timingSafeEqual`, proteção estrita contra CSRF em disparos manuais, leases concorrentes via `SKIP LOCKED`, verificação de quarentena e diferenciação de falhas (`DELETION_FAILED_UNRECORDED`, `DELETION_FAILED`, `CONFIRMATION_FAILED`, `DELETED`). |
| `api/upload-briefing.ts` | `api/upload-briefing.ts` | **Modificado** | Processamento multipart de upload com validação antecipada de `NEXAWEB_UPLOAD_TICKET_SECRET` (retorna HTTP 500 explícito quando ausente), validação HMAC do ticket sem consumo de stream, descarte imediato ao exceder 15 MiB (`stream.resume()`), bifurcação segura entre imagens públicas (`nexaweb-public`) e briefings privados (`nexaweb-vault`), além de verificação ativa no Storage para nunca gravar `DELETED` sem confirmação de remoção. |
| `api/create-briefing.ts` | `api/create-briefing.ts` | **Modificado** | Emissão do ticket criptográfico temporário (`uploadTicket`, HMAC-SHA256, expiração de 15 min) vinculado ao `projectId` recém-criado, com diagnóstico claro se `NEXAWEB_UPLOAD_TICKET_SECRET` não estiver definida. |
| `src/components/ContactModal.tsx` | `src/components/ContactModal.tsx` | **Modificado** | Frontend do formulário de briefing: recebe `uploadTicket` gerado por `create-briefing` e o repassa no cabeçalho `x-nexaweb-upload-ticket` durante o envio dos anexos. |
| `src/components/AdminDashboard.tsx` | `src/components/AdminDashboard.tsx` | **Modificado** | Painel administrativo: upload de imagens de portfólio direcionado para `nexaweb-public` (URLs públicas permanentes sem expiração), visualizador de briefings com URLs assinadas temporárias para `nexaweb-vault`, botão para disparo manual seguro do Sweeper com cabeçalho anti-CSRF e painel de revisão de anexos em quarentena. |
| `vercel.json` | `vercel.json` | **Modificado** | Configuração do agendador nativo da Vercel (`crons`) apontando para `/api/cron-cleanup-attachments` em frequência horária (`0 * * * *`). |
| `.env.example` | `.env.example` | **Modificado** | Documentação de referência contendo todas as variáveis necessárias para a aplicação e infraestrutura. |
| `tests/cron-sweeper-simulation.test.mjs` | `tests/cron-sweeper-simulation.test.mjs` | **Novo** | Suíte de testes unitários simulados em memória (27 cenários de validação da máquina de estados, leases, timingSafeEqual, quarentena, CSRF e tolerância a falhas). |

---

## 2. Nomes Reais de Tabelas, Funções, Estados e Variáveis

### 2.1 Tabela de Controle: `public.project_attachments`

| Coluna | Tipo | Restrições | Finalidade |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identificador único do anexo. |
| `project_id` | `uuid` | NOT NULL, REFERENCES `public.projects(id)` ON DELETE CASCADE | Projeto proprietário do anexo. |
| `storage_path` | `text` | NOT NULL, UNIQUE | Caminho seguro no bucket (`briefings/{project_id}/{uuid}.{ext}`). |
| `mime_type` | `text` | NOT NULL, CHECK in (`image/jpeg`, `image/png`, `image/webp`) | Tipo MIME estritamente validado. |
| `size_bytes` | `bigint` | NOT NULL, CHECK (`> 0` AND `<= 15728640`) | Tamanho do arquivo em bytes (máx 15 MiB). |
| `state` | `text` | NOT NULL, DEFAULT `'PENDING'`, CHECK in (`PENDING`, `READY`, `DELETING`, `DELETED`, `DELETION_FAILED`) | Estado atual no ciclo de vida do anexo. |
| `reservation_expires_at` | `timestamptz` | DEFAULT `(now() + interval '20 minutes')` (Anulável) | Prazo limite da reserva temporária. Torna-se `NULL` após confirmação em `READY`. |
| `cleanup_attempts` | `integer` | NOT NULL, DEFAULT `0`, CHECK (`>= 0`) | Contador de tentativas de exclusão falhadas. Limite de quarentena: `>= 10`. |
| `cleanup_lease_token` | `uuid` | Anulável | Token de exclusividade concedido ao worker do Sweeper. |
| `cleanup_lease_expires_at` | `timestamptz` | Anulável | Prazo de expiração do lease (2 minutos). |
| `last_cleanup_error` | `text` | Anulável | Detalhes do último erro registrado pelo Storage ou banco. |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Data de criação da reserva. |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Data da última atualização de estado. |

### 2.2 Estados e Ciclo de Vida (`state`)

1. **`PENDING`**: Reserva criada no banco aguardando o upload físico dos bytes e confirmação final. Consome cota ativa enquanto `reservation_expires_at > now()`.
2. **`READY`**: Upload concluído com sucesso e confirmado de forma idempotente via `finish_project_attachment`. O campo `reservation_expires_at` é anulado (`NULL`).
3. **`DELETING`**: Registro reivindicado atômica e concorrentemente pelo Sweeper via `claim_attachments_for_cleanup` com `SKIP LOCKED` e `lease_token` ativo por 2 minutos.
4. **`DELETED`**: Remoção física confirmada no Supabase Storage e registrada no banco via `confirm_attachment_deleted` (ou cancelamento imediato verificado). Liberado da cota ativa.
5. **`DELETION_FAILED`**: Falha na remoção física do Storage ou durante o cancelamento imediato. O contador `cleanup_attempts` é incrementado. Caso atinja `>= 10`, entra em **Quarentena** e não é mais reivindicado automaticamente, ficando disponível para revisão administrativa.

### 2.3 Lista Completa das 7 Funções RPC (com `SECURITY DEFINER` e restrição a `service_role`)

1. `reserve_project_attachment(p_project_id uuid, p_storage_path text, p_mime_type text, p_size_bytes bigint) RETURNS jsonb`: Reserva atômica com bloqueio `FOR UPDATE` no projeto, validação de limite de 5 arquivos e 50 MiB cumulativos por projeto.
2. `finish_project_attachment(p_attachment_id uuid) RETURNS jsonb`: Confirmação idempotente do anexo: valida reserva vigente, transiciona para `READY` e anula `reservation_expires_at`.
3. `release_project_attachment(p_attachment_id uuid, p_reason text, p_failed_storage boolean) RETURNS jsonb`: Liberação de reserva em caso de falha imediata. Se `p_failed_storage = true`, transiciona para `DELETION_FAILED`; se `false`, para `DELETED`.
4. `claim_attachments_for_cleanup(p_batch_size integer, p_lease_seconds integer) RETURNS TABLE(...)`: Reivindicação segura de lotes de arquivos para exclusão (`PENDING` expirados ou `DELETION_FAILED` com `cleanup_attempts < 10`), aplicando `SKIP LOCKED`.
5. `confirm_attachment_deleted(p_attachment_id uuid, p_lease_token uuid) RETURNS jsonb`: Confirmação definitiva de remoção física no Storage validando a posse e validade temporal do `lease_token`. Transiciona para `DELETED`.
6. `record_attachment_cleanup_failure(p_attachment_id uuid, p_lease_token uuid, p_error text) RETURNS jsonb`: Registra falha de exclusão física, incrementa `cleanup_attempts` e sinaliza se o anexo atingiu quarentena (`quarantined: true` para `>= 10`).
7. `get_quarantined_attachments(p_min_attempts integer, p_limit integer) RETURNS TABLE(...)`: Consulta segura para administradores auditarem anexos que falharam repetidamente e requerem intervenção manual.

### 2.4 Variáveis de Ambiente Necessárias

| Variável | Escopo | Obrigatória? | Finalidade |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Server-side (Vercel) | **Sim** | URL base do projeto Supabase para as funções serverless. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side (Vercel) | **Sim (Crítica)** | Chave de serviço (`service_role`) com privilégios de bypass de RLS e execução das 7 RPCs restritas. **Nunca exponha no cliente.** |
| `NEXAWEB_UPLOAD_TICKET_SECRET` | Server-side (Vercel) | **Sim (Crítica)** | Segredo criptográfico de alta entropia (mínimo 32 caracteres) usado para assinar e validar os tokens HMAC de upload temporário entre `create-briefing` e `upload-briefing`. |
| `CRON_SECRET` | Server-side (Vercel) | **Sim (Crítica)** | Segredo compartilhado (mínimo 16 caracteres) exigido pelo Vercel Cron. A Vercel transmite este valor no cabeçalho `Authorization: Bearer <CRON_SECRET>` em cada disparo agendado. |
| `VITE_SUPABASE_URL` | Client-side (Vite) | **Sim** | URL pública do Supabase consumida pelo frontend. |
| `VITE_SUPABASE_ANON_KEY` | Client-side (Vite) | **Sim** | Chave anônima pública do Supabase (`anon key`). |
| `NEXAWEB_ADMIN_PASSWORD` | Server-side (Vercel) | **Sim** | Senha de login do painel administrativo NexaWeb. |
| `NEXAWEB_ADMIN_SESSION_SECRET` | Server-side (Vercel) | **Sim** | Segredo para assinatura de cookies da sessão administrativa. |

---

## 3. Autorização e Proteção Anti-CSRF no Endpoint `api/cron-cleanup-attachments.ts`

O endpoint foi arquitetado com separação estrita de vetores de chamada:

1. **Disparo Agendado (Vercel Cron):**
   * Chamada automática via método `GET` (ou `POST`).
   * Requer obrigatoriamente o cabeçalho `Authorization: Bearer <CRON_SECRET>`.
   * A validação do token é feita em tempo constante (`crypto.timingSafeEqual`) para prevenir ataques de temporização (timing attacks).
2. **Disparo Manual pelo Administrador (Painel `/admin`):**
   * Requer método `POST`. Chamadas `GET` com cookies administrativos são sumariamente bloqueadas com `HTTP 401`, impedindo que atacantes forjem limpezas em segundo plano via tags `<img src="...">`, `<iframe>` ou links clicáveis (CSRF).
   * Valida a sessão administrativa e exige cabeçalho seguro (`Sec-Fetch-Site: same-origin` ou `X-Requested-With: XMLHttpRequest` / `X-Admin-Action: cleanup-attachments`), inviabilizando requisições maliciosas cross-origin.
3. **Consulta de Quarentena (`?action=quarantine`):**
   * Permite que o administrador consulte a lista de arquivos com `>= 10` falhas de limpeza sem disparar exclusões.

---

## 4. Ordem de Integração e Validação em Staging

Para garantir que a integração ocorra de maneira segura e sem períodos de instabilidade, siga estritamente a ordem abaixo:

### Passo 1: Configuração das Variáveis de Ambiente
1. Defina `NEXAWEB_UPLOAD_TICKET_SECRET` e `CRON_SECRET` nas variáveis de ambiente da Vercel (ou ambiente de staging).
2. Certifique-se de que `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` estejam preenchidas.

### Passo 2: Execução da Migração SQL no Supabase
1. Abra o painel do Supabase no ambiente de staging e acesse a aba **SQL Editor**.
2. Cole o conteúdo de `MIGRACAO_UPLOADS_PENDENTE.sql`.
3. Execute o script.
   * **Se os buckets `nexaweb-vault` ou `nexaweb-public` já existirem:** o script validará se as visibilidades são compatíveis. Se houver divergência (ex: `nexaweb-vault` como público), a transação emitirá um `raise exception` e fará rollback automático de 100% das alterações.
   * Caso a execução seja bem-sucedida, a mensagem de sucesso do PostgreSQL confirmará a criação da tabela `project_attachments`, das políticas RLS e das 7 RPCs.

### Passo 3: Aplicação dos Arquivos no Projeto Principal
Copie os arquivos deste pacote para os seus respectivos destinos no repositório:
```bash
cp api/cron-cleanup-attachments.ts api/
cp api/upload-briefing.ts api/
cp api/create-briefing.ts api/
cp src/components/ContactModal.tsx src/components/
cp src/components/AdminDashboard.tsx src/components/
cp vercel.json ./
cp .env.example ./
mkdir -p tests && cp tests/cron-sweeper-simulation.test.mjs tests/
```

### Passo 4: Verificação Local de Compilação e Testes
Execute no projeto:
```bash
node tests/cron-sweeper-simulation.test.mjs
npm run lint   # tsc --noEmit
npm run build  # vite build
```
Certifique-se de que todos os comandos finalizem com código de saída 0.

### Passo 5: Deploy em Ambiente de Staging
Realize o deploy na Vercel e acompanhe os logs de inicialização.

---

## 5. Testes que Devem ser Realizados com Supabase e Vercel Reais

Os 27 testes do arquivo `tests/cron-sweeper-simulation.test.mjs` validam a lógica e a máquina de estados através de mocks isolados em memória. Ao subir para staging, execute os seguintes testes de integração real:

1. **Validação do Cron via Vercel CLI / Curl:**
   * Requisição sem cabeçalho `Authorization`: deve retornar `HTTP 401`.
   * Requisição com `Authorization: Bearer token_invalido`: deve retornar `HTTP 401`.
   * Requisição com cabeçalho spoofed `x-vercel-cron: 1` sem secret: deve retornar `HTTP 401`.
   * Requisição `GET` com cookie de administrador mas sem secret: deve retornar `HTTP 401` (proteção CSRF).
   * Requisição `POST` com cookie de administrador e `X-Requested-With: XMLHttpRequest`: deve retornar `HTTP 200`.
   * Requisição com `Authorization: Bearer <CRON_SECRET_REAL>`: deve retornar `HTTP 200` com JSON indicando itens processados e total em quarentena.
2. **Ciclo Completo de Upload de Briefing (Cliente):**
   * Submeter um briefing com imagem válida (<= 15 MiB): deve gerar `uploadTicket`, reservar no banco (`PENDING`), gravar no bucket `nexaweb-vault` e confirmar (`READY`), com `reservation_expires_at` anulado.
   * Submeter arquivo > 15 MiB: deve ser rejeitado com `HTTP 413` sem sobrecarregar a memória RAM do servidor.
   * Tentativa de upload com ticket vencido (> 15 min) ou adulterado: deve retornar `HTTP 401`.
   * Ausência da variável `NEXAWEB_UPLOAD_TICKET_SECRET` no servidor: deve retornar `HTTP 500` com diagnóstico explicativo.
3. **Upload Administrativo (Portfólio):**
   * Realizar upload no painel `/admin`: a imagem deve ser gravada no bucket `nexaweb-public`, retornando URL pública permanente que carrega diretamente no navegador sem autenticação e sem prazo de expiração.
4. **Varredura Real de Arquivos Órfãos (Sweeper):**
   * Simular reserva abandonada (arquivo em `PENDING` com `reservation_expires_at` vencido).
   * Disparar o endpoint do cron: verificar se o arquivo é removido do `nexaweb-vault` e o registro passa para `DELETED`.
5. **Auditoria de Quarentena:**
   * Simular anexo com falha persistente de remoção (`cleanup_attempts = 10`): verificar se não é mais reivindicado pelo Sweeper e aparece na listagem de quarentena do painel `/admin`.
