-- ==============================================================================
-- NexaWeb: Migração de Arquitetura de Uploads, Isolamento de Buckets e Sweeper
-- ARQUIVO PENDENTE: NÃO EXECUTAR AUTOMATICAMENTE.
-- Este script deve ser revisado e executado manualmente no painel do Supabase
-- após a configuração das variáveis de ambiente na Vercel/servidor.
--
-- ATOMICIDADE TRANSACIONAL:
-- Todas as operações (DDL, índices padrão, políticas RLS, funções e permissões)
-- são totalmente transacionais no PostgreSQL. O script é envolvido por BEGIN/COMMIT
-- para garantir que qualquer erro ou interrupção (ex: raise exception por bucket
-- incompatível) reverta 100% das alterações sem deixar estados parciais.
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- PARTE 1: Configuração Segura e Transacional de Buckets no Storage
-- ------------------------------------------------------------------------------

do $$
declare
  v_vault_exists boolean;
  v_vault_public boolean;
  v_public_exists boolean;
  v_public_is_public boolean;
begin
  -- 1.1 Verificação estrita do bucket privado 'nexaweb-vault'
  select exists(select 1 from storage.buckets where id = 'nexaweb-vault'),
         coalesce((select public from storage.buckets where id = 'nexaweb-vault'), false)
    into v_vault_exists, v_vault_public;

  if v_vault_exists then
    if v_vault_public = true then
      raise exception 'MIGRAÇÃO ABORTADA: O bucket "nexaweb-vault" já existe configurado como PÚBLICO. Para proteger arquivos confidenciais de clientes, revise o bucket manualmente antes de prosseguir.';
    end if;
    -- Se já existe e é privado, preserva limites e MIME types existentes sem alteração silenciosa
  else
    -- Se não existe, cria com a configuração estritamente privada prevista
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'nexaweb-vault',
      'nexaweb-vault',
      false, -- ESTRITAMENTE PRIVADO: sem acesso anônimo
      15728640, -- 15 MiB
      array['image/jpeg', 'image/png', 'image/webp']
    );
  end if;

  -- 1.2 Verificação estrita do bucket público 'nexaweb-public'
  select exists(select 1 from storage.buckets where id = 'nexaweb-public'),
         coalesce((select public from storage.buckets where id = 'nexaweb-public'), false)
    into v_public_exists, v_public_is_public;

  if v_public_exists then
    if v_public_is_public = false then
      raise exception 'MIGRAÇÃO ABORTADA: O bucket "nexaweb-public" já existe configurado como PRIVADO. Para permitir exibição permanente do portfólio, revise o bucket manualmente antes de prosseguir.';
    end if;
    -- Se já existe e é público, preserva limites e MIME types existentes sem alteração silenciosa
  else
    -- Se não existe, cria com a configuração pública permanente prevista
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'nexaweb-public',
      'nexaweb-public',
      true, -- PÚBLICO: vitrine de portfólio permanente
      15728640, -- 15 MiB
      array['image/jpeg', 'image/png', 'image/webp']
    );
  end if;
end $$;

-- 1.3 Política RLS Idempotente e Escopada para 'nexaweb-public'
-- Permite leitura anônima estritamente para o prefixo 'admin-portfolio/'
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'Acesso público de leitura em nexaweb-public para portfólio'
  ) then
    create policy "Acesso público de leitura em nexaweb-public para portfólio"
      on storage.objects for select
      using (bucket_id = 'nexaweb-public' and name like 'admin-portfolio/%');
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- PARTE 2: Tabela de Controle de Anexos e Cotas (nexaweb-vault)
-- ------------------------------------------------------------------------------
create table if not exists public.project_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  state text not null default 'PENDING' check (state in ('PENDING', 'READY', 'DELETING', 'DELETED', 'DELETION_FAILED')),
  reservation_expires_at timestamptz not null default (now() + interval '20 minutes'),
  cleanup_attempts integer not null default 0 check (cleanup_attempts >= 0),
  cleanup_lease_token uuid,
  cleanup_lease_expires_at timestamptz,
  last_cleanup_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_attachments_project_state_idx
  on public.project_attachments(project_id, state);

