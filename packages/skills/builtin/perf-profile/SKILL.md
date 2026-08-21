---
name: perf-profile
description: Profile a slow code path, find the real bottleneck, fix it, and prove the improvement with numbers
category: performance
---
Speed up slow code with evidence, not folklore:

1. **Reproduce + measure**: build the slowest realistic scenario (real data volume, not 10 rows). Capture baseline: wall time, and language-appropriate profiler output (pprof, node --cpu-prof / clinic, py-spy, Chrome Performance panel). NO profiler = no opinions.
2. **Find the dominant cost**: sort by self-time. Optimize the top item only — a 2× speedup of code that's 5% of runtime is a 2.5% overall win nobody notices. Watch for: N+1 query patterns, O(n²) scans over collections, sync I/O in hot paths, repeated re-parsing/serialization, chatty network loops.
3. **Form one hypothesis**, fix it minimally (cache with invalidation, batch the N calls, index the query, move work off hot path), then RE-MEASURE with identical input.
4. **Keep or revert**: improvement ≥ 20%? keep. Marginal? revert — complexity must pay rent. Record both numbers.
5. **Guard the win**: add a benchmark or perf test so regressions surface (`benchstat`-style before/after in the PR).
6. **Iterate** only if still too slow: repeat from step 2. Two rounds usually suffice; beyond that, the design is wrong — say so and propose the structural change.

Report: scenario, baseline vs after (with measurement method), what changed, and what you deliberately did NOT optimize.
