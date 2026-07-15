# Invoice & Receipt Creation — Wizard Flow Spec

**Status**: Draft for review
**Scope**: Invoice modal + Receipt modal in `index.html`
**Constraint**: No changes to PDF output, data models, backend API, or document design. Wizard reuses all existing functions — it's a UI layer on top of them.

---

## Goal

Add an optional **guided wizard** inside the existing invoice/receipt modal. When the modal opens, the user picks between "Full Form" (the current layout) or "Guided" (a step-by-step flow that shows less information at a time). The wizard walks through 4 steps, collecting one decision per step, then lands on a pre-filled form for final review.

---

## Entry Point (Step 0 — Mode Selection)

When `openInvoiceCreateModal()` or `openReceiptCreateModal()` is called, the modal opens to a **mode selection screen** instead of jumping straight into the form.

```
┌─────────────────────────────────────┐
│          New Invoice                │
│                                     │
│   How would you like to create?     │
│                                     │
│   ┌─────────────┐ ┌──────────────┐  │
│   │  📝 Full    │ │  🧭 Guided  │  │
│   │   Form      │ │   Wizard    │  │
│   │             │ │             │  │
│   │  All fields │ │  Step by    │  │
│   │  at once    │ │  step       │  │
│   └─────────────┘ └──────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

- **Full Form**: Hides the mode selection, shows the existing form exactly as it is today. No behavior change.
- **Guided Wizard**: Hides the mode selection, shows Step 1 of the wizard.

**For edit modals** (`openInvoiceEditModal`, `openReceiptEditModal`): Skip mode selection entirely — always open the full form. The wizard is only for creation.

**For "Create from Order"** entry points (`createInvoiceFromOrder`, `createReceiptFromOrder`): Skip mode selection and Step 1/2 — jump directly to Step 3 with the order pre-selected, since the order context is already known.

---

## Step 1 — Choose Contact

```
┌─────────────────────────────────────┐
│  Step 1 of 4 · Contact              │
│  ─────────────────────────────────  │
│                                     │
│  Who is this for?                   │
│                                     │
│  🔍 Search contacts...              │
│  ┌─────────────────────────────┐    │
│  │ RECENT                      │    │
│  │ Northshore Cafe (Vendor) C30│    │
│  │ Tsutaya Books (Vendor) W25  │    │
│  │                             │    │
│  │ ALL CONTACTS                │    │
│  │ Daikanyama T-Site ...       │    │
│  │ ...                         │    │
│  │                             │    │
│  │ + New Contact               │    │
│  └─────────────────────────────┘    │
│                                     │
│                        [Next →]     │
└─────────────────────────────────────┘
```

- Uses the same searchable contact dropdown component (from the recent UX changes)
- Selecting a contact auto-fills: company, email, address, pricing parties (same as `onInvoiceContactChange` / `onRecFromContactChange`)
- Selecting "+ New Contact" shows the inline name/type/company/email fields within this step
- "Next →" is disabled until a contact is selected or new contact fields are filled
- "← Back" returns to mode selection

**For receipts**: Same layout. Label says "Who is this receipt for?"

---

## Step 2 — Choose Source

```
┌─────────────────────────────────────┐
│  Step 2 of 4 · Items                │
│  ─────────────────────────────────  │
│                                     │
│  How do you want to add items?      │
│                                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ 📦 From an   │ │ ✏️ Add      │  │
│  │    Order     │ │   Manually  │  │
│  │              │ │             │  │
│  │ Pull items   │ │ Type in     │  │
│  │ from a       │ │ products    │  │
│  │ Shopify      │ │ yourself    │  │
│  │ order        │ │             │  │
│  └──────────────┘ └──────────────┘  │
│                                     │
│  [← Back]                           │
└─────────────────────────────────────┘
```

- **From an Order**: Proceeds to Step 2a (order selection)
- **Add Manually**: Skips to Step 3 (product entry) with an empty line items table

---

## Step 2a — Select Order (only if "From an Order" was chosen)

```
┌─────────────────────────────────────┐
│  Step 2 of 4 · Select Order         │
│  ─────────────────────────────────  │
│                                     │
│  Which order?                       │
│                                     │
│  🔍 Search orders...                │
│  ┌─────────────────────────────┐    │
│  │ #1042 — Northshore  ¥128,400│    │
│  │ #1041 — Tsutaya     ¥85,600 │    │
│  │ #1040 — Daikanyama  ¥42,800 │    │
│  │ ...                         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 💡 Order not listed?        │   │
│  │    Create a manual order →   │   │
│  └──────────────────────────────┘   │
│                                     │
│  [← Back]              [Next →]     │
└─────────────────────────────────────┘
```

- Shows existing Shopify orders from `shopifyOrders` array (same data as the current "From Order" dropdown)
- Each row shows: order number, customer name, total, financial status
- Selecting an order auto-populates all line items (calls existing `populateInvFromOrder` / equivalent receipt logic)
- If the order's customer email matches a CRM contact, overrides the Step 1 contact selection with that match (with a note: "Contact updated to match order")
- **"Create a manual order →"** link: Opens the existing manual order creation flow in a separate modal. After the manual order is saved and appears in the orders list, user returns here and can select it. *(This uses the existing manual order feature — no new functionality needed.)*
- "Next →" proceeds to Step 3

---

## Step 3 — Review & Adjust Items

```
┌──────────────────────────────────────────┐
│  Step 3 of 4 · Review Items              │
│  ──────────────────────────────────────  │
│                                          │
│  For: Northshore Cafe                    │
│  Source: Order #1042                     │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Description      Qty  Price  Amt │    │
│  │ ──────────────────────────────── │    │
│  │ Hinoki Soap 80g   3  ¥2,800  ¥8,│    │
│  │ Yuzu Candle 120g  2  ¥3,200  ¥6,│    │
│  │ Gift Set A        1  ¥5,800  ¥5,│    │
│  │                                  │    │
│  │ + Add Line Item                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Quick Add:                              │
│  [Hinoki Soap ¥2,800] [Yuzu Candle ¥3,2]│
│                                          │
│  Subtotal              ¥20,400           │
│                                          │
│  [← Back]                    [Next →]    │
└──────────────────────────────────────────┘
```

- If source was an order: items are pre-filled (user can edit qty, remove rows, or add more)
- If source was manual: starts with one empty row + the Quick Add product chips (from the recent UX changes)
- Line items table uses the existing `addInvoiceLineItem` / `addReceiptLineItem` functions
- Shows a running subtotal at the bottom
- Applied Price / Net Amount columns appear only if pricing parties exist (from Step 1 contact)
- "Next →" requires at least one line item with a description

---

## Step 4 — Final Details

```
┌──────────────────────────────────────────┐
│  Step 4 of 4 · Details                   │
│  ──────────────────────────────────────  │
│                                          │
│  Invoice #INV-2026-004                   │
│  Date: 2026-03-20                        │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Due Date    [          ] (opt)   │    │
│  │ PO / Ref    [          ] (opt)   │    │
│  │ Workspace   [IVYCOAST ▾]        │    │
│  │ Status      [Draft ▾]           │    │
│  │ Tax         [10% included ▾]    │    │
│  │ Discount    [0        ]         │    │
│  │ Shipping    [0        ]         │    │
│  │ Notes       [                 ] │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ────────────────────────────────────    │
│  Subtotal         ¥20,400                │
│  Tax              ¥0 (included)          │
│  Total            ¥20,400                │
│  ────────────────────────────────────    │
│                                          │
│  [← Back]    [Preview]    [Save]         │
└──────────────────────────────────────────┘
```

- Invoice number and date are auto-generated (same as current behavior)
- Shows only the remaining fields that weren't covered in earlier steps
- Totals section at the bottom recalculates live (uses existing `recalcInvoiceTotals` / `recalcReceiptTotals`)
- **"Preview"** opens the existing split preview / full preview
- **"Save"** calls the existing `saveInvoice()` / `saveReceipt()` — all validation and backend logic unchanged
- **"← Back"** returns to Step 3 (items are preserved)

**For receipts**: Same layout minus Status field and Due Date. Receipt number format REC-YYYY-NNN. Receipt date instead of invoice date.

---

## Step Indicator

A simple progress bar across the top of the wizard area:

```
  ● ─── ● ─── ○ ─── ○
  Contact Items Review Details
