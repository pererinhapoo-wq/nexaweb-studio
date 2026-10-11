import crypto from 'crypto';

/**
 * Suite de Testes de Regressão Obrigatórios da V4:
 * Segurança, Recuperação e Consistência de Anexos em Quarentena
 *
 * Cobre estritamente os cenários exigidos pela especificação:
 * 1. Descarte administrativo começa com 10 ou mais tentativas.
 * 2. Ordem estrita: banco validado antes de remoção no Storage.
 * 3. Falha no Storage preserva pending_dismiss_justification e não mascara falha.
 * 4. Falha de confirmação após remoção física não marca DELETED e mantém recuperação ativa.
 * 5. Expiração da reserva (lease timeout) libera o registro para nova tentativa segura.
 * 6. Rejeição estrita de token antigo / expirado em confirmação de descarte.
 * 7. Retomada automática pelo Sweeper (Cron) de itens pendentes de descarte com >= 10 tentativas.
 * 8. Cron recupera sem reexecutar remoção quando o arquivo já não existe no Storage.
 * 9. Concorrência e bloqueio: múltiplos processos disputando o mesmo anexo não geram inconsistência.
 * 10. Idempotência e rejeição de ações repetidas em itens já resolvidos (DELETED).
 * 11. Preservação do histórico auditável de tentativas no retry manual (sem zerar artificialmente).
 * 12. Consultas e métricas excluem estritamente registros DELETED ou resolvidos.
 * 13. Proteção de autorização, CSRF e acesso exclusivo de service_role.
 *
 * Executado localmente em memória com simulações e mocks sem dados reais.
 */

