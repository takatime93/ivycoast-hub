# Ivycoast Hub — Motion & Micro-interaction System

**Date:** 2026-07-04
**Author:** Jude (design technologist)
**Scope:** `index.html` only (single-file app, GitHub Pages, no build). Motion polish, not redesign.
**Companion:** builds on `premium-uplift-research-20260704.md` (visual system). Same calm, premium tone.
**Constraint:** no layout / IA / feature / color / i18n changes. GPU-friendly (`transform`/`opacity`) only. Every new animation is neutralized under `prefers-reduced-motion`.

---

## 1. Principles

A premium internal CRM is used for hours a day in two languages. Motion here is a **utility, not decoration** — it exists to explain what just happened, preserve spatial continuity between states, and confirm input. It must be fast enough to feel instant and quiet enough to disappear. Reference bar: **Linear, Stripe, Notion** — motion you feel more than see.

Four jobs motion is allowed to do (everything else is cut):

1. **Feedback** — confirm a press/hover/focus immediately. A control that reacts within ~120ms feels "connected"; anything slower feels laggy. (NN/g *Visibility of System Status*; Apple HIG *feedback*.)
2. **Continuity / spatial** — overlays enter from where they live (drawers slide from the right edge, modals lift from center), so the user keeps their mental map. (Material 3 *shared axis / container transform*; Apple HIG *fluidity*.)
3. **Status** — a saved row flashes, a skeleton crossfades to content, a toast slides in — motion tells you the system's state changed without a wall of text.
4. **Hierarchy** — a subtle rise-in on freshly rendered cards draws the eye to new content in order, using Gestalt *common fate* (things that move together are read as a group).

Design rules derived from the above:

