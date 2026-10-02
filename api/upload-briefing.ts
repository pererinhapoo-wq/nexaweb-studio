import { put } from '@vercel/blob';

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

    const blob = await put(
      `briefings/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
        addRandomSuffix: true,
      }
    );

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    return Response.json(
      { error: 'Não foi possível enviar a imagem.' },
      { status: 500 }
    );
  }
        }
