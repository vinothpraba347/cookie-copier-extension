/* ============================================================
   TokenHop — Developer Toolkit
   Tabs: Cookies | Dev Tools | Session | Profiles
   ============================================================ */

/* ---------- Element refs ---------- */
const copyBtn = document.getElementById("copyBtn");
const pasteBtn = document.getElementById("pasteBtn");
const viewBtn = document.getElementById("viewBtn");
const settingsBtn = document.getElementById("settingsBtn");
const themeBtn = document.getElementById("themeBtn");
const settingsPanel = document.getElementById("settingsPanel");
const cookieList = document.getElementById("cookieList");
const lsList = document.getElementById("lsList");
const ssList = document.getElementById("ssList");
const statusEl = document.getElementById("status");
const tokenBox = document.getElementById("tokenBox");
const tokenValue = document.getElementById("tokenValue");

const autoRefreshToggle = document.getElementById("autoRefreshToggle");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const cacheSizeEl = document.getElementById("cacheSize");
const statusClose = document.getElementById("statusClose");

/* Share / Feed */
const copyShareableBtn = document.getElementById("copyShareableBtn");
const feedDataBtn = document.getElementById("feedDataBtn");
const feedSection = document.getElementById("feedSection");
const feedInput = document.getElementById("feedInput");
const feedApplyBtn = document.getElementById("feedApplyBtn");
const feedCancelBtn = document.getElementById("feedCancelBtn");

/* Dev Tools */
const clearCookiesBtn = document.getElementById("clearCookiesBtn");
const clearLocalBtn = document.getElementById("clearLocalBtn");
const clearSessionBtn = document.getElementById("clearSessionBtn");
const nukeBtn = document.getElementById("nukeBtn");

/* Profiles */
const profileNameInput = document.getElementById("profileNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileList = document.getElementById("profileList");

/* Session */
const sessionContent = document.getElementById("sessionContent");

const DEFAULT_SELECTED_COOKIES = [];

/* ---------- SVG icons ---------- */
const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1"></path></svg>';
const CHECK_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const TRASH_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
const COOKIE_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 4 4 0 0 0 4 4 4 4 0 0 0 4 4 1 1 0 0 0 1 1z"></path><circle cx="9" cy="9" r="0.6" fill="currentColor" stroke="none"></circle><circle cx="14" cy="8" r="0.6" fill="currentColor" stroke="none"></circle><circle cx="15" cy="14" r="0.6" fill="currentColor" stroke="none"></circle><circle cx="9" cy="15" r="0.6" fill="currentColor" stroke="none"></circle><circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none"></circle></svg>';
const CASINO_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5.5" stroke-dasharray="2.5 2.5"></circle><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"></circle></svg>';
const LAB_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-9.5V3"></path><path d="M7.5 14h9"></path></svg>';

/* ---------- Theme ---------- */
const THEME_CYCLE = ["lab", "casino", "cookie"];
const THEME_ICON = {
  lab: LAB_ICON_SVG,
  casino: CASINO_ICON_SVG,
  cookie: COOKIE_ICON_SVG,
};

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.innerHTML = THEME_ICON[theme] || LAB_ICON_SVG;
}

function initTheme() {
  chrome.storage.local.get(["theme"], (result) => {
    const theme = THEME_CYCLE.includes(result.theme) ? result.theme : "cookie";
    applyTheme(theme);
  });
}

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const idx = THEME_CYCLE.indexOf(current);
  const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
});

/* ---------- Tab switching ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");

    /* Auto-render session tab when opened */
    if (tab.dataset.tab === "session") {
      renderSession();
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
    document
      .getElementById(`subtab-${subtab.dataset.subtab}`)
      .classList.add("active");
  });
});

/* ---------- Helpers ---------- */
function showStatus(message, type) {
  statusEl.className = `status show ${type}`;
  statusEl.innerHTML = message.replace(/\n/g, "<br>") + statusClose.outerHTML;
  /* re-attach close listener since innerHTML replaced it */
  const closeBtn = statusEl.querySelector(".status-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      statusEl.className = "status";
      statusEl.innerHTML = "";
    });
  }
}

statusClose.addEventListener("click", () => {
  statusEl.className = "status";
  statusEl.innerHTML = "";
});

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

function getOriginFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

function getDomainFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

function getCurrentTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}

function getCurrentDomain(callback) {
  getCurrentTab((tab) => {
    if (tab && tab.url) callback(getDomainFromUrl(tab.url));
    else callback(null);
  });
}

/* ---------- Selected cookies (per-site) ---------- */
function loadSelectedCookies(callback) {
  getCurrentDomain((domain) => {
    if (!domain) {
      callback(DEFAULT_SELECTED_COOKIES);
      return;
    }
    const key = `selectedCookies_${domain}`;
    chrome.storage.local.get([key], (result) => {
      const selected = Array.isArray(result[key])
        ? result[key]
        : DEFAULT_SELECTED_COOKIES;
      callback(selected);
    });
  });
}

