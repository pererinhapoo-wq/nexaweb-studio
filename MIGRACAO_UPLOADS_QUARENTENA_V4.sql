-- ==============================================================================
-- NexaWeb: Migração de Segurança e Recuperação de Descarte em Quarentena (V4)
-- ARQUIVO REVISADO: MIGRACAO_UPLOADS_QUARENTENA_V4.sql
--
-- ATENÇÃO: NÃO EXECUTAR AUTOMATICAMENTE.
-- Este script corrige e aprimora o ciclo de vida dos anexos em quarentena:
--
-- 1. PRESERVAÇÃO DE RECUPERAÇÃO APÓS FALHA:
--    'record_attachment_cleanup_failure' preserva 'pending_dismiss_justification'
--    para operações de descarte pendentes, garantindo que o registro permaneça
--    recuperável pelo Sweeper mesmo após expiração de lease e com >= 10 tentativas.
--    Diferencia falhas de descarte administrativo de falhas comuns de limpeza.
--
-- 2. FORTALECIMENTO DA CONFIRMAÇÃO:
--    'admin_dismiss_quarantined_attachment' na Fase 2 (Confirmação) exige:
--    - Estado válido ('DELETING')
--    - Intenção administrativa pendente ('pending_dismiss_justification' NOT NULL)
--    - Token de lease ativo não nulo, coincidente e não expirado
--    - Rejeita estritamente tokens antigos e operações sem intenção de descarte.
--
-- 3. AUDITORIA E PRESERVAÇÃO DO CONTADOR DE TENTATIVAS:
--    'admin_retry_quarantined_attachment' NÃO zera artificialmente 'cleanup_attempts'.
--    Preserva o contador histórico de falhas e registra 'admin_retry_requested_at = now()',
--    permitindo que o Sweeper reexecute o processamento de forma auditada sem
--    mascarar o volume histórico de falhas passadas.
--
-- 4. INTEGRAÇÃO ROBUSTA COM O SWEEPER:
--    'claim_attachments_for_cleanup' identifica e retorna 'is_pending_dismiss'
--    e 'dismiss_justification', habilitando o cron a recuperar descartes pendentes
--    sem exigir nova exclusão de arquivo já removido do Storage.
--
-- 5. COMPATIBILIDADE INTEGRAL DAS RPCS DO CICLO DE LIMPEZA:
--    Inclui 'confirm_attachment_deleted' com validação de lease e resolução auditável.
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 1. Colunas para Identificação e Auditoria de Operações Administrativas
-- ------------------------------------------------------------------------------
alter table public.project_attachments
  add column if not exists pending_dismiss_justification text;

alter table public.project_attachments
  add column if not exists admin_retry_requested_at timestamptz;

-- ------------------------------------------------------------------------------
-- 2. DROP Prévio de Funções para Atualização Idempotente das Assinaturas
-- ------------------------------------------------------------------------------
drop function if exists public.claim_attachments_for_cleanup(integer, integer);
drop function if exists public.admin_dismiss_quarantined_attachment(uuid, text, uuid);
drop function if exists public.admin_dismiss_quarantined_attachment(uuid, text);
drop function if exists public.admin_retry_quarantined_attachment(uuid);
drop function if exists public.confirm_attachment_deleted(uuid, uuid);
drop function if exists public.record_attachment_cleanup_failure(uuid, uuid, text);
drop function if exists public.get_quarantined_attachments(integer, integer);

