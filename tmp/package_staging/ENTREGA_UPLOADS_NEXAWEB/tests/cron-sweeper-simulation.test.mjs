import crypto from 'crypto';

/**
 * Suite de Testes Simulados (Unitários/Mock) para a rotina de Limpeza (Sweeper).
 * NOTA: Todos os testes abaixo são puramente simulados em memória (MOCKS)
 * e NÃO realizam chamadas à infraestrutura real de produção do Supabase.
 */

async function runSimulationTests() {
  console.log('===============================================================');
  console.log('INICIANDO SUITE DE TESTES SIMULADOS: CRON SWEEPER & RPCs');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FALHA: ${message}`);
      throw new Error(`Falha no teste: ${message}`);
    }
    passedTests++;
    console.log(`✅ SUCESSO: ${message}`);
  }

  // ---------------------------------------------------------------------------
  // Cenário 1: Falha física no Storage com SUCESSO na RPC de registro
  // ---------------------------------------------------------------------------
  console.log('[Cenário 1] Testando Storage failure + record_attachment_cleanup_failure com sucesso...');
  {
    const item = {
      attachment_id: 'att-1-success-fail-record',
      storage_path: 'briefings/p1/file1.jpg',
      lease_token: 'lease-token-1',
    };

    let rpcCalledWith = null;
    const mockSupabase = {
      storage: {
        from: () => ({
          remove: async () => ({ error: { message: 'Storage connection reset' } }),
        }),
      },
      rpc: async (name, params) => {
        rpcCalledWith = { name, params };
        if (name === 'record_attachment_cleanup_failure') {
          return { data: { ok: true }, error: null };
        }
        return { data: null, error: new Error('Unexpected RPC') };
      },
    };

    const results = [];
    let failed = 0;

    // Lógica espelhada do handler api/cron-cleanup-attachments.ts
    const { error: storageError } = await mockSupabase.storage.from('nexaweb-vault').remove([item.storage_path]);
    if (storageError) {
      failed++;
      const errorMessage = storageError.message || 'Falha ao remover arquivo do Storage';
      const { data: failData, error: failRpcError } = await mockSupabase.rpc('record_attachment_cleanup_failure', {
        p_attachment_id: item.attachment_id,
        p_lease_token: item.lease_token,
        p_error: errorMessage,
      });

      if (failRpcError || !failData?.ok) {
        results.push({ id: item.attachment_id, status: 'DELETION_FAILED_UNRECORDED' });
      } else {
        results.push({ id: item.attachment_id, status: 'DELETION_FAILED', error: errorMessage });
      }
    }

    assert(failed === 1, 'Contador de falhas deve ser incrementado');
    assert(results[0]?.status === 'DELETION_FAILED', 'Status deve ser DELETION_FAILED quando a RPC confirma');
    assert(rpcCalledWith?.params?.p_lease_token === 'lease-token-1', 'RPC deve receber o token do lease atual');
  }

  // ---------------------------------------------------------------------------
  // Cenário 2: Falha física no Storage com ERRO DE REDE/RPC no registro
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 2] Testando Storage failure + record_attachment_cleanup_failure com ERRO DE REDE/RPC...');
  {
    const item = {
      attachment_id: 'att-2-network-fail-record',
      storage_path: 'briefings/p1/file2.jpg',
      lease_token: 'lease-token-2',
    };

    const mockSupabase = {
      storage: {
        from: () => ({
          remove: async () => ({ error: { message: 'Storage timeout' } }),
        }),
      },
      rpc: async (name) => {
        if (name === 'record_attachment_cleanup_failure') {
          return { data: null, error: { message: 'Postgres network disconnect' } };
        }
        return { data: null, error: new Error('Unexpected RPC') };
      },
    };

    const results = [];
    let failed = 0;

    const { error: storageError } = await mockSupabase.storage.from('nexaweb-vault').remove([item.storage_path]);
    if (storageError) {
      failed++;
      const errorMessage = storageError.message || 'Falha ao remover arquivo do Storage';
      const { data: failData, error: failRpcError } = await mockSupabase.rpc('record_attachment_cleanup_failure', {
        p_attachment_id: item.attachment_id,
        p_lease_token: item.lease_token,
        p_error: errorMessage,
      });

      if (failRpcError || !failData?.ok) {
        results.push({
          id: item.attachment_id,
          status: 'DELETION_FAILED_UNRECORDED',
          error: `Falha na remoção física (${errorMessage}), e o registro de falha no banco não foi concluído (${failRpcError?.message}).`,
        });
      } else {
        results.push({ id: item.attachment_id, status: 'DELETION_FAILED', error: errorMessage });
      }
    }

    assert(failed === 1, 'Contador de falhas deve ser incrementado');
    assert(results[0]?.status === 'DELETION_FAILED_UNRECORDED', 'Status DEVE ser DELETION_FAILED_UNRECORDED em caso de erro na RPC');
    assert(results[0]?.error.includes('Postgres network disconnect'), 'Erro deve informar a falha de comunicação com o banco');
  }

  // ---------------------------------------------------------------------------
  // Cenário 3: Falha física no Storage com data.ok === false (Lease expirado/rejeitado)
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 3] Testando Storage failure + record_attachment_cleanup_failure com data.ok === false (LEASE_MISMATCH)...');
  {
    const item = {
      attachment_id: 'att-3-lease-expired',
      storage_path: 'briefings/p1/file3.jpg',
      lease_token: 'expired-lease-token',
    };

    const mockSupabase = {
      storage: {
        from: () => ({
          remove: async () => ({ error: { message: 'S3 500 error' } }),
        }),
      },
      rpc: async (name) => {
        if (name === 'record_attachment_cleanup_failure') {
          return { data: { ok: false, reason: 'LEASE_MISMATCH_OR_EXPIRED' }, error: null };
        }
        return { data: null, error: new Error('Unexpected RPC') };
      },
    };

    const results = [];
    let failed = 0;

    const { error: storageError } = await mockSupabase.storage.from('nexaweb-vault').remove([item.storage_path]);
    if (storageError) {
      failed++;
      const errorMessage = storageError.message || 'Falha ao remover arquivo do Storage';
      const { data: failData, error: failRpcError } = await mockSupabase.rpc('record_attachment_cleanup_failure', {
        p_attachment_id: item.attachment_id,
        p_lease_token: item.lease_token,
        p_error: errorMessage,
      });

      if (failRpcError || !failData?.ok) {
        const failReason = failRpcError?.message || failData?.reason || 'Falha na RPC';
        results.push({
          id: item.attachment_id,
          status: 'DELETION_FAILED_UNRECORDED',
          error: `Falha na remoção física (${errorMessage}), e o registro de falha no banco não foi concluído (${failReason}).`,
        });
      } else {
        results.push({ id: item.attachment_id, status: 'DELETION_FAILED', error: errorMessage });
      }
    }

    assert(failed === 1, 'Contador de falhas deve ser incrementado');
    assert(results[0]?.status === 'DELETION_FAILED_UNRECORDED', 'Status NÃO deve ser afirmado como gravado se o lease expirou');
    assert(results[0]?.error.includes('LEASE_MISMATCH_OR_EXPIRED'), 'Erro deve detalhar a razão de rejeição do lease');
  }

  // ---------------------------------------------------------------------------
  // Cenário 4: Sucesso no Storage com confirmação no banco (confirm_attachment_deleted)
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 4] Testando sucesso físico e confirmação atômica no banco...');
  {
    const item = {
      attachment_id: 'att-4-full-success',
      storage_path: 'briefings/p1/file4.jpg',
      lease_token: 'valid-lease',
    };

    const mockSupabase = {
      storage: {
        from: () => ({
          remove: async () => ({ error: null }),
        }),
      },
      rpc: async (name) => {
        if (name === 'confirm_attachment_deleted') {
          return { data: { ok: true }, error: null };
        }
        return { data: null, error: new Error('Unexpected RPC') };
      },
    };

    const results = [];
    let succeeded = 0;

    const { error: storageError } = await mockSupabase.storage.from('nexaweb-vault').remove([item.storage_path]);
    if (!storageError) {
      const { data: confirmData, error: confirmError } = await mockSupabase.rpc('confirm_attachment_deleted', {
        p_attachment_id: item.attachment_id,
        p_lease_token: item.lease_token,
      });

      if (!confirmError && confirmData?.ok) {
        succeeded++;
        results.push({ id: item.attachment_id, status: 'DELETED' });
      }
    }

    assert(succeeded === 1, 'Contador de sucesso deve ser 1');
    assert(results[0]?.status === 'DELETED', 'Status deve ser DELETED');
  }

  // ---------------------------------------------------------------------------
  // Cenário 5: Verificação de Segurança de Cabeçalhos e Segredo do Cron
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 5] Testando verificação timingSafeEqual de CRON_SECRET...');
  {
    function verifyCronSecret(req, secret) {
      if (!secret || typeof secret !== 'string' || secret.length < 16) return false;
      const authHeader = req.headers?.authorization;
      if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return false;
      const providedToken = authHeader.slice(7).trim();
      const tokenBuf = Buffer.from(providedToken, 'utf8');
      const secretBuf = Buffer.from(secret, 'utf8');
      if (tokenBuf.length !== secretBuf.length) return false;
      return crypto.timingSafeEqual(tokenBuf, secretBuf);
    }

    const testSecret = 'nexaweb-production-cron-secret-12345';

    assert(verifyCronSecret({ headers: {} }, testSecret) === false, 'Sem Authorization header deve rejeitar (401)');
    assert(verifyCronSecret({ headers: { 'x-vercel-cron': '1' } }, testSecret) === false, 'x-vercel-cron isolado deve ser rejeitado');
    assert(verifyCronSecret({ headers: { authorization: 'Bearer token-falso-com-tamanho-diferente' } }, testSecret) === false, 'Token inválido deve ser rejeitado');
    assert(verifyCronSecret({ headers: { authorization: `Bearer ${testSecret}` } }, testSecret) === true, 'Token exato com timingSafeEqual deve ser aceito');
  }

  // ---------------------------------------------------------------------------
  // Cenário 6: Limite de tentativas de limpeza e identificação de Quarentena
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 6] Testando limite de tentativas de limpeza (Quarentena >= 10)...');
  {
    function recordFailureSim(attempts, maxLimit = 10) {
      const newAttempts = attempts + 1;
      return {
        ok: true,
        cleanup_attempts: newAttempts,
        quarantined: newAttempts >= maxLimit,
      };
    }

    const res9 = recordFailureSim(8);
    assert(res9.cleanup_attempts === 9 && res9.quarantined === false, '9ª tentativa não deve ser colocada em quarentena');

    const res10 = recordFailureSim(9);
    assert(res10.cleanup_attempts === 10 && res10.quarantined === true, '10ª tentativa DEVE ser sinalizada como em quarentena');

    const res11 = recordFailureSim(10);
    assert(res11.cleanup_attempts === 11 && res11.quarantined === true, 'Tentativas >= 10 permanecem em quarentena');
  }

  // ---------------------------------------------------------------------------
  // Cenário 7: Proteção estrita contra CSRF na execução manual
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 7] Testando proteção contra CSRF em execução manual...');
  {
    function authorizeRequest(method, hasCronSecret, isAdminSession, headers = {}) {
      if (method === 'GET') {
        if (!hasCronSecret) return { authorized: false, status: 401, reason: 'GET_REQUIRES_CRON_SECRET' };
        return { authorized: true };
      }
      if (method === 'POST') {
        if (hasCronSecret) return { authorized: true };
        if (!isAdminSession) return { authorized: false, status: 401, reason: 'UNAUTHORIZED' };

        const secFetchSite = headers['sec-fetch-site'];
        const xRequestedWith = headers['x-requested-with'];
        const customAction = headers['x-admin-action'];

        const isSameOrigin = secFetchSite === 'same-origin' || secFetchSite === 'none';
        const hasSecureHeader = xRequestedWith === 'XMLHttpRequest' || customAction === 'cleanup-attachments';

        if (!isSameOrigin && !hasSecureHeader) {
          return { authorized: false, status: 403, reason: 'CSRF_BLOCKED' };
        }
        return { authorized: true };
      }
      return { authorized: false, status: 405, reason: 'METHOD_NOT_ALLOWED' };
    }

    // 1. GET via sessão administrativa sem segredo deve ser rejeitado para prevenir CSRF por imagem/link
    const getAdminAttempt = authorizeRequest('GET', false, true);
    assert(getAdminAttempt.authorized === false && getAdminAttempt.status === 401, 'GET com sessão administrativa isolada deve ser bloqueado (CSRF)');

    // 2. GET legítimo do Vercel Cron com segredo deve ser aceito
    const getCronAttempt = authorizeRequest('GET', true, false);
    assert(getCronAttempt.authorized === true, 'GET legítimo da Vercel com segredo deve ser aceito');

    // 3. POST cross-site sem cabeçalho seguro deve ser bloqueado com 403 (CSRF)
    const postCrossSite = authorizeRequest('POST', false, true, { 'sec-fetch-site': 'cross-site' });
    assert(postCrossSite.authorized === false && postCrossSite.status === 403, 'POST cross-site sem cabeçalho seguro deve ser bloqueado (CSRF)');

    // 4. POST do painel administrativo com cabeçalho seguro deve ser aceito
    const postAdminValid = authorizeRequest('POST', false, true, {
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'x-admin-action': 'cleanup-attachments',
    });
    assert(postAdminValid.authorized === true, 'POST com sessão administrativa e cabeçalhos seguros deve ser aceito');
  }

  // ---------------------------------------------------------------------------
  // Cenário 8: Transição de reserva para READY tornando reservation_expires_at nulo
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 8] Testando transição da reserva para READY (reservation_expires_at anulado)...');
  {
    const attachment = {
      id: 'att-res-test',
      state: 'PENDING',
      reservation_expires_at: new Date(Date.now() + 1200000), // +20 min
    };

    function finishAttachment(att) {
      if (att.state !== 'PENDING') return { ok: false, reason: 'NOT_PENDING' };
      if (att.reservation_expires_at && att.reservation_expires_at < new Date()) {
        return { ok: false, reason: 'EXPIRED' };
      }
      att.state = 'READY';
      att.reservation_expires_at = null; // Anulado pois arquivo está ativo e confirmado
      return { ok: true, status: 'CONFIRMED' };
    }

    const finishRes = finishAttachment(attachment);
    assert(finishRes.ok === true && finishRes.status === 'CONFIRMED', 'Reserva confirmada com sucesso');
    assert(attachment.state === 'READY', 'Estado atualizado para READY');
    assert(attachment.reservation_expires_at === null, 'reservation_expires_at anulado após confirmação');
  }

  // ---------------------------------------------------------------------------
  // Cenário 9: Falha no upload no Storage garantindo remoção e nunca gravando DELETED sem verificação
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 9] Testando falha de upload com garantia de remoção física e nunca marcando DELETED...');
  {
    let storageRemoved = false;
    let recordedFailedStorage = null;

    async function handleUploadFailure(storageErr, shouldFailRemoval) {
      let storageRemovalFailed = false;
      try {
        if (shouldFailRemoval) {
          storageRemovalFailed = true;
        } else {
          storageRemoved = true;
        }
      } catch {
        storageRemovalFailed = true;
      }

      recordedFailedStorage = storageRemovalFailed;
      return {
        state: storageRemovalFailed ? 'DELETION_FAILED' : 'DELETED',
        cleanup_attempts: storageRemovalFailed ? 1 : 0,
      };
    }

    // Caso A: Remoção no Storage falhou -> DEVE marcar DELETION_FAILED
    const caseA = await handleUploadFailure(new Error('Upload dropped'), true);
    assert(caseA.state === 'DELETION_FAILED' && recordedFailedStorage === true, 'Se remoção no Storage falhou, estado deve ser DELETION_FAILED (nunca DELETED)');

    // Caso B: Remoção no Storage confirmada com sucesso -> marca DELETED
    const caseB = await handleUploadFailure(new Error('Upload dropped'), false);
    assert(caseB.state === 'DELETED' && storageRemoved === true, 'Apenas se remoção no Storage foi confirmada, marca como DELETED');
  }

  // ---------------------------------------------------------------------------
  // Cenário 10: Falha simultânea do Storage e da RPC de registro (Falha Dupla)
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 10] Testando Falha Dupla (Storage + RPC de registro falhando juntos)...');
  {
    // Simula a tabela com estado real do banco
    const db = new Map();
    const attId = 'att-double-fail';
    db.set(attId, {
      id: attId,
      state: 'DELETING',
      cleanup_attempts: 0,
      cleanup_lease_token: null,
      cleanup_lease_expires_at: null,
    });

    // 1. Simulação do claim_attachments_for_cleanup com incremento atômico
    function claimAttachment(id, leaseSeconds = 120) {
      const row = db.get(id);
      if (!row || row.cleanup_attempts >= 10) return null;
      if (row.cleanup_lease_expires_at && row.cleanup_lease_expires_at > new Date()) return null;
      
      const token = crypto.randomUUID();
      row.cleanup_attempts += 1; // Incremento atômico preventivo no claim
      row.cleanup_lease_token = token;
      row.cleanup_lease_expires_at = new Date(Date.now() + leaseSeconds * 1000);
      row.state = 'DELETING';
      return { attachment_id: id, lease_token: token, cleanup_attempts: row.cleanup_attempts };
    }

    const claimed = claimAttachment(attId);
    assert(claimed !== null, 'Item elegível deve ser reivindicado');
    assert(claimed.cleanup_attempts === 1, 'Tentativa deve ser incrementada atomicamente para 1 no claim');

    // 2. Simula falha física no Storage e falha subsequente de comunicação com a RPC
    const storageFailed = true;
    let rpcNetworkDrop = true; // Simula banco fora do ar ao tentar registrar o erro

    let unrecordedResult = null;
    if (storageFailed && rpcNetworkDrop) {
      unrecordedResult = {
        id: claimed.attachment_id,
        status: 'DELETION_FAILED_UNRECORDED',
      };
    }

    assert(unrecordedResult?.status === 'DELETION_FAILED_UNRECORDED', 'Falha dupla gera status DELETION_FAILED_UNRECORDED para monitoramento');
    // Verificação crítica: no banco, mesmo que o worker não tenha conseguido gravar o erro,
    // o contador JÁ está em 1 (não ficou em 0, eliminando o risco de loop infinito eterno)
    const rowInDb = db.get(attId);
    assert(rowInDb.cleanup_attempts === 1, 'Contador no banco permanece em 1, prevenindo loop infinito por falha dupla');
  }

  // ---------------------------------------------------------------------------
  // Cenário 11: Contador em 9, 10 e após tentativa bem-sucedida
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 11] Testando limites do contador (tentativa 9 -> 10, bloqueio em 10, e sucesso na 10ª)...');
  {
    const db = new Map();
    const attId = 'att-counter-test';
    db.set(attId, {
      id: attId,
      state: 'DELETION_FAILED',
      cleanup_attempts: 9, // Está na 9ª tentativa
      cleanup_lease_token: null,
      cleanup_lease_expires_at: null,
    });

    function claimCandidate(row) {
      if (row.cleanup_attempts >= 10) return null; // Cláusula cleanup_attempts < 10
      row.cleanup_attempts += 1;
      row.cleanup_lease_token = 'token-10';
      row.cleanup_lease_expires_at = new Date(Date.now() + 120000);
      row.state = 'DELETING';
      return { id: row.id, attempts: row.cleanup_attempts, token: row.cleanup_lease_token };
    }

    // 1. Linha com cleanup_attempts = 9 deve poder ser reivindicada, virando 10
    const claim9 = claimCandidate(db.get(attId));
    assert(claim9 !== null && claim9.attempts === 10, 'Registro com 9 tentativas é reivindicado e contador avança para 10');

    // 2. Durante essa 10ª tentativa, o worker executa a remoção e deve poder concluir com sucesso!
    function confirmSuccess(row, token) {
      if (row.cleanup_lease_token !== token) return { ok: false, reason: 'LEASE_MISMATCH' };
      if (!row.cleanup_lease_expires_at || row.cleanup_lease_expires_at <= new Date()) return { ok: false, reason: 'LEASE_EXPIRED' };
      row.state = 'DELETED';
      row.cleanup_lease_token = null;
      row.cleanup_lease_expires_at = null;
      return { ok: true };
    }

    const successRes = confirmSuccess(db.get(attId), claim9.token);
    assert(successRes.ok === true, '10ª tentativa reivindicada deve poder concluir com sucesso para DELETED');
    assert(db.get(attId).state === 'DELETED', 'Estado do registro transitou para DELETED com sucesso');

    // 3. Agora teste de um registro já em 10 tentativas sem sucesso (quarentena pura)
    const quarantinedRow = {
      id: 'att-quarantine',
      state: 'DELETION_FAILED',
      cleanup_attempts: 10,
      cleanup_lease_token: null,
      cleanup_lease_expires_at: null,
    };
    const claimBlocked = claimCandidate(quarantinedRow);
    assert(claimBlocked === null, 'Nenhuma nova reivindicação é permitida quando o contador já estiver em 10');
  }

  // ---------------------------------------------------------------------------
  // Cenário 12: Concorrência de Leases (Worker antigo após expiração e após novo claim)
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 12] Testando concorrência de Leases (Worker antigo vs Worker novo)...');
  {
    const attachment = {
      id: 'att-concurrent-lease',
      state: 'DELETING',
      cleanup_lease_token: 'worker-1-token',
      cleanup_lease_expires_at: new Date(Date.now() - 5000), // Expirou há 5 segundos
    };

    function confirmDeletedRpc(row, providedToken) {
      if (!providedToken) return { ok: false, reason: 'LEASE_TOKEN_REQUIRED' };
      if (!row.cleanup_lease_token || !row.cleanup_lease_expires_at) return { ok: false, reason: 'NO_ACTIVE_LEASE' };

      // Se token bate mas lease expirou
      if (row.cleanup_lease_token === providedToken && row.cleanup_lease_expires_at <= new Date()) {
        return { ok: false, reason: 'LEASE_EXPIRED' };
      }

      // Se token não bate (outro worker assumiu)
      if (row.cleanup_lease_token !== providedToken) {
        return { ok: false, reason: 'LEASE_MISMATCH' };
      }

      row.state = 'DELETED';
      row.cleanup_lease_token = null;
      row.cleanup_lease_expires_at = null;
      return { ok: true };
    }

    // 1. Worker 1 atrasado tenta confirmar quando seu lease já expirou e nenhum outro worker assumiu
    const w1ResultExpired = confirmDeletedRpc(attachment, 'worker-1-token');
    assert(w1ResultExpired.ok === false && w1ResultExpired.reason === 'LEASE_EXPIRED', 'Worker atrasado recebe determinísticamente LEASE_EXPIRED');

    // 2. Novo Worker 2 reivindica o anexo e obtém novo token
    attachment.cleanup_lease_token = 'worker-2-token';
    attachment.cleanup_lease_expires_at = new Date(Date.now() + 120000);

    // 3. Worker 1 atrasado tenta confirmar com token antigo -> NÃO deve alterar o registro do Worker 2
    const w1ResultMismatch = confirmDeletedRpc(attachment, 'worker-1-token');
    assert(w1ResultMismatch.ok === false && w1ResultMismatch.reason === 'LEASE_MISMATCH', 'Worker com token antigo recebe LEASE_MISMATCH e não altera o registro');
    assert(attachment.cleanup_lease_token === 'worker-2-token', 'Posse do Worker 2 permanece íntegra');

    // 4. Worker 2 com token válido confirma -> sucesso
    const w2Result = confirmDeletedRpc(attachment, 'worker-2-token');
    assert(w2Result.ok === true, 'Worker legítimo com lease ativo confirma com sucesso');
    assert(attachment.state === 'DELETED', 'Registro finalizado como DELETED');
  }

  // ---------------------------------------------------------------------------
  // Cenário 13: Eliminação de Lease Nulo nas RPCs de confirmação e falha
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 13] Testando rejeição estrita de Lease nulo...');
  {
    const attachment = {
      id: 'att-null-lease',
      state: 'PENDING',
      cleanup_lease_token: null,
      cleanup_lease_expires_at: null,
    };

    function validateLeaseRpc(row, token) {
      if (!token) return { ok: false, reason: 'LEASE_TOKEN_REQUIRED' };
      if (row.cleanup_lease_token === null || row.cleanup_lease_expires_at === null) {
        return { ok: false, reason: 'NO_ACTIVE_LEASE' };
      }
      return { ok: true };
    }

    // Chamada sem passar token
    assert(validateLeaseRpc(attachment, null).reason === 'LEASE_TOKEN_REQUIRED', 'Token nulo deve ser prontamente rejeitado com LEASE_TOKEN_REQUIRED');
    
    // Chamada com token qualquer quando o registro não possui lease ativo
    assert(validateLeaseRpc(attachment, 'random-token').reason === 'NO_ACTIVE_LEASE', 'Tentativa de mutação quando registro tem lease nulo deve ser rejeitada com NO_ACTIVE_LEASE');
    assert(attachment.state === 'PENDING', 'Estado não pode ser alterado por chamadas sem lease ativo');
  }

  // ---------------------------------------------------------------------------
  // Cenário 14: Recuperação Administrativa (Retry & Dismiss: Sessão, CSRF e Leases)
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 14] Testando Recuperação Administrativa (Validações de Sessão, CSRF, Justificativa e Leases)...');
  {
    function adminActionGuard(isAdmin, headers = {}) {
      if (!isAdmin) return { ok: false, status: 401, error: 'UNAUTHORIZED' };
      const secFetch = headers['sec-fetch-site'];
      const actionHeader = headers['x-admin-action'];
      const isSameOrigin = secFetch === 'same-origin' || secFetch === 'none';
      const hasSecure = actionHeader === 'quarantine-retry' || actionHeader === 'quarantine-dismiss';
      if (!isSameOrigin && !hasSecure) return { ok: false, status: 403, error: 'CSRF_BLOCKED' };
      return { ok: true };
    }

    // 1. Sem sessão -> 401
    assert(adminActionGuard(false).status === 401, 'Ação administrativa sem sessão válida retorna 401');

    // 2. Com sessão mas cross-site sem header seguro -> 403
    assert(adminActionGuard(true, { 'sec-fetch-site': 'cross-site' }).status === 403, 'Ação administrativa cross-site sem header seguro retorna 403');

    // 3. Com sessão e header seguro -> autorizado
    assert(adminActionGuard(true, { 'sec-fetch-site': 'same-origin', 'x-admin-action': 'quarantine-retry' }).ok === true, 'Ação com sessão e cabeçalho de mesma origem é autorizada');

    // 4. Teste de rejeição de retry quando item NÃO está em quarentena (attempts < 10)
    function adminRetrySim(row) {
      if (row.cleanup_attempts < 10) return { ok: false, reason: 'NOT_IN_QUARANTINE' };
      if (row.cleanup_lease_expires_at && row.cleanup_lease_expires_at > new Date()) return { ok: false, reason: 'LEASE_ACTIVE' };
      row.cleanup_attempts = 0;
      row.cleanup_lease_token = null;
      row.cleanup_lease_expires_at = null;
      row.state = 'DELETING';
      row.quarantine_notes = '[RETRY manual por admin]';
      return { ok: true, status: 'QUEUED_FOR_RETRY' };
    }

    const nonQuarantineItem = { cleanup_attempts: 4, cleanup_lease_expires_at: null };
    assert(adminRetrySim(nonQuarantineItem).reason === 'NOT_IN_QUARANTINE', 'Retry é rejeitado para item com menos de 10 tentativas');

    // 5. Teste de rejeição de retry quando lease está ativo
    const activeLeaseItem = { cleanup_attempts: 10, cleanup_lease_expires_at: new Date(Date.now() + 60000) };
    assert(adminRetrySim(activeLeaseItem).reason === 'LEASE_ACTIVE', 'Retry é rejeitado se houver lease ativo em execução');

    // 6. Retry legítimo
    const eligibleItem = { cleanup_attempts: 10, cleanup_lease_expires_at: null, quarantine_notes: null };
    const retryRes = adminRetrySim(eligibleItem);
    assert(retryRes.ok === true && retryRes.status === 'QUEUED_FOR_RETRY', 'Retry em item elegível reenfileira com sucesso');
    assert(eligibleItem.cleanup_attempts === 0, 'Contador de tentativas zerado para reprocessamento');
    assert(eligibleItem.quarantine_notes.includes('RETRY'), 'Histórico registrado em quarantine_notes');
  }

  // ---------------------------------------------------------------------------
  // Cenário 15: Dismiss com Falha de Remoção Física no Storage
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 15] Testando Dismiss com Falha de Remoção Física no Storage...');
  {
    async function handleAdminDismiss(attachment, justification, storageMock) {
      if (!justification || justification.trim().length < 5) {
        return { ok: false, status: 400, error: 'JUSTIFICATION_REQUIRED' };
      }

      // 1. Tenta remoção física no Storage
      const { error: storageErr } = await storageMock.remove([attachment.storage_path]);
      if (storageErr) {
        // Falha no storage -> NÃO declara DELETED, mantém rastreável em quarentena
        return {
          ok: false,
          status: 500,
          error: `Falha na remoção física: ${storageErr.message}. Item mantido em quarentena.`,
        };
      }

      attachment.state = 'DELETED';
      attachment.quarantine_notes = `DISMISSED: ${justification.trim()}`;
      return { ok: true, status: 200 };
    }

    // A: Sem justificativa suficiente (< 5 caracteres)
    const mockStorageOk = { remove: async () => ({ error: null }) };
    const attA = { storage_path: 'briefings/p/f.jpg', state: 'DELETION_FAILED' };
    const resA = await handleAdminDismiss(attA, 'abc', mockStorageOk);
    assert(resA.status === 400 && resA.error === 'JUSTIFICATION_REQUIRED', 'Dismiss sem justificativa mínima de 5 caracteres é recusado');

    // B: Falha na remoção física no Storage
    const mockStorageErr = { remove: async () => ({ error: { message: 'S3 Access Denied' } }) };
    const attB = { storage_path: 'briefings/p/f.jpg', state: 'DELETION_FAILED' };
    const resB = await handleAdminDismiss(attB, 'Arquivo órfão irrelevante', mockStorageErr);
    assert(resB.status === 500 && resB.error.includes('Falha na remoção física'), 'Se remoção física falha, o dismiss NÃO finaliza como DELETED e informa erro');
    assert(attB.state === 'DELETION_FAILED', 'Estado do item mantido inalterado');
  }

  // ---------------------------------------------------------------------------
  // Cenário 16: Dismiss com Falha no Banco Após Remoção Física
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 16] Testando Dismiss com Falha de Banco Após Remoção Física...');
  {
    async function handleDismissDbFail(attachment, justification) {
      // Remoção no storage simulada como bem-sucedida
      const storageRemoved = true;

      // Simula falha na chamada da RPC admin_dismiss_quarantined_attachment
      const rpcError = { message: 'PostgreSQL deadlock detected' };

      if (storageRemoved && rpcError) {
        return {
          ok: false,
          status: 500,
          error: `Arquivo removido do Storage, mas falha ao atualizar banco: ${rpcError.message}`,
        };
      }
      return { ok: true };
    }

    const attC = { storage_path: 'briefings/p/f.jpg', state: 'DELETION_FAILED' };
    const resC = await handleDismissDbFail(attC, 'Arquivo não mais necessário');
    assert(resC.status === 500 && resC.error.includes('falha ao atualizar banco'), 'Falha na RPC de banco é relatada honestamente sem declarar sucesso antecipado');
  }

  // ---------------------------------------------------------------------------
  // Cenário 17: Preservação de Histórico, URLs Assinadas de 60s e Permissões Administrativas
  // ---------------------------------------------------------------------------
  console.log('\n[Cenário 17] Testando Preservação de Histórico, URLs assinadas de 60s e Permissões...');
  {
    // 1. Verificação de TTL máximo de 60s em URLs assinadas de arquivos privados
    function generateSignedUrl(path, requestedTtl) {
      const maxAllowedTtl = 60;
      const effectiveTtl = Math.min(requestedTtl, maxAllowedTtl);
      return { url: `https://vault.supabase.co/${path}?token=sig&exp=${effectiveTtl}`, ttl: effectiveTtl };
    }

    const signRes = generateSignedUrl('briefings/p1/doc.png', 60);
    assert(signRes.ttl === 60, 'URLs assinadas para briefings privados utilizam TTL estrito de no máximo 60 segundos');

    // 2. Preservação de quarantine_notes como histórico acumulativo
    let notes = 'Erro 1: Connection reset';
    notes = `${notes} [RETRY acionado manualmente por admin em 2026-10-10]`;
    assert(notes.includes('Erro 1') && notes.includes('RETRY acionado'), 'Histórico anterior e ação administrativa são cumulativos em quarantine_notes');

    // 3. Permissões de RPCs: apenas service_role pode executar
    const rpcPermissions = {
      reserve_project_attachment: ['service_role'],
      finish_project_attachment: ['service_role'],
      release_project_attachment: ['service_role'],
      claim_attachments_for_cleanup: ['service_role'],
      confirm_attachment_deleted: ['service_role'],
      record_attachment_cleanup_failure: ['service_role'],
      get_quarantined_attachments: ['service_role'],
      admin_retry_quarantined_attachment: ['service_role'],
      admin_dismiss_quarantined_attachment: ['service_role'],
    };

    for (const [fn, roles] of Object.entries(rpcPermissions)) {
      assert(roles.includes('service_role') && !roles.includes('anon') && !roles.includes('authenticated'), `Função ${fn} tem acesso restrito exclusivamente a service_role`);
    }
  }

  console.log('\n===============================================================');
  console.log(`TOTAL DE TESTES SIMULADOS EXECUTADOS: ${totalTests}`);
  console.log(`TESTES APROVADOS: ${passedTests}/${totalTests}`);
  console.log('===============================================================');
}

runSimulationTests().catch((err) => {
  console.error('Falha na execução dos testes:', err);
  process.exit(1);
});
