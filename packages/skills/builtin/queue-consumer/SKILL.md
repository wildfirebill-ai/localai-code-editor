---
name: queue-consumer
description: Add a reliable background-job consumer — idempotent handlers, retries with backoff, dead-letter safety
category: backend
---
Process background jobs without losing or duplicating work:

1. **Job contract**: each job carries its own ID, type, and full payload (or a reference the handler can re-fetch). Handlers must be idempotent — jobs are delivered AT-LEAST-ONCE; design so running twice = same result (upserts, conditional writes, dedupe keys).
2. **Visibility/ack semantics**: only ack AFTER successful processing. A crash mid-handler must redeliver. Never delete-then-process.
3. **Retries**: exponential backoff with jitter (e.g., 1s → 4s → 16s…, cap ~1h). Classify errors: transient (retry) vs permanent (dead-letter immediately — bad payload will never succeed and retrying floods logs).
4. **Dead-letter queue**: after N failed attempts, park the job with its error history. Alert on DLQ depth > 0. Provide a replay path.
5. **Poison-pill protection**: cap payload size, timeout long handlers, and ensure one poison message can't block the queue head (per-message timeouts, concurrency).
6. **Graceful shutdown**: on SIGTERM, finish the current job then stop fetching — killed mid-job relies on redelivery, which is fine but wasteful.
7. **Observability**: log job ID + type + duration + outcome; export counters for processed/failed/retried.

Test the failure paths explicitly: crash-mid-processing (redelivers), permanent failure (lands in DLQ), duplicate delivery (no double side-effects).
