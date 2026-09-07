# Engineering Portfolio

This folder is ready to publish as a static GitHub Pages site.

## Preview locally

Open `index.html` directly, or serve this folder with a simple local web server.

## Publish with GitHub Pages

1. Create a public GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

Keep private source datasets and unredacted project files out of this repository.

## Media ownership and QA

`js/project-media.js` owns the frozen verified project records. `js/media-library.js`
owns the public `window.PORTFOLIO_MEDIA` registry and its documented schema in
[`MEDIA_GUIDE.md`](MEDIA_GUIDE.md). `js/main.js` owns the shared image/GIF/video
viewer and its loading, retry, keyboard, focus and playback behavior. Use the
registry for reviewed media instead of repeating card or dialog markup edits.

Before publishing, syntax-check the three portfolio scripts and exercise image, future,
empty, GIF and video items from `file://` and a local static server at 320,
375, 768, 1024, 1280 and 1440px. Keep `backups/`, private datasets,
unredacted project files and QA fixtures excluded from the public publisher.
