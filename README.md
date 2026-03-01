# IVYCOAST & Boldoath Hub

A single-page dashboard for navigating all IVYCOAST and Boldoath Google Workspace documents.

**Live site:** https://takahiroanno.github.io/ivycoast-hub/

## How to Add Document Links

After migrating documents to Google Drive, add their URLs to `links.json`:

1. Open a document in Google Drive
2. Copy the URL from your browser's address bar
3. Go to [links.json on GitHub](../../edit/main/links.json) (click the pencil icon to edit)
4. Paste the URL between the empty quotes for that document name
5. Click **Commit changes**

Example — before:
```json
"Soap Line Up": "",
```

After:
```json
"Soap Line Up": "https://docs.google.com/document/d/1abc.../edit",
```

Documents without a URL will show as plain text (no broken links).

## Features

- **Home** — Quick links (Figma, Shopify, Instagram, Yamato, Drive) + stats cards
- **IVYCOAST** — 27 documents across 8 categories
- **Boldoath** — 7 documents across 4 categories
- **Document Library** — Searchable, filterable, sortable table of all 34 documents
