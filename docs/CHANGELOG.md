# Changelog — Ivycoast Hub

All notable changes to the app, newest first. Dates are absolute (YYYY-MM-DD).
See `plans/` for the design reasoning behind each change.

---

## 2026-07-11

### ✅ Phase A — backend foundations (Plan 07, apps-script.js only — requires Apps Script redeploy)
- **LockService on mutating CRUD:** `create`/`update`/`delete` in `doPost` now run under
  `LockService.getScriptLock()` (`waitLock(10000)`, released in `finally`). Fixes duplicate-ID risk in
  `nextId()` (max+1 scan) and lost updates in `updateRow()` (read-modify-write). Lock acquired after the
  auth gate; on timeout the API returns `{error: "busy, retry"}` — the client should treat that as retryable.
  Deliberately NOT locked: heartbeat (per-user row-scoped), Shopify sync actions (minutes-long; would starve
  CRUD), uploadFile (Drive I/O; its only sheet write is an append-only activity row with collision-proof IDs).
- **batchList cache actually works now (was dead):** the old single `cache.put("batchList", …)` exceeded
  CacheService's ~100KB value cap, threw, and was silently swallowed — so every 2-min poll did 16 full-sheet
  reads. Fixed both sides: (a) Products rows in the **batchList response no longer include `description` or
  `metafields`** (detail views must fetch them via `?action=list&sheet=Products`, which still returns full
  rows); (b) the payload is sharded into 30K-char chunks (`batchList_0..n` + `batchList_meta` count key,
  60s TTL) and reassembled on read; cache errors now log via `console.error` instead of vanishing. Cache is
  invalidated inside the locked mutation path (after the write) and after sync/updateInventory actions, so
  writes are visible on the next poll.
- **ActivityLog reads capped:** replaced full-sheet reads + `slice(-100)` with a windowed
  `getRecentActivities_(100)` (reads only the last ≤100 data rows via `getRange`; guards the <100-row case;
  still newest-first). Applied to both batchList and `?action=list&sheet=ActivityLog`.
- **ensureSheets no longer runs per request:** was 9+ header-row reads on every doGet/doPost. Now gated by
  Script Property `SHEETS_ENSURED_V1` — runs once per deployment, then never again. Manual force:
  `?action=ensureSheets` (also re-sets the flag). **If a future deploy adds sheets/columns, either bump the
  flag name (V1→V2) in code, delete the property in the Apps Script editor, or hit `?action=ensureSheets`
  once after deploying.** `scheduledSync()` uses the same gated path.
- **Heartbeat cost reduced:** one Presence-sheet read, in-memory diff, writes only changed cells
  (`lastActive` always; `currentTab`/`photoUrl` only when different), and the response is built from the
  in-memory data — the trailing full re-read is gone. Response shape unchanged.
- **Schema links (plumbing only, no data populated):** canonical headers extended — Orders gains `contactId`
  (appended after `lastSynced`), Tasks gains `entityType`, `entityId` (appended after `updatedAt`).
  `ensureSheet` already appends missing header columns to existing sheets (append-only, never reorders);
  Tasks and Orders are now registered in the ensure pass so the columns self-add. `createRow`/`updateRow`
  are header-driven, so the new fields pass through create/update automatically.
- **Unchanged:** auth verification + allowlist, Shopify webhook no-op (auto-invoice still disabled),
  Shopify sync function bodies, uploadFile, fetchOgImage.

**DEPLOY STEPS:**
1. Copy `apps-script.js` into the Apps Script editor and deploy a new web app version.
2. The first request after deploy runs the ensure pass once (the `SHEETS_ENSURED_V1` property doesn't exist
   yet), which auto-appends the new `contactId` / `entityType` / `entityId` header columns. To trigger it
   explicitly / verify: open `<webapp-url>?action=ensureSheets` — expect `{"success":true,"ensured":true}`.
3. No Sheet edits, no new Script Properties to set manually.

### ✅ Phase A — frontend foundations (Plan 07: index.html, sw.js, version.json)
- **Version mismatch fixed:** `APP_VERSION` (index.html:9811) was `"20260313-1"` vs version.json
  `"20260704-1"`, so the update banner fired every 3 min forever. Both now `"20260711-1"` with a
  "MUST match version.json" comment at the constant.