function saveSelectedCookies(selected) {
  getCurrentDomain((domain) => {
    if (!domain) return;
    const key = `selectedCookies_${domain}`;
    chrome.storage.local.set({ [key]: selected });
  });
}

/* ---------- Selected LS / SS (per-site) ---------- */
function loadSelectedStorage(type, callback) {
  getCurrentDomain((domain) => {
    if (!domain) {
      callback([]);
      return;
    }
    const key = `selected${type}_${domain}`;
    chrome.storage.local.get([key], (result) => {
      callback(Array.isArray(result[key]) ? result[key] : []);
    });
  });
}

function saveSelectedStorage(type, selected) {
  getCurrentDomain((domain) => {
    if (!domain) return;
    const key = `selected${type}_${domain}`;
    chrome.storage.local.set({ [key]: selected });
  });
}

/* ---------- Cookie selector list (with edit + delete) ---------- */
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

  /* Select All / Deselect All bar */
  const allSelected =
    uniqueNames.length > 0 &&
    uniqueNames.every((name) => selected.includes(name));
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
    checkboxes.forEach((cb) => {
      cb.checked = newState;
    });
    if (newState) {
      saveSelectedCookies(uniqueNames);
    } else {
      saveSelectedCookies([]);
    }
    updateSelectAllLabel();
  });
  selectAllBar.appendChild(selectAllBtn);
  cookieList.appendChild(selectAllBar);

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

      function saveEdit() {
        const newValue = input.value;
        getCurrentTab((tab) => {
          if (!tab || !tab.url) return;
          const origin = getOriginFromUrl(tab.url);
          chrome.cookies.set(
            { url: origin, name, value: newValue, path: "/" },
            () => {
              input.replaceWith(label);
              label.textContent = name;
              showStatus(`✅ Updated ${name}`, "success");
              refreshCookieList();
            },
          );
        });
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
        showStatus(`⚠️ No value for ${name}.`, "error");
        return;
      }
      copyToClipboard(value)
        .then(() => {
          showStatus(`✅ Copied ${name}`, "success");
          copyIconBtn.classList.add("copied");
          copyIconBtn.innerHTML = CHECK_ICON_SVG;
          setTimeout(() => {
            copyIconBtn.classList.remove("copied");
            copyIconBtn.innerHTML = COPY_ICON_SVG;
          }, 1200);
        })
        .catch(() => {
          showStatus(`❌ Failed to copy ${name}.`, "error");
        });
    });

    const deleteIconBtn = document.createElement("button");
    deleteIconBtn.className = "delete-icon";
    deleteIconBtn.type = "button";
    deleteIconBtn.title = `Delete ${name}`;
    deleteIconBtn.setAttribute("aria-label", `Delete ${name}`);
    deleteIconBtn.innerHTML = TRASH_ICON_SVG;
    deleteIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      getCurrentTab((tab) => {
        if (!tab || !tab.url) return;
        const origin = getOriginFromUrl(tab.url);
        chrome.cookies.remove({ url: origin, name }, () => {
          showStatus(`🗑️ Deleted ${name}`, "success");
          refreshCookieList();
        });
      });
    });

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = isChecked;
    input.addEventListener("change", () => {
      loadSelectedCookies((current) => {
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
    cookieList.appendChild(row);
  });
}

function refreshCookieList() {
  getCurrentTab((tab) => {
    if (!tab || !tab.url) {
      cookieList.innerHTML =
        '<div class="settings-empty">Could not detect the active tab.</div>';
      return;
    }
    chrome.cookies.getAll({ url: tab.url }, (cookies) => {
      loadSelectedCookies((selected) => {
        renderCookieList(cookies, selected);
      });
    });
  });
}

/* ---------- LS / SS selector lists ---------- */
function renderStorageList(container, type, items, selected) {
  container.innerHTML = "";
  const entries = Object.entries(items || {});

  if (entries.length === 0) {
    container.innerHTML = `<div class="settings-empty">No ${type === "LS" ? "localStorage" : "sessionStorage"} items on this site.</div>`;
    return;
  }

  /* Select All / Deselect All bar */
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
    checkboxes.forEach((cb) => {
      cb.checked = newState;
    });
    if (newState) {
      saveSelectedStorage(
        type,
        entries.map(([key]) => key),
      );
    } else {
      saveSelectedStorage(type, []);
    }
    updateSelectAllLabel();
  });
  selectAllBar.appendChild(selectAllBtn);
  container.appendChild(selectAllBar);

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
          showStatus(`✅ Copied ${key}`, "success");
          copyIconBtn.classList.add("copied");
          copyIconBtn.innerHTML = CHECK_ICON_SVG;
          setTimeout(() => {
            copyIconBtn.classList.remove("copied");
            copyIconBtn.innerHTML = COPY_ICON_SVG;
          }, 1200);
        })
        .catch(() => {
          showStatus(`❌ Failed to copy ${key}.`, "error");
        });
    });

    const deleteIconBtn = document.createElement("button");
    deleteIconBtn.className = "delete-icon";
    deleteIconBtn.type = "button";
    deleteIconBtn.title = `Delete ${key}`;
    deleteIconBtn.innerHTML = TRASH_ICON_SVG;
    deleteIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const storageName = type === "LS" ? "localStorage" : "sessionStorage";
      getCurrentTab((tab) => {
        if (!tab || !tab.id) return;
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: (storageType, itemKey) => {
              if (storageType === "LS") localStorage.removeItem(itemKey);
              else sessionStorage.removeItem(itemKey);
            },
            args: [type, key],
          },
          () => {
            if (chrome.runtime.lastError) {
              showStatus(`❌ Failed to delete ${key}`, "error");
            } else {
              /* also remove from selected */
              loadSelectedStorage(type, (current) => {
                saveSelectedStorage(
                  type,
                  current.filter((n) => n !== key),
                );
              });
              showStatus(`🗑️ Deleted ${key} from ${storageName}`, "success");
              refreshStorageLists();
            }
          },
        );
      });
    });

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = isChecked;
    input.addEventListener("change", () => {
      loadSelectedStorage(type, (current) => {
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
    container.appendChild(row);
  });
}

function refreshStorageLists() {
  getCurrentTab((tab) => {
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

    try {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
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
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            const errMsg = chrome.runtime.lastError.message || "Unknown error";
            lsList.innerHTML = `<div class="settings-empty">Cannot read localStorage: ${errMsg}</div>`;
            ssList.innerHTML = `<div class="settings-empty">Cannot read sessionStorage: ${errMsg}</div>`;
            return;
          }
          if (!results || !results[0] || !results[0].result) {
            lsList.innerHTML =
              '<div class="settings-empty">No localStorage items on this site.</div>';
            ssList.innerHTML =
              '<div class="settings-empty">No sessionStorage items on this site.</div>';
            return;
          }

          const storage = results[0].result;
          const lsData = storage.localStorage || {};
          const ssData = storage.sessionStorage || {};

          loadSelectedStorage("LS", (selLS) => {
            renderStorageList(lsList, "LS", lsData, selLS);
          });
          loadSelectedStorage("SS", (selSS) => {
            renderStorageList(ssList, "SS", ssData, selSS);
          });
        },
      );
    } catch (e) {
      lsList.innerHTML = `<div class="settings-empty">Error: ${e.message}</div>`;
      ssList.innerHTML = `<div class="settings-empty">Error: ${e.message}</div>`;
    }
  });
}

