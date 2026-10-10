# Guia de Integração: Arquitetura de Segurança de Uploads e Limpeza (NexaWeb)

Este pacote contém todos os arquivos novos e modificados que compõem a solução auditada de segurança de uploads, isolamento de buckets e rotina automática de limpeza (Sweeper) para a plataforma NexaWeb.

> **IMPORTANTE:** Nenhuma instrução SQL foi executada no banco de produção e nenhum arquivo foi aplicado automaticamente ao projeto principal. Siga as instruções abaixo de forma sequencial em ambiente de staging antes da promoção para produção.

---

## 1. Lista Completa dos Arquivos Incluídos e Destinos no Projeto

| Arquivo no Pacote | Caminho de Destino no Projeto Principal | Natureza | Função Principal |
| :--- | :--- | :--- | :--- |
| `MIGRACAO_UPLOADS_PENDENTE.sql` | `MIGRACAO_UPLOADS_PENDENTE.sql` (ou Supabase SQL Editor) | **Novo** | Script transacional (`BEGIN; ... COMMIT;`) contendo criação e verificação estrita dos buckets (`nexaweb-vault` e `nexaweb-public`), tabela `project_attachments`, RLS restrito a `service_role` e 6 RPCs atômicas com `SECURITY DEFINER`. |
| `api/cron-cleanup-attachments.ts` | `api/cron-cleanup-attachments.ts` | **Novo** | Endpoint serverless da rotina de limpeza agendada (Sweeper). Autenticação via `CRON_SECRET` com `timingSafeEqual`, leases concorrentes via `SKIP LOCKED`, diferenciação estrita de falhas de Storage vs banco (`DELETION_FAILED_UNRECORDED`, `DELETION_FAILED`, `CONFIRMATION_FAILED`, `DELETED`). |
| `api/upload-briefing.ts` | `api/upload-briefing.ts` | **Modificado** | Processamento multipart de upload com validação antecipada de HMAC sem consumo de stream, descarte imediato ao exceder 15 MiB (`stream.resume()`), bifurcação segura entre imagens públicas administrativas (`nexaweb-public`) e briefings privados (`nexaweb-vault`) com reserva transacional. |
| `api/create-briefing.ts` | `api/create-briefing.ts` | **Modificado** | Emissão do ticket criptográfico temporário (`uploadTicket`, HMAC-SHA256, expiração de 15 min) vinculado ao `projectId` recém-criado. |
| `src/components/ContactModal.tsx` | `src/components/ContactModal.tsx` | **Modificado** | Frontend do formulário de contratação: recebe `uploadTicket` do briefing e o repassa no cabeçalho `x-nexaweb-upload-ticket` durante o envio dos anexos. |
| `src/components/AdminDashboard.tsx` | `src/components/AdminDashboard.tsx` | **Modificado** | Painel administrativo: upload de imagens de portfólio direcionado para `nexaweb-public`, persistindo URLs públicas permanentes sem depender de URLs assinadas com prazo de expiração. |
| `vercel.json` | `vercel.json` | **Modificado** | Configuração do agendador nativo da Vercel (`crons`) apontando para `/api/cron-cleanup-attachments` em frequência horária (`0 * * * *`). |
| `.env.example` | `.env.example` | **Modificado** | Documentação de referência contendo todas as variáveis necessárias para a aplicação e infraestrutura. |
| `tests/cron-sweeper-simulation.test.mjs` | `tests/cron-sweeper-simulation.test.mjs` | **Novo** | Suíte de testes unitários simulados em memória (15 cenários de validação da máquina de estados, leases, timingSafeEqual e tolerância a falhas). |

---

## 2. Variáveis de Ambiente Necessárias (Sem Valores Secretos)

Configure as seguintes variáveis no painel da **Vercel** (Settings > Environment Variables) e no arquivo local `.env` de desenvolvimento:

| Variável | Escopo | Obrigatória? | Finalidade |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Server-side (Vercel) | **Sim** | URL base do projeto Supabase para as funções serverless. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side (Vercel) | **Sim (Crítica)** | Chave de serviço (`service_role`) com privilégios de bypass de RLS e execução das RPCs restritas. **Nunca exponha no cliente.** |
| `NEXAWEB_UPLOAD_TICKET_SECRET` | Server-side (Vercel) | **Sim (Crítica)** | Segredo criptográfico de alta entropia (mínimo 32 caracteres hex/base64) usado para assinar e validar os tokens HMAC de upload temporário entre `create-briefing` e `upload-briefing`. |
| `CRON_SECRET` | Server-side (Vercel) | **Sim (Crítica)** | Segredo compartilhado (mínimo 16 caracteres) exigido pelo Vercel Cron. A Vercel transmite este valor no cabeçalho `Authorization: Bearer <CRON_SECRET>` em cada disparo agendado. |
| `VITE_SUPABASE_URL` | Client-side (Vite) | **Sim** | URL pública do Supabase consumida pelo frontend. |
| `VITE_SUPABASE_ANON_KEY` | Client-side (Vite) | **Sim** | Chave anônima pública do Supabase (`anon key`). |
| `NEXAWEB_ADMIN_PASSWORD` | Server-side (Vercel) | **Sim** | Senha do painel administrativo NexaWeb. |
| `NEXAWEB_ADMIN_SESSION_SECRET` | Server-side (Vercel) | **Sim** | Segredo para assinatura de cookies da sessão administrativa. |

