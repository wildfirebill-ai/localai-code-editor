import { computeDiff, type DiffLine } from './diff';

interface DiffViewProps {
  oldContent: string;
  newContent: string;
  path?: string;
}

export function DiffView({ oldContent, newContent, path }: DiffViewProps) {
  const diff = computeDiff(oldContent, newContent, path);
  
  const getLineClass = (line: DiffLine) => {
    switch (line.type) {
      case 'add': return 'diff-add';
      case 'remove': return 'diff-remove';
      case 'context': return 'diff-context';
    }
  };
  
  const getLinePrefix = (line: DiffLine) => {
    switch (line.type) {
      case 'add': return '+';
      case 'remove': return '-';
      case 'context': return ' ';
    }
  };
  
  return (
    <div className="diff-view">
      <div className="diff-header">
        <span className="diff-path">{path || 'changes'}</span>
        <span className="diff-stats">
          <span className="diff-add">+{diff.stats.added}</span>
          <span className="diff-remove">-{diff.stats.removed}</span>
          {diff.stats.unchanged > 0 && <span className="diff-context">~{diff.stats.unchanged}</span>}
        </span>
      </div>
      <div className="diff-content">
        {diff.changes.map((line, i) => (
          <div key={i} className={`diff-line ${getLineClass(line)}`}>
            <span className="diff-line-num">{line.line}</span>
            <span className="diff-line-prefix">{getLinePrefix(line)}</span>
            <span className="diff-line-text">{line.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}