---
name: adr-write
description: Write an Architecture Decision Record — context, options considered, decision, consequences
category: docs
---
Record a significant technical decision as an ADR:

1. **Worthy?** ADRs are for decisions that are expensive to reverse or will surprise someone later ("why SQLite not Postgres?", "why our own queue?"). Framework/library choices, data models, protocols, and trade-off resolutions qualify. Formatting choices don't.
2. **Structure** (Nygard format, keep it under ~1 page):
   - **Title**: passive verb ("Adopt SQLite for single-user persistence").
   - **Status**: Proposed / Accepted / Superseded-by-ADR-N.
   - **Context**: the forces at play — constraints, requirements, the problem. Facts only, no solution yet.
   - **Decision**: one active-voice sentence, then supporting detail.
   - **Options considered**: each with pros/cons — INCLUDING the rejected ones. Two options minimum; a decision without alternatives is a preference.
   - **Consequences**: what becomes easier, what becomes harder, what we now commit to doing.
3. **Honesty rule**: list the real drawbacks of the chosen option. An ADR with no downsides listed is marketing, not engineering.
4. **Number & file**: next sequential number in docs/adr/ (0001-, 0002-…), immutable once accepted — changes happen via new superseding ADRs.
5. **Link it**: reference from the code/config where the decision lives ("see ADR-0007") so future readers find why.
