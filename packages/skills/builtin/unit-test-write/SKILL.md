---
name: unit-test-write
description: Write unit tests that match the project's existing patterns and actually catch regressions
category: testing
---
Add meaningful unit tests to a module:

1. **Study the house style first**: read the nearest existing test file. Match framework, assertion style, describe/it naming, fixture/setup conventions, and file location. A test suite in one voice is worth more than tests in five dialects.
2. **Test the contract, not the implementation**: assert observable outputs and side effects. If renaming a private helper breaks your test, you tested the wrong thing.
3. **Cover per function**: the happy path; each boundary (empty/zero/null/max); every error branch; and — most valuably — the edge cases the implementation looks unsure about.
4. **One behavior per test**: name it as a sentence ("returns empty list when no entries match filter"). A failing test's name should tell you the bug without opening the file.
5. **Deterministic**: freeze time, seed randomness, mock ONLY true externals (network, clock, fs) — never mock the module under test's internals. No shared mutable state between tests; fresh fixtures per test.
6. **Run with the rest**: full suite green, and confirm your tests fail when you temporarily break the target code (mutation sanity check). Tests that can't fail are decoration.

Report: what was covered, notable edges found, and any bugs discovered while writing them.