-- ------------------------------------------------------------------------------
-- 3. Reivindicação Segura para Limpeza e Recuperação pelo Sweeper (Cron)
-- ------------------------------------------------------------------------------
create or replace function public.claim_attachments_for_cleanup(
  p_batch_size integer default 20,
  p_lease_seconds integer default 120
) returns table (
  attachment_id uuid,
  storage_path text,
  cleanup_attempts integer,
  lease_token uuid,
  is_pending_dismiss boolean,
  dismiss_justification text
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
       -- Caso A: Reservas pendentes de upload expiradas
       (state = 'PENDING' and reservation_expires_at < now())
       -- Caso B: Falhas automáticas com menos de 10 tentativas (fora de quarentena)
       or (state in ('DELETING', 'DELETION_FAILED') and cleanup_attempts < 10 and pending_dismiss_justification is null and admin_retry_requested_at is null)
       -- Caso C: Descarte administrativo pendente de recuperação (inclusive com >= 10 tentativas)
       or (state in ('DELETING', 'DELETION_FAILED') and pending_dismiss_justification is not null)
       -- Caso D: Retry manual administrativo explicitamente autorizado (preservando histórico)
       or (state in ('DELETING', 'DELETION_FAILED') and admin_retry_requested_at is not null)
     )
     and (cleanup_lease_expires_at is null or cleanup_lease_expires_at < now())
     order by created_at asc
     limit coalesce(p_batch_size, 20)
     for update skip locked
  )
  update public.project_attachments a
     set cleanup_lease_token = v_lease_token,
         cleanup_lease_expires_at = v_lease_expiry,
         -- Preserva o contador histórico de tentativas em descartes pendentes de confirmação.
         -- Em retries ordinários ou limpezas automáticas, avança o contador de tentativas.
         cleanup_attempts = case
           when a.pending_dismiss_justification is not null then a.cleanup_attempts
           else a.cleanup_attempts + 1
         end,
         -- Limpa o flag de solicitação manual de retry, pois a tarefa foi assumida pelo worker
         admin_retry_requested_at = null,
         state = 'DELETING',
         updated_at = now()
    from candidates c
   where a.id = c.id
  returning a.id,
            a.storage_path,
            a.cleanup_attempts,
            a.cleanup_lease_token,
            (a.pending_dismiss_justification is not null) as is_pending_dismiss,
            a.pending_dismiss_justification as dismiss_justification;
end;
$$;

-- ------------------------------------------------------------------------------
-- 4. Descarte Administrativo de Quarentena (Fase 1 Claim e Fase 2 Confirmação Fortalecida)
-- ------------------------------------------------------------------------------
create or replace function public.admin_dismiss_quarantined_attachment(
  p_attachment_id uuid,
  p_justification text,
  p_lease_token uuid default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_rec record;
  v_new_token uuid;
begin
  if p_justification is null or length(trim(p_justification)) < 5 then
    return jsonb_build_object('ok', false, 'reason', 'JUSTIFICATION_REQUIRED');
  end if;

  select id, cleanup_attempts, cleanup_lease_token, cleanup_lease_expires_at,
         state, storage_path, quarantine_notes, pending_dismiss_justification
    into v_rec
    from public.project_attachments
   where id = p_attachment_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ATTACHMENT_NOT_FOUND');
  end if;

  if v_rec.state = 'DELETED' then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_DELETED');
  end if;

  -- ----------------------------------------------------------------------------
  -- FASE 1: Claim Atômico com Gravação da Justificativa Pendente
  -- ----------------------------------------------------------------------------
  if p_lease_token is null then
    if v_rec.state not in ('DELETION_FAILED', 'DELETING', 'PENDING') then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATE', 'state', v_rec.state);
    end if;

    if v_rec.cleanup_attempts < 10 then
      return jsonb_build_object('ok', false, 'reason', 'NOT_IN_QUARANTINE', 'attempts', v_rec.cleanup_attempts);
    end if;

    if v_rec.cleanup_lease_expires_at is not null and v_rec.cleanup_lease_expires_at > now() then
      return jsonb_build_object('ok', false, 'reason', 'LEASE_ACTIVE');
    end if;

    v_new_token := gen_random_uuid();

    update public.project_attachments
       set state = 'DELETING',
           cleanup_lease_token = v_new_token,
           cleanup_lease_expires_at = now() + interval '120 seconds',
           pending_dismiss_justification = trim(p_justification),
           quarantine_notes = case
             when quarantine_notes is null or quarantine_notes = '' then '[DISMISS_CLAIMED: ' || trim(p_justification) || ' em ' || now()::text || ']'
             else quarantine_notes || ' [DISMISS_CLAIMED: ' || trim(p_justification) || ' em ' || now()::text || ']'
           end,
           updated_at = now()
     where id = p_attachment_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'CLAIMED_FOR_DISMISS',
      'lease_token', v_new_token,
      'storage_path', v_rec.storage_path
    );
  end if;

  -- ----------------------------------------------------------------------------
  -- FASE 2: Confirmação Atômica Estritamente Validada
  -- Exige: Estado 'DELETING', intenção de descarte pendente, lease ativo não expirado
  -- e token coincidente (rejeita tokens antigos de processos anteriores).
  -- ----------------------------------------------------------------------------
  if v_rec.state != 'DELETING' then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATE', 'state', v_rec.state);
  end if;

  if v_rec.pending_dismiss_justification is null then
    return jsonb_build_object('ok', false, 'reason', 'NOT_A_PENDING_DISMISS');
  end if;

  if v_rec.cleanup_lease_token is null or v_rec.cleanup_lease_expires_at is null then
    return jsonb_build_object('ok', false, 'reason', 'NO_ACTIVE_LEASE');
  end if;

  if v_rec.cleanup_lease_expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_EXPIRED');
  end if;

  if v_rec.cleanup_lease_token != p_lease_token then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_MISMATCH');
  end if;

  update public.project_attachments
     set state = 'DELETED',
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         pending_dismiss_justification = null, -- Limpa pendência após confirmação com sucesso
         quarantine_notes = case
           when quarantine_notes is null or quarantine_notes = '' then 'DISMISSED: ' || trim(p_justification)
           else quarantine_notes || ' [DISMISSED: ' || trim(p_justification) || ' em ' || now()::text || ']'
         end,
         quarantine_resolved_at = now(),
         updated_at = now()
   where id = p_attachment_id;

  return jsonb_build_object('ok', true, 'status', 'DISMISSED');
