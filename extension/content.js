/* Claude Themes — content script.
 * Runs at document_start on claude.ai. Resolves the active theme based on
 * URL scope (per-tab binding > default), applies data-phosphor to <html>,
 * listens for storage changes, and polls for SPA navigation since
 * claude.ai transitions via pushState without a full reload.
 *
 * Bindable scope: any non-root claude.ai pathname (e.g. "/code/abc",
 * "/chat/xyz", "/project/foo"). Scope key = the full pathname so every
 * distinct URL is stable, and new claude.ai sections don't need a code
 * change to become bindable.
 *
 * Storage (v0.3+):
 *   { default: "amber", perProject: { "<scope-key>": "cga", ... } }
 * Legacy (v0.2) read once on upgrade:
 *   { phosphor: "amber" }
 */

(function () {
  "use strict";

  const FALLBACK = "amber";
  const VALID = new Set(["amber", "green", "white", "cga", "crt", "synthwave", "vanilla"]);
  const POLL_MS = 500;
  const EXT_URL_PREFIX = chrome.runtime.getURL("");

  let cachedDefault = FALLBACK;
  let cachedPerProject = {};
  let lastAppliedVariant = null;
  let lastPath = "";

  // Any non-root claude.ai pathname is a bindable scope. We key by the full
  // pathname so every distinct URL (/chat/abc, /code/xyz, /project/foo, or
  // any future section) gets its own binding with no regex gatekeeping.
  // Normalize: strip trailing "/" so "/chat/abc" and "/chat/abc/" match.
  function scopeKeyFromPath(pathname) {
    if (!pathname) return null;
    const stripped = pathname.replace(/\/+$/, "");
    return stripped && stripped !== "" ? stripped : null;
  }

  function resolveVariant() {
    const key = scopeKeyFromPath(location.pathname);
    if (key && Object.prototype.hasOwnProperty.call(cachedPerProject, key)) {
      const v = cachedPerProject[key];
      if (VALID.has(v)) return v;
    }
    return VALID.has(cachedDefault) ? cachedDefault : FALLBACK;
  }

  // Toggle every extension-origin stylesheet. Vanilla = opt out of all the
  // aggressive !important overrides in content.css + variant files, leaving
  // Claude's native look intact. Sheets stay loaded so flipping back is
  // instant — we just flip .disabled.
  function setExtensionStylesEnabled(enabled) {
    for (const sheet of document.styleSheets) {
      try {
        if (sheet.href && sheet.href.indexOf(EXT_URL_PREFIX) === 0) {
          sheet.disabled = !enabled;
        }
      } catch (e) {
        // Cross-origin sheet, can't touch. Safe to skip.
      }
    }
  }

  function applyVariant(variant) {
    if (variant === lastAppliedVariant) return;
    lastAppliedVariant = variant;
    document.documentElement.dataset.phosphor = variant;
    setExtensionStylesEnabled(variant !== "vanilla");
    const bar = document.getElementById("dos-status-bar");
    if (bar) {
      bar.dataset.variant = variant.toUpperCase();
      bar.style.display = variant === "vanilla" ? "none" : "";
    }
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
