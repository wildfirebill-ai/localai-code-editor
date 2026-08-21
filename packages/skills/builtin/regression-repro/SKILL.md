---
name: regression-repro
description: Turn a bug report into a failing test first, then fix — proof the bug existed and is now dead
category: testing
---
Fix bugs test-first so they can never silently return:

1. **Distill the report** into exact steps + expected vs actual. Ambiguous reports get clarified or reproduced from logs before any code changes.
2. **Write the failing test FIRST**: encode the reported behavior at the lowest level that reproduces it — unit if the function misbehaves, integration if components interact, e2e if it's a flow. Run it: it MUST fail with the reported symptom. A test that passes already proves nothing about the bug.
3. **Diagnose**: with the failing test as your compass, find the root cause (see debug-failure discipline — one hypothesis at a time).
4. **Minimal fix** at the cause. Re-run the new test → green. Run the FULL suite → no regressions.
5. **Sweep for siblings**: would this same defect bite similar call sites/inputs? Check variants and add cases to the new test if warranted.
6. **Commit together**: fix + regression test in one change, message referencing the report ("fix: handle empty filter (reported in #123)"). A fix shipped without its regression test will be reintroduced within a year.

If the bug genuinely can't be tested at any level, document why and add the closest observable assertion you can.
