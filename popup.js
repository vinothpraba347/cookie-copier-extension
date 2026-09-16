/* ============================================================
   TokenHop — Developer Toolkit
   Tabs: Cookies | Dev Tools | Session | Profiles
   ============================================================ */

/* ============================================================
   ELEMENT REFS
   ============================================================ */
const $ = (id) => document.getElementById(id);

const copyBtn = $("copyBtn");
const pasteBtn = $("pasteBtn");
const viewBtn = $("viewBtn");
const settingsBtn = $("settingsBtn");
const settingsPanel = $("settingsPanel");
const cookieList = $("cookieList");
const lsList = $("lsList");
const ssList = $("ssList");
const statusEl = $("status");
const tokenBox = $("tokenBox");
const tokenValue = $("tokenValue");

const autoRefreshToggle = $("autoRefreshToggle");
const clearCacheBtn = $("clearCacheBtn");
const cacheSizeEl = $("cacheSize");
const statusClose = $("statusClose");

const copyShareableBtn = $("copyShareableBtn");
const feedDataBtn = $("feedDataBtn");
const feedSection = $("feedSection");
const feedInput = $("feedInput");
const feedApplyBtn = $("feedApplyBtn");
const feedCancelBtn = $("feedCancelBtn");

const clearCookiesBtn = $("clearCookiesBtn");
const clearLocalBtn = $("clearLocalBtn");
const clearSessionBtn = $("clearSessionBtn");
const nukeBtn = $("nukeBtn");

const profileNameInput = $("profileNameInput");
const saveProfileBtn = $("saveProfileBtn");
const profileList = $("profileList");

const sessionContent = $("sessionContent");

/* ============================================================
   CONSTANTS
   ============================================================ */
const DEFAULT_SELECTED_COOKIES = [];

const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1"></path></svg>';
const CHECK_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const TRASH_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

/* ============================================================
   PROMISIFIED CHROME API WRAPPERS
   ============================================================ */
/* Cache the active tab for the popup's lifetime. chrome.tabs.query is async
   and was called in nearly every handler; caching removes repeated round-trips. */
let _cachedTab = null;

function getCurrentTab() {
  if (_cachedTab) return Promise.resolve(_cachedTab);
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      _cachedTab = tabs[0] || null;
      resolve(_cachedTab);
    });
  });
}

/* The popup is short-lived, but if the user switches tabs while it's open we
   must refresh the cache so actions target the newly-active tab. */
chrome.tabs.onActivated.addListener(() => {
  _cachedTab = null;
});

function getCookiesForUrl(url) {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ url }, (cookies) => resolve(cookies || []));
  });
}

function setCookie(details) {
  return new Promise((resolve) => {
    chrome.cookies.set(details, (cookie) => resolve(cookie));
  });
}

function removeCookie(details) {
  return new Promise((resolve) => {
    chrome.cookies.remove(details, (cookie) => resolve(cookie));
  });
}

function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result));
  });
}

function setStorage(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => resolve());
  });
}

function clearStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => resolve());
  });
}

function executeScript(tabId, func, args = []) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      { target: { tabId }, func, args },
      (results) => {
        if (chrome.runtime.lastError) {
          resolve({ _error: chrome.runtime.lastError.message });
        } else if (!results || !results[0]) {
          resolve({ _error: "No results" });
        } else {
          resolve(results[0].result);
        }
      },
    );
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function getOriginFromUrl(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function getCurrentDomain() {
  const tab = await getCurrentTab();
  return tab && tab.url ? getDomainFromUrl(tab.url) : null;
}

function showStatus(message, type) {
  statusEl.className = `status show ${type}`;
  statusEl.textContent = "";
  const msgNode = document.createElement("span");
  /* Safe text rendering: split on newlines, insert <br> between text nodes.
     Never use innerHTML — cookie/storage names flow here and could contain markup. */
  const lines = String(message).split("\n");
  lines.forEach((line, i) => {
    if (i > 0) msgNode.appendChild(document.createElement("br"));
    msgNode.appendChild(document.createTextNode(line));
  });
  statusEl.appendChild(msgNode);
  const closeBtn = statusClose.cloneNode(true);
  closeBtn.addEventListener("click", () => {
    statusEl.className = "status";
    statusEl.textContent = "";
  });
  statusEl.appendChild(closeBtn);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(text)
      .catch(() => execCommandCopy(text));
  }
  return execCommandCopy(text);
}

function execCommandCopy(text) {
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "0";
      textarea.style.top = "0";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) resolve();
      else reject(new Error("execCommand copy returned false"));
    } catch (err) {
      reject(err);
    }
  });
}

function hideTokenBox() {
  tokenBox.classList.remove("show");
  tokenValue.textContent = "";
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatCount(ms) {
  if (ms <= 0) return "EXPIRED";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (days > 0) return days + "d " + h + "h " + m + "m";
  if (h > 0) return h + "h " + m + "m " + sec + "s";
  if (m > 0) return m + "m " + sec + "s";
  return sec + "s";
}

function buildClipboardText(storedCookies) {
  const entries = Object.entries(storedCookies);
  if (entries.length === 0) return "";
  return entries.map(([name, value]) => `${name}\n${value}`).join("\n\n");
}

function summarizeCounts(ck, lk, sk) {
  const parts = [];
  if (ck > 0) parts.push(`${ck} cookie${ck > 1 ? "s" : ""}`);
  if (lk > 0) parts.push(`${lk} localStorage item${lk > 1 ? "s" : ""}`);
  if (sk > 0) parts.push(`${sk} sessionStorage item${sk > 1 ? "s" : ""}`);
  return parts.join(", ");
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
const tabBtns = document.querySelectorAll(".tab");
const tabPanels = document.querySelectorAll(".tab-panel");

function switchTab(tabName) {
  tabBtns.forEach((t) => {
    const active = t.dataset.tab === tabName;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active);
  });
  tabPanels.forEach((p) => p.classList.remove("active"));
  const panel = $(`panel-${tabName}`);
  if (panel) panel.classList.add("active");

  if (tabName === "session") renderSession();
  if (tabName === "profiles") renderProfiles();

  if (tabName !== "session" && sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
}

tabBtns.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  /* Keyboard navigation: arrow keys to move between tabs */
  tab.addEventListener("keydown", (e) => {
    const tabs = Array.from(tabBtns);
    const idx = tabs.indexOf(tab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      next.focus();
      switchTab(next.dataset.tab);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      prev.focus();
      switchTab(prev.dataset.tab);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      switchTab(tab.dataset.tab);
    }
  });
});

