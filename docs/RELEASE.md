# Release strategy — Chrome Web Store + Firefox AMO

## Pre-launch gate (must ship before v1.0)

These are blockers for a credible public launch, not nice-to-haves:

1. **Per-project variant binding.** The README + promo copy leans on the
   "different color per project" pitch. Today the extension stores one
   global variant. Fix: persist a map `{ "project_<id>": "amber", ... }`
   in `chrome.storage.sync`, detect the active project from the URL in
   `content.js`, apply the bound variant when matched. Fall back to the
   global default.
2. **Privacy policy.** Required by Chrome Web Store any time an extension
   uses `storage`, `host_permissions`, or touches a specific site. Short
   page at `docs/PRIVACY.md` (one-liner: extension stores the chosen
   variant locally via `chrome.storage.sync`, no telemetry, no network
   calls, no data leaves the device). Host at GitHub Pages: URL goes in
   both store listings.
3. **MxPlus bitmap font bundled.** Today it's a "drop it in yourself"
   situation, which means 95% of installs will never see the real bitmap
   look. Confirm CC BY-SA redistribution inside an extension bundle is OK
   (it is), bundle it, include `extension/fonts/LICENSE-MXPLUS.txt` with
   the CC BY-SA 4.0 text + VileR credit.
4. **Screenshots + demo GIF.** Non-negotiable for both stores. See
   "Assets" below.
5. **Version bump to 1.0.0** in `manifest.json` + git tag.

## Chrome Web Store submission

### One-time setup
- Register a Chrome Web Store developer account: **one-time $5 USD fee**,
  paid via Google Pay. Use a dedicated account, not your personal one.
- Verify email + identity (Google KYC takes 1–3 days).

### Assets required
| Asset            | Size                 | Format       | Notes                                   |
|------------------|----------------------|--------------|-----------------------------------------|
| Icon             | 128×128              | PNG, no alpha halo | Already have — regenerate at higher quality |
| Small promo tile | 440×280              | PNG / JPEG   | Hero image for search results           |
| Marquee tile     | 1400×560             | PNG / JPEG   | Optional but lifts ranking              |
| Screenshots      | 1280×800 or 640×400  | PNG          | **At least 1, up to 5.** Shoot all 6 variants. |
| Demo video       | YouTube link         | —            | Optional but converts; 30–60s           |

Screenshot plan — one per variant, shot against the synthwave preview
page so content looks identical, only the palette differs. Plus one
"tab strip" composite showing three tabs in three variants (the core
pitch).

### Listing copy (first draft)

**Name (max 45 chars):** `Claude Themes: MS-DOS, CRT & Synthwave`

**Short description (max 132 chars):**
```
Reskin claude.ai with 6 retro palettes. Assign a color to each
project — tab-glance your way between them.
```

**Category:** Productivity (better ranking than Fun — Fun is saturated).

