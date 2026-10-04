import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

function setupAdminMiddlewares(server: any) {
  // Garante que requisições para /admin ou /admin/ entreguem admin.html
  server.middlewares.use((req: any, _res: any, next: any) => {
    const url = req.url?.split('?')[0] || '';
    if (url === '/admin' || url === '/admin/') {
      req.url = '/admin.html';
    }
    next();
  });

  // Rotas de autenticação administrativa do proprietário
  server.middlewares.use('/api/admin-login', async (req: any, res: any) => {
    const { default: handler } = await import('./api/admin-login.ts');
    await handler(req, res);
  });

  server.middlewares.use('/api/admin-session', async (req: any, res: any) => {
    const { default: handler } = await import('./api/admin-session.ts');
    await handler(req, res);
  });

  server.middlewares.use('/api/admin-logout', async (req: any, res: any) => {
    const { default: handler } = await import('./api/admin-logout.ts');
    await handler(req, res);
  });

  // Rota administrativa para listagem de projetos reais
  server.middlewares.use('/api/admin-projects', async (req: any, res: any) => {
    if (!res.status) {
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
    }
    if (!res.json) {
      res.json = (data: any) => {
        if (typeof res.setHeader === 'function') {
          res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(data));
        return res;
      };
    }
    const { default: handler } = await import('./api/admin-projects.ts');
    await handler(req, res);
  });

  // Mock da API de upload de briefings
  server.middlewares.use('/api/upload-briefing', (req: any, res: any) => {
    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const randomId = Math.random().toString(36).substring(2, 9);
        const mockUrl =
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            url: mockUrl,
            pathname: `briefings/${Date.now()}-${randomId}.jpg`,
          })
        );
      });
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  });
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'nexaweb-admin-routing-plugin',
        configureServer(server) {
          setupAdminMiddlewares(server);
        },
        configurePreviewServer(server) {
          setupAdminMiddlewares(server);
        },
        closeBundle() {
          try {
            const distPath = path.resolve('dist');
            const adminDirPath = path.resolve('dist/admin');
            const adminHtmlPath = path.resolve('dist/admin.html');
            const indexHtmlPath = path.resolve('dist/index.html');

            if (fs.existsSync(distPath)) {
              if (!fs.existsSync(adminDirPath)) {
                fs.mkdirSync(adminDirPath, { recursive: true });
              }
              const sourceHtml = fs.existsSync(adminHtmlPath)
                ? adminHtmlPath
                : indexHtmlPath;
              if (fs.existsSync(sourceHtml)) {
                fs.copyFileSync(sourceHtml, path.resolve(adminDirPath, 'index.html'));
              }
            }
          } catch (e) {
            console.warn('Notice: admin static bundle copy note:', e);
          }
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve('index.html'),
          admin: path.resolve('admin.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.', '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
