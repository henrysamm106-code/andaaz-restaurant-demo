import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerCoreApiRoutes } from './server/coreRoutes.ts';
import { registerManagementApiRoutes } from './server/apiRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '32kb' }));

  registerCoreApiRoutes(app);
  registerManagementApiRoutes(app);

  // Serve public assets directly before Vite/SPA fallback
  app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
  app.use('/assets', (_req, res) => {
    res.status(404).end();
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Andaaz Restaurant preview server listening on port ${PORT}`);
  });
}

startServer();