create index if not exists project_attachments_cleanup_idx
  on public.project_attachments(state, reservation_expires_at)
  where state in ('PENDING', 'DELETING', 'DELETION_FAILED');

alter table public.project_attachments enable row level security;
-- Sem políticas para anon/authenticated: acesso restrito ao service_role.

-- ------------------------------------------------------------------------------
-- PARTE 3: RPCs do Endpoint /api/upload-briefing.ts
-- ------------------------------------------------------------------------------

-- 3.1 Reserva transacional de cota antes do upload
create or replace function public.reserve_project_attachment(
  p_project_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes bigint
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_count bigint;
  v_bytes bigint;
  v_id uuid;
begin
  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 15728640 then
    return jsonb_build_object('ok', false, 'reason', 'FILE_SIZE');
  end if;

  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    return jsonb_build_object('ok', false, 'reason', 'MIME');
  end if;

  if p_storage_path not like ('briefings/' || p_project_id::text || '/%') then
    return jsonb_build_object('ok', false, 'reason', 'PATH');
  end if;

  -- Bloqueio exclusivo no registro do projeto para garantir consistência em uploads simultâneos
  perform 1 from public.projects where id = p_project_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'PROJECT_NOT_FOUND');
  end if;

  -- Contabiliza arquivos que consom cota ativa: READY, DELETING, DELETION_FAILED ou PENDING vigentes
  select count(*), coalesce(sum(size_bytes), 0)
    into v_count, v_bytes
    from public.project_attachments
   where project_id = p_project_id
     and (
       state in ('READY', 'DELETING', 'DELETION_FAILED')
       or (state = 'PENDING' and reservation_expires_at > now())
     );

  if v_count >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'FILE_COUNT', 'count', v_count);
  end if;

  if v_bytes + p_size_bytes > 52428800 then
    return jsonb_build_object('ok', false, 'reason', 'PROJECT_QUOTA', 'bytes', v_bytes);
  end if;

  insert into public.project_attachments (
    project_id,
    storage_path,
    mime_type,
    size_bytes,
    state,
    reservation_expires_at
  ) values (
    p_project_id,
    p_storage_path,
    p_mime_type,
    p_size_bytes,
    'PENDING',
    now() + interval '20 minutes'
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'attachment_id', v_id);

exception when unique_violation then
  return jsonb_build_object('ok', false, 'reason', 'DUPLICATE_PATH');
end;
$$;