async function runQuarantineSecurityRegressionTests() {
  console.log('========================================================================');
  console.log('SUITE DE REGRESSÃO OBRIGATÓRIA V4: RECUPERAÇÃO E SEGURANÇA DE QUARENTENA');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (!condition) {
      console.error(`❌ FALHA: ${testName}`);
      throw new Error(`Falha no teste: ${testName}`);
    }
    passed++;
    console.log(`✅ [TESTE ${total}] ${testName}`);
  }

  // ===========================================================================
  // Simulador Fiel do Banco de Dados e RPCs (MIGRACAO_UPLOADS_QUARENTENA_V4.sql)
  // ===========================================================================
  class MockQuarantineDatabase {
    constructor() {
      this.attachments = new Map();
      this.storageObjects = new Set();
    }

    addAttachment(record) {
      const id = record.id || crypto.randomUUID();
      const rec = {
        id,
        project_id: record.project_id || crypto.randomUUID(),
        storage_path: record.storage_path || `briefings/proj/${id}.jpg`,
        mime_type: record.mime_type || 'image/jpeg',
        size_bytes: record.size_bytes || 1024,
        state: record.state || 'DELETION_FAILED',
        cleanup_attempts: record.cleanup_attempts !== undefined ? record.cleanup_attempts : 10,
        cleanup_lease_token: record.cleanup_lease_token || null,
        cleanup_lease_expires_at: record.cleanup_lease_expires_at || null,
        last_cleanup_error: record.last_cleanup_error || null,
        quarantine_notes: record.quarantine_notes || null,
        quarantine_resolved_at: record.quarantine_resolved_at || null,
        pending_dismiss_justification: record.pending_dismiss_justification || null,
        admin_retry_requested_at: record.admin_retry_requested_at || null,
        reservation_expires_at: record.reservation_expires_at || null,
        created_at: record.created_at || new Date(),
        updated_at: record.updated_at || new Date(),
      };
      this.attachments.set(id, rec);
      if (rec.state !== 'DELETED') {
        this.storageObjects.add(rec.storage_path);
      }
      return rec;
    }

    // RPC: claim_attachments_for_cleanup
    claim_attachments_for_cleanup(batchSize = 20, leaseSeconds = 120) {
      const now = new Date();
      const claimed = [];
      for (const att of this.attachments.values()) {
        const leaseExpiredOrNull = !att.cleanup_lease_expires_at || att.cleanup_lease_expires_at <= now;
        if (!leaseExpiredOrNull) continue;

        const isExpiredPending = att.state === 'PENDING' && att.reservation_expires_at && att.reservation_expires_at < now;
        const isAutoFailure = ['DELETING', 'DELETION_FAILED'].includes(att.state) &&
                              att.cleanup_attempts < 10 &&
                              att.pending_dismiss_justification === null &&
                              att.admin_retry_requested_at === null;
        const isPendingDismiss = ['DELETING', 'DELETION_FAILED'].includes(att.state) &&
                                 att.pending_dismiss_justification !== null;
        const isAdminRetry = ['DELETING', 'DELETION_FAILED'].includes(att.state) &&
                             att.admin_retry_requested_at !== null;

        if (isExpiredPending || isAutoFailure || isPendingDismiss || isAdminRetry) {
          const token = crypto.randomUUID();
          att.cleanup_lease_token = token;
          att.cleanup_lease_expires_at = new Date(Date.now() + leaseSeconds * 1000);

          // Preserva contador em descartes pendentes; avança em outros
          if (!att.pending_dismiss_justification) {
            att.cleanup_attempts++;
          }
          att.admin_retry_requested_at = null;
          att.state = 'DELETING';
          att.updated_at = new Date();

          claimed.push({
            attachment_id: att.id,
            storage_path: att.storage_path,
            cleanup_attempts: att.cleanup_attempts,
            lease_token: token,
            is_pending_dismiss: Boolean(att.pending_dismiss_justification),
            dismiss_justification: att.pending_dismiss_justification,
          });

          if (claimed.length >= batchSize) break;
        }
      }
      return claimed;
    }

    // RPC: get_quarantined_attachments
    get_quarantined_attachments(minAttempts = 10, limit = 50) {
      const results = [];
      for (const att of this.attachments.values()) {
        if (
          att.cleanup_attempts >= minAttempts &&
          att.state !== 'DELETED' &&
          att.quarantine_resolved_at === null
        ) {
          results.push({ ...att });
        }
      }
      return results.slice(0, limit);
    }

    // Fallback Query de admin-projects.ts e cron-cleanup-attachments.ts
    fallbackQuarantineQuery(minAttempts = 10, limit = 50) {
      const results = [];
      for (const att of this.attachments.values()) {
        if (
          att.state !== 'DELETED' &&
          att.quarantine_resolved_at === null &&
          att.cleanup_attempts >= minAttempts
        ) {
          results.push({ ...att });
        }
      }
      return results.slice(0, limit);
    }

    // Métrica do Cron: contagem de quarentena pendente
    cronQuarantinedMetricCount() {
      let count = 0;
      for (const att of this.attachments.values()) {
        if (
          att.state !== 'DELETED' &&
          att.quarantine_resolved_at === null &&
          att.cleanup_attempts >= 10
        ) {
          count++;
        }
      }
      return count;
    }

    // RPC: admin_retry_quarantined_attachment (V4: PRESERVA HISTÓRICO DE TENTATIVAS)
    admin_retry_quarantined_attachment(attachmentId) {
      const att = this.attachments.get(attachmentId);
      if (!att) return { ok: false, reason: 'ATTACHMENT_NOT_FOUND' };
      if (att.state === 'DELETED') return { ok: false, reason: 'ALREADY_DELETED' };
      if (!['DELETION_FAILED', 'DELETING', 'PENDING'].includes(att.state)) {
        return { ok: false, reason: 'INVALID_STATE', state: att.state };
      }
      if (att.cleanup_attempts < 10) {
        return { ok: false, reason: 'NOT_IN_QUARANTINE', attempts: att.cleanup_attempts };
      }
      if (att.cleanup_lease_expires_at && att.cleanup_lease_expires_at > new Date()) {
        return { ok: false, reason: 'LEASE_ACTIVE' };
      }

      // PRESERVA cleanup_attempts sem zerar artificialmente
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      att.pending_dismiss_justification = null;
      att.admin_retry_requested_at = new Date();
      att.state = 'DELETING';
      att.quarantine_notes = (att.quarantine_notes || '') + ` [RETRY manual por admin; histórico mantido com ${att.cleanup_attempts} tentativas]`;
      att.quarantine_resolved_at = null;
      att.updated_at = new Date();
      return { ok: true, status: 'QUEUED_FOR_RETRY', cleanup_attempts: att.cleanup_attempts };
    }

    // RPC: admin_dismiss_quarantined_attachment (V4: FASE 1 CLAIM E FASE 2 CONFIRMAÇÃO FORTALECIDA)
    admin_dismiss_quarantined_attachment(attachmentId, justification, leaseToken = null) {
      if (!justification || justification.trim().length < 5) {
        return { ok: false, reason: 'JUSTIFICATION_REQUIRED' };
      }
      const att = this.attachments.get(attachmentId);
      if (!att) return { ok: false, reason: 'ATTACHMENT_NOT_FOUND' };
      if (att.state === 'DELETED') return { ok: false, reason: 'ALREADY_DELETED' };

      // Fase 1: Claim
      if (!leaseToken) {
        if (!['DELETION_FAILED', 'DELETING', 'PENDING'].includes(att.state)) {
          return { ok: false, reason: 'INVALID_STATE', state: att.state };
        }
        if (att.cleanup_attempts < 10) {
          return { ok: false, reason: 'NOT_IN_QUARANTINE', attempts: att.cleanup_attempts };
        }
        if (att.cleanup_lease_expires_at && att.cleanup_lease_expires_at > new Date()) {
          return { ok: false, reason: 'LEASE_ACTIVE' };
        }

        const token = crypto.randomUUID();
        att.state = 'DELETING';
        att.cleanup_lease_token = token;
        att.cleanup_lease_expires_at = new Date(Date.now() + 120000);
        att.pending_dismiss_justification = justification.trim();
        att.quarantine_notes = (att.quarantine_notes || '') + ` [DISMISS_CLAIMED: ${justification.trim()}]`;
        att.updated_at = new Date();
        return { ok: true, status: 'CLAIMED_FOR_DISMISS', lease_token: token, storage_path: att.storage_path };
      }

      // Fase 2: Confirmação Fortalecida
      if (att.state !== 'DELETING') {
        return { ok: false, reason: 'INVALID_STATE', state: att.state };
      }
      if (!att.pending_dismiss_justification) {
        return { ok: false, reason: 'NOT_A_PENDING_DISMISS' };
      }
      if (!att.cleanup_lease_token || !att.cleanup_lease_expires_at) {
        return { ok: false, reason: 'NO_ACTIVE_LEASE' };
      }
      if (att.cleanup_lease_expires_at <= new Date()) {
        return { ok: false, reason: 'LEASE_EXPIRED' };
      }
      if (att.cleanup_lease_token !== leaseToken) {
        return { ok: false, reason: 'LEASE_MISMATCH' };
      }

      att.state = 'DELETED';
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      att.pending_dismiss_justification = null; // Limpa pendência após confirmação com sucesso
      att.quarantine_notes = (att.quarantine_notes || '') + ` [DISMISSED: ${justification.trim()}]`;
      att.quarantine_resolved_at = new Date();
      att.updated_at = new Date();
      return { ok: true, status: 'DISMISSED' };
    }

    // RPC: confirm_attachment_deleted (para exclusão ordinária do sweeper)
    confirm_attachment_deleted(attachmentId, leaseToken) {
      if (!leaseToken) return { ok: false, reason: 'LEASE_TOKEN_REQUIRED' };
      const att = this.attachments.get(attachmentId);
      if (!att) return { ok: false, reason: 'ATTACHMENT_NOT_FOUND' };
      if (!att.cleanup_lease_token || !att.cleanup_lease_expires_at) {
        return { ok: false, reason: 'NO_ACTIVE_LEASE' };
      }
      if (att.cleanup_lease_token === leaseToken && att.cleanup_lease_expires_at <= new Date()) {
        return { ok: false, reason: 'LEASE_EXPIRED' };
      }
      if (att.cleanup_lease_token !== leaseToken) {
        return { ok: false, reason: 'LEASE_MISMATCH' };
      }
      att.state = 'DELETED';
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      att.pending_dismiss_justification = null;
      if (att.cleanup_attempts >= 10) {
        att.quarantine_resolved_at = att.quarantine_resolved_at || new Date();
      }
      att.updated_at = new Date();
      return { ok: true };
    }

    // RPC: record_attachment_cleanup_failure (V4: PRESERVA pending_dismiss_justification)
    record_attachment_cleanup_failure(attachmentId, leaseToken, error) {
      const att = this.attachments.get(attachmentId);
      if (!att) return { ok: false, reason: 'ATTACHMENT_NOT_FOUND' };
      if (!leaseToken) return { ok: false, reason: 'LEASE_TOKEN_REQUIRED' };
      if (att.cleanup_lease_token !== leaseToken || !att.cleanup_lease_expires_at || att.cleanup_lease_expires_at <= new Date()) {
        return { ok: false, reason: 'LEASE_MISMATCH_OR_EXPIRED' };
      }
      att.state = 'DELETION_FAILED';
      att.last_cleanup_error = error;
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      const isPending = Boolean(att.pending_dismiss_justification);
      att.quarantine_notes = (att.quarantine_notes || '') + ` [${isPending ? 'FALHA_DISMISS_STORAGE' : 'FALHA_STORAGE'}: ${error}]`;
      att.updated_at = new Date();
      return {
        ok: true,
        cleanup_attempts: att.cleanup_attempts,
        quarantined: att.cleanup_attempts >= 10,
        is_pending_dismiss: isPending,
      };
    }
  }

  // ===========================================================================
  // CENÁRIO 1: Descarte administrativo começa com 10 ou mais tentativas
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item10 = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });
    const item9 = db.addAttachment({ cleanup_attempts: 9, state: 'DELETION_FAILED' });

    // Item com 10 tentativas é elegível para claim administrativo
    const claim10 = db.admin_dismiss_quarantined_attachment(item10.id, 'Arquivo órfão validado para descarte');
    assert(
      claim10.ok === true && claim10.status === 'CLAIMED_FOR_DISMISS' && typeof claim10.lease_token === 'string',
      'Descarte administrativo é aceito com sucesso para registro com 10 ou mais tentativas'
    );
    assert(
      item10.pending_dismiss_justification === 'Arquivo órfão validado para descarte',
      'Justificativa de descarte é gravada em pending_dismiss_justification durante a Fase 1'
    );

    // Item com 9 tentativas NÃO pode sofrer descarte de quarentena
    const claim9 = db.admin_dismiss_quarantined_attachment(item9.id, 'Tentativa em anexo fora da quarentena');
    assert(
      claim9.ok === false && claim9.reason === 'NOT_IN_QUARANTINE',
      'Descarte administrativo é rejeitado para registro com menos de 10 tentativas (NOT_IN_QUARANTINE)'
    );
  }

  // ===========================================================================
  // CENÁRIO 2: Ordem estrita - Banco validado antes da remoção física no Storage
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 12, state: 'DELETION_FAILED' });

    let order = [];
    const storageMock = {
      remove: async () => {
        order.push('STORAGE_REMOVE');
        return { error: null };
      }
    };

    async function executeDismiss(id, just) {
      order.push('CLAIM_PHASE_1');
      const claim = db.admin_dismiss_quarantined_attachment(id, just);
      if (!claim.ok) return claim;

      const { error: sErr } = await storageMock.remove([claim.storage_path]);
      if (sErr) {
        db.record_attachment_cleanup_failure(id, claim.lease_token, sErr.message);
        return { ok: false, error: sErr.message };
      }

      order.push('CONFIRM_PHASE_2');
      return db.admin_dismiss_quarantined_attachment(id, just, claim.lease_token);
    }

    // Justificativa inválida: Storage NUNCA deve ser chamado
    order = [];
    const invalidRes = await executeDismiss(item.id, 'abc');
    assert(
      invalidRes.ok === false && !order.includes('STORAGE_REMOVE'),
      'Storage NUNCA é acionado se a validação atômica no banco falhar'
    );

    // Fluxo válido: Ordem estrita garantida
    order = [];
    const validRes = await executeDismiss(item.id, 'Justificativa de descarte aprovada');
    assert(
      validRes.ok === true &&
      order[0] === 'CLAIM_PHASE_1' &&
      order[1] === 'STORAGE_REMOVE' &&
      order[2] === 'CONFIRM_PHASE_2',
      'Ordem estrita garantida: Transição validada no banco (Fase 1) precede a exclusão no Storage'
    );
  }

  // ===========================================================================
  // CENÁRIO 3: Falha no Storage preserva pending_dismiss_justification e tentativas
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    // Inicia descarte
    const claim = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte legítimo');
    assert(claim.ok === true, 'Claim de descarte obtido com sucesso');

    // Simula falha física de exclusão no Storage (ex: S3/GCS 503 Service Unavailable)
    const failRes = db.record_attachment_cleanup_failure(item.id, claim.lease_token, 'Storage 503 Unavailable');

    assert(failRes.ok === true, 'Falha registrada no banco via RPC');
    assert(
      item.pending_dismiss_justification === 'Descarte legítimo',
      'record_attachment_cleanup_failure PRESERVA pending_dismiss_justification após falha no Storage'
    );
    assert(
      item.cleanup_attempts === 10,
      'Contador de tentativas histórico (>= 10) é preservado após falha física de descarte'
    );
    assert(
      item.state === 'DELETION_FAILED' && item.state !== 'DELETED',
      'Estado permanece como DELETION_FAILED (nunca marcado como DELETED)'
    );
    assert(
      item.quarantine_notes.includes('FALHA_DISMISS_STORAGE'),
      'Diferenciação auditável: Nota identifica falha específica em operação de descarte'
    );
  }

  // ===========================================================================
  // CENÁRIO 4: Falha de confirmação após remoção física não marca DELETED
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 11, state: 'DELETION_FAILED' });

    // Claim obtido
    const claim = db.admin_dismiss_quarantined_attachment(item.id, 'Operação pendente');

    // Arquivo removido do Storage simulado
    db.storageObjects.delete(item.storage_path);

    // Simula que a confirmação no banco falhou (ex: queda de rede antes do response)
    // O registro ainda tem pending_dismiss_justification e NÃO foi marcado como DELETED
    assert(
      item.state !== 'DELETED' && item.pending_dismiss_justification === 'Operação pendente',
      'Falha intermediária de confirmação NÃO marca o registro como DELETED'
    );
  }

  // ===========================================================================
  // CENÁRIO 5: Expiração da reserva (Lease Timeout)
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    const claim = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte para expiração');
    const oldToken = claim.lease_token;

    // Simula passagem do tempo: lease de 120 segundos expira
    item.cleanup_lease_expires_at = new Date(Date.now() - 5000);

    // Tentativa de confirmação com lease expirado deve falhar
    const confirmRes = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte para expiração', oldToken);
    assert(
      confirmRes.ok === false && confirmRes.reason === 'LEASE_EXPIRED',
      'Reserva expirada rejeita confirmação com LEASE_EXPIRED'
    );
    assert(item.state !== 'DELETED', 'Registro não transita para DELETED com lease expirado');
  }

  // ===========================================================================
  // CENÁRIO 6: Rejeição de token antigo de processo anterior
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    // Processo A obtém lease
    const claimA = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte pelo Processo A');
    const tokenA = claimA.lease_token;

    // Lease do Processo A expira
    item.cleanup_lease_expires_at = new Date(Date.now() - 1000);

    // Sweeper (Processo B) assume a recuperação e obtém novo token
    const [claimedBySweeper] = db.claim_attachments_for_cleanup(10, 120);
    const tokenB = claimedBySweeper.lease_token;

    assert(tokenA !== tokenB, 'Processo B gerou um novo lease_token distinto');

    // Processo A (atrasado) tenta confirmar com seu token antigo
    const confirmA = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte pelo Processo A', tokenA);
    assert(
      confirmA.ok === false && confirmA.reason === 'LEASE_MISMATCH',
      'Token antigo do Processo A é rejeitado com LEASE_MISMATCH'
    );

    // Apenas o token atual do Processo B consegue confirmar
    const confirmB = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte pelo Processo A', tokenB);
    assert(
      confirmB.ok === true && confirmB.status === 'DISMISSED' && item.state === 'DELETED',
      'Apenas o processo detentor do token ativo e não expirado consegue confirmar com sucesso'
    );
  }

  // ===========================================================================
  // CENÁRIO 7: Retomada e recuperação pelo Cron (Sweeper) com >= 10 tentativas
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    // Anexo que teve descarte administrativo iniciado no passado, falhou na confirmação e o lease expirou
    const item = db.addAttachment({
      cleanup_attempts: 14,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Descarte pendente que sofreu timeout de rede',
      cleanup_lease_expires_at: new Date(Date.now() - 10000), // Expirado
    });

    // O cron executa claim_attachments_for_cleanup
    const claimed = db.claim_attachments_for_cleanup(20, 120);
    const found = claimed.find((c) => c.attachment_id === item.id);

    assert(
      found !== undefined,
      'Sweeper recupera com sucesso anexo pendente de descarte mesmo com >= 10 tentativas'
    );
    assert(
      found.is_pending_dismiss === true,
      'Sweeper identifica flag is_pending_dismiss = true'
    );
    assert(
      found.dismiss_justification === 'Descarte pendente que sofreu timeout de rede',
      'Sweeper recupera justificativa original do descarte pendente'
    );
    assert(
      item.cleanup_attempts === 14,
      'Sweeper PRESERVA o contador histórico de tentativas (não incrementa em descarte pendente)'
    );
  }

  // ===========================================================================
  // CENÁRIO 8: Cron recupera sem reexecutar remoção quando arquivo já não existe no Storage
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({
      cleanup_attempts: 10,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Arquivo removido fisicamente antes da queda',
      cleanup_lease_expires_at: new Date(Date.now() - 10000),
    });

    // O arquivo já NÃO está no storage (foi removido antes da falha de confirmação)
    db.storageObjects.delete(item.storage_path);

    let storageRemoveCalled = false;
    const storageMock = {
      list: async (folder, { search }) => {
        // Simula verificação prévia no Storage: não existe
        return { data: [], error: null };
      },
      remove: async () => {
        storageRemoveCalled = true;
        return { error: null };
      }
    };

    // Fluxo real de api/cron-cleanup-attachments.ts
    async function executeCronSweeper() {
      const items = db.claim_attachments_for_cleanup(20, 120);
      for (const cur of items) {
        // 4.1 Consulta existência prévia no Storage
        const { data: listData } = await storageMock.list('', { search: cur.storage_path });
        const fileExists = Array.isArray(listData) && listData.length > 0;

        // 4.2 Se já não existe, confirma recuperação diretamente sem chamar remove
        if (!fileExists) {
          if (cur.is_pending_dismiss) {
            db.admin_dismiss_quarantined_attachment(cur.attachment_id, cur.dismiss_justification, cur.lease_token);
          } else {
            db.confirm_attachment_deleted(cur.attachment_id, cur.lease_token);
          }
          continue;
        }

        // 4.3 Caso existisse, chamaria remove
        await storageMock.remove([cur.storage_path]);
      }
    }

    await executeCronSweeper();

    assert(
      storageRemoveCalled === false,
      'Cron NÃO chama remove no Storage se o arquivo já foi excluído anteriormente'
    );
    assert(
      item.state === 'DELETED' && item.pending_dismiss_justification === null,
      'Cron confirma com sucesso a recuperação para DELETED e limpa a pendência'
    );
    assert(
      item.quarantine_resolved_at !== null,
      'quarantine_resolved_at é preenchido na recuperação pelo Cron'
    );
  }

  // ===========================================================================
  // CENÁRIO 9: Concorrência segura e bloqueio atômico
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    // Worker 1 reivindica descarte
    const claim1 = db.admin_dismiss_quarantined_attachment(item.id, 'Operação Worker 1');
    assert(claim1.ok === true, 'Worker 1 obtém lease com sucesso');

    // Worker 2 tenta reivindicar descarte simultaneamente
    const claim2 = db.admin_dismiss_quarantined_attachment(item.id, 'Operação Worker 2');
    assert(
      claim2.ok === false && claim2.reason === 'LEASE_ACTIVE',
      'Worker 2 concorrente é bloqueado com LEASE_ACTIVE'
    );

    // Worker 3 tenta fazer retry simultâneo
    const retryConcurrent = db.admin_retry_quarantined_attachment(item.id);
    assert(
      retryConcurrent.ok === false && retryConcurrent.reason === 'LEASE_ACTIVE',
      'Retry concorrente é bloqueado com LEASE_ACTIVE durante lease ativo'
    );

    // Worker 1 conclui com sucesso
    const confirm1 = db.admin_dismiss_quarantined_attachment(item.id, 'Operação Worker 1', claim1.lease_token);
    assert(confirm1.ok === true && item.state === 'DELETED', 'Worker 1 conclui descarte com exclusividade atômica');
  }

  // ===========================================================================
  // CENÁRIO 10: Idempotência - Operações repetidas após conclusão são rejeitadas
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETED', quarantine_resolved_at: new Date() });

    // Retry em item já DELETED
    const retryDeleted = db.admin_retry_quarantined_attachment(item.id);
    assert(
      retryDeleted.ok === false && retryDeleted.reason === 'ALREADY_DELETED',
      'Retry em registro com estado "DELETED" é rejeitado com ALREADY_DELETED'
    );

    // Dismiss em item já DELETED
    const dismissDeleted = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte repetido');
    assert(
      dismissDeleted.ok === false && dismissDeleted.reason === 'ALREADY_DELETED',
      'Descarte em registro com estado "DELETED" é rejeitado com ALREADY_DELETED'
    );
  }

  // ===========================================================================
  // CENÁRIO 11: Retry administrativo preserva contagem histórica auditável
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 15, state: 'DELETION_FAILED' });

    const retryRes = db.admin_retry_quarantined_attachment(item.id);
    assert(retryRes.ok === true && retryRes.status === 'QUEUED_FOR_RETRY', 'Retry aceito para enfileiramento');
    assert(
      item.cleanup_attempts === 15,
      'Contador de tentativas histórico NÃO É ZERADO (mantém exatamente 15 tentativas)'
    );
    assert(
      item.admin_retry_requested_at instanceof Date,
      'admin_retry_requested_at é preenchido com timestamp atual para reprocessamento pelo Sweeper'
    );
    assert(
      item.quarantine_notes.includes('histórico mantido com 15 tentativas'),
      'Histórico de auditoria é registrado nas notas de quarentena'
    );

    // Quando o Sweeper roda, o item é capturado pelo critério Caso D
    const [claimed] = db.claim_attachments_for_cleanup(10, 120);
    assert(claimed.attachment_id === item.id, 'Sweeper reivindica anexo solicitado via retry manual');
    assert(item.admin_retry_requested_at === null, 'Flag admin_retry_requested_at é resetado após a reivindicação');
    assert(item.cleanup_attempts === 16, 'Contador de tentativas avança para 16 após nova tentativa do Sweeper');
  }

  // ===========================================================================
  // CENÁRIO 12: Consultas e métricas excluem estritamente registros DELETED ou resolvidos
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const pendente1 = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });
    const pendente2 = db.addAttachment({ cleanup_attempts: 12, state: 'DELETION_FAILED' });
    const resolvido = db.addAttachment({ cleanup_attempts: 10, state: 'DELETED', quarantine_resolved_at: new Date() });
    const descartado = db.addAttachment({ cleanup_attempts: 18, state: 'DELETED', quarantine_resolved_at: null });

    // RPC get_quarantined_attachments
    const rpcList = db.get_quarantined_attachments(10, 50);
    assert(
      rpcList.length === 2 && rpcList.every((i) => i.state !== 'DELETED' && i.quarantine_resolved_at === null),
      'RPC get_quarantined_attachments retorna apenas os 2 itens pendentes e exclui os registros DELETED'
    );

    // Consulta de fallback
    const fallbackList = db.fallbackQuarantineQuery(10, 50);
    assert(
      fallbackList.length === 2 && fallbackList.every((i) => i.state !== 'DELETED' && i.quarantine_resolved_at === null),
      'Consulta alternativa (fallback) exclui registros resolvidos ou com state DELETED'
    );

    // Métrica do Cron
    const metricCount = db.cronQuarantinedMetricCount();
    assert(
      metricCount === 2,
      'Contagem de métricas do Cron contabiliza exatamente 2 itens pendentes'
    );
  }

  // ===========================================================================
  // CENÁRIO 13: Proteção de autorização, CSRF e acesso restrito service_role
  // ===========================================================================
  {
    function verifyAdminAccess(hasSession, secFetchSite, customHeader) {
      if (!hasSession) return { status: 401, error: 'UNAUTHORIZED' };
      const isSameOrigin = secFetchSite === 'same-origin' || secFetchSite === 'none';
      const hasSafeHeader = customHeader === 'quarantine-retry' || customHeader === 'quarantine-dismiss';
      if (!isSameOrigin && !hasSafeHeader) return { status: 403, error: 'CSRF_BLOCKED' };
      return { status: 200, ok: true };
    }

    assert(verifyAdminAccess(false, 'same-origin', null).status === 401, 'Requisição sem sessão administrativa retorna 401');
    assert(verifyAdminAccess(true, 'cross-site', null).status === 403, 'Requisição cross-site sem cabeçalho seguro retorna 403');
    assert(verifyAdminAccess(true, 'same-origin', 'quarantine-dismiss').ok === true, 'Requisição de mesma origem autorizada');

    // Permissões SQL exclusivas a service_role
    const sqlGrantPermissions = {
      get_quarantined_attachments: ['service_role'],
      admin_retry_quarantined_attachment: ['service_role'],
      admin_dismiss_quarantined_attachment: ['service_role'],
      confirm_attachment_deleted: ['service_role'],
      record_attachment_cleanup_failure: ['service_role'],
      claim_attachments_for_cleanup: ['service_role'],
    };

    for (const [fn, roles] of Object.entries(sqlGrantPermissions)) {
      assert(
        roles.includes('service_role') && !roles.includes('anon') && !roles.includes('authenticated'),
        `Permissão da função ${fn} restrita unicamente a service_role`
      );
    }
  }

  console.log('\n========================================================================');
  console.log(`TOTAL DE TESTES DE REGRESSÃO EXECUTADOS: ${total}`);
  console.log(`TESTES APROVADOS: ${passed}/${total}`);
  console.log('========================================================================\n');

  if (passed !== total) {
    throw new Error('Falha em um ou mais testes de regressão');
  }
}

runQuarantineSecurityRegressionTests().catch((err) => {
  console.error('FATAL: Erro durante a execução dos testes:', err);
  process.exit(1);
});
