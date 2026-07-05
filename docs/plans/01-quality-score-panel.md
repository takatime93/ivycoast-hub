# Plan 01 — Quality-Score "Read More" Side Panel

**Status:** 📋 Planned
**Depends on:** nothing (formulator already computes score + properties)
**Touches:** `index.html` only (CSS + formulator markup + JS). No backend.

---

## Goal

From the Quality Score card in the Soap Formulator, a **"Read more about score"** link opens a
right-side drawer (matching the existing `customer-drawer` pattern) with **two tabs**:

1. **このスコアについて (About this score)** — *default tab.* A curated, dynamic explanation of the
   **actual score currently shown** and what it means, driven by the live recipe's numbers.
2. **計算方法 (How it's calculated)** — a static explainer of the formula, ranges, and property math.

## Why a drawer (not a modal)

The app already has a right-drawer pattern (`.customer-drawer`, `.crm` side panel). Reusing it keeps
the UX consistent and lets the user keep the recipe visible while reading. Overlay + slide-in from right.

---

## Tab 1 — "About this score" (dynamic)

Reads two globals set during `formulatorRecalc`: `formulatorLastScore` and `formulatorLastProps`.
(New: store these in `formulatorRecalc` so the drawer can read the live state.)

Content, generated on open:

1. **Score readout + band verdict.** Big number + a one-line verdict keyed to the band:
   - **90–100** — "教科書的なバランス / Textbook balance."
   - **70–89** — "しっかりバランスの取れたレシピ / Well-balanced, minor tweaks only."
   - **40–69** — "使えるが、いくつかの特性が理想範囲外 / Workable, with trade-offs."
   - **0–39** — "複数の特性が範囲外。調整推奨 / Several properties out of range."
   - **null (no oils)** — prompt to add oils.

2. **"Where this recipe stands."** For each of the 7 properties, a line with a status chip
   (🟢 in range / 🟡 within 10 / 🔴 out) and, **for out-of-range ones only**, a direction-aware
   fix suggestion (see guidance table below). This is the "smart logic with multiple answers" — the
   panel assembles its explanation from *which* properties are off and in *which* direction, so it
   adapts to any score, not a fixed paragraph.

3. **Honest caveats box.** Equal weighting; generic ranges not tuned to Ivycoast's high-olive
   superfatted bars; says nothing about fragrance/cure/feel. "Read it as *how conventional the
   chemistry is*, not *how good the soap is*."

### Property guidance table (direction-aware)

| Property | If **low** | If **high** |
|---|---|---|
| Hardness | Soft bar — add coconut/palm/cocoa/shea/tallow | Brittle — reduce hard oils/butters |
| Cleansing | Very mild, low strip (fine for facial) | Can be drying — reduce coconut/palm kernel |
| Conditioning | Less moisturizing — add olive/soft oils | Softer bar, shorter longevity |
| Bubbly | Flat lather — add coconut or castor | Fine (rarely a problem) |
| Creamy | Thin lather — add butters or castor | Fine |
| Iodine | Very hard/slow trace | Softer, more DOS/rancidity risk — cut high-linoleic oils |
| INS | Overall softer than typical | Overall harder than typical |

## Tab 2 — "How it's calculated" (static)

1. **Step 1** — 7 properties = weighted average of fatty acids by oil weight share
   (Hardness = palmitic+stearic; Cleansing = lauric+myristic; Conditioning = oleic+linoleic+linolenic;
   Bubbly = lauric+myristic+ricinoleic; Creamy = palmitic+stearic+ricinoleic; Iodine & INS from DB).
2. **Step 2** — ideal ranges table (Hardness 29–54, Cleansing 12–22, Conditioning 44–69,
   Bubbly 14–46, Creamy 16–48, Iodine 41–70, INS 136–165).
3. **Step 3** — `score = 100 − Σ(distance each property falls outside its band)`, floored at 0.
   Colour: green ≥70, amber 40–69, red <40.
4. Worked mini-example (hardness 24 → −5, INS 175 → −10 ⇒ 85).

---

## Implementation checklist

- [ ] CSS: `.score-drawer*`, `.score-drawer-tabs`, `.score-tab-btn`, `.score-chip`(green/amber/red),
      `.score-readmore-btn`, `.score-caveat`. Reuse tokens; mirror `.customer-drawer` metrics.
- [ ] Markup: `score-readmore-btn` in the score card; drawer + overlay near the customer drawer markup.
- [ ] JS globals: `formulatorLastScore`, `formulatorLastProps`; set them in `formulatorRecalc`.
- [ ] JS: `openScoreDrawer()`, `closeScoreDrawer()`, `scoreDrawerTab(which)`,
      `_buildScoreAbout()`, `_buildScoreMethod()` — all DOM via createElement (no innerHTML).
- [ ] Wire Esc-to-close + overlay click close (match customer drawer).

## Localization note

All new strings here will be routed through the i18n system built in Plan 02 (keys, not hardcoded),
so this panel toggles JA/EN like the rest of the app. Built bilingual-aware from the start.

## Test plan

- Score at each band (empty, <40, 40–69, 70–89, 90–100) renders correct verdict + chips.
- A recipe with a known out-of-range property shows the right direction-aware tip.
- Drawer opens/closes; tabs switch; no console errors; node syntax check passes.
