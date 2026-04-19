/* Popup logic: scope-aware theme picker.
 *
 * Scope states:
 *   - "default"  writes go to chrome.storage.sync.default
 *                (applies to every claude.ai tab with no per-project bind)
 *   - "project"  we detected /project/<id> on the active tab AND the user
 *                toggled "Use for this project". Writes go to
 *                perProject[id].
 *
 * Toggling scope off while a project is bound deletes its entry so the
 * project falls back to default. */

(function () {
  "use strict";

  const FALLBACK = "amber";
  const items = Array.from(document.querySelectorAll(".item[data-variant]"));
  const scopeToggle = document.getElementById("scope-toggle");
  const scopeLabel = document.getElementById("scope-label");
  const scopeHint = document.getElementById("scope-hint");
  const menuTitle = document.getElementById("menu-title");

  const storage = { default: FALLBACK, perProject: {} };
  let projectId = null;
  let scopeProjectBound = false;

  function projectIdFromUrl(urlStr) {
    if (!urlStr) return null;
    try {
      const u = new URL(urlStr);
      if (!/^(?:.*\.)?claude\.ai$/i.test(u.hostname)) return null;
      const m = u.pathname.match(/^\/projects?\/([^/?#]+)/);
      return m ? m[1] : null;
    } catch (e) {
      return null;
    }
  }

  function currentScopeVariant() {
    if (projectId && scopeProjectBound && storage.perProject[projectId]) {
      return storage.perProject[projectId];
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
    if (!projectId) {
      scopeToggle.checked = false;
      scopeToggle.disabled = true;
      scopeLabel.textContent = "DEFAULT (ALL TABS)";
      scopeHint.textContent = "Open a /project/<id> tab to bind a theme.";
      menuTitle.textContent = "DEFAULT THEME:";
      return;
    }
    scopeToggle.disabled = false;
    scopeToggle.checked = scopeProjectBound;
    scopeLabel.textContent = scopeProjectBound ? "THIS PROJECT" : "DEFAULT (ALL TABS)";
    menuTitle.textContent = scopeProjectBound ? "THEME FOR THIS PROJECT:" : "DEFAULT THEME:";
    scopeHint.textContent = "project: " + projectId;
  }

  function render() {
    renderScope();
    renderRadios(currentScopeVariant());
  }

  function choose(variant) {
    if (projectId && scopeProjectBound) {
      const nextMap = Object.assign({}, storage.perProject, { [projectId]: variant });
      storage.perProject = nextMap;
      chrome.storage.sync.set({ perProject: nextMap }, render);
    } else {
      storage.default = variant;
      chrome.storage.sync.set({ default: variant }, render);
    }
  }

  function onScopeToggle() {
    if (!projectId) return;
    if (scopeToggle.checked) {
      scopeProjectBound = true;
      if (!storage.perProject[projectId]) {
        const seed = storage.default || FALLBACK;
        const nextMap = Object.assign({}, storage.perProject, { [projectId]: seed });
        storage.perProject = nextMap;
        chrome.storage.sync.set({ perProject: nextMap }, render);
        return;
      }
    } else {
      scopeProjectBound = false;
      const nextMap = Object.assign({}, storage.perProject);
      delete nextMap[projectId];
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
        projectId = projectIdFromUrl(tabs && tabs[0] && tabs[0].url);
        resolve();
      })
    ),
  ]).then(() => {
    scopeProjectBound = !!(projectId && storage.perProject[projectId]);
    render();
  });
})();
