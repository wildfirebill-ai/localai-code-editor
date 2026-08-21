---
name: css-debug
description: Debug layout/visual bugs with DevTools reasoning — computed styles, containing blocks, stacking
category: frontend
---
Fix a visual/layout bug systematically:

1. **Reproduce at the exact viewport** where it breaks. Note: which browser, zoom level, and whether it's consistent.
2. **Walk the box tree**: for the misbehaving element inspect, in order — computed `display`/`position`, `width/height` origin (set, flex-basis, intrinsic?), margins collapsing, then padding/border. Compare computed values against the cascade you expect; find WHICH rule won unexpectedly.
3. **Common culprits by symptom**:
   - Overflow/scrollbar → missing `min-width: 0` on a flex child, or fixed width + long unbreakable content (`overflow-wrap`).
   - Element invisible → z-index vs stacking context (a parent with transform/filter/opacity creates one), or zero height from floated children (needs clearfix/flow-root).
   - Gap between elements → margin collapse, inline-block whitespace, or baseline alignment on images (`vertical-align`, display:block).
   - Centering fails → wrong containing block for absolute positioning (nearest positioned ancestor, not viewport).
4. **Minimal fix** at the offending rule — not a magic offset/!important that breaks at other viewports.
5. **Regression sweep**: check the fix at 320px, 768px, 1440px widths AND with real-ish content lengths (long words, empty state, 3-line title).

Never ship a fix you verified at only one viewport size.
