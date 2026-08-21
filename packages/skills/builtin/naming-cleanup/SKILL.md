---
name: naming-cleanup
description: Improve names so code explains itself — no renames of public API without a migration note
category: quality
---
Make a module's names carry their weight:

1. **Hunt the offenders**: single letters outside tiny loop indices (`e` in catch is fine), abbreviations only the author understands (usr, mgr, tmp2, calcBtn), names lying about behavior (`getData` that writes, `isValid` with side effects), and boolean names without is/has/can/should.
2. **Rename to the domain**: use the words the project's docs/issues use. `fetchUserData` vs `loadUserProfile` — pick the project's existing verb conventions: fetch/get/load (network vs sync vs expensive), create/make, remove/delete.
3. **Scope-appropriate length**: short in tight scope (`i`, `x` in a map), descriptive at module boundaries. A name used once three lines away can be terse; an exported function name is documentation.
4. **Consistency pass**: same concept = same word everywhere. If half the file says "customer" and half says "client" for the same entity, unify to the dominant/domain term. Different concepts must NOT share a word.
5. **Mechanical safety**: use rename-tooling only (LSP/IDE), never find-replace text. Compile + tests green after each logical rename batch. Keep diffs pure — a rename commit contains NOTHING else.
6. **Public API caution**: exported functions/classes/config keys are contracts — renaming them is breaking. Deprecate old + add new, or document the break per project policy.

Report: renames table (old → new + why), consistency decisions made, any API-surface renames deferred.
