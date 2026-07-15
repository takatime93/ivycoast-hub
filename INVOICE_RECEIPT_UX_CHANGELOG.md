# Invoice & Receipt Builder — UX Changes Changelog

**Date**: 2026-03-17
**File changed**: `index.html` (571 insertions, 22 deletions)
**Scope**: Invoice modal + Receipt modal builder forms only. No changes to PDF output, preview, data models, backend, pricing logic, or status workflow.

---

## What Changed

### 1. Searchable Contact Dropdown (replaces plain `<select>`)

**Problem it solves**: The "Vendor / Contact" field was a plain `<select>` dropdown. With a growing CRM, scrolling through a long list to find a contact was slow and had no search capability.

**What was done**:

- **Invoice modal**: Replaced `<select id="inv-modal-contact">` with a text input (`inv-contact-search`) + a hidden input that still carries the `inv-modal-contact` id so all existing JS that reads `.value` from it continues to work unchanged.
- **Receipt modal**: Same replacement for `<select id="rec-from-contact">` → searchable input (`rec-contact-search`) + hidden input.
- The dropdown renders two sections:
  - **"Recent"** — last 5 contacts used in invoices (derived from the `invoices` array sorted by `updatedAt`)
  - **"All Contacts"** — full CRM list, filtered live as user types (matches on name, company, email)
- Each row shows: contact name, company (secondary line), and a W/C badge with the saved pricing percentage if one exists
- `+ New Contact` is always visible at the bottom — triggers the existing inline new-contact form
- Keyboard navigation: Arrow Up/Down, Enter to select, Escape to close
- Clear button (×) resets the selection
- On select, the existing `onInvoiceContactChange()` / `onRecFromContactChange()` fires — all auto-fill and pricing party logic is untouched

**Downstream fix**: `populateRecSourceDropdowns()` was updated to skip populating the receipt contact `<select>` (since it no longer exists as a `<select>`). It now just resets the hidden input and clears the search text. `onRecFromOrderChange()` and `onRecFromInvoiceChange()` were updated to also clear the search input text when they reset the contact field.

### 2. Quick Add Product Panel (collapsible, above line items)

**Problem it solves**: Users had to type into the description field and search one product at a time. No way to see available products at a glance or quickly add frequently used ones.

**What was done**:

- **Invoice modal**: Added a collapsible panel between the "Line Items" label and the line items table. Toggle button reads "Quick Add ▾".
- **Receipt modal**: Same panel added in the same position.
- Panel contains two sections:
  - **"Recent"** — last 5 products used across invoices (derived from `invoices` items JSON matched against `shopifyProducts`)
  - **"All Products"** — every Shopify product as a clickable chip showing product name + ¥price
