---
name: coverage-gap
description: Find untested critical paths and fill the gaps that actually protect users, not the coverage number
category: testing
---
Close test coverage where it matters:

1. **Rank by risk, not by %**: list modules by (criticality × change frequency). Payment/auth/data-mutation code with 40% coverage beats a util file at 100%. Coverage tools show lines; you must supply judgment.
2. **Find the silent paths**: uncovered error handlers, retry loops, permission checks, migration logic, boundary parsing. These are where production incidents live — happy paths get tested by simply using the app.
3. **Write gap-filling tests** using the module's existing patterns: for each critical path — normal execution, failure branch (does it clean up? notify? retry?), and one adversarial input.
4. **Prefer integration-flavored units**: testing a function against a real temp dir / in-memory DB catches more than heavily-mocked line-fillers. One real-behavior test > five mock-rehearsals.
5. **Don't chase the metric**: skip trivial getters, generated code, type-only files. If a test exists only to turn a red line green, delete it — it's noise that slows every future run.
6. **Report**: before/after coverage on the touched modules, list of paths now protected, and any risky paths you found but could NOT test (with why) — those need refactoring, not mockery.
