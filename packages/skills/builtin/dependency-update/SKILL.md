---
name: dependency-update
description: Update dependencies safely — audit first, batch updates, test after, document breaking changes
category: maintenance
---
Update project dependencies without breaking it:

1. **Inventory**: `npm outdated` / `pnpm outdated` (or pip list --outdated, cargo outdated). Classify: patch/minor (low risk) vs major (read the changelog/release notes FIRST).
2. **Security check**: run the ecosystem audit (`pnpm audit`, `npm audit`, `pip-audit`). Prioritize fixing known CVEs; prefer upgrading the direct dependency over `--force`/overrides.
3. **Batch by risk**: apply all patch/minor in one pass → install → run tests. Then majors ONE AT A TIME: upgrade → read breaking-change notes → fix call sites → test.
4. **Breaking-change discipline**: for each major bump, enumerate every usage of the package and verify signatures still match. Fix call sites, don't pin old versions "for now".
5. **Verify**: full test suite + typecheck + app boots. A dependency update that ships without running the app is not done.
6. **Report**: table of updated packages (old → new), which were security-driven, what broke and how you fixed it. Update the lockfile is part of the change — commit both together.
