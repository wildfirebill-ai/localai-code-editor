---
name: api-endpoint-add
description: Add a REST endpoint following the project's existing conventions — validation, errors, tests, docs
category: backend
---
Add an HTTP endpoint that looks like it was always there:

1. **Study conventions first**: read 2-3 existing endpoints in the same router/controller. Match their structure exactly — response envelope shape, error format, status-code habits, naming (plural nouns, kebab-case paths), where validation lives, where auth lives.
2. **Contract before code**: define method + path + request schema + response schema + error cases (400/401/403/404/409/500 as applicable). If the project has OpenAPI/types, write those types FIRST.
3. **Validate input at the boundary**: every field — type, required, length/format. Reject unknown/extra fields per project convention. Return the project's standard error shape, never raw stack traces.
4. **Auth & scope**: apply the same middleware/guard as sibling endpoints handling similar data. An endpoint that reads other users' resources without an ownership check is a vulnerability.
5. **Status codes**: 201 + created resource for POST-create; 200 for action/read; 204 for delete; 404 for missing resource (not 200-with-null); 409 for conflicts.
6. **Tests**: happy path, one validation failure, one auth failure, one not-found. Match existing test style/location.
7. **Docs**: update the API reference/OpenAPI spec in the same change.

Report the endpoint contract table when done: method, path, request, responses.
