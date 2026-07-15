# Ivycoast Hub — Design System Charter (Taka's vision, 2026-07-13)

The brief for the canonical design-system doc (`DESIGN_SYSTEM.md`) to be authored. Captures WHAT the system must be and WHY, so the authored spec is grounded, extensible, and never leaves us stuck.

## The vision (Taka, verbatim intent)
- The signed-off concept (`concepts/round2/concept-b-loop.html`) is a GOOD FOUNDATION for the UI — its tokens, some layouts and grids. KEEP it as the base.
- But EXPAND it into a complete system that covers EVERYTHING in the app, so when a NEW object or page is introduced we are NOT stuck.
- In theory the app should have only a SET, FINITE catalog of: object TYPES, CONCEPTS, and LAYOUTS. A new page = either remove elements from an existing pattern, or neatly place content into it. Never a blank-canvas design.
- TOKEN-DRIVEN CASCADE: editing the primary token for a concept/object/layout refines EVERY page that uses that same tokened concept/object/layout. Build once → replicate → refine one thing → all instances update.
- BRANCHING: create unique, branched objects/concepts derived from a BASE concept (inherit the base's tokens/structure, override only specific properties) — like extending a base class.
- The feel is Tailwind: composable primitives + a token layer, built once and reused, refinable at the source.

## Required structure of DESIGN_SYSTEM.md (single source of truth)
1. **Principles & the cascade model** — the layered model (tokens → objects → concepts/layouts → pages), how a change at each layer cascades down, and the composition rule ("new page = compose existing objects into an existing layout; remove or place, don't invent"). Include the branching model (base → variant via token/prop override).
2. **Foundation / TOKENS (the primitives)** — the atomic, cascade-root layer. For EACH token group give value(s), the semantic ROLE, and WHEN/WHY to use which: spacing scale, type scale (sizes/weights/families, when mono/uppercase is a deliberate accent not a default), color families + semantic roles (surface/text/border/primary/status/stage/settle…), radius, shadow/elevation, motion/easing, control-height scale (`--control-h-*`), border. These are what you edit to cascade.
3. **OBJECTS (the component catalog)** — the FINITE set of components. For each (card, secondary-card, tile/stat-tile, badge + tint set, chip, count-chip, segmented control, button + variants, input/select/textarea, filter chip, list row, pipeline/board card, board column, per-card state indicator, side-panel, modal, toolbar, help-tip "?", empty state, toast, avatar/presence, nav tab, table…): anatomy, the tokens it consumes, its VARIANTS/BRANCHES, rules of use, and how to BRANCH it for a new object. Each object must be token-defined so a token edit refines all instances.
4. **CONCEPTS / LAYOUTS (the finite page patterns)** — for each (dashboard grid, board/pipeline, master–detail [list + non-blocking side panel], toolbar/filter-bar, form layout, list/table, detail side-sheet, empty page, split-preview): the grid/structure, spacing logic, when to use it, how to place content into it, responsive behavior, and how to branch it. Include the layout LOGIC (grouping/ordering/spacing rationale — e.g. primary action leads, filters cluster).
5. **Composition & extension rules** — step-by-step "how to build a new page/object without inventing": pick a layout → place objects → remove what's unused → branch if a variant is needed. The rule that keeps us un-stuck.
6. **Logic & reasons** — every rule carries its WHY, grounded in the concept + the external design-logic reference (`design-logic-reference.md`: Material 3, Polaris, HIG, Primer) + our own decisions. Not vibes.
7. **Governance** — how to add a new object/concept to the catalog (when it's justified vs. compose from existing), and how token edits are made so the cascade stays intact.

## Inputs to synthesize
- `concepts/round2/concept-b-loop.html` (the foundation — tokens, layouts, components).
- The production `:root` tokens + installed Loop components in `index.html` (~line 40–764) + `concepts/design-system/gallery.html`.
- `docs/migration/design-logic-reference.md` (external design-system logic — being researched now).
- `docs/migration/ux-interaction-principles.md` (side-panels, nested sweep, progressive disclosure, control consistency).

## Glanceability & card density (Taka, 2026-07-13)
Every OBJECT (especially the pipeline/board card, list row, contact/product card) must have a FIXED, PREDICTABLE anatomy so the eye learns where each piece lives and can glance-and-understand. The failure mode to fix: cards showing ~7 competing always-visible elements (type, id, invoice#, customer, amount, tracker, date, state badge, action).
Rules for the card object:
- **Consistent slots:** identity/meta always same place (small, muted), TITLE is the single hero (customer name), key metric (amount) has a fixed spot, ONE primary state signal (don't show a tracker AND a redundant status badge competing — pick the primary; demote the other), date is secondary/muted.
- **Progressive disclosure of density:** actions and secondary detail (e.g. the CREATE INVOICE button, the full tracker) can appear on hover/focus rather than always-on, so the resting card is calm and scannable. The tracker at rest is a whisper; detail on interaction.
- **Filters/tags carry the rest:** information that doesn't need to be on every card at rest is surfaced via filters, the card's tag, or the detail panel — not crammed onto the card.
- **Always visually consistent components:** the same badge/tag/amount/title treatment everywhere, so "what is what" is instant. This anatomy is defined ONCE as the card object and every board/list reuses it.
The design system must define this card anatomy explicitly (title/meta/body/state/actions slots) as a reusable, branchable object, per the design-logic reference (one Card primitive, fixed anatomy).

## Format
Primary: `docs/design/DESIGN_SYSTEM.md` (human-readable, the source of truth, with logic+reasons). Optionally a companion `design-tokens.json` capturing the token layer as machine-readable data if it helps the cascade. Prefer clarity + completeness so any future build reads this and composes, never invents.
