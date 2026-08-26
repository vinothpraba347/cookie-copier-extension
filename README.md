# 🔑 TokenHop

Hop cookies & access tokens between websites — copy, paste, and manage with one click.

A Chrome extension to copy, paste, and manage browser cookies across websites. Built for developers and QA teams who need to move auth tokens between environments.

## Features

- **Copy & Paste Cookies** — Transfer cookies between different sites with one click
- **Cookie Selector** — Toggle which cookies to copy using a settings panel (per-site)
- **Per-Cookie Copy** — Copy icon next to each cookie in the selector copies just that cookie's value to the clipboard
- **Stored Cookies View** — Inspect stored cookies as clean, readable cards
- **Clipboard Copy** — Copied cookies are also sent to clipboard for easy sharing
- **Auto Refresh** — Optionally reload the page after pasting cookies
- **Cache Management** — See storage usage and clear extension data

## Installation

1. Clone this repo or download the files
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## Usage

1. Click the extension icon on any website
2. Click ⚙️ (settings) to select which cookies to copy
3. **Copy Cookies** — saves selected cookies from the current site
4. Navigate to another site
5. **Paste Cookies** — applies the stored cookies to the new site
6. **View Stored Cookies** — see what's currently stored in clean card layout

> **Note:** By default, no cookies are pre-selected. Open settings to choose which cookies to copy for each site.

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome APIs: `cookies`, `storage`, `tabs`