/* ---------- Settings sub-tab switching ---------- */
document.querySelectorAll(".subtab").forEach((subtab) => {
  subtab.addEventListener("click", () => {
    document
      .querySelectorAll(".subtab")
      .forEach((s) => s.classList.remove("active"));
    document
      .querySelectorAll(".subtab-panel")
      .forEach((p) => p.classList.remove("active"));
    subtab.classList.add("active");
    $(`subtab-${subtab.dataset.subtab}`).classList.add("active");
  });
});

/* ============================================================
   PER-SITE SELECTION (cookies + storage)
   ============================================================ */
async function loadSelectedCookies() {
  const domain = await getCurrentDomain();
  if (!domain) return DEFAULT_SELECTED_COOKIES;
  const key = `selectedCookies_${domain}`;
  const result = await getStorage([key]);
  return Array.isArray(result[key]) ? result[key] : DEFAULT_SELECTED_COOKIES;
}

async function saveSelectedCookies(selected) {
  const domain = await getCurrentDomain();
  if (!domain) return;
  const key = `selectedCookies_${domain}`;
  await setStorage({ [key]: selected });
}

async function loadSelectedStorage(type) {
  const domain = await getCurrentDomain();
  if (!domain) return [];
  const key = `selected${type}_${domain}`;
  const result = await getStorage([key]);
  return Array.isArray(result[key]) ? result[key] : [];
}

async function saveSelectedStorage(type, selected) {
  const domain = await getCurrentDomain();
  if (!domain) return;
  const key = `selected${type}_${domain}`;
  await setStorage({ [key]: selected });
}

/* ============================================================
   STORAGE CAPTURE / INJECTION (with cache)
   ============================================================ */
let _storageCache = null;
let _storageCacheTabId = null;
const _STORAGE_CACHE_TTL = 5000;

function invalidateStorageCache() {
  _storageCache = null;
  _storageCacheTabId = null;
}

async function captureStorage(tab) {
  if (!tab || !tab.id) {
    return { localStorage: {}, sessionStorage: {}, _error: "No tab" };
  }

  const now = Date.now();
  if (
    _storageCache &&
    _storageCacheTabId === tab.id &&
    now - _storageCache._cacheTime < _STORAGE_CACHE_TTL
  ) {
    return _storageCache;
  }

  if (!chrome.scripting) {
    return {
      localStorage: {},
      sessionStorage: {},
      _error: "scripting API not available",
    };
  }

  const result = await executeScript(tab.id, () => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      ls[k] = localStorage.getItem(k);
    }
    const ss = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      ss[k] = sessionStorage.getItem(k);
    }
    return { localStorage: ls, sessionStorage: ss };
  });

  if (result._error) return result;

  result._cacheTime = Date.now();
  _storageCache = result;
  _storageCacheTabId = tab.id;
  return result;
}

async function injectStorage(tab, lsData, ssData) {
  if (!chrome.scripting) {
    return { lsCount: 0, ssCount: 0, _error: "scripting API not available" };
  }
  return executeScript(
    tab.id,
    (ls, ss) => {
      let lsCount = 0;
      let ssCount = 0;
      Object.entries(ls).forEach(([k, v]) => {
        try {
          localStorage.setItem(k, v);
          lsCount++;
        } catch (e) {}
      });
      Object.entries(ss).forEach(([k, v]) => {
        try {
          sessionStorage.setItem(k, v);
          ssCount++;
        } catch (e) {}
      });
      return { lsCount, ssCount };
    },
    [lsData || {}, ssData || {}],
  );
}

/* Invalidate caches when tab navigates */
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url) {
    _cachedTab = null;
    if (_storageCacheTabId === tabId) invalidateStorageCache();
  } else if (info.status === "loading") {
    if (_storageCacheTabId === tabId) invalidateStorageCache();
  }
});

/* ============================================================
   SHARED: Gather selected data + Apply data to site
   ============================================================ */
async function gatherSelectedData(tab) {
  /* Batch all three selection reads into a single chrome.storage.local.get
     call. Each loader otherwise calls getCurrentDomain() (a tab query) +
     getStorage separately — 3 round-trips collapsed to 1. */
  const domain = getDomainFromUrl(tab.url);
  if (!domain) {
    return {
      error:
        "Cannot detect site domain. Open a normal http(s) page and try again.",
    };
  }
  const ckKey = `selectedCookies_${domain}`;
  const lsKey = `selectedLS_${domain}`;
  const ssKey = `selectedSS_${domain}`;
  const result = await getStorage([ckKey, lsKey, ssKey]);
  const selectedCookies = Array.isArray(result[ckKey]) ? result[ckKey] : [];
  const selectedLS = Array.isArray(result[lsKey]) ? result[lsKey] : [];
  const selectedSS = Array.isArray(result[ssKey]) ? result[ssKey] : [];

  if (
    selectedCookies.length === 0 &&
    selectedLS.length === 0 &&
    selectedSS.length === 0
  ) {
    return {
      error:
        "Nothing selected. Open settings to select cookies, localStorage, or sessionStorage.",
    };
  }

  const cookies = await getCookiesForUrl(tab.url);
  const storedCookies = {};
  selectedCookies.forEach((name) => {
    const match = cookies.find((c) => c.name === name);
    if (match) storedCookies[name] = match.value;
  });

  const storage = await captureStorage(tab);
  if (storage._error) {
    return {
      error: `Storage capture failed: ${storage._error}. Remove & re-add extension.`,
    };
  }

  const filteredLS = {};
  selectedLS.forEach((key) => {
    if (storage.localStorage[key] !== undefined)
      filteredLS[key] = storage.localStorage[key];
  });
  const filteredSS = {};
  selectedSS.forEach((key) => {
    if (storage.sessionStorage[key] !== undefined)
      filteredSS[key] = storage.sessionStorage[key];
  });

  const ck = Object.keys(storedCookies).length;
  const lk = Object.keys(filteredLS).length;
  const sk = Object.keys(filteredSS).length;

  if (ck === 0 && lk === 0 && sk === 0) {
    return {
      error: "No matching data found on this site. Check your selection.",
    };
  }

  return {
    data: {
      cookies: storedCookies,
      localStorage: filteredLS,
      sessionStorage: filteredSS,
    },
    counts: { ck, lk, sk },
  };
}

