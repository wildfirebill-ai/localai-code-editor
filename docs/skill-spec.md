# Skill Specification

This document describes the `SKILL.md` format used by LocalAI Code Editor's agent skills system.

## Overview

Skills are Markdown files with YAML frontmatter that teach the AI agent your conventions, workflows, and best practices. They are loaded on-demand via the `read_skill` tool.

## File Structure

```
<workspace>/.localai/skills/<skill-name>/SKILL.md
```

Or globally:
```
~/.localai/skills/<skill-name>/SKILL.md
```

## Frontmatter Schema

```yaml
---
name: <string>              # Required: unique identifier (kebab-case)
description: <string>       # Required: one-line summary
category: <string>          # Optional: quality, git, docker, testing, etc.
version: <string>           # Optional: semantic version
author: <string>            # Optional: author name/url
tags: <string[]>            # Optional: searchable tags
requires: <string[]>        # Optional: other skills this depends on
---
```

## Content

The Markdown body contains the skill instructions. Use clear, actionable language. The agent reads this content and follows the instructions when the skill is loaded.

### Best Practices

1. **Be specific** — Concrete steps, not vague advice
2. **Use examples** — Show, don't just tell
3. **Include commands** — Exact commands the agent should run
4. **Explain context** — When to use this skill, when not to
5. **Link references** — Link to docs, specs, or related skills

## Example

```markdown
---
name: ts-check
description: Typecheck a package with pnpm typecheck before committing
category: quality
version: 1.0.0
tags: [typescript, typecheck, quality]
---

Run `pnpm typecheck` from the package root and fix any errors.

**Usage:** The agent will run this automatically when you ask it to "check types" or before committing TypeScript changes.

**Scope:** Runs on the current package (detected from cwd) or all packages if at workspace root.

**Common Issues:**
- Missing type declarations → Add `@types/*` packages
- Strict mode errors → Fix implicit `any`, add explicit types
- Module resolution → Check `tsconfig.json` paths and `baseUrl`
```

## Loading Skills

The agent loads skills automatically when:
1. You explicitly request it: "Use the ts-check skill"
2. The task matches skill tags/description
3. You reference a skill in your prompt: "Follow the git-conventional skill"

## Project vs Global Skills

| Location | Scope | Override |
|----------|-------|----------|
| `<workspace>/.localai/skills/` | Project-specific | Overrides global |
| `~/.localai/skills/` | User/global | Base fallback |

## Skill Discovery

The agent discovers skills by:
1. Scanning project skills directory
2. Scanning global skills directory
3. Matching name, tags, description against the task

## Versioning

Skills should use semantic versioning. The agent will load the latest version by default.