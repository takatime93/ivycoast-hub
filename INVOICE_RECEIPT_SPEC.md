# Invoice & Receipt System — UI, UX, Logic & Component Spec

This document covers the full invoice and receipt creation system in Ivycoast Hub. It is intended as a handoff document for another developer to work on improvements, bug fixes, or new features in this area.

**Stack**: Single-page HTML app, vanilla JS (no framework), Google Sheets backend via Apps Script, jsPDF for PDF generation.

**Security constraint**: No `innerHTML` — all DOM must use `createElement`/`textContent`/`appendChild`.

---

## 1. Overview

The invoice/receipt system allows Ivycoast to:
- Create invoices for vendors/partners (consignment settlements, wholesale orders)
- Generate receipts (auto-created when invoice is marked "paid", or manually)
- Link invoices to Shopify orders
- Link invoices to CRM vendors/contacts
- Apply pricing splits (consignment %, wholesale %)
- Generate PDF documents (bilingual JP/EN)
- Preview documents in a split-pane editor

---

## 2. Use Cases

### UC1: Create invoice for a consignment partner
1. User opens CRM → clicks vendor → sees "Invoices" section
2. Clicks "Create Invoice" or opens invoice modal
3. Selects vendor from contact dropdown → auto-fills company, email, address
4. System auto-adds a pricing party row with vendor's saved consignment % (e.g., 30%)
5. User adds product line items (autocomplete from Shopify products)
6. System calculates: applied price = unit price × (100 - 30%) / 100
7. User sets status to "sent", saves
8. Downloads PDF to send to vendor

### UC2: Create invoice from a Shopify order
1. User opens Orders tab → clicks an order → clicks "Create Invoice"
2. System pre-fills: order number, customer name, email, line items from order
3. If customer email matches a CRM contact → auto-selects contact, loads pricing
4. User reviews, adjusts if needed, saves
5. If order was already paid → status set to "paid" → receipt auto-created

### UC3: Auto-create receipt when invoice is paid
1. User opens existing invoice → changes status to "paid" → saves
2. System checks if receipt already exists for this invoice (prevents duplicates)
3. If no receipt exists → auto-creates receipt with all invoice data copied
4. Receipt appears in Documents tab with link to original invoice

### UC4: Create receipt from an order directly
1. User opens Orders tab → clicks order → clicks "Create Receipt"
2. System pre-fills customer info from order
3. User adds line items manually (no auto-copy from order items)
4. Saves receipt

### UC5: Multi-party pricing split
1. User creates invoice for a shop connected through a connector
2. Adds pricing party: Shop (consignment 30%)
3. Adds pricing party: Connector (fee 10%)
4. System calculates per line item:
   - Unit price: ¥42,800
   - Shop gets: ¥12,840 (30%)
   - Connector gets: ¥4,280 (10%)
   - Ivycoast keeps: ¥25,680 (60%)
5. "Applied Price" column shows ¥25,680 per unit
6. "Net Amount" column shows qty × ¥25,680

### UC6: Manual invoice for a new contact
1. User opens invoice modal → selects "+ New Contact" from dropdown
2. Inline form appears: name, type (Vendor/Connector/Partner), company, email
3. User fills in details, adds line items, saves
4. System auto-creates CRM contact with the entered details
5. Sets contact stage to "active_partner"
6. Copies pricing type/percent to the new CRM record

---

## 3. Data Models

### 3.1 Invoice