async function applyDataToSite(tab, data) {
  const origin = getOriginFromUrl(tab.url);
  const domain = getDomainFromUrl(tab.url);
  const cookieNames = Object.keys(data.cookies || {});

  let cookieDone = 0;
  let cookieFailed = 0;
  const failedNames = [];

  if (cookieNames.length > 0) {
    const results = await Promise.all(
      cookieNames.map((name) =>
        setCookie({
          url: origin,
          name,
          value: data.cookies[name],
          path: "/",
        }),
      ),
    );
    results.forEach((cookie, i) => {
      if (cookie) cookieDone++;
      else {
        cookieFailed++;
        failedNames.push(cookieNames[i]);
      }
    });
  }

  const counts = await injectStorage(
    tab,
    data.localStorage || {},
    data.sessionStorage || {},
  );

  return { cookieDone, cookieFailed, failedNames, counts, domain };
}

async function maybeAutoReload(tab) {
  const r = await getStorage(["autoRefresh"]);
  if (r.autoRefresh === true) chrome.tabs.reload(tab.id);
}

/* ============================================================
   COOKIE SELECTOR LIST (with edit + delete)
   ============================================================ */
function renderCookieList(cookies, selected) {
  cookieList.innerHTML = "";

  if (!cookies || cookies.length === 0) {
    cookieList.innerHTML =
      '<div class="settings-empty">No cookies found on this site.</div>';
    return;
  }

  const uniqueNames = [...new Set(cookies.map((c) => c.name))].sort();
  const cookieByName = {};
  cookies.forEach((c) => {
    if (!(c.name in cookieByName)) cookieByName[c.name] = c.value;
  });

  const allSelected =
    uniqueNames.length > 0 && uniqueNames.every((n) => selected.includes(n));
  const selectAllBar = document.createElement("div");
  selectAllBar.className = "select-all-bar";
  const selectAllBtn = document.createElement("button");
  selectAllBtn.className = "btn btn-small btn-secondary select-all-btn";
  selectAllBtn.textContent = allSelected ? "Deselect All" : "Select All";
  const checkboxes = [];

  function updateSelectAllLabel() {
    const allChecked =
      checkboxes.length > 0 && checkboxes.every((cb) => cb.checked);
    selectAllBtn.textContent = allChecked ? "Deselect All" : "Select All";
  }

  selectAllBtn.addEventListener("click", () => {
    const allChecked = checkboxes.every((cb) => cb.checked);
    const newState = !allChecked;
    checkboxes.forEach((cb) => (cb.checked = newState));
    saveSelectedCookies(newState ? uniqueNames : []);
    updateSelectAllLabel();
  });
  selectAllBar.appendChild(selectAllBtn);
  cookieList.appendChild(selectAllBar);

  const fragment = document.createDocumentFragment();
  uniqueNames.forEach((name) => {
    const isChecked = selected.includes(name);
    const value = cookieByName[name] || "";

    const row = document.createElement("div");
    row.className = "cookie-toggle";

    const label = document.createElement("span");
    label.textContent = name;
    label.style.cursor = "pointer";
    label.title = "Click to edit value";
    label.addEventListener("click", () => {
      const input = document.createElement("input");
      input.className = "cookie-edit-input";
      input.type = "text";
      input.value = value;
      label.replaceWith(input);
      input.focus();
      input.select();

      async function saveEdit() {
        const newValue = input.value;
        const tab = await getCurrentTab();
        if (!tab || !tab.url) return;
        const origin = getOriginFromUrl(tab.url);
        const result = await setCookie({
          url: origin,
          name,
          value: newValue,
          path: "/",
        });
        input.replaceWith(label);
        label.textContent = name;
        if (result) {
          showStatus(`Updated ${name}`, "success");
          refreshCookieList();
        } else {
          showStatus(`Failed to update ${name}.`, "error");
        }
      }

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") {
          input.replaceWith(label);
          label.textContent = name;
        }
      });
      input.addEventListener("blur", () => {
        input.replaceWith(label);
        label.textContent = name;
      });
    });

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "cookie-actions";

    const copyIconBtn = document.createElement("button");
    copyIconBtn.className = "copy-icon";
    copyIconBtn.type = "button";
    copyIconBtn.title = `Copy ${name} value`;
    copyIconBtn.setAttribute("aria-label", `Copy ${name} value`);
    copyIconBtn.innerHTML = COPY_ICON_SVG;
    copyIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!value) {
        showStatus(`No value for ${name}.`, "error");
        return;
      }
      copyToClipboard(value)
        .then(() => {
          showStatus(`Copied ${name}`, "success");
          copyIconBtn.classList.add("copied");
          copyIconBtn.innerHTML = CHECK_ICON_SVG;
          setTimeout(() => {
            copyIconBtn.classList.remove("copied");
            copyIconBtn.innerHTML = COPY_ICON_SVG;
          }, 1200);
        })
        .catch(() => showStatus(`Failed to copy ${name}.`, "error"));
    });

    const deleteIconBtn = document.createElement("button");
    deleteIconBtn.className = "delete-icon";
    deleteIconBtn.type = "button";
    deleteIconBtn.title = `Delete ${name}`;
    deleteIconBtn.setAttribute("aria-label", `Delete ${name}`);
    deleteIconBtn.innerHTML = TRASH_ICON_SVG;
    deleteIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      getCurrentTab().then((tab) => {
        if (!tab || !tab.url) return;
        const origin = getOriginFromUrl(tab.url);
        removeCookie({ url: origin, name }).then((result) => {
          if (result) {
            showStatus(`Deleted ${name}`, "success");
            refreshCookieList();
          } else {
            showStatus(`Failed to delete ${name}.`, "error");
          }
        });
      });
    });

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = isChecked;
    input.addEventListener("change", () => {
      loadSelectedCookies().then((current) => {
        const updated = input.checked
          ? [...new Set([...current, name])]
          : current.filter((n) => n !== name);
        saveSelectedCookies(updated);
        updateSelectAllLabel();
      });
    });
    checkboxes.push(input);
    const slider = document.createElement("span");
    slider.className = "slider";
    switchLabel.appendChild(input);
    switchLabel.appendChild(slider);

    actionsWrap.appendChild(copyIconBtn);
    actionsWrap.appendChild(deleteIconBtn);
    actionsWrap.appendChild(switchLabel);

    row.appendChild(label);
    row.appendChild(actionsWrap);
    fragment.appendChild(row);
  });
  cookieList.appendChild(fragment);
}

