# Design contract — technical dossier

The portfolio reads as an engineering dossier: a warm paper ground, deep ink
slabs for the hero and contact band, hairline rules instead of boxes and
shadows, and images presented as *plates* that carry a caption and a citation.
Tone stays measured — the design does the work, the copy never inflates a claim.

## Tokens (owner: `css/styles.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--ink` / `--ink-2` | `#15131b` / `#211d2b` | hero, contact band, footer |
| `--paper` / `--surface` / `--mat` | `#f4f2ef` / `#fff` / `#fbfaf9` | page ground, cards, plate mats |
| `--text` / `--muted` / `--muted-2` | `#1b1822` / `#59535f` / `#6b6472` | body copy, secondary, small labels |
| `--line` / `--line-2` | `#ded8d1` / `#c6bfb6` | hairlines |
| `--accent` / `--accent-hi` / `--accent-on-ink` | `#57068c` / `#7a0fc4` / `#c79bf0` | action, focus ring, accent on dark |

Every text pair meets WCAG 2.2 AA at its used size (lowest is `--muted-2` on
paper at 5.09:1). Focus rings are 3px `--accent-hi` (6.98:1) on light and
`--accent-on-ink` on dark.

## Typography

Montserrat (self-hosted variable, `assets/fonts/`) is the display face; Inter is
body and utility. A system monospace stack carries index numbers, dates and
figure citations — it is the only "technical" voice on the page and needs no
extra font file. Scale is fluid (`--step-0` … `--step-4`); headings are balanced
and body copy is pretty-wrapped.

## Structure

Sticky masthead → hero (type only, no photograph) → credentials band → 01
Selected work (six editorial spreads) → 02 Project index (ten plates) → 03
Evidence (36 report figures, filterable by project) → 04 Research → 05
Experience → 06 Activities → 07 Contact. Nav collapses to a disclosure at
1000px; the wordmark's role tag drops at 620px.

## The plate system — the cropping contract

All media sits in `.plate`, and `data-fit` is the only thing that decides how a
picture meets its box. See the commented block in `css/styles.css` §3.

* `data-fit="natural"` — the box adopts the image's own ratio via `--ar`, so the
  complete frame shows with no crop and no letterbox. **Every report figure uses
  this**: plans, tables, meshes, field maps, comparison strips and charts. A
  `--plate-max` guard keeps extreme ratios inside a sane column; if it bites the
  image contains itself on the mat rather than losing an edge.
* `data-fit="contain"` — fixed ratio for grid rhythm, whole image on a mat with
  padding. Used for technical images inside the uniform index/feature grids
  (P06 field map, P09 distributions).
* `data-fit="cover"` — a deliberate crop, **photographs and renders only**, with
  a per-image focal point in `--pos`. Currently: the Savonius bench photo
  (`52% 26%`), the biophilic façade render (`46% 44%`) and the labelled stock
  placeholders. Nothing technical is ever set to `cover`.

The lightbox stage is `object-fit: contain` with a max height, so an enlarged
figure is never cropped either.

## Motion and deployment

One IntersectionObserver reveal with a small stagger, a sticky-header state, a
scroll-spy and hover transitions — all enhancement only, all cancelled by
`prefers-reduced-motion`. `[data-reveal]` only hides itself under `.has-js`
(set in the document head), so the page is complete with JavaScript blocked.

Static, relative paths, `.nojekyll`, no build step, no CDN, no runtime network
access. Verified at 320–1920px with no horizontal overflow, on `file://` and on
a static server, with no console errors.
