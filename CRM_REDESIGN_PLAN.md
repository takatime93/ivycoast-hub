# CRM Vendor Profile Redesign — Implementation Plan

**Figma source:** `https://www.figma.com/design/hSB2Mkz9L0gmXxuMBBaxGU/Ivycoast---Website?node-id=124-12675` (empty state) and `124-12676` (populated state)

**File:** All changes in `index.html` (single-page app, ~16,000 lines)

**Approach:** 6 phases, each independently committable and testable. All CSS is inline in `<style>` tags. All JS uses vanilla DOM methods (no innerHTML — blocked by security hook).

---

## Phase 1 — Header Refinements [COMPLETED]

### What changed

**CSS:**
- `.crm-detail-header` — added `border-bottom: 1px solid #e3e3e3`
- `.crm-detail-header-info` — gap `2px` → `0` (children manage own spacing)
- `h2.crm-detail-name` — font-size `24px` → `20px`, line-height `1.3`, margin-bottom `2px`, selector uses `h2.` prefix to beat `.board-modal h2` specificity
- `.crm-detail-subtitle` — font-size `14px` → `12px`, letter-spacing `0.14px` → `0.12px`, line-height `1.4`
- `.crm-detail-stage-badge` — border-radius `5px` → `3px`, letter-spacing `1.2px` → `1px`, removed `align-self: flex-start` and `margin-top: 2px`

**New CSS classes:**
- `.crm-detail-name-block` — name + subtitle wrapper, gap `0`
- `.crm-detail-badges-row` — badges container, gap `4px`, margin-top `6px`
- `.crm-detail-type-badge-v2` — type badge: blue outline (`#3b82f6` border + text, transparent bg, 3px radius, 10px font, 600 weight, 1px tracking)
- `.crm-detail-stage-split` — split ACTIVE PARTNER badge with left (solid `#0e413b`) + right (outline)
- `.crm-detail-contact-rows` — contact info container, margin-top `12px`, gap `2px`, flex column
- `.crm-detail-contact-row` — single row: flex, gap `4px`, 11px font, `#424242` text
- `.crm-detail-contact-row .crm-icon` — 16px container, 12px font, `#0e413b`
- `.crm-detail-contact-row a` — 12px, `#157be1`, font-weight 500
- `.crm-detail-social-row` — horizontal row for social links, gap `16px`
- `.crm-detail-social-row a` — flex, gap `4px`, `#157be1`, 12px, weight 500
- `.crm-detail-social-row a .crm-icon` — 16px container, `#0e413b`

**JS restructure of `infoDiv` (inside `openCrmDetailView`):**
```
infoDiv (.crm-detail-header-info)
├── nameBlock (.crm-detail-name-block)
│   ├── nameEl (h2.crm-detail-name, 20px)
│   └── subtitleEl (.crm-detail-subtitle, 12px) — if registered name differs
├── badgesRow (.crm-detail-badges-row)
│   ├── typeBadge (.crm-detail-type-badge-v2) — "Vendor" → "DIRECT PARTNER", others uppercase
│   └── stageBadge — if active_partner + connectedDate → split badge, else solid badge
└── contactRows (.crm-detail-contact-rows) — only if any contact data exists
    ├── addressRow — shop icon + location text (11px, #424242)
    ├── websiteRow — globe icon + link (12px, #157be1)
    └── socialRow (.crm-detail-social-row, gap 16px)
        ├── instagramLink — FA6 Brands instagram icon + full URL
        └── facebookLink — FA6 Brands facebook icon + full URL
```

**Removed:**
- Info bar construction block (~30 lines building `.crm-detail-info-bar`)
- `detailView.insertBefore(infoBar, tabsBar)` insertion

---

## Phase 2 — Tab Bar Redesign

### Figma values (from node 120:3027)
- Container: `background: #fcfcfc`, `border-top: 1px solid #e3e3e3`, `border-bottom: 1px solid #e3e3e3`, `padding: 0 32px`, `justify-content: center`
- Tab text: `font-size: 12px` (currently 14px), `line-height: 18px`, `font-weight: 500` (medium), `color: #181818`
- Active tab: `font-weight: 600` (semibold), `color: #0e413b`, `border-bottom: 2px solid #0e413b`
- Tab padding: `12px 12px 14px 12px` (top, right, bottom, left)

