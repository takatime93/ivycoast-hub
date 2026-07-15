# Loop Design System — Build-Ready Spec

**Source of truth:** `concepts/round2/concept-b-loop.html` (R2 Concept B — "The Loop")
**Token base:** `concepts/round2/hub-tokens.css`
**Production cross-ref:** `index.html` `:root` (lines 37–189)
**Written:** 2026-07-13 · Noa

---

## 0. The one fact that shapes everything below

`concepts/round2/hub-tokens.css` is **byte-for-byte identical** to the production `index.html` `:root` block (lines 37–189). Verified: every token — colors, type scale, spacing, radius, shadows, motion — matches exactly, including the AA-tuning comments (`--color-text-tertiary`, `--color-text-disabled`, `--color-warning-text`, `--color-link-external`).

**Consequence:** The Loop concept adds **ZERO new design tokens.** It is 100% a *component layer* built on the existing production token base. Everything the concept introduces is new CSS *classes* that consume tokens that already ship in production. This makes installation low-risk: no `:root` changes, no AA regressions possible from tokens (they're already AA), and re-skinning = adding a component stylesheet, not editing globals.

Where the concept "diverges" from production is purely in **which components it composes and how** (e.g. one universal `.pipe-filter` segmented pill replacing several bespoke toggles). Those are catalogued in §4.

---

## 1. FOUNDATION TOKENS

All values below are the literal token definitions. Token name → hex/value. These are shared with production verbatim.

### 1.1 Color roles

**Brand / base palette**
| Token | Hex | Role |
|---|---|---|
| `--color-primary` | `#0e413b` | Ivy green — brand, active state, primary button, links |
| `--color-primary-hover` | `#1a5c50` | Ivy green hover |
| `--color-primary-tint` | `#e8f0ee` | Ivy wash — selected row bg, chip bg, tint button, callout-info, today cells |

**Text tiers** (all AA-tuned on white/adjacent surfaces)
| Token | Hex | Contrast note |
|---|---|---|
| `--color-text` | `#181818` | Body default |
| `--color-text-heading` | `#202124` | Headings, tile numbers, drawer title, toast bg |
| `--color-text-primary` | `#181818` | Alias of `--color-text` |
| `--color-text-secondary` | `#5f6368` | 6.05:1 on white — AA |
| `--color-text-tertiary` | `#686d72` | ≥4.69:1 on all text surfaces (AA-fixed from `#80868b`) |
| `--color-text-muted` | `#424242` | Feed text, cal-ev name, draft box |
| `--color-text-subtle` | `#606060` | — |
| `--color-text-disabled` | `#72777c` | 4.52:1 on white (AA-fixed from `#9aa0a6`); done-task strikethrough |
| `--color-text-inverse` | `#fff` | Text on primary/dark surfaces |

**Surfaces**
| Token | Hex |
|---|---|
| `--color-surface` | `#fff` |
| `--color-surface-secondary` | `#f8f9fa` (search input, pipeline column, dev-col bg) |
| `--color-surface-tertiary` | `#f1f3f4` (chart track / prog track / step track) |
| `--color-surface-alt` | `#fafafa` (weekend cells, statement bg, blank cal cells) |

**Borders / dividers**
| Token | Hex | Use |
|---|---|---|
| `--color-border` | `#dadce0` | Default input/ghost-button border |
| `--color-border-subtle` | `#e3e3e3` | Card border (the standard card hairline) |
| `--color-border-light` | `#ebebeb` | Nav rules, card-hd divider, cell borders, table th underline, section tops |
| `--color-border-separator` | `#f0f0f0` | Row-to-row dividers (attn, task, feed, kv, tbl td, doc-row) |
| `--color-hover-tint` | `rgba(0,0,0,0.04)` | Neutral hover wash on clickable rows/search hits/cal-ev |

**Semantic status roles**
| Role | bg token | text token |
|---|---|---|
| Success | `--color-success-bg` `#e6f4ea` | `--color-success-text` `#137333` |
| Warning | `--color-warning-bg` `#fef7e0` | `--color-warning-text` `#9a5400` (AA-fixed) |
| Error | `--color-error-bg` `#fce8e6` | `--color-error-text` `#c5221f` |
| Neutral | `--color-neutral-bg` `#e8eaed` | `--color-neutral-text` `#5f6368` |
| Primary tint | `--color-primary-tint` `#e8f0ee` | `--color-primary` `#0e413b` |
| BLD (Boldoath) | `--color-badge-bld-bg` `#e8eaf6` | `--color-badge-bld-text` `#3f51b5` |
| Stage inactive | `--color-stage-inactive-bg` `#f2f2f2` | `--color-stage-inactive-text` `#353535` |

Bright accents (dots/fills only, not text-on-tint): `--color-success-bright #00a52c`, `--color-error-bright #ff1818`.

**Pipeline stage accents** (used as split-bar/attn-dot fills)
`--color-stage-prospect #3cb1ff` · `--color-stage-outreach #fec553` · `--color-stage-negotiation #ff5e5e` · `--color-stage-active #0e413b`.

**Quality scale** (margin/property bars): `--color-quality-good #00a52c` · `--color-quality-warn #b06000` · `--color-quality-bad #c5221f`.

**Section label:** `--color-section-label #062420` (near-black ivy, mono-uppercase labels).
**Links:** `--color-link #0e413b` · `--color-link-external #1268c4` (AA-fixed).

#### 1.1.1 Typed-event tint system (SETTLE / MONEY / TASK / CONTRACT / LAUNCH)

The Loop's calendar + week strip color-code events by **type**. There is **no dedicated event-tint token set** — the concept maps each event type onto an existing **badge class** (`.bdg-*`), rendered as the small mono-uppercase chip inside the event. The mapping lives in JS (`CAL_TYPE_CLS`, concept line 3074–3077):

| Event type | Label text | Badge class | bg token | text/label token |
|---|---|---|---|---|
| `money` | MONEY | `.bdg-err` | `--color-error-bg` `#fce8e6` | `--color-error-text` `#c5221f` |
| `settle` | SETTLE | `.bdg-warn` | `--color-warning-bg` `#fef7e0` | `--color-warning-text` `#9a5400` |
| `contract` | CONTRACT | `.bdg-prim` | `--color-primary-tint` `#e8f0ee` | `--color-primary` `#0e413b` |
| `launch` | LAUNCH | `.bdg-ok` | `--color-success-bg` `#e6f4ea` | `--color-success-text` `#137333` |
| `task` | TASK | `.bdg-warn` | `--color-warning-bg` `#fef7e0` | `--color-warning-text` `#9a5400` |
| `make` | MAKE | `.bdg-bld` | `--color-badge-bld-bg` `#e8eaf6` | `--color-badge-bld-text` `#3f51b5` |
| `check` | CHECK | `.bdg-stage` | `--color-stage-inactive-bg` `#f2f2f2` | `--color-stage-inactive-text` `#353535` |
| `rhythm` | RHYTHM | `.bdg-neutral` | `--color-neutral-bg` `#e8eaed` | `--color-neutral-text` `#5f6368` |

**Type sort rank** (for ordering multiple events on one day): money 0, settle 1, contract 2, launch 3, make 4, task 5, check 6, rhythm 7 (`CAL_TYPE_RANK`).

> ⚠ **Self-inconsistency to resolve:** `task` and `settle` both map to `.bdg-warn` (identical amber tint) — they are visually indistinguishable in the calendar. If the production system needs 5+ distinguishable event types, `task` should get its own tint (there is no spare AA-safe tint token today; adding one is a *token* change, flag to Taka). The week-strip (`.rhythm-ev`) does NOT use the badge system at all — it hard-codes warning-bg / error-bg (`.hot`) only, so the strip carries less type information than the calendar. That's an intentional density trade in the concept, not a bug.

### 1.2 Type scale

Font families: body/UI `--font-display` (SF Pro Display stack); data/labels `--font-mono` (SF Mono stack). *(Concept declares `@font-face` for Tomato Grotesk on `body`, but every component rule uses the token stacks above; treat Tomato Grotesk as an optional brand-display layer, not load-bearing.)*

Sizes: `--text-xs 10px` · `--text-sm 12px` · `--text-tab 13px` · `--text-md 14px` · `--text-h3 16px` · `--text-lg 24px` · `--text-xl 32px`.
Weights: `--weight-normal 400` · `--weight-medium 500` · `--weight-semibold 600` · `--weight-bold 700`.
Line-heights (fixed px): `--leading-tight 16px` · `--leading-normal 20px` · `--leading-heading-2 30px` · `--leading-heading-1 40px`.
Letter-spacing: `--ls-mono -0.3px` (mono only; everything else default/0).

**Applied pairings (where each is used):**
| Element | size / weight / line-height / ls | font |
|---|---|---|
| Page/view title (`.view-title`, `.p-name`, `.brand-mission-en`) | `--text-lg` 24 / semibold / `--leading-heading-2` 30 / — | display |
| Heading 3 (`.drawer-title`, `.rhythm-num`, `.cal-title`, `.cost-num`, `.ledger-bal`, `.cal-mo-count`, `.stmt-due-amt`) | `--text-h3` 16 / semibold / normal 20 / — | display (mono for `.cost-num`/`.ledger-bal`/`.stmt-due-amt` which carry `--ls-mono`) |
| Brand name (`.brand-name`) | `--text-h3` 16 / semibold / normal 20 | display, `--color-primary` |
| Tile number (`.tile-num`) | `--text-lg` 24 / semibold / `--leading-heading-2` 30 | display |
| Section label (`.sec-label`, `.stage-name`, `.cal-mo-name`, `.stmt-title`) | `--text-xs` 10 / semibold / — / `-0.3px` **UPPERCASE** | **mono** |
| Tile label / column labels (`.tile-lbl`, table `th`, `.kv-k`) | `--text-xs` 10 / medium (th) or normal / `-0.3px` **UPPERCASE** | **mono** |
| Body regular (`.tab`, `.attn-title`, `body`) | `--text-md` 14 / normal / normal 20 | display |
| Body small (`.view-sub`, `.attn-why`, `.task-name`, `.doc-name`, td) | `--text-sm` 12 / normal / `--leading-tight` 16 | display |
| Why-line / subtitle (`.subtle`, `.attn-why`) | `--text-sm` 12 / normal / tight 16 / `--color-text-secondary`|`-tertiary` | display |
| Mono data (`.mono`, amounts, `.num`, `.pcard-amt`, `.feed-t`, `.p-item-bal`) | `--text-xs` 10 (or `.mono-sm` = `--text-sm` 12) / — / `-0.3px` | **mono** |
| JP secondary label (`.tab-jp`, `.p-name-ja`, `.prod-mini-ja`) | `--text-sm` 12 (or xs) / normal / `--color-text-tertiary` | display or mono |

**Label convention (explicit):** every SECTION LABEL and COLUMN/FIELD LABEL is `--font-mono` + `--text-xs` (10px) + `text-transform: uppercase` + `letter-spacing: -0.3px`. Section labels use `--color-section-label #062420` + semibold; field/column labels use `--color-text-tertiary`. This mono-uppercase convention is the single strongest signature of the Loop skin.

### 1.3 Spacing scale

`--space-0 0` · `--space-0-5 2px` · `--space-1 4px` · `--space-1-5 6px` · `--space-2 8px` · `--space-2-5 10px` · `--space-3 12px` · `--space-4 16px` · `--space-5 20px` · `--space-6 24px` · `--space-8 32px`.

**Applied rhythm:**
- **Page gutter:** `28px` horizontal (hard-coded, not a token — header, main, footer all use `28px`); vertical `--space-6` (24) top, `96px` bottom (clears fixed footer).
- **Card padding:** header `--space-4 --space-4 --space-2` (16/16/8); body `--space-2 --space-4 --space-4` (8/16/16). Flush body variant: `0 0 --space-2`.
- **Tile padding:** `--space-3 --space-4` (12 / 16).
- **Row padding:** attn `--space-3 --space-4`; task/feed/doc `--space-2 --space-4`; table td `--space-2 --space-4`; kv `--space-1-5 0`.
- **Grid gaps:** card/section stack `margin-bottom: --space-5` (20); tile grid gap `--space-3` (12); two-col / partners / grow gap `--space-5` (20); pipeline/dev gap `--space-3` (12); calendar month gap `--space-1-5` (6), year gap `--space-1-5` (6).
- **Inline gaps:** default `--space-2` (8); tight metadata `--space-1-5` (6); dot/label `--space-1` (4).
- **Section spacing inside drawer:** `.dsec` `margin-top: --space-5` (20); action bar `margin-top --space-5` + `padding-top --space-4` + top border.
- **Main content max-width:** `1240px`, centered.

### 1.4 Radius / shadow / border

**Radius:** `--radius-sm 4px` (badges, chart bars via 2px inline, prog/track, chip-in-cell) · `--radius-md 6px` (buttons, callouts, kv nothing, drawer-x, inputs) · `--radius-lg 8px` (search, pipeline cards, cal cells, rhythm days, statement, textareas) · `--radius-xl 12px` (cards, tiles, stage columns, dev columns, count chips, entity chips, filter pills) · `--radius-2xl 16px` (available, unused in concept) · `--radius-full 50%` (avatar, dots).

**Shadow scale:**
| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.05)` | Resting card/tile/pcard/prod-mini |
| `--shadow-sm` | `0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)` | (available) |
| `--shadow-md` | `0 2px 4px rgba(16,24,40,.05), 0 4px 12px rgba(16,24,40,.08)` | **Hover** on tile/pcard/prod-mini/formu-card |
| `--shadow-lg` | `0 4px 8px rgba(16,24,40,.06), 0 8px 20px rgba(16,24,40,.10)` | Search popover |
| `--shadow-xl` | `0 8px 16px rgba(16,24,40,.08), 0 16px 40px rgba(16,24,40,.14)` | Drawer, toast |
| `--shadow-focus` | `0 0 0 3px rgba(14,65,59,.28)` | Input/textarea focus glow |

**Border rules:** standard card hairline = `1px solid --color-border-subtle` (#e3e3e3). Structural/container hairlines = `--color-border-light` (#ebebeb). Row-to-row dividers = `--color-border-separator` (#f0f0f0). Interactive inputs/ghost = `--color-border` (#dadce0). Focus ring (2.4.7): `2px solid --color-primary`, offset `2px`, `border-radius: --radius-sm` on `:focus-visible`.

---

## 2. COMPONENT CATALOG

Every rule below is verbatim from the concept. States listed: default / hover / active(selected) / focus-visible / disabled where the component defines them. Focus-visible is GLOBAL (see §1.4) — components don't redefine it unless noted.

### 2.1 Segmented control = `.pipe-filter` inside `.pipe-bar` (ONE component, used everywhere)

**Confirmed:** the トリアージ/ボード/カレンダー mode toggle, the 週/月/年 (W/M/Y) period toggle, the channel filter (ALL/WHOLESALE/CONSIGNMENT/RETAIL/MARKETS), the SELL stage filter, the PARTNERS tabs, the MAKE tabs, and the DOCS category chips are **all the same `.pipe-filter`** button, grouped in a flex `.pipe-bar`. There is no separate segmented-control component. A `·` separator (`<span class="mono muted">·</span>`) is inserted between the period group and the channel group in Today.

```css
.pipe-bar {           /* the group wrapper */
  display: flex; align-items: center; gap: var(--space-2);
  margin-bottom: var(--space-4); flex-wrap: wrap;
}
.pipe-filter {        /* default */
  font-family: var(--font-mono); font-size: var(--text-xs);
  letter-spacing: var(--ls-mono); text-transform: uppercase;
  padding: var(--space-1) var(--space-2-5);   /* 4px 10px */
  border-radius: var(--radius-xl);            /* 12px pill */
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: background var(--motion-fast) var(--ease-out),
              color var(--motion-fast) var(--ease-out),
              border-color var(--motion-fast) var(--ease-out);
}
.pipe-filter:hover { border-color: var(--color-primary); color: var(--color-primary); }
.pipe-filter.active {                          /* selected */
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}
```
Markup: `<div class="pipe-bar"><button class="pipe-filter active">週 W</button><button class="pipe-filter">月 M</button>…</div>`. Selected = add `.active`. No disabled/focus overrides (inherits global focus ring). Labels are bilingual (`JP EN`) and rendered uppercase by CSS.

### 2.2 Filter chip / count chip / entity chip / tab count

**Entity chip** `.chip` (task↔entity, doc links — pill, link-colored):
```css
.chip {
  display: inline-flex; align-items: center; gap: var(--space-1);
  font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono);
  color: var(--color-link); background: var(--color-primary-tint);
  border: none; border-radius: var(--radius-xl); padding: 2px var(--space-2);
  transition: background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
}
.chip:hover { background: var(--color-primary); color: var(--color-text-inverse); }
```
**Tab count** `.tab-count` (nav pill counter): mono `--text-xs`, `background: --color-primary-tint`, `color: --color-primary`, `border-radius: --radius-xl`, `padding: 1px --space-1-5`, `min-width: 18px`, centered. Hot variant `.tab-count.hot` → error-bg / error-text.

### 2.3 Buttons

Base `.btn`:
```css
.btn {
  display: inline-flex; align-items: center; gap: var(--space-1-5);
  font-size: var(--text-sm); line-height: var(--leading-tight); font-weight: var(--weight-medium);
  padding: var(--space-1-5) var(--space-3);       /* 6px 12px */
  border-radius: var(--radius-md);                 /* 6px */
  border: 1px solid transparent;
  transition: background var(--motion-fast) var(--ease-out),
              border-color var(--motion-fast) var(--ease-out),
              color var(--motion-fast) var(--ease-out);
  white-space: nowrap;
}
```
| Variant | default | hover |
|---|---|---|
| `.btn-primary` | bg `--color-primary`, color `--color-text-inverse` | bg `--color-primary-hover` |
| `.btn-ghost` | border `--color-border`, color `--color-text`, bg `--color-surface` | bg `--color-surface-secondary`, border `--color-text-tertiary` |
| `.btn-tint` | bg `--color-primary-tint`, color `--color-primary` | bg `--color-primary`, color `--color-text-inverse` |

**Small action button** `.btn-sm` (the "Create invoice →" / "Open & settle →" / "Open →" / calendar `‹ › 今日`): `padding: var(--space-0-5) var(--space-2)` (2px 8px), `font-size: var(--text-xs)`, `font-family: var(--font-mono)`, `letter-spacing: var(--ls-mono)`. Compose with a variant, e.g. `class="btn btn-primary btn-sm"` or `btn btn-tint btn-sm`.
**Disabled:** `.btn[disabled] { opacity: 0.5; cursor: default; }`.

### 2.4 Stat tile (full anatomy)

```css
.tile {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);               /* 12px */
  box-shadow: var(--shadow-card);
  padding: var(--space-3) var(--space-4);         /* 12px 16px */
  text-align: left;
  transition: box-shadow var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out);
}
.tile:hover { box-shadow: var(--shadow-md); }      /* elevation only; no scale */
.tile-num { font-size: var(--text-lg); line-height: var(--leading-heading-2); font-weight: var(--weight-semibold); color: var(--color-text-heading); }
.tile-num.warn { color: var(--color-warning-text); }
.tile-num.bad  { color: var(--color-error-text); }
.tile-lbl { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); color: var(--color-text-tertiary); text-transform: uppercase; }
.tile-sub { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); color: var(--color-text-tertiary); margin-top: var(--space-1); }
```
**Vertical anatomy (top→bottom):** number (24px) → chart band (optional, see §2.5, `margin-top: --space-2`) → label (`.tile-lbl`, 10px mono) → sub-line (`.tile-sub`, 10px mono, `margin-top: --space-1`). Grid: `.tiles { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: var(--space-3); margin-bottom: var(--space-5); }`. Tile is a `<button>` when clickable.

### 2.5 Chart primitives (pure CSS, token colors only)

**Mini bars** `.tile-chart` (height **36px**) / tall variant `.ana-chart` (height **64px**):
```css
.tile-chart { display: flex; align-items: flex-end; gap: 2px; height: 36px; margin-top: var(--space-2); }
.ana-chart  { display: flex; align-items: flex-end; gap: var(--space-1); height: 64px; margin-top: var(--space-2); }
.tile-bar { flex: 1; min-width: 3px; background: var(--color-primary); border-radius: 2px 2px 0 0; }
.tile-bar.partial { background: var(--color-primary-tint); }   /* current/incomplete period */
```
Bar height set inline as `%` of series max, floored at 3%. X-axis labels: `.ana-x span` mono 10px tertiary, centered.

**Stacked bar** `.tile-stack` (height **10px**) — aging/mix buckets:
```css
.tile-stack { display: flex; height: 10px; border-radius: var(--radius-sm); overflow: hidden; margin-top: var(--space-2); background: var(--color-surface-tertiary); }
.seg-good { background: var(--color-quality-good); }
.seg-warn { background: var(--color-quality-warn); }
.seg-bad  { background: var(--color-quality-bad); }
```
Also used for revenue split via `.split-seg-ivy` (`--color-primary`) / `.split-seg-conn` (`--color-stage-outreach`) / `.split-seg-venue` (`--color-stage-prospect`) in a **10px** `.split-bar`. Segment widths set inline as `%`.

**Step meter** `.tile-steps` (segment height **6px**):
```css
.tile-steps { display: flex; gap: 3px; margin-top: var(--space-2); }
.tile-step { flex: 1; height: 6px; border-radius: var(--radius-sm); background: var(--color-surface-tertiary); }
.tile-step.on { background: var(--color-primary); }
```

**Progress bar** `.prog` (track height **8px**):
```css
.prog { height: 8px; background: var(--color-surface-tertiary); border-radius: var(--radius-sm); overflow: hidden; margin-top: var(--space-2); }
.prog-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-sm); }   /* width % inline */
```

**Margin/property bar** `.margin-track` (height **8px**, in a labeled row): label `.margin-lbl` fixed 168px, track flex-1, value `.margin-val` fixed 110px right-aligned mono. Fill `.margin-fill.good|warn|bad` → quality colors.

All chart primitives carry `role="img"` + descriptive `aria-label` (WCAG text alternative for the visual).

### 2.6 Typed event chip (calendar + week strip)

**Calendar event** `.cal-ev` (a `<button>`), holding a `.bdg` type chip + name:
```css
.cal-ev {
  display: flex; align-items: flex-start; gap: var(--space-1);
  width: 100%; text-align: left;
  padding: 2px var(--space-1); margin-top: 2px;
  border-radius: var(--radius-sm); background: var(--color-surface-secondary);
  transition: background var(--motion-fast) var(--ease-out);
}
.cal-ev:hover { background: var(--color-hover-tint); }
.cal-ev .bdg { flex: none; padding: 0 var(--space-1); }
.cal-ev-name { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); line-height: var(--leading-tight); color: var(--color-text-muted); overflow: hidden; min-width: 0; }
```
The inner type chip is the shared badge `.bdg` (see §2.10) + type class from the §1.1.1 table, e.g. `<span class="bdg bdg-err">money</span>`.

**Week-strip event** `.rhythm-ev` (`<button>`, does NOT use badges — amber default, red hot):
```css
.rhythm-ev {
  display: block; width: 100%; text-align: left;
  font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono);
  line-height: var(--leading-tight); padding: 2px var(--space-1); margin-bottom: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-warning-bg); color: var(--color-warning-text);
  transition: background var(--motion-fast) var(--ease-out);
}
.rhythm-ev.hot   { background: var(--color-error-bg); color: var(--color-error-text); }
.rhythm-ev:hover { background: var(--color-primary); color: var(--color-text-inverse); }
```

### 2.7 Card / secondary card

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);                 /* 12px */
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-5);                   /* 20px stack rhythm */
}
.card-hd { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4) var(--space-4) var(--space-2); }
.card-hd .sec-label { flex: 1; }                   /* mono-uppercase label header, right slot free for meta/action */
.card-bd { padding: var(--space-2) var(--space-4) var(--space-4); }
.card-bd.flush { padding: 0 0 var(--space-2); }    /* for full-bleed rows/tables */
```
**Header treatment:** always a `.sec-label` (mono 10px uppercase, `--color-section-label`) as the leading element; optional right-aligned `.mono.muted` count or a `.btn-sm`. Bilingual label via `bi(en, ja)` → `"En · ja"`.
Secondary/nested container = `.stage-col` / `.dev-col`: `background: --color-surface-secondary`, `border: 1px solid --color-border-light`, `border-radius: --radius-xl`, `padding: --space-2-5`.

