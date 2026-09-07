# Project media slots

This directory is reserved for verified portfolio media. Keep directory and file names lower-case: `p01` through `p10` map to the ten project keys in `js/project-media.js`.

Each project has five ordered slots:

- `01` overview or primary evidence
- `02` analysis or process
- `03` test or iteration
- `04` result or detail
- `05` supplementary evidence

Example filenames are `assets/images/projects/p01/p01-01-overview.jpg`, `assets/images/projects/p01/p01-02-analysis.png`, `assets/images/projects/p01/p01-03-test.gif`, and the required reduced-motion poster `assets/images/projects/p01/p01-03-test-poster.webp`. Use only `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, or `.gif` media. Do not create empty project directories; create a directory only when it contains a supplied asset.

Do not add borrowed, stock, illustrative, or fake project imagery. The current local temporary previews stay in `assets/images/placeholders/` and are documented by the unchanged `SOURCES.md`; they are not portfolio evidence.

When a verified file is supplied, update its manifest entry with the real relative `src`, MIME type, pixel `width` and `height`, focal point, truthful specific `alt`, and a useful `caption`. Keep future slots as honest null-source objects until an asset is actually supplied. A GIF must include a static poster object (`src`, accepted image `type`, real dimensions, and `alt`) so reduced-motion users have a truthful still; without a poster, the GIF must not be requested and the UI must say “Animated media paused. Static preview not supplied.”
