/* Popup logic: scope-aware theme picker.
 *
 * Scope states:
 *   - "default"  writes go to chrome.storage.sync.default
 *                (applies to every claude.ai tab with no per-tab bind)
 *   - "tab"      we detected a bindable URL (/chat, /code, /project(s)) on
 *                the active tab AND the user toggled "Use for this tab".
 *                Writes go to perProject[<section>/<id>].
 *
 * Toggling scope off while bound deletes its entry so the tab falls back
 * to default. */

(function () {
  "use strict";

  const FALLBACK = "amber";
  const items = Array.from(document.querySelectorAll(".item[data-variant]"));
  const scopeToggle = document.getElementById("scope-toggle");
  const scopeLabel = document.getElementById("scope-label");
  const scopeHint = document.getElementById("scope-hint");
  const menuTitle = document.getElementById("menu-title");

  const storage = { default: FALLBACK, perProject: {} };
  let scopeKey = null;        // e.g. "code/session_01ABC"; null if not bindable
  let scopeBound = false;

  function scopeKeyFromUrl(urlStr) {
    if (!urlStr) return null;
    try {
      const u = new URL(urlStr);
      if (!/^(?:.*\.)?claude\.ai$/i.test(u.hostname)) return null;
      const stripped = u.pathname.replace(/\/+$/, "");
      return stripped && stripped !== "" ? stripped : null;
    } catch (e) {
      return null;
    }
  }

  function currentScopeVariant() {
    if (scopeKey && scopeBound && storage.perProject[scopeKey]) {
      return storage.perProject[scopeKey];
    }
    return storage.default || FALLBACK;
  }

  function renderRadios(active) {
    items.forEach((el) => {
      const on = el.dataset.variant === active;
      el.setAttribute("aria-checked", on ? "true" : "false");
      el.setAttribute("role", "radio");
    });
    document.documentElement.dataset.phosphor = active;
    const status = document.getElementById("current");
    if (status) {
      status.textContent = "C:\\CLAUDE> SET THEME=" + active.toUpperCase();
    }
  }

  function renderScope() {
    if (!scopeKey) {
      scopeToggle.checked = false;
      scopeToggle.disabled = true;
      scopeLabel.textContent = "DEFAULT (ALL TABS)";
      scopeHint.textContent = "Open any claude.ai page to bind.";
      menuTitle.textContent = "DEFAULT THEME:";
      return;
    }
    scopeToggle.disabled = false;
    scopeToggle.checked = scopeBound;
    scopeLabel.textContent = scopeBound ? "THIS TAB" : "DEFAULT (ALL TABS)";
    menuTitle.textContent = scopeBound ? "THEME FOR THIS TAB:" : "DEFAULT THEME:";
    scopeHint.textContent = scopeKey;
  }

  function render() {
    renderScope();
    renderRadios(currentScopeVariant());
  }

  function choose(variant) {
    if (scopeKey) {
      const nextMap = Object.assign({}, storage.perProject, { [scopeKey]: variant });
      storage.perProject = nextMap;
      scopeBound = true;
      chrome.storage.sync.set({ perProject: nextMap }, render);
    } else {
      storage.default = variant;
      chrome.storage.sync.set({ default: variant }, render);
    }
  }

  function onScopeToggle() {
    if (!scopeKey) return;
    if (scopeToggle.checked) {
      scopeBound = true;
      if (!storage.perProject[scopeKey]) {
        const seed = storage.default || FALLBACK;
        const nextMap = Object.assign({}, storage.perProject, { [scopeKey]: seed });
        storage.perProject = nextMap;
        chrome.storage.sync.set({ perProject: nextMap }, render);
        return;
      }
    } else {
      scopeBound = false;
      const nextMap = Object.assign({}, storage.perProject);
      delete nextMap[scopeKey];
      storage.perProject = nextMap;
      chrome.storage.sync.set({ perProject: nextMap }, render);
      return;
    }
    render();
  }

  items.forEach((el) => {
    el.addEventListener("click", () => choose(el.dataset.variant));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose(el.dataset.variant);
      }
    });
  });
  scopeToggle.addEventListener("change", onScopeToggle);

  Promise.all([
    new Promise((resolve) =>
      chrome.storage.sync.get(
        { default: FALLBACK, perProject: {}, phosphor: null },
        (res) => {
          storage.default = res.default || res.phosphor || FALLBACK;
          storage.perProject = res.perProject || {};
          resolve();
        }
      )
    ),
    new Promise((resolve) =>
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        scopeKey = scopeKeyFromUrl(tabs && tabs[0] && tabs[0].url);
        resolve();
      })
    ),
  ]).then(() => {
    scopeBound = !!(scopeKey && storage.perProject[scopeKey]);
    render();
  });
})();
