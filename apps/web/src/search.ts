/**
 * Search across files in the workspace.
 * Provides text search with context lines.
 */

export interface SearchResult {
  path: string;
  line: number;
  content: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  filePattern?: string;
  maxResults?: number;
  ignorePatterns?: string[];
}

/**
 * Search for text pattern across files in the workspace.
 */
export async function searchFiles(
  client: { request: <T>(method: string, params?: Record<string, unknown>) => Promise<T> },
  _workspace: string,
  options: SearchOptions,
): Promise<SearchResult[]> {
  const { query, caseSensitive = false, maxResults = 1000 } = options;
  
  if (!query) return [];
  
  const results: SearchResult[] = [];
  const files = await client.request<string[]>('fs.allFiles');
  
  // Ignore common large directories
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage', 'target', '.venv', '__pycache__'];
  
  for (const file of files) {
    if (results.length >= maxResults) break;
    if (ignoreDirs.some(d => file.startsWith(d) || file.includes('/' + d + '/'))) continue;
    
    try {
      const content = await client.request<string>('fs.read', { path: file });
      const lines = content.split('\n');
      
      for (let lineNum = 0; lineNum < lines.length && results.length < maxResults; lineNum++) {
        const line = lines[lineNum];
        const idx = caseSensitive ? line.indexOf(query) : line.toLowerCase().indexOf(query.toLowerCase());
        if (idx !== -1) {
          results.push({
            path: file,
            line: lineNum + 1,
            content: line.trim(),
            matchStart: idx,
            matchEnd: idx + query.length,
          });
        }
      }
    } catch {
      // Skip binary files or unreadable files
    }
  }
  
  return results;
}