end;
$$;

-- ------------------------------------------------------------------------------
-- 5. Confirmação de Exclusão Física Normal pelo Sweeper
-- ------------------------------------------------------------------------------
create or replace function public.confirm_attachment_deleted(
  p_attachment_id uuid,
  p_lease_token uuid
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_current_token uuid;
  v_current_expiry timestamptz;
begin
  if p_lease_token is null then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_TOKEN_REQUIRED');
  end if;

  update public.project_attachments
     set state = 'DELETED',
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         pending_dismiss_justification = null,
         quarantine_resolved_at = case
           when cleanup_attempts >= 10 then coalesce(quarantine_resolved_at, now())
           else quarantine_resolved_at
         end,
         updated_at = now()
   where id = p_attachment_id
     and cleanup_lease_token is not null
     and cleanup_lease_token = p_lease_token
     and cleanup_lease_expires_at is not null
     and cleanup_lease_expires_at > now();

  if found then
    return jsonb_build_object('ok', true);
  end if;

  select cleanup_lease_token, cleanup_lease_expires_at
    into v_current_token, v_current_expiry
    from public.project_attachments
   where id = p_attachment_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ATTACHMENT_NOT_FOUND');
  end if;

  if v_current_token is null or v_current_expiry is null then
    return jsonb_build_object('ok', false, 'reason', 'NO_ACTIVE_LEASE');
  end if;

  if v_current_token = p_lease_token and v_current_expiry <= now() then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_EXPIRED');
  end if;

  return jsonb_build_object('ok', false, 'reason', 'LEASE_MISMATCH');
end;
$$;

-- ------------------------------------------------------------------------------
-- 6. Registro de Falha Física (PRESERVA 'pending_dismiss_justification')
-- ------------------------------------------------------------------------------
create or replace function public.record_attachment_cleanup_failure(
  p_attachment_id uuid,
  p_lease_token uuid,
  p_error text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_attempts integer;
  v_is_pending_dismiss boolean;
begin
  if p_lease_token is null then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_TOKEN_REQUIRED');
  end if;

  -- Libera o lease mas PRESERVA pending_dismiss_justification
  -- para que o descarte permaneça elegível a recuperação automática posterior pelo Sweeper.
  update public.project_attachments
     set state = 'DELETION_FAILED',
         last_cleanup_error = p_error,
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         -- pending_dismiss_justification é expressamente preservado
         quarantine_notes = case
           when pending_dismiss_justification is not null then
             case
               when quarantine_notes is null or quarantine_notes = '' then '[FALHA_DISMISS_STORAGE: ' || p_error || ' em ' || now()::text || ']'
               else quarantine_notes || ' [FALHA_DISMISS_STORAGE: ' || p_error || ' em ' || now()::text || ']'
             end
           else
             case
               when quarantine_notes is null or quarantine_notes = '' then '[FALHA_STORAGE: ' || p_error || ' em ' || now()::text || ']'
               else quarantine_notes || ' [FALHA_STORAGE: ' || p_error || ' em ' || now()::text || ']'
             end
         end,
         updated_at = now()
   where id = p_attachment_id
     and cleanup_lease_token is not null
     and cleanup_lease_token = p_lease_token
     and cleanup_lease_expires_at is not null
     and cleanup_lease_expires_at > now()
   returning cleanup_attempts, (pending_dismiss_justification is not null) into v_attempts, v_is_pending_dismiss;

  if found then
    return jsonb_build_object(
      'ok', true,
      'cleanup_attempts', v_attempts,
      'quarantined', (v_attempts >= 10),
      'is_pending_dismiss', coalesce(v_is_pending_dismiss, false)
    );
  end if;

  return jsonb_build_object('ok', false, 'reason', 'LEASE_MISMATCH_OR_EXPIRED');
end;
$$;

-- ------------------------------------------------------------------------------
-- 7. Retry Administrativo (Preserva Histórico de Tentativas de Forma Auditável)
-- ------------------------------------------------------------------------------
create or replace function public.admin_retry_quarantined_attachment(
  p_attachment_id uuid
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_rec record;
begin
  select id, cleanup_attempts, cleanup_lease_expires_at, state
    into v_rec
    from public.project_attachments
   where id = p_attachment_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ATTACHMENT_NOT_FOUND');
  end if;

  if v_rec.state = 'DELETED' then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_DELETED');
  end if;

  if v_rec.state not in ('DELETION_FAILED', 'DELETING', 'PENDING') then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATE', 'state', v_rec.state);
  end if;

  if v_rec.cleanup_attempts < 10 then
    return jsonb_build_object('ok', false, 'reason', 'NOT_IN_QUARANTINE', 'attempts', v_rec.cleanup_attempts);
  end if;

  if v_rec.cleanup_lease_expires_at is not null and v_rec.cleanup_lease_expires_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_ACTIVE');
  end if;

  -- PRESERVA cleanup_attempts sem zerar artificialmente o histórico.
  -- Registra a solicitação administrativa e sinaliza para reprocessamento pelo Sweeper.
  update public.project_attachments
     set cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         pending_dismiss_justification = null,
         admin_retry_requested_at = now(),
         state = 'DELETING',
         quarantine_notes = case
           when quarantine_notes is null or quarantine_notes = '' then '[RETRY manual por admin; histórico mantido com ' || cleanup_attempts::text || ' tentativas em ' || now()::text || ']'
           else quarantine_notes || ' [RETRY manual por admin; histórico mantido com ' || cleanup_attempts::text || ' tentativas em ' || now()::text || ']'
         end,
         quarantine_resolved_at = null,
         updated_at = now()
   where id = p_attachment_id;

  return jsonb_build_object('ok', true, 'status', 'QUEUED_FOR_RETRY', 'cleanup_attempts', v_rec.cleanup_attempts);
end;
$$;

-- ------------------------------------------------------------------------------
-- 8. Consulta de Quarentena (Exclui DELETED e Resolvidos)
-- ------------------------------------------------------------------------------
create or replace function public.get_quarantined_attachments(
  p_min_attempts integer default 10,
  p_limit integer default 50
) returns table (
  id uuid,
  project_id uuid,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  state text,
  cleanup_attempts integer,
  last_cleanup_error text,
  quarantine_notes text,
  quarantine_resolved_at timestamptz,
  pending_dismiss_justification text,
  admin_retry_requested_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql security definer set search_path = public, pg_temp
as $$
  select id,
         project_id,
         storage_path,
         mime_type,
         size_bytes,
         state,
         cleanup_attempts,
         last_cleanup_error,
         quarantine_notes,
         quarantine_resolved_at,
         pending_dismiss_justification,
         admin_retry_requested_at,
         created_at,
         updated_at
    from public.project_attachments
   where cleanup_attempts >= coalesce(p_min_attempts, 10)
     and state != 'DELETED'
     and quarantine_resolved_at is null
   order by updated_at desc
   limit coalesce(p_limit, 50);
$$;

-- ------------------------------------------------------------------------------
-- 9. Permissões de Execução Estritas (Acesso Exclusivo service_role)
-- ------------------------------------------------------------------------------
revoke all on function public.claim_attachments_for_cleanup(integer, integer) from public, anon, authenticated;
revoke all on function public.admin_dismiss_quarantined_attachment(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_retry_quarantined_attachment(uuid) from public, anon, authenticated;
revoke all on function public.confirm_attachment_deleted(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_attachment_cleanup_failure(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.get_quarantined_attachments(integer, integer) from public, anon, authenticated;

grant execute on function public.claim_attachments_for_cleanup(integer, integer) to service_role;
grant execute on function public.admin_dismiss_quarantined_attachment(uuid, text, uuid) to service_role;
grant execute on function public.admin_retry_quarantined_attachment(uuid) to service_role;
grant execute on function public.confirm_attachment_deleted(uuid, uuid) to service_role;
grant execute on function public.record_attachment_cleanup_failure(uuid, uuid, text) to service_role;
grant execute on function public.get_quarantined_attachments(integer, integer) to service_role;

commit;
