# Portfolio media guide

`js/media-library.js` is the single media-manifest entry point. It exposes
`window.PORTFOLIO_MEDIA` after `js/project-media.js` and before `js/main.js`.
For a reviewed production manifest, define `window.PORTFOLIO_MEDIA_OVERRIDES`
immediately before the media-library script (or replace the `reviewedMedia`
object at the marked line in that file). For example, assigning
`reviewedMedia['project:01']` to a new array replaces all five defaults, while
`reviewedMedia['project:01'] = []` intentionally clears that gallery. The
override is normalised and frozen with the generated registry.
The gallery resolves a key in this order:

1. A present registry key wins, including an explicit `[]`.
2. An absent key falls back to the existing project or semantic source slots.
3. Fallback records retain five default slots (one reviewed preview plus four
   future slots) until a reviewed manifest replaces them.

Keys use the record namespace and stable id: `project:01`, `research:site`,
`research:energy`, `activity:jiujitsu`, `activity:habitat`, `activity:cricket`,
`activity:sport`, `activity:marshal`, and `activity:aiesec`.

## Schema v1

Each array item has this shape. Empty strings and `null` mean that provenance
or an asset has not been supplied; do not fill those fields with guesses.

```js
{
  id: 'project-01-01',
  kind: 'image',                 // image | gif | video | slot
  status: 'temporary-preview',   // temporary-preview | evidence | ready | future | error
  src: 'assets/images/projects/p01-overview.jpg',
  type: 'image/jpeg',
  width: 1920,
  height: 1080,
  alt: 'Descriptive text for the visible frame.',
  caption: 'What this frame shows and what it does not prove.',
  source: {
    title: 'Source collection or publication',
    page: 'Reviewed page or document title',
    figure: 'Figure, plate or filename when applicable',
    section: 'Section or chapter when applicable',
    url: null                    // only a reviewed public URL
  },
  citation: {
    label: 'Evidence citation label',
    url: null                    // only a reviewed public URL
  },
  credit: {
    creator: 'Creator or rights holder',
    license: 'License or rights statement',
    url: null                    // license or creator page when reviewed
  },
  poster: {                      // required for static GIF/video thumbnails
    src: 'assets/images/projects/p01-poster.jpg',
    type: 'image/jpeg',
    width: 1920,
    height: 1080,
    alt: 'Static poster description.',
    caption: 'Static poster caption.',
    source: { title: '', page: '', figure: '', section: '', url: null },
    citation: { label: '', url: null },
    credit: { creator: '', license: '', url: null }
  },
  tracks: [{
    src: 'assets/captions/p01-en.vtt',
    kind: 'captions',
    srclang: 'en',
    label: 'English'
  }]
}
```

`poster` and `tracks` are optional properties. A GIF without a poster is
reported as unavailable until the visitor explicitly chooses `Play
animation`; it never appears as a broken or animated thumbnail by default.
Video uses native controls, `playsinline`, metadata preload, no autoplay and
the optional `<track>` entries. A future slot has `kind: 'slot'`, `status:
'future'`, `src: null`, and a clear caption explaining that no asset has been
supplied.

## Provenance rules

`source` describes where an asset came from; `citation` identifies evidence
that the asset supports; `credit` attributes the creator and license. They are
separate on purpose. A temporary stock preview is not project, research or
activity evidence: use `status: 'temporary-preview'` and a caption that says
so, even when a public source and credit are recorded. Only add public URLs
that have been reviewed and approved for publication. Private documents,
unredacted source files, backups and local QA fixtures do not belong in a
published manifest.

## Viewer contract

The shared viewer uses one active `<img>` or `<video>` node. It moves that
node between `#media-viewport` and `#lightbox-viewport`; it never duplicates
playback. Captions and source text are rendered outside the image and may wrap
naturally. Full frames use `object-fit: contain` in cards, thumbnails, the
stage and the lightbox. `main.js` owns loading/error/timeout/retry state,
generation cancellation, focus restoration, scroll locking, GIF controls and
video state preservation.
