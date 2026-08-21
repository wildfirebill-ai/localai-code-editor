---
name: accessibility-fix
description: WCAG pass on a component — semantics, keyboard, labels, contrast, focus management
category: frontend
---
Make a UI component accessible:

1. **Semantics first**: replace div/span soup with real elements — button, a[href], nav, ul/li, label+input, table/th. Native elements give keyboard + screen-reader behavior for free. ARIA is the fallback when native can't express it, never the default.
2. **Keyboard**: tab through the component in order. Every interactive element reachable and operable (Enter/Space activates buttons, arrows for lists/tabs/menus). No focus traps without an escape. Visible `:focus-visible` style that isn't removed.
3. **Labels & names**: every input has a programmatic label (`<label for>`, aria-label, or visible text). Icon-only buttons need accessible names. Images: alt="" for decoration, meaningful alt for content.
4. **Contrast**: text ≥ 4.5:1 against its actual rendered background (compute it, don't eyeball); large text ≥ 3:1; non-color indicators for state (don't rely on red/green alone).
5. **Dynamic updates**: loading/error/success states announced via role="status"/aria-live="polite". Modals move focus in on open and restore it on close.
6. **Verify**: axe/Lighthouse scan for the automated classes, then manually with keyboard-only navigation.

Report each finding as: element, WCAG criterion (e.g., 1.4.3), what a screen-reader/keyboard user experiences today, and the fix.
