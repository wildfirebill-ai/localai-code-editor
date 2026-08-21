---
name: lint-clean
description: Run the linter, apply safe autofixes, and resolve the rest by hand without suppressing rules
category: quality
---
Get the project to a clean lint state:

1. **Detect**: ESLint/Biome (JS/TS), Ruff/Flake8 (Python), Clippy (Rust), golangci-lint (Go), or a `lint` script in package.json.
2. **Autofix pass**: run the linter's `--fix` / `lint:fix`. Review the resulting diff — autofix can change formatting massively; if it touches unrelated files, revert those (`git checkout -- <file>`) and keep the fix scoped to files relevant to current work.
3. **Manual pass** on remaining findings:
   - Fix the code properly (unused var → remove it; sync-over-async → make it async; etc.).
   - If a rule is genuinely wrong for this project, propose disabling it ONCE in the shared config with a comment explaining why — never inline `// eslint-disable-next-line` as a habit.
4. **Re-run** until zero errors AND zero new warnings.
5. Confirm tests still pass if any fix touched logic.
