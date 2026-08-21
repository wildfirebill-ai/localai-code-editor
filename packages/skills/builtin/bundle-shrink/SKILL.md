---
name: bundle-shrink
description: Reduce JS bundle size — measure what's actually in it, split code, kill duplicate/heavy deps
category: performance
---
Shrink the shipped JavaScript:

1. **Measure**: generate the bundle analysis (vite-bundle-analyzer / webpack-bundle-analyzer / source-map-explorer). List the top 10 modules by size. Guessing is forbidden; the answer is usually surprising (moment locales? an icon pack? lodash full import?).
2. **Cheap wins first**:
   - Replace `import _ from 'lodash'` with named imports or native equivalents (`Object.groupBy`, structuredClone, Intl).
   - Date/moment → dayjs or Temporal helpers; remove duplicated utility libraries (pick ONE of lodash/es-toolkit).
   - Tree-shake blockers: side-effectful module top-levels, barrel files re-exporting everything.
3. **Code-split**: lazy-load routes and below-the-fold/heavy components (`React.lazy`/dynamic import). Anything only used after interaction shouldn't be in the initial chunk. Verify the split actually moved bytes between chunks.
4. **Assets**: images → WebP/AVIF + sized; fonts → subset woff2 with unicode-range; check nothing ships both ESM+UMD twice.
5. **Verify functionality** after each step: the app must still work — lazy chunks load, dynamic imports resolve. Run the test suite + click through main flows.
6. **Report**: before/after gzip sizes for initial chunk and total, per-change breakdown. Guard with a CI size budget if the project supports one.

A "smaller" build that breaks a lazily-loaded route is worse than the fat one.
