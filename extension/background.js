/* Claude Themes — background service worker.
 * Seeds defaults on first install and normalizes legacy storage shape.
 * Runtime work lives in content.js. */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(
    { default: null, perProject: null, phosphor: null },
    (res) => {
      const next = {};
      if (res.default == null) {
        next.default = res.phosphor || "amber";
      }
      if (res.perProject == null) {
        next.perProject = {};
      }
      if (Object.keys(next).length > 0) {
        chrome.storage.sync.set(next);
      }
      if (res.phosphor != null) {
        chrome.storage.sync.remove("phosphor");
      }
    }
  );
});
