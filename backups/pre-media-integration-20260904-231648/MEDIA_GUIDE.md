# Media guide

## Where media lives

* `assets/images/projects/<project>/*.png` — real figures lifted from Muhammad
  Ibrahim's own project reports (civil, savonius, pde, pca). 36 in use.
* `assets/images/placeholders/p01–p10*.jpg` — stock imagery. Every appearance is
  labelled *Stock image* / *Temporary stock image — not project evidence*.
* `js/content.js` — the figure registry (`src`, `w`, `h`, `alt`, `caption`,
  `cite`, `group`) plus the record copy behind the case-notes sheet. Data only.

## Adding a figure

1. Drop the file in the right project folder.
2. Add an entry to `PORTFOLIO.figures` in `js/content.js` with its real pixel
   dimensions, descriptive alt text, a caption and a report citation.
3. Add the matching `<figure class="figure-card">` in the group's
   `.figure-grid` in `index.html`, with the plate written as:

   ```html
   <div class="plate figure-plate" data-fit="natural" style="--ar:1790 / 990">
     <img src="…" alt="…" width="1790" height="990" loading="lazy" decoding="async">
   </div>
   ```

   `--ar` is the image's own ratio, so it cannot be cropped. Add
   `data-wide="true"` on the plate and `is-wide` on the `figure-card` when the
   ratio is 2.3:1 or wider, so it spans two columns.

## Choosing a fit

| The image is… | Use | Notes |
| --- | --- | --- |
| a plan, table, mesh, field map, chart, or any multi-panel comparison | `natural` | never crop; meaning lives at the edges |
| technical, but inside a uniform card grid | `contain` | whole image on a mat |
| a photograph or render | `cover` + `--pos` | pick the focal point by eye; check the subject survives the crop |

Alt text describes what the figure shows, not the file. Stock imagery says so in
its alt text as well as on the visible label.
