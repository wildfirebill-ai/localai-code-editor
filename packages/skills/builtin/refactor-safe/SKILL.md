---
name: refactor-safe
description: Behavior-preserving refactoring with a safety net — characterize first, change in small steps
category: quality
---
Refactor code without changing behavior:

1. **Safety net first**: identify the tests covering the target code. If coverage is thin, write characterization tests that pin down CURRENT behavior (including quirks) before touching anything. No tests possible? Refactor in even smaller steps and verify by running the app path manually.
2. **One move per step**, run tests after each. Never mix a refactor with a behavior change — if a behavior change is needed, finish the refactor, commit, then do the behavior change separately.
3. **Standard moves** (apply in this order of preference):
   - Extract function/variable for duplicated or opaque logic.
   - Replace magic values with named constants.
   - Reduce nesting via early returns / guard clauses.
   - Split a function doing two things into two.
   - Move code closer to its usage; delete dead code outright.
4. **Stop condition**: when the code reads clearly and duplication is gone — do not gold-plate. Every extra step is risk.
5. **Final check**: full test suite green + diff contains zero behavior changes (review your own diff for accidental logic edits).
