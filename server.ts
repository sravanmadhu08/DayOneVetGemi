import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('Starting backend services...');
  
  const isWindows = process.platform === 'win32';
  const venvPython = isWindows 
    ? path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe')
    : path.join(__dirname, 'backend', 'venv', 'bin', 'python');

  // Order of preference: Virtual Env -> python3 -> python
  const pythonCmds = [venvPython, 'python3', 'python', '/usr/bin/python3', '/usr/bin/python'];
  const pipCmds = ['pip3', 'pip', '/usr/bin/pip3', '/usr/bin/pip'];

  const logFile = path.join(process.cwd(), 'backend.log');
  fs.writeFileSync(logFile, `--- Log Start ${new Date().toISOString()} ---\n`);
  const writeLog = (msg: string | Buffer) => {
    fs.appendFileSync(logFile, msg);
  };

  console.log('[Server] Starting backend setup sequence...');
  writeLog('[Server] Starting backend setup sequence...\n');

  const execPromise = (cmd: string, args: string[]) => {
    return new Promise<number | null>((resolve) => {
      const msg = `\n[Exec] ${cmd} ${args.join(' ')}\n`;
      console.log(msg);
      writeLog(msg);
      const proc = spawn(cmd, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      proc.stdout?.on('data', (data) => {
        writeLog(data);
        process.stdout.write(data);
      });
      proc.stderr?.on('data', (data) => {
        writeLog(data);
        process.stderr.write(data);
      });

      proc.on('error', (err: any) => {
        writeLog(`[Error] ${cmd}: ${err.message}\n`);
        resolve(-1);
      });

      proc.on('close', (code) => {
        writeLog(`[Exit] ${cmd} code ${code}\n`);
        resolve(code);
      });
    });
  };

  const checkPort = (port: number) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const h = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 1000);

      socket.on('connect', () => {
        clearTimeout(h);
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        clearTimeout(h);
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, '127.0.0.1');
    });
  };

  const setupBackend = async () => {
    writeLog('[Setup] Starting setupBackend...\n');
    try {
      writeLog('[Setup] Checking port 8001...\n');
      const isRunning = await checkPort(8001);
      writeLog(`[Setup] Port 8001 status: ${isRunning}\n`);
      if (isRunning) {
        writeLog('Django is already running on port 8001!\n');
        console.log('Django is already running on port 8001!');
        return;
      }
    } catch (e: any) {
      writeLog(`[Setup] Error checking port: ${e.message}\n`);
    }
    
    writeLog('[Setup] Proceeding with python search...\n');
    const possiblePythons = ['python3', 'python', '/usr/bin/python3', '/usr/bin/python'];
    let python = '';
    
    for (const c of possiblePythons) {
      const code = await execPromise(c, ['--version']);
      if (code === 0) {
        python = c;
        break;
      }
    }

    if (!python) {
      writeLog('[Fatal] No python found\n');
      return;
    }

    console.log(`Using python: ${python}`);
    writeLog(`Using python: ${python}\n`);
    
    // Try to install django globally/user-level if it's not there
    const hasDjango = await execPromise(python, ['-c', 'import django; print(django.get_version())']);
    if (hasDjango !== 0) {
      writeLog('Django not found, checking for pip...\n');
      const hasPip = await execPromise(python, ['-m', 'pip', '--version']);
      if (hasPip !== 0) {
        writeLog('Pip not found, attempting to bootstrap it via urllib...\n');
        const bootstrapCode = `
import urllib.request
import os
try:
    print("Downloading get-pip.py...")
    urllib.request.urlretrieve("https://bootstrap.pypa.io/get-pip.py", "get-pip.py")
    print("get-pip.py downloaded.")
except Exception as e:
    print(f"Download failed: {e}")
    exit(1)
`;
        const downloadResult = await execPromise(python, ['-c', bootstrapCode]);
        if (downloadResult === 0) {
          writeLog('Installing pip...\n');
          await execPromise(python, ['get-pip.py', '--user']);
        }
      }
      
      writeLog('Attempting to install requirements...\n');
      await execPromise(python, ['-m', 'pip', 'install', '--user', 'django', 'djangorestframework', 'django-cors-headers', 'python-dotenv', 'djangorestframework-simplejwt']);
    }

    // Apply committed migrations only. Generating migrations on every dev launch
    // can create noisy files and make startup do unexpected work.
    await execPromise(python, ['backend/manage.py', 'migrate']);
    
    // Ensure default settings exist
    writeLog('Ensuring default settings exist...\n');
    const seedSettings = "from accounts.models import GlobalSetting; GlobalSetting.objects.get_or_create(key='global', defaults={'value': {'isFreeMode': True}, 'description': 'Main global settings'})";
    await execPromise(python, ['backend/manage.py', 'shell', '-c', seedSettings]);

    // Start server
    console.log('Starting Django server on port 8001...');
    writeLog('--- Starting Django server on port 8001 ---\n');
    const djangoProc = spawn(python, ['backend/manage.py', 'runserver', '127.0.0.1:8001'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    djangoProc.stdout?.on('data', (data) => writeLog(data));
    djangoProc.stderr?.on('data', (data) => writeLog(data));
    
    djangoProc.on('error', (err) => {
      console.error('Failed to start Django:', err);
      writeLog(`[Fatal] Failed to start Django: ${err.message}\n`);
    });

    djangoProc.on('close', (code) => {
      writeLog(`[Exit] Django server closed with code ${code}\n`);
    });
  };

  if (!isProduction) {
    setupBackend(); // Start backend setup only for local development.
  }

  // Proxy API requests to Django
  app.use(createProxyMiddleware({
    target: 'http://127.0.0.1:8001',
    changeOrigin: true,
    xfwd: true,
    pathFilter: '/api',
    on: {
      error: (err, req, res) => {
        console.error('Proxy Error for /api:', err);
        (res as any).status(502).json({ error: 'Backend unreachable', details: (err as any).message });
      },
      proxyReq: (proxyReq, req, res) => {
        const msg = `Proxying ${req.method} ${req.url} to Django...\n`;
        console.log(msg);
        writeLog(msg);
      }
    }
  }));

  // Proxy admin requests to Django
  app.use(createProxyMiddleware({
    target: 'http://127.0.0.1:8001',
    changeOrigin: true,
    xfwd: true,
    pathFilter: '/django-admin',
  }));

  // Proxy static files (Django)
  app.use(createProxyMiddleware({
    target: 'http://127.0.0.1:8001',
    changeOrigin: true,
    xfwd: true,
    pathFilter: '/static',
  }));

  if (!isProduction) {
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

  app.listen(PORT, isProduction ? '0.0.0.0' : '127.0.0.1', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
