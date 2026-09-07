/* =========================================================================
   Muhammad Ibrahim: engineering portfolio
   Behaviour layer. No dependencies, no network access, no build step.

   Everything here is progressive enhancement: the page is complete and
   readable with this file blocked. JavaScript adds the sticky-nav state,
   scroll reveal, the record sheet with its figure viewer, and the lightbox.
   ========================================================================= */

(function () {
  'use strict';

  var DATA = window.PORTFOLIO || { records: {}, figures: [], groups: {} };
  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  };

  root.classList.add('has-js');

  /* ------------------------------------------------------- scroll lock */

  var lockCount = 0;
  var lockedScrollY = 0;

  function lockScroll() {
    if (lockCount++) return;
    lockedScrollY = window.scrollY;
    body.classList.add('is-locked');
  }

  function unlockScroll() {
    if (!lockCount || --lockCount) return;
    body.classList.remove('is-locked');
    window.scrollTo({ top: lockedScrollY, behavior: 'auto' });
  }

  /* ------------------------------------------------------- exit transition

     [hidden] flips display:none the instant it is set, which would cut any
     reverse transition off before it starts. So closing pushes the panel to
     its closed visual state through an inline style override first (kept in
     step with whatever .is-closing later gains in the stylesheet), waits for
     that transition to finish (or a safety timeout), then actually hides the
     layer and runs the caller's cleanup. Reduced motion short-circuits to a
     synchronous hide. Shared by all four modal layers. */

  function closeWithExit(layer, panel, closedStyle, done) {
    if (!layer || layer.hidden) { if (done) done(); return; }
    if (panel && panel.classList.contains('is-closing')) return; /* already closing */
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (panel) {
        panel.removeEventListener('transitionend', onEnd);
        panel.classList.remove('is-closing');
        if (closedStyle) {
          Object.keys(closedStyle).forEach(function (prop) { panel.style[prop] = ''; });
        }
      }
      layer.hidden = true;
      if (done) done();
    }
    function onEnd(event) {
      if (event.target === panel) finish();
    }
    if (reduceMotion.matches || !panel || !closedStyle) { finish(); return; }
    panel.classList.add('is-closing');
    panel.addEventListener('transitionend', onEnd);
    window.requestAnimationFrame(function () {
      Object.keys(closedStyle).forEach(function (prop) { panel.style[prop] = closedStyle[prop]; });
    });
    window.setTimeout(finish, 700);
  }

  /* ------------------------------------------------------- focus trap */

  var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,video[controls],[contenteditable],[tabindex]:not([tabindex="-1"])';

  function trap(container, event) {
    if (event.key !== 'Tab') return;
    var items = $$(FOCUSABLE, container).filter(function (el) {
      return el.getClientRects().length > 0 || el === document.activeElement;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------ masthead behaviour */

  var masthead = $('#masthead');
  var navToggle = $('#nav-toggle');
  var nav = $('#primary-nav');
  var navLinks = $$('[data-navlink]');
  var mobileQuery = window.matchMedia('(max-width: 1000px)');

  function setStuck() {
    if (!masthead) return;
    masthead.classList.toggle('is-stuck', window.scrollY > 12);
  }

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !open);
      navToggle.setAttribute('aria-expanded', String(!open));
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });
    document.addEventListener('click', function (event) {
      if (!mobileQuery.matches) return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
    });
    (mobileQuery.addEventListener ? mobileQuery.addEventListener.bind(mobileQuery, 'change')
      : mobileQuery.addListener.bind(mobileQuery))(function () {
      if (!mobileQuery.matches) closeNav();
    });
  }

  /* ------------------------------------------------------ scroll spy */

  var spyTargets = navLinks
    .map(function (link) {
      var id = link.getAttribute('data-navlink');
      var section = document.getElementById(id);
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  /* Section position drives the current nav link via IntersectionObserver
     rather than an offsetTop comparison: offsetTop goes wrong the instant
     #main picks up a transform (every modal open does this), and a fixed
     masthead means there is no scroll-based layout quirk left to work
     around by hand. */
  if (spyTargets.length && 'IntersectionObserver' in window) {
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = spyTargets.filter(function (t) { return t.section === entry.target; })[0];
        if (!match) return;
        match.link.classList.toggle('is-current', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    spyTargets.forEach(function (entry) { spyObserver.observe(entry.section); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      setStuck();
      ticking = false;
    });
  }, { passive: true });
  setStuck();

  /* Scroll reveal (the [data-reveal]/[data-stagger] system, the custom
     cursor, the magnetic hover pull, the bench driver, the catalogue
     preview, the hero flow field, the timeline spine, the clock and the
     masthead progress bar) is motion.js's job, not app.js's: this file
     owns everything functional, motion.js owns everything optional, and
     motion.js early-returns to a single reveal() pass under
     prefers-reduced-motion without app.js needing to know about it. */

  /* ---------------------------------------------------- record sheet */

  var sheet = $('#record-sheet');
  var sheetPanel = sheet ? $('.sheet-panel', sheet) : null;
  var sheetReturn = null;

  /* ------------------------------------ figure viewer (sheet left pane)

     The left pane of the case sheet steps through one record's own plates,
     one at a time. Two stacked <img> layers give a crossfade rather than a
     jump cut; the caption, citation and position line sit in a polite live
     region so the change is announced once, not three times. */

  var figLabel   = $('#figures-label');
  var figSource  = $('#figures-source');
  var figStage   = sheet ? $('.figures-stage', sheet) : null;
  var figZoom    = $('#figures-zoom');
  var figLayers  = [$('#figures-img-a'), $('#figures-img-b')];
  var figPrev    = $('#figures-prev');
  var figNext    = $('#figures-next');
  var figStrip   = $('#figures-strip');
  var figPos     = $('#figures-pos');
  var figCaption = $('#figures-caption');
  var figCite    = $('#figures-cite');
  var figMeta    = $('#figures-live');
  var figDesc    = $('#figures-desc');
  var figEmpty   = $('#figures-empty');

  var sheetFigures = [];   /* the open record's own plate set */
  var figIndex = 0;
  var figLayer = 0;        /* which of the two layers is currently showing */
  var figToken = 0;        /* guards against out-of-order image loads */

  /* Report figures if the record has them, otherwise its single stock
     plate, honestly captioned. Never an empty carousel. */
  function figuresFor(key, record) {
    if (record.evidence) {
      var set = DATA.figures.filter(function (fig) {
        return fig.group === record.evidence;
      });
      if (set.length) return set;
    }
    var plate = (DATA.plates || {})[key];
    return plate ? [plate] : [];
  }

  function paintFigure(dir) {
    var total = sheetFigures.length;
    var fig = sheetFigures[figIndex];
    if (!fig || !figLayers[0] || !figLayers[1]) return;

    var incoming = figLayers[figLayer === 0 ? 1 : 0];
    var outgoing = figLayers[figLayer];
    var offset = (dir || 0) * 18;
    var token = ++figToken;
    var done = false;

    var commit = function () {
      if (done || token !== figToken) return;
      done = true;
      outgoing.style.setProperty('--from', (-offset) + 'px');
      outgoing.classList.remove('is-active');
      incoming.classList.add('is-active');
      figLayer = figLayer === 0 ? 1 : 0;
    };

    incoming.style.setProperty('--from', offset + 'px');
    incoming.alt = '';
    if (fig.w) incoming.width = fig.w;
    if (fig.h) incoming.height = fig.h;
    incoming.onload = commit;
    incoming.onerror = commit;
    incoming.src = fig.src;
    if (incoming.complete) commit();

    if (figPos) {
      figPos.textContent = total > 1 ? 'Figure ' + (figIndex + 1) + ' of ' + total : '';
      figPos.hidden = total < 2;
    }
    if (figCaption) figCaption.textContent = fig.caption || '';
    if (figCite) figCite.textContent = fig.cite || '';
    if (figDesc) figDesc.textContent = fig.alt || '';
    if (figZoom) {
      figZoom.setAttribute('data-lightbox', fig.src);
      figZoom.setAttribute('aria-label', 'Enlarge figure: ' + (fig.caption || 'this plate'));
    }
    if (figStrip) {
      $$('button', figStrip).forEach(function (btn, i) {
        var current = i === figIndex;
        btn.classList.toggle('is-current', current);
        if (current) btn.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
    }
  }

  function stepFigure(delta) {
    var total = sheetFigures.length;
    if (total < 2) return;
    figIndex = (figIndex + delta + total) % total;
    paintFigure(delta > 0 ? 1 : -1);
  }

  function loadFigures(key, record) {
    sheetFigures = figuresFor(key, record);
    figIndex = 0;

    var total = sheetFigures.length;
    var many = total > 1;

    if (figLabel) figLabel.textContent = total ? (record.evidence ? 'Project figures' : 'Reference image') : 'Figures';
    if (figSource) {
      figSource.textContent = !total ? ''
        : record.evidence ? (total + (total === 1 ? ' figure' : ' figures'))
        : 'No project figures';
    }
    if (figStage) figStage.hidden = !total;
    if (figMeta) figMeta.hidden = !total;
    if (figEmpty) figEmpty.hidden = !!total;
    if (figPrev) figPrev.hidden = !many;
    if (figNext) figNext.hidden = !many;
    if (figZoom) figZoom.hidden = !total;

    /* Filmstrip: one real, focusable thumbnail button per figure, so a
       5-to-14-figure project turns into an actual index instead of a
       "next, next, next" carousel. Rebuilt fresh on every open. */
    if (figStrip) {
      figStrip.textContent = '';
      figStrip.hidden = !many;
      if (many) {
        sheetFigures.forEach(function (fig, i) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-label', 'Figure ' + (i + 1) + ': ' + (fig.caption || ''));
          var thumb = document.createElement('img');
          thumb.src = fig.src;
          thumb.alt = '';
          thumb.loading = 'lazy';
          thumb.decoding = 'async';
          btn.appendChild(thumb);
          btn.addEventListener('click', function () {
            if (i === figIndex) return;
            var dir = i > figIndex ? 1 : -1;
            figIndex = i;
            paintFigure(dir);
          });
          figStrip.appendChild(btn);
        });
      }
    }

    figLayers.forEach(function (layer) {
      if (!layer) return;
      layer.onload = null;
      layer.onerror = null;
      layer.classList.remove('is-active');
      layer.removeAttribute('src');
    });
    figLayer = 0;
    if (total) paintFigure(0);
  }

  if (figPrev) figPrev.addEventListener('click', function () { stepFigure(-1); });
  if (figNext) figNext.addEventListener('click', function () { stepFigure(1); });

  /* --------------------------------------- video documentation block

     Only one record carries video, so the clips are not forced through the
     shared figure carousel. They render as a captioned block at the foot of
     the written record, which already scrolls on every screen size. Every
     clip is user-initiated: controls, no autoplay, metadata preload only,
     so opening a case sheet never starts playback or a download. */

  var videoHost = $('#record-videos');

  function loadVideos(record) {
    if (!videoHost) return;
    var list = record.videos || [];

    /* Stop and release anything still loaded from the previous record. */
    $$('video', videoHost).forEach(function (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    });
    videoHost.textContent = '';
    videoHost.hidden = !list.length;
    if (!list.length) return;

    var head = document.createElement('h3');
    head.className = 'sheet-videos-head';
    head.textContent = 'Video documentation';
    videoHost.appendChild(head);

    list.forEach(function (item) {
      var wrap = document.createElement('figure');
      wrap.className = 'sheet-video';

      var media = document.createElement('video');
      media.controls = true;
      media.preload = 'metadata';
      media.setAttribute('playsinline', '');
      if (item.poster) media.poster = item.poster;
      if (item.w) media.width = item.w;
      if (item.h) media.height = item.h;
      media.src = item.src;
      wrap.appendChild(media);

      var cap = document.createElement('figcaption');
      var text = document.createElement('span');
      text.className = 'figure-caption';
      text.textContent = item.caption || '';
      cap.appendChild(text);
      wrap.appendChild(cap);
      videoHost.appendChild(wrap);
    });
  }

  /* ------------------------------------------- source document links

     A short list of the original PDFs behind a record (reports, drawing
     sheets, technical decks). Every link opens the file itself, in a new
     tab, never a download prompt the visitor didn't ask for. Sits near the
     top of the case sheet so it is the first thing offered. */

  var pdfHost = $('#record-pdfs');

  function loadPdfs(record) {
    if (!pdfHost) return;
    var list = record.pdfs || [];
    pdfHost.textContent = '';
    pdfHost.hidden = !list.length;
    if (!list.length) return;

    var ul = document.createElement('ul');
    ul.className = 'sheet-pdf-list';
    list.forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'sheet-pdf-link';
      a.href = item.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = (item.label || 'Document').replace(/\s*\(PDF\)\s*$/i, '');
      li.appendChild(a);
      ul.appendChild(li);
    });
    pdfHost.appendChild(ul);
  }

  /* ---------------------------------------------- video scroll notice

     A single-line pointer shown near the top of the sheet when a record
     has video further down the page, so it isn't missed. */

  var videoNoticeHost = $('#record-video-notice');

  function loadVideoNotice(record) {
    if (!videoNoticeHost) return;
    var has = !!(record.videos && record.videos.length);
    videoNoticeHost.hidden = !has;
    videoNoticeHost.textContent = has ? 'Video further down the page.' : '';
  }

  function renderRecord(key) {
    var record = DATA.records[key];
    if (!record) return false;

    $('#record-kind').textContent = record.kind;
    var kicker = $('#record-kicker');
    kicker.textContent = record.kicker || '';
    kicker.hidden = !record.kicker;
    $('#record-title').textContent = record.title;

    var org = $('#record-org');
    org.textContent = record.org || '';
    org.hidden = !record.org;

    var summary = $('#record-summary');
    summary.textContent = record.summary || '';
    summary.hidden = !record.summary;

    var host = $('#record-details');
    host.textContent = '';
    (record.details || []).forEach(function (block) {
      var wrap = document.createElement('div');
      wrap.className = 'sheet-block';
      wrap.setAttribute('data-label', block.label);
      var head = document.createElement('h3');
      head.textContent = block.label;
      var text = document.createElement('p');
      text.textContent = block.text;
      wrap.appendChild(head);
      wrap.appendChild(text);
      host.appendChild(wrap);
    });

    loadFigures(key, record);
    loadVideos(record);
    loadPdfs(record);
    loadVideoNotice(record);
    return true;
  }

  function openSheet(key, opener) {
    if (!sheet || !renderRecord(key)) return;
    sheetReturn = opener || document.activeElement;
    sheet.hidden = false;
    lockScroll();
    var close = $('.sheet-close', sheet);
    if (close) close.focus();
    /* The record column scrolls on wide screens, the whole panel on narrow
       ones; reset both so every sheet opens at the top. */
    $('.sheet-body', sheet).scrollTop = 0;
    if (sheetPanel) sheetPanel.scrollTop = 0;
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    /* A clip left playing must not keep talking behind a closed sheet. */
    if (videoHost) $$('video', videoHost).forEach(function (el) { el.pause(); });
    closeWithExit(sheet, sheetPanel, { clipPath: 'inset(0 0 100% 0)' }, function () {
      unlockScroll();
      if (sheetReturn && document.contains(sheetReturn)) sheetReturn.focus();
      sheetReturn = null;
    });
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-open-record]');
    if (opener) {
      event.preventDefault();
      var key = opener.getAttribute('data-open-record');
      /* Activities carry photographs and clips rather than report figures, so
         they open the activity sheet instead of the project case sheet. Any
         record without a media set still falls through to the case sheet. */
      if ((DATA.activityMedia || {})[key]) openActivity(key, opener);
      else openSheet(key, opener);
      return;
    }
    if (event.target.closest('[data-close-sheet]')) closeSheet();
  });

  /* -------------------------------------------------------- lightbox */

  var lightbox = $('#lightbox');
  var lightboxPanel = lightbox ? $('.lightbox-panel', lightbox) : null;
  var lightboxImage = $('#lightbox-image');
  var lightboxReturn = null;
  var sequence = [];
  var cursor = 0;

  function showFigure(index) {
    if (!sequence.length) return;
    cursor = (index + sequence.length) % sequence.length;
    var fig = sequence[cursor];
    lightboxImage.src = fig.src;
    lightboxImage.alt = fig.alt;
    lightboxImage.width = fig.w;
    lightboxImage.height = fig.h;
    $('#lightbox-caption').textContent = fig.caption;
    $('#lightbox-cite').textContent = fig.cite;
    $('#lightbox-count').textContent =
      'Figure ' + (cursor + 1) + ' of ' + sequence.length +
      (DATA.groups[fig.group] ? ' · ' + DATA.groups[fig.group] : '');
    var many = sequence.length > 1;
    $('#lightbox-prev').hidden = !many;
    $('#lightbox-next').hidden = !many;
  }

  function openLightbox(src, opener) {
    if (!lightbox) return;
    var match = function (fig) { return fig.src === src; };
    /* Report figures enlarge with the rest of their group; a record's stock
       plate is not in that register, so it enlarges on its own. */
    var pool = DATA.figures;
    var start = pool.findIndex(match);
    if (start < 0) {
      pool = sheetFigures;
      start = pool.findIndex(match);
    }
    if (start < 0) return;
    var group = pool[start].group;
    sequence = group
      ? pool.filter(function (fig) { return fig.group === group; })
      : [pool[start]];
    var within = sequence.findIndex(match);
    lightboxReturn = opener || document.activeElement;
    lightbox.hidden = false;
    lockScroll();
    showFigure(within < 0 ? 0 : within);
    var close = $('.sheet-close', lightbox);
    if (close) close.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    closeWithExit(lightbox, lightboxPanel, { transform: 'scale(.975)', opacity: '0' }, function () {
      unlockScroll();
      lightboxImage.removeAttribute('src');
      if (lightboxReturn && document.contains(lightboxReturn)) lightboxReturn.focus();
      lightboxReturn = null;
    });
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-lightbox]');
    if (opener) {
      event.preventDefault();
      openLightbox(opener.getAttribute('data-lightbox'), opener);
      return;
    }
    if (event.target.closest('[data-close-lightbox]')) closeLightbox();
  });

  var prev = $('#lightbox-prev');
  var next = $('#lightbox-next');
  if (prev) prev.addEventListener('click', function () { showFigure(cursor - 1); });
  if (next) next.addEventListener('click', function () { showFigure(cursor + 1); });

  /* ------------------------------------------- activity sheet + viewer

     Activities are photographic records, so they get their own component
     rather than the project case sheet's one-plate carousel: the written
     record across the top, an images-only rail on the left, and a mixed
     gallery of photographs and clips in the middle. Everything above this
     point (the case sheet and its lightbox) is untouched. */

  var asheet      = $('#activity-sheet');
  var asheetPanel = asheet ? $('.asheet-panel', asheet) : null;
  var asheetStage = asheet ? $('.asheet-stage', asheet) : null;
  var asheetGal   = asheet ? $('.asheet-gallery', asheet) : null;
  var aRail       = $('#asheet-rail');
  var aRailItems  = $('#asheet-rail-items');
  var aGrid       = $('#asheet-grid');
  var aCount      = $('#asheet-count');
  var aReturn     = null;

  /* One ordered list per open record: gallery first, then the rail, so the
     viewer can walk every frame of an activity without a dead end. */
  var mediaList = [];
  var mediaKey = null;
  var mediaCols = 0;

  function columnCount() {
    var w = window.innerWidth;
    if (w <= 700) return 2;
    if (w <= 1180) return 3;
    return 4;
  }

  /* Tile shapes are decided here rather than measured: a landscape frame
     takes two columns, an upright one takes a single column, and each tile
     carries the ratio that keeps the row heights close to even. A tile is
     only ever narrowed to fit the space left in its row, so the gallery
     keeps the manifest's order exactly. */
  function planTile(item, index, remaining, cols, solo, videoForward) {
    var wide = item.h ? (item.w / item.h) >= 1.15 : true;
    var natural = item.fit === 'contain';
    if (solo) {
      return { span: 1, ratio: natural ? (item.w + ' / ' + item.h) : (wide ? '3 / 2' : '4 / 5') };
    }
    /* Opt-in per activity: the clips are the record here, so they take a wide
       tile at their own 16/9 rather than the shared letterbox strip. */
    if (videoForward && item.kind === 'video') {
      var vspan = cols >= 4 ? 2 : cols;
      if (vspan > remaining) vspan = remaining;
      return { span: vspan, ratio: vspan > 1 ? '16 / 9' : '4 / 3' };
    }
    var span = natural ? Math.min(2, cols) : (wide ? 2 : 1);
    /* A set that is all landscape would otherwise come out as identical
       two-up rows, so every fifth frame drops to a single square column and
       the rhythm breaks up. */
    if (span === 2 && !natural && index % 5 === 4) span = 1;
    if (span > remaining) span = remaining;
    var ratio;
    if (natural) ratio = item.w + ' / ' + item.h;
    /* A 2-up tile is already wide enough to read as a feature frame, so it
       keeps the photograph's own proportions rather than a fixed panoramic
       ratio -- forcing every landscape frame into the same wide strip was
       cropping the top and bottom off ordinary 4:3/3:2 photographs and
       leaving the shorter tile stranded above dead space in its row. */
    else if (span > 1 && item.h) ratio = item.w + ' / ' + item.h;
    else if (span > 1) ratio = (span * 8) + ' / 5';
    else ratio = wide ? '1 / 1' : '4 / 5';
    return { span: span, ratio: ratio };
  }

  function mediaTile(item, index, shape) {
    var tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'asheet-tile' + (item.kind === 'video' ? ' is-video' : '');
    tile.setAttribute('data-media-index', String(index));
    if (item.fit) tile.setAttribute('data-fit', item.fit);
    if (shape) {
      tile.style.setProperty('--span', String(shape.span));
      tile.style.setProperty('--tar', shape.ratio);
    }
    tile.setAttribute('aria-label',
      (item.kind === 'video' ? 'Play clip: ' : 'Enlarge photograph: ') + (item.caption || ''));
    tile.setAttribute('data-cursor', item.kind === 'video' ? 'PLAY' : 'ENLARGE');

    var img = document.createElement('img');
    img.src = item.poster || item.src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    tile.appendChild(img);

    if (item.kind === 'video') {
      var badge = document.createElement('span');
      badge.className = 'tile-play';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = 'Clip';
      tile.appendChild(badge);
    }
    return tile;
  }

  function paintGallery(media) {
    if (!aGrid) return;
    var items = media.gallery || [];
    var cols = columnCount();
    var solo = items.length === 1;
    var vf = media.layout === 'video-forward';
    mediaCols = cols;

    aGrid.textContent = '';
    aGrid.classList.toggle('is-solo', solo);
    aGrid.classList.toggle('is-video-forward', vf);
    aGrid.style.setProperty('--acols', String(cols));

    var remaining = cols;
    items.forEach(function (item, i) {
      var shape = planTile(item, i, remaining, cols, solo, vf);
      aGrid.appendChild(mediaTile(item, i, shape));
      if (!solo) {
        remaining -= shape.span;
        if (remaining <= 0) remaining = cols;
      }
    });
  }

  /* The rail auto-scrolls in a slow, seamless loop rather than sitting
     there waiting to be scrolled by hand: the item list is painted twice
     back to back and the CSS animation moves exactly one copy's length, so
     the join between the end and the restart is invisible. A single item
     has nothing to loop past, so it just sits still. */
  function paintRail(media) {
    if (!aRail || !aRailItems) return;
    var items = media.rail || [];
    aRailItems.textContent = '';
    aRailItems.style.removeProperty('--rail-duration');
    /* No rail rather than an empty one: AIESEC has a single document and
       nothing to put alongside it. */
    aRail.hidden = !items.length;
    if (asheetStage) asheetStage.classList.toggle('no-rail', !items.length);
    if (!items.length) return;

    var offset = (media.gallery || []).length;
    var loop = items.length > 1;
    aRailItems.classList.toggle('is-looping', loop);
    if (loop) aRailItems.style.setProperty('--rail-duration', Math.max(items.length * 5, 16) + 's');

    var passes = loop ? 2 : 1;
    for (var pass = 0; pass < passes; pass++) {
      items.forEach(function (item, i) {
        var tile = mediaTile(item, offset + i, { span: 1, ratio: '3 / 4' });
        if (pass > 0) {
          /* The second copy is purely visual continuation of the loop. */
          tile.setAttribute('aria-hidden', 'true');
          tile.tabIndex = -1;
        }
        aRailItems.appendChild(tile);
      });
    }
  }

  function countLine(media) {
    var all = (media.gallery || []).concat(media.rail || []);
    var vids = all.filter(function (it) { return it.kind === 'video'; }).length;
    var docs = all.filter(function (it) { return it.fit === 'contain'; }).length;
    var stills = all.length - vids - docs;
    var parts = [];
    if (stills) parts.push(stills + (stills === 1 ? ' photograph' : ' photographs'));
    if (docs) parts.push(docs + (docs === 1 ? ' document' : ' documents'));
    if (vids) parts.push(vids + (vids === 1 ? ' clip' : ' clips'));
    return parts.join(' · ');
  }

  function openActivity(key, opener) {
    var record = DATA.records[key];
    var media = (DATA.activityMedia || {})[key];
    if (!asheet || !record || !media) return;

    $('#asheet-kind').textContent = record.kind || 'Activity';
    var kicker = $('#asheet-kicker');
    kicker.textContent = record.kicker || '';
    kicker.hidden = !record.kicker;
    $('#asheet-title').textContent = record.title;
    var org = $('#asheet-org');
    org.textContent = record.org || '';
    org.hidden = !record.org;
    $('#asheet-summary').textContent = record.summary || '';

    var notes = $('#asheet-notes');
    notes.textContent = '';
    (record.details || []).forEach(function (block) {
      var wrap = document.createElement('div');
      wrap.className = 'asheet-note';
      var head = document.createElement('h3');
      head.textContent = block.label;
      var text = document.createElement('p');
      text.textContent = block.text;
      wrap.appendChild(head);
      wrap.appendChild(text);
      notes.appendChild(wrap);
    });

    paintRail(media);
    paintGallery(media);
    if (aCount) aCount.textContent = countLine(media);
    var empty = $('#asheet-empty');
    if (empty) empty.hidden = !!((media.gallery || []).length || (media.rail || []).length);

    mediaKey = key;
    mediaList = (media.gallery || []).concat(media.rail || []);

    aReturn = opener || document.activeElement;
    asheet.hidden = false;
    lockScroll();
    if (asheetGal) asheetGal.scrollTop = 0;
    if (aRail) aRail.scrollTop = 0;
    var close = $('.sheet-close', asheet);
    if (close) close.focus();
  }

  function closeActivity() {
    if (!asheet || asheet.hidden) return;
    closeWithExit(asheet, asheetPanel, { clipPath: 'inset(0 0 100% 0)' }, function () {
      unlockScroll();
      if (aReturn && document.contains(aReturn)) aReturn.focus();
      aReturn = null;
      mediaKey = null;
    });
  }

  /* The bento is planned against a column count, so a resize that changes
     that count re-lays the gallery rather than leaving holes in it. */
  var relayout = null;
  window.addEventListener('resize', function () {
    if (!asheet || asheet.hidden || !mediaKey) return;
    if (relayout) window.clearTimeout(relayout);
    relayout = window.setTimeout(function () {
      if (!mediaKey || columnCount() === mediaCols) return;
      paintGallery((DATA.activityMedia || {})[mediaKey] || {});
    }, 160);
  }, { passive: true });

  /* --------------------------------------------------- media viewer */

  var mbox      = $('#mediabox');
  var mboxPanel = mbox ? $('.mediabox-panel', mbox) : null;
  var mboxImage = $('#mediabox-image');
  var mboxVideo = $('#mediabox-video');
  var mboxCount = $('#mediabox-count');
  var mboxCap   = $('#mediabox-caption');
  var mboxCite  = $('#mediabox-cite');
  var mboxReturn = null;
  var mboxAt = 0;

  /* A clip must never keep talking once it is off screen, and must not stay
     buffered behind a closed viewer either. */
  function releaseClip() {
    if (!mboxVideo) return;
    $$('video', mboxVideo).forEach(function (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    });
    mboxVideo.textContent = '';
    mboxVideo.hidden = true;
  }

  function showMedia(index) {
    var total = mediaList.length;
    if (!total || !mbox) return;
    mboxAt = (index + total) % total;
    var item = mediaList[mboxAt];
    var many = total > 1;

    releaseClip();

    if (item.kind === 'video') {
      if (mboxImage) { mboxImage.hidden = true; mboxImage.removeAttribute('src'); mboxImage.alt = ''; }
      var clip = document.createElement('video');
      clip.controls = true;
      clip.preload = 'metadata';
      clip.setAttribute('playsinline', '');
      if (item.poster) clip.poster = item.poster;
      if (item.w) clip.width = item.w;
      if (item.h) clip.height = item.h;
      clip.src = item.src;
      mboxVideo.appendChild(clip);
      mboxVideo.hidden = false;
      /* Opening a clip is a click, so playback with sound is allowed here.
         The track is never muted; if the browser still refuses, the poster
         and the controls are already in place. */
      var started = clip.play();
      if (started && started.catch) started.catch(function () {});
    } else if (mboxImage) {
      mboxImage.src = item.src;
      mboxImage.alt = item.caption || '';
      if (item.w) mboxImage.width = item.w;
      if (item.h) mboxImage.height = item.h;
      mboxImage.hidden = false;
    }

    if (mboxCap) mboxCap.textContent = item.caption || '';
    if (mboxCite) {
      mboxCite.textContent = item.kind === 'video' ? 'Clip' : (item.fit === 'contain' ? 'Document' : 'Photograph');
    }
    if (mboxCount) mboxCount.textContent = (mboxAt + 1) + ' of ' + total;

    $('#mediabox-prev').hidden = !many;
    $('#mediabox-next').hidden = !many;
    /* The side zones stand down for a clip: that space belongs to its own
       transport controls. */
    var zones = item.kind !== 'video' && many;
    $('#mediabox-zone-prev').hidden = !zones;
    $('#mediabox-zone-next').hidden = !zones;
  }

  function openMedia(index, opener) {
    if (!mbox || !mediaList.length) return;
    mboxReturn = opener || document.activeElement;
    mbox.hidden = false;
    lockScroll();
    showMedia(index);
    var close = $('.sheet-close', mbox);
    if (close) close.focus();
  }

  function closeMedia() {
    if (!mbox || mbox.hidden) return;
    /* A playing clip must not keep talking behind a closed viewer. */
    releaseClip();
    closeWithExit(mbox, mboxPanel, { transform: 'scale(.975)', opacity: '0' }, function () {
      if (mboxImage) { mboxImage.hidden = true; mboxImage.removeAttribute('src'); }
      unlockScroll();
      if (mboxReturn && document.contains(mboxReturn)) mboxReturn.focus();
      mboxReturn = null;
    });
  }

  document.addEventListener('click', function (event) {
    var tile = event.target.closest('[data-media-index]');
    if (tile) {
      event.preventDefault();
      openMedia(parseInt(tile.getAttribute('data-media-index'), 10) || 0, tile);
      return;
    }
    if (event.target.closest('#mediabox-zone-prev')) { showMedia(mboxAt - 1); return; }
    if (event.target.closest('#mediabox-zone-next')) { showMedia(mboxAt + 1); return; }
    if (event.target.closest('[data-close-mediabox]')) { closeMedia(); return; }
    if (event.target.closest('[data-close-activity]')) closeActivity();
  });

  var mboxPrev = $('#mediabox-prev');
  var mboxNext = $('#mediabox-next');
  if (mboxPrev) mboxPrev.addEventListener('click', function () { showMedia(mboxAt - 1); });
  if (mboxNext) mboxNext.addEventListener('click', function () { showMedia(mboxAt + 1); });

  /* Key handling is bound at document level so it works no matter where
     focus currently sits, then delegated to whichever layer is open. The
     arrow keys are never claimed while every layer is closed, so ordinary
     scrolling of the page is untouched. */
  function isTypingTarget(el) {
    if (!el) return false;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable;
  }

  document.addEventListener('keydown', function (event) {
    /* Topmost layer first: the media viewer sits over the activity sheet,
       which sits over the page. */
    if (mbox && !mbox.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closeMedia(); return; }
      if (!isTypingTarget(event.target) && mediaList.length > 1) {
        if (event.key === 'ArrowLeft') { event.preventDefault(); showMedia(mboxAt - 1); return; }
        if (event.key === 'ArrowRight') { event.preventDefault(); showMedia(mboxAt + 1); return; }
      }
      if (mboxPanel) trap(mboxPanel, event);
      return;
    }
    if (asheet && !asheet.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closeActivity(); return; }
      if (asheetPanel) trap(asheetPanel, event);
      return;
    }
    if (lightbox && !lightbox.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showFigure(cursor - 1); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); showFigure(cursor + 1); return; }
      if (lightboxPanel) trap(lightboxPanel, event);
      return;
    }
    if (sheet && !sheet.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closeSheet(); return; }
      if (!isTypingTarget(event.target) && sheetFigures.length > 1) {
        if (event.key === 'ArrowLeft') { event.preventDefault(); stepFigure(-1); return; }
        if (event.key === 'ArrowRight') { event.preventDefault(); stepFigure(1); return; }
      }
      if (sheetPanel) trap(sheetPanel, event);
    }
  });

  /* ----------------------------------------------- education card photos

     Each education card that carries a photo stack (.tr-bg) crossfades
     between its images every 30 seconds, so the card is never stuck on a
     single frame. Left alone under reduced motion, where it just shows
     the first photo. */

  $$('.tr-bg[data-bg-rotate]').forEach(function (stack) {
    var imgs = $$('img', stack);
    if (imgs.length < 2 || reduceMotion.matches) return;
    var at = 0;
    setInterval(function () {
      imgs[at].classList.remove('is-active');
      at = (at + 1) % imgs.length;
      imgs[at].classList.add('is-active');
    }, 30000);
  });
}());
