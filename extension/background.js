/* Claude MS-DOS 3.3 — background service worker.
 * Minimal: seeds the default phosphor on install. The content script handles
 * applying / re-applying the variant on page load and storage changes, so
 * the service worker doesn't need to broadcast anything. */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ phosphor: null }, (res) => {
    if (res.phosphor == null) {
      chrome.storage.sync.set({ phosphor: "amber" });
    }
  });
});
