---
name: test-and-fix
description: Run the project's tests, triage every failure, fix root causes, and loop until green
category: quality
---
Make the test suite pass without weakening it:

1. **Detect the runner**: look for `package.json` scripts (npm/pnpm/yarn), `pytest.ini`/`pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`. Use the project's own test command; if none exists, say so and propose one.
2. **Baseline**: run the full suite once. Record exact failures (do not fix anything yet).
3. **Triage each failure** into:
   - **Real bug** → fix the production code at the root cause.
   - **Bad/outdated test** → fix the test, but explain why the test was wrong.
   - **Flaky/environmental** → identify the race or missing dependency; do NOT add sleeps — fix determinism or skip with a written justification.
4. **Fix one failure at a time**, smallest root-cause change possible. No workarounds: never delete assertions, never catch-and-ignore, never special-case the failing input unless that IS the correct behavior.
5. **Re-run** after each fix. Repeat until green.
6. **Report**: list what failed, the root cause of each, what you changed, and any failures you could NOT fix (with reasoning).

Never mark a suite "fixed" by skipping tests, marking them xfail/skip.todo, or lowering coverage.