**Long description:** ~500 words. Lead with the multi-project pitch, bullet
the six variants, one paragraph on privacy ("no telemetry, no network
calls"), closing CTA to GitHub.

**Permissions justification** (Chrome asks for each one; must be in the
listing):
- `storage` — "Remembers your chosen color theme across tabs and devices."
- `host_permissions: https://claude.ai/*` — "The extension only styles
  claude.ai. No other site is read or modified."

No `tabs`, no `activeTab`, no broad host permissions — keep this.
Chrome's review is stricter on permissions than Firefox's; a lean
manifest gets approved in 1–3 days instead of 2–4 weeks.

### Packaging
```bash
cd extension && zip -r ../claude-themes-chrome.zip . -x "*.DS_Store" -x "*/.git/*"
```
Output must be < 10 MB (we're at ~1 MB with fonts). Do NOT include
`preview/`, `ref/`, `docs/`, `README.md` in the zip.

Automate via `scripts/package.sh` so you can't ship a dirty zip:
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./extension/manifest.json').version")
rm -f "claude-themes-chrome-${VERSION}.zip"
(cd extension && zip -r "../claude-themes-chrome-${VERSION}.zip" . \
  -x "*.DS_Store" "*/.git/*" "fonts/LICENSE*" 2>/dev/null || true)
echo "-> claude-themes-chrome-${VERSION}.zip"
```

### Review timeline
- First submission: 1–3 business days typical, up to 7 if flagged.
- Updates: minutes to hours if no permission changes; 1–3 days if new
  permissions or host access added.
- If rejected: email says why (usually permissions or privacy policy);
  fix and resubmit, resets the clock.

### Gotchas
- **Minified code:** Chrome requires source to be reviewable. We ship
  unminified CSS/JS so this is a non-issue, but don't start minifying
  without also providing a source mapping.
- **Remote code:** Anything loaded via `fetch` or external `<script src>`
  is forbidden in MV3. We don't do this, but the reviewer will scan.
- **Inline event handlers in popup HTML:** would violate MV3 CSP. Our
  popup uses `addEventListener` only — good.

## Firefox Add-ons (AMO)

### One-time setup
- Register at [addons.mozilla.org/developers](https://addons.mozilla.org/developers/).
  **Free**, no payment required.
- Email + 2FA verification, instant.

### MV3 differences
- Firefox MV3 is stable as of Firefox 115+. Our manifest already has
  `browser_specific_settings.gecko.id` — required for AMO.
- `chrome.*` APIs all alias to `browser.*` via Firefox's compat shim;
  our code uses `chrome.storage` which works.
- Service worker backgrounds on Firefox are actually "event pages" under
  the hood but behave the same. No change needed.
- Upload the **same zip** used for Chrome (with the gecko id in manifest).

### Signing
- AMO signs every upload. Unlisted distribution (`about:debugging`) does
  not require signing but users can't easily install from there.
- For listed distribution, Mozilla's automated review is minutes for
  extensions with no broad permissions; manual review (if triggered) is
  1–2 weeks.

### Listing
- Same copy as Chrome, trimmed to AMO's character limits (name max 50,
  summary max 250).
- AMO allows richer markdown in the description — use headers, links.
- Additional required field: **support email**. Use a real one you read,
  or Mozilla will flag abandonware eventually.

### Gotchas
- **Source code review:** Mozilla can request source for manual review.
  Since we ship unminified, just point them at the GitHub repo URL.
- **Font file sizes:** AMO rejects extensions > 200 MB. We're < 2 MB
  even with fonts; fine.
- **`host_permissions` on claude.ai:** Mozilla flags broad permissions
  more aggressively than Chrome. Single-domain is fine.

## Edge Add-ons (optional, low effort)

Edge uses the Chrome Web Store package as-is. Separate developer account
(free) at [partner.microsoft.com](https://partner.microsoft.com/dashboard/microsoftedge).
Review is 1–7 days. Reuses Chrome listing copy + screenshots.

**Decision:** defer Edge until Chrome + Firefox are live and stable.
Edge users can install via the Chrome Web Store directly; only Microsoft's
featured listings need the Edge-specific submission.

## Safari (Apple App Store)

Dramatically harder:
- Mac app wrapper required (Xcode, Swift shim, code-signing cert).
- $99/yr Apple Developer Program fee.
- 1–2 week review.
- Low ROI — Safari users on claude.ai are a small slice.

**Decision:** skip. Re-evaluate if a user explicitly asks.

## Versioning + CI

- **Semver:** `MAJOR.MINOR.PATCH`. Bump MAJOR for breaking manifest
  changes (removed permissions, MV2→MV3), MINOR for new variants / UI
  features, PATCH for CSS fixes.
- Tag every shipped version: `git tag v1.0.0 && git push --tags`.
- GitHub Actions workflow at `.github/workflows/package.yml`:
  - Trigger: push to `main` with a `v*` tag.
  - Runs `scripts/package.sh`, uploads the zip as a release artifact.
  - Does NOT auto-submit to stores — store upload stays manual to keep a
    human in the loop.

## Staged rollout

1. **v0.9.0 — Beta (GitHub only).** Publish release artifact, post to a
   small audience (personal network, one small subreddit). Collect 1–2
   weeks of real-use feedback. Expect to find broken selectors on
   obscure claude.ai flows (Projects drawer, Settings modal, tool
   invocation UI).
2. **v1.0.0 — Firefox AMO first.** Faster review, more patient early
   adopters, easier to iterate if something breaks.
3. **v1.0.1 — Chrome Web Store.** After Firefox has been live 3–5 days
   with no bug reports.
4. **v1.1.0 — Edge Add-ons.** Once both primary stores are stable.

## Post-launch monitoring

- **GitHub issues only** for bug tracking (don't engage with store
  reviews — they can't follow up).
- Check the Chrome Web Store developer dashboard weekly for policy
  violation emails. Google occasionally sends breaking-change warnings
  (e.g. MV2 sunset) with short deadlines.
- Claude.ai ships new CSS bundles; when the theme breaks, users will
  file issues. Target < 1 week turnaround for breakage fixes.

## When to skip all this

If the goal is internal / personal use only, the GitHub "Load unpacked"
path is fine forever — no review, no versioning bureaucracy. Store
release is for distribution reach.
