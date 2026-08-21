---
name: git-release
description: Cut a release — version bump, changelog, tag, push; verify CI afterwards
category: git
---
Prepare and publish a release:

1. **Preconditions**: working tree clean (or commit pending changes first), on the main/default branch, tests green. Never release from a dirty tree.
2. **Version bump**: update version in `package.json`/`Cargo.toml`/`pyproject.toml` per SemVer — breaking → major, features → minor, fixes → patch.
3. **Changelog**: add a section at the top of CHANGELOG.md for the new version with Added/Changed/Fixed/Security subsections, written from the actual commit history (`git log <last-tag>..HEAD --oneline`). User-facing language, not commit-message dumps.
4. **Tag**: annotated tag `v<version>` with a one-line summary. Push the branch AND the tag together.
5. **Verify**: watch CI for the tag run. Confirm the release artifacts appear and the changelog rendered correctly. If CI fails, fix and re-tag (delete remote tag first) — never ship a red release.

Only push tags when the user explicitly asked for a release.
