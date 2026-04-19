# Claude MS-DOS 3.3

A browser extension that reskins [claude.ai](https://claude.ai) with a 1987-era
MS-DOS 3.3 phosphor aesthetic. Four variants, runtime-switchable from the
extension popup:

- **Amber** — IBM 5151 monochrome (1981)
- **Green** — Hercules / generic P1 phosphor
- **White** — MDA / paper-white
- **CGA** — black / white / cyan / magenta (palette 1, high-intensity)

## Install (unpacked)

**Chrome / Chromium / Edge / Brave:**
1. `chrome://extensions`
2. Toggle **Developer mode** on (top right).
3. **Load unpacked** → select the `extension/` directory.
4. Open `claude.ai`. Click the extension icon to pick a phosphor.

**Firefox (temporary):**
1. `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** → pick `extension/manifest.json`.
3. Same workflow — popup switches variants live.

## Bitmap font (optional)

The theme expects a bitmap DOS font at `extension/fonts/PerfectDOSVGA437.ttf`.
It is **not bundled here** (licensing confirmation pending — see below). The
theme still looks DOS-y with the fallback stack (`IBM Plex Mono`,
`ui-monospace`, `Consolas`, `Courier New`, `monospace`), but drop a bitmap
TTF in that folder for the full pixelated effect.

Licensing-clean candidates:
- **MxPlus IBM VGA 9x16** from [The Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/) — CC BY-SA 4.0, safe to redistribute inside an extension bundle if you include the license.
- **Perfect DOS VGA 437** — freeware, author's site is sporadic; licensing for bundled redistribution is ambiguous.

If you use MxPlus, rename the TTF to `PerfectDOSVGA437.ttf` or update the
`@font-face` `src` in `extension/content.css` and `extension/popup/popup.css`
to match.

## Offline preview

`preview/amber.html`, `preview/green.html`, `preview/white.html`,
`preview/cga.html` render the theme against a synthetic fixture that mirrors
claude.ai's DOM. Open them directly in a browser (no install needed) to
iterate on the CSS without reloading the extension.

The actual saved HTML snapshots live in `ref/`. They're captured with
embedded darkreader injections and the stock 168KB minified bundle, so we
don't wire our theme against them directly — the synthetic preview pages
are more reliable. `ref/` is kept frozen as a reference of the selector
vocabulary we target.

## How switching works

- Popup writes `{ phosphor: "amber" | "green" | "white" | "cga" }` to
  `chrome.storage.sync`.
- `content.js` runs at `document_start` on `claude.ai/*`, reads storage,
  sets `document.documentElement.dataset.phosphor = variant`, and listens
  for `storage.onChanged` to swap live with no reload.
- `content.css` defines the base theme; `variants/*.css` each scope their
  palette under `html[data-phosphor="<variant>"]`, so all four are loaded
  but only the matching one "wins."

This avoids needing `chrome.scripting.executeScript` messaging and works on
Firefox MV3 without a polyfill.

## Selector / variable reference

Core overrides land in `extension/content.css`. It targets three layers:

1. **CSS custom properties** — `--r0..--r8` (radii → 0), `--z0..--z6`
   (surfaces), `--t0..--t9` (overlays), `--font-ui/--font-mono/…`, `--accent`,
   `--text-*`, `--bg-*`, `--border-*`.
2. **Tailwind utility classes** — `[class*="rounded"]`, `[class*="shadow"]`,
   `[class*="blur"]`, `[class*="bg-gradient"]`, `[class*="ring-"]` get
   blanket `!important` kills.
3. **Targeted DOM decorations** — ASCII double borders on `#turn-form` and
   the sidebar, bracketed `[CLAUDE]` / `[USER]` prefixes on message regions,
   a fake status bar fixed at the bottom of the viewport.

## Drift

`claude.ai` ships a new minified bundle whenever they push. The utility-class
kills (`[class*="rounded"]`, etc.) survive renames; the per-component
selectors (`.flex-shrink-0.bg-bg-200.border-r-[0.5px]`, etc.) do not. Expect
to chase selectors occasionally. The `ref/` snapshots are frozen for
comparison — diff against a fresh save to find what moved.

No version-pinning check is in place; if a release breaks the theme badly,
the user just uninstalls.

## Development

No build step. Edit CSS/JS in `extension/` and reload the extension
(`chrome://extensions` → reload button). For the offline previews, just
refresh the browser tab.
