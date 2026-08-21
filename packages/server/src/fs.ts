import { mkdir, readFile, readdir, rename, rm, writeFile, stat } from 'node:fs/promises';
import { resolve, isAbsolute, relative, dirname, sep, join } from 'node:path';
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

  /** Create an empty file. Fails if it already exists. */
  async createFile(path: string): Promise<void> {
    const target = this.resolve(path);
    try {
      await stat(target);
      throw new Error(`Already exists: ${path}`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, '', 'utf-8');
  }

  /** Create a directory (and parents). */
  async createDir(path: string): Promise<void> {
    await mkdir(this.resolve(path), { recursive: true });
  }

  /** Rename/move within the workspace. newName must be a bare name or relative subpath. */
  async renamePath(path: string, newName: string): Promise<void> {
    const clean = newName.trim().replace(/^[\\/]+|[\\/]+$/g, '');
    if (!clean || clean.split(/[\\/]/).includes('..')) throw new Error(`Invalid name: ${newName}`);
    const from = this.resolve(path);
    const to = this.resolve(join(dirname(this.resolve(path)), clean));
    try {
      await rename(from, to);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOTEMPTY' || (e as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`Target already exists: ${clean}`);
      }
      throw e;
    }
  }

  /** Delete a file or directory (recursive). The workspace root itself is protected. */
  async deletePath(path: string): Promise<void> {
    const target = this.resolve(path);
    const rel = relative(this.root, target);
    if (!rel || rel.startsWith('..')) throw new Error('Refusing to delete the workspace root');
    await rm(target, { recursive: true, force: false });
  }
}
