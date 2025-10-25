#!/usr/bin/env node
const { execSync, spawn } = require('child_process');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function killPortWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = Array.from(new Set(
      out
        .split(/\r?\n/)
        .filter(line => line.trim().length > 0)
        .map(line => line.trim().split(/\s+/).pop())
        .filter(pid => pid && /^\d+$/.test(pid))
    ));
    if (pids.length) {
      console.log(`[dev-force] Puerto ${port} ocupado por PIDs: ${pids.join(', ')}, cerrando...`);
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        } catch {}
      }
      console.log(`[dev-force] Puerto ${port} liberado.`);
    } else {
      console.log(`[dev-force] Puerto ${port} libre.`);
    }
  } catch (err) {
    console.warn('[dev-force] No se pudo verificar el puerto con netstat:', err.message);
  }
}

function killPortUnix(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
    const pids = out.split(/\r?\n/).filter(Boolean);
    if (pids.length) {
      console.log(`[dev-force] Puerto ${port} ocupado por PIDs: ${pids.join(', ')}, cerrando...`);
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        } catch {}
      }
      console.log(`[dev-force] Puerto ${port} liberado.`);
    } else {
      console.log(`[dev-force] Puerto ${port} libre.`);
    }
  } catch (err) {
    console.warn('[dev-force] No se pudo verificar el puerto con lsof:', err.message);
  }
}

function ensurePortFree(port) {
  if (process.platform === 'win32') {
    killPortWindows(port);
  } else {
    killPortUnix(port);
  }
}

function startDev() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  console.log(`[dev-force] Iniciando Next.js en puerto ${PORT}...`);
  const child = spawn(npmCmd, ['run', 'dev'], { stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

ensurePortFree(PORT);
startDev();