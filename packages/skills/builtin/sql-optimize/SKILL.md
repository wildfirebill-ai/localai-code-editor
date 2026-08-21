---
name: sql-optimize
description: Diagnose and fix a slow SQL query — measure, read the plan, index or rewrite, verify the win
category: backend
---
Make a slow query fast without guessing:

1. **Measure first**: capture actual runtime + rows returned (`EXPLAIN ANALYZE`, MySQL `EXPLAIN FORMAT=JSON` + `SHOW PROFILE`). "Slow" needs a number before and after.
2. **Read the plan**: hunt for — full table scans on large tables, filesort/temporary (ORDER BY/GROUP BY not matching an index), huge row estimates vs actuals (stale statistics → ANALYZE), nested-loop over thousands of rows, functions wrapping indexed columns (`WHERE YEAR(created) = …` kills the index).
3. **Fix in this order of preference**:
   - **Index** for filter/join/sort columns — composite, column order matching equality-then-range. Covering index if it eliminates table lookups.
   - **Rewrite**: SELECT only needed columns; EXISTS instead of COUNT-based existence checks; break correlated subqueries into joins or CTEs; paginate with keyset (id > last) not OFFSET on big tables.
   - **Data shape**: last resort — denormalize/aggregate into a summary table.
4. **Verify**: re-run EXPLAIN ANALYZE. Plan changed? Rows scanned dropped? Runtime improved by how much? If <2× improvement, iterate — a fix you can't measure is a guess.
5. **Check the writes**: new indexes slow INSERT/UPDATE slightly — confirm the write path for that table tolerates it.

Report before/after: plan summary, rows examined, execution time.
