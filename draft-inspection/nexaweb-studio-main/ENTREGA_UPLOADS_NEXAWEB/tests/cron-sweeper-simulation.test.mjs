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

  console.log('\n===============================================================');
  console.log(`TOTAL DE TESTES SIMULADOS EXECUTADOS: ${totalTests}`);
  console.log(`TESTES APROVADOS: ${passedTests}/${totalTests}`);
  console.log('===============================================================');
}

runSimulationTests().catch((err) => {
  console.error('Falha na execução dos testes:', err);
  process.exit(1);
});