```

- Filled circles for completed steps, current step highlighted, empty circles for upcoming
- Clicking a completed step navigates back to it (preserving all entered data)
- Steps should not be forward-skippable (must complete in order)

---

## State Management

The wizard doesn't need new data storage. It works by:

1. Collecting choices in temporary JS variables during the wizard flow
2. On "Save" at Step 4, populating the existing hidden form fields and calling the existing `saveInvoice()` / `saveReceipt()`

Wizard state object (temporary, lives only during modal open):

```
wizardState = {
  mode: "guided",          // "guided" or "full"
  docType: "invoice",      // "invoice" or "receipt"
  step: 1,                 // 1-4
  contactId: "",           // selected CRM contact ID or "__new__"
  newContact: {},          // {name, type, company, email} if new
  source: "",              // "order" or "manual"
  orderId: "",             // selected order ID (if source=order)
  items: [],               // [{description, qty, unitPrice}]
  // Step 4 fields stored directly in form inputs
}
```

On "Save", the wizard writes all state into the existing form elements (`inv-modal-contact`, `inv-modal-company`, line items tbody, etc.) and calls `saveInvoice()` / `saveReceipt()` as-is.

---

## Implementation Notes

### HTML structure

The wizard steps should be `<div>` containers inside the existing modal, shown/hidden based on current step. The existing form fields remain in the DOM (hidden during wizard mode) so `saveInvoice()` / `saveReceipt()` can read from them at the end.

```html
<!-- Inside inv-modal, before the existing form fields -->
<div id="inv-wizard-mode-select" style="display:none">...</div>
<div id="inv-wizard-step1" style="display:none">...</div>
<div id="inv-wizard-step2" style="display:none">...</div>
<div id="inv-wizard-step2a" style="display:none">...</div>
<div id="inv-wizard-step3" style="display:none">...</div>
<div id="inv-wizard-step4" style="display:none">...</div>

