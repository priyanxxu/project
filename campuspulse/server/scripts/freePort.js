import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
const port = Number(process.env.PORT || 5000);

async function freeWindowsPort() {
  if (process.platform !== 'win32') return;
  try {
    const { stdout } = await execAsync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`);
    const pids = [...stdout.matchAll(/LISTENING\s+(\d+)\s*$/gm)].map(m => m[1]);
    for (const pid of [...new Set(pids)]) {
      if (pid === String(process.pid)) continue;
      try { await execAsync(`taskkill /PID ${pid} /F`); console.log(`[CampusPulse] Freed port ${port} (PID ${pid}).`); } catch {}
    }
  } catch {}
}

await freeWindowsPort();
