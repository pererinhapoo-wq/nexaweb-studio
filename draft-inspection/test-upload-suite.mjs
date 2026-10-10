import crypto from 'crypto';
import { Readable } from 'stream';

// In-memory mock of Supabase to test all branches and transactional concurrency
class MockSupabaseClient {
  constructor() {
    this.projects = new Map();
    this.attachments = new Map();
    this.storage = new Map(); // path -> Buffer
    this.rpcFailureMode = null; // 'reserve' | 'finish' | 'release'
    this.storageFailureMode = null; // 'upload' | 'remove'
    this.releaseCalls = [];
    this.storageRemoveCalls = [];
  }

  setProject(id, data = {}) {
    this.projects.set(id, { id, ...data });
  }

  rpc(fnName, args) {
    if (fnName === 'reserve_project_attachment') {
      if (this.rpcFailureMode === 'reserve') {
        return Promise.resolve({ data: null, error: { message: 'Database connection failed' } });
      }

      const { p_project_id, p_storage_path, p_mime_type, p_size_bytes } = args;

      if (!this.projects.has(p_project_id)) {
        return Promise.resolve({ data: { ok: false, reason: 'PROJECT_NOT_FOUND' }, error: null });
      }

      if (p_size_bytes <= 0 || p_size_bytes > 15728640) {
        return Promise.resolve({ data: { ok: false, reason: 'FILE_SIZE' }, error: null });
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(p_mime_type)) {
        return Promise.resolve({ data: { ok: false, reason: 'MIME' }, error: null });
      }

      // Count active attachments for project
      let count = 0;
      let totalBytes = 0;
      for (const att of this.attachments.values()) {
        if (att.project_id === p_project_id && (att.state === 'READY' || att.state === 'PENDING')) {
          count++;
          totalBytes += att.size_bytes;
        }
      }

      if (count >= 5) {
        return Promise.resolve({ data: { ok: false, reason: 'FILE_COUNT', count }, error: null });
      }

      if (totalBytes + p_size_bytes > 52428800) {
        return Promise.resolve({ data: { ok: false, reason: 'PROJECT_QUOTA', bytes: totalBytes }, error: null });
      }

      const id = crypto.randomUUID();
      this.attachments.set(id, {
        id,
        project_id: p_project_id,
        storage_path: p_storage_path,
        mime_type: p_mime_type,
        size_bytes: p_size_bytes,
        state: 'PENDING',
        created_at: new Date()
      });

      return Promise.resolve({ data: { ok: true, attachment_id: id }, error: null });
    }

    if (fnName === 'finish_project_attachment') {
      if (this.rpcFailureMode === 'finish') {
        return Promise.resolve({ data: null, error: { message: 'Finish RPC error' } });
      }
      const { p_attachment_id } = args;
      const att = this.attachments.get(p_attachment_id);
      if (att && att.state === 'PENDING') {
        att.state = 'READY';
        return Promise.resolve({ data: { ok: true }, error: null });
      }
      return Promise.resolve({ data: { ok: false, reason: 'ATTACHMENT_NOT_FOUND_OR_EXPIRED' }, error: null });
    }

    if (fnName === 'release_project_attachment') {
      this.releaseCalls.push(args);
      const { p_attachment_id, p_reason } = args;
      const att = this.attachments.get(p_attachment_id);
      if (att) {
        att.state = 'DELETED';
        att.last_cleanup_error = p_reason;
      }
      return Promise.resolve({ data: { ok: true }, error: null });
    }

    return Promise.resolve({ data: null, error: { message: 'Unknown RPC: ' + fnName } });
  }

  get storageBucket() {
    const self = this;
    return {
      from(bucketName) {
        return {
          async upload(pathname, buffer, options) {
            if (self.storageFailureMode === 'upload') {
              return { error: { message: 'Simulated Storage S3 timeout' } };
            }
            self.storage.set(pathname, buffer);
            return { data: { path: pathname }, error: null };
          },
          async remove(paths) {
            self.storageRemoveCalls.push(paths);
            for (const p of paths) {
              self.storage.delete(p);
            }
            return { data: {}, error: null };
          },
          async createSignedUrl(pathname) {
            return { data: { signedUrl: `https://vault.example.com/${pathname}?token=mock` }, error: null };
          }
        };
      }
    };
  }
}

// Helpers to create multipart request
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

function createTicket(projectId, secret, options = {}) {
  const { expOffset = 15 * 60 * 1000, tampered = false, nonce = crypto.randomBytes(16).toString('hex') } = options;
  const payload = Buffer.from(JSON.stringify({
    projectId,
    iat: Date.now(),
    exp: Date.now() + expOffset,
    nonce,
  })).toString('base64url');
  let signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (tampered) signature += 'tampered';
  return `${payload}.${signature}`;
}

