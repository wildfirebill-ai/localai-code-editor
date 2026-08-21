---
name: changelog-update
description: Update CHANGELOG.md from actual commit history in Keep-a-Changelog style, written for users
category: docs
---
Bring the changelog current:

1. **Gather truth**: `git log <last-tag>..HEAD --oneline` plus the diffs for anything ambiguous. The changelog describes what changed, derived from evidence.
2. **Translate commits → user language**: "refactor: extract helper" is invisible to users — fold it into the feature/fix it served or omit it. Internal-only changes get one line under a Misc/Internal section at most.
3. **Categorize** under Added / Changed / Deprecated / Removed / Fixed / Security. Each entry: user-facing behavior, not implementation ("Add export to CSV button" not "add handler to Table.tsx").
4. **Write entries**: present tense, no commit hashes in text, group related commits into one line. Breaking changes go FIRST with migration instructions inline.
5. **Version header**: use Unreleased if no release yet; otherwise SemVer version + date, matching the project's bump rules (breaking→major, feat→minor, fix→patch).
6. **Link refs**: append (#123) for issues/PRs when the repo uses them.

Never invent changes that aren't in history; never leave a breaking change buried mid-list.
