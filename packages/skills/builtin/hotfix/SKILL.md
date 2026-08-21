---
name: hotfix
description: Emergency production fix — minimal diff, fastest safe path, no drive-by improvements
category: git
---
Ship a critical fix under pressure without making things worse:

1. **Pin the symptom**: exact error, affected version/tag, reproduction command. If you can't reproduce it, you're guessing — gather logs first.
2. **Bisect the cause**: `git bisect` between last-known-good tag and current if the culprit commit is unknown. Time-box this; a suspected area + targeted logging is acceptable under time pressure.
3. **Smallest possible fix**: reverses or corrects the defect ONLY. No refactoring, no dependency bumps, no style changes — every extra line is review burden and rollback risk. Note larger fixes as follow-ups.
4. **Prove it**: test that fails before / passes after, plus the existing suite. Under deadline, run at least the tests covering the touched module.
5. **Ship path**: branch from the release tag (not main HEAD) → fix → version bump patch (v1.2.3 → v1.2.4) → fast-track review → tag/release per project flow.
6. **Post-incident**: open follow-up issues for the proper fix, the missing test that should have caught it, and any debt the hotfix took on.

Anti-patterns: "while we're in here" changes, fixing without reproducing, releasing untested because urgent.
