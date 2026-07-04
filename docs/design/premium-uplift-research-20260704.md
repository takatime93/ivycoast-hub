# Ivycoast Hub — Premium Visual/UX Uplift: Research & Evidence

**Date:** 2026-07-04
**Author:** Jude (design technologist)
**Scope:** `index.html` only (single-file app, GitHub Pages, no build). Polish, not redesign.
**Method:** Token/CSS static analysis + manual WCAG contrast computation (relative-luminance formula). No layout, IA, or feature changes.

---

## 1. Conformance target — WCAG 2.2 Level AA

**AA is the bar, and AA fully includes Level A.** This matters because **Level A alone permits low-contrast text** (there is no contrast SC at Level A — 1.4.3 Contrast Minimum is an AA criterion). For a premium internal tool used daily in two languages, AA contrast is the real quality floor, so we conform to AA.

Criteria explicitly enforced in this uplift:

| SC | Level | Requirement | How we meet it |
|----|-------|-------------|----------------|
| **1.4.3 Contrast (Minimum)** | AA | 4.5:1 body text, 3:1 large text (≥24px or ≥18.66px bold) | Fixed the failing gray tokens (see §2). |
| **1.4.11 Non-text Contrast** | AA | 3:1 for UI components & meaningful graphics | Focus ring, active states, badges reviewed; structural 1px borders are decorative dividers, not the sole boundary of a control (fill + label + focus ring carry state), so exempt. |
| **2.4.7 Focus Visible** | AA | Keyboard focus indicator always visible | New **global `:focus-visible` ring** across every interactive element (§3). |
| **2.4.11 Focus Not Obscured (Minimum)** | AA | Focused element not fully hidden by author content | Sticky header uses `z-index:100`; focus ring uses `outline-offset` (renders outside the box) and modals/drawers are top-layer — focused controls remain visible. No new sticky/overlay content added. |
| **2.5.8 Target Size (Minimum)** | AA | Interactive targets ≥ 24×24 CSS px (or adequate spacing) | Raised the two sub-24px controls (`.ivh-remove-btn`, `.btn-cancel-card`) to a 24×24 min box (§4). Apple 44pt / Material 48dp targets already exceed this on primary controls. |
| **1.4.1 Use of Color** | AA | Color not the sole means of conveying info | State changes pair color with a second cue (border + shadow ring on focus; opacity + `not-allowed` cursor on disabled; text/label on badges). |
| **2.3.3 Animation from Interactions** (AAA, honored) + prefers-reduced-motion | — | Respect reduced-motion preference | Added `@media (prefers-reduced-motion: reduce)` to kill the infinite skeleton shimmer, card-lift transforms, and long transitions. |
| Keyboard operability (2.1.1) | A | All functionality via keyboard | Not regressed; focus visibility now makes existing keyboard paths usable. |

**Not claimed:** **2.4.13 Focus Appearance is AAA, not AA** — we do not conform against its 2px-perimeter / 3:1-area spec. Our ring (2px solid brand color, 2px offset) is a strong, consistent AA-level indicator. **WCAG 3.0** remains a Working Draft (final ≥2028) and is not a conformance target.

---

## 2. Contrast audit of color tokens

Ratios computed with the WCAG relative-luminance formula (sRGB, `(L1+0.05)/(L2+0.05)`).

### Failures found (before) → corrections (after)

| Token | Before | On | Ratio | Verdict | After | New ratio |
|-------|--------|----|-------|---------|-------|-----------|
| `--color-text-tertiary` | `#80868b` | white | **3.68:1** | FAIL (body) | `#686d72` | 5.23:1 white / 4.96 secondary / 4.69 tertiary — **PASS** |
| `--color-text-disabled` | `#9aa0a6` | white | **2.64:1** | FAIL when used as muted body text | `#72777c` | 4.52:1 — **PASS** |
| `--color-warning-text` | `#b06000` | `#fef7e0` | **4.34:1** | FAIL (body) | `#9a5400` | 5.38:1 — **PASS** |
| `--color-link-external` | `#157be1` | white | **4.24:1** | FAIL (body) | `#1268c4` | 5.52:1 — **PASS** |
| `.ivh-empty` (hardcoded) | `#80868b` | white | **3.68:1** | FAIL | → `var(--color-text-tertiary)` | inherits 5.23:1 — **PASS** |

The tertiary token is the highest-leverage fix: it is used across the Soap Formulator (every field label, result unit, property label, score label), empty states, and card sub-text — one token value repaired dozens of low-contrast strings.

The disabled token doubles as a "muted" text color in places, so it was brought to AA rather than left at a decorative-only level (disabled *controls* are exempt from 1.4.3, but disabled-colored *text used as content* is not).

### Already passing (kept)

`--color-text` `#181818` 17.8:1 · `--color-text-heading` `#202124` 16.1:1 · `--color-text-secondary` `#5f6368` 6.05:1 · `--color-text-subtle` `#606060` 6.29:1 · `--color-text-muted` `#424242` 10.1:1 · `--color-primary` `#0e413b` 11.4:1 · success/error/neutral status text all ≥4.9:1 · `.badge-sheet` `#8a4a00` 6.40:1 (routed to the warning token for consistency, still ≥5.4:1).

