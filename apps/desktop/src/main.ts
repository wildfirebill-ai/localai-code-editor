import { app, BrowserWindow, shell } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = Number(process.env.LOCALAI_PORT ?? 4801);
const HOST = '127.0.0.1';
const URL = `http://${HOST}:${PORT}`;

/** Find the server entrypoint, whether running from source or a packaged app. */
function serverEntry(): string {
  // Packaged: server copied to extraResources/server
  const packaged = process.resourcesPath
    ? join(process.resourcesPath, 'server', 'dist', 'index.js')
    : '';
  if (process.resourcesPath && existsSync(packaged)) return packaged;
  // Dev: run from the workspace package
  return resolve(__dirname, '../../../packages/server/dist/index.js');
}

let server: ChildProcess | null = null;
let window: BrowserWindow | null = null;

function startServer(workspace: string): ChildProcess {
  const entry = serverEntry();
  const args = [entry, '--port', String(PORT), '--host', HOST, '--workspace', workspace];
  const child = spawn(process.execPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  child.stdout?.on('data', (d) => console.log('[server]', String(d).trim()));
  child.stderr?.on('data', (d) => console.error('[server]', String(d).trim()));
  child.on('exit', (code) => console.log(`[server] exited with code ${code}`));
  return child;
}

/** Probe until the server HTTP endpoint answers. */
async function waitForServer(timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(URL);
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await delay(250);
  }
  throw new Error(`Server did not become ready at ${URL}`);
}

async function createWindow(): Promise<void> {
  window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'LocalAI Code Editor',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // Open external links in the OS browser.
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  await window.loadURL(URL);
}

app.whenReady().then(async () => {
  const workspace = process.env.LOCALAI_WORKSPACE || app.getPath('documents');
  server = startServer(workspace);
  try {
    await waitForServer();
    await createWindow();
  } catch (e) {
    console.error('Failed to start LocalAI Code Editor:', e);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server?.kill();
    app.quit();
  }
});

app.on('before-quit', () => {
  server?.kill();
});