async function refreshCookieList() {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    cookieList.innerHTML =
      '<div class="settings-empty">Could not detect the active tab.</div>';
    return;
  }
  const cookies = await getCookiesForUrl(tab.url);
  const selected = await loadSelectedCookies();
  renderCookieList(cookies, selected);
}

/* ============================================================
   LS / SS SELECTOR LISTS
   ============================================================ */
function renderStorageList(container, type, items, selected) {
  container.innerHTML = "";
  const entries = Object.entries(items || {});

  if (entries.length === 0) {
    container.innerHTML = `<div class="settings-empty">No ${type === "LS" ? "localStorage" : "sessionStorage"} items on this site.</div>`;
    return;
  }

  const allSelected = entries.every(([key]) => selected.includes(key));
  const selectAllBar = document.createElement("div");
  selectAllBar.className = "select-all-bar";
  const selectAllBtn = document.createElement("button");
  selectAllBtn.className = "btn btn-small btn-secondary select-all-btn";
  selectAllBtn.textContent = allSelected ? "Deselect All" : "Select All";
  const checkboxes = [];

  function updateSelectAllLabel() {
    const allChecked =
      checkboxes.length > 0 && checkboxes.every((cb) => cb.checked);
    selectAllBtn.textContent = allChecked ? "Deselect All" : "Select All";
  }

  selectAllBtn.addEventListener("click", () => {
    const allChecked = checkboxes.every((cb) => cb.checked);
    const newState = !allChecked;
    checkboxes.forEach((cb) => (cb.checked = newState));
    saveSelectedStorage(type, newState ? entries.map(([key]) => key) : []);
    updateSelectAllLabel();
  });
  selectAllBar.appendChild(selectAllBtn);
  container.appendChild(selectAllBar);

  const fragment = document.createDocumentFragment();
  entries.forEach(([key, value]) => {
    const isChecked = selected.includes(key);
    const row = document.createElement("div");
    row.className = "cookie-toggle";

    const label = document.createElement("span");
    label.textContent = key;

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "cookie-actions";

    const copyIconBtn = document.createElement("button");
    copyIconBtn.className = "copy-icon";
    copyIconBtn.type = "button";
    copyIconBtn.title = `Copy ${key} value`;
    copyIconBtn.innerHTML = COPY_ICON_SVG;
    copyIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyToClipboard(value)
        .then(() => {
          showStatus(`Copied ${key}`, "success");
          copyIconBtn.classList.add("copied");
          copyIconBtn.innerHTML = CHECK_ICON_SVG;
          setTimeout(() => {
            copyIconBtn.classList.remove("copied");
            copyIconBtn.innerHTML = COPY_ICON_SVG;
          }, 1200);
        })
        .catch(() => showStatus(`Failed to copy ${key}.`, "error"));
    });

    const deleteIconBtn = document.createElement("button");
    deleteIconBtn.className = "delete-icon";
    deleteIconBtn.type = "button";
    deleteIconBtn.title = `Delete ${key}`;
    deleteIconBtn.innerHTML = TRASH_ICON_SVG;
    deleteIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const storageName = type === "LS" ? "localStorage" : "sessionStorage";
      getCurrentTab().then((tab) => {
        if (!tab || !tab.id) return;
        executeScript(
          tab.id,
          (storageType, itemKey) => {
            if (storageType === "LS") localStorage.removeItem(itemKey);
            else sessionStorage.removeItem(itemKey);
          },
          [type, key],
        ).then(() => {
          loadSelectedStorage(type).then((current) => {
            saveSelectedStorage(
              type,
              current.filter((n) => n !== key),
            );
            showStatus(`Deleted ${key} from ${storageName}`, "success");
            refreshStorageLists();
          });
        });
      });
    });

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = isChecked;
    input.addEventListener("change", () => {
      loadSelectedStorage(type).then((current) => {
        const updated = input.checked
          ? [...new Set([...current, key])]
          : current.filter((n) => n !== key);
        saveSelectedStorage(type, updated);
        updateSelectAllLabel();
      });
    });
    checkboxes.push(input);
    const slider = document.createElement("span");
    slider.className = "slider";
    switchLabel.appendChild(input);
    switchLabel.appendChild(slider);

    actionsWrap.appendChild(copyIconBtn);
    actionsWrap.appendChild(deleteIconBtn);
    actionsWrap.appendChild(switchLabel);
    row.appendChild(label);
    row.appendChild(actionsWrap);
    fragment.appendChild(row);
  });
  container.appendChild(fragment);
}