- **Head scripts unblocked (index.html:18–20):** firebase-app/auth-compat now load with `defer`; jsPDF +
  autotable (~400KB) removed from `<head>` entirely — lazy-loaded via new `loadJsPdf()` helper
  (index.html:9828, cached Promise, loads jspdf then autotable in order, retries on failure). Both PDF
  entry points (`downloadInvoicePdf` index.html:24838, `downloadReceiptPdf` index.html:26044) are now
  `async` and `await loadJsPdf()` first with a toast on load failure; all callers are fire-and-forget
  (onclick / listeners / `exportInvoicePdf`), so no caller changes needed. Because `defer` moves SDK
  execution after inline scripts, the firebase bootstrap (init/persistence/token interceptor/
  onAuthStateChanged, index.html:29342–29405) now runs inside `initFirebaseAuth()` at DOMContentLoaded
  (deferred scripts always execute before it) — the bootstrap statements themselves are byte-identical,
  config and allowlist untouched.
- **SW stale-while-revalidate for HTML (sw.js:57–91):** navigations respond from cache instantly when
  present; a background fetch (registered with `e.waitUntil` synchronously) updates the cache and posts
  the existing `SW_UPDATED` message only when the page's ETag/Last-Modified actually changed. Falls back
  to network when uncached. `/fonts/` verified covered by the lazy cache-first branch (no skip pattern
  matches same-origin fonts). `CACHE_NAME` → `ivyhub-v20`.
- **localStorage snapshot hardened (`saveDataCache`, index.html:9863–9894):** products are slimmed
  (`description` + `metafields` deleted from a copy) before writing — matches the backend change that
  drops them from batchList; in-memory arrays untouched. The silent catch now
  `console.warn("dataCache save failed", e)`.
- **Post-save round-trips cut:** removed the `setTimeout(fetchActivityLog, 500)` chained onto all 8 API
  helpers (`apiPost` :10577, `crmApiPost` :11830, `stockApiPost` :11841, `contactDocApiPost` :11852,
  `peopleApiPost` :11862, `soapBatchApiPost` :11884, `invApiPost` :20891, `recApiPost` :25086) — the 60s
  activity poll covers it. Removed the success-path refetches where local state is already reconciled
  optimistically before the POST: task update (`fetchBoardTasks()` :11057), invoice update
  (`fetchInvoices(true)` :24078), receipt update (`fetchReceipts(true)` :25737). All error/catch-path
  refetches kept (they reconcile after failure).
- **No-op re-render skip (index.html:9941–9981):** `fetchAllData` now computes a per-collection
  fingerprint (row count + JSON length across the 16 consumed keys) and, on unforced polls with an
  identical payload, only bumps `lastFetched`/last-synced and returns — no array reassignment, no render
  cascade, no 5MB localStorage rewrite. `fetchAllData(force)` added; the 5 post-save reconcile call sites
  (stock save/sold/delete, contact-doc save/delete) now pass `true`; the 2-min poll and
  visibilitychange resume stay unforced; first fetch always renders (empty fingerprint).
- **Contact image uploads parallelized (index.html:20674):** avatar/card-front/card-back now run via
  `Promise.all` (they write disjoint contact fields); per-file result handling and null-URL error paths
  unchanged (`uploadCrmFile` always invokes its callback). Per-step overlay texts dropped in favor of the
  existing combined "Uploading …" message.
- **Global search now covers Invoices + Receipts (index.html:~11606–11761):** invoices match on
  invoiceNumber/contactName/contactCompany/orderNumber/total, receipts on
  receiptNumber/contactName/invoiceNumber (5 results each, same createElement pattern — no innerHTML);
  results route to `tools/documents` and open `openInvoiceEditModal`/`openReceiptEditModal` after nav,
  mirroring the CRM result pattern. New i18n keys `search.invoices`/`search.receipts` (EN+JP).
- **Fonts:** fonttools/pyftsubset available on this machine (`/Library/Frameworks/Python.framework/
  Versions/3.12/bin/pyftsubset`) — FA Pro subsetting deferred to its own reviewed change per plan.
- `grep -c innerHTML index.html` = 0 (baseline preserved).

### ✅ Phase 1 surfaces 4–7: Orders/Customers, Tasks, Home, Docs (Plan 06) — Phase 1 COMPLETE
- **1.4 Orders/Customers:** order-detail summary header (date + emphasized total), consistent action-button
  classes, tokenized drawer hover (fixed leftover blue-on-green), dead-CSS removal, aligned total rounding.
  Halle-QA'd clean.
- **1.5 Tasks:** overdue → error-bg pill; edit(⋯) button → accessible `.task-card-edit` class; fixed
  done-column drag opacity compounding (~0.32→0.5); category chip ellipsis; BLD badge tokens; zero-count muted.
- **1.6 Home:** meeting-note tabs single-row ellipsis+scroll; tokenized all stat-renderer hex (unified
  warn/error semantics); `.stat-num`→`--text-xl/lg`; CRM 4-tile→balanced 2×2; CRM/Shopify empty states.