### 2.8 Attention / triage row

```css
.attn-item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-separator); }
.attn-item:last-child { border-bottom: none; }
.attn-dot { width: 8px; height: 8px; border-radius: var(--radius-full); margin-top: 6px; flex: none; }
.attn-dot.hi { background: var(--color-error-bright); }     /* high severity */
.attn-dot.md { background: var(--color-stage-outreach); }   /* medium — amber */
.attn-dot.lo { background: var(--color-neutral-text); }     /* low — grey */
.attn-main { flex: 1; min-width: 0; }
.attn-title { font-size: var(--text-md); font-weight: var(--weight-medium); color: var(--color-text); line-height: var(--leading-normal); }
.attn-why { font-size: var(--text-sm); line-height: var(--leading-tight); color: var(--color-text-secondary); margin-top: 2px; }
.attn-act { flex: none; margin-top: 2px; }                  /* right-aligned action (btn-sm) */
```
Anatomy: `[severity dot 8px] · [title (14 medium) / why-line (12 secondary, +2px)] · [action button]`.

### 2.9 Calendar cell + year-strip month cell

**Month cell** `.cal-cell` (min-height **84px**, 56px under 980px):
```css
.cal-cell { border: 1px solid var(--color-border-light); border-radius: var(--radius-lg); background: var(--color-surface); min-height: 84px; padding: var(--space-1-5); }
.cal-cell.blank      { background: var(--color-surface-alt); border-color: var(--color-border-separator); }
.cal-cell.is-weekend { background: var(--color-surface-alt); }
.cal-cell.is-today   { border-color: var(--color-primary); background: var(--color-primary-tint); }
.cal-num { font-family: var(--font-mono); font-size: var(--text-sm); letter-spacing: var(--ls-mono); font-weight: var(--weight-semibold); color: var(--color-text-heading); }
.cal-cell.is-today .cal-num { color: var(--color-primary); }
```
Grid: `.cal-grid { grid-template-columns: repeat(7, minmax(0,1fr)); gap: var(--space-1-5); }`, Monday-start. Day-of-week header `.cal-dow` mono 10px uppercase tertiary centered. State precedence: today > weekend (today wins the tint).

