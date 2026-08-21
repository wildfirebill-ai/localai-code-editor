---
name: debug-failure
description: Systematic root-cause debugging — reproduce, isolate, hypothesize, minimal fix, regression-proof
category: quality
---
Debug a reported failure or bug methodically:

1. **Reproduce**: build the smallest reliable reproduction (command, input, or steps). If you cannot reproduce, say what information you need — do not guess-fix.
2. **Read the actual error**: full stack trace, not just the message. Trace to the first frame in project code.
3. **Isolate**: binary-search the cause — comment out / log / test intermediate values. Form ONE hypothesis at a time and verify it before moving on.
4. **Root cause**: state it in one sentence ("X returns Y because Z assumes W"). If you cannot state it, you are not done isolating.
5. **Minimal fix** at the cause — not at the symptom. A fix in the caller that papers over a callee bug is a symptom patch.
6. **Prove it**: re-run the reproduction (must pass) AND run existing tests (must stay green).
7. **Regression-proof**: add a test that fails without the fix. If the codebase has no test infra, say so and suggest where one would go.

Anti-patterns that are NOT fixes: try/catch swallowing, null checks hiding the real invariant violation, retries masking races, changing assertions to match broken behavior.