/* ---------- Cache ---------- */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function updateCacheSize() {
  chrome.storage.local.get(null, (items) => {
    const bytes = new Blob([JSON.stringify(items)]).size;
    cacheSizeEl.textContent = formatBytes(bytes);
  });
}

function toggleSettingsPanel() {
  const isOpen = settingsPanel.classList.toggle("show");
  if (isOpen) {
    refreshCookieList();
    refreshStorageLists();
    updateCacheSize();
    chrome.storage.local.get(["autoRefresh"], (result) => {
      autoRefreshToggle.checked = result.autoRefresh === true;
    });
  }
}

/* ---------- Clipboard text builder ---------- */
function buildClipboardText(storedCookies) {
  const entries = Object.entries(storedCookies);
  if (entries.length === 0) return "";
  return entries.map(([name, value]) => `${name}\n${value}`).join("\n\n");
}

/* ============================================================
   COOKIES TAB — Copy / Paste / View (multi-storage)
   ============================================================ */

/* Capture localStorage + sessionStorage from active tab */
function captureStorage(tab, callback) {
  if (!chrome.scripting) {
    console.error("chrome.scripting not available");
    callback({
      localStorage: {},
      sessionStorage: {},
      _error: "scripting API not available",
    });
    return;
  }
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => {
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
      },
    },
    (results) => {
      if (chrome.runtime.lastError) {
        console.error(
          "captureStorage error:",
          chrome.runtime.lastError.message,
        );
        callback({
          localStorage: {},
          sessionStorage: {},
          _error: chrome.runtime.lastError.message,
        });
      } else if (!results || !results[0]) {
        callback({
          localStorage: {},
          sessionStorage: {},
          _error: "No results",
        });
      } else {
        callback(results[0].result || { localStorage: {}, sessionStorage: {} });
      }
    },
  );
}

