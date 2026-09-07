# Measured, image-led, assured

## Design contract

This is a light, bounded engineering portfolio. The page sits on `--page` within a centred `site-frame`; its surfaces are quiet and legible, while dark treatment is reserved for hero, Selected Work, image cards and media viewing. There are no remote runtime dependencies, glass panels, glow, broad drop shadows or radius above 10px.

## Runtime tokens

| Token | Value | Use |
| --- | --- | --- |
| `--page` | `#E2E4EA` | outer desktop page |
| `--canvas` | `#EEF0F5` | primary section ground |
| `--surface` | `#FCFCFE` | header/credentials/footer |
| `--surface-lilac` | `#F4EFF8` | career composition |
| `--ink` | `#231F28` | primary text |
| `--muted` | `#635D6A` | secondary text |
| `--line` / `--line-strong` | `#CDC8D4` / `#AFA8B8` | boundaries |
| `--violet` / `--violet-bright` | `#57068C` / `#8900E1` | action and focus accent |
| `--image-scrim` | `rgba(27,19,34,.78)` | persistent image-card contrast |

`assets/fonts/montserrat-variable-latin.woff2` is the display face and `assets/fonts/inter-variable-latin.woff2` is body/utility. They are preloaded and self-hosted with their OFL texts. This follows NYU’s listed Montserrat fallback and NYU Tandon’s Inter use; no restricted Perstare asset or remote font request remains.

## Structure

The sticky header is one clean horizontal desktop bar. It collapses to an accessible disclosure at 960px; click-away, Escape, focus restoration and resize-close stay in `js/main.js`. No calibration rail or Profile navigation destination exists.

The opening is one continuous dark photographic hero: a compact identity/summary grid followed by a credentials strip, with no intervening light profile slab. The identity includes a labelled P10 cryostat placeholder (`Temporary stock image · not profile evidence`) that is explicitly atmospheric rather than profile proof. Credentials retain their exact verified copy and resolve four columns on desktop, two columns from 768–1023px and one column below 520px. At 520–767px the identity and summary stack before the credentials strip.

Selected Work remains six scenes in three paired spreads, with 12 existing project triggers, alternating image/copy arrangement and direction-aware replay motion. Its dark image-led treatment is deliberately distinct from the light register.

The ten project-register controls are directly marked-up `.image-card` buttons with media and copy in separate regions. Real media uses `object-fit: contain` so the complete frame remains visible; stock previews retain their explicit `Temporary stock image · not project evidence` label. Grid: five columns from 1280px, three at 1024–1279px, two at 768–1023px and one below 768px.

`#career` remains one 5/7 Research/Experience composition from 1024px and stacks below it. Research is exactly two one-column, dialog-enabled image cards: Undergraduate Research Assistant — SITE (Apr 2023–May 2026) and Undergraduate Research Assistant — Energy and Propulsion Lab (Nov 2022–Nov 2023). Experience is exactly four reverse-chronological non-image timeline roles: Graduate Intern, Workshop Technician, Teaching Assistant, Computer Programming, and Engineering Mentor. Its violet line and date/content layout carry chronology without a modal or stock-image affordance.

Activities uses a compact lead plus six dialog-enabled, stock-labelled cards: Varsity Jiu-Jitsu, Habitat for Humanity Nepal, Cricket Team Media, Recreational Sport, Chief Track Marshal, and Team Member, Business Development and Engage with AIESEC. It is three columns from 1280px, two at 768–1279px and one below 768px.

## Truth and media contract

`js/project-media.js` owns 10 frozen project records, five default media slots each: 10 temporary previews and 40 future slots. `js/media-library.js` normalises these records and exposes `window.PORTFOLIO_MEDIA`, keyed as `project:01`, `research:site` and `activity:jiujitsu` (with the remaining records generated from the semantic source blocks). A reviewed manifest may replace any key with an arbitrary-length array; an absent key falls back to the existing slots and an explicit empty array means no media. `index.html` owns the verified page copy and card markup. All placeholder imagery is explicitly labelled and does not stand in as evidence. P03’s source is accurately described as a black-and-white steam locomotive / steel machinery in the media manifest and `assets/images/placeholders/SOURCES.md`.

One native `#case-dialog` supports projects, research and activities. Its label, title, organisation/dates, summary and detail blocks are rendered from the active record. Projects retain Brief / Personal contribution / Method / Result / Limitations; research renders Scope / Method / Result / Limitations; activities render Context only. Research contributes 2 triggers / 10 default slots, activities 6 triggers / 30 default slots and projects 10 records / 22 triggers / 50 default slots: 18 dialog-enabled records and 90 default media slots total. Research and activity records are read from semantic source blocks in `index.html`; `js/project-media.js` remains the owner of frozen project media and `js/media-library.js` owns the normalised registry shape. Every item stores `id`, `kind`, `status`, `src`, `type`, dimensions, alt text, caption, `source`, separate `citation` and `credit`, optional poster and optional video tracks; see `MEDIA_GUIDE.md`. The browser retains loading, future, error, GIF poster/reduced-motion behavior, native video controls, one active media node moved into `#lightbox-viewport`, and focus restoration. Card image failures receive a stable solid fallback without layout shift.

## Motion, responsiveness and deployment

Motion remains one enhancement-only, bidirectional IntersectionObserver/Web Animations system: WeakMap state, generation cancellation, passive-rAF direction detection, edge arming and reverse upward list staggering. It uses no scroll hijack or layout animation. Entry buttons only enable during JavaScript initialization; without JavaScript research/activity source content is exposed beneath neutral cards and the experience timeline remains native readable content. Reduced motion cancels and clears temporary styles.

All controls meet a 44px target, headings balance, prose is pretty-wrapped, dates are semantic `time` elements and long titles/cards can grow rather than clip. The desktop frame is 82vw up to 1520px from 1280px upward; the hero stacks through 1023px. Target QA widths: 320, 375, 768, 1024, 1280 and 1440px with no horizontal overflow. All paths are relative and GitHub Pages compatible; no build step is required.

## Ownership and QA

The runtime token owner is `css/styles.css`; this file mirrors accepted values and documents component behavior. `js/media-library.js` owns media normalisation and provenance fields. `js/main.js` owns the shared gallery state machine, generation cancellation, playback preservation, modal focus and scroll locking. Do not add a second card- or route-specific viewer.

Before publishing, run JavaScript syntax checks, open the page with `file://` and a local static server, exercise empty, future, image, GIF and video galleries, test keyboard and backdrop dismissal, and check 320 / 375 / 768 / 1024 / 1280 / 1440px for overflow. Keep `backups/`, private source datasets, unredacted project files and QA fixtures out of a public publisher.