### Badge styles (two types)
**Actionable badges (red):** For Overview, Documents, References
- `background: #ff1818`, `color: #fff`
- `border-radius: 4px`, `min-width: 20px`, `padding: 0 4px`
- `font-size: 12px`, `font-weight: 500`, `line-height: 16px`, `letter-spacing: 0.24px`

**Data count badges (gray):** For Contacts, Orders, Stock
- `background: #f1f1f1`, `color: #181818`
- Same dimensions as red badges

### CSS changes
1. `.crm-detail-tabs` — add `background: #fcfcfc`, change padding to `0 32px`
2. `.crm-detail-tab` — font-size `14px` → `12px`, padding `12px 16px 14px` → `12px 12px 14px`
3. Add `.crm-tab-count-red` class for red actionable badges (`background: #ff1818; color: #fff`)
4. Keep existing `.crm-tab-count` for gray data badges

### JS changes
1. Overview tab (idx 0): add red badge with actionable count (pending tasks + alerts)
2. Contacts tab (idx 1): change to gray count badge
3. Orders tab (idx 2): change from dot notifier to gray count badge
4. Stock tab (idx 3): keep gray count badge
5. Documents tab (idx 4): add red badge for unsigned/pending docs
6. References tab (idx 5): switch to red badge if actionable items exist

---

## Phase 3 — Analytics + Stat Cards

### Figma values (from overview section, node 114:2184)
- Section container: `padding: 16px 32px`, `gap: 8px`, flex column

### Analytics header row
- Left side: "Analytics" label (`font-size: 11px`, `font-weight: 600`, `color: #424242`, `line-height: 18px`) + info icon (FA6 light, 12px, `#0e413b`, 16px container)
- Right side: "Monthly" dropdown (`font-size: 11px`, `font-weight: 600`, `color: #0e413b`) + chevron-down icon (FA6 light, 18px container)

### Stat cards (4 across)
- Card: `width: 165px`, `border: 1px solid #e3e3e3`, `border-radius: 8px`, `padding: 12px 18px`
- Shadow: `0px 4px 14px rgba(0,0,0,0.03)`
- Background: `#fff`, `overflow: clip`
- Cards row: `gap: 8px`, flex, horizontal

### Card content
- Label: `font-size: 10px`, `font-weight: 600`, `color: #424242`
- Value: `font-size: 18px`, `font-weight: 600`, `color: #000`
- Sub-label: `font-size: 10px`, `font-weight: 400`, `color: #424242`
- Gap between label and value group: `4px`

### Four cards
1. **Earned this month** — `¥{amount}` / "No sales recorded yet"
2. **Earned all time** — `¥{amount}` / "Waiting on first order"
3. **Products with them** — `{count}` / "No order placed yet"
4. **Last sale** — `{date}` / "No history"

### CSS changes
- Replace `.crm-detail-quick-stats` grid with new card layout
- Add `.crm-analytics-header` for the Analytics + Monthly row
- Add `.crm-stat-card-v2` matching Figma card dimensions

### JS changes
- Replace current `qsGrid` construction in `renderCrmOverviewTab` with:
  1. Analytics header with "Monthly" dropdown (non-functional initially)
  2. Four stat cards with computed values from orders/stock data

---

## Phase 4 — Two-Column Layout

### Figma values (from node 120:5980)
- Container: `padding: 0 32px`, flex row, `gap: 24px`
- Left column: `flex: 1`, flex column
- Right column: `flex: 1`, flex column
- Divider line between analytics and columns: `border-top: 1px solid #e3e3e3` (on first section of each column)

### CSS changes
- Add `.crm-overview-columns` — `display: flex; gap: 24px; padding: 0 32px`
- Add `.crm-overview-col` — `flex: 1; display: flex; flex-direction: column; min-width: 0`

### JS changes
- In `renderCrmOverviewTab`, after stat cards, create two-column container
- Move existing sections into appropriate columns:
  - **Left column:** Rules, Products in Stock, Notes
  - **Right column:** Contacts, Tasks, Activity

---

## Phase 5 — Left Column Sections

