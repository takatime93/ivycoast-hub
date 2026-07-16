# Ivycoast Hub — Design System (canonical source of truth)

**Status:** authoritative · supersedes ad-hoc styling decisions
**Companion:** [`design-tokens.json`](./design-tokens.json) (machine-readable token layer, DTCG 2025.10)
**Grounded in:** `concepts/round2/concept-b-loop.html` (the Loop foundation) · production `index.html :root` + gallery · `docs/migration/design-logic-reference.md` (Material 3 / Polaris / HIG / Primer) · `docs/migration/ux-interaction-principles.md`
**Author:** Jude (iris-design) · 2026-07-13

> Read this once and you should **compose** every new page and object from the finite catalog below — never design one from a blank canvas. If you find yourself inventing a color, a spacing, or a component shape, stop: the answer is almost always "alias an existing token" or "branch an existing object." The rare, justified exception has a governance path (§7).

---

## 1. Principles & the cascade model

### 1.1 The mental model — the app is a finite catalog

The Hub is **not** a set of hand-designed screens. It is:

- a **finite set of TOKENS** (the primitives: color, space, type, radius, shadow, motion, control-height),
- composed into a **finite set of OBJECTS** (card, tile, badge, seg, button, input, list row, board card, side panel, confirm modal, toast… §4),
- arranged by a **finite set of CONCEPTS / LAYOUTS** (dashboard grid, board, master–detail, toolbar, form, list/table, detail side-sheet, empty page, split-preview… §5).

**A new page is composition, not invention:** pick a layout → place objects into it → remove what you don't need → branch an object only if a genuine variant is required (§6). This is the un-stuck rule.

### 1.2 The three token tiers = the cascade

We use the industry-standard three-tier token architecture (W3C DTCG 2025.10 stable; the same tiering Polaris, Material 3, and Primer use). **The tiers ARE the cascade.**

| Tier | What it is | Example | Who consumes it |
|---|---|---|---|
| **1 · Reference** (`ref.*`) | Raw, context-free values. The cascade root. | `ref.color.ivy.900 = #0e413b` | Only semantic tokens. **Never a component directly.** |
| **2 · Semantic** (`sem.*`) | Roles/intent — *what a value means*. **The layer you edit to re-theme.** | `sem.color.primary → {ref.color.ivy.900}` | Objects and layouts. |
| **3 · Component** (`cmp.*`) | Per-object knobs. *What a value does here.* | `cmp.btnPrimary.bg → {sem.color.primary}` | One object each. |

**How a change cascades (build once → refine at the source):**

```
edit ref.color.ivy.900  →  sem.color.primary updates  →  cmp.btnPrimary.bg,
cmp.seg.indicatorBg, cmp.listRow.selBar, sem.eventTint.contract, sem.sell.invoiced…
all update  →  every button, seg, selected row, contract chip, Invoiced column
on every page refines. One edit. Whole app.
```

**The hard rule that makes the cascade real:** *objects consume semantic tokens; semantic tokens alias reference tokens.* No component ever hard-codes a hex, a raw px, or a duration. If a component references a raw value, the cascade is broken at that point — that's a bug (see §6.4 audit).

### 1.3 The composition rule

> **New page = place existing objects into an existing layout; remove or arrange, don't invent.**

Grounded in Material's *canonical layouts* ("use canonical layouts rather than inventing structure") and Apple HIG consistency ("things that look the same behave the same"). A page that reuses the toolbar + list + detail side-sheet pattern is instantly familiar, instantly accessible (the patterns are already AA), and free to build.

### 1.4 The branching model (base → variant)

Branching = extending a base object/concept, inheriting its tokens + structure, overriding **only** the specific properties that differ. Like a subclass.

Two ways to branch, in order of preference:

1. **Token branch (preferred):** re-alias one component token to a different semantic token. *Example:* the board card `cmp.pcard` is a branch of `cmp.card` — same anatomy, it just points `radius → ref.radius.lg` instead of `xl` and adds a `borderHover`. The nested "subdued" container `cmp.cardSubdued` is a branch that re-points `bg → sem.color.surfaceSecondary`. **No structural fork, no new hex.**
2. **Structural branch (rare):** add/remove a slot in the anatomy while keeping the token wiring. *Example:* the Sell pipeline column is the board column with a stage-accent left-bar slot added, wired to `sem.sell.*`.

If a "new" object can't be expressed as a branch of an existing one, that's a governance decision (§7), not a free choice.

### 1.5 The five standing laws (why the system feels premium)

Distilled from the design-logic reference; every rule in §2–§5 traces to one of these:

1. **8-pt grid, 4-pt half-steps.** Every gap/pad/offset is a multiple of 4. A raw `7px`/`13px`/`15px` is a bug. (Primer/Material/Polaris.) *One sanctioned exception: the 28px page gutter.*
2. **One primary action per view.** Exactly one filled button; everything else bordered or text; ≤2 filled per card. (Primer/Polaris.)
3. **Color is signal, not decoration.** Neutral canvas; strong color only for status/priority/brand-active. (Polaris.)
4. **Proximity = relationship.** Tighten within a group, widen between groups; whitespace defines groups, not borders. (Polaris.)
5. **Uppercase/mono is a label accent, never body.** Reserved for section eyebrows, column/field labels, badges, IDs, SKUs, amounts. (Material label role.)

### 1.6 Loading & entrance pattern (standing rule)

> **Skeleton while loading → opacity-only fade when ready. Nothing slides, nothing staggers.**