- **1.7 Docs:** active-sort column affinity; standardized empty-state class; count-chip radius token.
- **Plan 06 complete: Phase 0 (foundation) + all 7 Phase-1 surfaces shipped. SW → v19.**
  Remaining = Phase 2 design-judgment items (kanban drag indicator, score-card gauge, home mobile order,
  vendor grid density feel) — deliberately left for Taka's in-browser judgment.

### ✅ Phase 1 surfaces 1–3: Products, CRM, Tools (Plan 06)
- **1.1 Products:** detail-page Soap-Batches section i18n'd + score colors tokenized; dev pipeline board
  reflows single-column on mobile. (Focus ring / badges / specs confirmed already-correct.)
- **1.2 CRM:** pipeline empty-column states; vendor grid → responsive `auto-fill minmax(280px)`; vendor-card
  long-name robustness; tokenized CRM hex + stage-badge palette (card+detail+submenu); contact-detail tabs
  get `role=tablist/tab/tabpanel` + `aria-selected` + panel fade (lazy-render preserved).
- **1.3 Tools/Formulator:** tokenized heading hex + quality color states (shared `--color-quality-*` for score
  number AND property bars); score-card cohesion + read-more states; master-formula button demoted to
  secondary; shared `.formulator-input-sm`. SW → v15.

### ✅ Phase 0c + 0d — modal/drawer consistency + interaction primitives (Plan 06)
**Files:** `index.html`, `sw.js`. CSS/ARIA only — no behavior change.

- **0c:** dialog semantics (`role`/`aria-modal`/`aria-labelledby`) added to order-detail, manual-order,
  customer-drawer, score-drawer overlays; drawer shadows normalized to `--shadow-xl`; verified all modals
  share `motion-modal-in`/`motion-backdrop-in` entrance and drawers share `--motion-drawer` slide.
- **0d:** dev-pipeline cards gained hover elevation + `motion-rise` entrance (+ reduced-motion coverage);
  dev stage buttons got `:active` press; `.pd-back`/`.pd-thumb` transitions moved to motion tokens. SW v11→v12.
- **Phase 0 (foundation) complete.**

### ✅ Phase 0b — save/discard unsaved-changes guard (Plan 06)
**Files:** `index.html`, `sw.js`.

- Dirty-tracking system (`_dirtyForms` / `_watchDirty` / `_markFormClean`) on 6 edit modals: invoice,
  receipt, task, CRM contact, manual order, new product. Closing (X / Escape / backdrop) with unsaved
  edits now prompts "Unsaved changes — Discard / Keep editing" via `showConfirm`; save + delete paths
  bypass so they never prompt. Delegated listeners (covers dynamic line-items), attached once per overlay.
- **Adversarially QA'd by Halle:** all 6 modals verified end-to-end (save / discard / keep-editing / delete);
  no user-trap, no blocked/lost save, no false dirty-on-open, no listener stacking; shared CRM overlay
  gated to edit-mode only. Applied the P3 hardening (CRM guard also checks overlay `.open`). SW v10→v11.

### ✅ Phase 0a — reusable confirmation modal (Plan 06)
**Files:** `index.html`, `sw.js`. **Plan:** `docs/plans/06-app-wide-refinement.md`.

- Built `showConfirm(opts) → Promise<boolean>`: styled, bilingual dialog replacing all **18 native
  `confirm()`** browser dialogs. Destructive/danger red variant; Escape (capture-phase, won't close an
  underlying modal) + backdrop + focus-restore; re-entrancy-guarded resolve.
- All 18 sites converted to the async `.then(ok => { if(!ok) return; … })` pattern, incl. two non-trivial
  refactors (`deleteContactPermanently` return contract; replace-primary `doSave()` early-return).
- **Adversarially QA'd by Halle:** all 18 sites verified clean (action gated inside `.then`, no drop /
  no double-fire / no run-on-cancel); modal resolve/cleanup/Escape/focus verified. SW v9→v10.

## 2026-07-06

### ✅ App-wide "refine all pages" (3 sweeps) + adversarial QA
**Files:** `index.html`, `sw.js`. **Plan/audit:** `docs/qa/refine-all-pages-20260705.md`.

- Driven by a 5-page parallel read-only audit. Shipped safe, code-verifiable fixes in 3 sweeps:
  keyboard a11y on cards/rows/tiles/thumbs; long-text clamp/truncate; empty/error states + i18n of
  hardcoded English (17 keys); mobile scroll-wrappers for wide tables; `_yen()` ja-JP currency +
  right-align + ¥0 fix; fixed a duplicate `.product-card` block that was killing card motion;
  token cleanup; formulator alignment; order-detail badge parity; CRM tab lazy-render.
