---
name: todo-sweep
description: Resolve or convert the TODO/FIXME backlog — fix small ones, convert big ones to tracked issues
category: quality
---
Deal with every TODO/FIXME/HACK in the codebase:

1. **Inventory**: grep for `TODO|FIXME|HACK|XXX|WORKAROUND` with file:line. Group by module and apparent age (git blame the line).
2. **Classify each**:
   - **Tiny + still valid** (<15 min, no design needed) → just do it now.
   - **Done already** → the code moved on; delete the comment.
   - **Wrong/obsolete** → describes behavior that changed; delete with confidence.
   - **Real work needing design/effort** → convert to a GitHub issue with context (copy the comment + surrounding code snippet), then replace the comment with `TODO(#123): …` so it's traceable.
   - **Deliberate permanent constraint** → rewrite as an explanatory comment stating WHY the current form is correct ("// intentional: sync read required at boot"), not a perpetual TODO.
3. **FIXME/HACK get priority**: they mark known defects. For each, either fix now if feasible or ensure an issue exists with reproduction notes.
4. **Zero unowned leftovers**: after the sweep, every remaining marker references an issue number or explains itself. Bare "TODO: fix this" is banned output.
5. **Report**: fixed N, converted to issues M (with links), deleted K stale, documented J deliberate.

Sweep one module at a time; keep changes mechanical so review is trivial.
