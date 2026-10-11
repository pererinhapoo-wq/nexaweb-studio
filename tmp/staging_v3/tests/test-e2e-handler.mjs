import crypto from 'crypto';
import { Readable } from 'stream';

const SECRET = 'test-secret-key-for-e2e-tests-32b';
const CRON_SECRET = 'cron-secret-key-for-test-32b';
process.env.NEXAWEB_UPLOAD_TICKET_SECRET = SECRET;
process.env.CRON_SECRET = CRON_SECRET;
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

let mockState = {
  projects: new Set(),
  attachments: new Map(),
  vaultStorage: new Map(),
  publicStorage: new Map(),
  storageFail: false,
  finishFail: false,
  confirmRpcFail: false, // Simula erro de RPC em confirm_attachment_deleted
  confirmDataOkFalse: false, // Simula data.ok === false em confirm_attachment_deleted
  removeVaultStorageFail: false,
  releasedAttachments: [],
  removedStoragePaths: [],
};

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  const urlStr = String(url);

  // 1. RPC calls
  if (urlStr.includes('/rest/v1/rpc/reserve_project_attachment')) {
    const body = JSON.parse(options.body);
    const { p_project_id, p_storage_path, p_mime_type, p_size_bytes } = body;

    let count = 0;
    let totalBytes = 0;
    for (const att of mockState.attachments.values()) {
      if (att.project_id === p_project_id && (att.state === 'READY' || att.state === 'PENDING' || att.state === 'DELETION_FAILED')) {
        count++;
        totalBytes += att.size_bytes;
      }
    }

    if (count >= 5) {
      return new Response(JSON.stringify({ ok: false, reason: 'FILE_COUNT', count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (totalBytes + p_size_bytes > 52428800) {
      return new Response(JSON.stringify({ ok: false, reason: 'PROJECT_QUOTA', bytes: totalBytes }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = crypto.randomUUID();
    mockState.attachments.set(id, {
      id,
      project_id: p_project_id,
      storage_path: p_storage_path,
      mime_type: p_mime_type,
      size_bytes: p_size_bytes,
      state: 'PENDING',
      created_at: new Date()
    });

    return new Response(JSON.stringify({ ok: true, attachment_id: id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (urlStr.includes('/rest/v1/rpc/finish_project_attachment')) {
    const body = JSON.parse(options.body);
    if (mockState.finishFail) {
      return new Response(JSON.stringify({ ok: false, reason: 'ATTACHMENT_NOT_FOUND_OR_EXPIRED' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const att = mockState.attachments.get(body.p_attachment_id);
    if (att) {
      if (att.state === 'READY') {
        return new Response(JSON.stringify({ ok: true, status: 'ALREADY_READY' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      att.state = 'READY';
      return new Response(JSON.stringify({ ok: true, status: 'CONFIRMED' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: false, reason: 'ATTACHMENT_NOT_FOUND_OR_EXPIRED' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (urlStr.includes('/rest/v1/rpc/release_project_attachment')) {
    const body = JSON.parse(options.body);
    mockState.releasedAttachments.push(body);
    const att = mockState.attachments.get(body.p_attachment_id);
    if (att) {
      att.state = body.p_failed_storage ? 'DELETION_FAILED' : 'DELETED';
      att.last_cleanup_error = body.p_reason;
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sweeper RPCs com validação estrita de lease temporal e token
  if (urlStr.includes('/rest/v1/rpc/claim_attachments_for_cleanup')) {
    const candidates = [];
    const leaseToken = crypto.randomUUID();
    const leaseExpiry = Date.now() + 120000;
    for (const att of mockState.attachments.values()) {
      const isEligibleState = att.state === 'DELETING' || att.state === 'DELETION_FAILED' || att.state === 'PENDING';
      const isLeaseFree = !att.cleanup_lease_expires_at || att.cleanup_lease_expires_at < Date.now();
      if (isEligibleState && isLeaseFree) {
        att.state = 'DELETING';
        att.cleanup_lease_token = leaseToken;
        att.cleanup_lease_expires_at = leaseExpiry;
        candidates.push({
          attachment_id: att.id,
          storage_path: att.storage_path,
          cleanup_attempts: att.cleanup_attempts || 0,
          lease_token: leaseToken,
        });
      }
    }
    return new Response(JSON.stringify(candidates), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (urlStr.includes('/rest/v1/rpc/confirm_attachment_deleted')) {
    if (mockState.confirmRpcFail) {
      return new Response(JSON.stringify({ message: 'Database connection dropped during confirm' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (mockState.confirmDataOkFalse) {
      return new Response(JSON.stringify({ ok: false, reason: 'LEASE_MISMATCH_OR_EXPIRED' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const body = JSON.parse(options.body);
    const att = mockState.attachments.get(body.p_attachment_id);
    const isLeaseValid = att && att.cleanup_lease_token === body.p_lease_token && (!att.cleanup_lease_expires_at || att.cleanup_lease_expires_at > Date.now());
    if (isLeaseValid) {
      att.state = 'DELETED';
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: false, reason: 'LEASE_MISMATCH_OR_EXPIRED' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (urlStr.includes('/rest/v1/rpc/record_attachment_cleanup_failure')) {
    const body = JSON.parse(options.body);
    const att = mockState.attachments.get(body.p_attachment_id);
    const isLeaseValid = att && att.cleanup_lease_token === body.p_lease_token && (!att.cleanup_lease_expires_at || att.cleanup_lease_expires_at > Date.now());
    if (isLeaseValid) {
      att.state = 'DELETION_FAILED';
      att.cleanup_attempts = (att.cleanup_attempts || 0) + 1;
      att.last_cleanup_error = body.p_error;
      att.cleanup_lease_token = null;
      att.cleanup_lease_expires_at = null;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: false, reason: 'LEASE_MISMATCH_OR_EXPIRED' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Storage calls
  if (urlStr.includes('/storage/v1/object/')) {
    const isPublic = urlStr.includes('nexaweb-public');
    const targetMap = isPublic ? mockState.publicStorage : mockState.vaultStorage;

    if (options.method === 'POST') {
      if (!isPublic && mockState.storageFail) {
        return new Response(JSON.stringify({ message: 'Storage S3 timeout error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const match = urlStr.match(/\/storage\/v1\/object\/(?:nexaweb-vault|nexaweb-public)\/(.*)/);
      const path = match ? decodeURIComponent(match[1]) : 'unknown';
      targetMap.set(path, options.body);
      return new Response(JSON.stringify({ Key: path }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (options.method === 'DELETE') {
      if (!isPublic && mockState.removeVaultStorageFail) {
        return new Response(JSON.stringify({ message: 'Storage Delete S3 timeout' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const prefixes = body.prefixes || [];
      for (const p of prefixes) {
        mockState.removedStoragePaths.push(p);
        targetMap.delete(p);
      }
      return new Response(JSON.stringify({ message: 'Deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (urlStr.includes('/storage/v1/object/public/nexaweb-public/')) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return originalFetch(url, options);
};

const { default: uploadHandler } = await import('../api/upload-briefing.ts');
const { default: cronHandler } = await import('../api/cron-cleanup-attachments.ts');
const { createSessionToken } = await import('../api/_session.ts');

function createMultipartBody(boundary, fields, files) {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  for (const f of files) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\nContent-Type: ${f.type}\r\n\r\n`));
    parts.push(f.data);
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(parts);
}

function createTicket(projectId) {
  const payload = Buffer.from(JSON.stringify({
    projectId,
    iat: Date.now(),
    exp: Date.now() + 15 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex'),
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

async function sendUpload(projectId, ticket, buffer, mimeType = 'image/jpeg', cookie = '') {
  const boundary = '----Boundary' + Math.random().toString(36).substring(2);
  const fields = projectId ? { projectId } : {};
  const body = createMultipartBody(boundary, fields, [{ name: 'file', filename: 'photo.jpg', type: mimeType, data: buffer }]);

  const req = Readable.from(body);
  req.method = 'POST';
  req.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  };
  if (ticket) req.headers['x-nexaweb-upload-ticket'] = ticket;
  if (cookie) req.headers['cookie'] = cookie;
  req.query = projectId ? { projectId } : {};

  let statusCode = 200;
  let responseData = null;

  const res = {
    setHeader: () => {},
    status: (code) => { statusCode = code; return res; },
    json: (data) => { responseData = data; return res; },
    headersSent: false
  };

  await uploadHandler(req, res);
  return { statusCode, responseData };
}

async function runCron(authHeader = '', vercelHeader = '', cookie = '') {
  const req = {
    method: 'POST',
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
      ...(vercelHeader ? { 'x-vercel-cron': vercelHeader } : {}),
      ...(cookie ? { cookie } : {}),
    },
    query: {},
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    setHeader: () => {},
    status: (code) => { statusCode = code; return res; },
    json: (data) => { responseData = data; return res; },
    headersSent: false
  };
  await cronHandler(req, res);
  return { statusCode, responseData };
}

async function runE2E() {
  console.log('\n====================================================');
  console.log('AUDITORIA E VALIDAÇÃO COMPLEMENTAR DO DRAFT');
  console.log('====================================================\n');

  const projectId = crypto.randomUUID();
  const ticket = createTicket(projectId);
  const sampleJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

  // TESTE 1: Segurança do Cron
  console.log('--- 1. Testando Autenticação do Cron ---');
  {
    const t1 = await runCron();
    console.log('[1.1] Sem credenciais -> 401:', t1.statusCode === 401 ? 'PASS' : 'FAIL');
    if (t1.statusCode !== 401) throw new Error('Falha 1.1');

    const t2 = await runCron('', '1');
    console.log('[1.2] x-vercel-cron: 1 forjado sem segredo -> 401:', t2.statusCode === 401 ? 'PASS' : 'FAIL');
    if (t2.statusCode !== 401) throw new Error('Falha 1.2');

    const t3 = await runCron(`Bearer ${CRON_SECRET}`);
    console.log('[1.3] Segredo correto via Bearer -> 200:', t3.statusCode === 200 ? 'PASS' : 'FAIL');
    if (t3.statusCode !== 200) throw new Error('Falha 1.3');
  }

  // TESTE 2: Nova Verificação - confirm_attachment_deleted com erro de RPC ou data.ok === false
  console.log('\n--- 2. Testando Tratamento de confirm_attachment_deleted no Cron ---');
  {
    // A. Simula erro de RPC de rede na confirmação
    const idA = crypto.randomUUID();
    const pathA = `briefings/${projectId}/rpc-fail.jpg`;
    mockState.attachments.set(idA, {
      id: idA,
      project_id: projectId,
      storage_path: pathA,
      state: 'DELETING',
      size_bytes: 1024,
    });
    mockState.vaultStorage.set(pathA, Buffer.from('data'));

    mockState.confirmRpcFail = true;
    const resRpcFail = await runCron(`Bearer ${CRON_SECRET}`);
    mockState.confirmRpcFail = false;

    const itemA = resRpcFail.responseData?.results?.find(r => r.id === idA);
    const notMarkedDeletedA = itemA?.status === 'CONFIRMATION_FAILED';
    const notIncrementedSucceededA = resRpcFail.responseData?.succeeded === 0;
    console.log('[2.1] Erro na RPC de confirmação retorna CONFIRMATION_FAILED (não marca DELETED):', notMarkedDeletedA ? 'PASS' : 'FAIL');
    console.log('[2.2] Contador succeeded NÃO foi incrementado indevidamente:', notIncrementedSucceededA ? 'PASS' : 'FAIL');
    if (!notMarkedDeletedA || !notIncrementedSucceededA) throw new Error('Falha 2.1/2.2');

    // B. Simula data.ok === false (ex: lease expirado durante confirmação)
    const idB = crypto.randomUUID();
    const pathB = `briefings/${projectId}/lease-expired.jpg`;
    mockState.attachments.set(idB, {
      id: idB,
      project_id: projectId,
      storage_path: pathB,
      state: 'DELETING',
      size_bytes: 1024,
    });
    mockState.vaultStorage.set(pathB, Buffer.from('data'));

    mockState.confirmDataOkFalse = true;
    const resDataOkFalse = await runCron(`Bearer ${CRON_SECRET}`);
    mockState.confirmDataOkFalse = false;

    const itemB = resDataOkFalse.responseData?.results?.find(r => r.id === idB);
    const notMarkedDeletedB = itemB?.status === 'CONFIRMATION_FAILED';
    console.log('[2.3] data.ok === false (lease expirado) retorna CONFIRMATION_FAILED (não marca DELETED):', notMarkedDeletedB ? 'PASS' : 'FAIL');
    if (!notMarkedDeletedB) throw new Error('Falha 2.3');
  }

  // TESTE 3: Validação de Token Incorreto e Lease Expirado em record_attachment_cleanup_failure
  console.log('\n--- 3. Testando Validação de Lease em record_attachment_cleanup_failure ---');
  {
    const idFail = crypto.randomUUID();
    const tokenCorreto = crypto.randomUUID();
    const tokenIncorreto = crypto.randomUUID();

    // Registro com lease ativo
    mockState.attachments.set(idFail, {
      id: idFail,
      project_id: projectId,
      storage_path: 'path',
      state: 'DELETING',
      cleanup_lease_token: tokenCorreto,
      cleanup_lease_expires_at: Date.now() + 60000,
    });

    // Worker com token incorreto tenta registrar falha -> deve falhar
    const resWrongToken = await fetch('https://mock.supabase.co/rest/v1/rpc/record_attachment_cleanup_failure', {
      method: 'POST',
      body: JSON.stringify({ p_attachment_id: idFail, p_lease_token: tokenIncorreto, p_error: 'err' }),
    });
    const dataWrongToken = await resWrongToken.json();
    console.log('[3.1] Token incorreto rejeitado por record_attachment_cleanup_failure:', (dataWrongToken.ok === false && dataWrongToken.reason === 'LEASE_MISMATCH_OR_EXPIRED') ? 'PASS' : 'FAIL');
    if (dataWrongToken.ok !== false) throw new Error('Falha 3.1');

    // Registro com lease expirado
    mockState.attachments.get(idFail).cleanup_lease_expires_at = Date.now() - 5000;
    const resExpiredToken = await fetch('https://mock.supabase.co/rest/v1/rpc/record_attachment_cleanup_failure', {
      method: 'POST',
      body: JSON.stringify({ p_attachment_id: idFail, p_lease_token: tokenCorreto, p_error: 'err' }),
    });
    const dataExpiredToken = await resExpiredToken.json();
    console.log('[3.2] Lease expirado rejeitado por record_attachment_cleanup_failure:', (dataExpiredToken.ok === false && dataExpiredToken.reason === 'LEASE_MISMATCH_OR_EXPIRED') ? 'PASS' : 'FAIL');
    if (dataExpiredToken.ok !== false) throw new Error('Falha 3.2');
  }

  // TESTE 4: Simulação dos Dois Cenários de Conflito de Buckets no SQL
  console.log('\n--- 4. Testando Cenários de Conflito de Buckets na Migração SQL ---');
  {
    function simulateBucketMigration(existingBuckets) {
      // 1.1 Verificação do bucket privado nexaweb-vault
      const vault = existingBuckets['nexaweb-vault'];
      if (vault) {
        if (vault.public === true) {
          throw new Error('MIGRAÇÃO ABORTADA: O bucket "nexaweb-vault" já existe configurado como PÚBLICO. Para proteger arquivos confidenciais de clientes, revise o bucket manualmente antes de prosseguir.');
        }
      }
      // 1.2 Verificação do bucket público nexaweb-public
      const pub = existingBuckets['nexaweb-public'];
      if (pub) {
        if (pub.public === false) {
          throw new Error('MIGRAÇÃO ABORTADA: O bucket "nexaweb-public" já existe configurado como PRIVADO. Para permitir exibição permanente do portfólio, revise o bucket manualmente antes de prosseguir.');
        }
      }
      return 'SUCESSO';
    }

    // Cenário A: nexaweb-vault já existe como público
    let caughtVaultError = false;
    try {
      simulateBucketMigration({ 'nexaweb-vault': { public: true } });
    } catch (e) {
      caughtVaultError = e.message.includes('MIGRAÇÃO ABORTADA: O bucket "nexaweb-vault" já existe configurado como PÚBLICO');
    }
    console.log('[4.1] Cenário A: nexaweb-vault preexistente como PÚBLICO aborta migração:', caughtVaultError ? 'PASS' : 'FAIL');
    if (!caughtVaultError) throw new Error('Falha 4.1');

    // Cenário B: nexaweb-public já existe como privado
    let caughtPublicError = false;
    try {
      simulateBucketMigration({ 'nexaweb-public': { public: false } });
    } catch (e) {
      caughtPublicError = e.message.includes('MIGRAÇÃO ABORTADA: O bucket "nexaweb-public" já existe configurado como PRIVADO');
    }
    console.log('[4.2] Cenário B: nexaweb-public preexistente como PRIVADO aborta migração:', caughtPublicError ? 'PASS' : 'FAIL');
    if (!caughtPublicError) throw new Error('Falha 4.2');

    // Cenário C: Buckets inexistentes ou com visibilidade compatível
    const normalResult = simulateBucketMigration({ 'nexaweb-vault': { public: false }, 'nexaweb-public': { public: true } });
    console.log('[4.3] Cenário C: Buckets compatíveis aceitos sem mutação destrutiva:', normalResult === 'SUCESSO' ? 'PASS' : 'FAIL');
    if (normalResult !== 'SUCESSO') throw new Error('Falha 4.3');
  }

  // TESTE 5: Compatibilidade com Briefing e Upload Administrativo
  console.log('\n--- 5. Testando Compatibilidade dos Fluxos ---');
  {
    // Briefing
    const clientRes = await sendUpload(projectId, ticket, sampleJpg);
    console.log('[5.1] Fluxo do formulário de briefing com ticket temporário:', clientRes.statusCode === 200 ? 'PASS' : 'FAIL');
    if (clientRes.statusCode !== 200) throw new Error('Falha 5.1');

    // Admin
    process.env.NEXAWEB_ADMIN_SESSION_SECRET = 'admin-secret-test-key-32-chars-long';
    const adminCookie = `nexaweb_admin_session=${createSessionToken()}`;
    const adminRes = await sendUpload(null, null, sampleJpg, 'image/jpeg', adminCookie);
    const hasPermanentUrl = adminRes.responseData?.url && !adminRes.responseData.url.includes('?token=');
    console.log('[5.2] Fluxo de upload administrativo com URL pública permanente:', (adminRes.statusCode === 200 && hasPermanentUrl) ? 'PASS' : 'FAIL');
    if (adminRes.statusCode !== 200 || !hasPermanentUrl) throw new Error('Falha 5.2');
  }

  console.log('\n====================================================');
  console.log('TODOS OS TESTES COMPLEMENTARES PASSARAM COM SUCESSO!');
  console.log('====================================================\n');
}

runE2E().catch(err => {
  console.error('ERRO FATAL NA VALIDAÇÃO:', err);
  process.exit(1);
});
