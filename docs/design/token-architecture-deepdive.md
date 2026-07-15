# Token Architecture — Deep Dive (the engineering layer)

**Status:** research synthesis · complements `DESIGN_SYSTEM.md` (which holds the UX/composition logic) and the separate Tailwind/Semantic-UI case-study strand (don't duplicate that here).
**Scope:** the TOKENIZED SYSTEM as an engineering artifact — naming taxonomy, tiers, theming, aliasing/resolution, file structure, DTCG conformance. The craft that Material/Polaris/HIG *use* but do not *teach*.
**Grounded in our system:** `design-tokens.json` (ref/sem/cmp) and `DESIGN_SYSTEM.md §1, §2, §7`.
**Author:** Noa · 2026-07-13

> **The framing.** Material 3, Polaris, and Apple HIG are human-centric guideline systems. They are world-class on interaction, layout, and accessibility, and they *ship* token systems — but they document the *decisions* their tokens encode, not the *engineering* of the token layer itself. The deep craft of naming taxonomy, tier discipline, alias resolution, and theme architecture lives in a different literature: Nathan Curtis / EightShapes, the Salesforce/Spectrum/Atlassian token teams, the Style Dictionary resolver, and the W3C DTCG spec. This document mines that literature and turns each insight into a concrete sharpening of our `ref → sem → cmp` model.

---

## Part A — The token-engineering principles guideline systems omit

Each principle below is something Material/Polaris/HIG rely on but don't spell out, followed by **→ how it sharpens OUR model.**

### A1. A token name is a *sentence with a fixed grammar*, not a label

Curtis's core contribution: complex token names are composed of ordered levels — **namespace · object/component · base · category · concept · property · variant · state · scale** — read most-general to most-specific ([EightShapes, "Naming Tokens in Design Systems"](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)). `$esds-color-neutral-42` = namespace(`esds`) · category(`color`) · variant(`neutral`) · scale(`42`). Each level is *optional but ordered* — you include only the levels a given token needs, but never reorder them. This is what lets a system scale to thousands of names without collision: the grammar guarantees uniqueness and sortability. Material's own naming is the same idea in miniature — `md.sys.color.primary` is namespace(`md`) · tier(`sys`) · category(`color`) · role(`primary`), general→specific ([Material 3 design tokens](https://m3.material.io/foundations/design-tokens/overview)).

**→ OUR model:** we already have a good implicit grammar (`sem.color.primaryHover`, `ref.color.ivy.900`) but it is *undocumented and inconsistently applied*. We mix `camelCase` roles (`primaryHover`, `surfaceSecondary`) with a scale-suffix convention on refs (`ivy.900`, `ink.600`). That's fine — but it needs to be written down as *the* grammar so future tokens don't drift. See the naming spec in Part C.

### A2. "Options vs decisions" — the tier boundary is a *decision boundary*, not a value boundary

Curtis frames tiers as **options → decisions**: reference tokens *offer choices* (every color you're allowed to use); semantic tokens *make choices* (which option applies in a context like `text-color` or `background-color`) ([EightShapes, "Tokens in Design Systems"](https://medium.com/eightshapes-llc/tokens-in-design-systems-25dd82d58421)). The tier isn't "raw vs named" — it's "menu vs order." A reference token with no semantic consuming it is a menu item nobody ordered (dead weight). A semantic token that just renames one reference with no added intent is an order that copies the menu verbatim (a pass-through — see A3).

**→ OUR model:** this reframes our cascade rule precisely. `ref.*` is the menu (the ivy/ink/paper families + every accent). `sem.*` is the set of orders (`primary`, `text`, `surface`, `errorText`…). The test for whether a `ref` token earns its place: *is at least one `sem` token ordering it?* We have some ref entries that only exist to be aliased once (e.g. `ref.color.blue.500` → `sem.color.stageProspect`) — that's legitimate (the ref is the reusable menu item, the sem is the role). But it's worth auditing (Part E).

### A3. The pass-through alias is the central failure mode — and it has a precise test

The most-cited anti-pattern in the token-engineering literature: a semantic token that is *just* a rename of one primitive with no contextual meaning adds indirection without intelligence — it "merely automates the existing stylesheet" ([alwaystwisted, naming conventions](https://www.alwaystwisted.com/articles/design-token-naming-conventions); [Ava Morgan, "Stop treating tokens as variables"](https://medium.com/@morganauiux/stop-treating-design-tokens-as-just-variables-do-semantic-naming-instead-47753ff9f51f)). The rule that separates a real semantic token from a pass-through: **name for *why*, not *what*.** `color.error.text` is real intent (it survives a rebrand, a theme, a palette change). `color.red` at the semantic tier is a pass-through (it's the *what*, already said by the primitive). The value of a token is its *name's meaning*, not its hex.

The corollary (from the same literature, and Spectrum/Atlassian practice): a semantic layer *should* contain some tokens that resolve to the same primitive as another semantic token — that's not duplication, it's **two intents that happen to look alike today** and will diverge under a theme. `sem.color.primary` and `sem.color.link` both → `ref.color.ivy.900` is *correct*, because in a future theme "the brand color" and "the link color" may split.

**→ OUR model:** this is the sharpest lens for critiquing our `sem` layer (Part D). Most of our sem tokens pass the "why not what" test cleanly (`textSecondary`, `borderSubtle`, `settleBg`). A few are borderline: `sem.color.linkExternal → ref.color.blue.link` is real intent; but `ref.color.ivy.label → sem.color.sectionLabel` is a 1:1 that could arguably live one tier up. The point isn't to eliminate 1:1 aliases — it's to make sure each one names an *intent that could independently change*, not just a synonym.

### A4. Tier count is a *philosophy dial*, not a fixed number — and more tiers ≠ better

The global/alias/component debate resolves to a tradeoff, not a right answer: **too few tiers → hardcoding** (components reach for primitives, cascade breaks); **too many tiers / too many semantic tokens → indirection hell and token explosion** (you can't tell what a value resolves to, and the count balloons). Atlassian ships **391 semantic tokens** because it delegates a lot of decisions to consumers; Spectrum ships fewer, more-opinionated ones — "a small scale is an opinion, a large scale is a palette" ([Atlassian tokens](https://atlassian.design/components/tokens/all-tokens); [thedesignsystem.guide, "50 token files"](https://learn.thedesignsystem.guide/p/50-design-token-files-one-problem)). Component tokens are explicitly **optional** — their value is that "you can tune one component without creating side effects and explosions elsewhere," but they cost indirection ([Design Systems Collective, systematic taxonomy](https://www.designsystemscollective.com/systematic-taxonomy-in-design-tokens-a-framework-for-scalable-ui-architecture-45cc6f2c7686)).

**→ OUR model:** for a single-product, single-brand internal Hub, **three tiers is correct and we should resist expanding.** Our sem layer (~50 tokens) is deliberately *opinionated* (Spectrum-style), not a palette (Atlassian-style) — that's the right call for one product. The risk for us is the *opposite* of Atlassian's: not too many tokens, but **component tokens that don't earn their indirection.** A `cmp.*` token is justified only when the object needs a knob that differs from the plain semantic role (e.g. `cmp.pcard.radius → ref.radius.lg` while cards use `xl`). A `cmp` token that just forwards `sem.color.surface` with no divergence and no plausible future divergence is our version of the pass-through (Part D).

### A5. A theme is a *swap of alias resolutions at one tier* — nothing else moves

The theming insight that guideline docs assume but don't teach: because components reference *semantic* tokens, switching light→dark (or brand-A→brand-B, or comfortable→compact) is **re-pointing the semantic layer's aliases**, not editing components. Material states it exactly: "the system token can point to different reference tokens depending on the context, such as a light or dark theme" ([Material 3](https://m3.material.io/foundations/design-tokens/overview)). Carbon separates **base tokens** from **theme tokens** (light/dark/high-contrast) so a theme is a token-*set* swap, not a find-and-replace ([uxpin guide](https://www.uxpin.com/studio/blog/what-are-design-tokens/)). The mechanism in pure CSS: redefine the semantic custom properties inside a `:root[data-theme="dark"]` (or `@media (prefers-color-scheme: dark)`) block; the primitives and every `cmp`/component stay byte-for-byte identical, and the cascade re-resolves ([hirejeffgreen, multi-theme CSS](https://www.hirejeffgreen.com/blog/multi-theme-design-system-css-variables); [Bishoy Bishai, dark-mode CSS variables](https://dev.to/bishoy_bishai/implementing-dark-mode-css-variables-system-preference-and-persistence-2a43)).

**Robust vs brittle theming** comes down to *where the theme-varying values live.* Robust: only the semantic layer varies per theme; primitives are theme-agnostic; components never branch per theme. Brittle: a component hard-codes a hex (won't flip), or a theme has to override primitives (leaks everywhere), or two semantic tokens that must diverge in dark mode are collapsed into one.

**→ OUR model:** our architecture is *already* theming-ready in principle — objects consume `sem.*`, and `DESIGN_SYSTEM.md §6.3` even describes the re-brand as "edit `sem.color.primary` → everything updates." What we lack is the *structural readiness*: (1) a few `cmp` tokens carry raw literals (see A6/Part D) that would not flip; (2) our light-only palette has semantic tokens whose *names* encode light-mode assumptions (`surface = white`) but that's fine — the name is the role, the value flips. The gap is proving the swap works, not the architecture. See Part E, theming readiness.

### A6. The cascade is only as strong as its weakest literal — raw values in components are cascade breaks

Resolution engineers (Style Dictionary) treat any raw value sitting where a reference should be as a **broken edge in the dependency graph** — a node with no parent, so a change upstream can't reach it ([Style Dictionary reference resolution](https://deepwiki.com/amzn/style-dictionary/5-reference-resolution)). The reference syntax `{path.to.token}` resolves through *multiple passes* until all references resolve or a **circular reference** is detected (A→B→C→A triggers a warning and leaves the ref unresolved) ([Style Dictionary](https://styledictionary.com/info/tokens/); [DTCG format](https://www.designtokens.org/tr/drafts/format/)). Transitive aliasing (A→B→C) is supported and normal; the danger is (a) literals where refs belong, and (b) accidental cycles.

**→ OUR model:** our JSON has raw literals living in `cmp` tokens — the exact thing this principle flags:
- `cmp.badge.padY: "1px"`, `cmp.seg.indicatorRadius: "10px"`, `cmp.helpTip.btnSize: "18px"`
- `cmp.drawer.width: "min(560px, 94vw)"`, `cmp.drawer.overlayScrim: "rgba(0,0,0,0.28)"`, `cmp.btnGhost`/etc. none, but `cmp.toast`/`cmp.drawer` carry raw motion-adjacent literals.

Some of these are *legitimately* one-offs (a `min(560px,94vw)` drawer width is genuinely a component decision with no reusable primitive). But `18px`, `10px`, `1px`, and the scrim `rgba` are **cascade breaks**: they should point at a `ref` primitive (e.g. a `ref.space`/`ref.control`/`ref.color.scrim`) so a global edit reaches them. This is our single biggest token-engineering gap. See Part E.

### A7. Composite tokens bundle "always-applied-together" properties into one typed unit

DTCG defines **composite types** whose `$value` is a structured object/array: `typography` (family+size+weight+lineHeight+letterSpacing), `shadow` (offset+blur+spread+color, single or array), `border`, `transition`, `gradient`, `strokeStyle` ([DTCG format module 2025.10](https://www.designtokens.org/tr/drafts/format/)). The rule: composite when the sub-values are *always applied together* and meaningless apart. This is *deeper* than what guideline systems expose (they show you a "type scale," not the composite-token machinery underneath).

**→ OUR model:** we already use composites well — `ref.shadow.*` are proper DTCG shadow arrays, and `sem.typeStyle.*` are effectively typography composites (font+size+weight+leading+case). But our `typeStyle` composites are **not DTCG-conformant**: they lack `$type: "typography"` and use bare `{ref...}` strings for sub-values rather than the composite object shape. Same for `sem.sell.*` and `sem.eventTint.*` (bg/text pairs) — they're ad-hoc objects, not typed composites. This is fine for a hand-authored system but is the main thing standing between us and strict DTCG conformance (Part D6).

---

## Part B — Reference map (the sources, by strand)

1. **Naming taxonomy** — [EightShapes: Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676) · [Reimagining a Token Taxonomy](https://medium.com/eightshapes-llc/reimagining-a-token-taxonomy-462d35b2b033) · [Tokens in Design Systems (10 tips)](https://medium.com/eightshapes-llc/tokens-in-design-systems-25dd82d58421)
2. **Tiers / global-alias-component** — [Material 3 tokens](https://m3.material.io/foundations/design-tokens/overview) · [Atlassian all-tokens](https://atlassian.design/components/tokens/all-tokens) · [thedesignsystem.guide: 50 token files](https://learn.thedesignsystem.guide/p/50-design-token-files-one-problem) · [Design Systems Collective: systematic taxonomy](https://www.designsystemscollective.com/systematic-taxonomy-in-design-tokens-a-framework-for-scalable-ui-architecture-45cc6f2c7686)
3. **Theming / multi-context** — [Material 3](https://m3.material.io/foundations/design-tokens/overview) · [uxpin: complete guide](https://www.uxpin.com/studio/blog/what-are-design-tokens/) · [multi-theme CSS variables + data attributes](https://www.hirejeffgreen.com/blog/multi-theme-design-system-css-variables) · [dark mode via CSS variables](https://dev.to/bishoy_bishai/implementing-dark-mode-css-variables-system-preference-and-persistence-2a43)
4. **Aliasing / resolution / transforms** — [Style Dictionary: tokens](https://styledictionary.com/info/tokens/) · [reference resolution](https://deepwiki.com/amzn/style-dictionary/5-reference-resolution) · [transitive transforms](https://github.com/style-dictionary/style-dictionary/tree/main/examples/advanced/transitive-transforms)
5. **File structure / source of truth (no build)** — [Penpot: developer's guide to tokens & CSS vars](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/) · [nazzan: CSS-only design system](https://nazzan.uk/articles/building-a-css-only-design-system-with-custom-properties)
6. **W3C DTCG format** — [DTCG format module 2025.10](https://www.designtokens.org/tr/drafts/format/) · [first stable version announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) · [Style Dictionary: DTCG](https://styledictionary.com/info/dtcg/) · [Taste Profile: practical DTCG guide](https://tasteprofile.io/blog/w3c-dtcg-design-tokens-practical-guide)

---

## Part C — Naming convention spec for the Ivycoast Hub

Adopt Curtis's ordered-grammar model, tuned to our three tiers. **General → specific, left → right. Include only the levels a token needs; never reorder.**

### C1. The grammar

```
<tier> . <category> . <concept/family> . <property?> . <variant?> . <state?> . <scale?>
```

| Level | Meaning | Our examples |
|---|---|---|
| **tier** | ref / sem / cmp (or the CSS namespace, see C3) | `ref`, `sem`, `cmp` |
| **category** | the token's domain | `color`, `space`, `size`, `font`, `radius`, `shadow`, `duration`, `easing`, `control` |
| **concept/family** | the named thing within the category | `ivy`, `ink`, `paper` (ref); `primary`, `surface`, `text`, `error` (sem); `card`, `btnPrimary`, `seg` (cmp) |
| **property** | what aspect (mostly at cmp tier) | `bg`, `border`, `color`, `radius`, `padX` |
| **variant** | a branch of the concept | `Secondary`, `Tertiary`, `Subtle`, `Light` |
| **state** | interaction state | `Hover`, `Active`, `Disabled`, `Selected` |
| **scale** | numeric step (ref tier only) | `900`, `600`, `050` |

### C2. Tier-specific rules

- **`ref.*` — name for *what it is* (the menu).** Family + numeric scale: `ref.color.ink.600`, `ref.space.4`, `ref.radius.lg`. Scale is *perceptual*, not literal (900 = darkest, not "9× something"). Keep the 3-digit zero-padded convention for color scales (`050`, `900`) so they sort correctly; keep the short t-shirt scale for dimensions (`sm/md/lg/xl`) where a numeric ramp would be false precision. **Never put a role word in a ref name** (`ref.color.ivy.900`, never `ref.color.brand`).
- **`sem.*` — name for *why* (the intent/role).** Role + optional variant + optional state, `camelCase`: `sem.color.textSecondary`, `sem.color.primaryHover`, `sem.color.borderSubtle`. **Never put a hue or a raw value in a sem name** (`sem.color.link`, never `sem.color.ivy` or `sem.color.green`). The status families (`success/warning/error/neutral`) are intents; the `Bg`/`Text` suffix is the property.
- **`cmp.*` — name for *where/what it does here*.** Object + property, `camelCase`: `cmp.btnPrimary.bg`, `cmp.card.radius`, `cmp.listRow.selBar`. A `cmp` token exists **only** if the object diverges from (or may plausibly diverge from) the plain semantic role.

### C3. CSS mirror naming (the `:root` side)

Our JSON mirrors `index.html :root`. Map the grammar to custom-property names with a flat, dash-delimited convention that encodes the tier:

```
--ref-color-ink-600     --sem-color-text-secondary     --cmp-btn-primary-bg
```

Today the `:root` likely uses shorter names (`--color-primary`, `--motion-drawer`). **Decision to make (Part E):** either (a) keep the short production names and treat the JSON `ref/sem/cmp` paths as the logical model the short names implement, documenting the map; or (b) adopt the tier-prefixed names for new tokens and migrate opportunistically. For a hand-authored single file, (a) is pragmatic — but the *mapping table* must exist so the two never drift (this is our "single source of truth" discipline, Part E4).

### C4. Anti-collision & scale rules (why this scales)

- The fixed order guarantees a new token slots in without ambiguity: a new "text color for disabled links" is unambiguously `sem.color.linkDisabled` (role·variant·state), not `sem.color.disabledLink` or `sem.color.link.off`.
- Alphabetized, tier-grouped names sort into readable clusters (`textDisabled`, `textHeading`, `textInverse`, `textMuted`, `textSecondary`, `textTertiary` group visually).
- Zero-pad numeric scales so `050` sorts before `100`.
- One casing per tier (numeric-dot for ref scales; camelCase for sem/cmp roles). Don't mix.

---

## Part D — Critique of our current `design-tokens.json`

Measured against best practice on the five engineering axes.

### D1. Is our `sem` layer real intent or pass-throughs? — **Mostly real; a handful to examine.**

**Real intent (pass "why not what"):** `text*`, `surface*`, `border*`, `success/warning/error/neutral*`, `settleBg/Text`, `primaryTint`, `hoverTint`, `link`, `linkExternal`, `stage*`. These name roles that survive a rebrand/theme — correct. Notably `sem.color.primary` and `sem.color.link` both resolving to `ivy.900` is **correct duplication** (A3): two intents that coincide today and could diverge.

**Examine (possible pass-throughs — 1:1 with no independent future):**
- `sem.color.sectionLabel → ref.color.ivy.label` — `ivy.label` (`#062420`) is a ref that exists *only* to feed this one sem. That's a ref-with-a-single-consumer that arguably encodes intent already at ref level. Not wrong, but it's the pattern to watch: the *intent* ("section eyebrow color") lives in `sem`, the *hue* in `ref` — keep it, but don't multiply it.
- `sem.color.stageProspect/Outreach/Negotiation → ref.color.blue.500 / yellow.500 / coral.500` — each ref hue exists solely for its one stage. This is fine (the ref is the reusable "coral" primitive, the sem is the stage role) **but** these refs (`blue.500`, `yellow.500`, `coral.500`) have exactly one consumer each. If no second consumer ever appears, they're candidates to be understood as "stage palette" rather than general primitives. Low priority.

**Verdict:** our sem layer is genuinely opinionated intent, not a rename layer — this is a strength. Don't add sem tokens speculatively (resist Atlassian-scale sprawl).

### D2. Are the `cmp` tokens earning their indirection? — **Mostly yes; a few forward with no divergence.**

Good, earned cmp tokens (they diverge from the plain role): `cmp.pcard.radius` (`lg` vs card's `xl`), `cmp.cardSubdued.bg` (`surfaceSecondary`), `cmp.btnTint.bgHover` (inverts to primary), `cmp.seg.indicatorBg`, `cmp.listRow.selBar`. These are the point of a component tier.

Weak cmp tokens (forward a semantic role 1:1 with no divergence and no obvious future divergence): several `bg → sem.color.surface`, `border → sem.color.borderSubtle` repeated across `card`, `tile`, `input`, `btnGhost`. These aren't *wrong* — they document the object's wiring and give a future override point — but they're the closest thing we have to Atlassian-style token count without Atlassian-style need. **Not a bug to fix**, just the axis to watch: don't add a cmp token unless the object needs a knob.

### D3. Anything hardcoded that breaks the cascade? — **Yes. This is the top finding.**

Raw literals sitting in `cmp` where a `ref` alias belongs (A6):

| Token | Literal | Should be |
|---|---|---|
| `cmp.badge.padY` | `"1px"` | a `ref.space` step (add `ref.space.0-25 = 1px` or accept as sanctioned like the gutter) |
| `cmp.badge.padX` | `{ref.space.1-5}` ✓ | already correct — shows the fix pattern |
| `cmp.seg.indicatorRadius` | `"10px"` | `ref.radius.*` (we lack a 10px radius; either add or reuse) |
| `cmp.helpTip.btnSize` | `"18px"` | `ref.control.*` or a new `ref.size` — 18px recurs (count-chip min-width is also 18px) |
| `cmp.drawer.overlayScrim` | `"rgba(0,0,0,0.28)"` | `ref.color.scrim` (and reconcile with the person-drawer's `0.32` — see `DESIGN_SYSTEM.md` appendix #4) |
| `cmp.drawer.width` | `"min(560px,94vw)"` | **legitimate one-off** — keep, but the `560` could be a named `ref.size.drawer` |
| `cmp.toast`/`cmp.seg` motion | reference `{ref.duration.*}` ✓ | already correct |

These raw values won't respond to a global edit and won't flip under a theme. **Fixing them is the single highest-value token-engineering refinement.**

### D4. Token explosion or over-indirection risk? — **Low on explosion; watch over-indirection.**

We are *not* at risk of explosion (sem ~50, cmp ~20 objects — Spectrum-scale opinionated, correct for one product). The mild risk is over-indirection in `cmp` (D2): four+ objects each restating `bg/border` that all resolve to the same two sem tokens. Acceptable, but if we ever generate the `:root` from this JSON, collapse identical forwards.

### D5. Naming consistency? — **Good, but undocumented and slightly mixed.** Fixed by Part C.

- Mixed scale conventions: color uses numeric (`ink.600`) while size/radius use t-shirt (`sm/md/lg`). This is *justified* (perceptual color ramp vs discrete dimension steps) — document it as intentional (C2), don't unify.
- `sem.sell.*` and `sem.eventTint.*` use nested `{accent,bg}` / `{bg,text}` objects — these are effectively **composite tokens** but aren't typed as such (D6).
- `cmp.navTab."style-size"` uses a hyphenated key inconsistent with the camelCase everywhere else — rename to `styleSize` or `size`.

### D6. DTCG conformance? — **Partial. Ref tier is clean; sem/cmp composites are ad-hoc.**

We declare `$schema: designtokens.org/format` and target DTCG 2025.10 (now the [first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)). Where we conform: `ref.*` tokens use `$type` + `$value` correctly; `ref.shadow.*` are proper shadow-composite arrays; aliases use `{dot.path}` curly syntax; we use `$description`/`$meta`.

Where we **don't** conform (and whether to fix):
1. **`sem.typeStyle.*` are untyped typography composites.** DTCG defines a `typography` composite `$type` with sub-values `fontFamily/fontSize/fontWeight/lineHeight/letterSpacing` ([DTCG format](https://www.designtokens.org/tr/drafts/format/)). Ours use bare keys (`font/size/weight/leading/case`) with alias strings and a non-standard `case`. To conform: wrap in `{"$type":"typography","$value":{...}}`, rename keys to DTCG names, and move `case` to `$extensions` (it's not a DTCG typography sub-value).
2. **`sem.sell.*` / `sem.eventTint.*` are untyped color-pair objects.** DTCG has no "color pair" composite; the conformant modeling is *two tokens* (`sem.sell.new.accent`, `sem.sell.new.bg`), each `$type:color`. Our nested shape is more readable but non-standard.
3. **`cmp.*` tokens lack `$type` and `$value`** — they're bare `{"bg":"{sem...}"}` maps, not DTCG tokens. Strictly, each should be `{"$type":"color","$value":"{sem.color.surface}"}`.
4. **Group-level `$type` inheritance** — DTCG lets a group hoist `$type` so children inherit it ([DTCG format](https://www.designtokens.org/tr/drafts/format/)); we repeat `$type` on every leaf. Hoisting `"$type":"color"` onto `ref.color` would cut noise.

**Recommendation:** conform the **ref tier strictly** (it's the interoperable layer a tool would consume) and hoist group `$type`. For sem/cmp, DTCG-conformance is *optional for us* — we have no build tool consuming it, and the ad-hoc composites are more legible by hand. Adopt strict composites only if/when we add Style Dictionary or Tokens Studio. Document this as a deliberate, scoped conformance target, not an accident.

---

## Part E — Theming / branching readiness

What our model needs so a future **dark mode**, **second brand**, or **density mode** is a clean semantic-layer swap (A5), with no component edits.

### E1. The one structural requirement: zero literals in objects
A theme swap only reaches values that flow through `sem.*`. Every raw literal in a `cmp` (D3) is a value the theme *cannot* flip. **Prerequisite for theming = close D3.** Until the scrim, `18px`, `10px`, `1px` literals point at primitives (or are consciously theme-invariant), a dark mode would have visible light-mode leaks.

### E2. Model themes as a semantic-layer override block, no build step
In `:root` we keep primitives + the light semantic resolutions. A theme is a sibling block that **re-points only `--sem-*` variables**:

```css
:root { --sem-color-surface: var(--ref-color-paper-0);  /* #fff */
        --sem-color-text:    var(--ref-color-ink-800); }

@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
        --sem-color-surface: var(--ref-color-ink-900);
        --sem-color-text:    var(--ref-color-paper-0); } }

:root[data-theme="dark"] {           /* manual override wins */
        --sem-color-surface: var(--ref-color-ink-900);
        --sem-color-text:    var(--ref-color-paper-0); }
```

Components (`--cmp-*`) and primitives (`--ref-*`) **do not appear** in the theme block — that's the robustness test (A5). This works in our single hand-authored HTML file with **no compiler**: it's just CSS cascade ([multi-theme CSS variables](https://www.hirejeffgreen.com/blog/multi-theme-design-system-css-variables); [nazzan, CSS-only DS](https://nazzan.uk/articles/building-a-css-only-design-system-with-custom-properties)).

### E3. Dark mode needs a few semantic *splits* we don't have yet
Our light palette collapses some intents that must diverge in dark mode:
- **Elevation-by-surface vs elevation-by-shadow.** In light we use shadow for elevation; dark UIs typically use *lighter surfaces* for elevation (shadows disappear on dark). We'd need `sem.color.surfaceRaised` as a distinct role (today implied by shadow only).
- **`primaryTint`** (`#e8f0ee`, a light wash) has no dark analog — in dark it must become a low-opacity ivy overlay, not a near-white. The *role* survives; the value must be theme-supplied. Fine — just confirm every tint role is value-swappable, not assumed light.
- Status `*Bg` tints (`successBg #e6f4ea` etc.) are light washes; dark needs darker desaturated fills. Roles survive; values swap.

None of these break the architecture — they're semantic tokens that need a *second resolution*. The readiness action is to **audit that every color intent has a name that is theme-neutral** (most do: `surface`, `text`, `borderSubtle`; a few names like `primaryTint` are borderline but acceptable since "tint" is a role, not a lightness claim).

### E4. Density mode is a *dimension* swap, cleaner than color
A "compact" mode re-points spacing/control-height semantics. We don't currently have *semantic* spacing (objects reference `ref.space.*` directly, e.g. `cmp.card.padX → ref.space.4`). For density to be a clean swap we'd need a thin semantic spacing layer (`sem.space.cardPad → ref.space.4`) that a compact theme re-points to `ref.space.3`. **Tradeoff:** that adds indirection we don't need today (A4). Recommendation: defer — introduce `sem.space.*` only if/when density becomes a real requirement, and only for the handful of pads that would actually change.

### E5. Second brand = swap `ref` brand family + it cascades free
Because `sem.color.primary/Hover/Tint/link/sectionLabel` all alias the `ref.color.ivy.*` family, a second brand is: add `ref.color.brandB.*`, and in the brand-B block re-point those ~5 sem tokens. Every button, seg, link, contract chip, Invoiced column follows. This already works in our model — it's the cleanest of the three theme types.

---

## Part F — Prioritized punch-list

Refinements to `design-tokens.json` + `DESIGN_SYSTEM.md`, from the token-engineering angle specifically. Ordered by value.

**P0 — Close the cascade breaks (unblocks theming; highest value)**
1. Replace raw literals in `cmp` with `ref` aliases (D3): `cmp.badge.padY 1px`, `cmp.seg.indicatorRadius 10px`, `cmp.helpTip.btnSize 18px`, `cmp.drawer.overlayScrim rgba`. Add the missing primitives where needed: `ref.color.scrim`, a 10px radius or 18px control/size. Reconcile the two scrim opacities (`0.28`/`0.32`) into one `ref.color.scrim` (also closes `DESIGN_SYSTEM.md` appendix gap #4).
2. Audit rule: add "**no raw literal in any `cmp` token — alias a `ref`; the only sanctioned literals are the drawer width `min(560px,94vw)` and any explicitly-listed one-off**" to the §6.4 cascade-integrity audit.

**P1 — Write down the grammar (prevents future drift)**
3. Add the Part C naming spec to `DESIGN_SYSTEM.md §2` (or a new §2.5 "Token naming grammar"): the ordered levels, the tier-specific casing/scale rules, the "name why not what" test for sem, the "must diverge" test for cmp.
4. Document the intentional mixed-scale convention (numeric color ramp vs t-shirt dimensions) so it's not "fixed" later (D5).
5. Add the `:root` ↔ JSON name-mapping table (C3) and the single-source-of-truth rule that a token added to one must be added to the other (already in §7.3 — make the *mapping* explicit).

**P2 — Sharpen DTCG conformance where it pays**
6. Hoist group-level `$type` (e.g. `"$type":"color"` on `ref.color`) to cut per-leaf repetition (D6.4).
7. Conform the **ref tier strictly**; add `$type`/`$value` to `cmp` leaves *if* we ever add a token tool — otherwise document the ad-hoc `cmp`/composite shape as a **deliberate, scoped** non-conformance (D6), not a defect. Note the spec is now the [first *stable* DTCG version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) — safe to pin to.
8. Rename `cmp.navTab."style-size"` → `styleSize` (D5).

**P3 — Theming readiness (do when a second theme is actually wanted)**
9. Add the theme-swap section to `DESIGN_SYSTEM.md §6.3`: theme = a `:root[data-theme]` / `@media` block that re-points **only `--sem-*`**, never `--ref-*` or `--cmp-*` (E2), with the robustness test (A5).
10. Pre-identify the dark-mode semantic splits (E3): `surfaceRaised`, dark analogs for `primaryTint` and status `*Bg`. Don't build them yet — list them so dark mode is a known, bounded job.
11. Defer `sem.space.*` (density layer) until density is real (E4) — record the decision so it's a conscious deferral, not an omission.

**P4 — Hygiene (low urgency)**
12. Flag single-consumer `ref` hues (`blue.500`, `yellow.500`, `coral.500`, `ivy.label`) as "stage/label palette" in a comment so their 1:1 nature is understood, not mistaken for general primitives (D1).

---

## The five deepest insights (the through-line)

1. **A theme is a swap of alias resolutions at exactly one tier.** Robust theming = only `sem.*` varies per theme; `ref.*` and `cmp.*` never move. Our architecture already supports this — the only thing between us and a clean dark mode is the raw literals in `cmp` (P0).
2. **The pass-through test — "name for *why*, not *what*."** A semantic token earns its tier only if it names an intent that could independently change; two intents resolving to the same primitive (our `primary`==`link`) is *correct*, not duplication.
3. **Tier count is a philosophy dial, and our risk is the opposite of the famous one.** We won't token-explode (we're Spectrum-opinionated, ~50 sem); our watch-item is `cmp` tokens that forward a role without diverging — indirection without payoff.
4. **A token name is an ordered grammar (namespace·category·concept·property·variant·state·scale), not a label** — writing that grammar down (Part C) is what lets us add the 200th token without a collision or a judgment call.
5. **Every raw literal in a component is a broken edge in the dependency graph** — it won't cascade and won't theme. Our `18px`/`10px`/`1px`/scrim literals are the concrete cascade breaks; fixing them (P0) is the single highest-value refinement.
