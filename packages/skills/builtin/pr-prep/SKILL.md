---
name: pr-prep
description: Prepare a pull request — logical commits, self-review, description, green checks before opening
category: git
---
Get a branch genuinely ready for review:

1. **Scope check**: `git log main..HEAD --oneline` + `git diff main...HEAD --stat`. If the diff mixes unrelated changes, split into separate branches/PRs — reviewers can't review a grab-bag.
2. **Commit hygiene**: reorganize into logical commits (each builds and tests green). Suggested flow: fixup commits during work, then interactive-reorder. Message style must match the repo's history.
3. **Self-review first**: read your own full diff as if you were the reviewer. Fix everything you'd flag: leftover debug code, console.logs, commented-out blocks, TODOs that should be issues, missing tests for new logic.
4. **Pre-flight**: typecheck + lint + full test suite locally. A PR that fails CI on arrival wastes everyone's time.
5. **Description** (if creating one): What changed / Why / How tested / Screenshots for UI / Rollback notes for risky changes. Link the tracking issue with `Fixes #N` only if it truly fixes it.
6. **Size guard**: >400 changed lines? Propose a split plan before opening.

Do not push or open the PR unless asked — prepare and report readiness.
