---
name: types-strictify
description: Tighten TypeScript types in a module — remove any, narrow unions, make illegal states unrepresentable
category: quality
---
Upgrade a module from loose to strict typing:

1. **Flip the flags for one file at a time**: work with the errors visible (enable noImplicitAny locally via editor or per-file checking). Fix before widening scope.
2. **Kill `any` in order of safety**:
   - Real known shape → write the interface/type.
   - External/unvalidated data → `unknown` + a type guard or schema parse (zod/valibot/manual) at the boundary.
   - Genuinely dynamic keys → `Record<string, T>` with proper value type.
   - Third-party missing types → local `.d.ts` declaration.
3. **Model the domain as unions**: replace `status: string` with `type Status = 'idle' | 'running' | 'failed'`; replace boolean pairs like `isLoading && hasError` with a single state union. Make illegal states unrepresentable — then watch whole classes of checks become unnecessary.
4. **Discriminate instead of cast**: convert `if ('error' in x) … x.message` hope into tagged unions (`{kind:'ok',value} | {kind:'err',error}`) and exhaustive switch with a `never` default.
5. **Escape hatches need receipts**: remaining `as` casts get a comment proving why they're safe; zero new `@ts-ignore`.
6. **Prove no behavior change**: typecheck clean + full test suite green + diff review shows only type-level edits. Any runtime edit must be justified separately.

Report: anys removed (count), unions introduced, casts that remain and why each is safe.