/* Inject localStorage + sessionStorage into active tab */
function injectStorage(tab, lsData, ssData, callback) {
  if (!chrome.scripting) {
    console.error("injectStorage: chrome.scripting not available");
    callback({ lsCount: 0, ssCount: 0, _error: "scripting API not available" });
    return;
  }
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: (ls, ss) => {
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
      args: [lsData || {}, ssData || {}],
    },
    (results) => {
      if (chrome.runtime.lastError) {
        console.error("injectStorage error:", chrome.runtime.lastError.message);
        callback({
          lsCount: 0,
          ssCount: 0,
          _error: chrome.runtime.lastError.message,
        });
      } else if (!results || !results[0]) {
        callback({ lsCount: 0, ssCount: 0, _error: "No results" });
      } else {
        callback(results[0].result || { lsCount: 0, ssCount: 0 });
      }
    },
  );
}

copyBtn.addEventListener("click", () => {
  hideTokenBox();
  getCurrentTab((tab) => {
    if (!tab || !tab.url) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }
    const url = tab.url;
    loadSelectedCookies((selectedCookies) => {
      loadSelectedStorage("LS", (selectedLS) => {
        loadSelectedStorage("SS", (selectedSS) => {
          if (
            selectedCookies.length === 0 &&
            selectedLS.length === 0 &&
            selectedSS.length === 0
          ) {
            showStatus(
              "Nothing selected. Open settings to select cookies, localStorage, or sessionStorage.",
              "error",
            );
            return;
          }

          chrome.cookies.getAll({ url }, (cookies) => {
            const storedCookies = {};
            selectedCookies.forEach((name) => {
              const match = cookies.find((c) => c.name === name);
              if (match) storedCookies[name] = match.value;
            });

            captureStorage(tab, (storage) => {
              /* check if capture failed */
              if (storage._error) {
                showStatus(
                  `⚠️ Cookie copy OK, but storage capture failed: ${storage._error}. Remove & re-add extension to get scripting permission.`,
                  "error",
                );
                return;
              }

              /* filter LS/SS to only selected keys */
              const filteredLS = {};
              selectedLS.forEach((key) => {
                if (storage.localStorage[key] !== undefined) {
                  filteredLS[key] = storage.localStorage[key];
                }
              });
              const filteredSS = {};
              selectedSS.forEach((key) => {
                if (storage.sessionStorage[key] !== undefined) {
                  filteredSS[key] = storage.sessionStorage[key];
                }
              });

              const storedData = {
                cookies: storedCookies,
                localStorage: filteredLS,
                sessionStorage: filteredSS,
              };
              const clipText = buildClipboardText(storedCookies);
              chrome.storage.local.set({ storedCookies, storedData }, () => {
                const parts = [];
                const ck = Object.keys(storedCookies).length;
                const lk = Object.keys(filteredLS).length;
                const sk = Object.keys(filteredSS).length;
                if (ck > 0) parts.push(`${ck} cookie${ck > 1 ? "s" : ""}`);
                if (lk > 0)
                  parts.push(`${lk} localStorage item${lk > 1 ? "s" : ""}`);
                if (sk > 0)
                  parts.push(`${sk} sessionStorage item${sk > 1 ? "s" : ""}`);
                showStatus(`✅ Copied: ${parts.join(", ")}`, "success");
              });
              copyToClipboard(clipText).catch(() => {});
            });
          });
        });
      });
    });
  });
});

pasteBtn.addEventListener("click", () => {
  hideTokenBox();
  chrome.storage.local.get(["storedData", "storedCookies"], (result) => {
    const storedData = result.storedData || {
      cookies: result.storedCookies || {},
    };
    const storedCookies = storedData.cookies || {};
    const storedLS = storedData.localStorage || {};
    const storedSS = storedData.sessionStorage || {};
    const storedNames = Object.keys(storedCookies);
    const lsNames = Object.keys(storedLS);
    const ssNames = Object.keys(storedSS);

    if (
      storedNames.length === 0 &&
      lsNames.length === 0 &&
      ssNames.length === 0
    ) {
      showStatus("No stored data found. Copy from a site first.", "error");
      return;
    }

    getCurrentTab((tab) => {
      if (!tab || !tab.url) {
        showStatus("Could not detect the active tab.", "error");
        return;
      }
      const domain = getDomainFromUrl(tab.url);
      if (!domain) {
        showStatus("Could not parse the current tab URL.", "error");
        return;
      }
      const origin = getOriginFromUrl(tab.url);

      let cookieDone = 0;
      let cookieFailed = 0;
      const failedNames = [];

      function finishCookies() {
        /* Now inject localStorage + sessionStorage */
        injectStorage(tab, storedLS, storedSS, (counts) => {
          const parts = [];
          if (storedNames.length > 0)
            parts.push(`${cookieDone} cookie${cookieDone !== 1 ? "s" : ""}`);
          if (counts.lsCount > 0) parts.push(`${counts.lsCount} localStorage`);
          if (counts.ssCount > 0)
            parts.push(`${counts.ssCount} sessionStorage`);
          if (cookieFailed > 0) {
            showStatus(
              `Pasted ${parts.join(", ")}. Failed cookies: ${failedNames.join(", ")}`,
              "error",
            );
          } else {
            showStatus(
              `✅ Pasted to ${domain}: ${parts.join(", ")}`,
              "success",
            );
          }
          chrome.storage.local.get(["autoRefresh"], (r) => {
            if (r.autoRefresh === true) chrome.tabs.reload(tab.id);
          });
        });
      }

      if (storedNames.length === 0) {
        finishCookies();
        return;
      }

      storedNames.forEach((name) => {
        chrome.cookies.set(
          { url: origin, name, value: storedCookies[name], path: "/" },
          (cookie) => {
            if (chrome.runtime.lastError || !cookie) {
              cookieFailed++;
              failedNames.push(name);
            } else {
              cookieDone++;
            }
            if (cookieDone + cookieFailed === storedNames.length)
              finishCookies();
          },
        );
      });
    });
  });
});

