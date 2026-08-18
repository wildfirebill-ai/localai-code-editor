import { readFile, readdir, stat } from 'node:fs/promises';
import { join, isAbsolute, resolve, relative, sep } from 'node:path';
import type { Skill, SkillFrontmatter, SkillSource, SkillSummary } from './types.js';

/** Parse `key: value` frontmatter lines (handles quoted string values). */
export function parseFrontmatter(block: string): SkillFrontmatter {
  const out: SkillFrontmatter = {};
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Split a SKILL.md into (frontmatter, body).
 * Frontmatter is delimited by `---` lines at the very top.
 */
export function parseSkillFile(raw: string): { frontmatter: SkillFrontmatter; body: string } {
  const trimmed = raw.replace(/^\uFEFF/, ''); // strip BOM
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: trimmed };
  }
  const firstNl = trimmed.indexOf('\n');
  if (firstNl === -1) return { frontmatter: {}, body: trimmed };
  const rest = trimmed.slice(firstNl + 1);
  const endMarker = rest.indexOf('\n---');
  if (endMarker === -1) return { frontmatter: {}, body: trimmed };
  const block = rest.slice(0, endMarker);
  const body = rest.slice(endMarker + 4).replace(/^\n/, '');
  return { frontmatter: parseFrontmatter(block), body };
}

/** Load SKILL.md files from a single skills directory. */
export async function loadSkillsFromDir(
  dir: string,
  source: SkillSource,
  projectRoot: string,
): Promise<Skill[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return []; // directory doesn't exist
  }

  const skills: Skill[] = [];
  for (const entry of entries) {
    // Skip hidden files/dirs except we require a SKILL.md inside a folder.
    const skillDir = join(dir, entry);
    const skillFile = join(skillDir, 'SKILL.md');
    try {
      const info = await stat(skillDir);
      if (!info.isDirectory()) continue;
      const raw = await readFile(skillFile, 'utf-8');
      const { frontmatter, body } = parseSkillFile(raw);
      const dirName = entry;
      const name = String(frontmatter.name ?? dirName);
      const description = String(frontmatter.description ?? '');
      const displayPath = relative(projectRoot, skillFile).split(sep).join('/');
      skills.push({
        name,
        description,
        content: body.trim(),
        source,
        path: displayPath.startsWith('..') ? skillFile : displayPath,
        enabled: true,
      });
    } catch {
      // Not a skill directory (missing SKILL.md or unreadable) — skip.
      continue;
    }
  }
  return skills;
}

export interface LoadSkillsOptions {
  /** Workspace root. `<root>/.localai/skills` holds project skills. */
  projectDir: string;
  /** User skills dir. Defaults to `<homedir>/.localai/skills`. */
  userDir?: string;
  /** If true, a project skill overrides a same-named user skill. Default true. */
  projectPrecedence?: boolean;
}

/**
 * Loads all skills: project skills (workspace `.localai/skills`) plus
 * user/global skills (`~/.localai/skills`). Project skills take precedence
 * over same-named user skills.
 */
export class SkillStore {
  private skills = new Map<string, Skill>();

  async load(opts: LoadSkillsOptions): Promise<Skill[]> {
    const projectPrecedence = opts.projectPrecedence ?? true;
    const projectRoot = resolve(opts.projectDir);
    const projectSkills = await loadSkillsFromDir(join(projectRoot, '.localai', 'skills'), 'project', projectRoot);
    const userSkills = opts.userDir ? await loadSkillsFromDir(resolve(opts.userDir), 'user', projectRoot) : [];

    const merged = new Map<string, Skill>();
    if (projectPrecedence) {
      for (const s of userSkills) merged.set(s.name, s);
      for (const s of projectSkills) merged.set(s.name, s); // project wins
    } else {
      for (const s of projectSkills) merged.set(s.name, s);
      for (const s of userSkills) merged.set(s.name, s); // user wins
    }

    this.skills = merged;
    return [...this.skills.values()];
  }

  list(): SkillSummary[] {
    return [...this.skills.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ ...s, size: s.content.length }));
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /** All currently-enabled skills (used to build the agent's system prompt). */
  enabled(): Skill[] {
    return [...this.skills.values()].filter((s) => s.enabled);
  }

  setEnabled(name: string, enabled: boolean): boolean {
    const s = this.skills.get(name);
    if (!s) return false;
    s.enabled = enabled;
    return true;
  }

  count(): number {
    return this.skills.size;
  }
}

export function defaultUserSkillsDir(homedir: string): string {
  return isAbsolute(homedir) ? join(homedir, '.localai', 'skills') : resolve(homedir, '.localai', 'skills');
}