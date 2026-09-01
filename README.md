# TokenHop

Hop cookies & storage across sites — copy, paste, share, and debug with one click.

A Chrome extension for developers and QA teams to move auth tokens, localStorage, and sessionStorage between environments, clear site data, manage profiles, and track session expiry.

## Tabs

### Cookies

- **Copy / Paste** — Transfer selected cookies + localStorage + sessionStorage between sites
- **View Stored Data** — Inspect captured data in 3 sub-tabs (Cookies / Local / Session)
- **Settings** — Per-site selection with toggle, copy, delete, and Select All per item

### Dev Tools

- **Clear Cookies / Local / Session** — Wipe individual storage types
- **Nuke All** — Clear everything in one click
- **Copy Shareable** — Generate a `TH1:...` string (gzipped) of selected data to share with teammates
- **Feed Data** — Paste a shared `TH1:...` string and apply it to the current site

### Session

- Auto-scans cookies + localStorage + sessionStorage for JWT tokens
- Shows live countdown timer with color-coded expiry (green / yellow / red)
- Displays expiry date and issuer

### Profiles

- Save named profiles (Admin, QA, Dev) with full stored data
- Load / Delete profiles instantly

## Install

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the project folder
4. For updates: **Remove** then **Load unpacked** again (ensures permissions are granted)

## Share Session with a Teammate

1. Select data in settings → click **Copy** on site A
2. Go to Dev Tools → **Copy Shareable** → `TH1:...` copied to clipboard
3. Paste in Slack/Teams/email
4. Teammate opens TokenHop → Dev Tools → **Feed Data** → paste → **Apply Data**

## Tech

- Chrome Extension Manifest V3
- Vanilla JavaScript, no frameworks
- Permissions: `cookies`, `storage`, `tabs`, `activeTab`, `scripting`

## Files

```
manifest.json   — Extension config
popup.html      — UI + CSS
popup.js        — All logic
README.md       — This file
```
