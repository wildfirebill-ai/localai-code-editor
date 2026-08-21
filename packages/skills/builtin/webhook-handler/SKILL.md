---
name: webhook-handler
description: Receive webhooks safely — verify signatures, stay idempotent, respond fast, handle replays
category: backend
---
Implement an inbound webhook endpoint that survives the real world:

1. **Verify authenticity FIRST**: validate the provider's HMAC signature over the RAW body (not re-serialized JSON — key ordering breaks it) using the webhook secret. Compare with a constant-time function. Reject missing/invalid signatures with 401. If the provider offers timestamp + signature, reject stale timestamps (replay defense, e.g., >5 min).
2. **Respond fast**: acknowledge with 200 quickly; do real work async (queue/background). Providers time out in ~5–10s and will retry on timeout — slow processing causes duplicate deliveries.
3. **Idempotency**: deliveries WILL duplicate. Store the event/delivery ID and skip already-processed ones — atomically (unique constraint or conditional insert), not check-then-insert.
4. **Handle ordering**: events may arrive out of order. Version/timestamps in payloads should gate state transitions ("ignore if newer event already applied").
5. **Error semantics**: return 4xx for permanently bad payloads (don't retry), let 5xx happen for transient failures so the provider retries. Never 200-with-swallowed-error.
6. **Observability**: log event type + delivery ID + outcome for every call; alert on repeated verification failures (that's someone probing you).

Test with the provider's CLI/local emitter and a forged-signature request before shipping.