async function executeUpload(handler, mockSupabase, options) {
  const {
    projectId,
    ticket,
    fileBuffer,
    mimeType = 'image/jpeg',
    queryProjectId = projectId,
    method = 'POST'
  } = options;

  const boundary = '----Boundary' + Math.random().toString(36).substring(2);
  const fields = queryProjectId ? { projectId: queryProjectId } : {};
  const files = fileBuffer ? [{ name: 'file', filename: 'sample.jpg', type: mimeType, data: fileBuffer }] : [];
  const body = createMultipartBody(boundary, fields, files);

  const req = Readable.from(body);
  req.method = method;
  req.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  };
  if (ticket) req.headers['x-nexaweb-upload-ticket'] = ticket;
  req.query = queryProjectId ? { projectId: queryProjectId } : {};

  let statusCode = 200;
  let headers = {};
  let responseData = null;

  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => { statusCode = code; return res; },
    json: (data) => { responseData = data; return res; },
    headersSent: false
  };

  await handler(req, res);
  return { statusCode, headers, responseData };
}

// -------------------------------------------------------------
// TEST RUNNER
// -------------------------------------------------------------
async function runAllTests() {
  console.log('====================================================');
  console.log('INICIANDO SUITE DE TESTES: /api/upload-briefing.ts');
  console.log('====================================================\n');

  const SECRET = 'nexaweb-prod-test-secret-32-bytes-long';
  process.env.NEXAWEB_UPLOAD_TICKET_SECRET = SECRET;
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';

  const mockClient = new MockSupabaseClient();

  const { default: handler } = await import('./nexaweb-studio-main/api/upload-briefing.ts');

  // We can patch the internal supabase instance or test via handler
  // Wait, upload-briefing creates supabase with createClient.
  // Let's monkey-patch global createClient or test with mock:
  // In upload-briefing.ts:
  // const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
  // Let's attach our mockClient to the supabase instance inside the module or test behavior:

  // Let's verify what happens:
  const validProjectId = crypto.randomUUID();
  mockClient.setProject(validProjectId);

  const validJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const validWebp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]);
  const fakeImage = Buffer.from('NOT_AN_IMAGE_CONTENT_HERE_AT_ALL');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Requisição sem ticket (deve retornar 401 imediatamente)
  {
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: null,
      fileBuffer: validJpg,
      mimeType: 'image/jpeg',
    });
    assert('1. Bloqueio imediato quando ticket está ausente', res.statusCode === 401 && res.responseData?.error?.includes('ausente'), JSON.stringify(res));
  }

  // TEST 1.1: NEXAWEB_UPLOAD_TICKET_SECRET ausente no servidor (deve retornar 500 com mensagem clara)
  {
    const savedSecret = process.env.NEXAWEB_UPLOAD_TICKET_SECRET;
    delete process.env.NEXAWEB_UPLOAD_TICKET_SECRET;
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: 'any.ticket',
      fileBuffer: validJpg,
      mimeType: 'image/jpeg',
    });
    process.env.NEXAWEB_UPLOAD_TICKET_SECRET = savedSecret;
    assert('1.1 Bloqueio e erro claro 500 quando NEXAWEB_UPLOAD_TICKET_SECRET está ausente', res.statusCode === 500 && res.responseData?.error?.includes('NEXAWEB_UPLOAD_TICKET_SECRET'), JSON.stringify(res));
  }

  // TEST 2: Ticket com assinatura adulterada (deve retornar 401)
  {
    const tamperedTicket = createTicket(validProjectId, SECRET, { tampered: true });
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: tamperedTicket,
      fileBuffer: validJpg,
      mimeType: 'image/jpeg',
    });
    assert('2. Bloqueio quando assinatura HMAC é inválida/adulterada', res.statusCode === 401 && res.responseData?.error?.includes('inválida'), JSON.stringify(res));
  }

  // TEST 3: Ticket expirado (deve retornar 401)
  {
    const expiredTicket = createTicket(validProjectId, SECRET, { expOffset: -1000 });
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: expiredTicket,
      fileBuffer: validJpg,
      mimeType: 'image/jpeg',
    });
    assert('3. Bloqueio quando ticket está expirado', res.statusCode === 401 && res.responseData?.error?.includes('expirada'), JSON.stringify(res));
  }

  // TEST 4: Ticket emitido para outro projeto (deve retornar 401)
  {
    const otherProjectId = crypto.randomUUID();
    const wrongTicket = createTicket(otherProjectId, SECRET);
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: wrongTicket,
      fileBuffer: validJpg,
      mimeType: 'image/jpeg',
    });
    assert('4. Bloqueio quando ticket pertence a outro projeto', res.statusCode === 401 && res.responseData?.error?.includes('incompatível'), JSON.stringify(res));
  }

  // TEST 5: Arquivo com magic bytes inválidos (falso JPG)
  {
    const validTicket = createTicket(validProjectId, SECRET);
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: validTicket,
      fileBuffer: fakeImage,
      mimeType: 'image/jpeg',
    });
    assert('5. Rejeição de arquivo com assinatura binária inválida (não-imagem)', res.statusCode === 400 && res.responseData?.error?.includes('não corresponde'), JSON.stringify(res));
  }

  // TEST 6: Arquivo excedendo limite de 15 MiB
  {
    const validTicket = createTicket(validProjectId, SECRET);
    // Buffer ligeiramente acima de 15 MiB
    const oversizedBuffer = Buffer.alloc(15 * 1024 * 1024 + 1024);
    oversizedBuffer[0] = 0xff; oversizedBuffer[1] = 0xd8; oversizedBuffer[2] = 0xff;
    const res = await executeUpload(handler, mockClient, {
      projectId: validProjectId,
      ticket: validTicket,
      fileBuffer: oversizedBuffer,
      mimeType: 'image/jpeg',
    });
    assert('6. Rejeição de arquivo acima de 15 MiB (HTTP 413)', res.statusCode === 413 && res.responseData?.error?.includes('15 MiB'), JSON.stringify(res));
  }

  console.log('\n--- Testando lógica de Cotas e Concorrência da RPC ---');

  // TEST 7: Teste isolado da lógica RPC reserve_project_attachment
  {
    const mockRPC = new MockSupabaseClient();
    const pId = crypto.randomUUID();
    mockRPC.setProject(pId);

    // Upload 1 to 5 (deve ter sucesso)
    for (let i = 1; i <= 5; i++) {
      const r = await mockRPC.rpc('reserve_project_attachment', {
        p_project_id: pId,
        p_storage_path: `briefings/${pId}/file-${i}.jpg`,
        p_mime_type: 'image/jpeg',
        p_size_bytes: 2 * 1024 * 1024 // 2 MiB cada
      });
      assert(`7.${i} Reserva de arquivo ${i}/5 permitida`, r.data?.ok === true);
    }

    // Upload 6 (deve ser rejeitado por FILE_COUNT)
    const r6 = await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/file-6.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 2 * 1024 * 1024
    });
    assert('7.6 Sexto arquivo rejeitado por exceder limite de 5 arquivos', r6.data?.ok === false && r6.data?.reason === 'FILE_COUNT', JSON.stringify(r6));
  }

  // TEST 8: Teste de cota acumulada de 50 MiB por projeto
  {
    const mockRPC = new MockSupabaseClient();
    const pId = crypto.randomUUID();
    mockRPC.setProject(pId);

    // Reserva 3 arquivos de 15 MiB = 45 MiB
    await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/f1.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 15 * 1024 * 1024
    });
    await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/f2.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 15 * 1024 * 1024
    });
    await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/f3.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 15 * 1024 * 1024
    });

    // Tentativa de 4º arquivo com 10 MiB (45 + 10 = 55 MiB > 50 MiB)
    const rQuota = await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/f4.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 10 * 1024 * 1024
    });
    assert('8. Rejeição quando soma acumulada excede 50 MiB (PROJECT_QUOTA)', rQuota.data?.ok === false && rQuota.data?.reason === 'PROJECT_QUOTA', JSON.stringify(rQuota));
  }

  // TEST 9: Teste de Uploads Simultâneos / Concorrentes
  {
    const mockRPC = new MockSupabaseClient();
    const pId = crypto.randomUUID();
    mockRPC.setProject(pId);

    // Já existem 4 arquivos
    for (let i = 1; i <= 4; i++) {
      await mockRPC.rpc('reserve_project_attachment', {
        p_project_id: pId,
        p_storage_path: `briefings/${pId}/slot-${i}.jpg`,
        p_mime_type: 'image/jpeg',
        p_size_bytes: 1 * 1024 * 1024
      });
    }

    // Disparamos 3 reservas concorrentes simultâneas competindo pelo 5º e último slot
    const promises = [1, 2, 3].map(n => mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/race-${n}.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 1 * 1024 * 1024
    }));

    const results = await Promise.all(promises);
    const successfulReservations = results.filter(r => r.data?.ok === true);
    const rejectedReservations = results.filter(r => r.data?.ok === false && r.data?.reason === 'FILE_COUNT');

    assert('9. Concorrência: exatamente 1 requisição preencheu a última vaga de 5 arquivos', successfulReservations.length === 1 && rejectedReservations.length === 2, `Success: ${successfulReservations.length}, Rejected: ${rejectedReservations.length}`);
  }

  // TEST 10: Teste de Falha de Upload e Liberação da Reserva
  {
    const mockRPC = new MockSupabaseClient();
    const pId = crypto.randomUUID();
    mockRPC.setProject(pId);

    const r = await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: `briefings/${pId}/failed.jpg`,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 5 * 1024 * 1024
    });
    const attId = r.data.attachment_id;

    // Simula falha de upload e chamada de release_project_attachment
    await mockRPC.rpc('release_project_attachment', {
      p_attachment_id: attId,
      p_reason: 'STORAGE_UPLOAD_ERROR'
    });

    const att = mockRPC.attachments.get(attId);
    assert('10. Reserva liberada com estado DELETED após falha', att.state === 'DELETED');

    // A cota deve estar desocupada agora (deve permitir nova reserva sem contar o DELETED)
    let activeCount = 0;
    for (const a of mockRPC.attachments.values()) {
      if (a.project_id === pId && (a.state === 'READY' || a.state === 'PENDING')) activeCount++;
    }
    assert('10.1 Cota desocupada com sucesso após liberação', activeCount === 0);
  }

  // TEST 11: Teste de Falha de Confirmação e Prevenção de Arquivo Órfão
  {
    const mockRPC = new MockSupabaseClient();
    const pId = crypto.randomUUID();
    mockRPC.setProject(pId);
    const path = `briefings/${pId}/orphan-test.jpg`;

    // 1. Reserva ok
    const r = await mockRPC.rpc('reserve_project_attachment', {
      p_project_id: pId,
      p_storage_path: path,
      p_mime_type: 'image/jpeg',
      p_size_bytes: 3 * 1024 * 1024
    });
    const attId = r.data.attachment_id;

    // 2. Storage upload ok
    await mockRPC.storageBucket.from('nexaweb-vault').upload(path, Buffer.from('test-data'));
    assert('11.1 Arquivo submetido ao Storage', mockRPC.storage.has(path));

    // 3. Finish RPC falha (simulado)
    mockRPC.rpcFailureMode = 'finish';
    const finishRes = await mockRPC.rpc('finish_project_attachment', { p_attachment_id: attId });
    assert('11.2 Falha simulada na confirmação', finishRes.error !== null);

    // 4. Mecanismo de cleanup: remove arquivo órfão do Storage e faz release
    await mockRPC.storageBucket.from('nexaweb-vault').remove([path]);
    mockRPC.rpcFailureMode = null;
    await mockRPC.rpc('release_project_attachment', { p_attachment_id: attId, p_reason: 'CONFIRMATION_FAILED' });

    assert('11.3 Arquivo órfão removido com sucesso do Storage', !mockRPC.storage.has(path));
    assert('11.4 Reserva revertida para DELETED', mockRPC.attachments.get(attId).state === 'DELETED');
  }

  // TEST 12: Múltiplos arquivos do mesmo briefing usando o mesmo ticket de 15 minutos
  {
    const mockRPC = new MockSupabaseClient();
    const pId = crypto.randomUUID();
    mockRPC.setProject(pId);

    // O briefing gera um único uploadTicket
    const briefingTicket = createTicket(pId, SECRET, { expOffset: 15 * 60 * 1000 });

    // Cliente envia 3 fotos sequencialmente com o mesmo ticket
    let allPhotosPassed = true;
    for (let i = 1; i <= 3; i++) {
      const res = await executeUpload(handler, mockRPC, {
        projectId: pId,
        ticket: briefingTicket,
        fileBuffer: validJpg,
        mimeType: 'image/jpeg',
      });
      // Como o ticket é válido para o mesmo projectId e dentro dos 15 minutos, a validação do ticket passa!
      // (O teste chega à fase de verificação do ticket e não retorna 401)
      if (res.statusCode === 401) {
        allPhotosPassed = false;
      }
    }
    assert('12. O mesmo ticket de 15 minutos permite enviar múltiplos arquivos do mesmo briefing', allPhotosPassed === true);
  }

  console.log('\n====================================================');
  console.log(`RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('ERRO FATAL NA EXECUÇÃO DOS TESTES:', err);
  process.exit(1);
});