/* ---------- View Stored Data (sub-tabs) ---------- */
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
    container.appendChild(card);
  });
  return container;
}

viewBtn.addEventListener("click", () => {
  if (tokenBox.classList.contains("show")) {
    tokenBox.classList.remove("show");
    tokenValue.innerHTML = "";
    return;
  }
  statusEl.className = "status";
  statusEl.textContent = "";
  chrome.storage.local.get(["storedData", "storedCookies"], (result) => {
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

    /* Build sub-tab bar */
    tokenValue.innerHTML = "";

    const subBar = document.createElement("div");
    subBar.className = "subtab-bar";

    const tabs = [
      {
        id: "view-cookies",
        label: `🍪 Cookies (${ck})`,
        data: storedData.cookies,
      },
      {
        id: "view-local",
        label: `💾 Local (${lk})`,
        data: storedData.localStorage,
      },
      {
        id: "view-session",
        label: `📦 Session (${sk})`,
        data: storedData.sessionStorage,
      },
    ];

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

    const panels = tabs.map((t) => {
      const panel = document.createElement("div");
      panel.className = "subtab-panel" + (t === tabs[0] ? " active" : "");
      panel.appendChild(buildStorageCards(t.data));
      return panel;
    });

    tokenValue.appendChild(subBar);
    panels.forEach((p) => tokenValue.appendChild(p));
    tokenBox.classList.add("show");
  });
});

/* ============================================================
   COOKIES TAB — Copy Shareable / Feed Data
   ============================================================ */
/* ---------- Shareable encode/decode (with gzip) ---------- */

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

  /* Try gzip compression if available */
  if (typeof CompressionStream !== "undefined") {
    try {
      const gzipped = await gzipBytes(bytes);
      const b64 = bytesToBase64(gzipped);
      /* Only use gzip if it's actually smaller */
      const uncompressedB64 = bytesToBase64(bytes);
      if (b64.length < uncompressedB64.length) {
        return { text: "TH1G:" + b64, size: b64.length + 5 };
      }
      return {
        text: "TH1:" + uncompressedB64,
        size: uncompressedB64.length + 4,
      };
    } catch (e) {
      /* fall through to uncompressed */
    }
  }

  const b64 = bytesToBase64(bytes);
  return { text: "TH1:" + b64, size: b64.length + 4 };
}

