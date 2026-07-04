# Plan 02 — JA/EN Localization Toggle (whole app)

**Status:** 📋 Planned — ⚠️ largest & highest-risk task; needs Taka's answers on Open Questions first.
**Touches:** `index.html` (new i18n layer + every user-facing string) + a stored preference.
**Approach:** build the i18n *infrastructure* by hand (small, safe), then use a **subagent** for the
exhaustive string-extraction sweep across the 25k-line file.

---

## Goal

A header toggle switches the entire app UI between **English** and **日本語**. The app is currently
*mixed* (formulator is JA-primary; Products/Orders/CRM are EN) — this makes language consistent and
user-controlled.

## Translation rules (from Taka — firm)

**DO translate:** general app chrome — nav tabs, buttons, section titles, descriptors, labels,
placeholders, empty states, toasts, tooltips, menu items.

**DO NOT translate:**
- Proper nouns — product names (e.g. "Byron Bay + CBD"), people/customer names, company names.
- Document titles (library/doc entries keep their real title).
- **Invoices** — display in their real, as-authored language.
- **Recipes** — ingredient names & recipe content stay as authored.
- Any content that is *data the user entered*, as opposed to *app UI*.

Rule of thumb: **translate the chrome, never the content.**

---

## Architecture

1. **Dictionary.** A single `I18N = { en: {...}, ja: {...} }` object keyed by short stable IDs
   (e.g. `nav.tools`, `formulator.saveBatch`, `score.readMore`).
2. **`t(key)` helper** returns the string for the current language, falling back to EN then to the key.
3. **`data-i18n` attributes.** Static markup uses `<span data-i18n="nav.tools">Tools</span>`; a single
   `applyI18n()` pass walks `[data-i18n]` and sets `textContent` (and `[data-i18n-ph]` for placeholders).
   No innerHTML.
4. **JS-built strings** (drawers, toasts, dynamic DOM) call `t('key')` directly.
5. **Language state.** `localStorage['ivh-lang']`; default per Open Question #1. Toggle in the header
   flips state, calls `applyI18n()`, re-renders any open dynamic view, sets `<html lang>`.
6. **Content guard.** Data fields (product names, invoice/recipe/doc content) are simply never given
   `data-i18n` and never passed through `t()` — they render as stored.

## Why subagent for the sweep

Extracting/keying hundreds of strings across a 1 MB single file is mechanical but huge and error-prone
for one pass. Plan: I build the infra + do a reference section by hand to set the pattern, then a
subagent (or a `Workflow` fan-out by app-section: nav, home, tasks, docs, products, orders, customers,
CRM, tools, invoices-chrome) keys the rest against the dictionary, section by section, each verified.

## Risk & mitigations

- **Risk:** breaking layout when JA/EN string lengths differ. → keep buttons flexible; spot-check.
- **Risk:** accidentally translating content (invoice/recipe/names). → explicit deny-list of regions;
  reviewer pass confirms no data ran through `t()`.
- **Risk:** destabilizing a working 1 MB file. → section-by-section, node syntax check after each,
  no behavioral changes beyond text source.

---

## Decisions (locked)

1. **Default language:** **detect from browser**, fall back to Japanese. Store the resolved/chosen
   language in `localStorage['ivh-lang']`; only auto-detect when no stored preference exists.
2. **Bilingual labels stay bilingual:** existing "JA (EN)" labels (formulator etc.) are **left as-is**
   and NOT keyed into the toggle. This actually reduces risk — the sweep focuses on single-language
   *chrome* (nav tabs, buttons, descriptors, empty/loading/error states, toasts, tooltips, menus).

## Open questions (minor — can decide at build)

- **Toggle placement & form** — header segmented control `[EN | 日本語]`, top-right near BOLDOATH?

## Implementation checklist (after sign-off)

- [ ] Add `I18N` dictionary + `t()` + `applyI18n()` + `setLang()` + header toggle.
- [ ] Persist to `localStorage`, set `<html lang>`, default per Q1.
- [ ] Hand-key one section (nav + formulator) as the reference pattern.
- [ ] Subagent/Workflow sweep for remaining sections, each node-checked.
- [ ] Deny-list verification: no product/customer/doc/invoice/recipe content passes through `t()`.
- [ ] Re-render hooks so open dynamic views refresh on toggle.

## Test plan

- Toggle flips all chrome; product names / invoices / recipes / doc titles stay unchanged.
- Reload preserves language; layout holds in both languages on key screens.
