export interface SkillRegistryEntry {
  id: string;
  name: string;
  description: string;
  category: 'git' | 'backend' | 'frontend' | 'devops' | 'testing' | 'security' | 'quality' | 'docs' | 'docker' | 'ai-integration' | 'performance' | 'maintenance' | 'other';
  /** Markdown content for the skill (fetched or inline). */
  content?: string;
  /** If set, content is fetched from this URL at install time. */
  fetchUrl?: string;
  homepage?: string;
  repository?: string;
  tags?: string[];
  official?: boolean;
  author?: string;
}

export const SKILL_CATEGORIES = [
  { id: 'git', label: 'Git', icon: '📦' },
  { id: 'backend', label: 'Backend', icon: '⚙️' },
  { id: 'frontend', label: 'Frontend', icon: '🎨' },
  { id: 'devops', label: 'DevOps', icon: '🚀' },
  { id: 'testing', label: 'Testing', icon: '🧪' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'quality', label: 'Quality', icon: '✅' },
  { id: 'docs', label: 'Docs', icon: '📝' },
  { id: 'docker', label: 'Docker', icon: '🐳' },
  { id: 'ai-integration', label: 'AI / Integration', icon: '🤖' },
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
] as const;

/** Maps file extensions to relevant skill categories. */
export const FILETYPE_SKILL_MAP: Record<string, string[]> = {
  '.ts': ['frontend', 'backend', 'quality'],
  '.tsx': ['frontend', 'quality'],
  '.js': ['frontend', 'backend', 'quality'],
  '.jsx': ['frontend', 'quality'],
  '.py': ['backend', 'testing', 'quality'],
  '.go': ['backend', 'devops', 'quality'],
  '.rs': ['backend', 'quality', 'performance'],
  '.java': ['backend', 'quality'],
  '.kt': ['backend', 'quality'],
  '.css': ['frontend'],
  '.scss': ['frontend'],
  '.html': ['frontend', 'quality'],
  '.vue': ['frontend', 'quality'],
  '.svelte': ['frontend', 'quality'],
  '.sql': ['backend'],
  '.yml': ['devops', 'docker'],
  '.yaml': ['devops', 'docker'],
  '.json': ['quality'],
  '.toml': ['devops'],
  '.dockerfile': ['docker', 'devops'],
  '.sh': ['devops'],
  '.bash': ['devops'],
  '.md': ['docs'],
  '.test.ts': ['testing'],
  '.test.js': ['testing'],
  '.spec.ts': ['testing'],
  '.spec.js': ['testing'],
  '.test.py': ['testing'],
};

/** Maps project indicators to relevant skill categories. */
export const PROJECT_SKILL_MAP: Record<string, string[]> = {
  'package.json': ['frontend', 'backend', 'quality'],
  'Cargo.toml': ['backend', 'performance'],
  'go.mod': ['backend', 'devops'],
  'pom.xml': ['backend', 'quality'],
  'build.gradle': ['backend', 'quality'],
  'requirements.txt': ['backend', 'testing'],
  'pyproject.toml': ['backend', 'testing'],
  'Dockerfile': ['docker', 'devops'],
  'docker-compose.yml': ['docker', 'devops'],
  '.github/workflows': ['devops', 'quality'],
  'tsconfig.json': ['frontend', 'quality'],
  'vite.config': ['frontend', 'performance'],
  'webpack.config': ['frontend', 'performance'],
  'next.config': ['frontend', 'performance'],
  '.eslintrc': ['quality'],
  'jest.config': ['testing'],
  'vitest.config': ['testing'],
  '.env': ['security'],
  '.env.example': ['security'],
};

