# Muhammad Ibrahim — engineering portfolio

Static site. No build step, no dependencies, no CDN. Open `index.html` directly
or serve the folder with any static host.

```
index.html          all page markup — plain, hand-editable HTML
css/styles.css      the whole design system, including the plate/cropping contract
js/content.js       figure registry, case-notes copy, stock-plate fallbacks (plain data)
js/app.js           nav, scroll reveal, case sheet + figure viewer, lightbox
assets/fonts/       self-hosted Montserrat + Inter variable fonts (OFL)
assets/images/      project figures and labelled stock placeholders
.nojekyll           GitHub Pages: serve the tree as-is
```

## Publishing

Push to a GitHub Pages branch. Nothing else is required — all paths are
relative.

## Before publishing

* Open at 320, 375, 768, 1024, 1280 and 1440px and confirm no horizontal scroll.
* Open the console: it must be clean.
* Exercise a case sheet, its figure viewer and the lightbox with the keyboard
  alone (Tab, Enter, Escape, ← →). The arrow keys must only move figures while
  a sheet or the lightbox is open.
* See `DESIGN.md` for the design contract and `MEDIA_GUIDE.md` for how to add a
  figure without breaking the cropping rules.
