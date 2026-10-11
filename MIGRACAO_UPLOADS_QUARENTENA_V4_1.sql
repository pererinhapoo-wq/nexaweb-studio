-- ==============================================================================
-- NexaWeb: Migração de Limite Seguro de Retentativas em Quarentena (V4.1)
-- ARQUIVO REVISADO: MIGRACAO_UPLOADS_QUARENTENA_V4_1.sql
--
-- ATENÇÃO: NÃO EXECUTAR AUTOMATICAMENTE.
-- Este script introduz controle de ciclo de falhas finitas e pausa de retentativas:
--
-- 1. LIMITE FINITO DE RETENTATIVAS FÍSICAS EM DESCARTE PENDENTE:
--    - Adiciona 'dismiss_failure_count' (contador de falhas consecutivas de descarte).
--    - Adiciona 'dismiss_paused_at' (timestamp da pausa quando atinge o limite).
--    - Adiciona 'dismiss_pause_reason' (motivo detalhado da pausa para auditoria).
--    - 'record_attachment_cleanup_failure' incrementa 'dismiss_failure_count'
--      quando 'pending_dismiss_justification' estiver ativo e, ao atingir o limite
--      (padrão 5 falhas), pausa novas tentativas automáticas físicas no Cron.
--
-- 2. PRESERVAÇÃO INTEGRAL DE HISTÓRICO E RECUPERABILIDADE:
--    - 'cleanup_attempts' permanece inalterado para auditoria do ciclo de vida.
--    - 'pending_dismiss_justification' é estritamente preservado após a pausa.
--    - Registros pausados NUNCA são eliminados nem abandonados silenciosamente;
--      permanecem visíveis na quarentena e no painel administrativo.
--
-- 3. REAUTORIZAÇÃO ADMINISTRATIVA SEGURA:
--    - Nova RPC 'admin_reauthorize_quarantined_attachment' permite ao admin
--      reautorizar operações pausadas de forma auditada, limpando a pausa
--      e resetando o contador de falhas consecutivas sem zerar 'cleanup_attempts'.
--    - 'admin_retry_quarantined_attachment' também desbloqueia itens pausados.
--
-- 4. DIFERENCIAÇÃO ENTRE FALHA FÍSICA E RECONCILIAÇÃO DE BANCO:
--    - Arquivo ausente do Storage avança direto para confirmação no banco sem
--      nova exclusão física e sem penalizar o contador de falhas físicas.
--    - Falhas de confirmação mantêm a reconciliação aberta sem gerar deleção espúria.
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 1. Colunas para Controle Finito de Retentativas e Pausa de Descarte Administrativo
-- ------------------------------------------------------------------------------
alter table public.project_attachments
  add column if not exists pending_dismiss_justification text;

alter table public.project_attachments
  add column if not exists admin_retry_requested_at timestamptz;

alter table public.project_attachments
  add column if not exists dismiss_failure_count integer default 0;

alter table public.project_attachments
  add column if not exists dismiss_paused_at timestamptz;

alter table public.project_attachments
  add column if not exists dismiss_pause_reason text;

-- ------------------------------------------------------------------------------
-- 2. DROP Prévio de Funções para Atualização Idempotente das Assinaturas
-- ------------------------------------------------------------------------------
drop function if exists public.claim_attachments_for_cleanup(integer, integer);
drop function if exists public.admin_dismiss_quarantined_attachment(uuid, text, uuid);
drop function if exists public.admin_dismiss_quarantined_attachment(uuid, text);
drop function if exists public.admin_retry_quarantined_attachment(uuid);
drop function if exists public.admin_reauthorize_quarantined_attachment(uuid, text);
drop function if exists public.confirm_attachment_deleted(uuid, uuid);
drop function if exists public.record_attachment_cleanup_failure(uuid, uuid, text, integer);
drop function if exists public.record_attachment_cleanup_failure(uuid, uuid, text);
drop function if exists public.get_quarantined_attachments(integer, integer);

