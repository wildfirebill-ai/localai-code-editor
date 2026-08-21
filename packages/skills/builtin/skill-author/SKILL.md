---
name: skill-author
description: Author a new SKILL.md for this editor's agent — scoped, triggerable, and genuinely executable instructions
category: ai-integration
---
Write a skill the agent will actually use well:

1. **One job per skill**: "review-and-fix TypeScript errors in packages/server" is a skill; "be a better coder" is not. If the description needs "and" twice, split it.
2. **Frontmatter discipline**: `name` = kebab-case, matches directory, verb-y (`fix-imports`, not `imports-fixing`). `description` = one line stating WHEN to use it — this is what the model sees in its skills list when deciding whether to call read_skill. Sell the trigger: "Run when the user asks to X or encounters Y."
3. **Body = executable procedure**: numbered steps with concrete commands the agent can run verbatim (`pnpm --filter @localai/server typecheck`), decision rules ("if X then Y"), and an explicit stop condition. Write it like an onboarding doc for a competent new hire on their first day.
4. **Include anti-patterns**: the 3–5 things a well-meaning agent would get wrong ("do NOT delete failing assertions", "never widen a type to make an error disappear"). These prevent confident mistakes.
5. **Test it live**: place under `.localai/skills/<name>/SKILL.md`, ask the agent to perform the task, watch it load via read_skill. Does it follow the steps? Did it need info the skill forgot? Iterate until a clean run.
6. **Placement**: project-specific → workspace `.localai/skills/`; reusable across projects → contribute to builtins. Never duplicate a builtin — override only to change behavior.

Report: skill name + trigger + a summary of the live test run.
