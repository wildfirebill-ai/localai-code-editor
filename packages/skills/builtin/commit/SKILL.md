---
name: commit
description: Inspect changes and create a clean Conventional Commit (stage intentionally, verify result)
category: git
---
Create a git commit for the current changes following this procedure:

1. **Survey**: run `git status --short` and `git diff` (plus `git diff --staged`). Read the full diff — never commit blind.
2. **Stage intentionally**: `git add` only files that belong to this change. Never stage secrets (`.env`, keys, tokens), lockfile churn unrelated to the change, or debug artifacts. If unrelated changes are mixed, commit them separately or leave them unstaged and say so.
3. **Message** (Conventional Commits):
   - Format: `<type>(<scope>): <imperative summary>` — max ~72 chars, no trailing period.
   - Types: feat, fix, docs, style, refactor, perf, test, chore, ci.
   - The summary says WHAT changed; add a body paragraph explaining WHY when the diff isn't self-evident.
4. **Commit** with a heredoc-safe command. Never use `--no-verify` to skip hooks.
5. **Verify**: run `git log -1 --stat` and confirm exactly the intended files were committed.

Rules:
- NEVER amend or force-push unless explicitly asked.
- If pre-commit hooks reject the commit, fix the underlying issue and commit again.
- If there are no changes, say so instead of creating an empty commit.
