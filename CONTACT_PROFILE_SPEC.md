# Contact Profile — Data Model, Logic & Architecture Spec

This document defines the Contact object in full, its relationship to the Vendor system (see `vendor-crm-spec.md`), all derived data, all UI rules, and the two rendering contexts a contact appears in. Claude Code must follow this spec exactly. Do not infer, guess, or simplify any rule. Where this document conflicts with `vendor-crm-spec.md`, this document takes precedence for anything contact-related.

---

## 1. What a Contact Is

A Contact is a person. It is not a company, a vendor, or a role. A contact may be linked to a vendor, but it exists independently. If a contact changes companies, their record persists — only the vendor link changes.

A contact is not the same as a vendor. Do not conflate them. The vendor record describes the business relationship. The contact record describes the human being on the other side of it.

---

## 2. The Contact Object

Fields marked `[required]` must always have a value. Fields marked `[optional]` may be null or absent. Fields marked `[derived]` are computed at read time and never stored.

```
Contact {
  id:                     string        [required] — unique identifier
  name_ja:                string        [optional] — Japanese name, displayed first and larger when present
  name_en:                string        [required] — English / romanised name
  initials:               string        [required] — 2-character string for avatar display.
                                                     Derived from name_ja if present (first kanji of family + first kanji of given),
                                                     else first two characters of name_en uppercased.
                                                     Must be computed and stored at creation/update time, not at render time.
  title:                  string        [optional] — full job title string, may include Japanese and English separated by " / "
  avatar_image_url:       string        [optional] — uploaded photo. When present, shown instead of initials.

  // Contact info
  email:                  string        [optional]
  phone:                  string        [optional]
  line_id:                string        [optional] — LINE messenger ID
  instagram_handle:       string        [optional]
  preferred_contact:      string        [optional] — free text describing how they prefer to be reached,
                                                     e.g. "Email first, then LINE"

  // Vendor link — a contact belongs to at most one vendor at a time
  vendor_id:              string        [optional] — foreign key to Vendor. Null if contact is not linked to a vendor.
  vendor_role:            enum          [optional] — PRIMARY | SECONDARY | DECISION_MAKER | OPERATIONAL
                                                     Required if vendor_id is set. Null if vendor_id is null.
  is_primary:             boolean       [required] — true if this contact is the primary contact for their linked vendor.
                                                     Enforced: only one contact per vendor may have is_primary: true.
                                                     Must be false if vendor_id is null.

  // Personal context — owned by the contact, not the vendor
  languages:              string[]      [optional] — list of languages they speak, e.g. ["Japanese", "English"]
  communication_prefs:    string[]      [optional] — list of preference chips, e.g. ["Email first", "Japanese in writing", "LINE (fast)"]
  background:             string        [optional] — free text about their professional background and personality
  how_we_met:             string        [optional] — free text describing the first meeting context

  // Interaction tracking
  last_contacted_at:      timestamp     [optional] — timestamp of most recent logged interaction
  last_contacted_type:    enum          [optional] — EMAIL | CALL | MEETING | EVENT | MESSAGE | OTHER
                                                     Must be set whenever last_contacted_at is set.
  first_met_at:           date          [optional] — date of first recorded interaction or meeting

  // Metadata
  created_at:             timestamp     [required]
  updated_at:             timestamp     [required]
}
```

### 2.1 Derived fields — computed at read time, never stored

```
days_since_contact:   number | null
  = if last_contacted_at is null: null
  = else: floor((now - last_contacted_at) / 86400000)

interactions_count:   number
  = count of ContactInteraction records where contact_id = this contact's id

shops_introduced_count:   number
  = count of ActivityEvent records where
      event_type = SHOP_INTRODUCED
      AND related_contact_id = this contact's id
  (only meaningful if contact is linked to a CONNECTOR vendor)

peer_contacts:   Contact[]
  = all Contact records where vendor_id = this contact's vendor_id
    AND id ≠ this contact's id
  (used for "Also at [company]" section)
```

---

## 3. Supporting Objects

### 3.1 ContactInteraction

Every logged touchpoint with a contact. Append-only — interactions are never edited or deleted.

