# Design System Extraction — Progress Tracker

**Started**: 2026-03-16
**File**: `index.html` (single-page app, ~18,000 lines)
**Approach**: 4 phases, each independently committable

---

## Phase 1 — CSS Variables Foundation ✅ DONE

### Step 1.1: Add `:root` token block ✅ DONE
- Inserted after `<style>` reset (line 33)
- 120+ tokens defined: colors, typography, spacing, radius, shadows, transitions
- `body` rule updated to use `var()` references

### Step 1.2: CSS `var()` substitutions ✅ DONE (454 references)
Replacing hardcoded hex values with `var()` references in CSS section only (not JS).

**Substitution targets (by frequency):**

| Token | Hex Value | Est. CSS Hits | Status |
|---|---|---|---|
| `--color-primary` | `#0e413b` | ~135 | ✅ |
| `--color-text-secondary` | `#5f6368` | ~92 | ✅ |
| `--color-text-heading` | `#202124` | ~58 | ✅ |
| `--color-border` | `#dadce0` | ~34 | ✅ |
| `--color-surface-secondary` | `#f8f9fa` | ~24 | ✅ |
| `--color-primary-tint` | `#e8f0ee` | ~23 | ✅ |
| `--color-border-subtle` | `#e3e3e3` | ~19 | ✅ |
| `--color-border-separator` | `#f0f0f0` (borders) | ~18 | ✅ |
| `--color-border-light` | `#ebebeb` | ~22 | ❌ not yet |
| `--color-text-tertiary` | `#80868b` | ~19 | ✅ |
| `--color-text-muted` | `#424242` | ~19 | ❌ not yet |
| `--color-primary-hover` | `#1a5c50` / `#1a5c54` | ~13 | ✅ |
| `--shadow-focus` | `rgba(14,65,59,0.2)` | ~5 | ✅ |
| `--color-error-text` | `#c5221f` | ~16 | ❌ not yet |
| `--color-error-bg` | `#fce8e6` | ~9 | ❌ not yet |
| `--color-success-bg` | `#e6f4ea` | ~15 | ❌ not yet |
| `--color-success-text` | `#137333` | ~16 | ❌ not yet |
| `--color-warning-bg` | `#fef7e0` | ~7 | ❌ not yet |
| `--color-warning-text` | `#b06000` | ~6 | ❌ not yet |
| `--color-neutral-bg` | `#e8eaed` | ~19 | ❌ not yet |

**Remaining for Phase 1.2b**: border-light, text-muted, all status colors, neutral-bg (~150 more replacements)

### Step 1.3: Unify duplicate table styles ❌ NOT STARTED
- 6 identical `th`/`td` blocks (`.doc-table`, `.crm-table`, `.products-table`, `.orders-table`, `.invoices-table`, `.crm-stock-table`)
- Extract to shared `.ivh-table th` / `.ivh-table td`

---

## Phase 2 — CSS Consolidation ❌ NOT STARTED

### Step 2.1: Unify near-identical colors
- Primary hover: `#1a5c50` + `#1a5c54` → one token
- Text blacks: `#000` / `#181818` / `#202124` → 2 tokens
- Border grays: 5 values → 3 tokens

### Step 2.2: Unify near-identical reds
- `#c5221f`, `#d93025`, `#ff1818`, `#df0a0a`, `#ff0202` → 2 tokens

---

## Phase 3 — JS Component Library ❌ NOT STARTED

### Builders to create:
- [ ] `_ivhBadge(text, className)` — replaces 20+ manual badge constructions
- [ ] `_ivhAvatar(name, imageUrl, size)` — replaces 7+ avatar patterns
- [ ] `_ivhEmptyState(message)` — replaces 10+ inline empty states
- [ ] `_ivhSectionHeader(label, count, actionLabel, actionFn)` — replaces 6+ section headers
- [ ] Refactor `_crmFa6Icon` to use CSS classes instead of inline `style.cssText`

### `style.cssText` elimination:
- 115 occurrences of inline `style.cssText` in JS
- Convert top ~15 patterns to CSS utility classes
- Priority: FA6 icon inline styles (23x), flex column layouts (8x), empty states (4x)

---

## Phase 4 — Render Function Refactoring ❌ NOT STARTED

### Target functions:
- [ ] `renderCrmOverviewTab` (1,183 lines) — break into sub-functions
- [ ] `renderCrmVendors` card construction — use avatar/badge builders
- [ ] `renderBoard` task cards — use shared card builder
- [ ] `updateStatCards` — extract per-type card builders

---

## Known Issues / Gotchas

### Must NOT touch:
- **JS string literals** — `style.cssText = "...#0e413b..."` must stay as hex until Phase 3
- **HTML attributes** — `onclick`, `style` attributes in HTML markup
- **Invoice PDF generation** — uses `jsPDF` with hardcoded color values (separate concern)
- **Service worker** — needs cache-bust after changes (`sw.js`)

### Inconsistencies to resolve in Phase 2:
- `#000` vs `#181818` vs `#202124` for primary text (pick 1 canonical value)
- `#5f6368` vs `#424242` vs `#606060` for muted text (pick 2 semantic roles)
- `border-radius: 4px` vs `6px` vs `8px` on similar card types
- `font-size: 11px` vs `12px` for section labels (pick 1)

### Data model fields to verify:
- `connectorFeePercent` and `connectorId` are persisted via `saveCrmContact()` ✅
- Google Sheet columns for these new fields may need to be added manually

---

## Tokens Reference (quick lookup)

```
Brand:     --color-primary (#0e413b)  --color-primary-hover (#1a5c50)  --color-primary-tint (#e8f0ee)
Text:      --color-text (#181818)  --color-text-heading (#202124)  --color-text-secondary (#5f6368)
           --color-text-tertiary (#80868b)  --color-text-muted (#424242)  --color-text-subtle (#606060)
Surface:   --color-surface (#fff)  --color-surface-secondary (#f8f9fa)  --color-surface-tertiary (#f1f3f4)
Border:    --color-border (#dadce0)  --color-border-subtle (#e3e3e3)  --color-border-light (#ebebeb)
           --color-border-separator (#f0f0f0)
Status:    --color-success-bg/text  --color-warning-bg/text  --color-error-bg/text  --color-neutral-bg/text
Radius:    --radius-sm (4)  --radius-md (6)  --radius-lg (8)  --radius-xl (12)  --radius-2xl (16)
Shadow:    --shadow-card  --shadow-sm  --shadow-md  --shadow-lg  --shadow-xl  --shadow-focus
Type:      --text-xs (10)  --text-sm (11)  --text-base-sm (12)  --text-base (13)  --text-md (14)
           --text-lg (15)  --text-xl (18)  --text-2xl (20)  --text-3xl (22)  --text-4xl (28)
```
