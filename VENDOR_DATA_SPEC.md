# Vendor CRM — Data Model & Relationship Spec

This document defines every vendor type, every data object, every relationship between objects, and every rule for how financial data flows through the system. Claude Code must follow this spec exactly. Do not infer, abbreviate, or simplify any relationship or field unless explicitly marked as optional.

---

## 1. Vendor Types

There are exactly three vendor types. Every vendor record must have one of these types. The type determines which fields are required, which UI sections appear, and how financial data is calculated.

### 1.1 `DIRECT`
A business that sells Ivycoast products directly. Ivycoast contacts and invoices them directly. There is no third party involved.

- Ivycoast ↔ Vendor
- Billing: Ivycoast invoices the vendor
- No connector fee
- No linked connector record

### 1.2 `MANAGED_VENUE`
A shop or café that sells Ivycoast products, but was introduced and is managed through a Connector. Ivycoast does not bill the venue directly. The connector handles the relationship and takes a fee from gross sales.

- Ivycoast → Connector → Venue
- Billing: Ivycoast is billed by the connector (not the venue). The venue is invoiced by the connector.
- Requires a linked `connector_id` pointing to a `CONNECTOR` vendor record
- The connector fee is defined on the connector record and applied to this venue's sales
- The venue's own margin is defined on this venue's record

### 1.3 `CONNECTOR`
A business that introduces Ivycoast to multiple venues and takes a percentage fee from gross sales at each venue. Ivycoast pays the connector monthly across all venues they manage.

- Ivycoast pays connector
- Connector manages relationship with N venues
- Requires a list of linked venue records (`managed_venue_ids`)
- The connector fee rate is defined once on the connector record and applies to all venues they manage

---

## 2. Core Data Objects

### 2.1 Vendor

Every vendor in the system, regardless of type, is a `Vendor` object. Fields marked `[required]` must always have a value. Fields marked `[conditional]` are required only for specific vendor types as noted.

```
Vendor {
  id:                   string          [required]
  type:                 enum            [required] — DIRECT | MANAGED_VENUE | CONNECTOR
  name_en:              string          [required]
  name_ja:              string          [optional]
  logo_initials:        string          [required]
  logo_image_url:       string          [optional]
  website:              string          [optional]
  address:              string          [optional]
  stage:                enum            [required] — see Section 3
  partnership_start_date: date          [optional]
  created_at:           timestamp       [required]
  updated_at:           timestamp       [required]

  // Commercial terms
  arrangement:          enum            [required] — CONSIGNMENT | WHOLESALE
  venue_margin_pct:     number          [conditional: DIRECT, MANAGED_VENUE]
  payment_terms_days:   number          [conditional: DIRECT]
  billing_cycle:        enum            [conditional: DIRECT] — MONTHLY | QUARTERLY
  contract_signed_date: date            [optional]

  // Connector-specific fields
  connector_fee_pct:    number          [conditional: CONNECTOR]
  managed_venue_ids:    string[]        [conditional: CONNECTOR]

  // Managed venue-specific fields
  connector_id:         string          [conditional: MANAGED_VENUE]
}
```

### 2.2 Contact

```
Contact {
  id:           string    [required]
  vendor_id:    string    [required]
  name_en:      string    [required]
  name_ja:      string    [optional]
  initials:     string    [required]
  role:         string    [optional]
  email:        string    [optional]
  phone:        string    [optional]
  is_primary:   boolean   [required]
  created_at:   timestamp [required]
}
```

### 2.3 Product Placement

```
ProductPlacement {
  id:                 string    [required]
  vendor_id:          string    [required]
  product_id:         string    [required]
  product_name:       string    [required]
  units_placed:       number    [required]
  units_remaining:    number    [required]
  unit_price:         number    [required]
  low_stock_threshold:number    [required]
  color_hex:          string    [optional]
  placed_at:          date      [required]
  updated_at:         timestamp [required]
}
```

Derived: `is_low_stock = units_remaining <= low_stock_threshold` (never stored)

### 2.4 Order

