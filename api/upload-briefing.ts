// MOCKED — in-memory Map stub for AI Studio environment (Phase 2.3 of migration guidelines)
const inMemoryBlobs = new Map<string, { buffer: ArrayBuffer; contentType: string }>();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json(
        { error: 'Nenhum arquivo foi enviado.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return Response.json(
        { error: 'Apenas imagens são permitidas.' },
        { status: 400 }
      );
    }

    const pathname = `briefings/${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();
    inMemoryBlobs.set(pathname, { buffer, contentType: file.type });

    // Generate responsive safe data URL for client preview
    const base64 = Buffer.from(buffer).toString('base64');
    const url = `data:${file.type};base64,${base64}`;

    return Response.json({
      url,
      pathname,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    return Response.json(
      { error: 'Não foi possível enviar a imagem.' },
      { status: 500 }
    );
  }
}
