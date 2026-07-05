# Plan 03 — Product Catalogue (evolve the Products tab)

**Status:** 📋 Planned (revised from "Soap Catalogue" — now covers ALL product types)
**Depends on:** Plan 02 (built i18n-aware). Reuses the shipped soap cost engine + formulator.
**Touches:** `index.html` (Products view rebuild + detail) and `apps-script.js` (new `ProductMeta` sheet).

---

## Problem

Products is a flat, Shopify-synced table (`renderProducts`) that lists **everything in the Shopify shop**
— soaps, candles, other products — in one hard-to-scan list. There's no place for **development
(R&D) products**, no **rich Hub-side metadata**, and no **version history** per product.

## Goal

Turn the Products tab into a real **Product Catalogue**: browse all products by type, hold rich
internal metadata, track in-development products through a pipeline, and see each product's version
history — while keeping Shopify as the source of truth for *live* commerce data.

---

## Current state (facts)

- **Products** = Shopify sync. Sheet columns: `id | shopifyProductId | shopifyVariantId | title |
  variantTitle | sku | price | compareAtPrice | inventoryQuantity | inventoryItemId | locationId |
  status | productType | vendor | tags | imageUrl | lastSynced`.
- UI: table with status/type/search filters, inline stock edit, `openProductDetailModal` (already
  shows linked soap **batch cards**).
- Classification signals already present: `productType`, `vendor`, SKU prefixes `SOP-` / `CND-`.

## Architecture — data layers

Keep Shopify authoritative for live products; **overlay** Hub enrichment so sync never clobbers it.

1. **Shopify Products** (existing) — live commerce data, synced. Never hand-edited.
2. **`ProductMeta`** (NEW Hub sheet) — enrichment keyed by `shopifyProductId` OR (for dev items) a
   Hub-generated id. Holds Hub-only fields AND stands alone for products not yet in Shopify.
   Proposed columns (appended-only):
   ```
   id | shopifyProductId | source | category | devStatus | line |
   nameEn | nameJa | marketingName | ingredientLabelJa |
   linkedFormulaId | costPerBar | finishedCostPerBar |
   targetLaunch | heroImageUrl | internalNotes | versions | createdAt | updatedAt
   ```
   - `source`: `shopify` (live, enriched) | `hub` (development, not in Shopify yet)
   - `devStatus`: `concept | in-development | testing | ready | launched` (blank for plain live items)
   - `linkedFormulaId`: ties a soap/candle to its formula (SoapBatches master / future candle sheet)
   - `versions`: JSON array of history entries (see below) — or a separate `ProductVersions` sheet if
     it grows (build-time call; lean JSON first).
3. **Merged view model** — the catalogue renders `Shopify ∪ Hub-dev`, each Shopify product left-joined
   to its `ProductMeta` row. Dev products appear only from `ProductMeta`.

## UI — information architecture

### Catalogue surface (Products tab)
- **Category sub-tabs / segmented control:** `All · Soap · Candle · <other Shopify types…> · In Development`.
  Auto-built from `productType` + SKU prefix; "In Development" = `ProductMeta.source=hub` (+ any live
  product flagged in-dev).
- **View toggle: Table ⇄ Grid.** Grid = image cards (catalogue feel); Table = current power view.
- Keep status/search filters; add a `vendor` filter (our products vs resale).
- Counts per sub-tab; empty/loading states.

### Product detail (upgrade `openProductDetailModal` → tabbed detail drawer/modal)
Tabs:
1. **Overview** — image, names (EN/JA/marketing), type/line, price, stock, vendor, status, cost
   (from formula), internal notes.
2. **Formula / Recipe** — for soap/candle: the linked formula + "Open in Calculator". (Ingredient
   names/recipe = content, not translated.)
3. **Versions** — the version-history timeline (below); view/compare a previous version.
4. **Batches** — linked production batches + total made (Σ bars) — reuse existing batch-card code.
5. **Inventory** — stock, variants, Shopify link.

## Development-product tracking

- Add products that live only in the Hub (`source=hub`), moving through
  `Concept → In Development → Testing → Ready → Launched`.
- A dev soap/candle links to its formula; costs flow from the formulator.
- On real launch, "graduate": attach `shopifyProductId`, flip `devStatus=launched`, keep the history.
- Surfaced under the **In Development** sub-tab + a small pipeline/kanban option later.

## Version history (per product)

- On each meaningful change, append `{date, type, summary, snapshot, by}` to `ProductMeta.versions`
  (`type` = recipe | price | packaging | label | image | status).
