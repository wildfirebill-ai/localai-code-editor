import { app, BrowserWindow, dialog, shell } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = Number(process.env.LOCALAI_PORT ?? 4801);
const HOST = '127.0.0.1';
const URL = `http://${HOST}:${PORT}`;

/** Find the server entrypoint, whether running from source or a packaged app. */
function serverEntry(): string {
  // Packaged: single-file esbuild bundle in extraResources (no node_modules needed)
  const bundled = process.resourcesPath
    ? join(process.resourcesPath, 'server', 'index.cjs')
    : '';
  if (bundled && existsSync(bundled)) return bundled;
  // Dev fallback: tsc output inside the workspace
  return resolve(__dirname, '../../../packages/server/dist/index.js');
}

/** Packaged Windows/Linux GUI apps have no valid stdout — never let logging throw (EPIPE). */
function safeLog(fn: () => void): void {
  try {
    fn();
  } catch {
    /* ignore */
  }
}

let server: ChildProcess | null = null;
let window: BrowserWindow | null = null;
let stderrTail = '';

function startServer(workspace: string): ChildProcess {
  const entry = serverEntry();
  const args = [entry, '--port', String(PORT), '--host', HOST, '--workspace', workspace];
  // Packaged: point the server at the copied web UI; dev lets the server resolve it itself.
  const webDist =
    process.resourcesPath && existsSync(join(process.resourcesPath, 'web'))
      ? join(process.resourcesPath, 'web')
      : undefined;

  stderrTail = '';
  const child = spawn(process.execPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      LOCALAI_WEB_DIST: webDist ?? '',
      // CRITICAL on Windows: run the Electron binary in plain Node mode.
      // Without this the child re-initializes full Electron and dies with
      // "AssignProcessToJobObject: The request is not supported."
      ELECTRON_RUN_AS_NODE: '1',
    },
  });
  // Stream-level errors (EPIPE when parent pipes die) must never become uncaught exceptions.
  child.stdout?.on('error', () => {});
  child.stderr?.on('error', () => {});

  let outTail = '';
  child.stdout?.on('data', (d) => {
    const line = String(d).replace(/\s+/g, ' ').trim();
    if (!line) return;
    outTail = (outTail + '\n' + line).split('\n').slice(-10).join('\n');
    safeLog(() => console.log('[server]', line));
  });
  child.stderr?.on('data', (d) => {
    const line = String(d).replace(/\s+/g, ' ').trim();
    if (!line) return;
    stderrTail = (stderrTail + '\n' + line).split('\n').slice(-15).join('\n');
    safeLog(() => console.error('[server]', line));
  });
  child.on('exit', (code) => safeLog(() => console.log(`[server] exited with code ${code}`)));
  (child as ChildProcess & { __outTail?: string }).__outTail = '';
  child.stdout?.on('data', () => {
    (child as ChildProcess & { __outTail?: string }).__outTail = outTail;
  });
  return child;
}

function serverDiagnostics(): string {
  const c = server as (ChildProcess & { __outTail?: string }) | null;
  const parts: string[] = [];
  if (c?.exitCode !== null && c?.exitCode !== undefined) {
    parts.push(`Server process exited with code ${c.exitCode}`);
  }
  if (c?.__outTail) parts.push(`--- server output ---\n${c.__outTail}`);
  if (stderrTail) parts.push(`--- server errors ---\n${stderrTail}`);
  return parts.join('\n\n');
}

/** Probe until the server HTTP endpoint answers. */
async function waitForServer(timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (server && server.exitCode !== null && server.exitCode !== undefined) {
      throw new Error(`The editor backend crashed during startup.\n\n${serverDiagnostics()}`);
    }
    try {
      const res = await fetch(URL);
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await delay(250);
  }
  throw new Error(
    `The editor backend did not become ready at ${URL} within ${timeoutMs / 1000}s.` +
      (serverDiagnostics() ? `\n\n${serverDiagnostics()}` : ''),
  );
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
  try {
    server = startServer(workspace);
    await waitForServer();
    await createWindow();
  } catch (e) {
    safeLog(() => console.error('Failed to start LocalAI Code Editor:', e));
    dialog.showErrorBox(
      'LocalAI Code Editor failed to start',
      e instanceof Error ? e.message : String(e),
    );
    app.exit(1);
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
