---
name: ci-fix
description: Diagnose and fix a failing CI pipeline — read the real log, reproduce locally, fix at the cause
category: devops
---
Get the pipeline green:

1. **Read the ACTUAL failure**: open the failing job's raw log, find the FIRST error (not the last line). CI failures cascade — the root failure is usually pages above the red summary. Note which step, which OS matrix entry, and whether it's consistent or flaky.
2. **Classify**: 
   - **Code broke it** → reproduce locally with the same command + same dependency versions (`pnpm install --frozen-lockfile`), fix code.
   - **Environment drift** → action version bumped, runner image updated, missing system dep. Pin versions explicitly; document required deps in the workflow.
   - **Ordering/caching** → stale cache serving old artifacts; broken artifact paths (check glob vs actual output dir). Fix the pipeline definition, clear caches.
   - **Flaky** → rerun once to confirm; a test that fails intermittently gets quarantined AND an issue filed — never just re-run-and-pray into green.
3. **Reproduce before fixing**: if you can't reproduce locally, your fix is speculative — say so, push, watch the run, iterate. Each iteration reads the NEW first-error.
4. **Minimal workflow change**: don't rewrite the pipeline while debugging one step. One hypothesis per push.
5. **Harden after green**: once passing, pin third-party actions to versions/SHAs, add `--frozen-lockfile`, ensure secrets are named consistently.

Report: root cause chain (first error → why), what changed, and prevention.