```
ContactInteraction {
  id:             string      [required]
  contact_id:     string      [required] — foreign key to Contact
  vendor_id:      string      [optional] — foreign key to Vendor, if interaction was in a vendor context.
                                           Null for purely personal contact.
  type:           enum        [required] — EMAIL | CALL | MEETING | EVENT | MESSAGE | OTHER
  summary:        string      [optional] — one-line summary shown in activity feed
  occurred_at:    timestamp   [required]
  created_at:     timestamp   [required]
}
```

When a `ContactInteraction` is created:
- Update `Contact.last_contacted_at` to `interaction.occurred_at` if it is more recent than the current value
- Update `Contact.last_contacted_type` to match
- Create a `ContactActivityEvent` (see 3.3)

### 3.2 ContactNote

A note written about a contact. Append-only — notes are never edited after creation.

```
ContactNote {
  id:             string      [required]
  contact_id:     string      [required] — foreign key to Contact
  body:           string      [required] — free text, no length limit
  context:        enum        [required] — GENERAL | MEETING | CALL | EMAIL | EVENT
                                          Displayed as a tag next to the note date.
  created_at:     timestamp   [required]
  created_by:     string      [optional] — user identifier, for future multi-user support
}
```

### 3.3 ContactActivityEvent

An immutable log of things that happened related to this contact. Separate from the vendor-level `ActivityEvent`. Never edited or deleted.

```
ContactActivityEvent {
  id:               string      [required]
  contact_id:       string      [required]
  event_type:       enum        [required] — see list below
  title:            string      [required] — short human-readable label, e.g. "Email sent"
  detail:           string      [optional] — secondary line, e.g. "Follow-up on Northshore Cafe intro"
  related_id:       string      [optional] — ID of triggering object (interaction ID, note ID, vendor ID, etc.)
  occurred_at:      timestamp   [required]
}
```

**Valid event_type values for ContactActivityEvent:**
- `INTERACTION_EMAIL` — an email was logged
- `INTERACTION_CALL` — a call was logged
- `INTERACTION_MEETING` — a meeting was logged
- `INTERACTION_EVENT` — an event interaction was logged
- `INTERACTION_MESSAGE` — a message was logged
- `NOTE_ADDED` — a note was saved on this contact
- `SHOP_INTRODUCED` — a shop was introduced through this contact (connector context)
- `SHOP_WENT_LIVE` — a shop introduced through this contact moved to ACTIVE
- `TASK_COMPLETED` — a task linked to this contact was marked done
- `CONTACT_CREATED` — the contact record was first created
- `VENDOR_LINKED` — this contact was linked to a vendor
- `VENDOR_LINK_CHANGED` — this contact's vendor link was updated to a different vendor
- `PRIMARY_ASSIGNED` — this contact was made primary contact for their vendor

**Event creation rules:**
- When a `ContactInteraction` is created → create matching `INTERACTION_*` event
- When a `ContactNote` is created → create `NOTE_ADDED` event
- When a `Task` linked to this contact is completed → create `TASK_COMPLETED` event
- When `Contact.vendor_id` is set for the first time → create `VENDOR_LINKED` event
- When `Contact.vendor_id` changes to a different vendor → create `VENDOR_LINK_CHANGED` event
- When `Contact.is_primary` is set to true → create `PRIMARY_ASSIGNED` event
- When a vendor-level `ActivityEvent` of type `SHOP_INTRODUCED` or `SHOP_WENT_LIVE` is created and has a `related_contact_id` matching this contact → mirror it as a `ContactActivityEvent`

### 3.4 ContactAttachment

A file or image associated with a contact. Business card photos are the primary use case.

```
ContactAttachment {
  id:             string      [required]
  contact_id:     string      [required]
  label:          string      [required] — e.g. "Front", "Back (Joseph Plante)"
  file_url:       string      [required]
  file_type:      enum        [required] — IMAGE | PDF | DOCUMENT | OTHER
  added_at:       date        [required]
  added_by:       string      [optional]
}
```

### 3.5 Task (contact-scoped)

Tasks can be linked to a contact, a vendor, or both. The contact-scoped task is identical in structure to the vendor-scoped task (defined in `vendor-crm-spec.md`) but with an additional optional `contact_id` field.

