# Changelog — Ivycoast Hub

All notable changes to the app, newest first. Dates are absolute (YYYY-MM-DD).
See `plans/` for the design reasoning behind each change.

---

## 2026-07-04

### ✅ Product Catalogue — Phase 3b (ProductMeta overlay + dev pipeline)
**Files:** `apps-script.js` (new `ProductMeta` sheet) + `index.html` (frontend). **Plan:** `plans/03-product-catalogue.md`.

- **Backend:** added `ProductMeta` sheet (19 cols: id, shopifyProductId, source, category, devStatus, line,
  nameEn, nameJa, marketingName, ingredientLabelJa, linkedFormulaId, costPerBar, finishedCostPerBar,
  targetLaunch, heroImageUrl, internalNotes, versions, createdAt, updatedAt), wired exactly like SoapBatches
  (ensureSheet, batch read → `productMeta`, keyMap/itemKeyMap). Hub-authoritative; never touched by Shopify sync.
- **Frontend:** `productMeta` loaded from batch (defensive `|| []`), cached, `getProductMetaForShopify()` helper.
- **In-Development pipeline board:** 5 columns (Concept→In Development→Testing→Ready→Launched) of `source:"hub"`
  products with ◀/▶ stage-move (optimistic + persisted).
- **"+ New product" create flow:** modal (category/nameEn/nameJa/marketingName/line/targetLaunch/notes) →
  creates a `source:"hub"`, `devStatus:"concept"` record via the existing `productsApiPost` path. Toast on failure.
- +23 symmetric i18n keys.

**Verified:** both files node-check clean; 0 innerHTML; all 335 referenced i18n keys resolve; Phase 3a not regressed.
⚠️ **Needs deploy:** end-to-end persistence requires the Apps Script redeployed with the ProductMeta sheet.
Until then the board + create flow work in-session (optimistic + cache) and never throw on empty overlay.
**Not yet:** 3c scoped calculator + new-version, 3d compare, 3e version history/detail tabs; seeding the live lineup.

### ✅ Motion & micro-interaction system
**Files:** `index.html` + `docs/design/motion-system-20260704.md` (research). By iris-design.
**Scope:** motion only — no layout/IA/feature/color/i18n changes.

- **Motion tokens** in `:root`: durations (`--motion-instant/fast/base/slow/drawer` 80–300ms) + easings
  (`--ease-out/in/in-out/emphasized`). Existing `--transition-fast/normal/slow` re-aliased onto the scale
  (normal 0.15s→0.2s) so all ~65 existing transitions calm uniformly — reconciled, not forked.
- **Applied:** button press feedback (`scale(0.98)`), tab/underline glides, table-row hover fade, card hover
  elevation + press + capped staggered rise-in (first 8, GPU transform/opacity), modal/status-picker/preview
  enter (backdrop fade + panel lift), drawer slide unified onto `--motion-drawer`, toast slide+fade retimed,
  skeleton→content crossfade utilities.
- **4 new keyframes** (motion-rise/fade-in/backdrop-in/modal-in), all GPU-friendly.
- **WCAG 2.3.3:** the `prefers-reduced-motion` block extended so every new animation/transition is neutralized —
  content appears instantly, states intact.

**Verified:** node-check clean; 0 innerHTML; CSS braces balanced (1687/1687); tokens resolve; reduced-motion covers all new motion.
⚠️ Motion must be *felt* — needs a browser test (feel-test list in the report).

### ✅ Premium UI/UX uplift + WCAG 2.2 AA (design pass)
**Files:** `index.html` + `docs/design/premium-uplift-research-20260704.md` (research). By iris-design.
**Scope:** systemic token/rule-level polish only — no layout, IA, feature, or i18n-string changes.

