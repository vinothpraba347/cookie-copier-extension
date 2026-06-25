const copyBtn = document.getElementById("copyBtn");
const pasteBtn = document.getElementById("pasteBtn");
const viewBtn = document.getElementById("viewBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const cookieList = document.getElementById("cookieList");
const statusEl = document.getElementById("status");
const tokenBox = document.getElementById("tokenBox");
const tokenValue = document.getElementById("tokenValue");

const autoRefreshToggle = document.getElementById("autoRefreshToggle");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const cacheSizeEl = document.getElementById("cacheSize");

const DEFAULT_SELECTED_COOKIES = ["access_token"];

function showStatus(message, type) {
  statusEl.innerHTML = message.replace(/\n/g, "<br>");
  statusEl.className = `status show ${type}`;
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

  uniqueNames.forEach((name) => {
    const isChecked = selected.includes(name);

    const row = document.createElement("div");
    row.className = "cookie-toggle";

    const label = document.createElement("span");
    label.textContent = name;

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
        const missing = [];

        selected.forEach((name) => {
          const match = cookies.find((c) => c.name === name);
          if (match) {
            storedCookies[name] = match.value;
          } else {
            missing.push(name);
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
          let message = `✅ Copied: ${copiedNames}`;
          if (missing.length > 0) {
            message += `\n⚠️ Not found: ${missing.join(", ")}`;
          }
          showStatus(message, "success");
        });

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(clipText).catch(() => {});
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = clipText;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
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

    tokenValue.textContent = buildStoredCookiesText(storedCookies);
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