```
Task {
  id:             string      [required]
  vendor_id:      string      [optional] — if linked to a vendor
  contact_id:     string      [optional] — if linked to a contact
  text:           string      [required]
  due_date:       date        [optional]
  is_completed:   boolean     [required] — default false
  completed_at:   timestamp   [optional]
  created_at:     timestamp   [required]
}
```

At least one of `vendor_id` or `contact_id` must be set. Both may be set simultaneously (e.g. a task that is about a specific person at a specific vendor).

**Derived field — `is_overdue`:** `due_date < today AND is_completed === false`. Never stored.

---

## 4. Relationships Between Objects

```
Contact
  ├── belongs to: Vendor (optional, via vendor_id)
  ├── has many: ContactNote
  ├── has many: ContactInteraction
  ├── has many: ContactActivityEvent
  ├── has many: ContactAttachment
  ├── has many: Task (via contact_id)
  └── has many (derived): peer_contacts — other Contacts sharing the same vendor_id

Vendor
  └── has many: Contact (via vendor_id)
      — exactly one Contact per vendor may have is_primary: true
      — a vendor with no contacts is valid
      — a contact with no vendor_id is valid (standalone contact)

ContactInteraction
  ├── belongs to: Contact
  └── belongs to (optional): Vendor

ContactNote
  └── belongs to: Contact

ContactActivityEvent
  └── belongs to: Contact

ContactAttachment
  └── belongs to: Contact

Task
  ├── belongs to (optional): Contact
  └── belongs to (optional): Vendor
```

---

## 5. Two Rendering Contexts

The contact profile exists in two distinct UI contexts. The data model is identical in both. The layout, density, and available sections differ.

### 5.1 Embedded view — inside the vendor panel, Contacts tab

This view is accessed by tapping a contact row in the vendor profile's Contacts tab. It opens in-place within the vendor side panel. It does not navigate away from the vendor.

**Header:**
- Avatar: 40×40px, `--radius-full`, background `#e8f0ee`, text `#0e413b`, `SF Pro Display 13px 600`
- Name (Japanese): `SF Pro Display 16px 600 #202124` — on the same line as the Primary Contact badge
- Name (English): `SF Pro 12px #606060` below
- Title: `SF Mono 10px #80868b` below English name
- No vendor pill — vendor context is already inherited from the panel
- Back button: "← Contacts" — returns to the vendor's Contacts tab, not a global contacts list

**Info strip:** 3 cells only — Email, Phone, LINE. No "Preferred" cell (space constraint).

**No last-contact banner** — omitted in embedded view to save space.

**No stat cards** — omitted in embedded view.

**Tabs:** Overview · Notes · Activity · Attachments
- Tab labels always visible, not hidden until hover
- `SF Pro Text 13px 500`
- Active: `color: #0e413b`, `border-bottom: 2px solid #0e413b`
- Inactive: `color: #5f6368`, `border-bottom: 2px solid transparent`
- Tab count badges: `SF Mono 10px`, `background: #f1f3f4`, `color: #5f6368`, `border-radius: 4px`

**Overview tab content (embedded):**
1. Personal context table (full — all four rows)
2. To-do list (contact-scoped tasks)
3. "Also at [vendor name]" — list of peer contacts at the same vendor

**Notes tab content (embedded):** Identical to standalone.

**Activity tab content (embedded):** Identical to standalone.

**Attachments tab content (embedded):** Identical to standalone.

**Edit access:** Single edit icon button (pencil) in the top-right of the back bar. Opens edit form in-place within the same panel. See Section 7.

---

### 5.2 Standalone view — full contact page

This view is accessed from a global contacts list, or by tapping "Open contact profile →" from any inline reference. It renders as a full-page or full-panel view, not nested inside a vendor.

**Header:**
- Avatar: 52×52px, `--radius-full`, background `#e8f0ee`, text `#0e413b`, `SF Pro Display 16px 600`
- Name (Japanese): `SF Pro Display 24px 600 #202124`
- Name (English): `SF Pro 12px #606060`
- Title: `SF Pro 12px #5f6368`
- Badge row: Primary Contact badge + vendor type badge (e.g. "Connector") if vendor is linked
- Vendor pill: inline link below badges — shows vendor name with a stage-coloured dot. Tapping navigates to that vendor's profile.
- Back button: "← All contacts"
- Action buttons: edit · more · close

