---
name: git-conventional
description: Enforce Conventional Commits format for all commit messages
category: git
---

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Formatting, no code change
- `refactor` — Code restructuring, no behavior change
- `perf` — Performance improvement
- `test` — Adding or fixing tests
- `chore` — Maintenance, build, deps

**Examples:**
- `feat(agent): add read_skill tool for dynamic skill loading`
- `fix(git): resolve branch name encoding in diff output`
- `docs(readme): add Docker socket warning section`

**Enforcement:** The agent will validate commit messages and suggest corrections when you ask it to commit or create a PR.