- **WCAG 2.2 AA** (superset of Level A — the real premium bar): fixed all failing text-contrast tokens
  (tertiary 3.68→4.69:1, disabled 2.64→4.52:1, warning-text→5.38:1, external-link→5.52:1); document-wide
  `:focus-visible` ring on every interactive element (2.4.7) with a `forced-colors` fallback; 24×24 min target
  sizes (2.5.8); color-not-alone hover cues (1.4.1).
- **Premium system:** rebuilt shadow/elevation scale (calm two-layer), unified hover/active/disabled/selected
  states, consistent radii, `prefers-reduced-motion` handling (stops skeleton shimmer / card lifts).
- **Bug caught + fixed:** product cards + version editor referenced a nonexistent `--color-text-primary` (no
  fallback) — added as an alias of `--color-text`.
- Research doc cites WCAG 2.2 / HIG / Material 3 / NN/g and reference SaaS/CRM patterns (Linear/Stripe/Notion/Attio).

**Verified:** node-check clean; 0 innerHTML; CSS braces balanced (1653/1653); all tokens resolve; 0 new i18n keys.
⚠️ Visual pass done WITHOUT a browser check — needs Taka's eyes (spot-check list in the report).

### ✅ QA round 2 — connectivity, mobile, tokens, orphan cleanup
**File:** `index.html`. **Source:** `docs/qa/findings-20260704.md`.

- **"View in CRM" links** across Orders, Invoice/document rows, and the Customer drawer — shown only when a
  CRM contact matches (by email). `_findCrmContactByEmail()` + `_makeViewInCrmLink()`; opens `openCrmDetailView`.
- **Mobile invoice/receipt preview** — below 600px the illegible 35%-scale split preview is hidden and replaced
  with a "Preview" button opening the full-screen overlay (P2-9).
- **Design-token cleanup** — ~20 inline `style.cssText` sites tokenized (e.g. `#5f6368`→`--color-text-secondary`,
  `#c5221f`→`--color-error-text`). A handful with no token equivalent were left and noted (P2-3, partial).
- **Orphaned `#ivycoast` view removed** — was unreachable (no tab) and redundant with the Ivycoast Docs library;
  removed the view markup + its per-init render call + dead re-render branch (P1-3).

**Verified:** node-check clean; 0 innerHTML; +1 i18n key (`crm.viewInCrm`) symmetric; no dangling `ivycoast` refs.

### ✅ QA polish — premium fixes (round 1)
**File:** `index.html`. **Source:** `docs/qa/findings-20260704.md`.

- Replaced all **19 native `alert()`s with the app toast** (P1-4) — biggest premium-feel win.
- **Escape now closes** the receipt modal (P1-1) and `_openQuickEdit` dialogs (P1-2).
- **Modal ARIA** — `role="dialog"` + `aria-modal` + `aria-labelledby` on the 4 modals (P2-4).
- **Silent failures fixed:** `fetchAllData` catch now surfaces a status + toast (P0-5); batch response now guards
  `data.error` before assigning arrays (P2-7).

**Verified:** node-check clean; 0 innerHTML; 0 native alerts remain.
**Deferred (dedicated round):** orphaned `#ivycoast` view (P1-3), "View in CRM" connectivity links, mobile invoice
preview (P2-9), inline-style token extraction (P2-3), and minor P2 code cleanups.

### ✅ Product Catalogue — Phase 3a (frontend IA restructure)
**Files:** `index.html` only (no backend). **Plan:** `plans/03-product-catalogue.md`.

- **Category sub-tabs** on the Products view: `All · Soap · Candle · <other Shopify types> · In Development`,
  built dynamically from loaded products with live counts. Classification `classifyProduct()`: SKU `SOP-`→soap,
  `CND-`→candle, else `productType`.
- **Grid ⇄ Table view toggle**, default **Grid** (image cards: image/placeholder, title, SKU, price, stock
  badge, status, type; card→existing detail modal). Persisted in `localStorage['ivh-products-view']`. Table
  renderer unchanged, gated behind toggle.
