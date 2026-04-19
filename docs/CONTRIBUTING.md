# Contributing

Thanks for wanting to add a theme. The extension is built to make this
easy: a theme is a single CSS file scoped under a data attribute.

## Add a theme in 5 steps

### 1. Copy the template

```bash
cp extension/variants/amber.css extension/variants/<your-theme>.css
```

Pick a short, lowercase, one-word name (no spaces, no hyphens ideally).
Examples: `solarized`, `dracula`, `c64`, `apple2`.

### 2. Define the palette

Every theme needs these eight tokens. Override them inside a
`html[data-phosphor="<your-theme>"]` block:

```css
html[data-phosphor="solarized"] {
  --phosphor-bg:         #002b36;   /* body background */
  --phosphor-bg-raised:  #073642;   /* cards, sidebar */
  --phosphor-bg-inset:   #001f27;   /* input fields, code blocks */
  --phosphor-fg:         #839496;   /* primary text */
  --phosphor-fg-dim:     #586e75;   /* secondary text */
  --phosphor-fg-bright:  #93a1a1;   /* emphasis, headings */
  --phosphor-accent:     #268bd2;   /* links, buttons, selection */
  --phosphor-destructive: #dc322f;  /* errors, warnings */
  --phosphor-border:     #586e75;   /* ANSI box borders */
}
```

That's the entire minimum theme. Everything else (typography, layout,
block cursor, BBS frames) comes from `content.css` and applies uniformly.

### 3. Register the theme in four places

**a. `extension/manifest.json`** — add to `content_scripts[0].css`:

```json
"variants/<your-theme>.css"
```

**b. `extension/content.js`** — add to the `VALID` set:

```javascript
const VALID = new Set([..., "<your-theme>"]);
```

**c. `extension/popup/popup.html`** — add a radio button:

```html
<button class="item" data-variant="<your-theme>" type="button">
  <span class="bullet">[ ]</span>
  <span class="label"><YOUR THEME></span>
  <span class="sub">ONE-LINE INSPIRATION</span>
</button>
```

**d. `extension/popup/popup.css`** — add a palette block so the popup
previews in your theme when it's selected:

```css
html[data-phosphor="<your-theme>"] {
  --bg: #002b36;
  --bg-inset: #001f27;
  --fg: #839496;
  --fg-dim: #586e75;
  --fg-bright: #93a1a1;
  --border: #586e75;
  --accent: #268bd2;
}
```

### 4. Add a preview

Copy an existing preview file:

```bash
sed 's/data-phosphor="amber"/data-phosphor="<your-theme>"/; s/AMBER/<YOUR-THEME>/' \
  preview/amber.html > preview/<your-theme>.html
```

Also add `<link rel="stylesheet" href="../extension/variants/<your-theme>.css" />`
to `preview/_shell.html` (so future regenerations pick it up).

Open `preview/<your-theme>.html` in a browser. Verify: no flashing white
background, headings / body / code / buttons all legible, ANSI box frames
readable, block cursor still blinks, status bar contrast is readable.

### 5. Open a PR

Include in the PR description:

- **Theme name** and one-line description.
- **Inspiration source** with a link or citation — a datasheet, a photo
  of hardware, an album cover, an existing widely-used palette
  (Solarized, Dracula, etc). We don't merge "I made up these colors"
  palettes; every theme should stand on something.
- **Before/after screenshot** of `preview/<your-theme>.html`.
- **License statement** if palette is from a licensed source (most
  community palettes like Solarized are MIT-style; Dracula is MIT; be
  explicit).

---

## Advanced: effects-heavy themes

Look at `variants/crt.css` and `variants/synthwave.css` for examples of
themes that add more than just a palette. These break the "zero shadows,
zero gradients" rule of the monochrome DOS variants, which is fine —
every theme has its own creative budget, as long as it's all scoped
under the theme's `data-phosphor` attribute.

Fair game inside a theme's scope:
- `text-shadow` for neon glow
- `filter: drop-shadow` / `filter: brightness` for animations
- `background: linear-gradient(...)` for gradient backgrounds
- Pseudo-elements on `body`, `html`, or other elements for overlays
  (scanlines, sun, grid)
- Custom keyframe animations

Not fair game:
- Modifying the DOM (that's a code change, not a theme).
- Loading external fonts or images. Everything stays bundled.
- Breaking accessibility: text contrast ≥ 4.5:1 against its background
  (use [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/)).

## Testing checklist

Before opening the PR, verify each in `preview/<your-theme>.html`:

- [ ] Sidebar readable (links, project names).
- [ ] User message bubble — ANSI frame, `──[ USER ]──` legend.
- [ ] Assistant message — `──[ CLAUDE ]──` legend, body legible.
- [ ] Code block — distinguishable from surrounding prose.
- [ ] Input composer — block cursor blinks, ASCII border.
- [ ] Buttons — normal, hover, disabled states all distinct.
- [ ] Dialog / modal — border + contrast work.
- [ ] Status bar — not blending into body.
- [ ] Table — rows distinguishable, header contrast OK.

## Themes we especially want

See the "Wishlist" section in [GALLERY.md](GALLERY.md). If your palette
is one of those, call it out in the PR title (`feat(theme): solarized
dark (wishlist)`) — helps us prioritize review.

## Code of conduct

Be kind. Cite your inspiration. If two PRs submit the same theme within
a few days of each other, we'll either merge both (slight variants) or
work with both authors to merge into one. Nobody gets scooped.
