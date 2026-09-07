---
version: alpha
register: brand
colors:
  chassis: "#030708"
  carbon: "#071114"
  panel: "#102126"
  ink: "#f3f6f2"
  muted: "#b9c5bf"
  signal: "#f06a2f"
  copper: "#c79a6b"
  focus: "#ffd166"
typography:
  display:
    fontFamily: "Arial Narrow, Aptos Display, Franklin Gothic Condensed, Helvetica Neue Condensed, Arial, sans-serif"
    lineHeight: "0.93"
  body:
    fontFamily: "NYU Perstare, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.6"
  utility:
    fontFamily: "Cascadia Mono, SFMono-Regular, Consolas, ui-monospace, monospace"
    fontSize: "0.72rem"
    lineHeight: "1.35"
rounded:
  control: "4px"
  surface: "8px"
spacing:
  frameGutter: "38px"
  contentGutter: "54px"
components:
  siteFrame:
    maxWidth: "1520px"
  focusRing:
    outline: "3px solid #ffd166"
  projectSurface:
    scrim: "rgba(3, 7, 8, 0.76)"
---

# Instrumented Afterdark

## Overview

This is a brand portfolio for engineering hiring managers and technical reviewers. Its North Star is a cinematic engineering dossier inside a dark machined enclosure: full-bleed machinery photography, sodium-orange calibration marks, condensed display type, and precise evidence labels. The memorable signature is the bounded chassis plus a destination-based calibration rail. It must never resemble a generic SaaS grid, beige editorial template, terminal costume, or neon dashboard.

Runtime ownership is explicit: this file defines the durable visual contract; `css/styles.css` and `css/overrides.css` own executable tokens and rules; `index.html` and `js/project-media.js` own verified content and media data. System-level changes update this file and the runtime together.

## Colors

The page outside the frame uses `chassis`; the frame and header use `carbon`; utility and fallback surfaces use `panel`. `ink` and `muted` carry text. `signal` marks active interaction, `copper` is reserved for metadata, and `focus` is reserved for keyboard focus. Photographs always receive a dark text-protection scrim. Gradient text is prohibited; gradients are allowed only as practical image scrims.

## Typography

Display, body, and utility roles are visibly distinct and have no network dependency. Condensed display type carries names and chapter headings, the NYU/system body stack carries readable prose, and the monospaced utility stack is limited to dates, counters, project identifiers, and status labels. Display headings do not exceed 92px, letter spacing is no tighter than -0.03em, body copy is limited to 68ch, and text uses balanced/pretty wrapping without forced word breaking.

## Layout

The centered `site-frame` is capped at 1520px and retains visible chassis margins down to 320px. Hero, Profile, Work, Project Register, Career, Activities, and Contact use image-backed cinematic surfaces. Research and Experience share one `#career` composition: 5/7 columns above 1040px and stacked below. Featured work uses three paired, image-led spreads. The register is two columns through 920px, then one. The calibration rail appears at 1180px and contains real destinations rather than decorative numbering.

Image map: hero P01; profile P10; featured ambient P07; register P09; career P05/P06; activities P04; contact P02; project surfaces P01–P10. Project imagery remains visibly labelled as temporary stock. P03 truthfully describes the black-and-white steam locomotive / steel machinery shown by the existing attributed Commons source and never implies that image depicts the residential project.

Required content counts are 6 featured scenes, 10 project rows, 22 project triggers, 10 project records with 5 media slots each, 3 research roles, 9 experience roles, 4 profile blocks, and 4 activities.

## Elevation & Depth

Depth comes from photography, scrims, inset rules, subtle enclosure shadow, and image apertures. There is no glass-card system, floating card lift, or decorative glow. Dialogs use one contained shadow against an 84% black backdrop.

## Shapes

The visual language is rectilinear and machined. Controls use 4px corners; major contained surfaces use 8px and never exceed 10px. Rules, crop edges, fixed media geometry, and calibration ticks create structure.

## Components

The sticky header retains native links and a mobile disclosure. Project buttons open a native case dialog with five stable media slots, counter, previous/next controls, thumbnails, lightbox, loading/future/error states, keyboard navigation, backdrop/Escape close, and focus restoration. Missing images show a stable fallback while project text remains operable. No-JavaScript mode keeps navigation visible and removes false interactive project affordances.

Motion uses IntersectionObserver and the Web Animations API as enhancement only. Targets track `idle`, `entering`, `visible`, and `exiting` in a WeakMap with generation counters. Entries originate from travel direction; full-edge exits arm replay; upward lists reverse stagger order; rapid reversals cancel stale motion. Reduced motion disconnects and cancels animations, clears temporary styles, disables smooth scrolling, and leaves all content visible. Without JavaScript or animation APIs, the complete page remains readable.

## Do's and Don'ts

- Do preserve every verified fact, limitation, link, anchor, disclaimer, and source attribution.
- Do maintain WCAG 2.2 AA contrast, 44px targets, visible focus, keyboard operation, forced-colors resilience, 200% zoom, and reduced motion.
- Do keep fixed image dimensions, lazy-load all but the hero, and reserve dialog/media geometry.
- Do test 320, 375, 390, 480, 680/681, 768, 920/921, 1023/1024, 1040/1041, 1280, and 1440px without horizontal overflow or clipped text.
- Do keep relative asset paths, `.nojekyll`, and dependency-free GitHub Pages deployment.
- Don't represent stock photography as Muhammad Ibrahim's work or invent technical evidence.
- Don't use identical card grids, fabricated gauges, scroll hijacking, snapping, or essential hover-only information.