---

## 3. Ordem de Integração e Validação em Staging

Para garantir que a integração ocorra de maneira segura e sem períodos de instabilidade, siga estritamente a ordem abaixo:

### Passo 1: Configuração das Variáveis de Ambiente
1. Defina `NEXAWEB_UPLOAD_TICKET_SECRET` e `CRON_SECRET` nas variáveis de ambiente da Vercel (ou ambiente de staging).
2. Certifique-se de que `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` estejam preenchidas.

### Passo 2: Execução da Migração SQL no Supabase
1. Abra o painel do Supabase no ambiente de staging/produção e acerte a aba **SQL Editor**.
2. Cole o conteúdo de `MIGRACAO_UPLOADS_PENDENTE.sql`.
3. Execute o script.
   * **Se os buckets `nexaweb-vault` ou `nexaweb-public` já existirem:** o script validará se as visibilidades são compatíveis. Se houver divergência (ex: `nexaweb-vault` como público), a transação emitirá um `raise exception` e fará rollback automático de 100% das alterações.
   * Caso a execução seja bem-sucedida, a mensagem de sucesso do PostgreSQL confirmará a criação da tabela `project_attachments`, das políticas RLS e das 6 RPCs.

### Passo 3: Aplicação dos Arquivos no Projeto Principal
Copie os arquivos deste pacote para os seus respectivos destinos no repositório:
```bash
cp ENTREGA_UPLOADS_NEXAWEB/api/cron-cleanup-attachments.ts api/
cp ENTREGA_UPLOADS_NEXAWEB/api/upload-briefing.ts api/
cp ENTREGA_UPLOADS_NEXAWEB/api/create-briefing.ts api/
cp ENTREGA_UPLOADS_NEXAWEB/src/components/ContactModal.tsx src/components/
cp ENTREGA_UPLOADS_NEXAWEB/src/components/AdminDashboard.tsx src/components/
cp ENTREGA_UPLOADS_NEXAWEB/vercel.json ./
cp ENTREGA_UPLOADS_NEXAWEB/.env.example ./
mkdir -p tests && cp ENTREGA_UPLOADS_NEXAWEB/tests/cron-sweeper-simulation.test.mjs tests/
```

### Passo 4: Verificação Local de Compilação
Execute no projeto principal:
```bash
npm run lint   # tsc --noEmit
npm run build  # vite build
```
Certifique-se de que ambos os comandos finalizem com código de saída 0.

### Passo 5: Deploy em Ambiente de Staging
Realize o deploy na Vercel e acompanhe os logs de inicialização.

---

## 4. Testes que Devem ser Realizados com Supabase e Vercel Reais

Os 15 testes do arquivo `tests/cron-sweeper-simulation.test.mjs` validam a lógica e a máquina de estados através de mocks isolados em memória. Ao subir para staging, execute os seguintes testes de integração real:

1. **Validação do Cron via Vercel CLI / Curl:**
   * Requisição sem cabeçalho `Authorization`: deve retornar `HTTP 401`.
   * Requisição com `Authorization: Bearer token_invalido`: deve retornar `HTTP 401`.
   * Requisição com cabeçalho spoofed `x-vercel-cron: 1` sem secret: deve retornar `HTTP 401`.
   * Requisição com `Authorization: Bearer <CRON_SECRET_REAL>`: deve retornar `HTTP 200` com JSON indicando itens processados.
2. **Ciclo Completo de Upload de Briefing (Cliente):**
   * Submeter um briefing com imagem válida (<= 15 MiB): deve gerar `uploadTicket`, reservar no banco (`PENDING`), gravar no bucket `nexaweb-vault` e confirmar (`READY`).
   * Submeter arquivo > 15 MiB: deve ser rejeitado com `HTTP 413` sem estouro de memória no servidor.
   * Tentativa de upload com ticket vencido (> 15 min) ou adulterado: deve retornar `HTTP 401`.
3. **Upload Administrativo (Portfólio):**
   * Realizar upload no painel `/admin`: a imagem deve ser gravada no bucket `nexaweb-public`, retornando URL pública permanente que carrega diretamente no navegador sem autenticação e sem prazo de expiração.
4. **Varredura Real de Arquivos Órfãos (Sweeper):**
   * Simular reserva abandonada (arquivo em `PENDING` com `reservation_expires_at` vencido).
   * Disparar o endpoint do cron: verificar se o arquivo é removido do `nexaweb-vault` e o registro passa para `DELETED`.

---

## 5. Avisos sobre Conflitos com Arquivos Existentes

1. **`vercel.json`:**
   * Se o projeto já possuir regras personalizadas de headers, rewrites ou redirects em `vercel.json`, certifique-se de mesclar o bloco `"crons"` em vez de sobrescrever o arquivo integralmente.
2. **`api/create-briefing.ts` e `src/components/ContactModal.tsx`:**
   * As alterações nesses arquivos introduzem o repasse do `uploadTicket`. Caso existam commits paralelos nessas áreas, preserve a geração do token HMAC e o envio do cabeçalho `x-nexaweb-upload-ticket`.
3. **Buckets no Supabase Storage:**
   * Se o bucket `nexaweb-vault` já existir no Supabase, confirme previamente se ele está configurado como **privado**. Se estiver público, altere-o manualmente no painel antes de rodar a migração para evitar o cancelamento transacional do script.
