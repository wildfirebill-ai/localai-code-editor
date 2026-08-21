---
name: typecheck-fix
description: Run the TypeScript compiler and systematically eliminate every type error
category: quality
---
Eliminate all type errors without silencing the compiler:

1. **Run**: `npx tsc --noEmit` (or the project's `typecheck` script). Capture the full error list.
2. **Group** errors by root cause — one missing type often produces 10 downstream errors. Fix causes, not symptoms.
3. **Fix rules, in order of preference**:
   - Correct the actual type at its source (function signature, interface, declaration file).
   - Narrow with a type guard or discriminated union when data is genuinely uncertain.
   - Use `unknown` + validation for external input. NEVER use `any`, and never `as` cast to force-fit unless you can prove correctness in a comment.
   - For third-party types that are wrong/outdated: patch locally with a documented declaration, don't bend app code.
4. **Re-run** after each batch. Repeat until zero errors.
5. **Verify behavior**: if a fix changed runtime logic (not just types), run the relevant tests.

Forbidden: `@ts-ignore` / `@ts-expect-error` without an explanation comment, `any`, disabling strict flags in tsconfig.
