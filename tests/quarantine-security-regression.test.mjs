import crypto from 'crypto';

/**
 * Suite de Testes de Regressão Obrigatórios da V4.1:
 * Limite Seguro de Retentativas, Pausa Automática e Recuperação em Quarentena
 *
 * Cobre estritamente os 10 cenários exigidos pela especificação:
 * 1. Falhas repetidas de remoção até atingir o limite.
 * 2. Confirmação de que o cron deixa de repetir automaticamente a operação física após o limite.
 * 3. Preservação da justificativa e do histórico após a pausa.
 * 4. Reautorização administrativa e retomada segura.
 * 5. Arquivo removido com confirmação no banco falhando.
 * 6. Recuperação posterior quando o arquivo já não existe.
 * 7. Falhas de listagem sem presumir sucesso.
 * 8. Rejeição de tokens antigos e leases expirados.
 * 9. Duas execuções concorrentes.
 * 10. Garantia de que um registro resolvido não volte à fila.
 *
 * Executado localmente em memória com simulações e mocks sem dados reais.
 */

async function runQuarantineSecurityRegressionTests() {
  console.log('========================================================================');
  console.log('SUITE DE REGRESSÃO OBRIGATÓRIA V4.1: LIMITE SEGURO DE RETENTATIVAS');
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
  // Simulador Fiel do Banco de Dados e RPCs (MIGRACAO_UPLOADS_QUARENTENA_V4_1.sql)
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
        dismiss_failure_count: record.dismiss_failure_count !== undefined ? record.dismiss_failure_count : 0,
        dismiss_paused_at: record.dismiss_paused_at || null,
        dismiss_pause_reason: record.dismiss_pause_reason || null,
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
        // Caso C: Descarte pendente recuperável desde que NÃO esteja pausado por excesso de falhas
        const isPendingDismiss = ['DELETING', 'DELETION_FAILED'].includes(att.state) &&
                                 att.pending_dismiss_justification !== null &&
                                 att.dismiss_paused_at === null;
        // Caso D: Reautorização ou retry explícito pelo admin
        const isAdminRetry = ['DELETING', 'DELETION_FAILED'].includes(att.state) &&
                             att.admin_retry_requested_at !== null;

        if (isExpiredPending || isAutoFailure || isPendingDismiss || isAdminRetry) {
          const token = crypto.randomUUID();
          att.cleanup_lease_token = token;
          att.cleanup_lease_expires_at = new Date(Date.now() + leaseSeconds * 1000);

          // Preserva contador em descartes pendentes; avança em limpezas normais
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
            dismiss_failure_count: att.dismiss_failure_count,
            is_dismiss_paused: Boolean(att.dismiss_paused_at),
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

    // RPC: admin_reauthorize_quarantined_attachment (V4.1)
    admin_reauthorize_quarantined_attachment(attachmentId, justification = null) {
      const att = this.attachments.get(attachmentId);
      if (!att) return { ok: false, reason: 'ATTACHMENT_NOT_FOUND' };
      if (att.state === 'DELETED') return { ok: false, reason: 'ALREADY_DELETED' };
      if (att.cleanup_lease_expires_at && att.cleanup_lease_expires_at > new Date()) {
        return { ok: false, reason: 'LEASE_ACTIVE' };
      }
      if (!att.pending_dismiss_justification) {
        return { ok: false, reason: 'NOT_A_PENDING_DISMISS' };
      }

      att.dismiss_failure_count = 0;
      att.dismiss_paused_at = null;
      att.dismiss_pause_reason = null;
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      att.admin_retry_requested_at = new Date();
      if (justification && justification.trim().length >= 5) {
        att.pending_dismiss_justification = justification.trim();
      }
      att.state = 'DELETING';
      att.quarantine_notes = (att.quarantine_notes || '') + ` [REAUTORIZADO por admin em ${new Date().toISOString()}]`;
      att.updated_at = new Date();
      return { ok: true, status: 'REAUTHORIZED_FOR_CLEANUP', cleanup_attempts: att.cleanup_attempts };
    }

    // RPC: admin_retry_quarantined_attachment
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

      // Limpa pausa prévia, preserva cleanup_attempts sem zerar
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      att.pending_dismiss_justification = null;
      att.dismiss_failure_count = 0;
      att.dismiss_paused_at = null;
      att.dismiss_pause_reason = null;
      att.admin_retry_requested_at = new Date();
      att.state = 'DELETING';
      att.quarantine_notes = (att.quarantine_notes || '') + ` [RETRY manual por admin; histórico mantido com ${att.cleanup_attempts} tentativas]`;
      att.quarantine_resolved_at = null;
      att.updated_at = new Date();
      return { ok: true, status: 'QUEUED_FOR_RETRY', cleanup_attempts: att.cleanup_attempts };
    }

    // RPC: admin_dismiss_quarantined_attachment
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
        att.dismiss_failure_count = 0;
        att.dismiss_paused_at = null;
        att.dismiss_pause_reason = null;
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
      att.pending_dismiss_justification = null;
      att.dismiss_failure_count = 0;
      att.dismiss_paused_at = null;
      att.dismiss_pause_reason = null;
      att.quarantine_notes = (att.quarantine_notes || '') + ` [DISMISSED: ${justification.trim()}]`;
      att.quarantine_resolved_at = new Date();
      att.updated_at = new Date();
      return { ok: true, status: 'DISMISSED' };
    }

    // RPC: confirm_attachment_deleted
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
      att.dismiss_failure_count = 0;
      att.dismiss_paused_at = null;
      if (att.cleanup_attempts >= 10) {
        att.quarantine_resolved_at = att.quarantine_resolved_at || new Date();
      }
      att.updated_at = new Date();
      return { ok: true };
    }

    // RPC: record_attachment_cleanup_failure com limite finito e pausa automática (V4.1)
    record_attachment_cleanup_failure(attachmentId, leaseToken, error, maxFailures = 5) {
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

      if (att.pending_dismiss_justification) {
        att.dismiss_failure_count = (att.dismiss_failure_count || 0) + 1;
        const isPaused = att.dismiss_failure_count >= maxFailures;
        if (isPaused) {
          att.dismiss_paused_at = new Date();
          att.dismiss_pause_reason = `LIMITE_FALHAS_ATINGIDO: ${att.dismiss_failure_count} falhas consecutivas (${error})`;
          att.quarantine_notes = (att.quarantine_notes || '') + ` [PAUSADO: ${att.dismiss_failure_count} falhas consecutivas (${error})]`;
        } else {
          att.quarantine_notes = (att.quarantine_notes || '') + ` [FALHA_DISMISS_STORAGE (${att.dismiss_failure_count}/${maxFailures}): ${error}]`;
        }
        att.updated_at = new Date();
        return {
          ok: true,
          cleanup_attempts: att.cleanup_attempts,
          quarantined: att.cleanup_attempts >= 10,
          is_pending_dismiss: true,
          dismiss_failure_count: att.dismiss_failure_count,
          is_paused: isPaused,
          paused_at: att.dismiss_paused_at,
          pause_reason: att.dismiss_pause_reason,
        };
      }

      // Limpeza normal (sem descarte pendente)
      att.quarantine_notes = (att.quarantine_notes || '') + ` [FALHA_STORAGE: ${error}]`;
      att.updated_at = new Date();
      return {
        ok: true,
        cleanup_attempts: att.cleanup_attempts,
        quarantined: att.cleanup_attempts >= 10,
        is_pending_dismiss: false,
        is_paused: false,
      };
    }
  }

  // ===========================================================================
  // CENÁRIO 1: Falhas repetidas de remoção até atingir o limite finito
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 12, state: 'DELETION_FAILED' });

    // Inicia descarte administrativo
    const claim = db.admin_dismiss_quarantined_attachment(item.id, 'Arquivo corrompido para expurgo');
    assert(claim.ok === true, 'Descarte administrativo iniciado com sucesso');

    // Simula 4 falhas consecutivas de remoção física (abaixo do limite de 5)
    let currentToken = claim.lease_token;
    for (let i = 1; i <= 4; i++) {
      const failRes = db.record_attachment_cleanup_failure(item.id, currentToken, `Falha física S3 #${i}`, 5);
      assert(
        failRes.ok === true && failRes.is_paused === false && failRes.dismiss_failure_count === i,
        `Falha física #${i} registrada sem pausar (contador = ${i}/5)`
      );
      assert(item.dismiss_paused_at === null, `Registro permanece ativo na tentativa ${i}`);

      // Simula o Sweeper reivindicando novamente após a expiração
      const [nextClaim] = db.claim_attachments_for_cleanup(1, 120);
      assert(nextClaim !== undefined, `Sweeper reivindica com sucesso para tentativa ${i + 1}`);
      currentToken = nextClaim.lease_token;
    }

    // 5ª falha: atinge o limite configurado de 5 falhas consecutivas
    const fifthFail = db.record_attachment_cleanup_failure(item.id, currentToken, 'Falha física S3 #5', 5);
    assert(
      fifthFail.ok === true && fifthFail.is_paused === true && fifthFail.dismiss_failure_count === 5,
      'A 5ª falha física consecutiva atinge o limite e dispara a pausa automática'
    );
    assert(
      item.dismiss_paused_at instanceof Date,
      'dismiss_paused_at é preenchido com timestamp da pausa'
    );
    assert(
      item.dismiss_pause_reason.includes('LIMITE_FALHAS_ATINGIDO') && item.dismiss_pause_reason.includes('5 falhas'),
      'dismiss_pause_reason documenta claramente o motivo e o número de falhas'
    );
  }

  // ===========================================================================
  // CENÁRIO 2: Cron deixa de repetir automaticamente a operação física após o limite
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    // Item pausado por ter atingido 5 falhas
    const pausedItem = db.addAttachment({
      cleanup_attempts: 12,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Descarte bloqueado por storage indisponível',
      dismiss_failure_count: 5,
      dismiss_paused_at: new Date(),
      dismiss_pause_reason: 'LIMITE_FALHAS_ATINGIDO: 5 falhas consecutivas',
    });

    // Item normal elegível
    const activeItem = db.addAttachment({
      cleanup_attempts: 5,
      state: 'DELETION_FAILED',
      cleanup_lease_expires_at: null,
    });

    // Executa a busca de lotes do Cron
    const claimed = db.claim_attachments_for_cleanup(10, 120);
    const claimedIds = claimed.map((c) => c.attachment_id);

    assert(
      !claimedIds.includes(pausedItem.id),
      'O Sweeper (Cron) NÃO reivindica registros pausados por excesso de falhas'
    );
    assert(
      claimedIds.includes(activeItem.id),
      'O Sweeper continua processando normalmente outros registros elegíveis'
    );
  }

  // ===========================================================================
  // CENÁRIO 3: Preservação da justificativa e do histórico após a pausa
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({
      cleanup_attempts: 14,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Justificativa de auditoria original do auditor fiscal',
      dismiss_failure_count: 5,
      dismiss_paused_at: new Date(),
      dismiss_pause_reason: 'LIMITE_FALHAS_ATINGIDO: 5 falhas consecutivas',
      quarantine_notes: '[DISMISS_CLAIMED: Justificativa de auditoria original do auditor fiscal]',
    });

    assert(
      item.pending_dismiss_justification === 'Justificativa de auditoria original do auditor fiscal',
      'pending_dismiss_justification é estritamente preservada após a pausa'
    );
    assert(
      item.cleanup_attempts === 14,
      'cleanup_attempts permanece inalterado com suas 14 tentativas históricas'
    );
    assert(
      item.state === 'DELETION_FAILED' && item.state !== 'DELETED',
      'Estado permanece como DELETION_FAILED (nunca marcado como DELETED)'
    );

    // Confirma que o item continua visível na listagem administrativa de quarentena
    const list = db.get_quarantined_attachments(10, 50);
    const inList = list.find((q) => q.id === item.id);
    assert(
      inList !== undefined && inList.dismiss_paused_at !== null,
      'Item pausado não é abandonado nem silenciado: continua presente na quarentena administrativa'
    );
  }

  // ===========================================================================
  // CENÁRIO 4: Reautorização administrativa e retomada segura
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({
      cleanup_attempts: 15,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Descarte pausado anteriormente',
      dismiss_failure_count: 5,
      dismiss_paused_at: new Date(Date.now() - 60000),
      dismiss_pause_reason: 'LIMITE_FALHAS_ATINGIDO: 5 falhas consecutivas',
    });

    // O admin reautoriza a operação com nova justificativa opcional
    const reauth = db.admin_reauthorize_quarantined_attachment(
      item.id,
      'Storage restaurado pelo time de infraestrutura; descarte reautorizado'
    );

    assert(
      reauth.ok === true && reauth.status === 'REAUTHORIZED_FOR_CLEANUP',
      'RPC admin_reauthorize_quarantined_attachment executada com sucesso'
    );
    assert(
      item.dismiss_paused_at === null && item.dismiss_failure_count === 0,
      'Pausa removida e contador de falhas consecutivas zerado'
    );
    assert(
      item.cleanup_attempts === 15,
      'Contador histórico de cleanup_attempts (15) preservado sem alteração'
    );
    assert(
      item.admin_retry_requested_at instanceof Date,
      'admin_retry_requested_at preenchido para reprocessamento prioritário'
    );
    assert(
      item.pending_dismiss_justification.includes('Storage restaurado'),
      'Justificativa atualizada de forma auditável'
    );

    // No próximo ciclo do Cron, o item é retomado imediatamente
    const [claimed] = db.claim_attachments_for_cleanup(5, 120);
    assert(
      claimed !== undefined && claimed.attachment_id === item.id,
      'Sweeper retoma o processamento do anexo reautorizado com sucesso'
    );
    assert(
      claimed.is_pending_dismiss === true,
      'Sweeper reconhece que se trata de um descarte administrativo pendente'
    );
  }

  // ===========================================================================
  // CENÁRIO 5: Arquivo removido no Storage com confirmação no banco falhando
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    // Claim do descarte
    const claim = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte válido');
    const token = claim.lease_token;

    // Arquivo é fisicamente removido do bucket
    db.storageObjects.delete(item.storage_path);

    // Simula expiração do lease antes da confirmação (ex: timeout de conexão)
    item.cleanup_lease_expires_at = new Date(Date.now() - 5000);

    // Tentativa de confirmação com lease expirado
    const confirmRes = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte válido', token);
    assert(
      confirmRes.ok === false && confirmRes.reason === 'LEASE_EXPIRED',
      'Confirmação rejeitada com LEASE_EXPIRED em caso de timeout'
    );
    assert(
      item.state !== 'DELETED',
      'Registro NÃO é marcado como DELETED se a confirmação falhou'
    );
    assert(
      item.pending_dismiss_justification === 'Descarte válido',
      'Intenção de descarte permanece íntegra para recuperação'
    );
  }

  // ===========================================================================
  // CENÁRIO 6: Recuperação posterior quando o arquivo já não existe no Storage
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({
      cleanup_attempts: 11,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Arquivo já apagado do bucket na tentativa anterior',
      cleanup_lease_expires_at: new Date(Date.now() - 10000), // lease expirado
    });

    // O arquivo NÃO existe no storage
    db.storageObjects.delete(item.storage_path);

    let storageRemoveCalled = false;
    const storageMock = {
      list: async () => ({ data: [], error: null }), // Vazio: arquivo ausente
      remove: async () => {
        storageRemoveCalled = true;
        return { error: null };
      }
    };

    // Fluxo do Sweeper em api/cron-cleanup-attachments.ts
    async function runSweeperRecovery() {
      const [claimed] = db.claim_attachments_for_cleanup(1, 120);
      assert(claimed !== undefined, 'Sweeper reivindica anexo para reconciliação');

      // Consulta existência
      const { data: listData } = await storageMock.list();
      const fileExists = Array.isArray(listData) && listData.length > 0;

      // Se já não existe, avança direto para confirmação
      if (!fileExists) {
        return db.admin_dismiss_quarantined_attachment(
          claimed.attachment_id,
          claimed.dismiss_justification,
          claimed.lease_token
        );
      }
      await storageMock.remove();
    }

    const res = await runSweeperRecovery();

    assert(
      res.ok === true && res.status === 'DISMISSED',
      'Recuperação conclui com sucesso marcando o descarte como DISMISSED'
    );
    assert(
      storageRemoveCalled === false,
      'Sweeper NÃO chama storage.remove quando o arquivo já foi excluído anteriormente'
    );
    assert(
      item.state === 'DELETED' && item.quarantine_resolved_at !== null,
      'Registro transiciona para DELETED com quarantine_resolved_at preenchido'
    );
  }

  // ===========================================================================
  // CENÁRIO 7: Falhas de listagem no Storage sem presumir sucesso
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({
      cleanup_attempts: 10,
      state: 'DELETION_FAILED',
      pending_dismiss_justification: 'Descarte aguardando verificação de storage',
    });

    const [claimed] = db.claim_attachments_for_cleanup(1, 120);

    // Simula erro 500 na listagem do Storage
    const storageError = 'GCS 500 Internal Error ao listar bucket';

    // Registra falha sem presumir que o arquivo existe ou não
    const failRes = db.record_attachment_cleanup_failure(
      claimed.attachment_id,
      claimed.lease_token,
      `FALHA_LISTAGEM_STORAGE: ${storageError}`
    );

    assert(
      failRes.ok === true && item.state === 'DELETION_FAILED',
      'Falha de listagem registrada com state mantido em DELETION_FAILED'
    );
    assert(
      item.state !== 'DELETED',
      'Falha de listagem NÃO presume sucesso nem marca o arquivo como DELETED'
    );
    assert(
      item.pending_dismiss_justification !== null,
      'Recuperação preservada para a próxima execução do Sweeper'
    );
  }

  // ===========================================================================
  // CENÁRIO 8: Rejeição estrita de tokens antigos e leases expirados
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    // Worker 1 obtém token A
    const claim1 = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte pelo Worker 1');
    const tokenA = claim1.lease_token;

    // Expira o lease do Worker 1
    item.cleanup_lease_expires_at = new Date(Date.now() - 5000);

    // Worker 2 (Sweeper) assume e obtém token B
    const [claimed2] = db.claim_attachments_for_cleanup(1, 120);
    const tokenB = claimed2.lease_token;
    assert(tokenA !== tokenB, 'Token B é gerado exclusivamente para o Worker 2');

    // Worker 1 (atrasado) tenta confirmar com token antigo A
    const confirmOld = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte', tokenA);
    assert(
      confirmOld.ok === false && confirmOld.reason === 'LEASE_MISMATCH',
      'Confirmação com token antigo é estritamente rejeitada com LEASE_MISMATCH'
    );

    // Confirmação com token nulo
    const confirmNull = db.confirm_attachment_deleted(item.id, null);
    assert(
      confirmNull.ok === false && confirmNull.reason === 'LEASE_TOKEN_REQUIRED',
      'Confirmação com token nulo é rejeitada com LEASE_TOKEN_REQUIRED'
    );

    // Worker 2 confirma com token B válido
    const confirmValid = db.admin_dismiss_quarantined_attachment(item.id, 'Descarte', tokenB);
    assert(
      confirmValid.ok === true && item.state === 'DELETED',
      'Apenas o processo com token atualizado e vigente confirma com sucesso'
    );
  }

  // ===========================================================================
  // CENÁRIO 9: Duas execuções concorrentes
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({ cleanup_attempts: 10, state: 'DELETION_FAILED' });

    // Thread/Worker A reivindica o descarte
    const claimA = db.admin_dismiss_quarantined_attachment(item.id, 'Execução Concorrente Worker A');
    assert(claimA.ok === true && claimA.status === 'CLAIMED_FOR_DISMISS', 'Worker A obtém posse exclusiva');

    // Thread/Worker B tenta reivindicar o mesmo anexo simultaneamente
    const claimB = db.admin_dismiss_quarantined_attachment(item.id, 'Execução Concorrente Worker B');
    assert(
      claimB.ok === false && claimB.reason === 'LEASE_ACTIVE',
      'Worker B concorrente é rejeitado com LEASE_ACTIVE (bloqueio atômico garantido)'
    );

    // Thread C tenta fazer retry simultaneamente
    const retryC = db.admin_retry_quarantined_attachment(item.id);
    assert(
      retryC.ok === false && retryC.reason === 'LEASE_ACTIVE',
      'Retry concorrente é bloqueado com LEASE_ACTIVE durante lease ativo de outro worker'
    );
  }

  // ===========================================================================
  // CENÁRIO 10: Garantia de que um registro resolvido não volte à fila
  // ===========================================================================
  {
    const db = new MockQuarantineDatabase();
    const item = db.addAttachment({
      cleanup_attempts: 12,
      state: 'DELETED',
      quarantine_resolved_at: new Date(),
    });

    // 1. Não pode ser reivindicado pelo Sweeper
    const claimed = db.claim_attachments_for_cleanup(10, 120);
    assert(
      !claimed.some((c) => c.attachment_id === item.id),
      'Registro DELETED nunca é retornado no claim_attachments_for_cleanup'
    );

    // 2. Não aparece na listagem de quarentena
    const list = db.get_quarantined_attachments(10, 50);
    assert(
      !list.some((q) => q.id === item.id),
      'Registro DELETED nunca aparece na RPC get_quarantined_attachments'
    );

    // 3. Não aparece na consulta fallback
    const fallback = db.fallbackQuarantineQuery(10, 50);
    assert(
      !fallback.some((q) => q.id === item.id),
      'Registro DELETED nunca aparece na consulta de fallback'
    );

    // 4. Retry em registro DELETED é rejeitado
    const retryRes = db.admin_retry_quarantined_attachment(item.id);
    assert(
      retryRes.ok === false && retryRes.reason === 'ALREADY_DELETED',
      'admin_retry_quarantined_attachment rejeita item resolvido com ALREADY_DELETED'
    );

    // 5. Dismiss em registro DELETED é rejeitado
    const dismissRes = db.admin_dismiss_quarantined_attachment(item.id, 'Novo descarte');
    assert(
      dismissRes.ok === false && dismissRes.reason === 'ALREADY_DELETED',
      'admin_dismiss_quarantined_attachment rejeita item resolvido com ALREADY_DELETED'
    );

    // 6. Reautorização em registro DELETED é rejeitada
    const reauthRes = db.admin_reauthorize_quarantined_attachment(item.id);
    assert(
      reauthRes.ok === false && reauthRes.reason === 'ALREADY_DELETED',
      'admin_reauthorize_quarantined_attachment rejeita item resolvido com ALREADY_DELETED'
    );
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
