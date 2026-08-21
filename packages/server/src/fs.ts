import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { resolve, isAbsolute, relative, dirname, sep, join, extname } from 'node:path';
import type { ToolFs } from '@localai/agent';

/** Directories never walked when indexing/searching the workspace. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'dist-server', 'build', 'out', '.next',
  'coverage', '.pnpm-store', '__pycache__', '.venv', 'venv', '.idea', '.vscode',
  'release', 'target', '.cache', '.localai',
]);

/** Extensions treated as binary (never searched / never opened as text). */
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp', '.pdf', '.zip',
  '.gz', '.tar', '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.bin',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp3', '.mp4', '.webm', '.wav',
  '.wasm', '.class', '.jar', '.pyc', '.o', '.a', '.lib', '.sqlite', '.db',
]);

export interface SearchHit {
  path: string;
  line: number;
  text: string;
}

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

  /** Every text file in the workspace (for Quick Open), as forward-slash paths. */
  async allFiles(): Promise<string[]> {
    const out: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      if (out.length >= 5000) return;
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        if (out.length >= 5000) return;
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) await walk(full);
          continue;
        }
        if (e.name.startsWith('.') || BINARY_EXTS.has(extname(e.name).toLowerCase())) continue;
        out.push(relative(this.root, full).split(sep).join('/'));
      }
    };
    await walk(this.root);
    return out.sort();
  }

  /** Case-insensitive substring search across all text files. */
  async searchText(query: string, opts?: { maxTotal?: number; maxPerFile?: number }): Promise<SearchHit[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const maxTotal = opts?.maxTotal ?? 200;
    const maxPerFile = opts?.maxPerFile ?? 20;
    const files = await this.allFiles();
    const hits: SearchHit[] = [];

    for (const rel of files) {
      if (hits.length >= maxTotal) break;
      let raw: string;
      try {
        const info = await stat(resolve(this.root, rel));
        if (info.size > 512 * 1024) continue;
        raw = await readFile(resolve(this.root, rel), 'utf-8');
      } catch {
        continue;
      }
      if (raw.includes('\u0000')) continue; // binary
      const lines = raw.split('\n');
      let inFile = 0;
      for (let i = 0; i < lines.length && inFile < maxPerFile && hits.length < maxTotal; i++) {
        const idx = lines[i].toLowerCase().indexOf(q);
        if (idx === -1) continue;
        inFile++;
        hits.push({
          path: rel,
          line: i + 1,
          text: lines[i].trim().slice(0, 240),
        });
      }
    }
    return hits;
  }
}