**Rhythm/week day** `.rhythm-day` (min-height **88px**): same today/weekend rules; `.rhythm-num` is `--text-h3` semibold (larger than cal-num).

**Year-strip month** `.cal-mo` (a `<button>`):
```css
.cal-mo { border: 1px solid var(--color-border-light); border-radius: var(--radius-lg); background: var(--color-surface); padding: var(--space-1-5) var(--space-2); text-align: left; transition: border-color var(--motion-fast) var(--ease-out), background var(--motion-fast) var(--ease-out); }
.cal-mo:hover  { border-color: var(--color-primary); }
.cal-mo.active { border-color: var(--color-primary); background: var(--color-primary-tint); }
.cal-mo-name  { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); text-transform: uppercase; font-weight: var(--weight-semibold); color: var(--color-section-label); }
.cal-mo-count { font-size: var(--text-h3); font-weight: var(--weight-semibold); color: var(--color-text-heading); line-height: var(--leading-normal); }
.cal-mo.active .cal-mo-count { color: var(--color-primary); }
.cal-mo-note  { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); color: var(--color-text-tertiary); line-height: var(--leading-tight); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```
Year grid: `repeat(6, minmax(0,1fr))` (3 cols under 980px), gap `--space-1-5`.

### 2.10 Badge / count chip

