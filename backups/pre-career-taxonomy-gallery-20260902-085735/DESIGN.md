# Measured, image-led, assured

## Design contract

This is a light, bounded engineering portfolio. The page sits on `--page` within a centred `site-frame`; its surfaces are quiet and legible, while dark treatment is reserved for hero, Selected Work, image cards and media viewing. There are no remote runtime dependencies, glass panels, glow, broad drop shadows or radius above 10px.

## Runtime tokens

| Token | Value | Use |
| --- | --- | --- |
| `--page` | `#E2E4EA` | outer desktop page |
| `--canvas` | `#EEF0F5` | primary section ground |
| `--surface` | `#FCFCFE` | header/profile/footer |
| `--surface-lilac` | `#F4EFF8` | career composition |
| `--ink` | `#231F28` | primary text |
| `--muted` | `#635D6A` | secondary text |
| `--line` / `--line-strong` | `#CDC8D4` / `#AFA8B8` | boundaries |
| `--violet` / `--violet-bright` | `#57068C` / `#8900E1` | action and focus accent |
| `--image-scrim` | `rgba(27,19,34,.78)` | persistent image-card contrast |

`assets/fonts/montserrat-variable-latin.woff2` is the display face and `assets/fonts/inter-variable-latin.woff2` is body/utility. They are preloaded and self-hosted with their OFL texts. This follows NYU’s listed Montserrat fallback and NYU Tandon’s Inter use; no restricted Perstare asset or remote font request remains.

## Structure

The sticky header is one clean horizontal desktop bar. It collapses to an accessible disclosure at 960px; click-away, Escape, focus restoration and resize-close stay in `js/main.js`. No calibration rail exists.

Selected Work remains six scenes in three paired spreads, with 12 existing project triggers, alternating image/copy arrangement and direction-aware replay motion. Its dark image-led treatment is deliberately distinct from the light register.

The ten project-register controls are directly marked-up `.image-card` buttons with real local P01–P10 `<img>` assets, fixed `object-fit: cover`, persistent scrim, project ID, title, focus, date and visible `Temporary stock image · not project evidence` label. Grid: five columns from 1280px, three at 1024–1279px, two at 768–1023px and one below 768px.

`#career` remains one composition: 4/8 Research/Experience outer columns from 1280px, 5/7 from 1024–1279px, then stacked. Research is one card column. Experience is three columns at wide layouts, two at 1024–1279px, three at 768–1023px, two below 768px and one below 520px. Each of 3 research and 9 experience entries includes the complete verified description/organisation/date and a visible stock disclaimer. The specified local image mapping is encoded directly in the markup.

Activities uses a compact lead plus four stock-labelled cards: four columns at 1024px, two at 768–1023px, one below 768px.

## Truth and media contract

`js/project-media.js` owns 10 frozen project records, five media slots each: 10 temporary previews and 40 future slots. `index.html` owns the verified page copy and image-card markup. All placeholder imagery is explicitly labelled and does not stand in as evidence. P03’s source is accurately described as a black-and-white steam locomotive / steel machinery in the media manifest and `assets/images/placeholders/SOURCES.md`.

The native project dialog, five-slot browser, loading/future/error states, GIF poster/reduced-motion behavior, lightbox and focus restoration remain owned by `js/main.js`. Card image failures receive a stable solid fallback; they do not cause layout shift.

## Motion, responsiveness and deployment

Motion remains one enhancement-only, bidirectional IntersectionObserver/Web Animations system: WeakMap state, generation cancellation, passive-rAF direction detection, edge arming and reverse upward list staggering. It uses no scroll hijack or layout animation. Content remains visible without JavaScript or animation capability; reduced motion cancels and clears temporary styles.

All controls meet a 44px target, headings balance, prose is pretty-wrapped, dates are semantic `time` elements and long titles/cards can grow rather than clip. Target QA widths: 320, 375, 768, 1024, 1280 and 1440px with no horizontal overflow. All paths are relative and GitHub Pages compatible; no build step is required.
