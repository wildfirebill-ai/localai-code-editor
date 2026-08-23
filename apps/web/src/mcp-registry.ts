export interface McpServerRegistryEntry {
  id: string;
  name: string;
  description: string;
  category: 'filesystem' | 'git' | 'database' | 'web' | 'cloud' | 'utility' | 'ai' | 'other';
  // Stdio
  stdio?: {
    command: string;
    args: string[];
    argsDescription?: string;
    env?: Record<string, string>;
  };
  // HTTP/SSE
  http?: {
    url: string;
  };
  // SSE
  sse?: {
    url: string;
  };
  // Metadata
  homepage?: string;
  repository?: string;
  tags?: string[];
  // Trust score / verification
  official?: boolean;
  verified?: boolean;
  stars?: number;
  lastUpdated?: string;
}

export const MCP_SERVER_REGISTRY: McpServerRegistryEntry[] = [
  // Filesystem
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read, write, and search files on the local filesystem',
    category: 'filesystem',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
      argsDescription: 'Usage: npx -y @modelcontextprotocol/server-filesystem /path/to/dir'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['filesystem', 'local', 'files'],
    official: true,
    verified: true,
    stars: 2500,
    lastUpdated: '2024-12-01',
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Read and write Git repositories',
    category: 'git',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git'],
      argsDescription: 'Usage: npx -y @modelcontextprotocol/server-git --repository /path/to/repo'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['git', 'version-control', 'repository'],
    official: true,
    verified: true,
    stars: 1800,
    lastUpdated: '2024-11-15',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repositories, issues, PRs, and more',
    category: 'git',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
      argsDescription: 'Requires GITHUB_TOKEN env var with repo scope'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['github', 'git', 'issues', 'pull-requests'],
    official: true,
    verified: true,
    stars: 3200,
    lastUpdated: '2024-12-01',
  },
  // Database
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query and manage PostgreSQL databases',
    category: 'database',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      env: { DATABASE_URL: '${POSTGRES_URL}' },
      argsDescription: 'Requires DATABASE_URL env var (postgresql://user:pass@host:port/db)'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['database', 'postgres', 'sql'],
    official: true,
    verified: true,
    stars: 1200,
    lastUpdated: '2024-11-20',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Query SQLite databases',
    category: 'database',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite'],
      argsDescription: 'Usage: npx -y @modelcontextprotocol/server-sqlite /path/to/db.sqlite'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['database', 'sqlite', 'sql', 'local'],
    official: true,
    verified: true,
    stars: 900,
    lastUpdated: '2024-11-10',
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Interact with Redis databases',
    category: 'database',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-redis'],
      env: { REDIS_URL: '${REDIS_URL}' },
      argsDescription: 'Requires REDIS_URL env var'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/redis',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['database', 'redis', 'cache'],
    official: true,
    verified: true,
    stars: 800,
    lastUpdated: '2024-11-05',
  },
  // Web
  {
    id: 'fetch',
    name: 'Web Fetch',
    description: 'Fetch web pages and extract content',
    category: 'web',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-fetch'],
      argsDescription: 'Fetches and extracts content from URLs'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['web', 'fetch', 'scraping', 'http'],
    official: true,
    verified: true,
    stars: 1500,
    lastUpdated: '2024-11-25',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Search the web using Brave Search API',
    category: 'web',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: { BRAVE_API_KEY: '${BRAVE_API_KEY}' },
      argsDescription: 'Requires BRAVE_API_KEY env var'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['search', 'web', 'brave', 'api'],
    official: true,
    verified: true,
    stars: 600,
    lastUpdated: '2024-11-01',
  },
  // Cloud
  {
    id: 'aws',
    name: 'AWS',
    description: 'Manage AWS resources (S3, EC2, Lambda, etc.)',
    category: 'cloud',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-aws'],
      env: {
        AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
        AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
        AWS_REGION: '${AWS_REGION}'
      },
      argsDescription: 'Requires AWS credentials'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/aws',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['aws', 'cloud', 'infrastructure'],
    official: true,
    verified: true,
    stars: 900,
    lastUpdated: '2024-11-10',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Manage Kubernetes clusters and resources',
    category: 'cloud',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-kubernetes'],
      argsDescription: 'Requires kubeconfig'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/kubernetes',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['kubernetes', 'k8s', 'cloud', 'orchestration'],
    official: true,
    verified: true,
    stars: 700,
    lastUpdated: '2024-11-05',
  },
  // AI
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Access Hugging Face models, datasets, and spaces',
    category: 'ai',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-huggingface'],
      env: { HF_TOKEN: '${HF_TOKEN}' },
      argsDescription: 'Requires HF_TOKEN env var'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/huggingface',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['ai', 'ml', 'huggingface', 'models'],
    official: true,
    verified: true,
    stars: 1100,
    lastUpdated: '2024-11-20',
  },
  // Utility
  {
    id: 'memory',
    name: 'Memory',
    description: 'Persistent memory across sessions',
    category: 'utility',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      argsDescription: 'Persistent key-value memory for agents'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['memory', 'persistence', 'state'],
    official: true,
    verified: true,
    stars: 1300,
    lastUpdated: '2024-11-15',
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Step-by-step reasoning tool for complex problems',
    category: 'utility',
    stdio: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      argsDescription: 'Structured reasoning for complex problems'
    },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking',
    repository: 'https://github.com/modelcontextprotocol/servers',
    tags: ['reasoning', 'thinking', 'problem-solving'],
    official: true,
    verified: true,
    stars: 1400,
    lastUpdated: '2024-11-20',
  },
  // Custom
  {
    id: 'custom-http',
    name: 'Custom HTTP',
    description: 'Connect to any MCP-compatible HTTP endpoint',
    category: 'utility',
    http: {
      url: 'http://localhost:3000/mcp'
    },
    homepage: '',
    tags: ['custom', 'http', 'custom-endpoint'],
    official: false,
    verified: false,
    stars: 0,
    lastUpdated: '2024-12-01',
  },
  {
    id: 'custom-sse',
    name: 'Custom SSE',
    description: 'Connect to any MCP-compatible SSE endpoint',
    category: 'utility',
    sse: {
      url: 'http://localhost:3000/sse'
    },
    homepage: '',
    tags: ['custom', 'sse', 'custom-endpoint'],
    official: false,
    verified: false,
    stars: 0,
    lastUpdated: '2024-12-01',
  },
];

export const MCP_CATEGORIES = [
  { id: 'filesystem', label: 'Filesystem', icon: '📁' },
  { id: 'git', label: 'Git', icon: '📦' },
  { id: 'database', label: 'Database', icon: '🗄️' },
  { id: 'web', label: 'Web', icon: '🌐' },
  { id: 'cloud', label: 'Cloud', icon: '☁️' },
  { id: 'ai', label: 'AI / ML', icon: '🤖' },
  { id: 'utility', label: 'Utility', icon: '🔧' },
  { id: 'other', label: 'Other', icon: '📦' },
];