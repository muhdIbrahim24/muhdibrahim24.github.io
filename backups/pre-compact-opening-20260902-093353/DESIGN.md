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

`#career` remains one 5/7 Research/Experience composition from 1024px and stacks below it. Research is exactly two one-column, dialog-enabled image cards: Undergraduate Research Assistant — SITE (Apr 2023–May 2026) and Undergraduate Research Assistant — Energy and Propulsion Lab (Nov 2022–Nov 2023). Experience is exactly four reverse-chronological non-image timeline roles: Graduate Intern, Workshop Technician, Teaching Assistant, Computer Programming, and Engineering Mentor. Its violet line and date/content layout carry chronology without a modal or stock-image affordance.

Activities uses a compact lead plus six dialog-enabled, stock-labelled cards: Varsity Jiu-Jitsu, Habitat for Humanity Nepal, Cricket Team Media, Recreational Sport, Chief Track Marshal, and Team Member, Business Development and Engage with AIESEC. It is three columns from 1280px, two at 768–1279px and one below 768px.

## Truth and media contract

`js/project-media.js` owns 10 frozen project records, five media slots each: 10 temporary previews and 40 future slots. `index.html` owns the verified page copy and image-card markup. All placeholder imagery is explicitly labelled and does not stand in as evidence. P03’s source is accurately described as a black-and-white steam locomotive / steel machinery in the media manifest and `assets/images/placeholders/SOURCES.md`.

One native `#case-dialog` supports projects, research and activities. Its label, title, organisation/dates, summary and detail blocks are rendered from the active record. Projects retain Brief / Personal contribution / Method / Result / Limitations; research renders Scope / Method / Result / Limitations; activities render Context only. Research contributes 2 triggers / 10 slots, activities 6 triggers / 30 slots and projects 10 records / 22 triggers / 50 slots: 18 dialog-enabled records and 90 media slots total. Research and activity records are read from semantic source blocks in `index.html`; `js/project-media.js` remains the owner of frozen project media. The browser retains loading/future/error states, GIF poster/reduced-motion behavior, lightbox and focus restoration. Card image failures receive a stable solid fallback without layout shift.

## Motion, responsiveness and deployment

Motion remains one enhancement-only, bidirectional IntersectionObserver/Web Animations system: WeakMap state, generation cancellation, passive-rAF direction detection, edge arming and reverse upward list staggering. It uses no scroll hijack or layout animation. Entry buttons only enable during JavaScript initialization; without JavaScript research/activity source content is exposed beneath neutral cards and the experience timeline remains native readable content. Reduced motion cancels and clears temporary styles.

All controls meet a 44px target, headings balance, prose is pretty-wrapped, dates are semantic `time` elements and long titles/cards can grow rather than clip. Target QA widths: 320, 375, 768, 1024, 1280 and 1440px with no horizontal overflow. All paths are relative and GitHub Pages compatible; no build step is required.
