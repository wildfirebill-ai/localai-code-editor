---
name: log-triage
description: Triage application logs for error patterns — separate signal from noise, find the root incident
category: devops
---
Turn a pile of logs into a diagnosis:

1. **Frame the window**: exact time range of the incident/report. Everything outside it is context, not signal.
2. **Count before reading**: group by error message/type and count occurrences. One error ×10k = systemic; 50 unique errors ×1 each = cascade from a single root cause. Find the EARLIEST new error in the window — that's usually the prime mover.
3. **Separate the four noises**: retries (echoes of the real failure), health-check noise, expected 4xx traffic (bots probing), and deprecation warnings. Filter them out; what remains is signal.
4. **Follow one request**: pick one failed trace/request ID and read its complete lifecycle across services. Where does it first go wrong? Upstream errors are symptoms; walk to the origin service.
5. **Correlate with change**: deploys, config pushes, dependency updates, traffic spikes in the same window? `git log`/release markers against the timeline. New error class appearing right after a deploy = prime suspect.
6. **Output**: incident summary — timeline, root cause hypothesis ranked by evidence, affected scope (users/requests), and the exact log lines proving each claim. No fix speculation without the evidence trail.
