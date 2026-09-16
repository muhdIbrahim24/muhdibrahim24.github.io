# Muhammad Ibrahim, engineering portfolio

A static site. No build step, no framework, no package manager, and nothing
loaded from a CDN. Open `index.html` directly, or serve the folder with any
static host.

```
index.html              every bit of page markup, hand-edited
cv.html                 the CV, shown as a rendered page image
doc.html                the in-site PDF viewer, used by every source document
css/styles.css          the whole design system, including the plate cropping contract
js/content.js           records, figures and captions: plain data, no logic
js/app.js               nav, record sheet, figure viewer, lightbox, activity sheet
js/motion.js            scroll reveals, the hero field, the project shelf
assets/fonts/           Inter variable, self-hosted, the only font file loaded
assets/images/          full-size figures, with 760px companions under thumbs/
assets/docs/            the source PDFs, opened through doc.html
assets/vendor/pdfjs/    pdf.js, vendored so the viewer needs no network
.nojekyll               GitHub Pages: serve the tree as it is
```

## Publishing

Push to the GitHub Pages branch. Every path in the site is relative, so
nothing else is needed.

## Before publishing

* Open at 360, 430, 900, 1280 and 1440px and confirm the page never scrolls
  sideways.
* Open the console: it must be clean.
* Work a project record, its figure viewer and the lightbox with the keyboard
  alone (Tab, Enter, Escape, left and right arrows). The arrow keys must move
  figures only while a record or the lightbox is open, and the project shelf
  only while the shelf itself has focus.
* Open one PDF through `doc.html` and confirm the first page draws.

## Adding an image

Put the full-size file under `assets/images/<section>/`, and a copy no more
than 760px on its long edge at the same path under `assets/images/thumbs/`.
`content.js` points at the full-size file; the thumbnail is found
automatically. Set `w` and `h` to the file's real pixel size, or the page will
shift as it loads.