```
Invoice {
  id                  string      Auto-generated (inv-TIMESTAMP-RANDOM)
  invoiceNumber       string      Format: INV-YYYY-NNN (sequential per year)
  contactId           string      CRM vendor ID (or "" for new/manual contact)
  contactName         string      Vendor/contact name
  contactCompany      string      Company name
  contactEmail        string      Email
  contactAddress      string      JSON: {postal, prefecture, city, line1, line2}
  invoiceDate         string      YYYY-MM-DD
  dueDate             string      YYYY-MM-DD (optional)
  poReference         string      PO number or event reference (optional)
  items               string      JSON array: [{description, qty, unitPrice, amount}]
  subtotal            string      Sum of (qty × unitPrice) for all items
  discount            string      Flat discount amount
  shipping            string      Shipping cost
  taxType             string      "included" | "10"
  tax                 string      Calculated: 0 if included, 10% of (subtotal - discount) if "10"
  total               string      subtotal - discount + tax + shipping
  pricingType         string      "wholesale" | "consignment" | "" (deprecated, use pricingParties)
  pricingPercent      string      (deprecated, use pricingParties)
  pricingParties      string      JSON array: [{name, contactId, type, percent}]
  status              string      "draft" | "sent" | "paid"
  workspace           string      "IVYCOAST" (default)
  notes               string      Payment terms, special instructions
  orderId             string      Linked Shopify order ID (optional)
  orderNumber         string      Linked order number (optional)
  createdAt           string      Auto-set by backend
  updatedAt           string      Auto-set by backend
}
```

### 3.2 Receipt

```
Receipt {
  id                  string      Auto-generated (rec-TIMESTAMP-RANDOM)
  receiptNumber       string      Format: REC-YYYY-NNN (sequential per year)
  invoiceId           string      Linked invoice ID (optional)
  invoiceNumber       string      Linked invoice number (optional)
  contactName         string      Recipient name
  contactCompany      string      Company name
  contactEmail        string      Email
  contactAddress      string      JSON: {postal, prefecture, city, line1, line2}
  receiptDate         string      YYYY-MM-DD
  items               string      JSON array: [{description, qty, unitPrice, amount}]
  subtotal            string      Same calculation as invoice
  discount            string      Flat discount
  shipping            string      Shipping cost
  taxType             string      "included" | "10"
  tax                 string      Same calculation as invoice
  total               string      Same calculation as invoice
  pricingType         string      (deprecated)
  pricingPercent      string      (deprecated)
  pricingParties      string      JSON array (same as invoice)
  workspace           string      "IVYCOAST"
  notes               string      Thank you message, payment method
  orderId             string      Linked order ID (optional)
  orderNumber         string      Linked order number (optional)
  createdAt           string      Auto-set
  updatedAt           string      Auto-set
}
```

### 3.3 Line Item (embedded in items JSON array)

```
LineItem {
  description         string      Product name or service description
  qty                 number      Quantity
  unitPrice           number      Price per unit (before pricing party deductions)
  amount              number      qty × unitPrice (calculated)
}
```

### 3.4 Pricing Party (embedded in pricingParties JSON array)

```
PricingParty {
  name                string      Party name (e.g., "Northshore Cafe")
  contactId           string      CRM contact ID (or "" for free text)
  type                string      "wholesale" | "consignment"
  percent             number      0-100, percentage share of unit price
}
```

---

## 4. Relationships

```
Invoice
  ├── belongs to: Vendor/Contact (via contactId)
  ├── linked to: Order (via orderId, optional)
  ├── has many: LineItems (embedded JSON)
  ├── has many: PricingParties (embedded JSON)
  └── generates: Receipt (when status → "paid")

Receipt
  ├── linked to: Invoice (via invoiceId, optional)
  ├── linked to: Order (via orderId, optional)
  ├── has many: LineItems (embedded JSON)
  └── has many: PricingParties (embedded JSON)

Order (Shopify)
  ├── can generate: Invoice (via "Create Invoice" action)
  └── can generate: Receipt (via "Create Receipt" action)

Vendor/Contact (CRM)
  ├── has many: Invoices (via contactId)
  ├── has saved: wholesalePercent, consignmentPercent
  └── auto-created from invoice if new contact
```

---

## 5. Pricing Calculation Logic

### 5.1 Single-party pricing
```
vendor.consignmentPercent = 30
unitPrice = ¥42,800

appliedPrice = unitPrice × (100 - 30) / 100 = ¥29,960
vendorShare  = unitPrice × 30 / 100 = ¥12,840
```

### 5.2 Multi-party pricing
```
parties = [
  { name: "Shop", type: "consignment", percent: 30 },
  { name: "Connector", type: "consignment", percent: 10 }
]
unitPrice = ¥42,800
totalPercent = 30 + 10 = 40

appliedPrice    = unitPrice × (100 - 40) / 100 = ¥25,680  (Ivycoast keeps)
shopShare       = unitPrice × 30 / 100 = ¥12,840
connectorShare  = unitPrice × 10 / 100 = ¥4,280
```

