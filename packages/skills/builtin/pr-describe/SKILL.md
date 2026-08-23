---
name: pr-describe
description: Write a clear, comprehensive PR description following conventional commit style
category: git
---
Write a clear PR description using this structure:

## What Changed
- Bullet list of actual changes (not vague summaries)

## Why
- Link to issue or describe the problem being solved

## How
- Brief technical approach for non-trivial changes

## Testing
- How the change was tested
- What manual verification was done

## Checklist
- [ ] Tests pass locally
- [ ] Type checking passes
- [ ] No console.log left in production code
- [ ] Documentation updated if needed