### Section header pattern (shared across all sections)
- Container: `border-top: 1px solid #e3e3e3`, `padding: 16px 0 24px`, flex column, `gap: 8px`
- Title row: flex, space-between, `font-size: 11px`
- Title text: `font-weight: 600`, `color: #424242`, `line-height: 18px`
- Count: `font-weight: 300` (light), `color: #424242`
- Action button: `color: #0e413b`, `font-weight: 600`, flex, `gap: 2px`, + icon (FA6 light, 18px container) or cog icon

### 5a. "How we work together" rules table (node 123:10273)
- Table container: `border: 1px solid #e3e3e3`, `border-radius: 8px`, `padding: 8px 16px`
- Rows: flex, space-between, `padding: 6px 0`, `font-size: 12px`, `color: #000`
- Row dividers: `border-bottom: 1px solid #e3e3e3` (except last row)
- Label (left): `font-weight: 400`
- Value (right): `font-weight: 600`, text-align right

### Table rows
| Label | Value source |
|-------|-------------|
| How we work | `c.type` → "Consignment" / "Wholesale" / "Direct" |
| We invoice | Invoice frequency (future field or hardcoded) |
| Their share | `c.consignmentPercent` or `c.wholesalePercent` + "%" |
| They pay within | Payment terms (future field, default "30 days") |

### 5b. "Products in Stock" list (node 123:9115)
- Header: title + count `(8 - 248 total)` + cog icon
- Product items: `border: 1px solid #e3e3e3`, `border-radius: 4px`, `padding: 4px 4px 4px 12px` (right padding 12px)
- Item row: flex, space-between
- Product icon: colored square `24px`, `border-radius: 2px`, category-based color:
  - Soap: `#e6f3f1` bg, `#497871` icon
  - Candle: `#ece6f3` bg, `#497871` icon
- Product name: `font-size: 13px`, `font-weight: 600`, `color: #000`
- Stock warning: `font-size: 11px`, `color: #ff0202` (e.g., "4 Left")
- Price: `font-size: 13px`, `font-weight: 600`, `color: #000`, `width: 64px`, text-right
- Items gap: `2px`
- Data source: `partnerStock` filtered by contactId, status "active"

### 5c. Notes section (node 122:7120)
- Header: "Notes" + count + "+ Add Note" button
- Note card: `border: 1px solid #e3e3e3`, `border-radius: 8px`, `padding: 20px`, `shadow: 0px 4px 14px rgba(0,0,0,0.03)`
- Author row: 20px avatar + name (`14px`, `600`) + timestamp (`11px`, `#606060`, tracking `0.11px`) + menu icon
- Body: `font-size: 13px`, `font-weight: 400`, `color: #000`, 3-line truncation with "show more"
- Cards gap: `8px`
- Scrollbar: `4px` wide, `#d9d9d9`, `border-radius: 30px`

---

## Phase 6 — Right Column Sections

### 6a. Contacts (node 123:10050)
- Header: "Contacts" + count + "+ Add Contact" button
- Contact card: `border: 1px solid #e3e3e3`, `border-radius: 8px`, `padding: 12px`, `background: #fff`
- Avatar: `40px` circle
- Avatar initial: `14px`, `font-weight: 600`, colored text on colored background
- Name row: flex, `gap: 6px`, align center
  - Primary name: `13px`, `font-weight: 600`, `color: #000`
  - Separator: "·" (`14px`, `#424242`)
  - Secondary name: `13px`, `font-weight: 600`, `tracking: 0.13px`
- Role: `11px`, `font-weight: 400`, `color: #606060`
- Cards gap: `8px`

### 6b. Tasks (node 123:9533)
- Header: "Tasks" + count + "+ Add Task" button
- Task row: flex, `gap: 8px`, `padding: 4px`
- Alternate rows: odd rows get `background: #f7f7f7`
- Checkbox icon: FA6 light "square", `16px`, `#0e413b`, 20px container
- Task text: `14px`, `font-weight: 400`, `color: #000`, `line-height: 20px`, truncated

### 6c. Activity log (node 123:9764)
- Header: "Activity" (no count, no add button)
- Activity row: flex, space-between, `padding: 4px 0`
- Left side: colored dot + description
  - Dot: FA6 solid "circle-small", `13px`, 16px container, colored per type:
    - Order/Payment: `#58bfb3` (teal)
    - Invoice: `#5864bf` (purple)
    - Low stock: `#f5a244` (orange)
  - Description: `12px`, bold action + regular detail, `color: #000`