### 5.3 Tax calculation
```
if taxType === "included":
  tax = 0  (price already includes tax)
  total = subtotal - discount + shipping

if taxType === "10":
  tax = Math.round((subtotal - discount) × 0.1)
  total = subtotal - discount + tax + shipping
```

### 5.4 Totals
```
subtotal = SUM(item.qty × item.unitPrice) for all items
tax = (see above)
total = subtotal - discount + tax + shipping
```

---

## 6. Status Workflow

```
         ┌─────────┐
         │  draft   │
         └────┬─────┘
              │ (user sends)
         ┌────▼─────┐
         │   sent   │
         └────┬─────┘
              │ (payment received)
         ┌────▼─────┐
         │   paid   │──── auto-creates Receipt
         └──────────┘
```

- **draft**: Default for new invoices. Not yet sent to vendor.
- **sent**: Invoice delivered to vendor. Awaiting payment.
- **paid**: Payment received. Auto-triggers receipt creation if no receipt exists.

---

## 7. UI Components

### 7.1 Invoice Modal

**Modal ID**: `inv-modal-overlay` / `inv-modal`

**Sections (top to bottom):**

1. **Header**: Title ("New Invoice" or "Edit Invoice #INV-2026-001") + Close button

2. **Contact Selection**:
   - Dropdown of all CRM contacts (format: "Name (Company)")
   - "+ New Contact" option reveals inline fields:
     - Contact name, Type (dropdown), Company, Email
   - On contact select: auto-fills company, email, address
   - On contact select: auto-adds pricing party with saved rate

3. **Invoice Details**:
   - Invoice number (auto-generated, editable)
   - Invoice date (default: today)
   - Due date (optional)
   - Company name, Email
   - PO Reference / Event reference
   - Status dropdown (draft / sent / paid)
   - Notes textarea

4. **Address** (collapsible):
   - Postal code, Prefecture, City, Address line 1, Address line 2

5. **Pricing Parties** (dynamic rows):
   - Each row: Contact dropdown + Name input + W/C toggle + Percent input + Remove
   - "+ Add pricing party" button
   - Auto-loads from selected vendor's saved rate

6. **Line Items** (table):
   | Description | Qty | Unit Price | Applied Price | Net Amount | × |
   |-------------|-----|------------|---------------|------------|---|
   - Description field has product autocomplete (searches Shopify products by title/SKU)
   - Applied Price = unitPrice adjusted by pricing parties
   - Net Amount = qty × appliedPrice
   - "+ Add Line Item" button below table

7. **Totals**:
   - Discount (flat amount input)
   - Shipping (flat amount input)
   - Tax type dropdown ("Tax included" / "10%")
   - Subtotal (calculated, display only)
   - Total (calculated, display only)

8. **Actions**:
   - Save button
   - Delete button (existing invoices only)
   - Preview button (opens preview or split view)
   - Download PDF button

### 7.2 Receipt Modal

**Modal ID**: `rec-modal-overlay` / `rec-modal`

Nearly identical to invoice modal with these differences:
- No contact dropdown (manual entry only)
- No status field
- Has "Linked Invoice" display (if created from invoice)
- Receipt number format: REC-YYYY-NNN
- Receipt date instead of invoice date + due date

### 7.3 Split Preview

- Toggle button switches modal to split layout
- Left pane (55%): form editor
- Right pane (45%): live document preview (scaled down)
- Preview updates in real-time as form changes
- Preview matches PDF output layout

### 7.4 PDF Output

Both invoice and receipt PDFs include:
- Ivycoast logo (top left)
- Document number and date (top right)
- Bill-to address block
- Event/PO reference
- Payment direction with bank details (invoice only)
- Line items table
- Tax display (included / separate / none)
- Totals block
- Bilingual headers (English + Japanese)

---

## 8. Product Quick Selection

### Current Implementation
- Line item description field has autocomplete
- Searches `shopifyProducts` array by: title, variantTitle, SKU
- Shows up to 8 matches with product name and price
- Selecting a product fills description and unit price
- Keyboard navigation: arrow keys + Enter + Escape