async function decodeShareable(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("TH1G:") && !trimmed.startsWith("TH1:")) {
    throw new Error("Invalid format — must start with TH1: or TH1G:");
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

copyShareableBtn.addEventListener("click", () => {
  hideTokenBox();
  getCurrentTab((tab) => {
    if (!tab || !tab.url) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }
    const url = tab.url;
    loadSelectedCookies((selectedCookies) => {
      loadSelectedStorage("LS", (selectedLS) => {
        loadSelectedStorage("SS", (selectedSS) => {
          if (
            selectedCookies.length === 0 &&
            selectedLS.length === 0 &&
            selectedSS.length === 0
          ) {
            showStatus(
              "Nothing selected. Open settings to select cookies, localStorage, or sessionStorage.",
              "error",
            );
            return;
          }

          chrome.cookies.getAll({ url }, (cookies) => {
            const storedCookies = {};
            selectedCookies.forEach((name) => {
              const match = cookies.find((c) => c.name === name);
              if (match) storedCookies[name] = match.value;
            });

            captureStorage(tab, (storage) => {
              if (storage._error) {
                showStatus(
                  `⚠️ Cookies captured, but storage capture failed: ${storage._error}. Remove & re-add extension.`,
                  "error",
                );
                return;
              }

              const filteredLS = {};
              selectedLS.forEach((key) => {
                if (storage.localStorage[key] !== undefined) {
                  filteredLS[key] = storage.localStorage[key];
                }
              });
              const filteredSS = {};
              selectedSS.forEach((key) => {
                if (storage.sessionStorage[key] !== undefined) {
                  filteredSS[key] = storage.sessionStorage[key];
                }
              });

              const shareData = {
                cookies: storedCookies,
                localStorage: filteredLS,
                sessionStorage: filteredSS,
              };

              const ck = Object.keys(storedCookies).length;
              const lk = Object.keys(filteredLS).length;
              const sk = Object.keys(filteredSS).length;

              if (ck === 0 && lk === 0 && sk === 0) {
                showStatus(
                  "No matching data found on this site. Check your selection.",
                  "error",
                );
                return;
              }

              encodeShareable(shareData).then((shareable) => {
                copyToClipboard(shareable.text)
                  .then(() => {
                    const parts = [];
                    if (ck > 0) parts.push(`${ck} cookie${ck > 1 ? "s" : ""}`);
                    if (lk > 0) parts.push(`${lk} localStorage`);
                    if (sk > 0) parts.push(`${sk} sessionStorage`);
                    const sizeStr =
                      shareable.size > 1000
                        ? `${(shareable.size / 1000).toFixed(1)}K chars`
                        : `${shareable.size} chars`;
                    const prefix = shareable.text.startsWith("TH1G:")
                      ? " (gzipped)"
                      : "";
                    showStatus(
                      `✅ Shareable copied (${parts.join(", ")}) — ${sizeStr}${prefix}`,
                      "success",
                    );
                  })
                  .catch(() => {
                    showStatus("❌ Failed to copy shareable string.", "error");
                  });
              });
            });
          });
        });
      });
    });
  });
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
    showStatus(`❌ ${err.message}`, "error");
    return;
  }

  const ck = Object.keys(data.cookies).length;
  const lk = Object.keys(data.localStorage).length;
  const sk = Object.keys(data.sessionStorage).length;

  if (ck === 0 && lk === 0 && sk === 0) {
    showStatus("Shared data is empty.", "error");
    return;
  }

  /* Show what was decoded before applying */
  const decodedParts = [];
  if (ck > 0) decodedParts.push(`${ck} cookie${ck > 1 ? "s" : ""}`);
  if (lk > 0) decodedParts.push(`${lk} localStorage`);
  if (sk > 0) decodedParts.push(`${sk} sessionStorage`);
  showStatus(`Decoded: ${decodedParts.join(", ")}. Applying...`, "info");

  /* Save as storedData then trigger paste flow */
  chrome.storage.local.set(
    { storedData: data, storedCookies: data.cookies },
    () => {
      feedSection.classList.remove("show");
      feedInput.value = "";

      /* Run the paste */
      getCurrentTab((tab) => {
        if (!tab || !tab.url) {
          showStatus("Could not detect the active tab.", "error");
          return;
        }
        const domain = getDomainFromUrl(tab.url);
        const origin = getOriginFromUrl(tab.url);
        const storedNames = Object.keys(data.cookies);
        let cookieDone = 0;
        let cookieFailed = 0;
        const failedNames = [];

        function finishCookies() {
          injectStorage(
            tab,
            data.localStorage,
            data.sessionStorage,
            (counts) => {
              const parts = [];
              if (storedNames.length > 0)
                parts.push(
                  `${cookieDone} cookie${cookieDone !== 1 ? "s" : ""}`,
                );
              if (counts.lsCount > 0)
                parts.push(`${counts.lsCount} localStorage`);
              if (counts.ssCount > 0)
                parts.push(`${counts.ssCount} sessionStorage`);

              /* Check if inject failed */
              if (counts._error) {
                const expectedParts = [];
                if (storedNames.length > 0)
                  expectedParts.push(`${cookieDone} cookies`);
                if (Object.keys(data.localStorage).length > 0)
                  expectedParts.push(
                    `${Object.keys(data.localStorage).length} localStorage`,
                  );
                if (Object.keys(data.sessionStorage).length > 0)
                  expectedParts.push(
                    `${Object.keys(data.sessionStorage).length} sessionStorage`,
                  );
                showStatus(
                  `⚠️ Cookies fed, but storage inject failed: ${counts._error}. Expected: ${expectedParts.join(", ")}. Remove & re-add extension to fix scripting permission.`,
                  "error",
                );
              } else if (cookieFailed > 0) {
                showStatus(
                  `Fed ${parts.join(", ")}. Failed: ${failedNames.join(", ")}`,
                  "error",
                );
              } else {
                showStatus(
                  `✅ Fed ${parts.join(", ")} to ${domain}`,
                  "success",
                );
              }
              chrome.storage.local.get(["autoRefresh"], (r) => {
                if (r.autoRefresh === true) chrome.tabs.reload(tab.id);
              });
            },
          );
        }

        if (storedNames.length === 0) {
          finishCookies();
          return;
        }

        storedNames.forEach((name) => {
          chrome.cookies.set(
            { url: origin, name, value: data.cookies[name], path: "/" },
            (cookie) => {
              if (chrome.runtime.lastError || !cookie) {
                cookieFailed++;
                failedNames.push(name);
              } else {
                cookieDone++;
              }
              if (cookieDone + cookieFailed === storedNames.length)
                finishCookies();
            },
          );
        });
      });
    },
  );
});

