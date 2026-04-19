/* Claude Themes — content script.
 * Runs at document_start on claude.ai. Resolves the active theme based on
 * URL (per-project binding > default), applies data-phosphor to <html>,
 * listens for storage changes, and polls for SPA navigation since
 * claude.ai transitions via pushState without a full reload.
 *
 * Storage shape (v0.3+):
 *   { default: "amber", perProject: { "<project-id>": "cga", ... } }
 * Legacy (v0.2 and earlier) read once on upgrade:
 *   { phosphor: "amber" }
 */

(function () {
  "use strict";

  const FALLBACK = "amber";
  const VALID = new Set(["amber", "green", "white", "cga", "crt", "synthwave"]);
  const POLL_MS = 500;

  let cachedDefault = FALLBACK;
  let cachedPerProject = {};
  let lastAppliedVariant = null;
  let lastPath = "";

  function projectIdFromPath(pathname) {
    const m = (pathname || "").match(/^\/projects?\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  function resolveVariant() {
    const id = projectIdFromPath(location.pathname);
    if (id && Object.prototype.hasOwnProperty.call(cachedPerProject, id)) {
      const v = cachedPerProject[id];
      if (VALID.has(v)) return v;
    }
    return VALID.has(cachedDefault) ? cachedDefault : FALLBACK;
  }

  function applyVariant(variant) {
    if (variant === lastAppliedVariant) return;
    lastAppliedVariant = variant;
    document.documentElement.dataset.phosphor = variant;
    const bar = document.getElementById("dos-status-bar");
    if (bar) bar.dataset.variant = variant.toUpperCase();
  }

  function reapply() {
    applyVariant(resolveVariant());
  }

  function loadStorage(cb) {
    chrome.storage.sync.get(
      { default: null, perProject: {}, phosphor: null },
      (res) => {
        if (res.default == null && res.phosphor != null) {
          // Legacy one-shot migration.
          cachedDefault = res.phosphor;
          chrome.storage.sync.set({
            default: res.phosphor,
            perProject: {},
          });
          chrome.storage.sync.remove("phosphor");
        } else {
          cachedDefault = res.default || FALLBACK;
        }
        cachedPerProject = res.perProject || {};
        if (cb) cb();
      }
    );
  }

  function injectStatusBar() {
    if (!document.body) return;
    if (document.getElementById("dos-status-bar")) return;
    const bar = document.createElement("div");
    bar.id = "dos-status-bar";
    bar.className = "dos-status-bar";
    bar.dataset.variant = (lastAppliedVariant || FALLBACK).toUpperCase();
    document.body.appendChild(bar);
  }

  function startNavigationPoll() {
    lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        reapply();
      }
    }, POLL_MS);
  }

  loadStorage(() => {
    reapply();
    startNavigationPoll();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.default) cachedDefault = changes.default.newValue || FALLBACK;
    if (changes.perProject) cachedPerProject = changes.perProject.newValue || {};
    reapply();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStatusBar, { once: true });
  } else {
    injectStatusBar();
  }
})();
