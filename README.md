# 🔑 TokenHop

**Hop cookies, localStorage & sessionStorage between websites — copy, paste, share, and debug with one click.**

A Chrome extension built for developers and QA teams who need to move auth tokens and site data between environments, clear site storage, manage profiles, and share sessions with teammates — all from a single popup.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Cookies Tab](#-cookies-tab)
  - [Dev Tools Tab](#-dev-tools-tab)
  - [Profiles Tab](#-profiles-tab)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
  - [Basic Data Transfer](#basic-data-transfer)
  - [Share Data with Teammates](#share-data-with-teammates)
  - [Export & Import](#export--import)
  - [Dev Tools](#dev-tools)
  - [Profiles](#profiles)
- [Settings Panel](#settings-panel)
- [Tech Stack](#tech-stack)
- [Permissions](#permissions)
- [File Structure](#file-structure)

---

## Overview

TokenHop is a developer-focused Chrome extension that simplifies working with cookies, localStorage, and sessionStorage across different websites. Whether you're testing auth flows, debugging session issues, or sharing login states with teammates, TokenHop gives you a clean, tabbed interface to do it all.

### What can you do with it?

- ✅ Copy cookies + localStorage + sessionStorage from one site and paste to another
- ✅ Share session data with teammates via a single shareable string
- ✅ Export/import all site data as JSON files
- ✅ Clear cookies, localStorage, or sessionStorage individually or all at once
- ✅ Save named profiles for different user sessions (Admin, QA, Dev, etc.)
- ✅ Copy cookies as a Cookie header string or cURL command
- ✅ Toggle between dark and light themes

---

## Features

### 🍪 Cookies Tab

| Feature              | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| **Copy**             | Captures selected cookies + localStorage + sessionStorage from the current site  |
| **Paste**            | Applies all stored data (cookies + LS + SS) to the current site                  |
| **View Stored Data** | View stored data in 3 sub-tabs (Cookies / Local / Session) with expandable cards |
| **Auto Refresh**     | Optionally reload the page after pasting (toggle in settings)                    |

### 🛠️ Dev Tools Tab

**Clear Site Data:**

| Button            | Action                                                     |
| ----------------- | ---------------------------------------------------------- |
| **Clear Cookies** | Delete all cookies for the current site                    |
| **Clear Local**   | Wipe all `localStorage` for the current site               |
| **Clear Session** | Wipe all `sessionStorage` for the current site             |
| **Nuke All**      | Clear cookies + localStorage + sessionStorage in one click |

**Export / Import (all site data):**

| Button             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| **Export JSON**    | Download all cookies + localStorage + sessionStorage as a `.json` file |
| **Import JSON**    | Upload a `.json` file and apply all data to the current site           |
| **Copy as Header** | Copy cookies as `name=value; name2=value2` for Postman/API tools       |
| **Copy as cURL**   | Generate a `curl` command with cookies baked in                        |

**Share (only selected data):**

| Button             | Description                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **Copy Shareable** | Generate a `TH1:...` encoded string containing only selected data — paste in Slack/Teams/email |
| **Feed Data**      | Paste a `TH1:...` string from a teammate and apply it to your current site                     |

### 👤 Profiles Tab

| Feature            | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **Save Profile**   | Save current stored data (cookies + LS + SS) as a named profile (e.g., "Admin", "QA User") |
| **Load Profile**   | Apply a saved profile's data to the current site                                           |
| **Delete Profile** | Remove a saved profile (no confirmation prompt — instant delete)                           |

---

## Installation

1. **Download** the project files or clone this repo
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the project folder (`ACCESS_TOKEN`)
6. The TokenHop icon will appear in your toolbar

> **Important:** If you've updated the extension with new permissions, click **Remove** first, then **Load unpacked** again. Reloading alone doesn't always grant new permissions.

---

## Usage Guide

### Basic Data Transfer

Transfer cookies + localStorage + sessionStorage from one site to another:

```
Site A (dev.example.com)          Site B (staging.example.com)
┌──────────────────────┐          ┌──────────────────────┐
│ 1. Open TokenHop     │          │ 4. Open TokenHop     │
│ 2. ⚙️ Select data    │          │ 5. Click Paste       │
│ 3. Click Copy        │ ───────► │ 6. Done!             │
└──────────────────────┘          └──────────────────────┘
```

1. Click the TokenHop icon on any website
2. Click ⚙️ (settings) to select which cookies, localStorage, and sessionStorage items to copy
3. Click **Copy** — saves selected data from the current site
4. Navigate to the target site
5. Click **Paste** — applies all stored data to the new site
6. Click **View Stored Data** to verify what's stored (3 sub-tabs: Cookies / Local / Session)

### Share Data with Teammates

Share your session with a teammate without sharing passwords:

```
You                                Teammate
┌──────────────────────┐          ┌──────────────────────┐
│ 1. Copy from site    │          │ 4. Open TokenHop     │
│ 2. Copy Shareable    │ ───────► │ 5. Click Feed Data   │
│ 3. Paste in Slack    │  TH1:... │ 6. Paste + Apply     │
└──────────────────────┘          └──────────────────────┘
```

1. Copy data from a site (Click **Copy**)
2. Go to **Dev Tools** tab → click **Copy Shareable**
3. A `TH1:...` string is copied to your clipboard
4. Paste the string in Slack/Teams/email to your teammate
5. Teammate opens TokenHop on their site → **Dev Tools** tab → **Feed Data**
6. Pastes the `TH1:...` string → clicks **Apply Data**
7. All selected cookies + localStorage + sessionStorage are applied instantly

> **Note:** Copy Shareable only includes data that was **selected** in settings and captured via Copy. Use Select All in settings if you want to share everything.

### Export & Import

Full backup of all site data (not just selected items):

1. Go to **Dev Tools** tab
2. Click **Export JSON** — downloads a `.json` file with all cookies + localStorage + sessionStorage
3. To restore: click **Import JSON** → select the `.json` file
4. All data from the file is applied to the current site

**Exported JSON format:**

```json
{
  "exportedAt": "2026-09-01T10:30:00Z",
  "domain": "dev.example.com",
  "cookies": [
    {
      "name": "access_token",
      "value": "eyJ...",
      "domain": ".example.com",
      "path": "/"
    }
  ],
  "localStorage": {
    "theme": "dark",
    "userId": "123"
  },
  "sessionStorage": {
    "tempToken": "abc123"
  }
}
```

### Dev Tools

Clear site data when troubleshooting:

1. Switch to the **Dev Tools** tab
2. Click any clear button (Clear Cookies / Clear Local / Clear Session)
3. Each action asks for confirmation (except individual item deletes in settings)
4. Use **Nuke All** for a full reset of cookies + localStorage + sessionStorage

### Profiles

Save and switch between different user sessions:

1. Copy data from a site (Click **Copy**)
2. Switch to **Profiles** tab
3. Enter a name (e.g., "Admin User") → click **Save**
4. The profile saves cookies + localStorage + sessionStorage
5. On another site, click **Load** next to a profile to apply that data
6. Click **Delete** to remove a profile (instant, no confirmation)

---

## Settings Panel

Click the ⚙️ gear icon in the header to open the settings panel. It contains 3 sub-tabs:

### 🍪 Cookies Sub-Tab

- List of all cookies on the current site
- **Toggle switch** — select/deselect which cookies to copy
- **Copy icon** — copy individual cookie value to clipboard
- **Trash icon** — delete individual cookie from the site
- **Click cookie name** — edit cookie value inline
- **Select All / Deselect All** — toggle all cookies at once

### 💾 Local Sub-Tab

- List of all localStorage items on the current site
- **Toggle switch** — select/deselect which items to copy
- **Copy icon** — copy individual value to clipboard
- **Trash icon** — delete individual item from the page's localStorage
- **Select All / Deselect All** — toggle all items at once

### 📦 Session Sub-Tab

- List of all sessionStorage items on the current site
- Same controls as Local sub-tab (toggle, copy, delete, select all)

### Options

- **Auto Refresh** — toggle to automatically reload the page after pasting data
- **Cache** — shows extension storage usage with a Clear button

> **Note:** Selections are saved per-site. Each domain remembers its own selected cookies, localStorage, and sessionStorage items.

---

## Tech Stack

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** — no frameworks, no build step
- **Chrome APIs:** `cookies`, `storage`, `tabs`, `activeTab`, `scripting`, `downloads`

---

## Permissions

| Permission          | Why it's needed                                                    |
| ------------------- | ------------------------------------------------------------------ |
| `cookies`           | Read, set, and delete cookies for the current site                 |
| `storage`           | Persist selected items, profiles, theme, and cached data           |
| `tabs`              | Detect the active tab's URL for cookie operations                  |
| `activeTab`         | Access the current tab for script injection                        |
| `scripting`         | Inject scripts to read/write/clear localStorage and sessionStorage |
| `downloads`         | Download exported JSON files                                       |
| `<all_urls>` (host) | Access cookies and inject scripts on any site                      |

---

## File Structure

```
ACCESS_TOKEN/
├── manifest.json    # Extension manifest (v3) — permissions, version, config
├── popup.html       # UI — tabbed layout, settings panel, all CSS
├── popup.js         # Logic — all feature handlers, storage operations
├── README.md        # This file
└── _check.js        # Development utility script
```

---

## Tips

- **Nothing selected?** Open settings (⚙️) and use **Select All** to quickly grab everything
- **Sharing sessions?** Use Copy Shareable instead of Export JSON — it's a single string you can paste anywhere
- **Testing APIs?** Use Copy as cURL to get a ready-to-run terminal command with auth cookies
- **Debugging auth?** Use View Stored Data to inspect what was captured before pasting
- **Switching users?** Save profiles for each role (Admin, QA, Dev) and Load them as needed
- **Theme preference?** Toggle dark/light mode with the sun/moon icon — it persists across sessions

---

## Version

**v1.2** — Multi-storage support, shareable links, profiles, dev tools, dark/light mode