- Every data-backed content area shows a **skeleton** (§4.21) shaped like the content it replaces while its data loads — never a spinner, never a blank region.
- Areas reveal **independently, each as its own data is ready** — methodical, area-by-area. A slow collection never holds the whole page hostage.
- Content replaces its skeleton via a **subtle opacity-only fade** (`motion-fade-in`, `base` 200ms, `out` easing). **No slide, no `translateY`, no per-child stagger entrances** — these were built and then removed (2026-07-13, owner's call); the `motion-rise` keyframes are deliberately neutralized to opacity-only in production. Don't reintroduce them.
- Hover/active/paging **micro-interactions are unaffected** — tile hover elevation, `:active` press, calendar paging fades, tab-panel fades all stay.

**Why:** skeleton-then-fade is the premium-SaaS loading convention (perceived performance: the page's structure is visible instantly); calm beats choreography — an ops tool opened many times a day shouldn't perform an entrance; and the owner explicitly rejected slide/stagger after seeing it live.

### 1.7 Vertical rhythm law (THE spacing reference — owner round-2, 2026-07-16)

> **Every vertical gap between page-level blocks is one of the named slots below. A gap that isn't in this table is a bug.** QA checks surfaces against this table. This is law 4 (proximity = relationship) given exact values so no page has to guess.

| # | Slot — the gap between… | Value | Why |
|---|---|---|---|
| R1 | page header block (`.page-hd`) → what follows | **48px** | the one page-scale breath (grid-clean 12×4; still a raw value in `.page-hd` — tokenization rides DS_HARDENING_PLAN). **`.page-hd-tight` → `--space-4`** when a tab-strip/toolbar *continues* the title block (Products, Customers). |
| R2 | tab-strip → toolbar | `--space-4` (16) | strip + tools are one working group |
| R3 | toolbar → content (table / grid / board) | `--space-5` (20) | tools stand off from the data they operate on |
| R4 | card → card in **grids** | `--space-4` (16) | one value per context type — never mix R4/R5 in one view |
| R5 | card → card in **stacks** | `--space-5` (20) | section rhythm (= §2.3 card→card stack) |
| R6 | section-title / sec-label → its content | `--space-3` (12) | a title belongs to its block (tighten within) |
| R7 | label → control | `--space-2` (8) | tightest pair; supersedes §2.3's 4–8 range — the slot is 8 |
| R8 | kv row → kv row | `--space-2-5` (10) vertical | dense but scannable key-value lists |

**Application rules:**
- The slots govern **page-level vertical rhythm** (header → strip → toolbar → content → sections → cards). *Within-component* padding stays §2.3's applied-rhythm table.
- **Same relationship = same slot on every page.** Customers title→search must equal Docs title→search must equal Orders. Cross-page inconsistency in the same slot is the defect class this law exists to kill (owner round-2: spacing "used incorrectly in many many places").
- Drawer / panel / modal **interiors follow the same slots** (mostly R5/R6/R7/R8) — §4.11 surfaces are not exempt.
- **One element owns each gap** — prefer `margin-bottom` on the block above (or the parent's `gap`); never split a slot across two elements' margins.
- New values require a new row in this table (governance §7.6) — don't invent a ninth slot inline.

---

## 2. Foundation — TOKENS

All values below are the live `:root` tokens (identical in the Loop concept and production `index.html`, byte-for-byte, plus the production-only additions flagged **★PROD**). These are the atoms you edit to cascade. Full machine layer in [`design-tokens.json`](./design-tokens.json).

### 2.1 Color

**Reference families (Tier 1) → semantic roles (Tier 2).** Edit a reference hex to shift the whole family; edit a semantic alias to re-map a role.

**Brand / ivy**
| Semantic role | Ref value | When / why |
|---|---|---|
| `primary` | `#0e413b` | Brand. Active state, primary button fill, links, selected-row bar, seg indicator. The one strong color. |
| `primaryHover` | `#1a5c50` | Hover on primary surfaces only. |
| `primaryTint` | `#e8f0ee` | Ivy wash: selected row/chip bg, info callout, today cell, tint button. The "gentle selected" surface. |
| `sectionLabel` | `#062420` | Near-black ivy for mono-uppercase section eyebrows (semibold). |

**Text tiers** (all AA-tuned — do not soften)
| Role | Value | Contrast / use |
|---|---|---|
| `text` | `#181818` | Body default. |
| `textHeading` | `#202124` | Headings, tile numbers, drawer title; also the dark toast/tooltip surface. |
| `textSecondary` | `#5f6368` | 6.05:1 on white. Subtitles, why-lines, seg-option default. |
| `textTertiary` | `#686d72` | ≥4.69:1. **Labels only** at 10px (column/field labels, meta). |
| `textMuted` | `#424242` | Feed/calendar-event text. |
| `textDisabled` | `#72777c` | 4.52:1. Disabled/strikethrough. |
| `textInverse` | `#fff` | On primary/dark surfaces. |

**Surfaces** — white = primary content, grey = secondary/subdued (Polaris).
`surface #fff` · `surfaceSecondary #f8f9fa` (nested columns, search) · `surfaceTertiary #f1f3f4` (chart/track) · `surfaceAlt #fafafa` (weekend/blank cells).

**Borders / dividers** — pick *one* separator per context (border **or** shadow, never both — Material elevation restraint).
`border #dadce0` (interactive input/ghost) · `borderSubtle #e3e3e3` (**standard card hairline**) · `borderLight #ebebeb` (structural/container) · `borderSeparator #f0f0f0` (row-to-row) · `hoverTint rgba(0,0,0,.04)` (neutral row hover).

**Semantic status** — the entire status vocabulary. Do not invent a new tone; if one fits, reuse it (Polaris badge restraint).
| Role | bg | text | Meaning |
|---|---|---|---|
| success | `#e6f4ea` | `#137333` | positive / paid / growth |
| warning | `#fef7e0` | `#9a5400` | needs attention / due soon |
| error | `#fce8e6` | `#c5221f` | overdue / destructive / money-out |
| neutral | `#e8eaed` | `#5f6368` | informational / off |
| **settle ★PROD** | `#e0f2f1` | `#00695c` | settled money (teal) — see §2.1.1 |
| BLD | `#e8eaf6` | `#3f51b5` | Boldoath (kept distinct from semantic set) |
| stage-inactive | `#f2f2f2` | `#353535` | dormant pipeline stage |

Bright accents (dots/fills only, never text-on-tint): `successBright #00a52c`, `errorBright #ff1818`.
Links: `link #0e413b` · `linkExternal #1268c4` (5.52:1, AA).
Pipeline stage accents (dots/bars): `stageProspect #3cb1ff` · `stageOutreach #fec553` · `stageNegotiation #ff5e5e` · `stageActive #0e413b`.
Quality scale (margin bars): `qualityGood #00a52c` · `qualityWarn #b06000` · `qualityBad #c5221f`.

#### 2.1.1 Typed-event & Sell-stage tint systems (★PROD — resolved from the concept)

The Loop concept color-codes calendar events by **type** by aliasing each type to a badge tint. The concept had a defect: `task` and `settle` both mapped to amber (`.bdg-warn`) — indistinguishable. **Production resolved it** by adding the `settle` teal pair. The canonical map (`sem.eventTint.*`):

| Type | bg / text role | Type | bg / text role |
|---|---|---|---|
| money | error | make | BLD |
| settle | **settle (teal)** | check | stage-inactive |
| contract | primaryTint / primary | rhythm | neutral |
| launch | success | task | warning |

The **Sell pipeline** got a parallel 5-stage identity system (`sem.sell.*`), each stage = accent (header/left-bar/dot) + soft bg (column wash) — a branch of the semantic-stage concept:

| Stage | accent | bg |
|---|---|---|
| New | amber `#9a5400` | `#fef7e0` |
| Invoiced | ivy `#0e413b` | `#e8f0ee` |
| Paid | green `#137333` | `#e6f4ea` |
| Packing | warm-orange `#b3541e` | `#fdeee2` |
| Shipped | teal `#00695c` | `#e0f2f1` |

> **Why this matters for the cascade:** these tint sets are *semantic aliases*, not raw hex in components. To recolor "settled money" everywhere (badge, calendar chip, ledger), edit `sem.color.settleBg/Text` once.

### 2.2 Type scale

Families: body/UI `font-display` (SF Pro Display stack); data/labels/IDs `font-mono` (SF Mono stack). Tomato Grotesk is an optional brand-display layer only — not load-bearing.

Sizes: `xs 10` · `sm 12` · `tab 13` · `md 14` · `h3 16` · `lg 24` · `xl 32`.
Weights: `normal 400` · `medium 500` · `semibold 600` · `bold 700`.
Line-heights (fixed px): `tight 16` · `normal 20` · `h2 30` · `h1 40`.
Tracking: `mono -0.3px` (mono only).

**Named roles (5 — reference the ROLE, never a raw size+weight).** Material: use a defined type scale with named roles; don't free-style sizes.

| Role (`sem.typeStyle.*`) | size / weight / lh | font / case | Used for |
|---|---|---|---|
| `pageTitle` | 24 / semibold / 30 | display | View titles, tile numbers, entity names |
| `heading` | 16 / semibold / 20 | display (mono if it's an amount) | Drawer title, card sub-headings, big counts |
| `body` | 14 / normal / 20 | display | Default body, row titles |
| `bodySmall` | 12 / normal / 16 | display | Subtitles, why-lines, table cells, names |
| `label` | 10 / medium / 16 · `-0.3px` **UPPERCASE** | **mono** | Section eyebrows, column/field labels, badges, seg options, IDs, SKUs, amounts |

**The single strongest signature of this skin:** every section label and column/field label is `label` role — mono, 10px, uppercase, `-0.3px`. Section labels use `sectionLabel` + semibold; field/column labels use `textTertiary`. **Do not put uppercase/mono on headings, buttons, or body** — that reads cheap (Material label-role restraint, design-logic §11).

### 2.3 Spacing

`0 · 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 32` (tokens `space-0`…`space-8`). Everything is a multiple of 4 except the **28px page gutter** (the one sanctioned exception).

**Applied rhythm (the layout logic):**
| Context | Value | Why |
|---|---|---|
| Page gutter (H) | 28px | header/main/footer aligned |
| Card body pad | 16 (`space-4`) | Polaris default card pad |
| Card→card stack | 20 (`space-5`) | section rhythm |
| Tile pad | 12 / 16 | dense but comfortable |
| Row pad | 8 / 16 (list), 12 / 16 (attn) | scannable rows |
| Label→input | 4–8 | tight = related (proximity) |
| Field→field | 16 | distinct fields |
| Section gap in card | 20–24 | widen between groups |
| Major region gap | 24–32 | Material region spacing |
| Inline (icon↔label) | 4; (meta) 6; (default) 8 | proximity ladder |
| Main content max-width | 1240px, centered | — |

**Proximity is the tool:** tighten within a group, widen between groups (Polaris). This is *why* spacing feels intentional, not the raw numbers.

**Page-level vertical gaps (header→strip→toolbar→content→sections→cards) are governed by the §1.7 rhythm law** — this table covers within-component padding only.

### 2.4 Radius / shadow / border / motion / control-height

**Radius:** `sm 4` (badge, small track) · `md 6` (button, input, callout) · `lg 8` (board card, cal cell, textarea) · `xl 12` (**card, tile, seg, column, chip**) · `2xl 16` (available) · `full 50%` (avatar, dot).

**Shadow (elevation scale — restraint: card gets EITHER border OR shadow emphasis, calm always):**
`card` = resting card/tile · `md` = hover elevation · `lg` = popover · `xl` = drawer + toast · `focus` = input focus glow (`0 0 0 3px rgba(14,65,59,.28)`).

**Border rules:** standard card = 1px `borderSubtle`; structural container = `borderLight`; row divider = `borderSeparator`; interactive input/ghost = `border`. **Focus ring (WCAG 2.4.7):** `2px solid primary`, offset `2px` on `:focus-visible` — global, objects inherit it (some inset it to `-1px` on tight rows).

**Motion:** durations `instant 80 · fast 120 · base 200 · slow 260 · drawer 300`; easings `out (0.16,1,0.3,1)` entrances · `in (0.4,0,1,1)` exits · `inOut (0.4,0,0.2,1)` symmetric · `emphasized (0.2,0,0,1)` large surfaces. Full motion table in §4.16. **All motion is killed under `prefers-reduced-motion` (WCAG 2.3.3) via a global switch — non-negotiable.**

**Control-height scale ★PROD (`--control-h-*`):** the rule that makes toolbars look engineered. Every interactive control snaps to one height; controls in a row share it.
| Token | px | Use |
|---|---|---|
| `control-h-sm` | 30 | inline segs, filter chips, small buttons |
| `control-h-md` | 38 | **default:** buttons, inputs, selects, header toggles |
| `control-h-lg` | 44 | hero inputs, primary CTAs |

> 30/38/44 aren't on the 8-grid, and that's intentional — they're comfortable **hit-region** heights (44 = Apple HIG min touch target; all exceed WCAG 2.5.8's 24px). Control height is a distinct axis from spacing; keep it on this named scale, not the space scale.

### 2.5 Token naming grammar (write it down so it can't drift)

A token name is **a sentence with a fixed grammar**, not a free-form label (Nathan Curtis / EightShapes, "Naming Tokens in Design Systems"; Spectrum's *Context → Common-unit → Clarification*). Reading **general → specific, left → right**, the ordered levels are:

```
namespace · category · concept · property · variant · state · scale
```

Include **only** the levels a token needs; **never reorder** them. The fixed order is what lets the system add its 200th token without a collision or a "where does this go?" judgment call.

| Level | Meaning | Our real examples |
|---|---|---|
| **namespace / tier** | `ref` / `sem` / `cmp` | `ref`, `sem`, `cmp` |
| **category** | the token's domain | `color`, `space`, `size`, `radius`, `shadow`, `duration`, `easing`, `control`, `typeStyle` |
| **concept / family** | the named thing in the category | ref: `ivy`, `ink`, `paper` · sem: `primary`, `surface`, `text`, `error` · cmp: `card`, `btnPrimary`, `seg` |
| **property** | which aspect (mostly cmp) | `bg`, `border`, `color`, `radius`, `padX`, `indicatorBg` |
| **variant** | a branch of the concept | `Secondary`, `Tertiary`, `Subtle`, `Light` |
| **state** | interaction state — **always a suffix** | `Hover`, `Active`, `Selected`, `Disabled` |
| **scale** | numeric/t-shirt step (ref only) | `900`, `600`, `050`, `sm`, `md`, `lg`, `xl` |

**Tier-specific rules:**
- **`ref.*` — name for *what it is* (the menu).** Family + scale: `ref.color.ink.600`, `ref.space.4`, `ref.radius.lg`. **Never put a role word in a ref name** (`ref.color.ivy.900`, never `ref.color.brand`).
- **`sem.*` — name for *why* (the intent/role), camelCase.** Role + optional variant + state-suffix: `sem.color.textSecondary`, `sem.color.primaryHover`, `sem.color.borderSubtle`. **Never put a hue or a raw value in a sem name** (`sem.color.link`, never `sem.color.ivy` or `sem.color.green`).
- **`cmp.*` — name for *where/what it does here*, camelCase.** Object + property: `cmp.btnPrimary.bg`, `cmp.card.radius`, `cmp.listRow.selBar`.

**Flatness is law (anti "token-fatigue"):** max **2 semantic segments** (`role` + optional `variant`), state as a **suffix**, never compound-nested. We write `surfaceSecondary`, never `color-background-surface-secondary-inverse-hover`. This one rule inoculates us against the deep-name disease the token-fatigue literature documents.

**The deliberate mixed-scale convention — do NOT "correct" it.** Two scale systems coexist *on purpose*:
- **Color** uses a **numeric ramp** (`ink.600`, `ivy.900`, `line.050`) — a perceptual lightness scale where 900 = darkest. Zero-pad to 3 digits (`050`, `900`) so it sorts correctly.
- **Dimensions** (`size`, `radius`, `control`) use a **t-shirt scale** (`sm/md/lg/xl`) where a numeric ramp would be false precision on a handful of discrete steps.

Mixing them is *justified* (perceptual ramp vs discrete steps), not an inconsistency — it is written here so a future contributor doesn't unify them. The sanctioned **named one-offs** (`space.gutter` 28px, `space.0-25` 1px, `radius.seg` 10px) follow the same logic: a single geometric value with no ramp gets a descriptive name, not a forced scale slot.

**`:root` mirror.** The JSON `ref/sem/cmp` paths are the logical model; the production `:root` custom properties implement them (`--color-primary`, `--motion-drawer`, …). The single-source-of-truth rule (§7.3): a token added to one **must** be added to the other, and no `:root` name may exist without a JSON token behind it.

---

## 3. How to read the object & layout catalogs

Every object entry gives: **anatomy** (slots top→bottom or left→right) · **tokens consumed** (which `cmp.*`/`sem.*`) · **variants / branches** · **rules of use** (grounded) · **how to branch**. Every layout entry gives: **grid/structure** · **spacing logic** · **when to use** · **placement thinking** · **responsive** · **branching**. States are default / hover / active(selected) / focus-visible / disabled where defined; focus-visible is global (§2.4) unless noted.

---

## 4. OBJECTS — the finite component catalog

### 4.1 Card (`cmp.card`) · Subdued card (`cmp.cardSubdued`, branch)
- **Anatomy:** `card` → `card-hd` (mono-uppercase `label` eyebrow, flex:1, optional right-slot count/`btn-sm`) → `card-bd` (16px pad; `.flush` = 0 pad for full-bleed tables/rows). Order is fixed: **title → meta → body → actions** (Polaris/Material anatomy).
- **Tokens:** bg `surface`, border `borderSubtle`, radius `xl`, shadow `card`, stack-gap `space-5`.
- **Branches:** `cardSubdued` (nested container `.stage-col`/`.dev-col`) re-aliases bg→`surfaceSecondary`, border→`borderLight`, pad→10px. **Never nest a `card` inside a `card`** — use a subdued section instead (design-logic §5).
- **Rules:** one border style, one shadow token; ≤2 filled buttons; use a card to group concepts scanned/acted-on as a unit, a plain row for a flat list — don't wrap every row in a card.
- **Branch how:** re-point bg/border/pad component tokens; keep the header/body slots.

### 4.2 Stat tile (`cmp.tile`)
- **Anatomy (top→bottom):** number (`pageTitle` role, 24) → optional chart band (§4.5) → label (`label` role, 10 mono) → optional sub-line (`label`, +4px).
- **Tokens:** same as card but pad 12/16, adds `shadowHover → md`. Grid: `repeat(auto-fit, minmax(150px,1fr))`, gap 12.
- **States:** hover = elevation to `shadow-md` only (no scale). Clickable tile is a `<button>`.
- **Variants:** `tile-num.warn` (warning text), `.bad` (error text) for at-a-glance status.
- **Branch how:** to make a "KPI tile with delta," add a delta slot after the number; keep tile tokens.

### 4.3 Badge / status chip (`cmp.badge`)
- **Anatomy:** inline-flex, optional leading dot, `label` role text, 1px/6px pad, radius `sm`.
- **Variants (the whole vocabulary):** `ok · warn · err · neutral · prim · bld · stage · settle`. Each = a status bg+text pair from §2.1. **Do not add a tone if one fits** (Polaris). One word, past tense.
- **Branch how:** a new typed tint = add a `sem.eventTint.*`/status alias, then a `.bdg-x` that consumes it — never a raw hex on the badge.

### 4.4 Segmented control (`cmp.seg`) vs Filter chip (`cmp.fchip`)
Two DISTINCT objects — pick by selection model. This is the elevation the owner demanded ("filters must feel like toggles, not four flat pills").

- **`seg` — single-select (one active at a time).** `role="tablist"`, sliding `seg-indicator` (`primary` fill, animated `transform`+`width` over `base`/`emphasized`), options are `role="tab"` with `aria-selected`. Bg `surfaceSecondary`, border `border`, radius `xl`, 3px inset pad, `control-h-sm`. Option text = `label` role, `textSecondary` default → `textInverse` on active; `:active` scale 0.97 (micro-press). Used for: mode toggle, period (W/M/Y), channel filter, stage filter, view switchers — **all use-sites are this one object.**
  **STATE-CONTRACT RULE (owner-caught defect, 2026-07-15):** the seg has ARIA *variants* — tablist (`aria-selected`), toggle group (`aria-pressed`) — and every state style MUST select on ALL variant markers (`[aria-selected="true"], [aria-pressed="true"], .active`), never just one. The W/M/Y period seg shipped with dark-on-dark selected text because the inverse-text rule matched only `aria-selected`. Generalized: **when a component has variants, its state selectors are part of the component contract — a variant that needs its own state CSS is a fork, and forks are defects.**
- **`fchip` — multi-select (independent toggles).** `aria-pressed`, radius `xl` pill, tick-dot that fills on select, selected = `primaryTint` bg + `primary` border/text. Used when several filters can be on at once.
- **Rule:** if it's "choose one of N," it's `seg`; if it's "toggle any of N," it's `fchip`. Never a row of flat identical pills for a single-select.

### 4.5 Chart primitives (`.tile-chart` / `-stack` / `-steps` / `.prog` / `.margin-track`)
Pure-CSS, token colors only. Mini-bars (h36) / tall (h64): `tile-bar` = `primary`, `.partial` = `primaryTint` (current period). Stacked bar (h10): quality good/warn/bad or revenue split (`primary`/`stageOutreach`/`stageProspect`). Step meter (h6): `on` = `primary`. Progress (h8): fill = `primary`. Margin bar: fill `good/warn/bad`. **All carry `role="img"` + descriptive `aria-label`** (WCAG 1.1.1 text alternative — color/height must never be the only signal).

### 4.6 Buttons (`cmp.btnPrimary` / `btnGhost` / `btnTint` / `.btn-sm`)
- **Base:** inline-flex, `bodySmall` weight-medium, 6/12 pad, radius `md`, `control-h-md`.
- **Tiers (design-logic §3):** **primary** (filled `primary`, one per view) → **ghost** (bordered, secondary) → **tint** (soft ivy, low-emphasis affirmative) → **text/`btn-sm`** (mono, compact inline "Open →").
- **States:** each has real hover; `[disabled]` = opacity .5, no pointer. Optional `:active { scale .97 }` micro-press (`instant`).
- **Order rule:** dialog = Cancel-left / **Confirm-right**; in-page form = **Save bottom-left** (design-logic §3). Never disable Save on invalid — validate on submit.

### 4.7 Inputs / select / textarea (`cmp.input`)
- **Anatomy:** label **above** (visible, not placeholder), then control. `min-height control-h-md`, border `border`, radius `md`, pad 0/10, size `tab`, focus = `shadow-focus` glow + ring.
- **Rules (design-logic §7):** one left edge per column; stack fields vertically (inline only for genuinely paired fields); 16px field-gap, 4–8px label→input; mark required once at top; hint text quiet + inline.

### 4.8 List row (`cmp.listRow`) · selectable list item (`.p-item`)
- **Anatomy:** flex, gap 10, pad 8/16, `borderSeparator` bottom divider (last none), hover `hoverTint`. Selectable variant adds a 2px left-bar (`primary`) + `primaryTint` bg when `.sel`.
- **Use:** flat lists of like items; master list in master–detail (§5.3). `<button>` when it selects/opens.

### 4.9 Board / pipeline card (`cmp.pcard`, branch of card)
- **Anatomy:** top row (type tag `ptag` + id) → title → 1–2 meta lines → optional per-card state indicator. Radius `lg`, own `borderHover`, `.spotlight` = `primary` border.
- **Rules (design-logic §6):** title + 1–2 meta max, don't cram; overflow detail to the side-sheet; 1 primary per card, rest in a hover "…". Card body stays **neutral** — stage color is a small dot/left-bar, never a filled card.

### 4.10 Board column (`.stage-col`, = `cardSubdued`) + Sell-stage branch
- **Anatomy:** subdued container → `stage-hd` (mono-uppercase `stage-name` + `stage-sum` count, quiet — label style, not a colored banner) → stacked pcards → **empty state per empty column** (never a blank gap). Grid `.pipe`: `repeat(4|N, minmax(0,1fr))`, gap 12, → 2-col under 980px.
- **Sell branch:** adds a stage-accent left-bar/dot wired to `sem.sell.*.accent` + soft column wash `sem.sell.*.bg`.

### 4.11 Panel & modal pattern family (`cmp.panel`, `cmp.confirm`) — three named patterns, one mechanism

Side panels and confirmation modals are **reusable tokenized patterns**, not per-surface implementations. There are exactly **three** — pick by the decision rule below, then compose (§4.11.4). Build once → every surface consumes the pattern; tune one token → every panel in the app changes.

**Decision rule (which pattern):**
- **Record/detail view on a wide window → docked side panel (§4.11.1).** Order, contact, invoice, product, person, event — the canonical record surface.
- **Narrow screen (<768px), OR focus must be captured → overlay side panel (§4.11.2).** Same panel content, blocking. A docked panel **degrades to** overlay automatically under 768px (§4.11.1 fallback) — you rarely invoke overlay directly; you invoke *docked* and it becomes overlay when it must.
- **Irreversible / destructive transactional confirm → confirmation modal (§4.11.3).** Generate settlement, delete, anything you can't undo.

> **Never open a record in a center modal.** Records are side panels (docked, or overlay when narrow). Center modals are reserved for the transactional confirm (§4.11.3) — a bounded, focus-trapped decision, not a browsing surface.

#### 4.11.1 Docked side panel — **reflow, non-blocking** (default record surface)
- **Anatomy:** `panel-hd` (title `heading` role + ✕ close) → `panel-bd` (scroll; `kv` rows = 128px mono-uppercase label + flex value; `dsec` sections at +20px) → `panel-actions` bar (top border, Cancel-left/Confirm-right).
- **Behavior contract (ux-interaction-principles §1; Material *standard* side sheet):**
  - **Reflow, not overlay.** Docking the panel **changes the app's column layout** — the main view is pushed tighter to the left (content reflows via `padding-right` = panel width). The panel is not painted *over* content; it sits *beside* it.
  - **Non-blocking.** The list/board behind stays **fully interactive** — no scrim, no `pointer-events:none` on the app on desktop. You can scroll, filter, and click the list with the panel open.
  - **Swap, don't close.** Clicking **another** record with a panel already open **swaps** the panel's content in place — it does not close-then-reopen. (Re-resolve-on-render: a re-render while docked re-reads the selected record.)
  - **Dismiss:** ✕ button, `Esc`, or clicking a UI action that navigates away. Not dismissed by clicking the list (that swaps).
  - **Width:** `cmp.panel.width` = `min(540px, 94vw)` — comfortable, never collapses the list below usable width.
  - **Motion:** slide `transform: translateX(100%)→0` over `cmp.panel.motion` (`drawer` 300ms / `emphasized`); reflow padding animates in step. Reduced-motion → instant (no slide, no reflow tween); the state change still applies.
  - **Focus:** panel is not a focus trap (non-blocking) — focus **moves to** the panel title on open for SR/keyboard, but `Tab` can still reach the list. On close, focus returns to the triggering row.
- **<768px fallback — degrades to overlay (§4.11.2):** below 768px there isn't room to reflow, so the *same* docked panel becomes a **blocking overlay** — scrim appears, app gets `pointer-events:none`, panel slides over content, focus **is** trapped. Same DOM, same content; only the mode flips. This is why a surface only ever wires up "docked" — the narrow-screen overlay is free.

#### 4.11.2 Overlay side panel — **scrim, blocking** (narrow / focus-capture)
- **Anatomy:** identical to §4.11.1 (`panel-hd` / `panel-bd` / `panel-actions`). Same content, blocking presentation.
- **Behavior contract:**
  - **Scrim over the app.** `cmp.panel.scrim` (`ref.color.scrim` `rgba(0,0,0,0.28)`) fades in over the whole app; the app gets `pointer-events:none`. The panel slides **over** content — no reflow.
  - **Blocking.** The list/board behind is **not** interactive while open — this is the point (capture focus, or there's no room to reflow).
  - **Swap-don't-close still holds** where a list is reachable (e.g. focus-capture on a wide screen), but on narrow screens the list is behind the scrim, so open→act→close is the usual loop.
  - **Dismiss:** ✕, `Esc`, **or clicking the scrim** (blocking variant only). Scrim fades over `cmp.panel.motionScrim` (`slow` 260ms).
  - **Focus: trapped.** Focus moves into the panel and is held (Tab cycles within); on close, returns to the trigger. (WCAG 2.4.3 — a blocking surface owns the tab ring.)
- **When to invoke directly:** almost never — you invoke *docked* and let the <768px fallback produce this. Invoke overlay explicitly only on a wide screen when you deliberately need to **capture focus** (a modal-weight sub-flow that is still panel-shaped, not a confirm).

#### 4.11.3 Confirmation modal — **center, blocking, transactional** (`cmp.confirm`)
- **Use:** only irreversible/destructive/consequential confirms (generate settlement, delete, discard). Not for records (§4.11.1), not for forms (those are pages/panels).
- **Anatomy:** center card (`cmp.confirm.width` ~420px, `cmp.confirm.radius`, `cmp.confirm.shadow`) over `cmp.confirm.scrim` → heading (`heading` role) → one line of consequence copy → action bar: **Cancel-left / Confirm-right**; destructive Confirm uses the error/destructive button style.
- **Behavior contract (matches the shipped `showConfirm`):**
  - **Promise-based, focus-trapped.** Resolves to a boolean; focus enters the modal and is trapped; on close, returns to the trigger.
  - **Keys:** `Esc` = Cancel (resolve false); `Enter` = the default action. The default is **Cancel** for destructive confirms (don't let `Enter` fire a delete) — Confirm is default only for non-destructive/benign confirms.
  - **Scrim:** `cmp.confirm.scrim` fades over `slow`; clicking the scrim = Cancel.
  - **One decision.** No scrolling body, no browsing — a bounded question with two answers. If it needs a form, it's a panel, not a confirm.
  - **Motion/focus:** scrim fade + card scale/opacity in over `base`; reduced-motion → instant. Focus trap is non-negotiable.

#### 4.11.4 How a new surface consumes the pattern (composition recipe)
You do **not** copy selectors. The generic mechanism (consolidation target below) is driven by **two classes + one body class**:

1. Mark the panel element `class="side-panel" data-mode="docked"` (or `data-mode="overlay"` to force the blocking variant on a wide screen).
2. Toggle **one body class**, `body.panel-open`, when a record is selected. That single class runs the reflow (docked) or scrim (overlay) — the app doesn't need to know *which* surface opened it.
3. On select, write the panel's content into `panel-bd`; on selecting another record, **rewrite the content** (swap) — do not toggle `panel-open` off/on.
4. For a confirm, don't build a modal — `await showConfirm({ title, message, destructive })` (the implementation's key is `message`, not `body`).

That's the whole contract. A new record surface (say, a returns record) opens on-system with the two classes + the body class; it inherits reflow, swap, `Esc`/✕, the <768px overlay fallback, focus rules, and reduced-motion for free.

#### 4.11.5 Consolidation plan — collapse the per-surface docks onto one mechanism
- **Today (branches to retire):** the dock is implemented **per surface** — `body.crm-dock-open`, `body.person-dock-open`, `body.ivy-dock-open`, the product-detail dock, and the order-detail dock (being converted now). Each carries its own scrim / `pointer-events` / reflow-padding / `<768px` selectors. Consumers: CRM record panel, product detail, person drawer, order detail, Ivy chat dock. Same mechanism, five copies.
- **Target (implement 1:1):** **one** generic mechanism —
  - **`body.panel-open`** — the single state class that drives reflow (desktop docked), scrim + `pointer-events:none` (overlay / `<768px`), and the width variable the app reflows against. Replaces all of `crm-dock-open` / `person-dock-open` / `ivy-dock-open` / the product + order dock body classes.
  - **`.side-panel[data-mode="docked"]`** — reflow, non-blocking, no scrim (§4.11.1). Default.
  - **`.side-panel[data-mode="overlay"]`** — scrim, blocking, focus-trapped (§4.11.2). Also the computed mode under the `<768px` media query regardless of authored `data-mode`.
  - Reflow reads **`cmp.panel.width`**; scrim reads **`cmp.panel.scrim`**; slide reads **`cmp.panel.motion`**; scrim fade reads **`cmp.panel.motionScrim`**. The old `cmp.drawer.*` tokens fold into `cmp.panel.*` (the record-panel width is promoted from the CRM one-off to **the** panel width; see JSON).
  - Confirm stays its own object (`cmp.confirm.*` + `showConfirm`) — a modal is not a side panel.
- **Sanctioned branch — the Ivy chat dock keeps its own width.** Chat is a **persistent, narrower** companion, not a transient record panel — it aliases **`cmp.panel.widthChat`** (`--ivy-dock-w`, `min(420px, max(320px, 15vw))`) instead of `cmp.panel.width`. It still rides `body.panel-open` + `.side-panel[data-mode="docked"]` for reflow/scrim/motion; only the width token diverges. This is a **token branch** (§6.2), not a structural fork — legitimate because chat's role (always-available assistant) genuinely differs from a record detail (open→read→dismiss).
- **Migration:** re-point each surface's markup to the two classes + `body.panel-open`; delete the five per-surface body classes and their duplicated selectors; retire `cmp.drawer.*` per the deprecation path (§7.8) once grep shows zero consumers. This is an `index.html` CSS/JS pass — out of scope for this token/spec pass; the mechanism above is specced so that pass can implement it 1:1.

### 4.13 Toolbar / filter bar (`.sell-toolbar` template)
- **Anatomy (one template for every index page):** `[primary action + related] … flexible spacer … [filter cluster: selects · search]`. Every control normalized to `control-h-md`, one radius, `space-*` gaps — nothing floats.
- **Rules (design-logic §4):** one primary action at a stable end; applied filters render as removable `fchip`s; overflow past ~5 controls into a menu; identical bar on Orders/Contacts/Invoices/Tasks. Cross-page controls (Sync) live in the **global header**, not repeated per toolbar (ux §6).
- **Search-to-create (ux-principles §8):** when a list search matches NOTHING, the filtered-to-zero region shows a light "no match for '{q}'" line + a `＋ Create "{q}"` primary button that opens the surface's add-modal prefilled with the typed name — the dead-end becomes the add-flow. Shipped on all three surfaces (2026-07-15): Customers (`#customers-create-hook` in `renderCrmCustomers`), Partners rail (`#partners-rail-createhook` in `_applyPartnersRailFilter` — orgs/people aware), Products (`#products-create-hook` via `_productsCreateHook`, JA-aware prefill). Distinct from the §4.15 whole-page empty (no data at all), which keeps its own guidance + action.

### 4.14 Help-tip "?" (`cmp.helpTip`) — progressive disclosure
- Replaces always-on page subtitles. 18px light-grey mono "?" beside the title; dark tooltip on **hover AND focus** (keyboard-accessible, `tabindex`, dismiss on blur/leave). Motion killed under reduced-motion. This is the standard page-header pattern (ux §4).

### 4.15 Empty state (`cmp.emptyState`) — ⚠ needs upgrade
- **Target anatomy (Polaris §10):** (optional icon) → short heading → one line of guidance → primary action. Encouraging tone ("Add your first contact"), never "No data." Full treatment for whole-page empties; light version for board columns.
- **Current gap:** production `.empty-state` is centered text only (no heading/action). **Reconcile — see §7 gaps.**

### 4.16 Toast (`cmp.toast`)
Bottom-center, dark `textHeading` surface + inverse text, radius `lg`, `shadow-xl`. Enters fade-in + rise 12px over `slow`. Undo action underlined. Status dot variants ok/err/info. Non-blocking, auto-dismiss.

### 4.17 Nav tab (`cmp.navTab`) · count-chip / tab-count
- **Tab:** `text-tab` (13), `textSecondary` → `primary` active with underline. **Count-chip:** mono `xs`, `primaryTint` bg / `primary` text, radius `xl`, min-width 18px; `.hot` = error tint for urgent counts.

### 4.18 Table (`cmp.table`) — the tokenized tabular object

Tables appear on nearly every index surface — invoice list, receipts, orders (legacy), partner stock, batch history, customers, docs, archive. Each used to hand-roll its own row heights and paddings. **The table is now a first-class tokenized object:** one anatomy, two density variants that branch via a single row-geometry token pair, so tuning `cmp.table.rowH` (or flipping a table to `rowHCompact`) re-densifies **every** table in the app from one edit (owner directive, 2026-07-14). This is the list/table layout of §5.6; seat it full-bleed in a card via `card-bd.flush`.

- **Anatomy (top→bottom):**
  - **`thead` → header row** — one row of `th` column labels; `cmp.table.thStyle` type role, `cmp.table.thText` colour, a `cmp.table.headerBorder` underline (heavier than the body divider) seating the header on the body.
  - **`tbody` → body rows** — the data. Each row = `cmp.table.rowH` tall (`rowHCompact` in the compact variant), cells padded `cellPadY`/`cellPadX`, `cmp.table.divider` bottom rule (last row none).
  - **`tfoot` → footer row (optional)** — totals/summary; top border + `semibold`, money cells follow the same numeric rule as the body.
  - **Cell slots (per column):** each `td` is one of the column types below — the table's glanceability comes from every column obeying its type's alignment/format contract, not from per-cell styling.

- **Column-type rules (the glanceability contract — this is the craft):**
  | Column type | Alignment | Format | Token / role |
  |---|---|---|---|
  | **text** (name, title, contact) | left | `tdSize`/`tdText`, ellipsis past ~260px (`.cell-ellipsis`) | `cmp.table.tdText` |
  | **money / numeric** (total, price, qty, %) | **right** | **`cmp.table.numFont` (mono) + `tabular-nums`** so digits column-align down the stack | `.num-cell` |
  | **date** | left (right if it's the only numeric col) | muted — `textSecondary` | `sem.color.textSecondary` |
  | **status** | left | **badge slot** — a `cmp.badge`, never bare coloured text (§4.3 vocabulary) | `cmp.badge.*` |
  | **actions** | **right** | icon buttons; **hover-revealed** where the row is otherwise read-only (reduce resting noise) | — |

  > **Why right-align + mono for money (Baymard / accounting convention):** right-aligned tabular figures make magnitude scannable down a column (the decimal points and digit columns line up); left-aligned or proportional money defeats the one job of a numeric column. `font-variant-numeric: tabular-nums` is non-negotiable on any numeric column.

- **Density variants (branch via one token):**
  - **default** — `rowH → {ref.control.lg}` (~44px), `cellPadY {space-2-5}` / `cellPadX {space-3}`. The scannable, comfortable table (docs, invoice list, orders, customers, products, batch history). This is `.ivh-table`.
  - **compact** — `rowH → rowHCompact {ref.control.md}` (~38px), `cellPadYCompact {space-2}` / `cellPadXCompact {space-1-5}`. For dense, many-row inline tables (partner stock `crm-stock-table`, invoice line-items `inv-line-items`). **A table opts into compact by aliasing its row-geometry to the `*Compact` tokens — no structural fork.**
  - Row height lives on the **control-height scale**, not the space scale — a row height is a hit-region axis (a clickable row is a target), same rationale as inputs/buttons (§2.4). This is *why* one token re-densifies everything: change `cmp.table.rowH` and every default table's rows resize together.

- **States:**
  - **row hover** — `cmp.table.hoverBg` (`surfaceSecondary` wash) over `hoverMotion`/`ease`. (Note: this is the stronger table wash, distinct from the neutral `hoverTint` used on flat list rows §4.8 — see reconcile #8.)
  - **selected row** — `cmp.table.selBg` (`primaryTint`), matching selection everywhere else (list row, chip). For tables whose row opens a record.
  - **clickable-row affordance (`tr.rowlink`)** — the whole row is a hit target that opens the docked record panel (§4.11.1); `cursor:pointer`, hover wash, and the row is keyboard-reachable (a real control, not a bare `<tr>` with a click handler). Invoices/customers/orders/products rows are `rowlink`.
  - **sortable-header affordance (minimal)** — a sortable `th` is `cursor:pointer`, gets a quiet sort-arrow glyph (▲/▼) on the active column and a `primaryTint`/`primary` `.sorted` tint; hover → `primary`. Keep it minimal — one active arrow, no per-column chrome. (Docs table is the reference.)
  - **sticky header (long tables)** — for tables that scroll past a viewport, `thead th` is `position:sticky; top:0` with the table's own surface bg so labels stay visible while the body scrolls. Apply only to genuinely long tables; short tables don't need it.
  - **disabled/empty cells** — never blank; use a muted `—` (`textDisabled`).

- **Companions (a table never ships alone):**
  - **skeleton** — every data-backed table pairs with `.skel-table` (§4.21): flex rows of 14px cells (`.skel-table-cell`, `-sm` capped 80px for narrow columns), matched to the table's column rhythm so the swap doesn't jump. Shown on load, `hideSkeleton(id)` on render, content fades in (§1.6).
  - **empty state** — an empty table shows the empty-state pattern (§4.15: heading + guidance + primary action), never a bare header over nothing. A filtered-to-zero table shows the light "no results" line.

- **Rules (with reasons):**
  - Money/numeric columns are **always** right-aligned mono tabular — magnitude scannability (Baymard).
  - Status is **always** a badge slot, never coloured text — reuses the closed status vocabulary (§4.3), keeps colour = signal (law 3).
  - **One border system:** the header underline is heavier than row dividers; rows use `divider` only — no vertical rules, no full grid (Polaris/Material data-table restraint; grid lines add noise, whitespace + one divider defines rows).
  - Every table is composed inside `card-bd.flush` (full-bleed in a card) or as the §5.6 list/table layout — never a naked `<table>` on the canvas.
  - **No zebra striping on data tables.** Striping ships in exactly one place (`formula-oils-table`, a Formulator recipe sub-table) and is deliberately *not* promoted — a row divider + hover already delimit rows; app-wide zebra would fight the neutral-canvas law (law 3). Don't add a stripe token.

- **Branch how (recipe):**
  1. **Density branch (preferred):** to make a table compact, alias its rows to `rowHCompact` + the `*Compact` pad tokens — one re-alias, no new selectors (this is how `crm-stock-table` relates to `.ivh-table`).
  2. **Column-set is data, not a branch:** a table with different columns is the *same* object with different `th`/`td` slots — not a new table.
  3. **Structural branch (rare):** add a slot only if the anatomy genuinely differs (e.g. an expandable detail row). Keep the token wiring; never a new hex or raw px.
  4. To re-tint every table's hover or header at once, edit the `sem.*` role the `cmp.table.*` token aliases — not the component.

### 4.19 Avatar / presence · Entity chip
Avatar = `radius-full`, initials or image. Presence dot = `radius-full`, status-bright color. **Entity chip** `.chip` = link-colored mono pill (`primaryTint` bg → `primary` fill on hover) for task↔entity / doc links.

### 4.20 Calendar cell / typed-event chip
Month cell (h84): today (`primary` border + `primaryTint`) > weekend (`surfaceAlt`) precedence; `cal-num` mono semibold. Typed event `.cal-ev` = a badge (§2.1.1 tint) + name. Week-strip day (h88) `.rhythm-day`; year-strip month `.cal-mo` button (hover/active border → `primary`). Grid `repeat(7, minmax(0,1fr))` Monday-start / year `repeat(6…)`.

### 4.21 Skeleton loader (`cmp.skeleton`)
- **Anatomy:** one static placeholder block per data area (`#orders-skeleton`, `#customers-skeleton`, `#products-skeleton`, `#documents-skeleton`, `#crm-vendors-skeleton`, the board loading block), composed of `.skel` shimmer shapes **matched to the geometry of the content they replace** — never generic bars, never a spinner.
- **Shape variants (compose, don't invent):** text (`.skel-text` h14, `-short/-med/-long` 40/65/90%) · circle · card (radius `lg`, pad 16) · row (`.skel-row`, `borderSeparator` divider) · **table** (`.skel-table-row`: flex rows of 14px cells, `-sm` capped 80px — mirrors §4.18) · **vendor grid** (`.skel-vendor` h140, radius `xl`, in the card grid's own `auto-fill minmax(260px,1fr)`) · **board** (`.skel-board` → `.skel-col` columns of h72 `.skel-task` blocks — mirrors §5.2).
- **Tokens:** shimmer = a 90° gradient across the neutral grey surface tier, animating `background-position` (`skel-shimmer`, 1.5s infinite); default radius `sm`. ⚠ *Cascade gap:* the gradient stops (`#f0f0f0`/`#e0e0e0`) and the `.skel-table-row` divider (`#f5f5f5`) are raw hex in production — alias them to `sem` surface/border roles when the token gate lands (§6.4).
- **Lifecycle:** the skeleton is visible on load; each area's renderer calls `hideSkeleton(id)` (display:none) the moment its own data renders, and the incoming content fades in per §1.6. Areas resolve **independently** — Orders can be live while Documents still shimmers.
- **Reduced motion:** the global reduced-motion switch (§2.4) strips the **infinite shimmer** (animation forced to one 0.001ms pass) — the skeleton degrades to static placeholder blocks; content still appears (WCAG 2.3.3).
- **Rules:** every data-backed area gets one; match the target layout's shapes and rhythm so the swap doesn't jump (no layout shift); a typical page of placeholders (3–6 rows / 6 cards), not a full screen of noise.
- **Branch how:** a new area's skeleton = compose existing `.skel-*` shapes inside the target layout's own grid. Add a shape class only if the geometry genuinely differs (structural branch, §6.2) — never a new color.

---

## 5. CONCEPTS / LAYOUTS — the finite page patterns

Each is a grid you drop objects into. **Placement thinking is the value** — the grid is easy; knowing *what leads, what clusters, what's subdued* is the craft.

### 5.1 Dashboard grid (`.tiles` + `.two-col`)
- **Structure:** stat-tile band (`repeat(auto-fit, minmax(150px,1fr))`, gap 12) on top → `.two-col` (`minmax(0,1fr) 340px`, gap 20) main + rail below.
- **Thinking:** KPIs lead (scannable numbers first, Miller-style chunking); primary work in the wide column, secondary context in the 340px rail; cards stack at 20px rhythm.
- **Responsive:** `.two-col` → single column under 980px; tiles reflow by auto-fit. **Branch:** drop the rail (`.two-col`→single) for a focused page.

### 5.2 Board / pipeline (`.pipe` + `.stage-col`)
- **Structure:** `repeat(N, minmax(0,1fr))` columns, gap 12; each = subdued column (quiet header: name + count) → pcards → per-column empty state.
- **Thinking (design-logic §6):** mostly-neutral canvas; color only as small stage dot/left-bar; consistent card rhythm; make it read as a **connected flow** (stage accent identity + per-card state indicators showing done vs missing — ux §5), not disconnected boxes.
- **Responsive:** → 2-col under 980px. **Branch:** Sell pipeline = add stage-accent bar/wash from `sem.sell.*`.

### 5.3 Master–detail (`.partners-grid` + docked side panel)
- **Structure:** `300px minmax(0,1fr)` — master list (selectable `.p-item` rows) left, detail right; OR list full-width + record opens the right-docked **docked side panel** (§4.11.1, reflow/non-blocking).
- **Thinking (design-logic §8, Material list-detail canonical):** list stays visible and interactive; selecting **swaps** the detail (§4.11.1); panel width (`cmp.panel.width`) stays comfortable and never collapses the list below usable width.
- **Responsive:** under 768px the docked panel degrades to the **overlay** variant (§4.11.2, scrim/blocking) — list, then detail as overlay. **Branch:** any record surface (orders, contacts, invoices, products, person) reuses this via the two-class + `body.panel-open` recipe (§4.11.4).

### 5.4 Toolbar / filter-bar (§4.13)
The standing filters/search row for a list surface. Same template everywhere → §4.13. Sits BELOW the page header (§5.10) — page-level modes/actions live in §5.10, list-level filters live here.

### 5.5 Form layout
- **Structure:** single left edge, labels above, fields stacked vertically (inline only for paired fields), fieldset groups for related fields; 16px field-gap, 8px label→input; Save **bottom-left**.
- **Thinking (design-logic §7):** the eye travels one left edge top→bottom; grouping via whitespace; required marked once; advanced fields behind a disclosure (progressive disclosure, §9 of design-logic). This is the fix for "inputs stacked with no logic."

### 5.6 List / table (§4.18)
Flat like-items in a table inside a `card-bd.flush`; or plain rows (§4.8). Filters/search/sort belong to the list (Polaris index pattern); saved views live in the tab strip.

### 5.7 Detail side-sheet (§4.11.1)
The docked (reflow, non-blocking) right panel. The canonical record view — reused across every entity via the composition recipe (§4.11.4). Degrades to overlay (§4.11.2) under 768px.

### 5.8 Empty page (§4.15)
Full-treatment empty state centered in the content region: heading + guidance + primary action.

### 5.9 Split-preview (form ⇄ live preview)
- **Structure:** two-column — input/config left, live-computed preview right (e.g. Formulator margins, invoice preview). Preview updates on input.
- **Thinking:** preview is `cardSubdued` (secondary); inputs lead; the preview is a read-only mirror, so it uses display type + charts, no controls.
- **Branch:** any "configure → see result" surface.

### 5.10 Page header (`.page-hd`) — title LEFT · seg CENTER · actions FAR RIGHT
**THE standard top-of-page row** (owner call, 2026-07-15 — "consistent with the page layouts"). Three zones on one flex row:
- **Left:** page title (h2) + the `"?"` help-tip (§4.20) — never a paragraph subtitle. `flex-shrink:0`.
- **Center:** the sliding **seg** (§4.5 — `.seg` + `.seg-indicator` + `.seg-opt`, count-chips only where the number is a *signal*) holding the page's view modes. `flex:1; justify-content:center`. If the page has no modes, the zone is empty and the title/actions still hold their edges.
- **Far right:** the page's actions — ONE primary (law §1.5), rightmost at the page edge; ghost/secondary actions sit to its left. `flex-shrink:0`.
- **Structure:** `.page-hd` > (title row · `.page-hd-center` · `.page-hd-right`); 48px below. `.crm-header-row/-center/-right` are the original CRM instance's aliases (same rules) until its markup is renamed.
- **TRUE centering rule (2026-07-15):** the title zone and the actions zone carry EQUAL flex weight (`flex: 1 1 0`; right zone `justify-content: flex-end`), the center zone is `flex: 0 1 auto` — so the seg sits on the PAGE centerline, not the center of the leftover space between two unequal sides. Never give the side zones `flex-shrink: 0` fixed widths.
- **Thinking:** modes are *navigation within the page* → they sit centered like the app's tab strip, visually distinct from *filters* (which belong to the list they filter, §5.6/§4.13, in a toolbar BELOW the header). Primary action lives at the page's far corner — one consistent place to look on every page.
- **Responsive:** under 1100px the seg drops to its own full row below title+actions (wraps, h-scrolls if still tight).
- **Instances:** Partners, Orders, Tools, Docs (all on `.page-hd` as of 2026-07-15). Products/Customers/Brand/Tasks share the unified `.page-title` but keep simpler header rows until they gain view modes.

#### 5.10.1 THE TWO-SWITCHER RULE (owner call, 2026-07-15 — "two styles is fine, just not all over the place")
Exactly TWO switcher components exist. Pick by what the options ARE, never by taste:
1. **Sliding seg (§4.5, `.seg`)** — the options are **VIEW MODES of one surface** (different renderings/sub-surfaces, small fixed set). Instances: Partners 取引先/People/Pipeline/Archive · Orders pipeline/orders/reports/invoices/receipts · Tools 配合/材料 · Docs ドキュメント/Boldoath · Products Grid/Table · Today overview/calendar + period. Static segs sync via `_syncStaticSeg()`; rebuilt segs follow the renderSellFilterBar pattern. Counts = `.count-chip` (auto-hides when empty).
2. **Underline tab-strip (`.product-subtabs`)** — the options are **CATEGORIES/SAVED VIEWS over the same data list** (counts per bucket, can grow with the data). Instance: Products All/Soap/Candle/Accessories/Gift Set/In Development. Sits BELOW the page title, above the filter toolbar.
The flat `.pipe-filter` pill row and the attached-button pair (`.product-view-toggle`) are RETIRED — do not reintroduce. One page title everywhere: `.page-title` (font-display · text-xl · semibold · heading color); `.crm-title`/`.sell-title` are aliases pending markup rename.

---

## 6. Composition & extension — building without inventing

### 6.1 Build a new PAGE (step-by-step)
1. **Name the job.** Is it: overview → §5.1 · a flow/lifecycle → §5.2 · browse+inspect records → §5.3 · create/edit → §5.5 · a flat list → §5.6 · configure→preview → §5.9?
2. **Pick that layout.** Copy its grid. Don't tune widths — use the layout's column ranges.
3. **Place objects** from §4 into the slots (toolbar → filter-bar template; rows → list-row; detail → drawer). Reuse, don't restyle.
4. **Remove** unused slots (drop the rail, drop a column). Removal is composition; addition is not.
5. **Apply the five laws** (§1.5): one primary action, neutral canvas, 8-pt spacing, proximity grouping, mono/uppercase only on labels.
6. **Branch only if needed** (§6.2). Otherwise you're done.

### 6.2 Build a new OBJECT (branch, don't fork)
1. Find the nearest existing object (§4).
2. **Token branch first:** re-alias its `cmp.*` tokens to different `sem.*` roles (e.g. new stage color = new `sem.sell.*` alias, then point the column's accent at it). No new hex.
3. **Structural branch only if** the anatomy genuinely differs — add/remove a slot, keep the token wiring.
4. If it's neither a token nor structural branch of anything → it's a *new catalog entry*: governance (§7).

### 6.3 Theme / re-skin (the cascade in action)
- Re-brand: edit `sem.color.primary` (+ hover/tint) → every button, seg, selected state, link, contract chip, Invoiced stage updates.
- Retune a status: edit `sem.color.settleBg/Text` → badge + calendar chip + Shipped stage + ledger all shift.
- Densify a surface: swap its layout's gap tokens; objects unchanged.
- **Never** edit a value inside a component to theme — edit the semantic alias.

### 6.4 The cascade-integrity audit (run before shipping any surface)
- [ ] No raw hex in any component — only `sem.*`/`ref.*` references.
- [ ] **No raw literal (px / hex / duration / rgba) in ANY `cmp` token — alias a `ref` primitive.** The only sanctioned literals in the whole `cmp` tier are the two panel-width one-offs: `cmp.panel.width` (`min(540px,94vw)`, the record panel) and `cmp.panel.widthChat` (`min(420px,max(320px,15vw))`, the sanctioned Ivy-chat branch) — a `min()`/`max()` clamp has no reusable primitive. A raw value in any *other* `cmp` token is a **cascade break** — it won't respond to a global edit and won't flip under a theme. (Enforced by the grep audit + token→`:root` generator being built as the actual gate.)
- [ ] **No near-miss hex.** Every hex in `:root` must match a token exactly — `#0e423c` vs the real `#0e413b` is invisible to the eye and is the exact drift schema-validation catches. (The grep audit checks against the token allow-list.)
- [ ] No off-grid spacing (multiple of 4; gutter 28 excepted).
- [ ] Every control on a shared `control-h-*`; grouped controls share height.
- [ ] Exactly one primary (filled) action per view; ≤2 filled per card.
- [ ] Uppercase/mono only on `label`-role text.
- [ ] Contrast: text ≥4.5:1, large text & non-text UI ≥3:1; focus ring visible (2.4.7) and not obscured (2.4.11).
- [ ] Motion has a reduced-motion path; charts have `role="img"`+`aria-label`.
- [ ] Records open as non-blocking side panels; nested/deep views also on-system (ux §2 sweep).
- [ ] Bilingual EN+JA; never `innerHTML` (createElement/textContent only).

---

## 7. Governance — keeping the catalog finite

### 7.1 When to add a new object/concept vs compose
Add to the catalog **only** when a need is: (a) not expressible as a branch of any existing object/layout (§6.2), AND (b) recurring (used ≥2 surfaces or clearly will be). A one-off is composition, not a catalog entry. Default answer to "do we need a new component?" is **no — branch or compose.** (Polaris/Material: reuse before invent.)

### 7.2 How to add one correctly (so the cascade survives)
1. Define its **reference** values only if a genuinely new primitive is needed (rare — usually an existing family works).
2. Add a **semantic** alias for its role (this is what future edits touch).
3. Add **component** tokens that reference the semantic alias — never raw values.
4. Document it in §4/§5 with anatomy + branch instructions.
5. Add it to `design-tokens.json` in the matching tier.

### 7.3 How token edits are made (cascade-preserving)
- Edit at the **highest tier that scopes the change**: whole-family shift → `ref`; role re-map → `sem`; one-object tweak → `cmp`. Never edit a lower tier to achieve a higher-tier effect.
- Editing `ref`/`sem` must keep AA (§2.1 tokens are AA-tuned — verify contrast before committing a color edit).
- One source of truth: `index.html :root` mirrors `design-tokens.json`. A token added in one must be added in the other.

### 7.4 The two-consumer rule (a `sem.*` token must earn its tier)

The most-cited failure mode in the token literature is a semantic layer that is *just aliases with fancy names* — "a semantic token is no longer semantic when it doesn't scale across broad use cases" (Baldwin). Our test, applied to every new `sem.*` token:

> **A `sem.*` token earns its tier only if EITHER (a) it is consumed by ≥2 objects/sites, OR (b) it names an intent that could independently change under a theme/rebrand** — the pass-through test: **name for *why*, not *what*.** Otherwise it is a `ref.*` alias masquerading as meaning — inline the `ref.*` instead.

Corollary — **coincidence is not duplication.** Two intents that resolve to the *same* primitive today are **correct**, not redundant, when they could diverge later. `sem.color.primary` and `sem.color.link` both resolving to `ref.color.ivy.900` is right: in a future theme "the brand color" and "the link color" may split. Do **not** collapse them.

Closed vocabularies pass automatically: the status set (`success/warning/error/neutral`), the stage set (`sem.sell.*`), the quality set, and the typed-event set (`sem.eventTint.*`) are role-sets — each member is a named intent in a bounded list, so they satisfy (b) even where a member has one current consumer. (Annotated as such in the JSON `$description`s.)

### 7.5 Per-tier soft caps (we are intentionally lean, not a palette)

Tier count is a *philosophy dial*. A large semantic layer is a palette (Atlassian ships 391); a small one is an opinion (Spectrum). **For one product, two users, we are deliberately opinionated — ~50 `sem`, ~20 `cmp` — and we resist expansion.**

- **`ref.*`** — a value enters only if it's a genuinely new primitive (new hue/step). Default: reuse an existing family step.
- **`sem.*`** — soft cap; must pass the two-consumer rule (§7.4). A one-consumer `sem.*` outside a closed vocabulary is a smell — inline it or justify it in the ticket.
- **`cmp.*` — the EXPENSIVE tier** (Spectrum/Baldwin: "are component tokens worth it?"). Add a `cmp.*` token **only** when the object diverges (or plausibly will diverge) from the plain semantic role — e.g. `cmp.pcard.radius → ref.radius.lg` while cards use `xl`. A `cmp` token that just forwards `sem.color.surface` with no divergence and no plausible future divergence is our version of the pass-through. Never enumerate a component's every property speculatively.

### 7.6 Governance checklist (REVIEW-ticket teeth — "no" by default)

Adding any token/object requires answering these in the REVIEW ticket. If it can't answer cleanly, it is a **branch or a compose**, not a new token. The default answer to "do we need a new token/component?" is **no** (Polaris/Material: reuse before invent).

- [ ] **Tier?** — which of `ref` / `sem` / `cmp`, and why that tier (§7.3 highest-tier rule)?
- [ ] **Consumer count?** — for a `sem.*`: ≥2 consumers, or a member of a named closed vocabulary, or an intent that can independently change (§7.4)? For a `cmp.*`: does the object genuinely diverge from the plain role (§7.5)?
- [ ] **Passes the grammar?** — name follows §2.5 (correct level order, flat ≤2 semantic segments, state-as-suffix, no hue/raw-value in a `sem` name, no role word in a `ref` name)?
- [ ] **Branch instead of add?** — can this be a token-branch (re-alias) or structural-branch of an existing object (§6.2), or a plain composition (§6.1)? If yes, do that — don't add.
- [ ] **Cascade intact?** — no raw literal in any `cmp` token (§6.4); every alias resolves to a real token.

### 7.7 What we deliberately REJECT (and why)

Grounded in the case-study failures (`tokenized-systems-case-studies.md`), so these aren't re-litigated:

- **Arbitrary-value escape hatches** (Tailwind's `[13px]` / `text-[#hex]`). In a hand-written file, a raw `padding:13px` or `#0e423c` is our version — the fastest way to lose consistency. **Countermeasure:** the §6.4 raw-value + near-miss-hex audit, run as a gate.
- **Utility class-soup.** We name *objects* (`card`, `pcard`), never 14-utility strings — this dodges Tailwind's loudest criticism while keeping its constraint-beats-freedom win.
- **Heavy toolchain theming** (Semantic UI / LESS labyrinth). Our no-build CSS-variable delivery is a *feature*: a re-theme is a `:root` edit, and we **can't** accumulate a theming toolchain.
- **Speculative / unbounded component tokens** (Material's giant `md.comp.*`; Spectrum's own "are they worth it?" caution). The `cmp.*` tier stays hand-curated and tiny (§7.5).

### 7.8 Deprecation path (the missing half of most governance)

Zombie tokens accumulate when a system can add but never remove. To retire a token:

1. Mark it `"$deprecated": true` in `design-tokens.json` (with a `$description` naming the replacement) — DTCG-style deprecation marker; keep it resolving so nothing breaks mid-migration.
2. Grep the `:root` + `index.html` (and this doc) for every consumer; re-point each to the replacement token.
3. Once grep returns **zero** consumers, delete the token from the JSON and the `:root`, and remove it from §4/§5/§2 here.
4. Record the removal in the REVIEW ticket (same teeth as an addition).

---

## Appendix — gaps where implementation contradicts the system (reconcile)

> **v2 status (2026-07-13, Jude):** drifts #2–#4 are now **RESOLVED in `design-tokens.json`** (the token spec is canonical; the `index.html` CSS still needs the matching edit when the generator/gate lands — those touch `index.html`, out of scope for this pass). #5 is now **RESOLVED by decision + implementation** (see below). #1 remains **open** (component work, not token work). #6 is a standing "keep, don't fix" note.
>
> **v3 status (2026-07-14, Jude):** §4.11 is upgraded to the **panel & modal pattern family** (three named patterns: docked / overlay / confirm — §4.11.1–.3, composition recipe §4.11.4, consolidation plan §4.11.5). Drifts #2–#4 re-pointed from the old `cmp.drawer.*` tokens to the new `cmp.panel.*`; new drift **#7** tracks collapsing the five per-surface docks onto one `body.panel-open` + `.side-panel[data-mode]` mechanism (spec canonical; `index.html` pass pending). `cmp.confirm.*` added for the transactional confirm modal.

1. **Empty state is under-built.** *(OPEN — component work.)* Production `.empty-state` = centered text only; the system (§4.15, design-logic §10) requires heading + guidance + primary action. **Upgrade the component** to the Polaris anatomy and apply per page and per empty board column.
2. **Two drawer widths in production.** ✅ **RESOLVED (token spec).** Canonical = the docked record panel `min(540px,94vw)` — promoted from the CRM one-off to **the** panel width, `cmp.panel.width` (with a `$widthNote`). The person-drawer `min(420px,92vw)`+blocking-scrim variant is a **leftover** — person detail uses the docked panel spec (§4.11.1, no scrim on desktop) per ux §1. The Ivy chat's `420px` is **not** a drift — it's the sanctioned `cmp.panel.widthChat` branch (§4.11.5). *Remaining: apply in `index.html` CSS.*
3. **Motion-drawer value drift.** ✅ **RESOLVED (token spec).** `ref.duration.drawer` = **300ms** is canonical (annotated), consumed as `cmp.panel.motion`. The person-drawer `240ms` fallback is a leftover — consume the token, remove the fallback. *Remaining: apply in `index.html` CSS.*
4. **Two overlay scrim opacities.** ✅ **RESOLVED (token spec).** Reconciled to **ONE** `ref.color.scrim` = `rgba(0,0,0,0.28)` (the `0.32` person-drawer value is dropped). `cmp.panel.scrim` now aliases it. On desktop the docked panel is **non-blocking (no scrim)** anyway — the scrim applies only to the overlay variant (`<768px` / focus-capture) and the confirm modal. *Remaining: apply in `index.html` CSS.*
5. **Entrance/view-transition motion.** ✅ **RESOLVED (2026-07-13, owner decision — implemented).** The standard is **skeleton + opacity-only fade** (§1.6, §4.21): each data area shows a shaped skeleton, then its content fades in independently as it's ready (`motion-fade-in`, `base` 200ms `out`). The previously-recommended opacity+translateY stagger was **built, reviewed, and rejected** — slide, `translateY`, and per-child stagger entrances are removed from production (the `motion-rise` keyframes are neutralized to opacity-only) and must not return. Hover/active/paging micro-interactions are unaffected.
6. **Sanctioned off-grid values** (28px gutter; 30/38/44 control heights; and the v2-added `space.0-25` 1px, `radius.seg` 10px named one-offs) are intentional — keep them named, don't "fix" them to multiples of 4.
8. **Shipped `.ivh-table` diverges from the tokenized table spec (three points).** *(OPEN — `index.html` CSS, spec/tokens are canonical.)* The new `cmp.table.*` object (§4.18) was **measured from shipped reality** so the tokens don't silently restyle every table — but three properties of the live `.ivh-table` contradict the target spec and must reconcile in the `index.html` pass (aligning CSS to the tokens, **not** the reverse):
   - **Header type role.** Shipped `th` = `text-tab` (13px) / display / `textSecondary` / `letter-spacing:0.5px`. Target (`cmp.table.thStyle`) = the **`label` role** (mono / 10px / uppercase / `-0.3px` / `textTertiary`) — the app's single-strongest signature (§2.2), and the treatment the **already-compliant** `inv-line-items`, `formula-oils-table`, and `crm-stock-table` headers use. `.ivh-table` is the outlier. Reconcile → align `.ivh-table th` to the label role. (`cmp.table.thText`→`textSecondary` encodes today's colour so the token layer is honest; the target is `textTertiary` via `thStyle`.)
   - **Cell size.** Shipped `td` = `text-md` (14) — and the old `cmp.table.tdSize` wrongly said `sm` (12), contradicting **every** live table. **Corrected in the tokens to `size.md` (14)**, the measured app-wide value. No `index.html` change needed for this one; it was a spec bug, now fixed to reality.
   - **Row hover.** Shipped `.ivh-table tr:hover td` = `surfaceSecondary`; the old token wrongly said `hoverTint`. **Corrected to `hoverBg`→`surfaceSecondary`** (the measured value; products/orders/batch all match). `hoverTint` remains the neutral **list-row** hover (§4.8) — the two are legitimately different (a table wash vs a flat-row tint). If the owner wants them unified, that's a one-line `sem` decision in the `index.html` pass; until then the token reflects shipped reality, not an invented change.

   *Net: the tokens now describe the table the app actually ships (safe — no visual change on import), while §4.18 + `thStyle` name the header-role target. The border-weight rule (2px header underline vs 1px row divider) is captured as a §4.18 structural rule, both weights resolving to `borderSeparator`.*

7. **Five per-surface dock implementations.** *(OPEN — `index.html` CSS/JS consolidation, spec is canonical.)* The dock mechanism is copied per surface: `body.crm-dock-open`, `body.person-dock-open`, `body.ivy-dock-open`, plus the product-detail and order-detail docks — each with its own scrim / `pointer-events` / reflow-padding / `<768px` selectors. **Target = one generic mechanism** (§4.11.5): `body.panel-open` + `.side-panel[data-mode="docked|overlay"]`, reading `cmp.panel.*`. The five body classes and their duplicated selectors collapse to one; Ivy keeps `cmp.panel.widthChat` as a sanctioned width branch. `cmp.drawer.*` is deprecated in favour of `cmp.panel.*` (kept resolving via `$deprecated` alias until grep shows zero consumers, §7.8). *Remaining: the code consolidation pass implements the mechanism 1:1.*

## References
- W3C Design Tokens Community Group — DTCG spec 2025.10 (stable): https://tr.designtokens.org/format/
- Material Design 3 — design tokens & canonical layouts: https://m3.material.io/foundations/design-tokens · https://m3.material.io/foundations/layout/canonical-layouts/overview
- Shopify Polaris — space/color/cards/empty-state/filters: https://polaris.shopify.com/design/space · https://polaris.shopify.com/foundations/design/colors
- GitHub Primer — layout/forms/button order: https://primer.style/product/getting-started/foundations/layout/
- Apple HIG — layout, toolbars, touch targets: https://developer.apple.com/design/human-interface-guidelines/layout
- WCAG 2.2 — 1.1.1, 1.4.3, 2.3.3, 2.4.7, 2.4.11, 2.5.8: https://www.w3.org/WAI/WCAG22/quickref/
- EightShapes (Nathan Curtis) — Naming Tokens in Design Systems (the ordered grammar): https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676
- Nate Baldwin — When semantic tokens are no longer semantic (the two-consumer rule): https://www.designsystemscollective.com/when-semantic-tokens-are-no-longer-semantic-d65ef16fadd7
- Internal: `docs/design/token-architecture-deepdive.md` (P0/P1 token-engineering fixes — source of the v2 cascade-break + grammar refinements) · `docs/design/tokenized-systems-case-studies.md` (governance / anti-drift refinements)
- Internal: `docs/migration/design-logic-reference.md` · `docs/migration/ux-interaction-principles.md` · `concepts/round2/concept-b-loop.html` · `concepts/design-system/gallery.html` · `docs/design/loop-design-system.md`

### 4.11.6 Source-selection rule (Taka, 2026-07-15 — foundation behavior)
Whenever a detail panel/drawer is open, its SOURCE item (table row, list row, board card, grid card) carries a visible SELECTED state — the §4.8 treatment (left 2px `primary` bar + `primaryTint` bg, or the row/card's `.sel` equivalent). The state MOVES on click-swap and CLEARS on panel close. This is part of the panel pattern's behavior contract: list stays interactive + you can always see which record the panel is showing. Every master–detail surface implements it (Partners rail ✓, Customers table, Products grid/table, Sell board cards).
