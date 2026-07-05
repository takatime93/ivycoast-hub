# Refine All Pages — Consolidated Findings & Plan (2026-07-05)

Source: 5 parallel read-only audits (Home, Tasks+Docs, Products, Orders+Customers, CRM+Tools).
Executed as sequenced safe-fix sweeps; browser-judgment items flagged separately.

## Cross-cutting themes (recur on nearly every page)
1. **Keyboard a11y** — clickable `<div>`/`<tr>`/cards/tiles lack tabindex/role/keydown; `:focus-visible` CSS is dead. Home stat tiles, home task rows, task cards, product cards+thumbs, table rows (orders/customers), CRM cards.
2. **Text overflow** — long JA/EN not clamped/truncated: `.task-card-name`, `.product-card-title`, `.dev-pipeline-card-name`, doc names, emails, customer names.
3. **Empty/error states** — inconsistent; many hardcoded English (bypass `t()`): home placeholders, board columns (no per-column empty), CRM tab empties, library empty workspace, no error affordance on failed loads.
4. **Token adherence** — hardcoded `#e0e0e0`, `#5f6368`, `#062420`, `#0e413b`, `0.1s/0.15s` transitions, raw font-px, rgba hovers. Widespread.
5. **Mobile tables** — Orders(8), Customers(6), formulator batch(6) tables have no `overflow-x` wrapper (vendor table already has the pattern).
6. **Motion regressions on new surfaces** — duplicate `.product-card` CSS block (5746/6293/6303) overrides tokenized motion with `0.15s` literals; `.pd-*`, `.dev-pipeline-card`, `.score-drawer`, `.pd-back` don't use motion tokens.
7. **Currency/number** — `toLocaleString()` no `ja-JP`; ¥0 → "—" (should be ¥0); currency columns not right-aligned.

## Sweep plan (sequential — same file)
- **Sweep 1 — Cross-cutting mechanical (highest leverage):** fix duplicate `.product-card` block (restore motion); token cleanup (borders/text/transitions/font-px → tokens, replace_all where safe); shared keyboard-a11y helper applied to clickable cards/rows/tiles/thumbs.
- **Sweep 2 — Text + empty/error + i18n:** clamp/truncate titles & table cells (+`title` attrs); per-column board empty state; route hardcoded empty strings through `t()` (add JA); library empty-workspace; add error affordance to failed loads.
- **Sweep 3 — Tables/mobile + currency + page specifics:** wrap wide tables in `overflow-x`; `ja-JP` currency + right-align + ¥0 fix; formulator preset-row alignment (remove extra 32px margin) + batch table responsive; CRM tab lazy render + empty-state CTAs; order-detail badges + View-in-CRM.

## Needs Taka's browser eyes (NOT done blind)
- Kanban drag drop-position indicator + drag parity between tasks board and dev pipeline (two interaction models).
- Score-card visual cohesion (gauge/verdict design).
- Mobile layout order on Home (stats below long task list); iframe/embed heights.
- Vendor grid density (`repeat(4)` → `auto-fill minmax`).
- Overall premium-feel judgment per surface.

## Status
- [x] Sweep 1  - [x] Sweep 2  - [x] Sweep 3 (shipped 2026-07-05)
