---
name: ts-check
description: Typecheck a package with pnpm typecheck before committing
category: quality
---

Run `pnpm typecheck` from the package root and fix any errors.

**Usage:** The agent will run this automatically when you ask it to "check types" or before committing TypeScript changes.

**Scope:** Runs on the current package (detected from cwd) or all packages if at workspace root.