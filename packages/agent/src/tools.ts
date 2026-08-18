import { spawn } from 'node:child_process';
import { isAbsolute, join, relative } from 'node:path';
import type { Tool, ToolContext, ToolResult, ToolFs } from './types.js';

/** Resolve a possibly-relative path against the workspace, rejecting escapes. */
export function resolvePath(workspace: string, p: string): string {
  const target = isAbsolute(p) ? p : join(workspace, p);
  const rel = relative(workspace, target);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path escapes workspace: ${p}`);
  }
  return target;
}

/** Run a shell command and capture stdout/stderr. Cross-platform via the shell. */
export function runCommand(
  command: string,
  cwd: string,
  opts?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
  const shellArg = process.platform === 'win32' ? ['-NoProfile', '-Command'] : ['-c'];
  const timeoutMs = opts?.timeoutMs ?? 120_000;

  return new Promise((resolveResult, reject) => {
    const child = spawn(shell, [...shellArg, command], {
      cwd,
      shell: false,
      windowsHide: true,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    const abort = () => child.kill('SIGKILL');
    opts?.signal?.addEventListener('abort', abort, { once: true });

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      opts?.signal?.removeEventListener('abort', abort);
      if (timedOut) {
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
        return;
      }
      resolveResult({ code: code ?? -1, stdout, stderr });
    });
  });
}

/** Tool: execute a shell command in the workspace. */
export const shellTool: Tool = {
  definition: {
    name: 'execute_command',
    description:
      'Run a shell command in the workspace. Use for builds, tests, git, package managers, and scripts. The working directory is the workspace root.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to run.' },
        timeout_ms: { type: 'number', description: 'Optional timeout in milliseconds (default 120000).' },
      },
      required: ['command'],
    },
  },
  async execute(args, ctx: ToolContext): Promise<ToolResult> {
    const command = String(args.command ?? '');
    if (!command.trim()) return { toolCallId: '', ok: false, content: 'No command provided.' };
    try {
      const res = await runCommand(command, ctx.workspace, {
        timeoutMs: typeof args.timeout_ms === 'number' ? args.timeout_ms : undefined,
        signal: ctx.signal,
      });
      const out = [
        `exit code: ${res.code}`,
        res.stdout ? `--- stdout ---\n${res.stdout}` : '',
        res.stderr ? `--- stderr ---\n${res.stderr}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return { toolCallId: '', ok: res.code === 0, content: out };
    } catch (e) {
      return { toolCallId: '', ok: false, content: e instanceof Error ? e.message : String(e) };
    }
  },
};

/** Tool: read a file from the workspace. */
export const readFileTool = (fs: ToolFs): Tool => ({
  definition: {
    name: 'read_file',
    description: 'Read a file from the workspace and return its contents.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Absolute or workspace-relative file path.' } },
      required: ['path'],
    },
  },
  async execute(args, ctx: ToolContext): Promise<ToolResult> {
    try {
      const p = resolvePath(ctx.workspace, String(args.path ?? ''));
      const content = await fs.readFile(p);
      return { toolCallId: '', ok: true, content };
    } catch (e) {
      return { toolCallId: '', ok: false, content: e instanceof Error ? e.message : String(e) };
    }
  },
});

/** Tool: write (or overwrite) a file in the workspace. */
export const writeFileTool = (fs: ToolFs): Tool => ({
  definition: {
    name: 'write_file',
    description: 'Write content to a file in the workspace, creating directories as needed. Overwrites existing files.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or workspace-relative file path.' },
        content: { type: 'string', description: 'The complete file content to write.' },
      },
      required: ['path', 'content'],
    },
  },
  async execute(args, ctx: ToolContext): Promise<ToolResult> {
    try {
      const p = resolvePath(ctx.workspace, String(args.path ?? ''));
      await fs.writeFile(p, String(args.content ?? ''));
      return { toolCallId: '', ok: true, content: `Wrote ${p}` };
    } catch (e) {
      return { toolCallId: '', ok: false, content: e instanceof Error ? e.message : String(e) };
    }
  },
});

/** Tool: list files/directories in the workspace. */
export const listFilesTool = (fs: ToolFs): Tool => ({
  definition: {
    name: 'list_files',
    description: 'List files and directories. Returns one path per line relative to the workspace.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Directory to list (defaults to workspace root).' } },
    },
  },
  async execute(args, ctx: ToolContext): Promise<ToolResult> {
    try {
      const p = args.path ? resolvePath(ctx.workspace, String(args.path)) : ctx.workspace;
      const entries = await fs.listFiles(p);
      return { toolCallId: '', ok: true, content: entries.join('\n') };
    } catch (e) {
      return { toolCallId: '', ok: false, content: e instanceof Error ? e.message : String(e) };
    }
  },
});

/** Assemble the built-in toolset bound to a filesystem adapter. */
export function builtinTools(fs: ToolFs): Tool[] {
  return [shellTool, readFileTool(fs), writeFileTool(fs), listFilesTool(fs)];
}