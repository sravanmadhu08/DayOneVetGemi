import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Starting backend services...');
  
  // Run migrations
  try {
    console.log('Running Django migrations...');
    const migration = spawn('python3', ['backend/manage.py', 'migrate'], {
      stdio: 'inherit'
    });
    migration.on('close', (code) => {
      console.log(`Migration completed with code ${code}`);
    });
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  // Try starting Django with python3 or python
  const startDjango = () => {
    const pythonCmd = 'python3';
    console.log(`Executing ${pythonCmd} backend/manage.py runserver 8000`);
    const django = spawn(pythonCmd, ['backend/manage.py', 'runserver', '8000'], {
      stdio: 'inherit',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    django.on('error', (err) => {
      console.error('Failed to start Django with python3:', err);
      console.log('Retrying with python...');
      spawn('python', ['backend/manage.py', 'runserver', '8000'], {
        stdio: 'inherit',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
    });
    
    return django;
  };

  const djangoProcess = startDjango();

  // Proxy API requests to Django
  app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error('Proxy Error for /api:', err);
        (res as any).status(502).json({ error: 'Backend unreachable', details: (err as any).message });
      },
      proxyReq: (proxyReq, req, res) => {
        console.log(`Proxying ${req.method} ${req.url} to Django...`);
      }
    }
  }));

  // Proxy admin requests to Django
  app.use('/admin', createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  }));

  // Proxy static files (Django)
  app.use('/static', createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  }));

  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Vite in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
