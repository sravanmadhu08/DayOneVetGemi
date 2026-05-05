import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Starting backend services...');
  
  const isWindows = process.platform === 'win32';
  const venvPython = isWindows 
    ? path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe')
    : path.join(__dirname, 'backend', 'venv', 'bin', 'python');

  // Order of preference: Virtual Env -> python3 -> python
  const pythonCmds = [venvPython, 'python3', 'python'];

  const logFile = path.join(__dirname, 'backend_setup.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  const runDjangoCommand = (args: string[], onExit?: (code: number | null) => void) => {
    let currentCmdIndex = 0;

    const attempt = () => {
      const cmd = pythonCmds[currentCmdIndex];
      
      console.log(`[Backend] Attempting command with: ${cmd} ${args.join(' ')}`);
      logStream.write(`\n--- [${new Date().toISOString()}] Attempting: ${cmd} ${args.join(' ')} ---\n`);

      // Verify python version if it's the first time
      if (args[0] === 'backend/manage.py') {
        spawn(cmd, ['--version'], { stdio: 'inherit' });
      }

      const proc = spawn(cmd, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      proc.stdout?.on('data', (data) => {
        logStream.write(data);
        process.stdout.write(data);
      });
      proc.stderr?.on('data', (data) => {
        logStream.write(data);
        process.stderr.write(data);
      });

      proc.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          if (currentCmdIndex < pythonCmds.length - 1) {
            console.log(`[Backend] ${cmd} not found, trying next option...`);
            currentCmdIndex++;
            attempt();
          } else {
            console.error(`[Backend] Fatal: No Python executable found in path. tried: ${pythonCmds.join(', ')}`);
          }
        } else {
          console.error(`[Backend] Failed to execute ${cmd}:`, err);
        }
      });

      if (onExit) {
        proc.on('close', (code) => {
          if (code !== 0 && code !== null) {
            console.warn(`[Backend] Command "${cmd} ${args[0]}" exited with code ${code}.`);
          }
          onExit(code);
        });
      }

      return proc;
    };

    return attempt();
  };

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
    
    // Debug: List files
    console.log('CWD contents:', fs.readdirSync(process.cwd()));
    if (fs.existsSync(path.join(process.cwd(), 'backend'))) {
      console.log('Backend contents:', fs.readdirSync(path.join(process.cwd(), 'backend')));
    }
    
    // Setup Backend after proxy is ready
    console.log('Preparing Python environment...');
    runDjangoCommand(['-m', 'pip', 'install', '-r', 'backend/requirements.txt'], (pipCode) => {
      console.log(`Pip install finished with code ${pipCode}`);
      
      // Run migrations
      console.log('Running Django migrations...');
      runDjangoCommand(['backend/manage.py', 'migrate'], (migrateCode) => {
        console.log(`Migrations finished with code ${migrateCode}`);
        
        console.log('Starting Django development server...');
        runDjangoCommand(['backend/manage.py', 'runserver', '8000']);
      });
    });
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
