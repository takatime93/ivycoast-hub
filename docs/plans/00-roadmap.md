# Roadmap — Soap Tooling & App-wide Improvements

Master plan for the current stream of work. Build order is top-to-bottom (Taka's stated order).
Nothing here is built until Taka signs off on the individual feature plan.

---

## Build order & status

| # | Feature | Plan | Status |
|---|---------|------|--------|
| 0 | Soap formulator — real cost data | (shipped, see CHANGELOG) | ✅ Shipped |
| 1 | Quality-score "read more" side panel | `01-quality-score-panel.md` | ✅ Shipped (local) |
| 2 | JA/EN localization toggle (whole app) | `02-localization.md` | ✅ Core done (small remainder) |
| 3 | Product Catalogue (evolve Products tab) | `03-product-catalogue.md` | 🔨 3a+3b done; 3c–3e + seeding remain |
| 4 | UX/UI + QA sweep (subagent) | `04-ux-qa-sweep.md` | ✅ Audit + polish r1/r2 + WCAG 2.2 AA design uplift done |
| — | Candle formulator | (no plan yet) | ⛔ Blocked — need wax/fragrance/vessel specs |

## Sequencing note

Localization (2) is built **before** the Catalogue (3) on purpose: once the i18n system exists,
the Catalogue is built i18n-aware from the start instead of being retrofitted. The QA sweep (4)
runs last so it audits everything, including the new features.

---

## Decisions already locked (from Taka)

- **Cost model:** split — ingredient cost/bar AND finished-unit cost incl. packaging. ✅ done.
- **Cost data:** load all real March-2026 costs as source of truth. ✅ done.
- **Catalogue:** evolve the existing **Products tab** into a full Product Catalogue (all types:
  soap, candle, other Shopify, in-development) — NOT a soap-only view. Enrichment via a Hub-side
  `ProductMeta` overlay (Shopify stays authoritative for live data). Includes dev-product pipeline
  + per-product version history. See `03-product-catalogue.md`.
- **"Total made":** derived from batch history (Σ bars across linked SoapBatches).
- **Catalogue capabilities (all locked):** grid-default view + category sub-tabs; unified version
  history (recipe + record); dev pipeline `Concept→In Dev→Testing→Ready→Launched`; **scoped
  (product-bound) calculator** (opened from a product, presets hidden, save locked to that product);
  **"New version" iteration** with live cost/size/quality estimates; **multi-select Compare** matrix
  (cost/ingredients/properties/reviews/notes); **NPD** create-flow + kanban + stage gates + graduate.
- **Task 3 will be phased** when built (e.g. 3a catalogue IA + ProductMeta; 3b detail + versions;
  3c scoped calc + new-version; 3d compare; 3e NPD board) — each phase reviewable on its own.
- **Score panel:** two tabs — (a) curated interpretation of the *actual* score shown [default],
  (b) how the score is calculated [static].
- **Localization rules:** translate general UI / buttons / descriptors. DO NOT translate proper
  nouns, product & people names, document titles, invoices, or recipes (they display in their real
  language). English-native content stays English.
- **Localization — default language:** **detect from browser**, fall back to Japanese.
- **Localization — bilingual labels:** existing "JA (EN)" labels (e.g. formulator) stay **always
  bilingual** regardless of toggle. The toggle governs single-language *chrome* (nav, buttons,
  descriptors, empty states, toasts).
- **Catalogue navigation:** its **own top-level tab** (alongside Products / Orders / CRM).

## Open questions to resolve before building

1. **Localization — toggle placement/form** — header segmented control `[EN | 日本語]`, top-right? (minor)
2. **Catalogue** — confirm the live lineup (which soaps are current vs future/discontinued); history
   storage as JSON column vs separate sheet (build-time call).
3. **Candle** — still need Taka's supplier specs (wax types + max fragrance load + melt/pour temps +
   costs; fragrance oils; vessel fill weights; wick guide).

---

## Guardrails (from CLAUDE.md — apply to every task)

- Single HTML file on GitHub Pages, no build system. Backend = Google Sheets via Apps Script.
- Never use `innerHTML` — createElement / textContent / appendChild only (hook-enforced).
- Never push the localhost auth bypass; allowlist must run for all users.
- Never auto-create invoices. Never commit Firebase config without Taka's review.
- Google Sheet column orders are exact — never guess (see CLAUDE.md).
- Nothing deploys until a REVIEW folder has `APPROVED.md`.
