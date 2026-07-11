# Plan 06 — App-Wide Refinement (deliberate, surface-by-surface)

**Mode:** slow and methodical. Plan each surface, refine, verify, check in (ideally Taka browser-tests each) before moving on. No mass fan-out; one meaningful chunk at a time.

**Inputs folded in:** `docs/qa/refine-all-pages-20260705.md` (5-page audit), the interaction-completeness findings (confirmation dialogs, save/discard, animation gaps), and prior QA.

---

## Phase 0 — Interaction foundation (cross-cutting primitives FIRST)
These underpin every surface, so build them before per-surface polish.

- **0a. Reusable confirmation modal.** Replace all 18 native `confirm()` calls with one styled, bilingual (i18n) confirm dialog: title, message, Confirm (destructive = red) / Cancel, Escape + backdrop close, focus trap, returns a promise/callback. Sites: delete invoice/receipt/task/order/contact/person/stock/document, archive/restore/move-stage.
- **0b. Save/discard dirty-guard.** Track dirty state on edit forms (invoice, receipt, task, contact/CRM, new-product). Closing (X / Escape / backdrop) with unsaved changes → "Save / Discard / Cancel" prompt. No silent data loss.
- **0c. Modal/drawer consistency shell.** Audit every modal/drawer for: entrance/exit animation (motion tokens), X button + Escape + backdrop-close, focus management, consistent header/footer/action layout. Normalize.
- **0d. Interaction primitives coverage.** Ensure hover + `:active` press + `:focus-visible` on ALL interactive surfaces incl. the newest (dev-pipeline cards, pd-* detail, score drawer) using motion tokens.

## Phase 1 — Per-surface refinement (in this order)
Each: meaningful plan → refine → verify → Taka browser-check.

1. **Products** (catalogue grid, full-page detail, dev pipeline, new-product) — most recently built, highest churn.
2. **CRM** (pipeline, vendor cards, contact detail slide-in w/ 6 tabs) — most complex surface.
3. **Tools / Soap Formulator** (recipe builder, results, score card+drawer, batch table) + Documents (invoices/receipts).
4. **Orders** + **Customers** (tables, detail modal, drawer).
5. **Tasks** (Kanban board).
6. **Overview / Home** (dashboard cards, stats, embeds).
7. **Ivycoast Docs** (library table + category grid).

## Phase 2 — Design-judgment items (need Taka's eyes; NOT done blind)
From the audit's "needs browser eyes" list: kanban drag drop-indicator + drag parity; score-card gauge/verdict; home mobile ordering; vendor grid density; overall premium-feel per surface.

---

## Working rules
- Plan-before-build each chunk; log each shipped change in `CHANGELOG.md`.
- Every edit: no `innerHTML`; i18n symmetric; node-check + brace balance + i18n-resolve before deploy.
- Adversarial QA (Halle) on risky diffs before calling a phase done.
- Deploy in reviewable batches; bump SW cache each deploy.

## Status
- [x] 0a confirm modal - [x] 0b save/discard - [x] 0c modal shell - [x] 0d primitives
- [x] 1 Products - [ ] 2 CRM - [ ] 3 Tools - [ ] 4 Orders/Customers - [ ] 5 Tasks - [ ] 6 Home - [ ] 7 Docs