async function refreshStorageLists() {
  const tab = await getCurrentTab();
  if (!tab || !tab.id) {
    lsList.innerHTML =
      '<div class="settings-empty">Could not detect the active tab.</div>';
    ssList.innerHTML =
      '<div class="settings-empty">Could not detect the active tab.</div>';
    return;
  }

  lsList.innerHTML =
    '<div class="settings-empty">Loading localStorage...</div>';
  ssList.innerHTML =
    '<div class="settings-empty">Loading sessionStorage...</div>';

  if (!chrome.scripting) {
    lsList.innerHTML =
      '<div class="settings-empty">scripting API not available. Remove & re-add extension.</div>';
    ssList.innerHTML =
      '<div class="settings-empty">scripting API not available. Remove & re-add extension.</div>';
    return;
  }

  const storage = await captureStorage(tab);
  if (storage._error) {
    const lsEmpty = document.createElement("div");
    lsEmpty.className = "settings-empty";
    lsEmpty.textContent = `Cannot read localStorage: ${storage._error}`;
    lsList.innerHTML = "";
    lsList.appendChild(lsEmpty);
    const ssEmpty = document.createElement("div");
    ssEmpty.className = "settings-empty";
    ssEmpty.textContent = `Cannot read sessionStorage: ${storage._error}`;
    ssList.innerHTML = "";
    ssList.appendChild(ssEmpty);
    return;
  }

  const lsData = storage.localStorage || {};
  const ssData = storage.sessionStorage || {};

  if (Object.keys(lsData).length === 0 && Object.keys(ssData).length === 0) {
    lsList.innerHTML =
      '<div class="settings-empty">No localStorage items on this site.</div>';
    ssList.innerHTML =
      '<div class="settings-empty">No sessionStorage items on this site.</div>';
    return;
  }

  /* Batch the two selection reads into a single chrome.storage.local.get. */
  const domain = getDomainFromUrl(tab.url);
  const lsKey = `selectedLS_${domain}`;
  const ssKey = `selectedSS_${domain}`;
  const sel = await getStorage([lsKey, ssKey]);
  const selLS = Array.isArray(sel[lsKey]) ? sel[lsKey] : [];
  const selSS = Array.isArray(sel[ssKey]) ? sel[ssKey] : [];
  renderStorageList(lsList, "LS", lsData, selLS);
  renderStorageList(ssList, "SS", ssData, selSS);
}

/* ============================================================
   CACHE SIZE
   ============================================================ */
async function updateCacheSize() {
  if (chrome.storage.local.getBytesInUse) {
    const bytes = await new Promise((r) =>
      chrome.storage.local.getBytesInUse(r),
    );
    cacheSizeEl.textContent = formatBytes(bytes);
  } else {
    const items = await getStorage(null);
    const bytes = new Blob([JSON.stringify(items)]).size;
    cacheSizeEl.textContent = formatBytes(bytes);
  }
}

/* ============================================================
   SETTINGS PANEL
   ============================================================ */
async function toggleSettingsPanel() {
  const isOpen = settingsPanel.classList.toggle("show");
  if (isOpen) {
    refreshCookieList();
    refreshStorageLists();
    updateCacheSize();
    const result = await getStorage(["autoRefresh"]);
    autoRefreshToggle.checked = result.autoRefresh === true;
  }
}

settingsBtn.addEventListener("click", toggleSettingsPanel);

autoRefreshToggle.addEventListener("change", () => {
  setStorage({ autoRefresh: autoRefreshToggle.checked });
});

clearCacheBtn.addEventListener("click", async () => {
  await clearStorage();
  showStatus("Extension reset — all data cleared.", "success");
  hideTokenBox();
  updateCacheSize();
  autoRefreshToggle.checked = false;
  refreshCookieList();
  refreshStorageLists();
  renderProfiles();
});

/* ============================================================
   COOKIES TAB — Copy / Paste / View
   ============================================================ */
copyBtn.addEventListener("click", async () => {
  hideTokenBox();
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }

  const result = await gatherSelectedData(tab);
  if (result.error) {
    showStatus(result.error, "error");
    return;
  }

  const { data, counts } = result;
  const clipText = buildClipboardText(data.cookies);
  await setStorage({ storedCookies: data.cookies, storedData: data });
  showStatus(
    `Copied: ${summarizeCounts(counts.ck, counts.lk, counts.sk)}`,
    "success",
  );
  copyToClipboard(clipText).catch(() => {});
});

pasteBtn.addEventListener("click", async () => {
  hideTokenBox();
  const result = await getStorage(["storedData", "storedCookies"]);
  const storedData = result.storedData || {
    cookies: result.storedCookies || {},
  };
  const storedCookies = storedData.cookies || {};
  const storedLS = storedData.localStorage || {};
  const storedSS = storedData.sessionStorage || {};

  if (
    Object.keys(storedCookies).length === 0 &&
    Object.keys(storedLS).length === 0 &&
    Object.keys(storedSS).length === 0
  ) {
    showStatus("No stored data found. Copy from a site first.", "error");
    return;
  }

  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }

  const outcome = await applyDataToSite(tab, storedData);
  const parts = [];
  if (Object.keys(storedCookies).length > 0)
    parts.push(
      `${outcome.cookieDone} cookie${outcome.cookieDone !== 1 ? "s" : ""}`,
    );
  if (outcome.counts.lsCount > 0)
    parts.push(`${outcome.counts.lsCount} localStorage`);
  if (outcome.counts.ssCount > 0)
    parts.push(`${outcome.counts.ssCount} sessionStorage`);

  if (outcome.counts._error) {
    showStatus(
      `Pasted ${parts.join(", ")}. Storage inject failed: ${outcome.counts._error}`,
      "error",
    );
  } else if (outcome.cookieFailed > 0) {
    showStatus(
      `Pasted ${parts.join(", ")}. Failed: ${outcome.failedNames.join(", ")}`,
      "error",
    );
  } else {
    showStatus(`Pasted to ${outcome.domain}: ${parts.join(", ")}`, "success");
  }
  maybeAutoReload(tab);
});

