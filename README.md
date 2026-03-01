# IVYCOAST & Boldoath Hub

A single-page dashboard for navigating all IVYCOAST and Boldoath Google Workspace documents.

**Live site:** https://takatime93.github.io/ivycoast-hub/

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
- **Board** — Collaborative Kanban board backed by Google Sheets (drag-and-drop, create/edit/delete, auto-refresh)

## Board Setup (Google Sheets + Apps Script)

The Board tab uses a Google Sheet as a shared database, with a Google Apps Script web app as the API.

### 1. Create the Google Sheet

1. Create a new Google Sheet
2. Rename the first sheet tab to **Tasks**
3. Add these headers in row 1:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id | name | status | priority | assignee | due | workspace | category | description | docLink | createdAt | updatedAt |

4. Pre-populate with tasks or start empty

### 2. Deploy the Apps Script API

1. In the Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code and paste the contents of `apps-script.js` from this repo
3. Click **Deploy → New deployment**
4. Set type to **Web app**
5. Set **Execute as:** Me
6. Set **Who has access:** Anyone
7. Click **Deploy** and copy the web app URL

### 3. Connect the Dashboard

1. Open the dashboard and click the **Board** tab
2. Paste the Apps Script web app URL in the setup banner
3. Click **Connect** — tasks will load from your Sheet

The URL is saved in localStorage, so you only need to do this once per browser.

### Google Sheet Schema

| Column | Type | Notes |
|--------|------|-------|
| id | String | Auto-generated (e.g. `ivy-1`) |
| name | String | Task name |
| status | String | `backlog` / `todo` / `in_progress` / `done` |
| priority | String | `High` / `Medium` / (empty) |
| assignee | String | `Taka Imoto` / `YOKO` / (empty) |
| due | Date | `YYYY-MM-DD` format |
| workspace | String | `IVYCOAST` / `BOLDOATH` |
| category | String | Free text |
| description | String | Free text |
| docLink | String | Google Docs/Sheets URL |
| createdAt | Timestamp | ISO 8601 |
| updatedAt | Timestamp | ISO 8601 |

## Authentication (Firebase)

The hub is restricted to `yoko@ivycoast.co` and `taka@ivycoast.co` via Firebase Authentication with Google Sign-In.

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create project** → name it `ivycoast-hub`
2. **Authentication → Sign-in method → Enable Google** provider
3. **Project Settings → General → Your apps → Add web app** → copy the `firebaseConfig` object
4. **Authentication → Settings → Authorized domains** → add `takatime93.github.io`

### Configuration

Open `index.html` and replace the placeholder `FIREBASE_CONFIG` object near the bottom of the file with your config:

```js
var FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "ivycoast-hub.firebaseapp.com",
  projectId: "ivycoast-hub",
  storageBucket: "ivycoast-hub.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Sessions persist across browser restarts (~30 days, auto-refreshing like Slack).

## Installing as an App (PWA)

The hub can be installed as a standalone app on macOS.

- **Chrome / Edge**: Menu (⋮) → **Install IVYCOAST & Boldoath Hub**
- **Safari (macOS Sonoma+)**: **File → Add to Dock**

### App Icons

Place your icon files in the `icons/` directory:

- `icons/icon-192.png` — 192×192 PNG
- `icons/icon-512.png` — 512×512 PNG