### Improvements Needed
- **Quick product list**: Show a grid/list of frequently used products that can be added with one click
- **Product categories**: Group by soap/candle/gift set for faster browsing
- **Recent products**: Show last 5 products used in invoices
- **Bulk add**: Select multiple products and add all at once
- **SKU display**: Show SKU in autocomplete results for disambiguation
- **Stock awareness**: Show current stock levels next to products

---

## 9. Contact & Vendor Quick Selection

### Current Implementation
- Dropdown populated from `crmContacts` array
- Format: "Name (Company)"
- Auto-fills: company, email, address, pricing rate
- "+ New Contact" creates inline and saves to CRM on invoice save

### Improvements Needed
- **Search within dropdown**: Current dropdown is a plain `<select>` — large lists are hard to navigate
- **Recent contacts**: Show last 5 contacts invoiced
- **Contact preview**: Show contact card on hover/select (email, phone, last invoice date)
- **Vendor type indicator**: Show Direct/Connector/Via badge next to name
- **Quick access from vendor profile**: "Create Invoice" button on vendor detail should pre-select that vendor

---

## 10. Consignment & Wholesale Setup

### How It Works Today

**On vendor/contact record** (CRM):
- `wholesalePercent`: saved wholesale rate (0-100)
- `consignmentPercent`: saved consignment rate (0-100)
- Set in vendor edit form under "Pricing" section

**On invoice**:
- When contact is selected from dropdown:
  - System checks `wholesalePercent` and `consignmentPercent` on the CRM record
  - If either exists: auto-adds a pricing party row with the saved rate
  - Type toggle pre-set to W (wholesale) or C (consignment)
- User can manually add/remove/edit pricing parties
- Multiple parties supported (e.g., shop 30% + connector 10%)

**Pricing party row fields**:
- Contact: dropdown of CRM contacts + free text option
- Name: display name for the party
- Type: W (wholesale) or C (consignment) toggle
- Percent: 0-100 input
- Applied price column updates in real-time

### Improvements Needed
- **Auto-detect from vendor type**: If vendor is CONNECTOR, auto-add connector fee row
- **Auto-detect from relationship**: If vendor is VIA_CONNECTOR, auto-add both shop % and connector %
- **Save pricing parties as template**: Allow saving a pricing configuration for reuse
- **Pricing summary card**: Show a visual breakdown (like the "Where the money goes" bar in vendor profile)
- **Warning for missing rates**: Alert if a consignment partner has no saved rate

---

## 11. Backend (Google Sheets)

### Invoices Sheet Columns
```
id | invoiceNumber | contactId | contactName | contactCompany | contactEmail |
contactAddress | invoiceDate | dueDate | poReference | items | subtotal |
discount | shipping | taxType | tax | total | pricingType | pricingPercent |
pricingParties | status | workspace | notes | orderId | orderNumber |
createdAt | updatedAt
```

### Receipts Sheet Columns
```
id | receiptNumber | invoiceId | invoiceNumber | contactName | contactCompany |
contactEmail | contactAddress | receiptDate | items | subtotal | discount |
shipping | taxType | tax | total | pricingType | pricingPercent |
pricingParties | workspace | notes | orderId | orderNumber |
createdAt | updatedAt
```

### API Endpoints
```
POST /exec  { action: "create", sheet: "Invoices", invoice: {...} }
POST /exec  { action: "update", sheet: "Invoices", invoice: { id, ...fields } }
POST /exec  { action: "delete", sheet: "Invoices", id: "inv-xxx" }
GET  /exec?action=list&sheet=Invoices

POST /exec  { action: "create", sheet: "Receipts", receipt: {...} }
POST /exec  { action: "update", sheet: "Receipts", receipt: { id, ...fields } }
POST /exec  { action: "delete", sheet: "Receipts", id: "rec-xxx" }
GET  /exec?action=list&sheet=Receipts
```

### Number Generation
- Invoice: `INV-YYYY-NNN` — sequential per year, zero-padded to 3 digits
- Receipt: `REC-YYYY-NNN` — same pattern
- Checks existing records to find next available number

---