```css
.bdg {
  display: inline-flex; align-items: center; gap: var(--space-1);
  font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono);
  font-weight: var(--weight-medium);
  padding: 1px var(--space-1-5); border-radius: var(--radius-sm);
  white-space: nowrap; text-transform: uppercase;
}
.bdg-ok      { background: var(--color-success-bg); color: var(--color-success-text); }
.bdg-warn    { background: var(--color-warning-bg); color: var(--color-warning-text); }
.bdg-err     { background: var(--color-error-bg);   color: var(--color-error-text); }
.bdg-neutral { background: var(--color-neutral-bg); color: var(--color-neutral-text); }
.bdg-prim    { background: var(--color-primary-tint); color: var(--color-primary); }
.bdg-bld     { background: var(--color-badge-bld-bg); color: var(--color-badge-bld-text); }
.bdg-stage   { background: var(--color-stage-inactive-bg); color: var(--color-stage-inactive-text); }
```

### 2.11 List row / table

```css
.tbl { width: 100%; }
.tbl th { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); text-transform: uppercase; color: var(--color-text-tertiary); font-weight: var(--weight-medium); text-align: left; padding: var(--space-1-5) var(--space-4); border-bottom: 1px solid var(--color-border-light); }
.tbl td { font-size: var(--text-sm); line-height: var(--leading-tight); padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--color-border-separator); vertical-align: top; }
.tbl tr:last-child td { border-bottom: none; }
.tbl .num { text-align: right; font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--ls-mono); white-space: nowrap; }
.tbl tr.rowlink { cursor: pointer; transition: background var(--motion-fast) var(--ease-out); }
.tbl tr.rowlink:hover { background: var(--color-hover-tint); }
.tbl tfoot td { border-top: 1px solid var(--color-border-light); border-bottom: none; font-weight: var(--weight-semibold); }
```
Generic clickable row pattern (task/feed/doc): flex, `gap: --space-2-5`, `padding: --space-2 --space-4`, `border-bottom: 1px solid --color-border-separator`, `:hover { background: --color-hover-tint }`, `:last-child` no border.