- Right side: date, `10px`, `font-weight: 500`, `color: #000`, text-right
- Multi-line entries: wrap text, top-aligned

---

## Phase 7 — Three Vendor Profile Types

> **Authoritative spec:** [`VENDOR_DATA_SPEC.md`](VENDOR_DATA_SPEC.md) defines the complete data model, relationships, financial calculations, and UI rules. This plan covers implementation order only.

This phase builds three distinct vendor profile experiences based on `vendor.type`:
- **DIRECT** — we sell to them directly (what Phases 1-6 built)
- **MANAGED_VENUE** — a shop connected to us through a connector
- **CONNECTOR** — a middleman who connects us to shops and takes a commission

**Figma sources:**
- B2B2B Connector: `node-id=123-11256` (Edgeof Creative example)
- Via Connector: `node-id=123-10747` (Northshore Cafe example)

### Phase 7a — Type Badge Variants

**Current:** "Vendor" → "DIRECT PARTNER" blue outline badge (`rgba(60,177,255,0.3)` bg, `#0970b4` border, `#054169` text)

**New badges:**
| Type | Label | Background | Border | Text |
|------|-------|-----------|--------|------|
| Vendor | DIRECT PARTNER | `rgba(60,177,255,0.3)` | `#0970b4` | `#054169` |
| Connector | B2B2B CONNECTOR | `rgba(141,255,95,0.3)` | `#0c5b20` | `#0c5b20` |
| Partner (via connector) | VIA CONNECTOR | `rgba(255,196,60,0.3)` | `#5c4307` | `#75550d` |

**JS change:** Update the type badge mapping in `openCrmDetailView` to handle these 3 types.

### Phase 7b — Connector Banner Bar

A colored banner bar appears below the header (above the pipeline/tabs) showing relationship context.

**For B2B2B Connector (`type: "Connector"`):**
- Background: `#ffedc4` (warm yellow)
- Content: List of connected shop names, each with a link icon (`\uf0c1`), centered, `gap: 16px`
- Text: `12px`, `font-weight: 600`, `color: #000`
- Data source: query `crmContacts` for contacts whose `connectorId === thisContactId`

**For Via Connector (`type: "Partner"` with `connectorId`):**
- Background: `rgba(141,255,95,0.1)` (light green)
- Content: "Connected by **{ConnectorName}**" with link icon, centered
- Text: "Connected by" in regular, connector name in `font-weight: 600`
- Clicking connector name opens that connector's detail view
- Data source: look up `connectorId` in `crmContacts` to get connector name

**CSS:** New `.crm-connector-banner` class. Inserted between header and pipeline/tabs.

### Phase 7c — Connector-Specific Analytics Cards

The 4 stat cards change based on vendor type:

**Direct Partner (current, unchanged):**
1. Earned this month (green `#00a52c`, bar chart)
2. Earned all time (green, bar chart)
3. Products with them (count + low stock list)
4. Last sale (date + restock info)

**B2B2B Connector:**
1. **Sales across all shops** — `#000` value, "Combined (month)" sub-text, bar chart
2. **Their total fee** — `#d9ab13` (gold) value, "10% of all shop sales (month)" sub-text, bar chart
3. **We earn** — `#00a52c` (green) value, "after 30% shop + fee" sub-text, bar chart
4. **Shops connected** — count + mini list of connected shop names with 12px avatars

**Via Connector:**
1. **Shop sales this month** — `#000` value, trend arrow, bar chart
2. **Connector's cut** — `#d9ab13` (gold) value, "10% of sales" sub-text, bar chart
3. **We earn** — `#00a52c` (green) value, "after 30% shop + fee" sub-text, bar chart
4. **Product on display** — count + low stock list (same as Direct Partner card 3)

### Phase 7d — "Where the Money Goes" Bar (Via Connector only)

Full-width section below analytics cards showing revenue split:

- **Stacked horizontal bar:** `height: 6px`, `border-radius: 30px`, `overflow: clip`
  - Green segment (`#00a52c`): Ivycoast share (e.g. 70%)
  - Dark segment (`#2a4030`): Shop share (e.g. 20%)
  - Gold segment (`#d9ab13`): Connector fee (e.g. 10%)