/* ============================================================
   DEV TOOLS TAB — Clear Cookies / Local / Session / Nuke
   ============================================================ */
clearCookiesBtn.addEventListener("click", () => {
  getCurrentTab((tab) => {
    if (!tab || !tab.url) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }
    chrome.cookies.getAll({ url: tab.url }, (cookies) => {
      if (cookies.length === 0) {
        showStatus("No cookies to clear.", "info");
        return;
      }
      let done = 0;
      cookies.forEach((c) => {
        chrome.cookies.remove({ url: tab.url, name: c.name }, () => {
          done++;
          if (done === cookies.length) {
            showStatus(`🗑️ Cleared ${cookies.length} cookies`, "success");
          }
        });
      });
    });
  });
});

clearLocalBtn.addEventListener("click", () => {
  getCurrentTab((tab) => {
    if (!tab || !tab.id) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          localStorage.clear();
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          showStatus("❌ Failed to clear localStorage.", "error");
        } else {
          showStatus("🗑️ Cleared localStorage", "success");
        }
      },
    );
  });
});

clearSessionBtn.addEventListener("click", () => {
  getCurrentTab((tab) => {
    if (!tab || !tab.id) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          sessionStorage.clear();
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          showStatus("❌ Failed to clear sessionStorage.", "error");
        } else {
          showStatus("🗑️ Cleared sessionStorage", "success");
        }
      },
    );
  });
});

nukeBtn.addEventListener("click", () => {
  getCurrentTab((tab) => {
    if (!tab || !tab.url) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }

    /* Clear cookies */
    chrome.cookies.getAll({ url: tab.url }, (cookies) => {
      let cookieDone = 0;
      if (cookies.length === 0) {
        runStorageClear();
        return;
      }
      cookies.forEach((c) => {
        chrome.cookies.remove({ url: tab.url, name: c.name }, () => {
          cookieDone++;
          if (cookieDone === cookies.length) runStorageClear();
        });
      });
    });

    function runStorageClear() {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            localStorage.clear();
            sessionStorage.clear();
          },
        },
        () => {
          if (chrome.runtime.lastError) {
            showStatus(
              "⚠️ Cookies cleared, but storage clear failed.",
              "error",
            );
          } else {
            showStatus("💥 Nuked all site data!", "success");
          }
        },
      );
    }
  });
});

/* ============================================================
   PROFILES TAB — Save / Load / Delete
   ============================================================ */
function renderProfiles() {
  chrome.storage.local.get(["profiles"], (result) => {
    const profiles = result.profiles || {};
    const names = Object.keys(profiles);

    profileList.innerHTML = "";
    if (names.length === 0) {
      profileList.innerHTML =
        '<div class="empty-state">No saved profiles. Copy data then save a profile.</div>';
      return;
    }

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
      loadBtn.addEventListener("click", () => {
        const profile = profiles[name];
        const cookies = profile.cookies || profile;
        const lsData = profile.localStorage || {};
        const ssData = profile.sessionStorage || {};
        getCurrentTab((tab) => {
          if (!tab || !tab.url) {
            showStatus("Could not detect the active tab.", "error");
            return;
          }
          const origin = getOriginFromUrl(tab.url);
          const cookieNames = Object.keys(cookies);
          let completed = 0;
          let failed = 0;

          function finishCookies() {
            injectStorage(tab, lsData, ssData, (counts) => {
              const parts = [];
              if (cookieNames.length > 0) parts.push(`${completed} cookies`);
              if (counts.lsCount > 0)
                parts.push(`${counts.lsCount} localStorage`);
              if (counts.ssCount > 0)
                parts.push(`${counts.ssCount} sessionStorage`);
              showStatus(
                `✅ Loaded profile "${name}" (${parts.join(", ")})`,
                failed > 0 ? "error" : "success",
              );
            });
          }

          if (cookieNames.length === 0) {
            finishCookies();
            return;
          }
          cookieNames.forEach((cn) => {
            chrome.cookies.set(
              { url: origin, name: cn, value: cookies[cn], path: "/" },
              (cookie) => {
                if (chrome.runtime.lastError || !cookie) failed++;
                else completed++;
                if (completed + failed === cookieNames.length) finishCookies();
              },
            );
          });
        });
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-small";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        delete profiles[name];
        chrome.storage.local.set({ profiles }, () => {
          showStatus(`🗑️ Deleted profile "${name}"`, "success");
          renderProfiles();
        });
      });

      actions.appendChild(loadBtn);
      actions.appendChild(delBtn);
      item.appendChild(nameEl);
      item.appendChild(actions);
      profileList.appendChild(item);
    });
  });
}

