/**
 * Code formatting utilities for the editor.
 * Supports formatting with different formatters.
 */

export interface FormatOptions {
  formatter?: string;
  parser?: string;
  tabWidth?: number;
  useTabs?: boolean;
  printWidth?: number;
}

/**
 * Default formatting options.
 */
const defaultOptions: FormatOptions = {
  formatter: 'prettier',
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
};

/**
 * Format code string based on file type and options.
 */
export function formatCode(
  code: string,
  language: string,
  options: FormatOptions = {},
): string {
  const opts = { ...defaultOptions, ...options };

  // For now, implement basic formatting rules
  switch (language) {
    case 'json':
      return formatJSON(code, opts);
    case 'html':
    case 'xml':
      return formatMarkup(code, opts);
    case 'css':
    case 'scss':
      return formatCSS(code, opts);
    case 'markdown':
      return formatMarkdown(code, opts);
    default:
      return code;
  }
}

/**
 * Format JSON with consistent indentation.
 */
function formatJSON(code: string, options: FormatOptions): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, options.tabWidth);
  } catch {
    return code;
  }
}

/**
 * Basic HTML/XML formatter.
 */
function formatMarkup(code: string, _options: FormatOptions): string {
  const lines = code.split('\n');
  let indent = 0;
  const formatted: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formatted.push('');
      continue;
    }

    // Decrease indent for closing tags
    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }

    formatted.push('  '.repeat(indent) + trimmed);

    // Increase indent for opening tags (not self-closing)
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      indent++;
    }
  }

  return formatted.join('\n');
}

/**
 * Basic CSS formatter.
 */
function formatCSS(code: string, _options?: FormatOptions): string {
  const lines = code.split('\n');
  let indent = 0;
  const formatted: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formatted.push('');
      continue;
    }

    // Decrease indent for closing braces
    if (trimmed.startsWith('}')) {
      indent = Math.max(0, indent - 1);
    }

    formatted.push('  '.repeat(indent) + trimmed);

    // Increase indent for opening braces
    if (trimmed.endsWith('{')) {
      indent++;
    }
  }

  return formatted.join('\n');
}

/**
 * Basic Markdown formatter.
 */
function formatMarkdown(code: string, _options?: FormatOptions): string {
  // Normalize line endings and trim trailing whitespace
  return code
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

/**
 * Detect language from file extension.
 */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact',
    js: 'javascript', jsx: 'javascriptreact',
    json: 'json',
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss',
    md: 'markdown',
    yaml: 'yaml', yml: 'yaml',
    toml: 'toml',
    xml: 'xml',
    graphql: 'graphql',
    sql: 'sql',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c', cpp: 'cpp',
    cs: 'csharp',
  };
  return languageMap[ext] || 'plaintext';
}

/**
 * Get formatting instructions for a language (for AI agent).
 */
export function getFormattingInstructions(language: string): string {
  const instructions: Record<string, string> = {
    typescript: 'Use consistent indentation (2 spaces), single quotes, trailing commas, no semicolons (if using Prettier).',
    javascript: 'Use consistent indentation (2 spaces), single quotes, trailing commas.',
    json: 'Use 2-space indentation, consistent formatting.',
    html: 'Use 2-space indentation, attributes on new lines for long elements.',
    css: 'Use 2-space indentation, one rule per line, newlines between blocks.',
    markdown: 'Use consistent heading hierarchy, blank lines between sections.',
    python: 'Use 4-space indentation, PEP 8 style.',
    go: 'Use gofmt standard formatting.',
    rust: 'Use cargo fmt standard formatting.',
  };
  return instructions[language] || 'Apply standard formatting for the language.';
}