-- 3.2 Confirmação idempotente da reserva após sucesso no Storage
create or replace function public.finish_project_attachment(
  p_attachment_id uuid
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.project_attachments
     set state = 'READY',
         reservation_expires_at = null,
         updated_at = now()
   where id = p_attachment_id
     and state = 'PENDING';

  if found then
    return jsonb_build_object('ok', true, 'status', 'CONFIRMED');
  end if;

  -- Idempotência: se já estava READY (ex: retry de rede), retorna sucesso
  perform 1 from public.project_attachments
   where id = p_attachment_id
     and state = 'READY';

  if found then
    return jsonb_build_object('ok', true, 'status', 'ALREADY_READY');
  end if;

  return jsonb_build_object('ok', false, 'reason', 'ATTACHMENT_NOT_FOUND_OR_EXPIRED');
end;
$$;

-- 3.3 Liberação idempotente da reserva em caso de falha imediata
create or replace function public.release_project_attachment(
  p_attachment_id uuid,
  p_reason text default null,
  p_failed_storage boolean default false
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.project_attachments
     set state = case when p_failed_storage then 'DELETION_FAILED' else 'DELETED' end,
         last_cleanup_error = coalesce(p_reason, last_cleanup_error),
         cleanup_attempts = case when p_failed_storage then cleanup_attempts + 1 else cleanup_attempts end,
         updated_at = now()
   where id = p_attachment_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------------------------
-- PARTE 4: RPCs do Sweeper de Limpeza (/api/cron-cleanup-attachments.ts)
-- ------------------------------------------------------------------------------

-- 4.1 Reivindicação concorrente e segura de lotes para limpeza com SKIP LOCKED
create or replace function public.claim_attachments_for_cleanup(
  p_batch_size integer default 20,
  p_lease_seconds integer default 120
) returns table (
  attachment_id uuid,
  storage_path text,
  cleanup_attempts integer,
  lease_token uuid
)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_lease_token uuid := gen_random_uuid();
  v_lease_expiry timestamptz := now() + (p_lease_seconds || ' seconds')::interval;
begin
  return query
  with candidates as (
    select id
      from public.project_attachments
     where (
       (state = 'PENDING' and reservation_expires_at < now())
       or state in ('DELETING', 'DELETION_FAILED')
     )
     and (cleanup_lease_expires_at is null or cleanup_lease_expires_at < now())
     and cleanup_attempts < 10
     order by created_at asc
     limit coalesce(p_batch_size, 20)
     for update skip locked
  )
  update public.project_attachments a
     set cleanup_lease_token = v_lease_token,
         cleanup_lease_expires_at = v_lease_expiry,
         state = 'DELETING',
         updated_at = now()
    from candidates c
   where a.id = c.id
  returning a.id, a.storage_path, a.cleanup_attempts, a.cleanup_lease_token;
end;
$$;

-- 4.2 Confirmação definitiva de exclusão física no Storage vinculada ao lease ativo e válido
create or replace function public.confirm_attachment_deleted(
  p_attachment_id uuid,
  p_lease_token uuid
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.project_attachments
     set state = 'DELETED',
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         updated_at = now()
   where id = p_attachment_id
     and cleanup_lease_token = p_lease_token
     and (cleanup_lease_expires_at is null or cleanup_lease_expires_at > now());

  if found then
    return jsonb_build_object('ok', true);
  else
    return jsonb_build_object('ok', false, 'reason', 'LEASE_MISMATCH_OR_EXPIRED');
  end if;
end;
$$;

-- 4.3 Registro de falha na exclusão física do Storage vinculado ao lease ativo e válido
create or replace function public.record_attachment_cleanup_failure(
  p_attachment_id uuid,
  p_lease_token uuid,
  p_error text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.project_attachments
     set state = 'DELETION_FAILED',
         cleanup_attempts = cleanup_attempts + 1,
         last_cleanup_error = p_error,
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         updated_at = now()
   where id = p_attachment_id
     and cleanup_lease_token = p_lease_token
     and (cleanup_lease_expires_at is null or cleanup_lease_expires_at > now());

  if found then
    return jsonb_build_object('ok', true);
  else
    return jsonb_build_object('ok', false, 'reason', 'LEASE_MISMATCH_OR_EXPIRED');
  end if;
end;
$$;

-- ------------------------------------------------------------------------------
-- PARTE 5: Permissões de Execução Estritas (Acesso Exclusivo via service_role)
-- Anon e Authenticated são explicitamente revogados de todas as operações administrativas
-- ------------------------------------------------------------------------------
revoke all on function public.reserve_project_attachment(uuid, text, text, bigint) from public, anon, authenticated;
revoke all on function public.finish_project_attachment(uuid) from public, anon, authenticated;
revoke all on function public.release_project_attachment(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.claim_attachments_for_cleanup(integer, integer) from public, anon, authenticated;
revoke all on function public.confirm_attachment_deleted(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_attachment_cleanup_failure(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.reserve_project_attachment(uuid, text, text, bigint) to service_role;
grant execute on function public.finish_project_attachment(uuid) to service_role;
grant execute on function public.release_project_attachment(uuid, text, boolean) to service_role;
grant execute on function public.claim_attachments_for_cleanup(integer, integer) to service_role;
grant execute on function public.confirm_attachment_deleted(uuid, uuid) to service_role;
grant execute on function public.record_attachment_cleanup_failure(uuid, uuid, text) to service_role;

commit;