### 2.12 Drawer / panel + overlay

```css
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.28); z-index: 300; opacity: 0; transition: opacity var(--motion-slow) var(--ease-in-out); }
.overlay.open { opacity: 1; }
.drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(560px, 94vw);
  background: var(--color-surface); box-shadow: var(--shadow-xl);
  z-index: 310; transform: translateX(100%);
  transition: transform var(--motion-drawer) var(--ease-emphasized);
  display: flex; flex-direction: column;
}
.drawer.open { transform: translateX(0); }
.drawer-hd { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); border-bottom: 1px solid var(--color-border-light); flex: none; }
.drawer-title { font-size: var(--text-h3); font-weight: var(--weight-semibold); color: var(--color-text-heading); line-height: var(--leading-normal); flex: 1; min-width: 0; }
.drawer-x { width: 28px; height: 28px; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; color: var(--color-text-secondary); font-size: var(--text-h3); line-height: 1; transition: background var(--motion-fast) var(--ease-out); }
.drawer-x:hover { background: var(--color-hover-tint); }
.drawer-bd { flex: 1; overflow-y: auto; padding: var(--space-4); }
```
Internals: key-value row `.kv` (label `.kv-k` fixed **128px** mono-uppercase tertiary; value `.kv-v` flex-1); section `.dsec` (`margin-top --space-5`); action bar `.d-actions` (flex wrap, `margin-top --space-5`, `padding-top --space-4`, top border). Close teardown timeout = **320ms** (matches drawer 300ms + buffer).