**Info strip:** 4 cells — Email, Phone, LINE, Preferred.

**Last-contact banner:** shown between info strip and tabs.
- Green dot + "Last contact [date] · [type] — [summary]"
- "+ Log interaction" button on the right
- `SF Pro 12px #606060` for the text, `SF Mono 10px #0e413b` for the action button

**Stat cards:** 3 cards in a row, shown above overview content.
- Card 1: Interactions logged — count of ContactInteraction records
- Card 2: Shops introduced — count of SHOP_INTRODUCED events linked to this contact. Only shown if contact's vendor type is CONNECTOR. If vendor is DIRECT or MANAGED_VENUE, replace with "Vendors connected" showing 0 or the vendor count.
- Card 3: Days since contact — `days_since_contact` derived field. Colour: `#202124` if under 14, `#b06000` (warning) if 14–30, `#c5221f` (error) if over 30.

**Tabs:** Overview · Notes · Activity · Attachments — same as embedded.

**Overview tab content (standalone):**
1. Stat cards (3)
2. Personal context table (full)
3. Two-column layout:
   - Left: To-do list (contact-scoped tasks)
   - Right: "Also at [vendor name]" peer contacts + Vendor reference card

**Vendor reference card (standalone only):**
```
[Vendor name — SF Pro Display 16px 600]
[Vendor type · Stage — SF Mono 10px #80868b]
[Open vendor profile → — SF Mono 10px #0e413b, tappable]
```

---

## 6. Tab Content Specification

The following applies to both embedded and standalone contexts unless noted.

### 6.1 Overview tab

**Personal context table:**
Renders as a bordered table with alternating rows. Each row has a left key cell and a right value cell.

| Row key | Value type | Notes |
|---|---|---|
| Languages | Tag chips | `chip.lang` style: `background #f1f3f4, color #424242` |
| Reaches back on | Tag chips | `chip.comm` style: `background #e8f0ee, color #0e413b, border rgba(14,65,59,.15)` |
| Background | Free text | `SF Pro Text 14px #424242` |
| How we met | Free text | `SF Pro Text 14px #424242` |

Table border: `1px solid #e3e3e3`, `border-radius: 8px`, rows separated by `1px solid #f0f0f0`. Left key cell: `min-width: 120px`, `SF Pro 12px #80868b`. Right value cell: `padding: 10px 14px`, `flex: 1`.

**To-do list:**
Renders inside a bordered card. Each task row:
- Checkbox: 16x16px, `border-radius: 4px`, `border: 1.5px solid #dadce0`. When done: `background: #0e413b`, `border-color: #0e413b`, white checkmark.
- Task text: `SF Pro Text 14px #181818`. When done: `text-decoration: line-through`, `color: #9aa0a6`.
- Due date: `SF Mono 10px #80868b`. When overdue: `color: #c5221f`.
- Rows separated by `1px solid #f0f0f0`. No border on last row.

**Peer contacts ("Also at [vendor name]"):**
List of other contacts sharing the same `vendor_id`. Each row:
- Avatar: 36x36px circle
- Name: `SF Pro Text 14px 600 #202124`
- Sub: `SF Pro 12px #606060` showing role and email
- Entire row is tappable — navigates to that contact's profile

If there are no peer contacts, this section is hidden entirely.

### 6.2 Notes tab

**Add note input** — always shown at the top:
- Textarea: `SF Pro Text 14px #181818`, placeholder `#9aa0a6`
- Context selector dropdown: options General · Meeting · Call · Email · Event. `SF Mono 10px`, `background: #f1f3f4`, `border: 1px solid #dadce0`
- Save button: `SF Mono 10px`, `background: #0e413b`, `color: #fff`, `border-radius: 6px`
- Container border: `1px solid #dadce0`, `border-radius: 8px`

