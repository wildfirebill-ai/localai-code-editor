---
name: dead-code-remove
description: Find and remove provably-dead code safely — evidence per removal, git history as the undo
category: quality
---
Delete code that nothing uses:

1. **Prove deadness before deleting** (each piece needs evidence):
   - Exports never imported: search the ENTIRE repo for the symbol, including dynamic access (`obj[name]`, string-based DI) — a string match anywhere = alive.
   - Functions with zero call sites after checking all entry points (HTTP routes, CLI commands, event handlers, config-referenced names).
   - Feature-flag branches permanently false in production config.
   - Commented-out code blocks older than a release — git history remembers; the working tree shouldn't.
2. **Remove the whole trail**: deleted function → its now-unused imports → now-unused helpers only it called → its tests → its type definitions → its docs mentions. Half-removals leave compile errors and worse clutter than the original.
3. **Compile + tests green** after each logical removal batch. TypeScript's unused-export/unused-import diagnostics are your safety net; enable noUnusedLocals locally if the project allows.
4. **When unsure, leave it**: "probably unused" is not evidence. Mark it with a dated note proposing deletion next cycle instead. Public-library exports are API — removing them is a breaking change needing a deprecation cycle, not a cleanup commit.
5. **Report**: list of removals each with its evidence ("zero references outside definition"), total lines removed, and anything flagged-but-kept.

Git is the undo button — be bold on evidence, timid on doubt.
