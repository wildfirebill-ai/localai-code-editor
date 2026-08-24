/**
 * Git blame for files - shows who wrote each line.
 */

export interface BlameLine {
  line: number;
  author: string;
  date: string;
  commit: string;
  content: string;
}

/**
 * Get git blame for a file.
 * Uses the git package to get per-line blame information.
 */
export async function getBlame(
  client: { request: <T>(method: string, params?: Record<string, unknown>) => Promise<T> },
  filePath: string,
): Promise<BlameLine[]> {
  try {
    const result = await client.request<string>('fs.gitBlame', { path: filePath });
    return parseBlameOutput(result);
  } catch (error) {
    console.error('Failed to get blame:', error);
    return [];
  }
}

/**
 * Parse git blame output into structured lines.
 * Format: each line has: commit <hash> <author> <date> <line>
 */
function parseBlameOutput(output: string): BlameLine[] {
  const lines = output.split('\n').filter(line => line.trim());
  const results: BlameLine[] = [];
  
  let currentCommit = '';
  let currentAuthor = '';
  let currentDate = '';
  let lineNum = 0;
  
  for (const line of lines) {
    if (line.startsWith('^')) continue; // Skip first commit marker
    
    const parts = line.split(' ');
    if (parts.length >= 3) {
      currentCommit = parts[0].substring(0, 8); // Abbreviate commit hash
      currentAuthor = parts[1];
      currentDate = parts.slice(2, 5).join(' ');
      lineNum++;
      
      results.push({
        line: lineNum,
        author: currentAuthor,
        date: currentDate,
        commit: currentCommit,
        content: '', // Content would come from the actual line
      });
    }
  }
  
  return results;
}

/**
 * Format blame date for display.
 */
export function formatBlameDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateStr;
  }
}

/**
 * Get summary statistics for a file's blame.
 */
export function getBlameStats(blameLines: BlameLine[]): {
  totalLines: number;
  authors: Map<string, number>;
  recentChanges: number;
} {
  const authors = new Map<string, number>();
  let recentChanges = 0;
  
  for (const line of blameLines) {
    authors.set(line.author, (authors.get(line.author) || 0) + 1);
    
    const diffDays = Math.floor((Date.now() - new Date(line.date).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 30) recentChanges++;
  }
  
  return {
    totalLines: blameLines.length,
    authors,
    recentChanges,
  };
}