/* ---------- View Stored Data ---------- */
function buildStorageCards(data) {
  const entries = Object.entries(data || {});
  const container = document.createElement("div");
  container.className = "token-value";

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "storage-subempty";
    empty.textContent = "No items stored";
    container.appendChild(empty);
    return container;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach(([name, value]) => {
    const card = document.createElement("div");
    card.className = "stored-card";
    const nameEl = document.createElement("div");
    nameEl.className = "stored-card-name";
    nameEl.textContent = name;
    const valueEl = document.createElement("div");
    valueEl.className = "stored-card-value";
    valueEl.textContent = value;
    card.appendChild(nameEl);
    card.appendChild(valueEl);
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
  return container;
}

viewBtn.addEventListener("click", async () => {
  if (tokenBox.classList.contains("show")) {
    tokenBox.classList.remove("show");
    tokenValue.innerHTML = "";
    return;
  }
  statusEl.className = "status";
  statusEl.textContent = "";

  const result = await getStorage(["storedData", "storedCookies"]);
  const storedData = result.storedData || {
    cookies: result.storedCookies || {},
  };
  const ck = Object.keys(storedData.cookies || {}).length;
  const lk = Object.keys(storedData.localStorage || {}).length;
  const sk = Object.keys(storedData.sessionStorage || {}).length;

  if (ck === 0 && lk === 0 && sk === 0) {
    tokenBox.classList.remove("show");
    showStatus("No stored data found. Copy from a site first.", "info");
    return;
  }

  tokenValue.innerHTML = "";
  const subBar = document.createElement("div");
  subBar.className = "subtab-bar";

  const tabs = [
    { label: `Cookies (${ck})`, data: storedData.cookies },
    { label: `Local (${lk})`, data: storedData.localStorage },
    { label: `Session (${sk})`, data: storedData.sessionStorage },
  ];

  const panels = tabs.map((t, i) => {
    const panel = document.createElement("div");
    panel.className = "subtab-panel" + (i === 0 ? " active" : "");
    panel.appendChild(buildStorageCards(t.data));
    return panel;
  });

  tabs.forEach((t, i) => {
    const tabEl = document.createElement("div");
    tabEl.className = "subtab" + (i === 0 ? " active" : "");
    tabEl.textContent = t.label;
    tabEl.addEventListener("click", () => {
      subBar
        .querySelectorAll(".subtab")
        .forEach((s) => s.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tabEl.classList.add("active");
      panels[i].classList.add("active");
    });
    subBar.appendChild(tabEl);
  });

  tokenValue.appendChild(subBar);
  panels.forEach((p) => tokenValue.appendChild(p));
  tokenBox.classList.add("show");
});

/* ============================================================
   SHAREABLE ENCODE / DECODE (with gzip)
   ============================================================ */
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipBytes(bytes) {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks = [];
  let totalLen = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
  }
  const result = new Uint8Array(totalLen);
  let offset = 0;
  chunks.forEach((c) => {
    result.set(c, offset);
    offset += c.length;
  });
  return result;
}

async function gunzipBytes(bytes) {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks = [];
  let totalLen = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLen += value.length;
  }
  const result = new Uint8Array(totalLen);
  let offset = 0;
  chunks.forEach((c) => {
    result.set(c, offset);
    offset += c.length;
  });
  return result;
}

async function encodeShareable(data) {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);

  if (typeof CompressionStream !== "undefined") {
    try {
      const gzipped = await gzipBytes(bytes);
      const b64 = bytesToBase64(gzipped);
      const uncompressedB64 = bytesToBase64(bytes);
      if (b64.length < uncompressedB64.length) {
        return { text: "TH1G:" + b64, size: b64.length + 5 };
      }
      return {
        text: "TH1:" + uncompressedB64,
        size: uncompressedB64.length + 4,
      };
    } catch (e) {
      /* fall through */
    }
  }

  const b64 = bytesToBase64(bytes);
  return { text: "TH1:" + b64, size: b64.length + 4 };
}

async function decodeShareable(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("TH1G:") && !trimmed.startsWith("TH1:")) {
    throw new Error("Invalid format -- must start with TH1: or TH1G:");
  }

  let bytes;
  if (trimmed.startsWith("TH1G:")) {
    const b64 = trimmed.slice(5);
    const gzBytes = base64ToBytes(b64);
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Gzipped data but DecompressionStream not supported");
    }
    bytes = await gunzipBytes(gzBytes);
  } else {
    const b64 = trimmed.slice(4);
    bytes = base64ToBytes(b64);
  }

  const json = new TextDecoder().decode(bytes);
  const data = JSON.parse(json);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data structure");
  }
  return {
    cookies: data.cookies || {},
    localStorage: data.localStorage || {},
    sessionStorage: data.sessionStorage || {},
  };
}

/* ============================================================
   COPY SHAREABLE + FEED DATA
   ============================================================ */
copyShareableBtn.addEventListener("click", async () => {
  hideTokenBox();
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }

  const result = await gatherSelectedData(tab);
  if (result.error) {
    showStatus(result.error, "error");
    return;
  }

  const { data, counts } = result;
  const shareable = await encodeShareable(data);

  try {
    await copyToClipboard(shareable.text);
    const sizeStr =
      shareable.size > 1000
        ? `${(shareable.size / 1000).toFixed(1)}K chars`
        : `${shareable.size} chars`;
    const prefix = shareable.text.startsWith("TH1G:") ? " (gzipped)" : "";
    showStatus(
      `Shareable copied (${summarizeCounts(counts.ck, counts.lk, counts.sk)}) -- ${sizeStr}${prefix}`,
      "success",
    );
  } catch {
    showStatus("Failed to copy shareable string.", "error");
  }
});

