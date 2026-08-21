---
name: db-migration
description: Write a safe schema migration — additive-first, backfills, rollback, and lock awareness
category: backend
---
Change database schema without downtime or data loss:

1. **Prefer additive**: add nullable columns / new tables first. Removing a column = two releases (stop writing → stop reading → drop). Renames = add new + dual-write + copy + switch + drop.
2. **Lock awareness**: adding an index on a large hot table takes locks — use CONCURRENTLY (Postgres) / ONLINE (MySQL) where supported. Adding a NOT NULL column needs a DEFAULT or must be nullable-then-backfill-then-constrain across deploys.
3. **Backfill plan**: existing rows need values for new constraints. Write the backfill as an explicit batched step (`WHERE new_col IS NULL LIMIT 1000` loops), not one giant UPDATE on a big table.
4. **Every migration has a down()** that actually works — test it by running up then down then up against a copy of realistic data. A rollback that deletes user data is worse than none; if true reversal is impossible, say so explicitly in the migration comment.
5. **Test with real-ish data**: run against a snapshot of staging/production-shape data, not empty dev tables. Check row counts before/after for destructive steps.
6. **Deploy-order safety**: the OLD application code must still work after this migration runs (expand/contract). Verify old code paths don't SELECT a column you dropped or violate a constraint you added.

Document: what changes, why, expected duration on production-sized tables, and rollback procedure.