/** Curated skill registry — mirrors the builtin skills with richer metadata. */
export const SKILL_REGISTRY: SkillRegistryEntry[] = [
  {
    id: 'commit',
    name: 'Commit',
    description: 'Stage changes intentionally and create a clean Conventional Commit message',
    category: 'git',
    tags: ['git', 'commit', 'conventional-commits'],
    official: true,
  },
  {
    id: 'code-review-fix',
    name: 'Code Review Fix',
    description: 'Fix issues flagged during code review — security, performance, correctness, style',
    category: 'quality',
    tags: ['review', 'quality', 'fix'],
    official: true,
  },
  {
    id: 'ci-fix',
    name: 'CI Fix',
    description: 'Diagnose and fix a failing CI pipeline from build logs',
    category: 'devops',
    tags: ['ci', 'github-actions', 'pipeline', 'debug'],
    official: true,
  },
  {
    id: 'coverage-gap',
    name: 'Coverage Gap',
    description: 'Find untested code paths and add targeted unit tests to raise coverage',
    category: 'testing',
    tags: ['coverage', 'testing', 'unit-tests'],
    official: true,
  },
  {
    id: 'db-migration',
    name: 'DB Migration',
    description: 'Safely add, alter, or drop database columns and tables with rollback support',
    category: 'backend',
    tags: ['database', 'migration', 'sql', 'schema'],
    official: true,
  },
  {
    id: 'dead-code-remove',
    name: 'Dead Code Remove',
    description: 'Find and remove unreachable code, unused imports, and stale exports',
    category: 'quality',
    tags: ['cleanup', 'dead-code', 'refactor'],
    official: true,
  },
  {
    id: 'security-check',
    name: 'Security Check',
    description: 'Audit code for security vulnerabilities — injection, auth bypass, secret leaks',
    category: 'security',
    tags: ['security', 'audit', 'vulnerabilities'],
    official: true,
  },
  {
    id: 'bundle-shrink',
    name: 'Bundle Shrink',
    description: 'Analyze and reduce frontend bundle size — tree-shaking, code-splitting, lazy imports',
    category: 'performance',
    tags: ['bundle', 'performance', 'webpack', 'vite'],
    official: true,
  },
  {
    id: 'css-debug',
    name: 'CSS Debug',
    description: 'Diagnose and fix CSS layout, spacing, and visual regressions',
    category: 'frontend',
    tags: ['css', 'layout', 'debug', 'ui'],
    official: true,
  },
  {
    id: 'accessibility-fix',
    name: 'Accessibility Fix',
    description: 'Fix WCAG compliance issues — contrast, ARIA roles, keyboard navigation, screen readers',
    category: 'frontend',
    tags: ['a11y', 'wcag', 'accessibility', 'aria'],
    official: true,
  },
  {
    id: 'component-extract',
    name: 'Component Extract',
    description: 'Extract repeated UI patterns into reusable components with proper props and types',
    category: 'frontend',
    tags: ['component', 'refactor', 'react', 'ui'],
    official: true,
  },
  {
    id: 'adr-write',
    name: 'ADR Write',
    description: 'Write an Architecture Decision Record for a significant technical choice',
    category: 'docs',
    tags: ['adr', 'architecture', 'documentation', 'decisions'],
    official: true,
  },
  {
    id: 'changelog-update',
    name: 'Changelog Update',
    description: 'Update CHANGELOG.md following Keep a Changelog format for a release',
    category: 'docs',
    tags: ['changelog', 'release', 'documentation'],
    official: true,
  },
  {
    id: 'branch-cleanup',
    name: 'Branch Cleanup',
    description: 'Identify and safely delete stale local and remote branches',
    category: 'git',
    tags: ['git', 'branch', 'cleanup', 'housekeeping'],
    official: true,
  },
  {
    id: 'docker-debug',
    name: 'Docker Debug',
    description: 'Debug Docker build failures, container crashes, and image size issues',
    category: 'docker',
    tags: ['docker', 'debug', 'container', 'build'],
    official: true,
  },
  {
    id: 'api-endpoint-add',
    name: 'API Endpoint Add',
    description: 'Scaffold a new REST API endpoint with validation, error handling, and tests',
    category: 'backend',
    tags: ['api', 'rest', 'endpoint', 'scaffold'],
    official: true,
  },
  {
    id: 'auth-flow-audit',
    name: 'Auth Flow Audit',
    description: 'Audit authentication and authorization flows for security weaknesses',
    category: 'security',
    tags: ['auth', 'security', 'audit', 'oauth', 'jwt'],
    official: true,
  },
  {
    id: 'performance-profile',
    name: 'Performance Profile',
    description: 'Profile and optimize slow code paths — identify bottlenecks and apply fixes',
    category: 'performance',
    tags: ['performance', 'profiling', 'optimization', 'bottleneck'],
    official: true,
  },
];