## 12. Key Functions Reference

| Function | Line | Purpose |
|---|---|---|
| `openInvoiceCreateModal()` | ~16787 | Open blank invoice form |
| `openInvoiceEditModal(id)` | ~16822 | Open existing invoice for editing |
| `saveInvoice()` | ~17113 | Validate + save invoice + auto-create receipt if paid |
| `addInvoiceLineItem(desc, qty, price)` | ~16939 | Add row to line items table with autocomplete |
| `getInvoiceLineItems()` | ~17061 | Read all line items from table |
| `recalcInvoiceTotals()` | ~17075 | Recalculate subtotal/tax/total |
| `addInvPricingParty(name, cid, type, pct)` | ~16646 | Add pricing party row |
| `getInvPricingParties()` | ~16760 | Read all pricing parties |
| `calcPricingSummary(unitPrice, parties)` | ~16258 | Calculate applied price + breakdown |
| `populateInvoiceContactDropdown()` | ~16589 | Load CRM contacts into dropdown |
| `onInvoiceContactChange()` | ~16609 | Handle contact selection + auto-fill |
| `generateInvoiceNumber()` | ~16331 | Generate next INV-YYYY-NNN |
| `downloadInvoicePdf(invData)` | ~17763 | Generate PDF with jsPDF |
| `previewInvoice()` | ~17454 | Show HTML preview |
| `toggleInvSplitPreview()` | ~17524 | Toggle split editor/preview mode |
| `createInvoiceFromOrder()` | ~17751 | Pre-fill invoice from Shopify order |
| `autoCreateReceiptFromInvoice(inv)` | ~19046 | Auto-create receipt when paid |
| `openReceiptCreateModal()` | ~18437 | Open blank receipt form |
| `openReceiptEditModal(id)` | ~18465 | Open existing receipt for editing |
| `saveReceipt()` | ~18515 | Validate + save receipt |
| `addReceiptLineItem(desc, qty, price)` | ~18196 | Add receipt line item row |
| `recalcReceiptTotals()` | ~18255 | Recalculate receipt totals |
| `generateReceiptNumber()` | ~18023 | Generate next REC-YYYY-NNN |
| `downloadReceiptPdf(recData)` | ~18847 | Generate receipt PDF |
| `createReceiptFromOrder()` | ~19097 | Pre-fill receipt from order |

---

## 13. Design Tokens (for styling)

See `DESIGN_TOKENS.md` for the full token reference. Key tokens used in invoice/receipt UI:

- **Font**: `--font-text` (SF Pro Text 14px) for form inputs, `--font-mono` (SF Mono 10px) for numbers/dates
- **Borders**: `--color-border` (#dadce0) for inputs, `--color-border-subtle` (#e3e3e3) for cards
- **Primary**: `--color-primary` (#0e413b) for buttons, links
- **Surface**: `--color-surface-secondary` (#f8f9fa) for input backgrounds
- **Status badges**: success (paid), warning (sent), neutral (draft)

---

## 14. Known Issues & Technical Debt

1. **No inline validation**: Form only validates on save, not on field change
2. **Contact dropdown is a plain `<select>`**: Hard to search with many contacts
3. **Product autocomplete is custom**: Not a standard combobox pattern, accessibility limited
4. **PDF generation uses hardcoded positions**: Fragile if content length varies
5. **Split preview scaling**: Uses CSS transform scale(0.35) which can look blurry
6. **Receipt has no status field**: Always created as a final document
7. **No email sending**: PDFs must be downloaded and sent manually
8. **No multi-currency**: All amounts assumed JPY
9. **`pricingType` and `pricingPercent` fields deprecated**: Still stored but replaced by `pricingParties` array. Should be cleaned up.
10. **Line items stored as JSON string**: Not queryable at the sheet level

---

## 15. File Location

Everything is in `/Users/taka/AppDevelopments/ivycoast-hub/index.html`:
- Invoice CSS: lines ~1950-2350
- Invoice HTML: lines ~5896-6076
- Receipt HTML: lines ~6079-6238
- Invoice JS: lines ~16250-17760
- Receipt JS: lines ~17990-19100
- PDF generation: embedded in the JS sections above
