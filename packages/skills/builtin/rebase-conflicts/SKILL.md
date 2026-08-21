---
name: rebase-conflicts
description: Resolve rebase/merge conflicts methodically — understand both sides, preserve intent, verify each resolution
category: git
---
Resolve conflicts without losing anyone's work:

1. **Map the battlefield**: `git status` lists conflicted files; `git log --merge --oneline -- <file>` shows the two diverging commit chains.
2. **Understand BOTH sides** before touching a marker. For each conflict hunk, answer: what does HEAD's change do? What did the incoming change do? Why did they collide?
3. **Resolve by intent**, not by picking a side blindly:
   - Both changes are needed → combine them.
   - One supersedes the other → take that one, but confirm the loser's goal is achieved elsewhere.
   - Genuine semantic conflict (both edited the same logic differently) → this is a design decision; if unclear, ask the user rather than coin-flipping.
4. **Hunt the invisible ones**: after clearing markers, search the file for remaining `<<<<<<<`, `=======`, `>>>>>>>`. Then grep the whole repo — tools sometimes leave markers in unexpected files.
5. **Make it compile + pass**: typecheck/build and run tests for every affected area BEFORE `git add`. A resolution that "looks right" but doesn't run is not resolved.
6. **Continue**: `git add <files>` then `git rebase --continue` (or `--merge --continue`). Never `--skip` a commit you haven't understood — skipped commits are silently lost work.

If the rebase is a mess mid-way, `git rebase --abort` restores the pre-rebase state — say so as an option, don't panic-abort silently.
