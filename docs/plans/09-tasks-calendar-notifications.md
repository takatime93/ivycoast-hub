# Plan 09 — Tasks: Calendar View, Dates, Google Calendar Sync, Notifications

**Requested:** Taka, 2026-09-07 (in session, scoping answered same day)
**Scheduled:** after Batch 1 (data-integrity) — task saves ride the same write path
C2 fixes; notifications are only trustworthy once writes are.
**Taka's calls (locked):** true Google Calendar sync · notifications on ALL THREE
channels (email + in-app dropdown + phone push) · queue position after Batch 1.

---

## Scope

Four features on the Tasks/Board surface, phased. Each phase is one session pass,
committed and QA'd (Halle) independently per the working method.

### Phase 1 — Dates + Calendar view (frontend + 1 schema column)

- **Schema:** add `startDate` to Tasks sheet (`ensureSheet` handles append;
  column order: id | name | status | priority | assignee | due | workspace |
  category | description | docLink | createdAt | updatedAt | entityType | entityId
  | startDate — NEW COLUMNS GO AT THE END, per column-order hard rule).
- **Task modal:** startDate + due fields (due already exists as `due`), native date
  inputs, bilingual labels (EN/JP — follow existing data-i18n pattern).
- **Cards:** show start→due range; existing overdue treatment unchanged.
- **Calendar view:** month grid toggle on the Tasks page (Kanban ⇄ Calendar seg,
  reuse existing seg component). Tasks render on due date; multi-day span
  start→due. Click card → existing task modal. Pure frontend, createElement only
  (innerHTML==2 gate). All spacing per DS §1.7 slots; tokens only (gate).

### Phase 2 — Google Calendar true sync (backend, Taka ride-along)

- Apps Script uses CalendarApp natively — no external API keys.
- **New OAuth scope** (`calendar`) ⇒ script re-auth + redeploy = **Taka ride-along**
  (same session pattern as V6 Judge.me deploy — can share the ride-along).
- Sync model: one-way Hub→Calendar (Hub is source of truth). Task with a due date
  ⇒ event on a dedicated "Ivycoast Tasks" calendar (NOT Taka's primary — keeps
  deletion/cleanup safe and lets Yoko subscribe to the same calendar). Store
  `gcalEventId` column on Tasks (append at end). Create/update/delete follows the
  task row. Time-boxed tasks later; all-day events first.
- Failure mode: calendar write failures must NEVER abort the task save
  (same null-guard convention class as C1 — log, queue retry, move on).

### Phase 3 — Notifications: email + in-app (backend + frontend)

- **Events:** created / edited / due-today / overdue. "Edited" = edited by the
  OTHER person only — add `updatedBy` column (append at end), suppress self-pings.
- **Email (MailApp):** instant on create/edit-by-other in the write path; daily
  digest (due today + overdue) via time trigger ~07:00 JST. Recipients:
  taka@ivycoast.co + yoko@ivycoast.co (allowlist reuse).
- **In-app:** feed the same events into the existing notification dropdown.
  NOTE: audit flagged the dropdown as EN-only — bilingualize while in there
  (overlaps Batch 3/bilingual sweep; don't double-do).
- **Notifications sheet** (new, `ntf-` prefix — add to prefixMap! C2 lesson:
  missing prefixMap entries fall to `ivy-` and caused id chaos): id | type |
  taskId | taskName | actor | recipient | readAt | createdAt.

### Phase 4 — Phone push (FCM) — the big one, own pass, maybe two

- Firebase is already in the stack (Auth) ⇒ add FCM. Service worker exists
  (sw.js) ⇒ add push handler + notification click-through.
- Apps Script sends via FCM HTTP v1 (needs a service-account key in Script
  Properties — NEVER in the repo; repo is public).
- Requires: notification permission prompt UX, token registration per
  device/user, token storage (sheet), Firebase config change ⇒ **Taka reviews
  first (hard rule)**.
- Honest sizing: this is the most work of the four and the most moving parts.
  If it drags, ship Phases 1–3 and let push be its own follow-up.

## Order & dependencies

Batch 1 (C2/C3) → Phase 1 (no deps) → Phase 2 (needs Phase 1 dates; ride-along)
→ Phase 3 (needs updatedBy; email first, in-app same pass) → Phase 4 (needs
Phase 3 event plumbing).

## Gates per phase

node --check · token gate · innerHTML==2 · Halle QA (web) before "QA'd" ·
Taka eyeball before "fixed" · no secrets in tracked files (esp. Phase 4).
