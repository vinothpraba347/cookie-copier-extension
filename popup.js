const copyBtn = document.getElementById("copyBtn");
const pasteBtn = document.getElementById("pasteBtn");
const viewBtn = document.getElementById("viewBtn");
const settingsBtn = document.getElementById("settingsBtn");
const themeBtn = document.getElementById("themeBtn");
const settingsPanel = document.getElementById("settingsPanel");
const cookieList = document.getElementById("cookieList");
const statusEl = document.getElementById("status");
const tokenBox = document.getElementById("tokenBox");
const tokenValue = document.getElementById("tokenValue");

const autoRefreshToggle = document.getElementById("autoRefreshToggle");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const cacheSizeEl = document.getElementById("cacheSize");

const DEFAULT_SELECTED_COOKIES = [];

function showStatus(message, type) {
  statusEl.innerHTML = message.replace(/\n/g, "<br>");
  statusEl.className = `status show ${type}`;
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
  return new Promise((resolve) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (err) {
      /* clipboard API already copied — ignore */
    }
    resolve();
  });
}

const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1"></path></svg>';
const CHECK_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

const MOON_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

const SUN_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.innerHTML = theme === "dark" ? MOON_ICON_SVG : SUN_ICON_SVG;
}

function initTheme() {
  chrome.storage.local.get(["theme"], (result) => {
    const theme = result.theme === "light" ? "light" : "dark";
    applyTheme(theme);
  });
}

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
});

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

function getCurrentDomain(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url) {
      callback(getDomainFromUrl(tab.url));
    } else {
      callback(null);
    }
  });
}

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

  uniqueNames.forEach((name) => {
    const isChecked = selected.includes(name);
    const value = cookieByName[name] || "";

    const row = document.createElement("div");
    row.className = "cookie-toggle";

    const label = document.createElement("span");
    label.textContent = name;

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-icon";
    copyBtn.type = "button";
    copyBtn.title = `Copy ${name} value`;
    copyBtn.setAttribute("aria-label", `Copy ${name} value`);
    copyBtn.innerHTML = COPY_ICON_SVG;
    copyBtn.addEventListener("click", () => {
      if (!value) {
        showStatus(`⚠️ No value for ${name}.`, "error");
        return;
      }
      copyToClipboard(value)
        .then(() => {
          showStatus(`✅ Copied ${name}`, "success");
          copyBtn.classList.add("copied");
          copyBtn.innerHTML = CHECK_ICON_SVG;
          setTimeout(() => {
            copyBtn.classList.remove("copied");
            copyBtn.innerHTML = COPY_ICON_SVG;
          }, 1200);
        })
        .catch(() => {
          showStatus(`❌ Failed to copy ${name}.`, "error");
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
      });
    });

    const slider = document.createElement("span");
    slider.className = "slider";

    switchLabel.appendChild(input);
    switchLabel.appendChild(slider);
    row.appendChild(label);
    row.appendChild(switchLabel);
    row.appendChild(copyBtn);
    cookieList.appendChild(row);
  });
}

function refreshCookieList() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
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
    updateCacheSize();
    chrome.storage.local.get(["autoRefresh"], (result) => {
      autoRefreshToggle.checked = result.autoRefresh === true;
    });
  }
}

function buildStoredCookiesText(storedCookies) {
  const entries = Object.entries(storedCookies);
  if (entries.length === 0) return "";
  return entries.map(([name, value]) => `${name}=${value}`).join("\n");
}

function buildClipboardText(storedCookies) {
  const entries = Object.entries(storedCookies);
  if (entries.length === 0) return "";
  return entries.map(([name, value]) => `${name}\n${value}`).join("\n\n");
}

copyBtn.addEventListener("click", () => {
  hideTokenBox();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      showStatus("Could not detect the active tab.", "error");
      return;
    }

    const url = tab.url;

    loadSelectedCookies((selected) => {
      if (selected.length === 0) {
        showStatus(
          "No cookies selected. Open settings to select cookies.",
          "error",
        );
        return;
      }

      chrome.cookies.getAll({ url }, (cookies) => {
        const storedCookies = {};

        selected.forEach((name) => {
          const match = cookies.find((c) => c.name === name);
          if (match) {
            storedCookies[name] = match.value;
          }
        });

        if (Object.keys(storedCookies).length === 0) {
          showStatus(
            "None of the selected cookies were found on this site.",
            "error",
          );
          return;
        }

        const clipText = buildClipboardText(storedCookies);

        chrome.storage.local.set({ storedCookies }, () => {
          const copiedNames = Object.keys(storedCookies).join(", ");
          showStatus(`✅ Copied: ${copiedNames}`, "success");
        });

        copyToClipboard(clipText).catch(() => {});
      });
    });
  });
});

pasteBtn.addEventListener("click", () => {
  hideTokenBox();
  chrome.storage.local.get(["storedCookies"], (result) => {
    const storedCookies = result.storedCookies || {};
    const storedNames = Object.keys(storedCookies);

    if (storedNames.length === 0) {
      showStatus("No stored cookies found. Copy cookies first.", "error");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) {
        showStatus("Could not detect the active tab.", "error");
        return;
      }

      const url = tab.url;
      const domain = getDomainFromUrl(url);

      if (!domain) {
        showStatus("Could not parse the current tab URL.", "error");
        return;
      }

      const origin = getOriginFromUrl(url);
      let completed = 0;
      let failed = 0;
      const failedNames = [];

      function checkDone() {
        if (completed + failed < storedNames.length) return;

        if (failed === 0) {
          showStatus(
            `✅ Pasted ${storedNames.length} cookie(s) to ${domain} successfully!`,
            "success",
          );
          chrome.storage.local.get(["autoRefresh"], (r) => {
            if (r.autoRefresh === true) {
              chrome.tabs.reload(tab.id);
            }
          });
        } else {
          showStatus(
            `Pasted ${completed} cookie(s). Failed: ${failedNames.join(", ")}`,
            "error",
          );
        }
      }

      storedNames.forEach((name) => {
        chrome.cookies.set(
          {
            url: origin,
            name,
            value: storedCookies[name],
            path: "/",
          },
          (cookie) => {
            if (chrome.runtime.lastError || !cookie) {
              failed++;
              failedNames.push(name);
            } else {
              completed++;
            }
            checkDone();
          },
        );
      });
    });
  });
});

viewBtn.addEventListener("click", () => {
  /* toggle: if already open, close it */
  if (tokenBox.classList.contains("show")) {
    tokenBox.classList.remove("show");
    tokenValue.innerHTML = "";
    return;
  }

  statusEl.className = "status";
  statusEl.textContent = "";

  chrome.storage.local.get(["storedCookies"], (result) => {
    const storedCookies = result.storedCookies || {};
    const storedNames = Object.keys(storedCookies);

    if (storedNames.length === 0) {
      tokenBox.classList.remove("show");
      showStatus("No stored cookies found. Copy cookies first.", "info");
      return;
    }

    tokenValue.innerHTML = "";
    Object.entries(storedCookies).forEach(([name, value]) => {
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
      tokenValue.appendChild(card);
    });
    tokenBox.classList.add("show");
  });
});

settingsBtn.addEventListener("click", toggleSettingsPanel);

autoRefreshToggle.addEventListener("change", () => {
  chrome.storage.local.set({ autoRefresh: autoRefreshToggle.checked });
});

clearCacheBtn.addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    showStatus("🗑️ Extension cache cleared!", "success");
    hideTokenBox();
    updateCacheSize();
  });
});

/* ---------- Init ---------- */
initTheme();
