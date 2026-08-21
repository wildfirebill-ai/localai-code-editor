---
name: component-extract
description: Extract a reusable UI component from inline markup — props design, state placement, no behavior drift
category: frontend
---
Extract a component without changing what renders:

1. **Choose the seam**: find JSX that (a) repeats, or (b) is a coherent unit buried in a 300-line file. The seam is the smallest self-contained subtree.
2. **Catalog the dependencies** before cutting: values read from outer scope, event handlers, styles, hooks called inside. Each becomes a prop — or reveals state that must move WITH the component.
3. **Design props minimally**: pass data, not configuration flags. Two boolean props that always travel together = one variant enum. More than ~7 props means the extraction boundary is wrong.
4. **State placement rule**: state used only by the extracted piece moves inside it; state shared with the parent stays up and flows down via props + callbacks up.
5. **Move, don't rewrite**: cut-paste the JSX verbatim first, wire props, verify pixel-identical rendering, THEN clean up naming/styles inside the new component as a separate step.
6. **Verify**: render both before/after states side by side; run any component tests; check keyboard interaction and hover/focus still work.

Anti-patterns: extracting a "component" with one usage and no reuse plan, passing entire parent state objects, context-grabbing to avoid designing props.