- Each sweep independently re-verified (syntax, innerHTML=0, i18n symmetry, brace balance, render targets).
- **Adversarial QA (Halle)** on the shipped diff: 7 highest-risk areas verified clean (incl. the CRM
  lazy-render control-flow change); found **1 real regression** — `_makeActivatable` keyboard handler
  double-fired when a nested link (e.g. View-in-CRM inside a row) was focused and Enter pressed.
  **Fixed** with a target guard (`if (e.target !== el) return`). SW cache v7→v9.

**Still NOT done: browser/runtime QA.** Static + adversarial code review are complete; nobody has
clicked through the deployed changes in a browser. Design-judgment items remain in the audit doc.

## 2026-07-05

### ✅ FIXED — product images not showing (root cause: missing sheet column)
**Where:** backend Google Sheet (`Products` tab), not code.
**Diagnosis:** queried the live Apps Script API directly — products returned 15 fields with NO `imageUrl`
(and no `lastSynced`). The sync computes `images[0].src` but writes rows by matching the sheet's header
columns; the `imageUrl` column was absent from the Products header, so the image was silently dropped every
sync. (SKU column exists but is empty — likely genuinely blank in Shopify; separate/minor.)
**Fix:** Taka added `imageUrl` + `lastSynced` header columns to the Products sheet, then Sync Now → primary
product photos now populate on the live app. No deploy needed.
**Follow-up:** the `ensureSheet` self-heal (in the undeployed backend) prevents this recurring. Full multi-image
gallery + rich fields still pending the backend/frontend deploy (Plan 05).

## 2026-07-04

### ✅ Shopify data expansion (richer sync) + catalogue fixes
**Files:** `apps-script.js` + `index.html`. **Plan:** `plans/05-shopify-data-expansion.md`.

- **Duplicate Soap/Candle sub-tabs fixed** — `classifyProduct` now normalizes soap/candle from SKU prefix OR
  `productType` (EN/JA); sub-tabs deduped by canonical category. (Was showing dead `Soap 0`/`Candle 0` next to
  real `Soap 10`/`Candle 6`.)
- **Expanded Shopify sync** — now pulls, per the schema contract, 10 new fields: `description` (body_html),
  `handle` (storefront link), `imageUrls` (full gallery), `productOptions`, `barcode`, `weight`, `weightUnit`,
  `variantOptions`, `inventoryPolicy`, and per-product `metafields` (throttled, try/catch, best-effort).
- **Products sheet extended** (append-only) with those 10 columns; **`ensureSheet` now self-heals** — appends
  missing header columns to an *existing* sheet (runs via `doGet`/`doPost`), so the schema addition lands on
  deploy without manual sheet edits.
- **Frontend surfacing** — cards use the gallery's first image (fallback to `imageUrl`); product detail gains
  Description (HTML→plain text, no innerHTML), image gallery, variant specs, metafields, and a "View on Shopify"
  link. Every new field optional/defensive.

**Verified:** both files node-check clean; 0 innerHTML; all i18n keys symmetric/resolve; ensureSheet append path
confirmed in the request flow.
⚠️ **Activation:** needs Apps Script **redeploy + a "Sync Now"** to populate. This is also the likely fix for the
empty product images (stale/old sync). **Confirm the storefront domain** — frontend guessed `https://ivycoast.co`
(`SHOPIFY_STORE_URL`); set it to the real public domain (or `""` to hide the link).

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

---

## 2026-07-11 — Phase A: Halle QA fixes (Noa)

Post-QA fixes applied after Halle's review of the Phase A bundle (PASS WITH WARNINGS — 0 critical):

- **H1 (High)**: `SHEETS_ENSURED_FLAG` bumped V1→V2 in apps-script.js — without the bump, existing
  deployments would never run the ensure pass, the new columns (Orders.contactId,
  Tasks.entityType/entityId) would never be created, and writes to them would be silently dropped.
- **M1**: invoice update error path now refetches (`fetchInvoices(true)`) so a backend-rejected edit
  can't linger on screen — matches receipt/task error behavior.
- **M2**: `fetchAllData` now MERGES products instead of clobbering — slim batchList rows (no
  description/metafields, stripped server-side for the cache) preserve detail fields from
  previously-loaded full rows.
- **L1**: `initFirebaseAuth()` guards `typeof firebase === "undefined"` (deferred SDK load failure)
  → visible `showLoginError` instead of a silent dead sign-in button.
- Also this bundle (Noa, pre-QA): all 12 backend POST helpers consolidated into shared `_postJson()`
  with a single 800ms retry on `{error:"busy, retry"}` (backend lock contention); the two inline
  order-create fetches routed through it too.

**Verified:** `node --check` passes on apps-script.js AND on the concatenated inline JS of index.html.
**Status:** working tree only — REVIEW ticket noa-20260711-phase-a; not committed, not deployed.
