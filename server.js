import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.routes.js';
import { requestIdMiddleware, errorHandler } from './server/middleware/common.middleware.js';
import { seedStaticCsvFiles } from './server/data/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

async function configureApp() {
  // Initialize static CSV fixtures and demo datasets
  try {
    seedStaticCsvFiles();
  } catch (e) {
    console.warn('[Seed] Warning during initial CSV seed:', e.message);
  }

  // Basic Security & Parsing Middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(requestIdMiddleware);

  // Request Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        const duration = Date.now() - start;
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms) [${req.id}]`);
      }
    });
    next();
  });

  // CORS for dev environments
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-User-Role, X-User-Name, X-User-Id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Mount API Endpoints FIRST
  app.use('/api/v1', apiRouter);

  // Serve static demo csv datasets directly
  app.use('/data', express.static(path.join(__dirname, 'data')));

  // Error handling middleware
  app.use(errorHandler);

  const isVercelDeployment = Boolean(process.env.VERCEL);

  if (isVercelDeployment) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const requestedPath = req.path || '/';
      if (requestedPath.startsWith('/api') || requestedPath.startsWith('/data')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    return app;
  }

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

configureApp().then((serverApp) => {
  if (process.env.VERCEL) {
    export default serverApp;
    return;
  }

  serverApp.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` AI FINANCE CONTROLLER — SERVER RUNNING`);
    console.log(` Address: http://0.0.0.0:${PORT}`);
    console.log(` API Base: http://0.0.0.0:${PORT}/api/v1`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('[Server Startup Error]', err);
  process.exit(1);
});

module.exports = serverApp;
