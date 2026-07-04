# Plan 04 — App-wide UX/UI + QA Sweep

**Status:** 📋 Planned — runs LAST so it audits everything, including features 1–3.
**Method:** subagent(s) / `Workflow` fan-out — audit first, then fix in priority order with verification.
**Touches:** potentially anywhere in `index.html` (+ `apps-script.js` if data bugs surface).

---

## Goal

Make the Hub feel like a rich, coherent CRM/SAAS product — end-to-end and "front-to-front" connected,
with bugs caught and UX/UI polished. This is an **audit → prioritize → fix → verify** loop, not a
free-for-all refactor.

## Scope — what the audit looks for

1. **Correctness / bugs** — broken flows, dead buttons, console errors, data-loss paths, error handling,
   the auth/allowlist rules (localhost bypass must be gone), Sheet column-order adherence.
2. **End-to-end connectivity** — do objects link where they should? (order → invoice → contact →
   partner stock → soap product → batch). Navigation completeness; no dead ends.
3. **UX flows** — task friction, empty/loading/error states, confirmation on destructive actions,
   toasts on save/fail, keyboard/Esc behavior, consistency of drawers/modals.
4. **UI / design-system fidelity** — token usage vs hardcoded values, spacing/typography consistency,
   responsive/mobile behavior, dark-mode/contrast if applicable, iconography.
5. **Consistency after i18n** — nothing untranslated that should be; nothing translated that shouldn't
   (invoices/recipes/names/doc titles).
6. **Performance** — 1 MB single file; look for obvious render/reflow costs, large loops, redundant work.

## Method

1. **Fan-out audit** — parallel reviewers each own an app section (Overview, Tasks, Docs, Products,
   Orders, Customers, CRM, Tools/Formulator, Catalogue, Invoices/Receipts) producing structured findings
   (area, severity, evidence `file:line`, suggested fix).
2. **Adversarial verify** — each finding independently confirmed real before it earns a fix (avoids
   noise / false positives).
3. **Prioritize** — P0 correctness/security → P1 broken UX → P2 polish → P3 nice-to-have.
4. **Fix loop** — resolve one at a time, verify each, log to CHANGELOG.
5. Existing QA agents (`Halle`, `iris-qa`) may drive this given they're built for web/e-comm/quality review.

## Guardrails

- No deploy without `APPROVED.md` in a REVIEW folder.
- Never introduce `innerHTML`; never touch Firebase config without Taka; never auto-create invoices.
- Fixes are surgical + reviewable; each logged with before/after + verification.

## Deliverables

- `docs/qa/findings-YYYYMMDD.md` — full prioritized findings list with severities.
- CHANGELOG entries per batch of fixes.
- A short "state of the app" summary: what's solid, what's fragile, what's deferred.

## Open questions

- How aggressive on UI restyling? (Lean: **fix bugs + friction first**, restyle only where it clearly
  helps — avoid a big visual rework that needs its own design pass unless Taka wants that.)
- Any areas explicitly out of scope (e.g. BOLDOATH tab)?
