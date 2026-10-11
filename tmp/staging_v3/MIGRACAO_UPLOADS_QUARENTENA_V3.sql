-- ==============================================================================
-- NexaWeb: Migração de Segurança e Consistência de Quarentena (V3)
-- ARQUIVO REVISADO: MIGRACAO_UPLOADS_QUARENTENA_V3.sql
--
-- ATENÇÃO: NÃO EXECUTAR AUTOMATICAMENTE.
-- Este script contém exclusivamente as correções pontuais necessárias para:
-- 1. Excluir registros com estado 'DELETED' e já resolvidos das consultas e métricas
--    de quarentena.
-- 2. Garantir validação estrita de estados nas RPCs de Retry e Descarte (Dismiss),
--    rejeitando itens já excluídos ('DELETED') ou em estados inválidos ('READY').
-- 3. Estabelecer o fluxo atômico de duas fases (Claim com Lease + Confirmação)
--    para o descarte administrativo, impedindo remoção física no Storage antes da
--    validação no banco e protegendo contra conflitos concorrentes.
-- 4. Preservar autorização exclusiva de execução para 'service_role'.
--
-- Execução: Painel SQL Editor do Supabase (role postgres/admin).
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 1. DROP Prévio de Funções para Atualização de Assinaturas sem Ambiguidade
-- ------------------------------------------------------------------------------
drop function if exists public.get_quarantined_attachments(integer, integer);
drop function if exists public.admin_retry_quarantined_attachment(uuid);
drop function if exists public.admin_dismiss_quarantined_attachment(uuid, text);
drop function if exists public.admin_dismiss_quarantined_attachment(uuid, text, uuid);

-- ------------------------------------------------------------------------------
-- 2. Consulta de Quarentena: Exclui Estritamente Registros 'DELETED' e Resolvidos
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
-- 3. Retry Administrativo de Quarentena com Validação Estrita de Estado
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

  -- Impede reprocessamento de anexos já excluídos
  if v_rec.state = 'DELETED' then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_DELETED');
  end if;

  -- Rejeita estados incompatíveis com quarentena (ex: READY não pode ser reenfileirado para exclusão)
  if v_rec.state not in ('DELETION_FAILED', 'DELETING', 'PENDING') then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATE', 'state', v_rec.state);
  end if;

  -- Apenas itens com histórico efetivo de quarentena (>= 10 tentativas)
  if v_rec.cleanup_attempts < 10 then
    return jsonb_build_object('ok', false, 'reason', 'NOT_IN_QUARANTINE', 'attempts', v_rec.cleanup_attempts);
  end if;

  -- Impede conflito de concorrência enquanto worker ou outro admin mantiver lease ativo
  if v_rec.cleanup_lease_expires_at is not null and v_rec.cleanup_lease_expires_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'LEASE_ACTIVE');
  end if;

  update public.project_attachments
     set cleanup_attempts = 0,
         cleanup_lease_token = null,
         cleanup_lease_expires_at = null,
         state = 'DELETING',
         quarantine_notes = case
           when quarantine_notes is null or quarantine_notes = '' then '[RETRY acionado manualmente por admin em ' || now()::text || ']'
           else quarantine_notes || ' [RETRY acionado manualmente por admin em ' || now()::text || ']'
         end,
         quarantine_resolved_at = null,
         updated_at = now()
   where id = p_attachment_id;

  return jsonb_build_object('ok', true, 'status', 'QUEUED_FOR_RETRY');
end;
$$;

-- ------------------------------------------------------------------------------
-- 4. Descarte Administrativo de Quarentena (Duas Fases Atômicas com Lease)
--
-- Fase 1 (Claim / Bloqueio): p_lease_token é NULL
-- Valida elegibilidade e justificativa, reserva o item com lease token e transita
-- para DELETING antes de qualquer remoção no Storage.
--
-- Fase 2 (Confirmação): p_lease_token é fornecido
-- Confirma a exclusão física com validação do token do lease, marcando DELETED
-- e gravando a justificativa definitiva.
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
  -- Exige justificativa com no mínimo 5 caracteres
  if p_justification is null or length(trim(p_justification)) < 5 then
    return jsonb_build_object('ok', false, 'reason', 'JUSTIFICATION_REQUIRED');
  end if;

  select id, cleanup_attempts, cleanup_lease_token, cleanup_lease_expires_at, state, storage_path, quarantine_notes
    into v_rec
    from public.project_attachments
   where id = p_attachment_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ATTACHMENT_NOT_FOUND');
  end if;

  -- Rejeita descarte repetido se o anexo já estiver resolvido como DELETED
  if v_rec.state = 'DELETED' then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_DELETED');
  end if;

  -- ----------------------------------------------------------------------------
  -- FASE 1: Claim Atômico com Lease (Token de Operação)
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
  -- FASE 2: Confirmação Atômica de Descarte Vinculada ao Lease Vigente
  -- ----------------------------------------------------------------------------
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
-- 5. Atualização de Confirmação do Sweeper para Gravar quarantine_resolved_at
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
-- 6. Permissões de Execução Estritas (Acesso Exclusivo via service_role)
-- ------------------------------------------------------------------------------
revoke all on function public.get_quarantined_attachments(integer, integer) from public, anon, authenticated;
revoke all on function public.admin_retry_quarantined_attachment(uuid) from public, anon, authenticated;
revoke all on function public.admin_dismiss_quarantined_attachment(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.confirm_attachment_deleted(uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_quarantined_attachments(integer, integer) to service_role;
grant execute on function public.admin_retry_quarantined_attachment(uuid) to service_role;
grant execute on function public.admin_dismiss_quarantined_attachment(uuid, text, uuid) to service_role;
grant execute on function public.confirm_attachment_deleted(uuid, uuid) to service_role;

commit;