- **Entrances ease-out, exits ease-in.** Things arrive decelerating (feels like they're settling into place) and leave accelerating (gets out of the way). (Material 3 easing guidance.)
- **Short.** 120–260ms for almost everything; 300ms only for large-surface travel (full-height drawers). Long motion on a daily tool becomes friction.
- **No bounce, no flash, no spin-for-fun.** Material 3 *Expressive* is spring-based, but on a dense operations tool overshoot reads as noise. We use restrained ease-out curves instead.
- **GPU only.** Animate `transform` and `opacity`. Never animate `width`/`top`/`box-shadow` in a loop. (Layout/paint thrash > 16ms drops frames.)
- **Cap list motion.** Stagger the first N cards only; never animate hundreds of rows (jank + delayed content).
- **Reduced-motion is a hard gate.** Every token and class below is zeroed out under `prefers-reduced-motion: reduce` (WCAG 2.3.3). Content still appears — only the movement is removed.

---

## 2. Motion token scale

Added to `:root`, alongside the existing `--transition-*` tokens. The old tokens are **kept and re-expressed** as aliases so nothing forks — every existing `transition: … var(--transition-fast)` rule keeps working and now shares the same vocabulary as the new motion.

### Durations

| Token | Value | Use |
|-------|-------|-----|
| `--motion-instant` | `80ms` | micro press / active feedback |
| `--motion-fast` | `120ms` | hover, focus ring, tab/row color shifts, small state changes |
| `--motion-base` | `200ms` | default: card hover elevation, fades, content crossfade |
| `--motion-slow` | `260ms` | overlay fade + modal lift, toast in/out |
| `--motion-drawer` | `300ms` | full-height side drawers (large travel) |

### Easings

| Token | Curve | Use |
|-------|-------|-----|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | **entrances** — quick out, gentle settle (the house curve) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | **exits** — accelerate away |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | symmetric moves, drawer slide (matches existing CRM drawer curve) |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | large/important surfaces that deserve a touch more presence, no overshoot |

### Reconciliation with existing tokens

The existing `--transition-fast/normal/slow` (0.1s / 0.15s / 0.3s) are **re-pointed to the motion scale** so there is one source of truth:

```
--transition-fast:   var(--motion-fast);    /* 0.1s  → 120ms */
--transition-normal: var(--motion-base);    /* 0.15s → 200ms, slightly calmer */
--transition-slow:   var(--motion-drawer);  /* 0.3s  → 300ms (unchanged) */
```

`--transition-normal` moves 0.15s → 0.2s. This is intentional: 150ms hover/border transitions read slightly abrupt against the new calmer system; 200ms is the Linear/Stripe default and the ~65 existing transitions all benefit uniformly without touching a single rule.

---

## 3. Applied inventory (what got motion, and why)

| Surface | Motion | Token(s) | Why |
|---------|--------|----------|-----|
| **Primary buttons** (`.btn-add-task`, `.btn-add-card`, `.btn-crm-add`, `.formulator-add-btn`, `.btn-save`) | background transition + `:active` press (`scale(0.98)` replaces the old 0.5px nudge) + smooth focus ring | `--motion-fast`, `--ease-out` | feedback — press feels physical |
| **Tabs** (`.tab`, `.tools-subnav-tab`, `.crm-subtab`) | color + underline color transition; active underline animates in | `--motion-fast` | continuity — selection glides, not jumps |
| **Table rows** (`.ivh-table tr`, products/orders/batch) | background hover transition | `--motion-fast` | feedback — row highlight fades in |
| **Cards** (`.task-card`, `.crm-vendor-card`, `.product-card`, `.info-card`) | hover elevation already tokenized; added `:active` press + entrance rise-in | `--motion-base`, `--ease-out` | feedback + hierarchy |
| **List/card render** | `.motion-rise` entrance (opacity 0→1, `translateY(6px)→0`), staggered on first 8 via `:nth-child`, applied by CSS to `.task-card`, `.crm-vendor-card`, `.product-card` | `--motion-base`, `--ease-out` | hierarchy — new content settles in top-to-bottom (Gestalt common fate) |
| **Modals** (`.board-modal`, `.status-picker`, `.inv-preview`) | overlay backdrop fades in; panel lifts (`opacity 0→1`, `translateY(8px)+scale(0.98)→0`) | `--motion-slow`, `--ease-emphasized` | continuity — modal settles from below |
| **Side drawers** (`.crm-modal`, `.customer-drawer`, `.score-drawer`) | existing right-edge slide unified onto tokens (`--motion-drawer`, `--ease-in-out`); overlay backdrop fades | `--motion-drawer` | continuity — drawer keeps its spatial origin |
| **Toasts** (`.formulator-toast`) | slide + fade in (existing `toastFade` retimed onto tokens) | `--motion-slow`, `--ease-out` | status |
| **Skeleton → content** | `.motion-fade-in` gentle crossfade utility; shimmer already reduced-motion-gated | `--motion-base` | status — no hard pop |
| **Status flashes** (`crm-order-flash`, `crm-stock-flash`, `crm-card-highlight`) | kept, retimed to align with `--motion-slow` cadence | — | status — save confirmation |
| **Focus rings** (global `:focus-visible`) | outline transitions in smoothly | `--motion-fast` | feedback / a11y |

### Design decisions worth noting

- **`:active` press changed from `translateY(0.5px)` to `scale(0.98)`.** Scale reads as a "push" on any button size and is fully GPU-composited; the 0.5px nudge was nearly invisible on large buttons. Kept the same selector list, so scope is identical.
- **Modal panels lift, drawers slide.** Different physical models for different surfaces (center-modal vs. edge-drawer) preserve each one's spatial identity — the core of Material 3 *container transform* thinking, kept lightweight.
- **List stagger capped at 8** via `:nth-child(-n+8)`. Cards 9+ still fade in but with no added delay, so a 400-row CRM never waits on animation and never janks. Pure CSS — no per-row JS, no `innerHTML`.
- **No new keyframes for exits.** Overlays that toggle `display` can't transition out; forcing a JS exit animation would mean timers and race conditions. We animate the *entrance* (the moment users notice) and let dismissal be instant — the honest, jank-free choice for a `display`-toggled system.

---

## 4. Reduced-motion guarantee (WCAG 2.3.3)

The existing `@media (prefers-reduced-motion: reduce)` block already zeroes all `animation-duration` and `transition-duration` globally via `*`. That single rule **already neutralizes every token and class added here** — durations collapse to ~0ms, so buttons, tabs, cards, modals, drawers, toasts, rises, fades and flashes all appear instantly with no movement. We extended the block to also:

- pin the new `.motion-rise` / `.motion-fade-in` entrance transforms to their end-state (`transform: none; opacity: 1`) so no first-frame flash of displaced/transparent content can occur, and
- neutralize the new `:active` `scale()` press.

Coverage proof (every new animated thing → where it's killed):

| New motion | Neutralized by |
|------------|----------------|
| all `transition:` using new tokens (buttons, tabs, rows, cards, focus, drawers) | global `transition-duration: 0.001ms !important` |
| all `animation:` (toast, rise, fade, flashes) | global `animation-duration: 0.001ms !important` + `iteration-count: 1` |
| `.motion-rise` translateY entrance | explicit `transform: none !important; opacity: 1 !important` |
| `.motion-fade-in` opacity entrance | explicit `opacity: 1 !important` |
| button `:active { scale(0.98) }` | explicit `transform: none !important` on the active selectors |
| modal panel lift entrance | explicit end-state pin |

Result: a reduced-motion user gets the full app with zero movement and zero flicker.

---

## References

- **Apple HIG** — Motion / Reduce Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- **Material Design 3** — Motion (easing & duration, transitions): https://m3.material.io/styles/motion/overview
- **Material 3 Expressive** — spring motion (adapted, not adopted, for a dense tool): https://m3.material.io/
- **NN/g** — Visibility of System Status: https://www.nngroup.com/articles/visibility-system-status/
- **NN/g** — Animation Purpose in UX: https://www.nngroup.com/articles/animation-purpose-ux/
- **WCAG 2.2** — 2.3.3 Animation from Interactions / prefers-reduced-motion: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- **DTCG** stable spec 2025.10 (token naming reference): https://tr.designtokens.org/