### Decorative, intentionally left

1px structural borders (`--color-border` `#dadce0` 1.37:1, `--color-border-subtle` `#e3e3e3`) are dividers/hairlines, not the sole boundary of an interactive control, so 1.4.11's 3:1 does not apply. The header chevron `#818181` (3.54:1) is a non-text icon adjacent to a text label → passes the 3:1 non-text bar.

---

## 3. Best-in-class SaaS/CRM patterns applied

Patterns (not brand) drawn from Linear, Stripe, Notion, Attio, and Vercel dashboards, cross-checked against Apple HIG, Material 3, and NN/g:

- **Consistent keyboard-focus system** — Linear/Stripe make focus a first-class, always-visible state. We replaced a 6-selector focus list with a **document-wide `:focus-visible` ring** covering buttons, links, inputs, tabs, cards, rows, chips, and `[role]`/`[tabindex]` elements, plus a `forced-colors` fallback. (WCAG 2.4.7; NN/g "visibility of system status".)
- **Calm, layered elevation** — premium dashboards use soft, low-alpha, two-layer shadows rather than one heavy blur. We rebuilt the shadow scale into a monotonic set (`--shadow-card → --shadow-sm → --shadow-md → --shadow-lg → --shadow-xl`) with cool-neutral `rgba(16,24,40,…)` tints, and routed hardcoded card/modal shadows to the tokens so elevation is coherent. (Material 3 elevation; Apple HIG "hierarchy through depth.")
- **Restrained interactive feedback** — hover raises elevation subtly; `:active` gives a 0.5px press; disabled = opacity + `not-allowed`, never color-only. Unified across primary buttons. (Material 3 state layers; NN/g affordance.)
- **Radius consistency** — cards standardized on the `--radius-xl` (12px) token instead of literal `12px`, so future radius tuning is one edit.
- **Motion honesty** — respect `prefers-reduced-motion`; the infinite shimmer and card lifts are essential to strip for vestibular safety. (Material 3 Expressive is spring-based but still honors reduced-motion; Apple HIG "Reduce Motion".)
- **Density that suits JA + EN** — line-heights/scale were already token-driven and appropriate for Noto/SF across both scripts; left the type scale intact (polish, not re-typesetting) while ensuring muted labels now meet contrast so denser Japanese glyphs remain legible.

---

## 4. Concrete change list (implemented in `index.html`)

**Tokens (`:root`):**
1. `--color-text-tertiary` `#80868b` → `#686d72` (AA).
2. `--color-text-disabled` `#9aa0a6` → `#72777c` (AA).
3. `--color-warning-text` `#b06000` → `#9a5400` (AA).
4. `--color-link-external` `#157be1` → `#1268c4` (AA).
5. Added `--color-text-primary: #181818` — an alias that **fixes a latent bug**: `.product-card-title`, `.product-card-price`, `.version-meta-editor`, `.version-diff-title` referenced `var(--color-text-primary)` with no fallback, so it previously resolved to nothing (inherited). Now it resolves correctly.
6. Rebuilt shadow scale into a coherent, calm, two-layer elevation system; added `--shadow-focus` (3px, stronger) and `--focus-ring-*` tokens.

**Focus & states:**
7. New global `:focus-visible` ring for all interactive elements + `[role]`/`[tabindex]` + custom card/row/chip classes; `forced-colors` fallback; text fields get border + focus-shadow ring.
8. Unified disabled (opacity + `not-allowed`) and `:active` press states across primary buttons.

**Motion:**
9. `@media (prefers-reduced-motion: reduce)` block neutralizing shimmer/transforms/long transitions.

**Target size:**
10. `.ivh-remove-btn` and `.btn-cancel-card` → 24×24 min box with subtle hover fill.

**Token hygiene (route hardcoded → tokens, no visual regression):**
11. `.ivh-empty`, `.ivh-empty-sm`, `.ivh-section-label`, `.ivh-doc-title`, `.ivh-doc-meta`, `.badge-sheet`, `.board-setup` → semantic tokens.
12. `.info-card`, `.cat-card`, `.task-card`, `.crm-vendor-card`, `.product-card`, `.board-modal` → shadow/radius tokens; hover states use `--shadow-md` and add a border-color cue.

---

## References

- **WCAG 2.2** Quick Reference — 1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.5.8, 1.4.1: https://www.w3.org/WAI/WCAG22/quickref/
- **Understanding 2.4.13 Focus Appearance (AAA)** — confirming it is *not* AA: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- **Understanding 2.5.8 Target Size (Minimum, AA = 24px)**: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- **Apple HIG** — hierarchy through depth / Reduce Motion: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design 3** — elevation & state layers: https://m3.material.io/styles/elevation/overview
- **NN/g** — Visibility of System Status: https://www.nngroup.com/articles/visibility-system-status/
- **DTCG** stable spec 2025.10 (token naming/theming reference): https://tr.designtokens.org/
