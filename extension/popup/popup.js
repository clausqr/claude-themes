/* Popup logic: radio-group behavior backed by chrome.storage.sync.
 * The content script on claude.ai tabs listens for storage changes and
 * re-applies data-phosphor live, so no tab messaging is needed here. */

(function () {
  "use strict";

  const DEFAULT = "amber";
  const items = Array.from(document.querySelectorAll(".item[data-variant]"));

  function render(active) {
    items.forEach((el) => {
      const on = el.dataset.variant === active;
      el.setAttribute("aria-checked", on ? "true" : "false");
      el.setAttribute("role", "radio");
      // Preview the popup itself in the chosen phosphor, for instant feedback.
    });
    document.documentElement.dataset.phosphor = active;
    const status = document.getElementById("current");
    if (status) {
      status.textContent = "C:\\CLAUDE> SET PHOSPHOR=" + active.toUpperCase();
    }
  }

  function choose(variant) {
    chrome.storage.sync.set({ phosphor: variant }, () => render(variant));
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

  chrome.storage.sync.get({ phosphor: DEFAULT }, (res) => render(res.phosphor));
})();
