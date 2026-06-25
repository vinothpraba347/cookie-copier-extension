# 🔑 Cookie Copier Extension

A Chrome extension to copy, paste, and manage browser cookies across websites.

## Features

- **Copy & Paste Cookies** — Transfer cookies between different sites with one click
- **Cookie Selector** — Toggle which cookies to copy using a settings panel (per-site)
- **Clipboard Copy** — Copied cookies are also sent to clipboard for easy sharing
- **Auto Refresh** — Optionally reload the page after pasting cookies
- **View Stored Cookies** — Inspect currently stored cookie values
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

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome APIs: `cookies`, `storage`, `tabs`