- Clicking a chip calls the existing `addInvoiceLineItem(title, 1, price)` / `addReceiptLineItem(title, 1, price)` — adds a table row with qty=1 pre-filled
- Panel is collapsed by default (doesn't increase modal height until user clicks toggle)
- Panel re-renders fresh each time it's opened (picks up latest recent products)
- The existing autocomplete in the description field is completely untouched

---

## What Was NOT Changed

- PDF generation (`downloadInvoicePdf`, `downloadReceiptPdf`)
- Preview rendering (`previewInvoice`, `previewReceipt`)
- Data models (Invoice, Receipt, LineItem, PricingParty) — no new fields
- Backend API / Google Sheets columns
- Pricing calculation logic (`calcPricingSummary`, `recalcInvoiceTotals`, etc.)
- Status workflow (draft → sent → paid → auto-receipt)
- Address fields, pricing parties section, totals section
- Invoice/receipt document layout and content
- No SKU fields (not in our system yet)

---

## New CSS Classes Added (~line 2163)

| Class | Purpose |
|---|---|
| `.inv-contact-search-wrap` | Wrapper for search input + dropdown (position: relative) |
| `.inv-contact-search-input` | The text input field (padding-left for search icon) |
| `.inv-contact-search-icon` | Magnifying glass icon positioned inside input |
| `.inv-contact-search-clear` | × clear button (hidden until input has value) |
| `.inv-contact-dropdown` | Positioned dropdown container (max-height 280px, scrollable) |
| `.inv-contact-group-label` | Section headers ("Recent", "All Contacts", "Results") |
| `.inv-contact-option` | Each contact row (flex, with gap for badge) |
| `.inv-contact-option-info` | Name + company text container |
| `.inv-contact-option-name` | Contact name (500 weight, ellipsis overflow) |
| `.inv-contact-option-company` | Company name (secondary text) |
| `.inv-contact-badge` | W/C pricing badge (+ `.wholesale` and `.consignment` variants) |
| `.inv-contact-option-new` | "+ New Contact" row at bottom |
| `.inv-quick-add-wrap` | Wrapper containing label + toggle + panel |
| `.inv-quick-add-toggle` | "Quick Add ▾" button |
| `.inv-quick-add-panel` | Collapsible panel (display:none until `.open`) |
| `.inv-quick-add-section-label` | Section headers ("Recent", "All Products") |
| `.inv-quick-add-chips` | Flex-wrap chip container |
| `.inv-quick-add-chip` | Individual product chip button |
| `.inv-quick-add-chip-price` | ¥price text inside chip |

---

## New JS Functions Added (~line 16808)

| Function | Purpose |
|---|---|
| `getRecentInvoiceContacts(limit)` | Returns last N contacts from `invoices` array (sorted by updatedAt) |
| `renderContactDropdownItems(dropdown, contacts, groupLabel, activeIndex, startIndex, onSelect)` | Renders a group of contact options into the dropdown DOM |
| `initContactSearch(config)` | Generic searchable dropdown initializer. Takes `{inputId, clearBtnId, dropdownId, hiddenId, onSelect}`. Attaches focus/input/blur/keydown listeners. |
| `initInvContactSearch()` | Calls `initContactSearch` with invoice-specific element IDs |
| `initRecContactSearch()` | Calls `initContactSearch` with receipt-specific element IDs |
| `getRecentProducts(limit)` | Returns last N products from `invoices` items JSON matched against `shopifyProducts` |
| `renderQuickAddPanel(panelId, addFn)` | Renders recent + all product chips into the panel. Each chip calls `addFn(title, 1, price)` on click. |
| `toggleInvQuickAdd()` | Toggles invoice quick-add panel open/closed |
| `toggleRecQuickAdd()` | Toggles receipt quick-add panel open/closed |

---

## HTML Structure Changes

### Invoice Modal (was ~line 5913)

**Before**:
```html
<label for="inv-modal-contact">Vendor / Contact</label>
<select id="inv-modal-contact" onchange="onInvoiceContactChange()">
  <option value="">-- Select Contact --</option>
</select>
```

**After**:
```html
<label for="inv-contact-search">Vendor / Contact</label>
<div class="inv-contact-search-wrap" id="inv-contact-search-wrap">
  <span class="inv-contact-search-icon"><i class="fa-light fa-magnifying-glass"></i></span>
  <input type="text" id="inv-contact-search" class="inv-contact-search-input" placeholder="Search contacts..." autocomplete="off">
  <button type="button" class="inv-contact-search-clear" id="inv-contact-search-clear">&times;</button>
  <input type="hidden" id="inv-modal-contact" value="">
  <div class="inv-contact-dropdown" id="inv-contact-dropdown"></div>
</div>
```

### Invoice Line Items (was ~line 5993)

**Before**:
```html
<label>Line Items</label>
<table class="inv-line-items">...
```

**After**:
```html
<div class="inv-quick-add-wrap" id="inv-quick-add-wrap">
  <label>Line Items</label>
  <button type="button" class="inv-quick-add-toggle" id="inv-quick-add-toggle" onclick="toggleInvQuickAdd()">Quick Add <span id="inv-quick-add-arrow">&#9662;</span></button>
  <div class="inv-quick-add-panel" id="inv-quick-add-panel"></div>
</div>
<table class="inv-line-items">...
```

### Receipt Modal — same pattern applied:
- `<select id="rec-from-contact">` → searchable input + hidden input
- `<label>Line Items</label>` → wrapped in quick-add panel with `rec-` prefixed IDs

---

## Modified Existing Functions

| Function | What changed |
|---|---|
| `openInvoiceCreateModal()` | Added: `initInvContactSearch()` call, reset search input + clear button, reset quick-add panel |
| `openInvoiceEditModal(invId)` | Added: `initInvContactSearch()` call, set search input to show selected contact name, reset quick-add panel |
| `openReceiptCreateModal()` | Added: `initRecContactSearch()` call, reset search input + clear button, reset quick-add panel |
| `openReceiptEditModal(recId)` | Added: `initRecContactSearch()` call, reset quick-add panel |
| `populateRecSourceDropdowns()` | Removed: contact `<select>` population (12 lines). Replaced with: reset hidden input + clear search text (3 lines) |
| `onRecFromInvoiceChange()` | Added: 1 line to clear `rec-contact-search` input text |
| `onRecFromOrderChange()` | Added: 1 line to clear `rec-contact-search` input text |

---

## How It Works (for testing)

1. **Contact search**: Open invoice/receipt modal → click "Vendor / Contact" field → dropdown opens showing "Recent" contacts (if any invoices exist) then "All Contacts". Type to filter. Arrow keys + Enter to select. × to clear.
2. **Quick Add**: Open invoice/receipt modal → click "Quick Add ▾" button above the line items table → panel expands showing "Recent" product chips and "All Products" chips. Click any chip → adds a line item row with qty=1 and the product's price pre-filled. Click "Quick Add ▴" to collapse.
3. **Backward compatibility**: The hidden `<input id="inv-modal-contact">` still holds the selected contact ID exactly like the old `<select>` did. All downstream code (`onInvoiceContactChange`, `saveInvoice`, etc.) reads `.value` from it and works identically.