**Note cards** — rendered newest-first:
- Date: `SF Mono 10px #606060` (left)
- Context tag: `SF Mono 10px #5f6368`, `background: #f1f3f4`, `border-radius: 4px` (right)
- Body: `SF Pro Text 14px #424242`, `line-height: 20px`
- Card border: `1px solid #e3e3e3`, `border-radius: 8px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`

### 6.3 Activity tab

Rendered as a vertical list, newest-first. Each item:
- Dot: 7x7px circle, colour by type:
  - INTERACTION_EMAIL or INTERACTION_MESSAGE: `#3cb1ff`
  - INTERACTION_MEETING, INTERACTION_EVENT: `#00a52c`
  - SHOP_INTRODUCED, SHOP_WENT_LIVE: `#00a52c`
  - TASK_COMPLETED: `#0e413b`
  - NOTE_ADDED: `#dadce0` (neutral grey)
  - First met / CONTACT_CREATED: `#b06000`
- Title: `SF Pro 12px 600 #424242`
- Detail: `SF Pro 12px #606060`, same line or wrapped
- Timestamp: `SF Mono 10px #80868b`, right-aligned
- Rows separated by `1px solid #f0f0f0`. No border on last row.

### 6.4 Attachments tab

**Business cards section** — rendered first if any `ContactAttachment` records exist with label containing "card", "front", or "back" (case-insensitive):
- 2-column grid
- Each card: `border: 1px solid #e3e3e3`, `border-radius: 8px`, `overflow: hidden`
- Preview area: `height: 90px`, `background: #f8f9fa` — shows image if `file_type === IMAGE`, otherwise a document icon
- Label bar: `SF Mono 10px #80868b`, `padding: 7px 10px`, `border-top: 1px solid #f0f0f0`

**Add file button:**
- Full width, `border: 1.5px dashed #dadce0`, `border-radius: 8px`, `SF Mono 10px #80868b`
- On tap: triggers file/image picker

---

## 7. Edit Form

The edit form is the same in both contexts (embedded and standalone). It replaces the profile view in-place — it does not open a separate modal.

### 7.1 Field groups and layout

**Name**
- Japanese name: full-width text input — `SF Pro Text 14px`
- English name + title: two-column row

**Contact info**
- Email + Phone: two-column row
- LINE ID + Preferred way to reach: two-column row

**Vendor connection**
- Linked vendor: dropdown of all existing Vendor records, plus "— No vendor —" option
- Role at vendor: dropdown — Primary contact · Secondary contact · Decision maker · Operational contact
  - Only shown when a vendor is selected
  - If user selects "Primary contact": warn if another contact at that vendor already has `is_primary: true`. Show: "This will replace [name] as primary contact. Continue?" — must confirm before saving.

**Personal context**
- Languages: free text input (comma-separated, parsed into array on save)
- Communication preferences: free text input (comma-separated, parsed into array on save)
- Background: textarea, 2 rows
- How we met: textarea, 2 rows

### 7.2 Input styling

All inputs: `background: #f8f9fa`, `border: 1px solid #dadce0`, `border-radius: 6px`, `padding: 8px 10px`, `SF Pro Text 14px #181818`, `outline: none`.

Focus state: `border-color: #0e413b`, `box-shadow: 0 0 0 2px rgba(14,65,59,0.2)`.

Placeholder: `color: #9aa0a6`.

### 7.3 Save and cancel

- Save button: `background: #0e413b`, `color: #fff`, `SF Pro Text 12px`, `border-radius: 6px`, `padding: 7px 18px`
- Cancel button: `border: 1px solid #dadce0`, transparent background, `color: #5f6368`
- Save bar: `border-top: 1px solid #f0f0f0`, right-aligned, `padding-top: 14px margin-top: 16px`

On save:
1. Validate all required fields
2. If `is_primary` changed to true and another contact at the same vendor already has `is_primary: true` — clear the previous contact's `is_primary` to false and log a `PRIMARY_ASSIGNED` event on this contact
3. If `vendor_id` changed — log `VENDOR_LINK_CHANGED` event
4. Update `Contact.updated_at`
5. Return to view mode

---

## 8. Vendor Panel — Contacts Tab (list view)

This is the list of contacts shown inside the vendor profile's Contacts tab before drilling into an individual contact. This is distinct from the contact profile itself.