-- ------------------------------------------------------------------------------
-- 3. Reivindicação Segura para Limpeza e Recuperação pelo Sweeper (Cron)
-- Exclui itens cujo descarte administrativo esteja pausado por excesso de falhas
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
  dismiss_justification text,
  dismiss_failure_count integer,
  is_dismiss_paused boolean
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
       -- Caso C: Descarte administrativo pendente de recuperação (NÃO pausado por excesso de falhas)
       or (state in ('DELETING', 'DELETION_FAILED') and pending_dismiss_justification is not null and dismiss_paused_at is null)
       -- Caso D: Retry ou Reautorização manual administrativa explicitamente autorizada
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
         -- Limpa o flag de solicitação manual de retry/reautorização
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
            a.pending_dismiss_justification as dismiss_justification,
            coalesce(a.dismiss_failure_count, 0) as dismiss_failure_count,
            (a.dismiss_paused_at is not null) as is_dismiss_paused;
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
         state, storage_path, quarantine_notes, pending_dismiss_justification,
         dismiss_failure_count, dismiss_paused_at
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

    -- Inicia ou reinicia o descarte: limpa pausa prévia e zera contador de falhas consecutivas
    update public.project_attachments
       set state = 'DELETING',
           cleanup_lease_token = v_new_token,
           cleanup_lease_expires_at = now() + interval '120 seconds',
           pending_dismiss_justification = trim(p_justification),
           dismiss_failure_count = 0,
           dismiss_paused_at = null,
           dismiss_pause_reason = null,
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
         dismiss_failure_count = 0,
         dismiss_paused_at = null,
         dismiss_pause_reason = null,
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
         dismiss_failure_count = 0,
         dismiss_paused_at = null,
         dismiss_pause_reason = null,
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
-- 6. Registro de Falha Física com Limite Finito e Pausa Automática (V4.1)
-- ------------------------------------------------------------------------------
create or replace function public.record_attachment_cleanup_failure(
  p_attachment_id uuid,
  p_lease_token uuid,
  p_error text,
  p_max_consecutive_failures integer default 5
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_rec record;
  v_new_failure_count integer := 0;
  v_is_paused boolean := false;
  v_limit integer := coalesce(p_max_consecutive_failures, 5);
begin
  if p_lease_token is null then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_TOKEN_REQUIRED');
  end if;

  select id, cleanup_attempts, cleanup_lease_token, cleanup_lease_expires_at,
         pending_dismiss_justification, dismiss_failure_count, quarantine_notes
    into v_rec
    from public.project_attachments
   where id = p_attachment_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ATTACHMENT_NOT_FOUND');
  end if;

  if v_rec.cleanup_lease_token is null or v_rec.cleanup_lease_token != p_lease_token or
     v_rec.cleanup_lease_expires_at is null or v_rec.cleanup_lease_expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_MISMATCH_OR_EXPIRED');
  end if;

  -- Se for descarte administrativo pendente, contabiliza falha física no contador específico
  if v_rec.pending_dismiss_justification is not null then
    v_new_failure_count := coalesce(v_rec.dismiss_failure_count, 0) + 1;
    v_is_paused := (v_new_failure_count >= v_limit);

    update public.project_attachments
       set state = 'DELETION_FAILED',
           last_cleanup_error = p_error,
           cleanup_lease_token = null,
           cleanup_lease_expires_at = null,
           dismiss_failure_count = v_new_failure_count,
           dismiss_paused_at = case when v_is_paused then now() else null end,
           dismiss_pause_reason = case
             when v_is_paused then 'LIMITE_FALHAS_ATINGIDO: ' || v_new_failure_count::text || ' falhas consecutivas (' || p_error || ')'
             else null
           end,
           quarantine_notes = case
             when v_is_paused then
               coalesce(quarantine_notes, '') || ' [PAUSADO: ' || v_new_failure_count::text || ' falhas consecutivas (' || p_error || ') em ' || now()::text || ']'
             else
               coalesce(quarantine_notes, '') || ' [FALHA_DISMISS_STORAGE (' || v_new_failure_count::text || '/' || v_limit::text || '): ' || p_error || ' em ' || now()::text || ']'
           end,
           updated_at = now()
     where id = p_attachment_id;

    return jsonb_build_object(
      'ok', true,
      'cleanup_attempts', v_rec.cleanup_attempts,
      'quarantined', (v_rec.cleanup_attempts >= 10),
      'is_pending_dismiss', true,
      'dismiss_failure_count', v_new_failure_count,
      'is_paused', v_is_paused,
      'paused_at', case when v_is_paused then now() else null end,
      'pause_reason', case when v_is_paused then 'LIMITE_FALHAS_ATINGIDO' else null end
    );
  else
    -- Limpeza ordinária fora de descarte administrativo
    update public.project_attachments
       set state = 'DELETION_FAILED',
           last_cleanup_error = p_error,
           cleanup_lease_token = null,
           cleanup_lease_expires_at = null,
           quarantine_notes = case
             when quarantine_notes is null or quarantine_notes = '' then '[FALHA_STORAGE: ' || p_error || ' em ' || now()::text || ']'
             else quarantine_notes || ' [FALHA_STORAGE: ' || p_error || ' em ' || now()::text || ']'
           end,
           updated_at = now()
     where id = p_attachment_id;

    return jsonb_build_object(
      'ok', true,
      'cleanup_attempts', v_rec.cleanup_attempts,
      'quarantined', (v_rec.cleanup_attempts >= 10),
      'is_pending_dismiss', false,
      'is_paused', false
    );
  end if;
end;
$$;

-- Compatibilidade com chamadas sem o 4º parâmetro
create or replace function public.record_attachment_cleanup_failure(
  p_attachment_id uuid,
  p_lease_token uuid,
  p_error text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return public.record_attachment_cleanup_failure(p_attachment_id, p_lease_token, p_error, 5);
end;
$$;

-- ------------------------------------------------------------------------------
-- 7. Reautorização Administrativa Segura de Descarte Pausado (V4.1)
-- Permite ao admin reautorizar uma operação pausada sem zerar cleanup_attempts
-- ------------------------------------------------------------------------------
create or replace function public.admin_reauthorize_quarantined_attachment(
  p_attachment_id uuid,
  p_justification text default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_rec record;
begin
  select id, cleanup_attempts, cleanup_lease_expires_at, state,
         pending_dismiss_justification, dismiss_paused_at, dismiss_failure_count
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

  if v_rec.cleanup_lease_expires_at is not null and v_rec.cleanup_lease_expires_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_ACTIVE');
  end if;

  if v_rec.pending_dismiss_justification is null then
    return jsonb_build_object('ok', false, 'reason', 'NOT_A_PENDING_DISMISS');
  end if;

  -- Desbloqueia a pausa, zera o contador de falhas consecutivas e agenda nova tentativa no Cron
  update public.project_attachments
     set dismiss_failure_count = 0,
         dismiss_paused_at = null,
         dismiss_pause_reason = null,
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         admin_retry_requested_at = now(),
         pending_dismiss_justification = case
           when p_justification is not null and length(trim(p_justification)) >= 5 then trim(p_justification)
           else pending_dismiss_justification
         end,
         state = 'DELETING',
         quarantine_notes = case
           when quarantine_notes is null or quarantine_notes = '' then '[REAUTORIZADO por admin em ' || now()::text || ']'
           else quarantine_notes || ' [REAUTORIZADO por admin em ' || now()::text || ']'
         end,
         updated_at = now()
   where id = p_attachment_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'REAUTHORIZED_FOR_CLEANUP',
    'cleanup_attempts', v_rec.cleanup_attempts
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- 8. Retry Administrativo (Preserva Histórico de Tentativas e Limpa Pausa)
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
  -- Limpa eventuais pausas e agenda nova tentativa auditada pelo Sweeper.
  update public.project_attachments
     set cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         pending_dismiss_justification = null,
         dismiss_failure_count = 0,
         dismiss_paused_at = null,
         dismiss_pause_reason = null,
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
-- 9. Consulta de Quarentena (Exclui DELETED e Resolvidos, Inclui Pausas e Contadores)
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
  dismiss_failure_count integer,
  dismiss_paused_at timestamptz,
  dismiss_pause_reason text,
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
         coalesce(dismiss_failure_count, 0) as dismiss_failure_count,
         dismiss_paused_at,
         dismiss_pause_reason,
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
-- 10. Permissões de Execução Estritas (Acesso Exclusivo service_role)
-- ------------------------------------------------------------------------------
revoke all on function public.claim_attachments_for_cleanup(integer, integer) from public, anon, authenticated;
revoke all on function public.admin_dismiss_quarantined_attachment(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_retry_quarantined_attachment(uuid) from public, anon, authenticated;
revoke all on function public.admin_reauthorize_quarantined_attachment(uuid, text) from public, anon, authenticated;
revoke all on function public.confirm_attachment_deleted(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_attachment_cleanup_failure(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.record_attachment_cleanup_failure(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.get_quarantined_attachments(integer, integer) from public, anon, authenticated;

grant execute on function public.claim_attachments_for_cleanup(integer, integer) to service_role;
grant execute on function public.admin_dismiss_quarantined_attachment(uuid, text, uuid) to service_role;
grant execute on function public.admin_retry_quarantined_attachment(uuid) to service_role;
grant execute on function public.admin_reauthorize_quarantined_attachment(uuid, text) to service_role;
grant execute on function public.confirm_attachment_deleted(uuid, uuid) to service_role;
grant execute on function public.record_attachment_cleanup_failure(uuid, uuid, text, integer) to service_role;
grant execute on function public.record_attachment_cleanup_failure(uuid, uuid, text) to service_role;
grant execute on function public.get_quarantined_attachments(integer, integer) to service_role;

commit;
