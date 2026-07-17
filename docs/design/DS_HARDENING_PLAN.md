# Design-System Hardening — Market-Ready Fidelity (Taka, 2026-07-15)

Owner directive: "let's strengthen it and make it market ready fidelity level."
Scope: the design system + token system themselves — burn the pre-system debt, enforce one
source of truth, converge legacy mechanisms. NOT a visual redesign; pages should look the
same or imperceptibly cleaner afterward (near-miss corrections shift colors ≤ Δ11).

**Sequencing (owner decision 2026-07-15): starts AFTER the slice-6 run is approved + pushed.**
Runs as its own review ticket. ONE writer on index.html; phases are sequential on the file.

Baseline at plan time: raw hex 190 uses / 72 distinct · raw px 1,858 uses / 89 distinct ·
near-miss hexes 19 · canonical colors 41 · gate baseline 193/1890/19 (ratchets down only).

---

## Phase 0 — CLOSE THE AUDIT BLIND SPOT (added 2026-07-15 after owner's "is everything on tokens?" question — measured findings)
The gate only scans the `<style>` block. Measured escape routes it never sees:
- 185 inline `style=""` attributes in markup (67 w/ raw px, 4 w/ raw hex)
- 97 `style.cssText` assignments + 123 direct `style.prop = "...px"` in JS
Fix in two moves: (a) EXTEND `token-audit.js` to scan inline style attributes and JS
string literals assigned to style/cssText, with its own ratcheting baseline; (b) SWEEP the
worst offenders into classes/tokens (many are lazy one-offs like `style="font-size:12px"`
that belong on an existing utility). Until this closes, the ratchet has a side door.

**→ (a) TOOLING SHIPPED 2026-07-17 (report-only, commit dc3759f)** — token-audit.js now
measures every escape route on each run. Live numbers at ship: 184 inline style attrs ·
96 cssText writes · 520 `.style.prop` writes (broader regex than the 123 estimate — it
counts ALL JS style writes incl. dynamic widths; the sweepable subset is the string-
literal ones) · z-index 47 uses/21 distinct (0→99999) · 124 raw font-size px ·
22 auto-margins (watchlist for the 2026-07-16 flex defect class) ·
**JSON↔:root sync: 0 misses — the two sources are verifiably in sync** (checker handles
numeric $values + 3-digit hex). Remaining Phase-0 work: ratcheting baselines for these
counts (flip report→gate) + move (b), the sweep itself (index.html, needs its own pass).

Also measured, new token-category gaps (fold into Phase 1 tooling + Phase 4 sweeps):
- **z-index: ZERO tokens, 47 raw uses, 22 distinct values** (1…99999). Define a layer
  scale (`--z-raised / -dropdown / -sticky / -panel / -scrim / -modal / -toast`, ~6 stops),
  sweep all 47 onto it, audit any raw z-index thereafter. This is the stacking-bug factory.
- **~100 raw `font-size: 10/12/14px`** sitting beside the existing `--text-*` scale —
  drift within a covered category; include in the Phase-4 px sweep explicitly.
Coverage ratio at measurement: 4,029 `var()` uses vs ~2,050 stylesheet raw values +
~290 inline/JS raw values ≈ two-thirds tokenized.

## Phase 1 — One source of truth + tooling (no index.html edits; lowest risk, do first)
1. **JSON ↔ :root sync checker**: extend `scripts/token-audit.js` (or sibling script wired
   into the same pre-commit gate) to FAIL when a token exists in `design-tokens.json` but
   not in the `:root` block, or vice versa, or when values disagree. Kills the two-sources
   drift risk permanently.
2. **Canonical breakpoint set**: media queries can't take custom properties — so declare
   the official set in DESIGN_SYSTEM.md (survey first; today's known: 640 / 768 / 980 /
   1100 / 1280) and teach the audit to flag any media query using a NON-canonical width.
3. **Policy doc for legitimate raw px**: some px are structurally raw (SVG geometry,
   transforms, letter-spacing, the 2px table underline that has no border-width token —
   or add `--border-w-*` tokens and eliminate the exemption). Write the allowlist as
   §7.x in DESIGN_SYSTEM.md so "remaining raw px" becomes a defined, auditable class
   instead of an amorphous pile.