<!-- Existing form (id="inv-split-editor" contents) hidden during wizard -->
```

### Functions to reuse (do NOT rewrite)

| Existing function | Used in wizard step |
|---|---|
| `populateInvoiceContactDropdown()` | Step 1 (contact list data) |
| `onInvoiceContactChange()` | Step 1 (auto-fill on select) |
| `initInvContactSearch()` | Step 1 (searchable dropdown) |
| `populateInvFromOrder(order)` | Step 2a (auto-fill from order) |
| `addInvoiceLineItem(desc, qty, price)` | Step 3 (add line item rows) |
| `renderQuickAddPanel(panelId, addFn)` | Step 3 (quick add chips) |
| `recalcInvoiceTotals()` | Step 4 (totals calculation) |
| `saveInvoice()` | Step 4 (save to backend) |
| `previewInvoice()` | Step 4 (preview) |
| `generateInvoiceNumber()` | Step 4 (auto-number) |
| Same pattern for receipt equivalents | |

### Functions to create (new)

| New function | Purpose |
|---|---|
| `initInvWizard()` | Show mode selection screen, attach handlers |
| `invWizardNext()` | Advance to next step (validate current step first) |
| `invWizardBack()` | Go back one step (preserve entered data) |
| `invWizardGoToStep(n)` | Navigate to a specific step (for progress indicator clicks) |
| `invWizardFinalize()` | Write wizard state into form fields, then call `saveInvoice()` |
| `renderWizardStepIndicator(current, total)` | Update the progress dots |
| Same pattern with `rec` prefix for receipts | |

### CSS classes to add

| Class | Purpose |
|---|---|
| `.inv-wizard-mode-cards` | Flex container for Full Form / Guided cards |
| `.inv-wizard-mode-card` | Each mode option card |
| `.inv-wizard-step` | Generic step container (padding, min-height) |
| `.inv-wizard-step-header` | "Step N of 4 · Label" text |
| `.inv-wizard-step-question` | "Who is this for?" prompt text |
| `.inv-wizard-progress` | Progress indicator bar container |
| `.inv-wizard-progress-dot` | Individual step dot (filled/empty/active states) |
| `.inv-wizard-progress-line` | Connecting line between dots |
| `.inv-wizard-actions` | Bottom button bar (Back / Next / Save) |
| `.inv-wizard-source-cards` | Flex container for Order / Manual cards (Step 2) |
| `.inv-wizard-source-card` | Each source option card |
| `.inv-wizard-summary-line` | "For: Northshore Cafe" context line |
| `.inv-wizard-hint` | "Order not listed?" hint box |

---

## What Does NOT Change

- `saveInvoice()` / `saveReceipt()` — untouched (wizard populates the same fields)
- PDF generation — untouched
- Preview rendering — untouched
- Data models — no new fields
- Backend API — no new endpoints
- Edit modal flow — always opens full form
- "Create from Order" entry point — skips to Step 3 with order pre-selected
- Auto-receipt on paid invoice — untouched
- Pricing parties logic — untouched (auto-added from contact in Step 1)

---

## Open Questions

1. **Should "Full Form" be the default for returning users?** Could store a preference in localStorage so users who always pick Full Form don't see the mode selection after the first time.
2. **Step 2 "Create manual order" link**: This currently opens a separate modal. Should the wizard pause and resume after the manual order is created, or should we show a simpler inline form?
3. **Pricing parties step**: Currently pricing parties auto-load from the contact. Should there be an explicit step for reviewing/editing pricing parties, or is the auto-load sufficient for the guided flow?
