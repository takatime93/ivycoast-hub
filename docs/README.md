# Ivycoast Hub — Docs & Change Tracking

This folder tracks **what changes in the app and why**, over time. It exists so that
anyone (Taka, Noa, a future contributor) can see the history of the Hub without reading git diffs.

## Structure

```
docs/
├── README.md          ← you are here
├── CHANGELOG.md        ← running log of every shipped change, newest first
└── plans/              ← one planning doc per feature, written BEFORE building
    ├── 00-roadmap.md   ← master plan: all features, order, status, locked decisions
    ├── 01-quality-score-panel.md
    ├── 02-localization.md
    ├── 03-soap-catalogue.md
    └── 04-ux-qa-sweep.md
```

## Conventions

- **Plan before build.** Every feature gets a plan doc in `plans/` and Taka's sign-off
  before implementation starts.
- **Log after build.** When a change is implemented and verified, add a `CHANGELOG.md`
  entry with the date, what changed, files touched, and how it was verified.
- **Dates are absolute** (YYYY-MM-DD), never "today" / "last week".
- Plans are living docs — update status inline (`Planned` → `In progress` → `Shipped`)
  rather than deleting them, so the reasoning stays on record.

## Status legend

`📋 Planned` · `🔨 In progress` · `✅ Shipped` · `⛔ Blocked` · `🧊 Icebox`
