---
name: readme-quickstart
description: Verify the README quickstart by actually executing it, then fix every step that breaks
category: docs
---
Make the Quick Start section trustworthy by running it:

1. **Clean room**: fresh temp directory (or container) simulating a new user — no node_modules, no cached config. Follow the README steps EXACTLY as written: same commands, same order, copy-paste not paraphrase.
2. **Record every failure**: command not found → missing prerequisite; version error → engines field wrong; file-not-found → docs reference paths that don't exist; port conflict → hardcoded port undocumented.
3. **Fix the docs first**, code second: if a step fails because docs are stale, correct the doc. If it fails because the CODE is broken or requires undocumented setup, fix code/config AND document any genuinely required prerequisite.
4. **Verify the payoff**: after the last step, confirm what was promised actually happened — server responds on the stated URL, test suite runs, output matches the shown sample.
5. **Prerequisite audit**: state exact minimum versions that were tested (Node 20+, pnpm 10…), and add them to the Requirements line + engines/packageManager fields if drifted.
6. **Re-run top to bottom** after fixes until a stranger could succeed on the first try.

Report: each step → pass/fail → what you changed. An untested quickstart is a bug factory.