- **Vendor filter** (our products vs resale) from distinct `vendor` values; composes with status/type/search.
- **In Development** tab = placeholder empty state until Phase 3b persists dev products.
- i18n: 8 symmetric en/ja keys for the new chrome; product data left untranslated.

**Verified:** node syntax OK; 0 innerHTML; all 318 referenced i18n keys resolve; new keys symmetric.
Existing filters, inline stock edit, detail modal, and sync preserved.

**Phase 3b+ (not started, needs input):** `ProductMeta` sheet (backend/`apps-script.js`) + persisted dev
products, tabbed detail (Overview/Formula/Versions/Batches/Inventory), scoped calculator, compare, version
history. Requires Taka to confirm the live-vs-in-development lineup for seeding.

### 🔨 Localization (i18n) — engine + toggle + first tranche
**Files:** `index.html` (I18N dict, t/applyI18n/setLang/initI18n, header toggle, `data-i18n` attrs).
**Plan:** `plans/02-localization.md`. **Status:** in progress — tranche 1 of the sweep.

- Added `I18N = {en, ja}` (83 symmetric keys), `t(key)`, `applyI18n()` (walks `[data-i18n]`/`[data-i18n-ph]`),
  `setLang()` (persists `localStorage['ivh-lang']`, sets `<html lang>`, re-renders active view), `initI18n()`
  (uses stored pref, else detects from browser → EN if `navigator.language` starts `en`, else JA fallback).
- Header `[EN | 日本語]` segmented toggle, top-right.
- Converted first tranche of chrome only: nav tabs, section titles/subtitles, Tools subnav, toolbar
  filter options + search placeholders + primary buttons, board columns / CRM stages, empty states. (93 bindings.)
- Left untranslated (by rule): product/customer/people names, doc titles, invoice & recipe content,
  and existing bilingual "JA (EN)" formulator labels.

**Verified:** node syntax passes; 0 innerHTML; keys symmetric EN/JA; `initI18n` wired into `init()`.

**Tranche 2 (modals + chrome):** +~180 keys (258 total each language). Keyed the invoice/receipt/task/
order-detail/manual-order/CRM-contact modals, `_openQuickEdit`, customer drawer, Home/Overview cards,
Docs + all table headers, board extras, and shared `common.*` buttons. Added a `tr()` alias for use inside
functions that locally shadow `t`. Verified independently: node syntax OK, 0 innerHTML, **all 255 referenced
keys resolve in both en and ja (0 missing)**. Formulator bilingual labels + score drawer left as-is by design.
**Tranche 3 (final — dynamic chrome):** 320 keys each language. Added `tf(key, params)` interpolation
helper (count subtitles like "{n} files across {c} categories") and `_crmStageLabel()`. Keyed CRM detail
view (tabs, badges, stage submenu, menus, confirms) with a re-render hook on toggle, board badges/tooltips/
empty state, global search result headers, contact/product search dropdowns, pricing-party rows, and
count-bearing subtitles. Verified: node syntax OK, 0 innerHTML, **all 310 referenced keys resolve in both
en+ja**. **Status of Plan 02: ✅ core localization complete.**

**Documented remainder (small, low-risk):** the CRM Overview/Orders/Stock analytics stat-cards and the
pricing-rules table interweave chrome labels with data-derived values tightly; the agent keyed the safe
standalone labels and left the interwoven strings for a dedicated pass. Formulator body + score drawer stay
bilingual by design.

