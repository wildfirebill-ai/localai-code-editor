---
name: responsive-fix
description: Make a UI work across mobile → desktop with fluid layout and real breakpoints
category: frontend
---
Fix responsive layout problems:

1. **Audit at real widths**: 320, 375, 768, 1024, 1440. Record what breaks where — horizontal scroll, squashed columns, overlapping text, unreachable tap targets.
2. **Mobile-first structure**: base styles target the smallest layout; `@media (min-width: …)` adds complexity upward. If the CSS fights this direction, refactor the specific rules rather than piling on max-width overrides.
3. **Fluid before breakpoints**: prefer `flex-wrap`, `grid` with `repeat(auto-fit, minmax(240px, 1fr))`, `clamp()` typography, and percentage/fr units — they eliminate entire breakpoint tiers. Reserve media queries for genuine structural changes (sidebar collapse, nav hamburger).
4. **Touch targets**: interactive elements ≥ 44×44px effective area; hover-only affordances need a tap equivalent (menus must open on first tap).
5. **Content stress tests**: verify each breakpoint with longest-realistic strings (no word-break blowups), empty states, and 2× content volume. Test both orientation of phones/tablets.
6. **No horizontal scroll**: after fixes, confirm `document.documentElement.scrollWidth <= innerWidth` at every audited width.

Report: which widths broke, root cause per breakage, fix applied, and the sweep results.
