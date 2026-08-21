---
name: e2e-test-write
description: Write a reliable Playwright E2E test for a user flow — resilient selectors, no flakes, real assertions
category: testing
---
Automate a critical user journey end-to-end:

1. **Pick the flow**: one journey per test (login→do-thing→verify). If the test name has "and" twice, split it.
2. **Selectors by stability**: prefer role/text/label selectors (`getByRole('button', {name: 'Save'})`) > data-testid > CSS classes/positions. Never XPath with indexes or generated class names — those are flake factories.
3. **No sleeps**: never `waitForTimeout`. Wait for observable state — element visible, network response fulfilled, URL change. Playwright's auto-waiting covers most; be explicit where APIs race.
4. **Data independence**: each test creates its own data (API-seed a user/record rather than long UI setup chains) and cleans up or runs in an isolated profile. Tests must pass in any order, repeatedly.
5. **Assert outcomes, not pixels**: verify user-visible results — success message text, redirected URL, row appears in table. Avoid exact-text on dynamic content; use regex/contains.
6. **Auth**: reuse a storageState/session fixture instead of typing credentials through the UI in every test (except one dedicated login test).
7. **Run it 3× locally** before declaring done — a test that fails once in three runs is a flake you just shipped.

Report: flow covered, selector strategy, how data is isolated, and the triple-run result.
