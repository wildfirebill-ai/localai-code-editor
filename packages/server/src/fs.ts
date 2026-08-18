import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, isAbsolute, relative, dirname, sep } from 'node:path';
import type { ToolFs } from '@localai/agent';

/**
 * Filesystem adapter for the agent's file tools, sandboxed to a workspace
 * root. All paths are resolved against the workspace and must not escape it.
 */
export class WorkspaceFs implements ToolFs {
  constructor(private readonly root: string) {}

  private resolve(p: string): string {
    const target = isAbsolute(p) ? p : resolve(this.root, p);
    const rel = relative(this.root, target);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error(`Path escapes workspace: ${p}`);
    }
    return target;
  }

  async readFile(path: string): Promise<string> {
    return readFile(this.resolve(path), 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    const target = this.resolve(path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf-8');
  }

  async listFiles(path: string): Promise<string[]> {
    const target = path ? this.resolve(path) : this.root;
    const entries = await readdir(target, { withFileTypes: true });
    return entries.map((e) => {
      const rel = relative(this.root, resolve(target, e.name));
      const display = rel.split(sep).join('/');
      return e.isDirectory() ? `${display}/` : display;
    });
  }

  async pathExists(path: string): Promise<boolean> {
    try {
      await readFile(this.resolve(path));
      return true;
    } catch {
      return false;
    }
  }
}