saveProfileBtn.addEventListener("click", () => {
  const name = profileNameInput.value.trim();
  if (!name) {
    showStatus("Enter a profile name.", "error");
    return;
  }
  chrome.storage.local.get(
    ["storedData", "storedCookies", "profiles"],
    (result) => {
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
      chrome.storage.local.set({ profiles }, () => {
        const parts = [];
        if (ck > 0) parts.push(`${ck} cookies`);
        if (lk > 0) parts.push(`${lk} localStorage`);
        if (sk > 0) parts.push(`${sk} sessionStorage`);
        showStatus(
          `✅ Saved profile "${name}" (${parts.join(", ")})`,
          "success",
        );
        profileNameInput.value = "";
        renderProfiles();
      });
    },
  );
});

profileNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveProfileBtn.click();
});

/* ============================================================
   Settings + Options
   ============================================================ */
settingsBtn.addEventListener("click", toggleSettingsPanel);

autoRefreshToggle.addEventListener("change", () => {
  chrome.storage.local.set({ autoRefresh: autoRefreshToggle.checked });
});

clearCacheBtn.addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    showStatus("🗑️ Extension cache cleared!", "success");
    hideTokenBox();
    updateCacheSize();
    renderProfiles();
  });
});

/* ============================================================
   SESSION TAB — JWT Expiry Timer
   ============================================================ */
function decodeJWTPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payloadB64 = parts[1];
    /* base64url → base64 */
    payloadB64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    /* pad */
    while (payloadB64.length % 4) payloadB64 += "=";
    const json = atob(payloadB64);
    const bytes = new Uint8Array(json.length);
    for (let i = 0; i < json.length; i++) bytes[i] = json.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    return null;
  }
}

function findJWTs(callback) {
  getCurrentTab((tab) => {
    if (!tab || !tab.url) {
      callback([]);
      return;
    }
    chrome.cookies.getAll({ url: tab.url }, (cookies) => {
      const jwts = [];
      cookies.forEach((c) => {
        const val = c.value || "";
        if (val.startsWith("eyJ") && val.split(".").length >= 2) {
          const payload = decodeJWTPayload(val);
          if (payload && payload.exp) {
            jwts.push({
              name: c.name,
              value: val,
              exp: payload.exp,
              source: "cookie",
              payload,
            });
          }
        }
      });

      /* Also check localStorage + sessionStorage */
      captureStorage(tab, (storage) => {
        Object.entries(storage.localStorage || {}).forEach(([k, v]) => {
          const val = String(v || "");
          if (val.startsWith("eyJ") && val.split(".").length >= 2) {
            const payload = decodeJWTPayload(val);
            if (payload && payload.exp) {
              jwts.push({
                name: k,
                value: val,
                exp: payload.exp,
                source: "localStorage",
                payload,
              });
            }
          }
        });
        Object.entries(storage.sessionStorage || {}).forEach(([k, v]) => {
          const val = String(v || "");
          if (val.startsWith("eyJ") && val.split(".").length >= 2) {
            const payload = decodeJWTPayload(val);
            if (payload && payload.exp) {
              jwts.push({
                name: k,
                value: val,
                exp: payload.exp,
                source: "sessionStorage",
                payload,
              });
            }
          }
        });
        callback(jwts);
      });
    });
  });
}

function formatCountdown(ms) {
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

let sessionTimerInterval = null;

function renderSession() {
  findJWTs((jwts) => {
    if (jwts.length === 0) {
      sessionContent.innerHTML =
        '<div class="session-empty">No JWT tokens found in cookies or storage on this page.</div>';
      return;
    }

    sessionContent.innerHTML = "";
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
      sessionContent.appendChild(card);
    });

    /* Start ticking */
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    updateSessionCountdowns();
    sessionTimerInterval = setInterval(updateSessionCountdowns, 1000);
  });
}

function updateSessionCountdowns() {
  const now = Date.now();
  const cards = sessionContent.querySelectorAll(".session-countdown");
  if (cards.length === 0) {
    if (sessionTimerInterval) {
      clearInterval(sessionTimerInterval);
      sessionTimerInterval = null;
    }
    return;
  }
  cards.forEach((card) => {
    const exp = parseInt(card.dataset.exp, 10) * 1000;
    const remaining = exp - now;
    card.textContent = formatCountdown(remaining);
    card.classList.remove("safe", "warning", "danger", "expired");
    if (remaining <= 0) {
      card.classList.add("expired");
    } else if (remaining < 60000) {
      card.classList.add("danger");
    } else if (remaining < 600000) {
      card.classList.add("warning");
    } else {
      card.classList.add("safe");
    }
  });
}

/* ============================================================
   Init
   ============================================================ */
initTheme();
renderProfiles();
