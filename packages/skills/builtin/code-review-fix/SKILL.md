---
name: code-review-fix
description: Work through review comments — verify each claim, fix what's real, push back on what isn't
category: git
---
Address code review feedback with technical rigor:

1. **Triage every comment** into: must-fix (bug/violation), should-fix (style/convention), question (clarification), disagree (reviewer is mistaken).
2. **Verify claims before acting**: re-read the cited code. Reviewers miss context; if a suggestion breaks behavior or misses an edge case, don't apply it blindly — prepare a concrete counter-argument (code path, test, or spec line).
3. **Fix in order**: bugs first, then conventions, then nits. Each fix gets its own commit referencing the comment ("address review: extract validation helper").
4. **For disagreements**: reply with evidence — a test that passes under your version, the docs/spec section, or the bug the suggestion would introduce. "I prefer it my way" is not an argument; a failing case is.
5. **Re-run gates**: typecheck + lint + tests after ALL fixes, not each one.
6. **Summarize**: list every comment → resolution (fixed in <commit> / answered / wontfix because …). Nothing left silent.

Never mark threads resolved without either a fix commit or a substantive reply.
