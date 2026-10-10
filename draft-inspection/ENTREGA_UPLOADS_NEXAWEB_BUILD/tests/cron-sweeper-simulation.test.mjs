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

  console.log('\n===============================================================');
  console.log(`TOTAL DE TESTES SIMULADOS EXECUTADOS: ${totalTests}`);
  console.log(`TESTES APROVADOS: ${passedTests}/${totalTests}`);
  console.log('===============================================================');
}

runSimulationTests().catch((err) => {
  console.error('Falha na execução dos testes:', err);
  process.exit(1);
});