Each contact row in the list:
- Avatar: 36x36px, `--radius-full`
- Primary name: `SF Pro Text 14px 600 #202124`
- English name (if Japanese name is primary): `SF Pro 12px #606060`
- Role: `SF Mono 10px #80868b`
- "Primary Contact" badge: shown only if `is_primary: true`. `SF Mono 10px`, `background: #e8f0ee`, `color: #0e413b`, `border: 1px solid rgba(14,65,59,.15)`, `border-radius: 2px`
- Row border-bottom: `1px solid #f0f0f0`. No border on last row.
- Tapping anywhere on the row opens the embedded contact view within the vendor panel.

"+ Add Contact" button: top-right of the Contacts section header. Opens the edit form for a new contact, with `vendor_id` pre-filled to the current vendor.

---

## 9. Data Integrity Rules

1. A contact with `is_primary: true` must have a non-null `vendor_id`. A standalone contact (no vendor) cannot be primary.
2. Only one contact per vendor may have `is_primary: true` at any time. This is enforced at the data layer, not just UI.
3. `vendor_role` must be set if and only if `vendor_id` is set. If `vendor_id` is cleared, `vendor_role` must also be cleared.
4. `last_contacted_type` must be set if and only if `last_contacted_at` is set.
5. `ContactNote` records are append-only. No update or delete operations are permitted on `ContactNote`.
6. `ContactInteraction` records are append-only. No update or delete operations are permitted on `ContactInteraction`.
7. `ContactActivityEvent` records are append-only. No update or delete operations are permitted on `ContactActivityEvent`.
8. `initials` must be recomputed and stored whenever `name_ja` or `name_en` changes.
9. Deleting a contact must also delete all associated `ContactNote`, `ContactInteraction`, `ContactActivityEvent`, `ContactAttachment`, and `Task` records where `contact_id` matches. This is a hard delete — no soft delete. Require explicit confirmation before executing.
10. If a vendor is deleted, all contacts with `vendor_id` pointing to that vendor must have `vendor_id` set to null, `vendor_role` set to null, and `is_primary` set to false before the vendor deletion is committed. The contacts themselves are not deleted.

---

## 10. Initials Computation Rules

The `initials` field is a 2-character string used in avatar display. It must be stored, not computed at render time.

**Rule 1 — Japanese name present:**
Take the first kanji character of the family name + the first kanji character of the given name.
Example: `福本 剛広` → `福剛`
Japanese names in this system are stored in family-name-first order with a space between family and given.
If the name has no space (single-word Japanese name), take the first two characters.

**Rule 2 — No Japanese name:**
Take the first character of the first word + the first character of the last word, uppercased.
Example: `Joseph Plante` → `JP`
Example: `Takaaki Imoto` → `TI`
If the name is a single word, take the first two characters uppercased.

**Rule 3 — Fallback:**
If neither rule produces a 2-character result, use `??`.

---

## 11. Seed Data

See the full spec document for complete seed data including Contacts, ContactNotes, ContactInteractions, ContactActivityEvents, Tasks, and ContactAttachments.

---

## 12. API Endpoints Required

```
GET    /contacts                          — list all contacts, supports ?vendor_id= filter
GET    /contacts/:id                      — get single contact with all derived fields
POST   /contacts                          — create new contact
PATCH  /contacts/:id                      — update contact fields
DELETE /contacts/:id                      — delete contact and all associated records

GET    /contacts/:id/notes                — list ContactNotes, newest first
POST   /contacts/:id/notes                — create a new ContactNote

GET    /contacts/:id/interactions         — list ContactInteractions, newest first
POST   /contacts/:id/interactions         — log a new ContactInteraction

GET    /contacts/:id/activity             — list ContactActivityEvents, newest first
GET    /contacts/:id/attachments          — list ContactAttachments
POST   /contacts/:id/attachments          — upload a new attachment
DELETE /contacts/:id/attachments/:att_id  — delete a specific attachment

GET    /contacts/:id/tasks                — list Tasks linked to this contact
POST   /contacts/:id/tasks                — create a task linked to this contact
PATCH  /tasks/:id                         — update task

GET    /vendors/:id/contacts              — list all contacts for a specific vendor
```