⚠️ **Needs Taka:** a visual click-test of the `[EN | 日本語]` toggle (I can't drive a browser here).

### 📋 Whole-app QA + UX audit (read-only)
**File:** `docs/qa/findings-20260704.md` (by Halle). No code changed — audit only.

- **Clean on the big rules:** no localhost auth bypass, no `innerHTML`, no auto-invoice; allowlist runs for all.
- Prioritized findings P0→P3. Notable: **P0-4** `CLAUDE.md` invoice schema is stale (missing
  `paymentBank | paymentNote | marginNote`); **P0-5** silent `fetchAllData` failure; **P1** receipt modal
  can't Escape, 19 `alert()`s, orphaned `#ivycoast` view; **P2** 29+ hardcoded inline styles, no modal ARIA,
  client-side invoice-number collision risk.
- Feeds Plan 04 (the fix phase).

### ✅ Quality-score "Read more" side panel (Soap Formulator)
**Files:** `index.html` (score card button, drawer markup + CSS, formulator globals, ~180 lines of JS).
**Plan:** `plans/01-quality-score-panel.md`.

- Added a right-side drawer (mirrors the existing `.customer-drawer` pattern) opened from the score card.
- **Tab 1 "About this score"** — dynamic, keyed to the live score + properties: band verdict
  (90–100 / 70–89 / 40–69 / 0–39 / empty), per-property status chips (green in-range / amber within 10 /
  red out) against the standard ranges, direction-aware fix suggestions for out-of-range properties,
  and an honest-caveats box.
- **Tab 2 "How it's calculated"** — static: the 3-step method, ranges table, `score = 100 − Σ(distance
  outside band)` formula, and a worked example.
- Globals `formulatorLastScore` / `formulatorLastProps` set in `formulatorRecalc` so the drawer reads live state.
- Bilingual (JA primary + EN), strings kept as plain literals for i18n keying in Plan 02.

**Verified:** node syntax check passes; zero `innerHTML` in the file (all DOM via createElement);
null/empty state handled; dynamic logic reviewed by hand. Built by subagent, independently verified.

**Status:** ✅ Shipped to working tree (local only — not deployed).

### ✅ Soap Formulator — real cost data + packaging cost model
**Files:** `index.html` (SOAP_OIL_DB, calcCostPerBar, formulatorRecalc, cost card UI, additive list, new helpers)
**Source of truth:** `~/Downloads/Soap Making breakdown.xlsx`, "2026 ingredients cost 130g" tab, dated 29 Mar 2026.

- Replaced placeholder oil costs with **real Ivycoast supplier prices** (¥/g): Olive 1.6, Coconut 2.26,
  Cacao 8.51, Jojoba 9.62, Shea 9.63, Avocado 7.96, Rice bran 0.73, Camellia 3.3, Castor 1.78, CBD 222.
- Added a `costSrc` flag per oil: `"2026-03"` = confirmed supplier cost, `"est"` = industry estimate.
- Added 3 oils used in real recipes but missing from the DB, with SAP + fatty-acid profiles:
  **Sesame (太白ごま油)**, **Macadamia**, **Kakadu Plum**.
- Added `SOAP_INGREDIENT_COSTS` reference table (essential oils, clays, herbs, CBD, NaOH) so **additives
  now auto-cost** from their name (previously every additive was ¥0). Manual override still respected.
- Added `soapLookupIngredientCost()` — tolerant name resolver (handles "炭 (Charcoal)", "Chamomile EO"
  vs "Chamomile dry herb", carrier oils like "Jojoba Oil (clay mix)"). Falls back to the oil DB.
- Cost card now shows a **3-line split**: 材料費/個 (ingredients/bar) → 容器・包装/個 (packaging/bar,
  ¥293.6 = box ¥206.6 + 2 stickers ¥55 + card ¥32) → 完成品コスト/個 (true finished-bar cost).

**Verified:** node syntax check passes; cost math reconciled against the workbook to the yen
(Chamomile recipe: Olive ¥316.8, Cacao ¥663.8, Jojoba ¥404 vs workbook ¥316.8 / ¥663 / ¥403.2);
name-resolver unit-tested against real preset additive names.

**Not done / deliberate:** legacy field names `weightOz` / `costPerOz` kept (they're really grams / ¥-per-gram)
because saved batches serialize `weightOz` into the SoapBatches sheet — renaming would break stored history.
A clarifying comment was added instead.

**Status:** ✅ Shipped to working tree (local only — not deployed).
