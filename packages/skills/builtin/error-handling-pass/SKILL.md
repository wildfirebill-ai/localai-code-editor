---
name: error-handling-pass
description: Standardize error handling in a module — typed errors, no swallowed failures, actionable messages
category: quality
---
Bring a module's error handling up to standard:

1. **Inventory current behavior**: list every try/catch, throw, and callback-style error path. Flag the sins: empty catch blocks, `catch(e) {}`, catch-log-continue (errors that vanish), string throws, returning `null`/`false` instead of errors, losing the original error when rethrowing.
2. **Adopt one error style** per the project's stack: typed error classes or Result<T,E> pattern; custom errors carry a code + context fields. Match what already exists — don't import a second paradigm.
3. **Wrap, don't erase**: when catching to add context, preserve the cause (`throw new X("failed to load config", { cause: e })` / `fmt.Errorf("…: %w", err)`). The original stack/chain must survive to the logs.
4. **Fail loudly at boundaries**: top-level handlers log the full error with context (operation, inputs minus secrets) and return a generic message outward. Internal details for logs, safe text for users.
5. **Validate early, throw once**: push checks to entry points so internals can assume valid input; deep defensive `if (!x) throw` everywhere hides which layer owns the guarantee.
6. **Cleanup paths**: anything opened in try (files, connections, locks) is released in finally/cleanup-on-error. Audit each new catch for resource leaks it might create.

Every error path gets a test: trigger it and assert the user-visible result AND that the cause chain survives into logs.
