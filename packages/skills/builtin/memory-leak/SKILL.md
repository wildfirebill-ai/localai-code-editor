---
name: memory-leak
description: Hunt a memory leak with heap evidence — growth pattern, retainers, fix at the reference holder
category: performance
---
Find and fix a leak with heap snapshots, not vibes:

1. **Confirm the leak**: measure heap over time under realistic load (process.memoryUsage loop, container metrics, browser task manager). A real leak grows monotonically after GC; high-but-stable usage is just a big cache. Save 3+ snapshots: baseline → after load → after load again.
2. **Diff the snapshots**: compare the last two — which object types keep growing? Expand retainers for the growing class: WHAT is holding the reference? (array that only pushes, map without delete, listener never removed, closure capturing scope, timer keeping objects alive, module-level cache unbounded).
3. **Common holders by symptom**:
   - Event listeners added but not removed on teardown.
   - setInterval/setTimeout holding closures; requestAnimationFrame loops past unmount.
   - Caches/Maps keyed by dynamic data (sessions, sockets) without eviction/TTL.
   - Subscriptions (WebSocket, store, observer) not unsubscribed in cleanup/dispose.
4. **Fix at the holder**: remove the listener, clear the timer, evict from the cache (LRU cap), abort in-flight work on dispose. Not "null the variable" superstition — find WHO retains and sever THAT.
5. **Prove it**: repeat the load cycle post-fix; heap now plateaus. Keep the snapshot diff numbers.
6. **Guard**: if the leak came from a lifecycle hook pattern, add the cleanup to the shared base/factory so the next instance can't forget it.

Report: growth evidence, retainer chain found, fix location, plateau proof.
