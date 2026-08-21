/** Where a skill was loaded from. */
export type SkillSource = 'builtin' | 'user' | 'project';

/** Metadata parsed from a SKILL.md YAML frontmatter. */
export interface SkillFrontmatter {
  name?: string;
  description?: string;
  /** Any other frontmatter fields, kept verbatim. */
  [key: string]: unknown;
}

/** A loaded skill. */
export interface Skill {
  /** Unique id (derived from frontmatter name or directory). */
  name: string;
  description: string;
  /** Full markdown body (the skill's instructions/content). */
  content: string;
  /** Which directory this came from. */
  source: SkillSource;
  /** Absolute path to the SKILL.md file. */
  path: string;
  /** When true, this skill is passed to the agent on every run. */
  enabled: boolean;
}

export interface SkillSummary {
  name: string;
  description: string;
  source: SkillSource;
  path: string;
  enabled: boolean;
  /** Approximate size of the skill body in characters. */
  size: number;
}