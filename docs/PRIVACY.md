# Privacy Policy

_Last updated: 2026-04-20._

Claude Themes restyles `claude.ai` with retro CSS themes. Everything stays local — the sections below spell out what that means.

## What we store

Two settings in `chrome.storage.sync`:

- `default` — the name of your chosen theme (e.g. `"amber"`, `"crt"`).
- `perProject` — an object mapping claude.ai pathnames (e.g. `/code/session_01ABC`) to theme names, so you can bind a different theme per tab.

Both are settings you pick in the popup. Neither contains page content, messages, or any identifier.

## Where it lives

`chrome.storage.sync` is managed by your browser vendor (Google or Mozilla). If you enable browser sync, the vendor mirrors these two keys across your own signed-in browsers. The extension has no server and no author-side access to your data.

## What we do NOT collect

No page content, chat messages, prompts, or responses. No credentials, cookies, or tokens. No browsing history, analytics, telemetry, or crash reporting. No identifiers, fingerprints, or tracking of any kind.

## Network activity

None. The extension makes zero network requests — no `fetch`, no XHR, no remote config. The VT323 font is bundled locally under OFL 1.1.

## Permissions, and why

- `storage` — persist your theme choice and per-tab bindings.
- `activeTab` — read the active tab's URL when you open the popup, so we know which pathname to bind to.
- `host_permissions: https://claude.ai/*` — inject the theme CSS on claude.ai pages only. The extension does not run on any other origin.

## Deleting your data

Uninstalling the extension removes its stored data. You can also wipe extension storage from `chrome://extensions` or `about:addons` without uninstalling.

## Contact and changes

Issues and questions: https://github.com/clausqr/claude-themes/issues. This policy is version-controlled in this repository; future releases may update it — check the commit history for diffs.