- Detail → **Versions** tab shows the timeline; selecting an entry shows that snapshot (and a diff vs
  current for recipes — reuse the formulator's oil-diff rendering).
- **Seed:** soap recipe/cost history backfilled from the workbook's 2024 → 2026 tabs; going forward,
  formulator saves + catalogue edits append automatically.

---

## Iterating on new versions + estimation (product as workspace)

The product detail is where you build the *next* version and estimate its economics before committing.

- **"New version"** button (Formula/Versions tab) opens the **scoped calculator** seeded with the
  product's current formula.
- Live estimates while editing:
  - **Cost** — ingredient/packaging/finished per unit (shipped cost engine).
  - **Size / yield** — target unit weight (e.g. 130 g bar) ↔ unit count from total batch weight, plus
    total material needed. (New: an explicit unit-weight ⇄ yield control in the calculator; today it
    only has "bars produced".)
  - **Quality/property delta** — new version's properties/score vs the current version, side by side.
- **Save** → appends a version-timeline entry, then choose: **set as current formula** or **keep as a
  draft** (`devStatus=testing`) until validated. Ties directly into the dev pipeline.

## Scoped (product-bound) calculator — "focused mode"

The formulator runs in two modes; the difference is a `scopeProductId` passed in when launched.

- **Global mode** (via Tools) — full tool, all presets, free exploration, batch history. Unchanged.
- **Scoped mode** (launched from a product) — **locked to that product**:
  - Header banner: `Editing: <product> — v<n> (draft)`.
  - **Preset / recipe-load dropdown hidden** → cannot load or overwrite another soap's formula.
  - **Save target = this product only** (new version / update this product's master formula).
  - A skimmed layout: recipe builder + results + save-as-version; no global batch/preset chrome.
- Guardrail rationale: prevents the exact footgun of editing one soap and accidentally clobbering
  another's formula while the tool is open.

## Compare view — multi-select, side-by-side

- Catalogue (grid or table) gets **selection checkboxes** + "select all in this sub-tab" (e.g. all soaps).
- **Compare** action opens a side-by-side matrix: **columns = selected products**, **rows =**
  - Image + name (EN/JA/marketing)
  - Cost breakdown (ingredient / packaging / finished per unit)
  - Full ingredient list (oils + additives)
  - Quality score + the 7 properties
  - **Reviews** — aggregated from linked `SoapBatches.actualResults` (hardness/lather/conditioning/
    scent/overall ratings + feedback)
  - **Personal notes** — `ProductMeta.internalNotes`
- Horizontally scrollable for many selections; export/print later. Works from the grid view.

## New product development (NPD) lifecycle

NPD is not a separate silo — it's the catalogue viewed through a development lens. Home = the
**In Development** sub-tab, best rendered as a **pipeline / kanban board** grouped by `devStatus`.

**Stages & what happens at each:**

1. **Concept** — **"+ New product"**: category (soap/candle/other) + name + brief + target
   (market, launch window). Creates a `ProductMeta` row (`source=hub`, `devStatus=concept`). No Shopify.
2. **In Development** — attach a formula: build from scratch in the **scoped calculator**, or **clone an
   existing product** as a starting point. Live cost + size/yield estimates.
3. **Testing** — log **test batches** (SoapBatches) against the product; capture reviews
   (`actualResults`); iterate — each iteration = a new **version** in the timeline.
4. **Ready** — finalize 成分 label, packaging cost, pricing, images.
5. **Launched** — create/link the Shopify product and **graduate**: attach `shopifyProductId`, set
   `devStatus=launched`, keep the full development history.

**Stage gates (light, advisory):** e.g. cannot move to *Ready* without a saved formula + cost + label;
cannot *Launch* without a linked Shopify product. Gates warn, don't hard-block (build-time tuning).

**Reuses:** scoped calculator (build/iterate), version timeline (history), compare view (evaluate vs
existing line), batch reviews (validation). Clone-to-new seeds a concept from any existing product.

## Implementation checklist (after sign-off)

- [ ] `apps-script.js`: add `ProductMeta` sheet (ensureSheet + read/write + key maps + sync-safe merge).
- [ ] Seed `ProductMeta` for known Ivycoast soaps (names, labels, line, formula links, backfilled versions).
- [ ] Products view: sub-tabs + Table/Grid toggle + vendor filter + counts (createElement only).
- [ ] Grid card renderer; keep/refactor table renderer.
- [ ] Tabbed product detail (Overview / Formula / Versions / Batches / Inventory).
- [ ] **Scoped calculator mode** (`scopeProductId`): hide preset loader, retarget save to the product,
      scope banner, unit-weight ⇄ yield estimation.
- [ ] **"New version" flow** from product → scoped calc → version entry (set-as-current vs keep-draft).
- [ ] **Multi-select + Compare matrix** (cost / ingredients / properties / reviews / notes; select-all).
- [ ] **NPD:** "+ New product" concept flow + In-Development **kanban board** + stage gates +
      clone-to-new + launch/graduate to Shopify.
- [ ] Version-history append + timeline + snapshot/diff view.
- [ ] "Open in Calculator" wiring; total-made aggregation from SoapBatches.
- [ ] i18n keys for all chrome; product/recipe/label content NOT translated.

## Decisions (locked)

1. **Enrichment overlay** — YES, `ProductMeta` overlay: enriches live Shopify products + holds
   standalone Hub dev products. Shopify stays authoritative; sync never wipes Hub data.
2. **Default catalogue view** — **Grid of image cards** (Table available via toggle).
3. **Dev-product pipeline** — `Concept → In Development → Testing → Ready → Launched`.
4. **Version history scope** — **everything, unified timeline**: recipe/formula changes AND
   product-record changes (price, packaging, label, image, status).

## Open questions (for build time)

- Confirm the live vs in-development lineup when we seed `ProductMeta`.
- `versions` as a JSON column vs a separate `ProductVersions` sheet (lean JSON first; revisit if large).

## Test plan

- Sub-tabs group products correctly; Grid/Table toggle both render; counts accurate.
- Shopify sync does NOT wipe `ProductMeta` enrichment.
- Dev product creates, moves through pipeline, graduates to a live product keeping history.
- Version timeline shows backfilled soap history; new edits append; snapshot/diff renders.