feedDataBtn.addEventListener("click", () => {
  hideTokenBox();
  feedSection.classList.add("show");
  feedInput.value = "";
  feedInput.focus();
});

feedCancelBtn.addEventListener("click", () => {
  feedSection.classList.remove("show");
  feedInput.value = "";
});

feedApplyBtn.addEventListener("click", async () => {
  const text = feedInput.value.trim();
  if (!text) {
    showStatus("Paste shared data first.", "error");
    return;
  }

  let data;
  try {
    data = await decodeShareable(text);
  } catch (err) {
    showStatus(err.message, "error");
    return;
  }

  const ck = Object.keys(data.cookies).length;
  const lk = Object.keys(data.localStorage).length;
  const sk = Object.keys(data.sessionStorage).length;

  if (ck === 0 && lk === 0 && sk === 0) {
    showStatus("Shared data is empty.", "error");
    return;
  }

  showStatus(`Decoded: ${summarizeCounts(ck, lk, sk)}. Applying...`, "info");

  await setStorage({ storedData: data, storedCookies: data.cookies });
  feedSection.classList.remove("show");
  feedInput.value = "";

  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }

  const outcome = await applyDataToSite(tab, data);
  const parts = [];
  if (ck > 0)
    parts.push(
      `${outcome.cookieDone} cookie${outcome.cookieDone !== 1 ? "s" : ""}`,
    );
  if (outcome.counts.lsCount > 0)
    parts.push(`${outcome.counts.lsCount} localStorage`);
  if (outcome.counts.ssCount > 0)
    parts.push(`${outcome.counts.ssCount} sessionStorage`);

  if (outcome.counts._error) {
    showStatus(
      `Cookies fed, but storage inject failed: ${outcome.counts._error}`,
      "error",
    );
  } else if (outcome.cookieFailed > 0) {
    showStatus(
      `Fed ${parts.join(", ")}. Failed: ${outcome.failedNames.join(", ")}`,
      "error",
    );
  } else {
    showStatus(`Fed ${parts.join(", ")} to ${outcome.domain}`, "success");
  }
  maybeAutoReload(tab);
});

/* ============================================================
   DEV TOOLS TAB — Clear / Nuke
   ============================================================ */
clearCookiesBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }
  const cookies = await getCookiesForUrl(tab.url);
  if (cookies.length === 0) {
    showStatus("No cookies to clear.", "info");
    return;
  }
  await Promise.all(
    cookies.map((c) => removeCookie({ url: tab.url, name: c.name })),
  );
  showStatus(`Cleared ${cookies.length} cookies`, "success");
});

clearLocalBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  if (!tab || !tab.id) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }
  const result = await executeScript(tab.id, () => localStorage.clear());
  if (result._error) showStatus("Failed to clear localStorage.", "error");
  else showStatus("Cleared localStorage", "success");
});

clearSessionBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  if (!tab || !tab.id) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }
  const result = await executeScript(tab.id, () => sessionStorage.clear());
  if (result._error) showStatus("Failed to clear sessionStorage.", "error");
  else showStatus("Cleared sessionStorage", "success");
});

nukeBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    showStatus("Could not detect the active tab.", "error");
    return;
  }

  const cookies = await getCookiesForUrl(tab.url);
  await Promise.all(
    cookies.map((c) => removeCookie({ url: tab.url, name: c.name })),
  );

  const result = await executeScript(tab.id, () => {
    localStorage.clear();
    sessionStorage.clear();
  });

  if (result._error) {
    showStatus("Cookies cleared, but storage clear failed.", "error");
  } else {
    showStatus("Nuked all site data!", "success");
  }
});

/* ============================================================
   PROFILES TAB — Save / Load / Delete
   ============================================================ */
async function renderProfiles() {
  const result = await getStorage(["profiles"]);
  const profiles = result.profiles || {};
  const names = Object.keys(profiles);

  profileList.innerHTML = "";
  if (names.length === 0) {
    profileList.innerHTML =
      '<div class="empty-state">No saved profiles. Copy data then save a profile.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  names.forEach((name) => {
    const item = document.createElement("div");
    item.className = "profile-item";

    const nameEl = document.createElement("div");
    nameEl.className = "profile-item-name";
    nameEl.textContent = name;

    const actions = document.createElement("div");
    actions.className = "profile-item-actions";

    const loadBtn = document.createElement("button");
    loadBtn.className = "btn btn-paste btn-small";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", async () => {
      const profile = profiles[name];
      const data = {
        cookies: profile.cookies || profile,
        localStorage: profile.localStorage || {},
        sessionStorage: profile.sessionStorage || {},
      };
      const tab = await getCurrentTab();
      if (!tab || !tab.url) {
        showStatus("Could not detect the active tab.", "error");
        return;
      }
      const outcome = await applyDataToSite(tab, data);
      const parts = [];
      if (Object.keys(data.cookies).length > 0)
        parts.push(`${outcome.cookieDone} cookies`);
      if (outcome.counts.lsCount > 0)
        parts.push(`${outcome.counts.lsCount} localStorage`);
      if (outcome.counts.ssCount > 0)
        parts.push(`${outcome.counts.ssCount} sessionStorage`);
      showStatus(
        `Loaded profile "${name}" (${parts.join(", ")})`,
        outcome.cookieFailed > 0 ? "error" : "success",
      );
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-small";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      delete profiles[name];
      await setStorage({ profiles });
      showStatus(`Deleted profile "${name}"`, "success");
      renderProfiles();
    });

    actions.appendChild(loadBtn);
    actions.appendChild(delBtn);
    item.appendChild(nameEl);
    item.appendChild(actions);
    fragment.appendChild(item);
  });
  profileList.appendChild(fragment);
}

