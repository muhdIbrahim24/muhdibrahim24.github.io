---
version: alpha
register: brand
colors:
  canvas: "#f5f1e8"
  surface: "#e9e3d9"
  violetSoft: "#eee6f3"
  ink: "#29252d"
  muted: "#625e66"
  violet: "#57068c"
  violetDeep: "#330662"
  brass: "#87661f"
  line: "#b9b1a6"
typography:
  display:
    fontFamily: "NYU Perstare, Montserrat, Verdana, Arial, sans-serif"
    lineHeight: ".92"
  body:
    fontFamily: "NYU Perstare, Montserrat, Verdana, Arial, sans-serif"
    lineHeight: "1.55"
  utility:
    fontFamily: "NYU Perstare, Montserrat, Verdana, Arial, sans-serif"
    fontSize: ".72rem"
    lineHeight: "1.2"
rounded:
  default: "0"
spacing:
  unit: "4px"
  gutter: "clamp(16px, 3.5vw, 52px)"
components:
  editorialRule:
    border: "1px solid #29252d"
  flatButton:
    radius: "0"
    focus: "2px solid #57068c"
  mediaStage:
    radius: "0"
    background: "#e9e3d9"
---

## Overview

This is a compact, light engineering portfolio for an engineering hiring or review audience. Its job is to make placeholder work, research, experience, profile, and contact information easy to scan while preserving a truthful boundary around project evidence. The visual reference is an NYU-inspired drawing sheet: warm paper, firm rules, measured type, and a restrained editorial register.

The signature is the paired feature-scene register: six project moments arranged as two-column spreads on paper-like surfaces. It is a brand/content surface, not an application dashboard. Empty project data is intentionally visible as `[placeholder]` copy until verified content is supplied.

## Colors

The runtime source of truth is the `:root` token block in `css/styles.css`; names and values map one-to-one to the frontmatter above. `canvas` is the page paper, `surface` is the neutral sheet layer, and `violetSoft` is the occasional alternating register surface. `ink` is primary text and rules, `muted` is secondary text, `violet` is action/focus, `violetDeep` is the future-slot label tone, and `brass` is reserved for future verified metadata accents.

Never introduce gradients, glow, neon, or image backgrounds. Contrast must remain readable on every listed surface, with focus communicated by a visible violet outline and rule change in addition to color.

## Typography

Display headings use the available `NYU Perstare` local face with the documented sans fallbacks. Body copy uses the same family for continuity, and utility labels use the same face at a compact uppercase size. Display scale and line height create hierarchy; labels are informative register labels, not decorative micro-eyebrows.

## Layout

The page uses a centered maximum width of 1420px with a responsive gutter. The hero, six feature scenes, ten project rows, three research entries, seven experience entries, profile, contact, and footer retain their existing order and compact height topology. The target total page heights are desktop 5143–5461px, tablet 5468–5806px, and mobile 6796–7216px, each within ±3% of its baseline. There must be zero horizontal overflow at 320px through 1440px, at short viewport heights, and at 200% zoom.

The media browser always uses five thumbnail columns. It never becomes a horizontal strip. The responsive media-stage heights are `clamp(300px, 44dvh, 440px)` above 920px, `clamp(240px, 36dvh, 340px)` from 681px through 920px, and `clamp(180px, 32dvh, 250px)` through 680px.

## Elevation & Depth

Depth is flat and editorial: neutral paper layers, borders, and background surfaces only. There are no shadows, glass panels, or image-filled paper layers. The case dialog unfolds its neutral paper layers once on open; changing media only transitions the media viewport.

## Shapes

Every surface and control is zero-radius. Borders are square and visible. Five thumbnail columns, the stage, and dialogs reserve their geometry so loading, future, and error states cannot shift controls.

## Components

The primary navigation remains a native-link layout with a mobile disclosure. Project triggers are semantic buttons and open a native case dialog. The case dialog keeps its bar, header, and five content sections, then adds a stable media browser with counter, full-image action, previous/next buttons, five `aria-pressed` thumbnail buttons, a polite live status, and truthful future/error panels. A sibling lightbox is modal only for a successfully loaded real media item and restores focus to the expand button.

Motion is an enhancement implemented by `IntersectionObserver` and the Web Animations API. Tokens are declared in `css/styles.css`: fast 160ms, state 220ms, close 180ms, list 360ms, title 500ms, scene 600ms, hero 680ms, with the documented quart/quint/expo easings. Hero word delays are 40/120ms; the rule is 720ms after 180ms; title words stagger 45ms, capped at six delayed words; feature copy settles 12px over 420ms after 90ms; feature images clip over 600ms; register items stagger 42ms, capped at index six; gallery media uses 120ms outgoing and 220ms incoming transitions; underlines use 160ms.

## Media & content rules

`js/project-media.js` owns the deep-frozen `window.PORTFOLIO_PROJECTS` manifest. It contains exactly ten project keys, five unique media IDs per project, ten real temporary previews, and forty future slots. Real media must use accepted image MIME types, truthful dimensions, focal points from 0–100, specific alt text, and the existing temporary-preview disclaimer. Future slots have null source/type/dimensions, visible labels, and never create an `img`. GIFs use a verified poster object where available; with reduced motion, a poster replaces the GIF everywhere. A GIF without a poster is never requested and shows “Animated media paused. Static preview not supplied.”

Project assets use static relative paths compatible with GitHub Pages. Existing placeholder files and `assets/images/placeholders/SOURCES.md` remain unchanged. No borrowed or fake project imagery is added. Future assets belong in lower-case `assets/images/projects/p01` through `p10` and are documented in `assets/images/projects/README.md`; adding a file requires its real dimensions, specific alt/caption, and a manifest update. Do not create empty directories.

## Do's and Don'ts

- Do preserve all visible placeholder copy and the exact counts: 6 feature scenes, 10 project rows, 3 research entries, 7 experience entries, and 22 project triggers.
- Do keep native dialogs, focus restoration, backdrop close, Escape ordering, body scroll lock, stable loading/error/future states, and full keyboard access.
- Do respect live `prefers-reduced-motion` changes by canceling animations, showing final states immediately, and resolving GIF/poster behavior again.
- Do use relative asset paths and leave the site build-free and deployable on GitHub Pages.
- Do not add gradients, scroll hijacking, snapping, horizontal scrolling, parallax, WebGL, cursor-follow, magnetic effects, bento/masonry layouts, glow/drop-shadow cards, icon libraries, sparkles, animated arrows, hover scale/tilt/zoom, terminal UI, fake testimonials, or generic numbered-section scaffolding.
- Do not alter personal or career content, duplicate an image source, or imply that a temporary preview represents the portfolio owner’s work.