### 2.13 Toast

```css
.toast {
  position: fixed; left: 50%; bottom: 56px;
  transform: translate(-50%, 12px);
  background: var(--color-text-heading); color: var(--color-text-inverse);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-xl);
  padding: var(--space-2-5) var(--space-4);
  display: flex; align-items: center; gap: var(--space-3);
  font-size: var(--text-sm); line-height: var(--leading-tight);
  z-index: 400; opacity: 0; pointer-events: none;
  transition: opacity var(--motion-slow) var(--ease-out), transform var(--motion-slow) var(--ease-out);
  max-width: min(560px, 92vw);
}
.toast.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.toast-undo { font-weight: var(--weight-semibold); color: var(--color-text-inverse); text-decoration: underline; flex: none; }
```
Enters by fading in + rising 12px. Dark surface (`--color-text-heading` #202124) with inverse text; undo action underlined.

---

## 3. MOTION SYSTEM

Durations (tokens): `--motion-instant 80ms` · `--motion-fast 120ms` · `--motion-base 200ms` · `--motion-slow 260ms` · `--motion-drawer 300ms`.
Easings: `--ease-out cubic-bezier(0.16,1,0.3,1)` (entrances) · `--ease-in cubic-bezier(0.4,0,1,1)` (exits) · `--ease-in-out cubic-bezier(0.4,0,0.2,1)` (symmetric/overlay) · `--ease-emphasized cubic-bezier(0.2,0,0,1)` (large surfaces, no overshoot).

| Motion | Duration | Easing | Property |
|---|---|---|---|
| Hover / focus / row+tab color shift | `--motion-fast` 120ms | `--ease-out` | background, color, border-color |
| Card/tile elevation on hover | `--motion-fast` 120ms | `--ease-out` | box-shadow (+ transform declared but unused — no scale) |
| Search input focus | `--motion-fast` 120ms | `--ease-out` | border-color, background (+ `--shadow-focus`) |
| Overlay fade | `--motion-slow` 260ms | `--ease-in-out` | opacity 0→1 |
| Drawer slide | `--motion-drawer` 300ms | `--ease-emphasized` | translateX(100%)→0 |
| Toast enter/exit | `--motion-slow` 260ms | `--ease-out` | opacity + translateY 12px→0 |
| Highlight pulse (nav landing) | **1.6s** | `--ease-out` | `@keyframes hlpulse` bg `--color-primary-tint`→transparent, 1 iteration |

**Press feedback:** `--motion-instant` 80ms exists as the micro-press token but the concept does NOT apply an active-scale to buttons (no `:active` transform). If production wants tactile press, add `.btn:active { transform: scale(0.97); transition: transform var(--motion-instant) var(--ease-out); }` — consistent with the token intent.

**Entrances / view transitions:** ⚠ **The concept has NONE.** `render()` (line 2665) clears `mainEl` and rebuilds it synchronously — no stagger, no crossfade, no rise on view/mode switch. The brief's "stagger pattern + cap" and "view/mode transitions (crossfade+rise)" are **aspirational, not present in the source.** The only keyframe in the whole file is `hlpulse`. If we want entrance choreography in production, it must be *authored new* on the token base (recommended: opacity+translateY(8px) over `--motion-base` 200ms `--ease-out`, staggered ~30ms/item capped at ~8 items). Flag to Taka: decide whether Loop ships flat (as designed) or we add motion.

**Reduced motion (WCAG 2.3.3):** global kill-switch, present:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 4. INSTALLATION NOTES

### 4.1 Token reuse — everything already ships

**100% of the Loop's tokens are already in production `index.html :root` (lines 37–189), identical.** There are **ZERO new tokens to add** and **ZERO diverging token values.** Do not touch `:root`. The Loop is a component-layer re-skin, not a token migration.

Verified matching groups (reuse as-is): brand, all text tiers, surfaces, borders, hover-tint, all status roles, BLD badge, quality, links, pipeline stages, section-label, full type scale, spacing, radius, shadows, focus ring, complete motion system, transition aliases.

### 4.2 New CSS the concept introduces (component classes, not tokens)

All classes in §2 (`.pipe-bar/.pipe-filter`, `.tile*`, `.tile-chart/-stack/-steps`, `.prog*`, `.cal-*`, `.rhythm-*`, `.attn-*`, `.pcard`, `.stage-col`, `.dev-col`, `.formu-card`, `.stmt*`, `.split-*`, `.chip`, `.bdg*`, `.btn*`, `.card*`, `.drawer/.overlay/.kv`, `.toast`, `.doc-row`, `.p-item*`, `.ledger-bal`, `.margin-*`, `.fx-*`, `.brand-*`, `.write-ta`, `.guide-*`, etc.). Ship these as a single new stylesheet.

### 4.3 Superseded production classes (old → new)

The concept intentionally *consolidates*. When re-skinning a production view, replace:

| Production concept (bespoke toggles/pills) | Loop replacement |
|---|---|
| Any per-view segmented toggle / view-switcher / period selector / channel filter / category tab | **single `.pipe-filter` in `.pipe-bar`** (§2.1) — one component for all six use-sites |
| Bespoke stat/KPI cards | `.tile` + `.tile-chart/-stack/-steps/-sub` (§2.4–2.5) |
| Ad-hoc status pills | `.bdg-*` set (§2.10) |
| Ad-hoc side panels | `.drawer` + `.overlay` + `.kv`/`.dsec`/`.d-actions` (§2.12) |
| Existing `.btn` variants that differ | `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-tint` / `.btn-sm` (§2.3) |

> The exact production class names to retire depend on the target view being migrated; audit each view against §2 and map its bespoke pill/card/panel to the Loop equivalent at migration time. The rule of thumb: **if production has more than one segmented-control implementation, all of them collapse to `.pipe-filter`.**

### 4.4 WCAG AA check

Because the token base is identical to production (which was explicitly AA-tuned, per the in-file comments), **no color token softens contrast — AA is preserved.** Specific pairings I verified against the AA-tuned tokens:
- `.pipe-filter` default text `--color-text-secondary` (#5f6368, 6.05:1 on white) ✓; active state inverse-on-primary ✓.
- All `.bdg-*` and typed-event chips use the AA-fixed text tokens (`warning-text #9a5400 5.38:1 on warn-bg`, `error/success/neutral` all AA) ✓.
- `.tile-lbl` / labels use `--color-text-tertiary` (#686d72, ≥4.69:1) ✓ — but at **10px mono uppercase** this is small; keep it label-only (non-essential per WCAG 1.4.3 large-text exemption doesn't apply at 10px, but tertiary passes AA normal-text on white anyway).
- `.cal-mo-note` / `.rhythm-note` / `.tile-sub` at `--color-text-tertiary` on white/tint = AA-passing.

**One thing to watch (not a token softening, a usage note):** the SETTLE vs TASK collision (both `.bdg-warn`, §1.1.1) is an *information* problem, not a contrast one — both are AA. No AA remediation needed; only the disambiguation decision in §1.1.1.

### 4.5 Recommended rollout: scoped `.loop` foundation, install once

Because tokens are shared and only components change, the safe pattern is a **component-scope wrapper**, not a global replace:

1. Ship the Loop component CSS behind a `.loop` root scope: `.loop .card { … }`, `.loop .pipe-filter { … }`, etc. Apply `class="loop"` to a migrated view's container.
2. Un-migrated views keep their existing classes and render unchanged — no global class is overwritten, so nothing breaks mid-migration.
3. Migrate view-by-view (Today → Sell → Partners → Make → Grow) by wrapping each in `.loop` and swapping bespoke pills/cards/panels to the §2 catalog.
4. Once every view is under `.loop`, drop the scope prefix and promote the component CSS to global, deleting the retired bespoke classes.
5. **Never** re-declare `:root` tokens in the Loop sheet — reference the existing ones. This guarantees a single source of truth and keeps AA intact.

This lets us install the full system once, build every slice on it, and never break an un-migrated view.

---

## Appendix — counts & self-inconsistencies

**Documented:**
- **Foundation tokens:** 78 (`:root` custom properties: 9 brand+text-extra, 9 text, 4 surface, 5 border/hover, 3 success, 2 warning, 3 error, 2 neutral, 2 BLD, 3 quality, 2 link, 6 stage, 1 section-label, 6 font, 7 size, 4 weight, 5 leading/ls, 11 space, 6 radius, 6 shadow, 3 focus, 5 motion-duration, 4 easing, 3 transition-alias). All reused from production; 0 added.
- **Components:** 13 catalogued (segmented control, filter/entity/count chip, buttons, stat tile, chart primitives ×5 grouped, typed event chip, card, attention row, calendar cells, badge, list/table, drawer, toast) + the sub-primitives inside each.
- **Motion specs:** 8 distinct (hover/focus, elevation, search focus, overlay, drawer, toast, hlpulse, reduced-motion) + 1 unused token (`--motion-instant`) + explicit "no entrances/no view-transition" finding.

**Self-inconsistencies flagged:**
1. `task` and `settle` event types both map to `.bdg-warn` — visually identical in the calendar; needs a distinct tint (a *token* addition) if 5 types must be separable.
2. Week strip (`.rhythm-ev`) ignores the badge type system entirely (amber/red only) while the calendar (`.cal-ev`) uses full typed badges — the two event surfaces carry different amounts of type info by design.
3. Brief asks for stagger/crossfade/rise entrance motion; **the concept has none** — only `hlpulse`. Any entrance choreography is net-new work, not extractable from source.
4. `--radius-2xl` (16px) and `--motion-instant` (80ms) are defined but unused by the concept.
5. Tomato Grotesk `@font-face` is declared on `body` but every component rule uses the `--font-display`/`--font-mono` token stacks — treat brand font as optional display layer.
6. Page horizontal gutter is a hard-coded `28px` (header/main/footer), NOT a spacing token — if strict token-purity is wanted, introduce a `--gutter: 28px` at install.
