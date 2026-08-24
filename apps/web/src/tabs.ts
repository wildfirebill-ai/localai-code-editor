/**
 * Tab management for multi-file editing.
 */

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  savedContent: string;
  language?: string;
}

let tabCounter = 0;

/**
 * Create a new tab from a file path.
 */
export function createTab(path: string, content: string = ''): Tab {
  const name = path.split('/').pop() || path;
  return {
    id: `tab-${Date.now()}-${++tabCounter}`,
    path,
    name,
    content,
    savedContent: content,
  };
}

/**
 * Check if a tab has unsaved changes.
 */
export function isTabDirty(tab: Tab): boolean {
  return tab.content !== tab.savedContent;
}

/**
 * Mark a tab as saved.
 */
export function markTabSaved(tab: Tab): Tab {
  return { ...tab, savedContent: tab.content };
}

/**
 * Update tab content.
 */
export function updateTabContent(tab: Tab, content: string): Tab {
  return { ...tab, content };
}

/**
 * Get tab file extension.
 */
export function getTabExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  return lastDot !== -1 ? path.slice(lastDot + 1).toLowerCase() : '';
}

/**
 * Check if file is a text file based on extension.
 */
export function isTextFile(path: string): boolean {
  const ext = getTabExtension(path);
  const textExtensions = new Set([
    'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'html', 'css', 'scss',
    'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs',
    'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
    'sh', 'bash', 'ps1', 'dockerfile', 'sql', 'graphql',
  ]);
  return textExtensions.has(ext);
}

/**
 * Get language ID for Monaco based on file extension.
 */
export function getLanguageForTab(path: string): string {
  const ext = getTabExtension(path);
  const languageMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact',
    js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown',
    html: 'html', css: 'css', scss: 'scss',
    py: 'python', rb: 'ruby', go: 'go',
    rs: 'rust', java: 'java', c: 'c', cpp: 'cpp',
    cs: 'csharp', xml: 'xml', yaml: 'yaml', yml: 'yaml',
    toml: 'ini', ini: 'ini', sql: 'sql',
    sh: 'shell', bash: 'shell', ps1: 'powershell',
    graphql: 'graphql', dockerfile: 'dockerfile',
  };
  return languageMap[ext] || 'plaintext';
}