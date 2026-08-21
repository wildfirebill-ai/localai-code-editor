---
name: branch-cleanup
description: Safely delete local branches that are fully merged or superseded, keeping active work
category: git
---
Clean up stale local branches without losing work:

1. **Inventory**: `git branch -vv` — list every local branch with its upstream and ahead/behind counts.
2. **Classify each branch**:
   - **Merged** (`git branch --merged main` contains it) → safe to delete.
   - **Squash-merged** → check `git cherry main <branch>`; empty output means content is in main despite no merge commit.
   - **Ahead (unpushed commits)** → DO NOT delete. List the commits and ask the user: push, or confirm discard.
   - **Active** (recent commits < 7 days old, or is the current branch) → keep.
3. **Delete**: `git branch -d` (safe flag) for merged branches. If `-d` refuses, STOP — that means unmerged commits exist; escalate to the user rather than `-D`.
4. **Report**: table of branch → action (deleted / kept-active / needs-decision), with commit counts for anything preserved.

Never use `git branch -D` or `git push origin --delete` without explicit user confirmation for that specific branch.