## Phase 2 — Near-miss hex sweep (19 → 0, then GATE at 0)
The dangerous drift: colors within Δ≈11 of a canonical token but not it. The audit already
prints the exact mapping (e.g. #e8e8e8→#ebebeb, #3c4043→#424242, #fee→#fce8e6). Replace
each with `var(--token)` of its canonical match. Visual change is sub-perceptual but real —
flag in the ticket for the owner eyeball. Then ratchet the near-miss baseline to 0 and treat
ANY near-miss as a gate failure forever.

> **BAR RAISED (owner, 2026-07-15): "technically our whole UI code should be token."**
> The targets below are superseded by 100% tokenization — see the rewritten exit criteria
> in Phase 6. Phases 3/4 run to ZERO, not to an allowlist floor; anything genuinely new
> gets PROMOTED to a named token rather than left raw.

## Phase 3 — Raw hex burn-down (190 → ZERO outside :root)
Context-aware, NOT regex-blind — the same hex means different tokens by property:
- `#fff` ×42: background → `--color-surface`; color on dark → `--color-text-inverse`.
- `#000` ×21: shadows/scrims → shadow/scrim tokens; rare true-black text → heading token.
- Then the frequency tail (#d9d9d9 ×7, #f5f5f5 ×6, #3c4043, #ddd, #e8f5e9, #d2e3fc,
  #157be1, #58bfb3…) — each mapped or, if genuinely new (chart palettes, brand seeds),
  PROMOTED to a named token instead of left raw.
Sequential passes on index.html, gate ratchet after each, verify loop every landing.

## Phase 4 — Raw px burn-down (1,858 → ZERO design-value px)
Sweep by value-bucket against the spacing/size scale (4→--space-1 … 16→--space-4 …
24/32/48; control heights → --control-h-*; radii → --radius-*). Property-aware: only
tokenize spacing/size/radius properties; allowlisted properties stay per Phase-1 policy.
Big and mechanical — run as several bounded passes (by CSS region) so each is verifiable
and revertible. Ratchet after each pass.

## Phase 4b — Kill the SECOND drift class: state-contract forks (owner question 2026-07-15: "what can we do to fix it")
Found live twice in one day: seg selected-text keyed on `aria-selected` only (aria-pressed
period toggle = dark-on-dark text); header icons sized three different ways (no-size svg /
20px attr / font glyph). Beyond raw values, components drift when each VARIANT styles
itself through a different hook. Three moves, in order:
1. **ONE STYLING HOOK (structural fix).** ARIA attributes are for screen readers ONLY.
   Every stateful component's JS sets one canonical class (`.active` / `.open` / `.sel`)
   alongside whatever ARIA its variant requires, and ALL state CSS keys on that class
   alone. Sweep: rewrite state selectors off `[aria-*]` onto the class; verify every
   setter sets the class. A variant then CANNOT fork the styling — one hook exists.
   Same rule for icons: SVG only, sized by `--size-icon` via the component's CSS,
   NEVER by width/height attributes or font glyphs (ref.size.icon added 2026-07-15).
2. **CONTRACT AUDIT (enforcement).** Sibling script to token-audit, same pre-commit
   gate: parse CSS state selectors per component class + parse JS classList/setAttribute
   mutations per component; FAIL on (a) a marker set in JS with no CSS coverage —
   today's bug — and (b) CSS styling a marker no JS sets (dead contract). After move 1,
   simplifies to: any state selector on an ARIA attribute = violation.
3. **GALLERY AS THE VISUAL NET.** Extend concepts/design-system/gallery.html (EN+JA)
   into a full VARIANT × STATE matrix — every component, every variant, every state,
   one page. Forks become visible in one scroll; also catches what static analysis
   can't (icon-size chaos was invisible to every audit). The gallery gets re-eyeballed
   after every sweep and becomes the fidelity certification artifact for Phase 6.
Components to sweep under move 1: seg (marker-tolerant today, single-hook endgame),
tabs, badges, chips/fchips, panels (body-class variants), buttons, help-tip, rowlinks.
§7 rule to add: a variant needing its own copy of a state rule is a FORK = defect.

## Phase 5 — Mechanism convergence (kill the legacy duplicates)
1. **`.pipe-filter` → `.seg`** on the two remaining flat-pill segs (Tools 配合/材料,
   Docs/Boldoath) — same sliding component as Partners/Orders; setToolsTab/setGrowTab
   re-wired; keyboard via `_initSegKeyboard` (already live-query safe).
2. **`.crm-header-*` → `.page-hd*`** markup rename on Partners (CSS aliases already exist);
   then drop the alias selectors.
3. **Deprecated token cleanup** per §7 policy: remove `cmp.drawer.*` aliases and any
   token at zero consumers; drop long-dead i18n keys noted across the run (sell.* keys
   stay — renaming them is churn without user value; document as accepted).
4. **`.crm-title` raw #181818** and similar stragglers caught by Phase-3 mapping.

## Phase 5b — COMPONENT CONSOLIDATION: reduce code by extraction (owner insight, 2026-07-16)
Tokens fix the VALUE layer; the remaining drift lives in the STRUCTURE layer — duplicated
hand-rolled markup/render logic per page. Fix = the third rung: pages become compositions.
1. **Duplication census**: count hand-rolled instances of each structure (page-header divs
   ×8 pages, table-row builders, kv rows, card heads, empty states, toolbar rows, drawer
   shells). The census number becomes a RATCHET like the token baseline — copies only go down.
2. **Extract → delete copies**: one builder per object (the proven wins: renderMasterDetail,
   _syncStaticSeg, _railSearchInput, _pMakeCard — extend the pattern to buildPageHeader(),
   buildTableRow(spec), buildEmptyState(), buildToolbar()). Every extraction makes the next
   divergence IMPOSSIBLE, not just detectable.
3. **Regeneration rule feeds this**: every drifted surface rebuilt (drawer, Tools, product
   panel) is rebuilt AS COMPOSITION — its old bespoke layers deleted wholesale. File size
   converges downward across the queue instead of accreting.
4. **Metric**: total index.html line count + census counts tracked per pass in the ticket.
5. **Later decision (not this run)**: a build step splitting components into source files
   and assembling index.html at deploy — the true fix for single-file accretion; evaluate
   after the component inventory exists (it IS the file-split map).

## Phase 6 — Fidelity certification
1. Full Halle sweep: token audit at new floor, visual regression eyeball list, a11y spot
   checks on everything the sweeps touched.
2. iris-design (Jude) market-fidelity review: judge the SYSTEM (not the pages) against
   Polaris/Material/Primer bar — token coverage, naming, docs completeness, contribution
   rules — and return a gap list. Anything structural feeds a follow-up; cosmetics land
   in the same run.
3. Exit criteria — **100% TOKENIZATION** (owner bar, 2026-07-15: "technically our whole
   UI code should be token"):
   - **Raw hex = 0** outside the :root definitions. New colors are promoted to named
     tokens, never written inline. Near-miss class ceases to exist.
   - **Raw px = 0 for every design-value property** (space/size/radius/type/border/shadow
     offsets), in ALL THREE layers: stylesheet, inline style="", JS-painted styles.
   - **Irreducible-raw list is CLOSED and mechanical, not judgment-based:** (a) media-query
     widths — CSS cannot var() there; must equal a canonical breakpoint constant, audit-
     checked; (b) SVG path/viewBox geometry — drawing data, not design values; (c) pure
     geometry percentages (translate(-50%) centering). NOTHING else.
   - **z-index 100% on the layer scale**; font sizes 100% on --text-*; borders on
     --border-w-*.
   - Audit covers all three layers (Phase 0) with baseline 0-0-0 and FAILS on any raw
     design value — the gate stops being a ratchet and becomes an absolute wall.
   - JSON ↔ :root sync enforced by the gate.
   - Zero legacy mechanisms or alias classes; deprecated tokens deleted.
   - DESIGN_SYSTEM.md §7 updated so a stranger could contribute without creating drift —
     and mechanically COULDN'T create drift, because the wall rejects it.

## Working rules (unchanged)
One writer on index.html · verify loop every landing (node --check + gate + innerHTML==2 +
markers) · agents get single-topic briefs with line anchors, TaskStop on completion ·
Halle QA before trusting · own ticket, nothing pushes without APPROVED.md · SW cache bump.
