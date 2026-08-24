/**
 * Simple diff computation between two file contents.
 * Returns a list of line changes with their type (added/removed/unchanged).
 */

export type DiffLine = {
  line: number;
  content: string;
  type: 'add' | 'remove' | 'context';
};

export interface DiffResult {
  path: string;
  changes: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
}

/**
 * Split text into lines with line numbers.
 */
function toLines(text: string): string[] {
  return text.split('\n');
}

/**
 * Compute a simple line-by-line diff between old and new content.
 * Uses a basic longest common subsequence (LCS) algorithm.
 */
export function computeDiff(oldText: string, newText: string, path: string = ''): DiffResult {
  const oldLines = toLines(oldText);
  const newLines = toLines(newText);
  
  // LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to get changes
  const result: Array<{ line: number; content: string; type: DiffLine['type'] }> = [];
  let ri = m, rj = n;
  
  while (ri > 0 || rj > 0) {
    if (ri > 0 && rj > 0 && oldLines[ri - 1] === newLines[rj - 1]) {
      result.unshift({ line: ri, content: oldLines[ri - 1], type: 'context' });
      ri--;
      rj--;
    } else if (rj > 0 && (ri === 0 || dp[ri][rj - 1] >= dp[ri - 1][rj])) {
      result.unshift({ line: rj, content: newLines[rj - 1], type: 'add' });
      rj--;
    } else {
      result.unshift({ line: ri, content: oldLines[ri - 1], type: 'remove' });
      ri--;
    }
  }
  
  const stats = { added: 0, removed: 0, unchanged: 0 };
  for (const line of result) {
    if (line.type === 'add') stats.added++;
    else if (line.type === 'remove') stats.removed++;
    else stats.unchanged++;
  }
  
  return { path, changes: result, stats };
}