saveProfileBtn.addEventListener("click", async () => {
  const name = profileNameInput.value.trim();
  if (!name) {
    showStatus("Enter a profile name.", "error");
    return;
  }
  const result = await getStorage(["storedData", "storedCookies", "profiles"]);
  const storedData = result.storedData || {
    cookies: result.storedCookies || {},
  };
  const ck = Object.keys(storedData.cookies || {}).length;
  const lk = Object.keys(storedData.localStorage || {}).length;
  const sk = Object.keys(storedData.sessionStorage || {}).length;
  if (ck === 0 && lk === 0 && sk === 0) {
    showStatus("No stored data. Copy from a site first.", "error");
    return;
  }
  const profiles = result.profiles || {};
  profiles[name] = storedData;
  await setStorage({ profiles });
  showStatus(
    `Saved profile "${name}" (${summarizeCounts(ck, lk, sk)})`,
    "success",
  );
  profileNameInput.value = "";
  renderProfiles();
});

profileNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveProfileBtn.click();
});

/* ============================================================
   SESSION TAB — JWT Expiry Timer
   ============================================================ */
function decodeJWTPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payloadB64.length % 4) payloadB64 += "=";
    const json = atob(payloadB64);
    const bytes = new Uint8Array(json.length);
    for (let i = 0; i < json.length; i++) bytes[i] = json.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    return null;
  }
}

function isJWT(val) {
  return val && val.startsWith("eyJ") && val.split(".").length >= 2;
}

async function findJWTs() {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) return [];

  const cookies = await getCookiesForUrl(tab.url);
  const jwts = [];

  cookies.forEach((c) => {
    if (isJWT(c.value)) {
      const payload = decodeJWTPayload(c.value);
      if (payload && payload.exp) {
        jwts.push({
          name: c.name,
          value: c.value,
          exp: payload.exp,
          source: "cookie",
          payload,
        });
      }
    }
  });

  const storage = await captureStorage(tab);
  if (!storage._error) {
    Object.entries(storage.localStorage || {}).forEach(([k, v]) => {
      if (isJWT(String(v))) {
        const payload = decodeJWTPayload(String(v));
        if (payload && payload.exp) {
          jwts.push({
            name: k,
            value: v,
            exp: payload.exp,
            source: "localStorage",
            payload,
          });
        }
      }
    });
    Object.entries(storage.sessionStorage || {}).forEach(([k, v]) => {
      if (isJWT(String(v))) {
        const payload = decodeJWTPayload(String(v));
        if (payload && payload.exp) {
          jwts.push({
            name: k,
            value: v,
            exp: payload.exp,
            source: "sessionStorage",
            payload,
          });
        }
      }
    });
  }

  return jwts;
}

let sessionTimerInterval = null;
let _sessionCountdownNodes = null;

async function renderSession() {
  const jwts = await findJWTs();

  if (jwts.length === 0) {
    sessionContent.innerHTML =
      '<div class="session-empty">No JWT tokens found in cookies or storage on this page.</div>';
    _sessionCountdownNodes = null;
    return;
  }

  sessionContent.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const countdownNodes = [];

  jwts.forEach((jwt) => {
    const card = document.createElement("div");
    card.className = "session-card";

    const header = document.createElement("div");
    header.className = "session-card-header";

    const name = document.createElement("div");
    name.className = "session-card-name";
    name.textContent = jwt.name;
    name.title = jwt.name;

    const source = document.createElement("div");
    source.className = "session-card-source";
    source.textContent = jwt.source;

    header.appendChild(name);
    header.appendChild(source);

    const countdown = document.createElement("div");
    countdown.className = "session-countdown";
    countdown.dataset.exp = jwt.exp;
    countdownNodes.push(countdown);

    const meta = document.createElement("div");
    meta.className = "session-meta";

    const expiryDate = document.createElement("span");
    expiryDate.textContent =
      "Expires: " + new Date(jwt.exp * 1000).toLocaleString();

    const issuer = document.createElement("span");
    if (jwt.payload.iss) issuer.textContent = "Iss: " + jwt.payload.iss;
    else if (jwt.payload.sub) issuer.textContent = "Sub: " + jwt.payload.sub;
    else issuer.textContent = "";

    meta.appendChild(expiryDate);
    meta.appendChild(issuer);

    card.appendChild(header);
    card.appendChild(countdown);
    card.appendChild(meta);
    fragment.appendChild(card);
  });
  sessionContent.appendChild(fragment);

  _sessionCountdownNodes = countdownNodes;
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  updateSessionCountdowns();
  sessionTimerInterval = setInterval(updateSessionCountdowns, 1000);
}

function updateSessionCountdowns() {
  if (!_sessionCountdownNodes || _sessionCountdownNodes.length === 0) {
    if (sessionTimerInterval) {
      clearInterval(sessionTimerInterval);
      sessionTimerInterval = null;
    }
    return;
  }
  const now = Date.now();
  _sessionCountdownNodes.forEach((card) => {
    const exp = parseInt(card.dataset.exp, 10) * 1000;
    const remaining = exp - now;
    card.textContent = formatCount(remaining);
    card.classList.remove("safe", "warning", "danger", "expired");
    if (remaining <= 0) card.classList.add("expired");
    else if (remaining < 60000) card.classList.add("danger");
    else if (remaining < 600000) card.classList.add("warning");
    else card.classList.add("safe");
  });
}

/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */
document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;

  const key = e.key.toLowerCase();
  if (key === "c") {
    e.preventDefault();
    copyBtn.click();
  } else if (key === "v") {
    e.preventDefault();
    pasteBtn.click();
  } else if (key === "s") {
    e.preventDefault();
    copyShareableBtn.click();
  }
});

/* ============================================================
   INIT
   ============================================================ */