- **Legend row below:** colored dots + percentage + entity name + role label
  - `font-size: 10px`, `gap: 24px` between items
  - Percentage in colored bold, name in `#1e1e1e` bold, role in `#424242` regular

**Data:** Calculated from `c.consignmentPercent` (shop share), connector fee from connector's record, remainder = Ivycoast share.

### Phase 7e — Invoices Section (B2B2B Connector only)

Full-width section below analytics, above the two-column layout:

- Header: "Invoices" + count badge (light weight)
- Invoice rows: `background: rgba(239,249,248,0.5)`, `border-radius: 8px`, `padding: 4px 16px 4px 4px`
  - Left: Shop name (`13px`, medium, `tracking: 0.13px`) + date badge (white bg, `11px`, `border-radius: 4px`)
  - Center: Amount (`14px`, `font-weight: 600`)
  - Right: "View Invoice >" button (outline, `#0e413b` border, `6px` radius, `11px` semibold)
- Data source: `invoices` filtered by connector's connected shop contactIds

### Phase 7f — "Shops Connected" Section (B2B2B Connector only)

Replaces "Products in Stock" in the left column:

- Header: "Shops they've connected us to" + count + cog icon
- Shop cards: `border: 1px solid #e3e3e3`, `border-radius: 8px`, `padding: 12px 16px`, white bg
  - Left: 40px avatar + shop name (`13px`, bold) + address (`11px`, `#606060`) + stock counts (candle/soap icons with numbers)
  - Right: "Sales this month" (`14px` bold value, `10px` label) + "Total sales" (same format)
- Cards gap: `8px`

### Phase 7g — Enhanced Rules Table

The "How we work together" table adapts per type:

**Direct Partner (current):** How we work | Their share | (future: We invoice, They pay within)

**B2B2B Connector:**
| Label | Value |
|-------|-------|
| Their Role | Connector |
| Connector fee | 10% of sales |
| We invoice | Monthly |
| They pay within | 30 days |

**Via Connector:**
| Label | Value |
|-------|-------|
| How we work | Consignment |
| {Shop name} (Seller) | 20% of sales |
| {Connector name} (Connector) | 10% of sales |
| We invoice | Monthly |
| They pay within | 30 days |

Connector name is underlined/clickable → opens connector's profile.

### Data Model Requirements

New fields needed on contacts:
- `connectorId` — string, links a "Via Connector" partner to its B2B2B Connector contact
- `connectorFeePercent` — number, the connector's cut (e.g. 10)

The `type` field needs these values supported: `"Vendor"` (Direct Partner), `"Connector"` (B2B2B), `"Partner"` (generic/via connector when `connectorId` is set)

### Implementation Order

1. **7a** — Type badge variants (CSS + JS mapping, ~15 min)
2. **7b** — Connector banner bar (CSS + JS, ~30 min)
3. **7c** — Type-specific analytics cards (JS card builders, ~45 min)
4. **7g** — Enhanced rules table (JS conditions, ~20 min)
5. **7d** — Money flow bar for Via Connector (CSS + JS, ~30 min)
6. **7e** — Invoices section for B2B2B Connector (CSS + JS, ~30 min)
7. **7f** — Shops connected section for B2B2B Connector (CSS + JS, ~30 min)

Each sub-phase is independently committable and testable.

---

## Pre-Merge Checklist

- [ ] Remove localhost dev auth bypass (search for "DEV BYPASS" in index.html)
- [ ] Test all phases with real data on localhost
- [ ] Hard refresh to clear service worker cache
- [ ] Test responsive behavior (mobile panel width)
- [ ] Verify pipeline widget still functions correctly
- [ ] Test edit form → header contact info round-trip

---

## Notes

- **Font families:** `Tomato Grotesk` (primary), `FA6 Pro` (icons), `FA6 Brands` (social icons), `PP Neue Montreal` (tab badge numbers)
- **Key colors:** `#0e413b` (dark green / primary), `#157be1` (links), `#424242` (secondary text), `#e3e3e3` (borders), `#ff1818` (red badges), `#f1f1f1` (gray badges)
- **Security constraint:** No `innerHTML` — use `createElement`/`textContent`/`appendChild` only
- **Single file:** Everything is in `index.html` — CSS in `<style>`, JS at bottom
