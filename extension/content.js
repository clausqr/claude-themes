/* Claude MS-DOS 3.3 — content script.
 * Runs at document_start on claude.ai. Reads the chosen phosphor variant
 * from chrome.storage.sync, applies data-phosphor to <html>, listens for
 * changes, and injects the fake status bar when the DOM is ready.
 *
 * Firefox-compatible: chrome.storage works across Chromium and Gecko MV3. */

(function () {
  "use strict";

  const DEFAULT_VARIANT = "amber";
  const VALID = new Set(["amber", "green", "white", "cga"]);

  function applyVariant(variant) {
    const v = VALID.has(variant) ? variant : DEFAULT_VARIANT;
    document.documentElement.dataset.phosphor = v;
    updateStatusBar(v);
  }

  function updateStatusBar(variant) {
    const bar = document.getElementById("dos-status-bar");
    if (bar) bar.dataset.variant = variant.toUpperCase();
  }

  function injectStatusBar(variant) {
    if (document.getElementById("dos-status-bar")) return;
    if (!document.body) return;
    const bar = document.createElement("div");
    bar.id = "dos-status-bar";
    bar.className = "dos-status-bar";
    bar.dataset.variant = (variant || DEFAULT_VARIANT).toUpperCase();
    document.body.appendChild(bar);
  }

  // Apply variant as early as possible (document_start) so the first paint
  // is already themed rather than flashing the stock palette.
  chrome.storage.sync.get({ phosphor: DEFAULT_VARIANT }, (res) => {
    applyVariant(res.phosphor);
  });

  // React to changes from the popup.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.phosphor) applyVariant(changes.phosphor.newValue);
  });

  // Status bar needs <body>. Inject as soon as it's available.
  const tryInject = () => {
    chrome.storage.sync.get({ phosphor: DEFAULT_VARIANT }, (res) => {
      injectStatusBar(res.phosphor);
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInject, { once: true });
  } else {
    tryInject();
  }
})();
