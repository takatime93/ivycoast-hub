# Plan 05 — Shopify Data Expansion (richer product sync)

**Status:** 📋 Planned → building
**Touches:** `apps-script.js` (sync + Products sheet columns) + `index.html` (surface in cards/detail).
**Trigger:** catalogue felt thin; Shopify holds far more than the current 8-field sync pulls.

---

## Current sync (minimal)
`products.json` `fields=id,title,variants,status,product_type,vendor,tags,images`, first image only.
Per-variant rows: shopifyProductId, shopifyVariantId, title, variantTitle, sku, price, compareAtPrice,
inventoryQuantity, inventoryItemId, locationId, status, productType, vendor, tags, imageUrl, lastSynced.

## New data to pull (all four, per Taka)
1. **Full image gallery** — all images, not just `images[0]`.
2. **Descriptions + storefront link** — `body_html` + `handle` (→ live product URL).
3. **Variant specs** — `barcode`, `weight`, `weight_unit`, option axes, `inventory_policy`.
4. **Metafields** — per-product `metafields.json` (custom data: ingredients, scent notes, etc.).

## Schema contract — NEW Products columns (APPENDED at end, after `lastSynced`)
Append-only (never reorder existing columns — CLAUDE.md rule). New columns:
```
description | handle | imageUrls | productOptions | barcode | weight | weightUnit | variantOptions | inventoryPolicy | metafields
```
- `description` = `p.body_html` (HTML string — frontend renders as PLAIN TEXT via tag-strip + textContent; NEVER innerHTML).
- `handle` = `p.handle` (storefront URL = `<STORE_URL>/products/<handle>`).
- `imageUrls` = JSON array of all `p.images[].src`.
- `productOptions` = JSON of `p.options[].name` (e.g. ["Size","Scent"]).
- `barcode`, `weight`, `weightUnit` = variant-level (`v.barcode`, `v.weight`, `v.weight_unit`).
- `variantOptions` = JSON `{option1,option2,option3}` for this variant.
- `inventoryPolicy` = `v.inventory_policy`.
- `metafields` = JSON map `"namespace.key": value` from `/products/<id>/metafields.json` (one call per product; fine at ~27 products; throttle gently, wrap in try/catch so a metafield failure never breaks the sync).

## Backend (`apps-script.js`)
- Expand `fields` to include `body_html,handle,options` (images/variants already requested).
- Map the new product- and variant-level fields (denormalized onto each variant row, like `title`/`imageUrl` today).
- Add a per-product metafields fetch (throttled, try/catch, best-effort).
- Extend `ensureSheet("Products", [...])` header with the appended columns.
- Defensive: existing rows without new columns → treated as empty until next full sync.

## Frontend (`index.html`)
- **Cards:** use `imageUrls[0]` (fallback to `imageUrl`) so the gallery's first image shows; keep graceful placeholder.
- **Detail modal/drawer:** description (plain-text), image gallery (thumbnails), variant specs table (barcode/weight/options), metafields list, and a "View on Shopify" storefront link.
- **Defensive:** every new field optional — absent → hidden, never throws (works before backend redeploy).

## ⚠️ Activation requirements
- Needs the **Apps Script redeployed** + a **full "Sync Now"** to populate the new columns.
- Until then the new fields are empty and the UI degrades gracefully (no images/description shown, no crash).
- This is also the likely reason images look empty today: a stale/old sync. A fresh sync on the new backend
  should populate `imageUrls`/`imageUrl`.

## Verify
- `node --check apps-script.js` and `index.html` extracted JS pass.
- 0 innerHTML (description rendered via tag-strip + textContent).
- Frontend degrades gracefully when new fields absent.
