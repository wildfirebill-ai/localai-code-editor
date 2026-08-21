---
name: write-docs
description: Write or update README/API documentation grounded in the actual code — never invented behavior
category: docs
---
Document code accurately:

1. **Ground truth first**: read the actual entry points, exports, and config before writing a word. Every claim must trace to code you have read. If you didn't verify it, don't write it.
2. **README structure** (when writing/updating one): one-line value proposition → install → quick start (copy-pasteable, actually works) → configuration table → examples → license. No marketing fluff between the user and the quick start.
3. **API/reference docs**: for each public export — signature, what it does, args with types/defaults, return value, one minimal example, thrown errors. Order by usage frequency, not alphabetically.
4. **Style**: present tense, active voice, second person ("you can…"). Code blocks always specify language. Every command must be runnable as written.
5. **Update, don't duplicate**: fix existing docs in place; flag (don't silently delete) sections that seem wrong but you can't verify.
6. **Staleness sweep**: while documenting, if you notice README claims that no longer match the code, fix them in the same pass.
