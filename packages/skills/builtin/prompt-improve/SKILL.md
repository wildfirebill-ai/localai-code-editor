---
name: prompt-improve
description: Improve an LLM prompt systematically — diagnose failure modes, change one variable, test with fixed cases
category: ai-integration
---
Make a prompt measurably better:

1. **Build a test set FIRST**: 5–15 real inputs including the failure cases, edge cases, and traps (injection-ish phrasing, ambiguous asks). Frozen and re-runnable — same model, same temperature (0 for determinism) every iteration. No eval set = no improvement claims.
2. **Diagnose the current failures**: run the set, categorize misses — ignores instruction? wrong format? hallucinates constraints? over/under-hedged? verbose? Different diseases need different medicine.
3. **Change ONE thing per iteration**: add a missing constraint / an example (few-shot beats adjectives — show, don't tell "be concise") / output structure ("respond with JSON with fields x,y") / move critical instructions to the top or as a final reminder (recency wins in long prompts).
4. **Re-run the frozen set** after each change; keep score (pass rate, exact-match where possible). Keep improvements, revert regressions. Prompts have side-effects across cases: fixing case A often breaks case B — that's why the set exists.
5. **Anti-patterns to remove**: vague qualifiers ("be helpful", "as best you can"), contradicting rules, buried action verbs among context, politeness padding. Every sentence should change model behavior or go.
6. **Ship with provenance**: record prompt version + eval scores in the commit so future-you can compare.

Report: table of iterations → pass counts, final prompt, remaining known failures.
