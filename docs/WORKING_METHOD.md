# Working Method — how we build the Hub without going haywire

Owner directive (Taka, 2026-07-16): "research and plan how to work efficiently and
accurately without all these issues with Claude Code and apps this size."
Grounded in the 2026-07-15 post-mortem (what actually failed) + Anthropic guidance.

## The five failure modes we actually hit (evidence, not theory)

1. **No checkpoints.** The entire multi-week run — 25,500 insertions — sat UNCOMMITTED
   because "never push without approval" got conflated with "never commit." No bisect,
   no revert granularity, one destructive command from total loss.
2. **Marathon sessions.** One session carried the whole run through a compaction and
   hours of rapid-fire fixes. Long-context precision decays: stale edit anchors, fixes
   claimed twice (scrollbar), work interleaved mid-edit.
3. **One 40,000-line file.** One-writer bottleneck serializes everything; agents stall
   exploring it; line anchors go stale between reads; every pass collides.
4. **Streamed feedback during editing.** Owner review arrived faster than fixes landed;
   five threads interleaved; snapshot conflicts; half-finished batches.
5. **"Fixed" claimed at code level.** Mechanical verification (syntax/gate/markers) was
   treated as done. It isn't: Claude cannot render. Two same-day counterexamples.

## The operating model (binding — summarized in CLAUDE.md)

### A. Git discipline
- `main` = deployed state, exactly. All work on a **branch per pass** (`pass/<topic>`).
- **Commit after every verified step** — local commits are free and are the undo system.
  A pass = 1–5 commits, each one passing the verify loop.
- NOTHING is pushed until `REVIEW/…/APPROVED.md` exists (repo is PUBLIC — a pushed
  branch is published). Push = merge to main + deploy moment.
- Regression found? `git bisect` between checkpoints instead of re-debugging blind.

### B. Session cadence — one pass per session
- A session picks ONE pass from the queue, finishes it, commits, updates SESSION.md,
  ends. Fresh context per pass beats one saturated marathon — accuracy is a context
  budget, spend it on the work not the history.
- Session start: read SESSION.md + state docs (they are the memory between sessions —
  keep them current; that machinery already works, it's what survived compaction).
- Emergency mid-session scope change = close current edit to a verified commit FIRST.

### C. Review is a batched loop, not a stream
- Owner feedback lands in the REVIEW INBOX (`docs/migration/review-roundN-spec.md`) —
  acknowledged and logged immediately, FIXED in planned batches.
- Batch = plan → build → verify → QA → commit → owner eyeball → next batch.
- Never start editing item N+1 while item N is half-landed.

### D. The verify ladder — and honest status language
1. **Mechanical** (every landing): node --check on extracted JS · token gate ·
   innerHTML == 2 · marker greps. Says the code parses and obeys the law.
2. **QA** (every batch): Halle adversarial audit — try to BREAK it, REAL/PARTIAL/BROKEN
   verdicts with line evidence.
3. **Visual** (every batch): owner screenshots / gallery screenshots. Claude cannot see;
   this rung is not optional.
- Status vocabulary is fixed: **"landed"** = rung 1 passed. **"QA'd"** = rung 2.
  **"fixed"** = all three. Claiming "fixed" at rung 1 is the failure mode — banned.

### D2. Research notes (official docs, fetched 2026-07-16)
- Fresh context beats accumulation: `/clear` between unrelated tasks; after 2 failed
  corrections on one issue, restart with a better prompt. (best-practices.md)
- Root CLAUDE.md survives compaction and is the only always-loaded memory — keep it
  compact (<200 lines), immutable facts only; domain detail lives in docs/skills.
- Writer/reviewer split with a FRESH-context reviewer is the official verification
  pattern — our Halle loop, formalized. (sub-agents.md)
- `Esc Esc` / rewind restores conversation+code checkpoints — useful for small oopses;
  git remains the real system (checkpoints don't capture Bash-made changes).
- Verification gates as HOOKS: PostToolUse can run checks automatically after every
  edit (exit 2 surfaces the error to Claude) — implemented today: index.html edits now
  auto-run the JS syntax check, so a broken edit is caught the second it lands, not at
  the end of a batch.
- Nuance on file splitting: docs say splitting doesn't cut context cost per se — our
  build-split motivation is PARALLELISM (multiple writers) + stable anchors + scoped
  agent briefs, which the docs do support via scoped reads. Sequencing unchanged.

### E. Shrink the surface (the structural cure)
- **Component consolidation** (DS_HARDENING_PLAN Phase 5b): extract shared builders,
  delete duplicated structures, ratchet the census. Pages become compositions.
- **Then the build split**: `src/` partials (css/, views/, js/) + a trivial assemble
  script producing index.html for GitHub Pages. Kills the one-writer bottleneck
  (parallel passes touch different files), shrinks per-task context to the relevant
  partial, makes agent briefs small and anchors stable. The component inventory from
  Phase 5b IS the split map. Sequenced after the current review queue clears.
- Drifted surfaces are REGENERATED as compositions against the concept + design system,
  never accumulated-patched (regeneration produced Sell v3 and the ledger; patching
  produced the surfaces the owner rejects).

### F. Agents (lessons already in memory, now binding)
- Single-topic briefs with pre-grepped line anchors; agent EDITS, orchestrator verifies.
- TaskStop every agent the moment its brief is done — completed agents have resurfaced
  and self-assigned work on stale surveys.
- After ANY agent failure: grep for its markers before deciding anything landed.
- QA agents are read-only. One writer on the monolith until the build split lands.

### G. Data-layer guardrails (from the seed-vanish post-mortem)
- Client and server versions can drift silently (deploy drift ate the Brand/材料 seeds).
  Every apps-script change notes DEPLOYED vs BUILT in SESSION.md; a version echo in
  batchList (server returns its ensure-flag; client warns on mismatch) goes into the
  next backend pass so drift is self-announcing.
- Optimistic local writes must survive an empty server echo (clobber-guard, specced).

## What changed today because of this doc
- `run/slice6-mega` branch created; full checkpoint committed (0545ba1). Undo exists.
- Halle adversarial audit of the unaudited round-2 batch dispatched (running).
- CLAUDE.md gains the binding summary so every future session starts inside this model.