```
Order {
  id:             string    [required]
  vendor_id:      string    [required]
  order_date:     date      [required]
  line_items:     OrderLineItem[] [required]
  gross_total:    number    [required] — computed
  status:         enum      [required] — PENDING | CONFIRMED | INVOICED | PAID
  notes:          string    [optional]
  created_at:     timestamp [required]
}
```

### 2.5 Fee Invoice

```
FeeInvoice {
  id:               string    [required]
  connector_id:     string    [required]
  period_start:     date      [required]
  period_end:       date      [required]
  venue_breakdowns: FeeInvoiceVenueBreakdown[] [required]
  total_gross:      number    [required] — computed
  fee_pct:          number    [required] — snapshot
  fee_total:        number    [required] — computed
  status:           enum      [required] — PENDING | PAID
  paid_at:          timestamp [optional]
  created_at:       timestamp [required]
}
```

### 2.6 Activity Event

```
ActivityEvent {
  id:           string    [required]
  vendor_id:    string    [required]
  event_type:   enum      [required]
  title:        string    [required]
  detail:       string    [optional]
  related_id:   string    [optional]
  occurred_at:  timestamp [required]
}
```

Valid event types: ORDER_RECEIVED, ORDER_CONFIRMED, INVOICE_SENT, INVOICE_RECEIVED, PAYMENT_RECEIVED, PAYMENT_MADE, LOW_STOCK_FLAGGED, STOCK_RESTOCKED, STAGE_CHANGED, SHOP_INTRODUCED, SHOP_WENT_LIVE, CONTACT_ADDED, NOTE_ADDED, TASK_COMPLETED

### 2.7 Task / 2.8 Note

Standard objects with vendor_id foreign key.

---

## 3. Pipeline Stages

| Stage enum         | Display label    | Notes |
|--------------------|------------------|-------|
| NOT_IN_TOUCH       | Not in touch     | Default |
| ON_OUR_RADAR       | On our radar     | |
| REACHED_OUT        | Reached out      | |
| IN_TALKS           | In talks         | |
| ACTIVE             | Working together | partnership_start_date set here |

Financial metrics only meaningful when ACTIVE. Pipeline widget hidden when ACTIVE.

---

## 4. Financial Calculations

All JPY integers. Percentages stored as plain numbers (10 = 10%).

- **DIRECT:** `ivycoast_net = gross - (gross × venue_margin_pct / 100)`
- **MANAGED_VENUE:** `ivycoast_net = gross - venue_share - connector_fee` (connector fee from connector record)
- **CONNECTOR:** aggregate across all managed venues
- Revenue split must always sum to exactly 100%

---

## 5. Metrics Per Vendor Type

### DIRECT
1. Earned this month (ivycoast_net, trend)
2. Earned all time (ivycoast_net total)
3. Products with them (count + low stock)
4. Last sale (date + amount)

### MANAGED_VENUE
1. Shop sales this month (gross)
2. Connector's cut (connector fee)
3. We actually earn (ivycoast_net)
4. Products on display (count + low stock)

### CONNECTOR
1. Sales across all shops (aggregate gross)
2. Their total fee (connector_fee_total)
3. We receive (ivycoast_net aggregate)
4. Shops connected (count + stage breakdown)

---

## 6. Tabs Per Vendor Type

- **DIRECT:** Overview, Contacts, Orders, Products, Files
- **MANAGED_VENUE:** Overview, Contacts, Orders, Products, Files
- **CONNECTOR:** Overview, Contacts, Shops, Invoices, Files

---

## 7. Terms Strip (4 cells, type-specific)

- **DIRECT:** How we work | Their share | We invoice | They pay within
- **MANAGED_VENUE:** How we work | Shop keeps | Connector fee (amber) | Introduced by (link)
- **CONNECTOR:** Their role | How they charge (amber) | We pay them | Contract signed

---

## 8. Relationship Chain (MANAGED_VENUE only)

Visual strip: Ivycoast → Connector → Venue. Both connector and venue nodes tappable.

---

## 9-12. UI Behaviour, Fee Invoice Lifecycle, Relationships, Data Integrity

See full spec for stage-based content switching, low stock flagging, connector fee visibility rules, bidirectional navigation, fee rate change handling, and all 10 data integrity constraints.
