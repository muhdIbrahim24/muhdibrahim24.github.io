/* =========================================================================
   Muhammad Ibrahim — engineering portfolio
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
    var bar = window.innerWidth - root.clientWidth;
    if (bar > 0) body.style.paddingRight = bar + 'px';
    body.classList.add('is-locked');
  }

  function unlockScroll() {
    if (!lockCount || --lockCount) return;
    body.classList.remove('is-locked');
    body.style.paddingRight = '';
    window.scrollTo({ top: lockedScrollY, behavior: 'auto' });
  }

  /* ------------------------------------------------------- focus trap */

  var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

  function trap(container, event) {
    if (event.key !== 'Tab') return;
    var items = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
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

  function updateSpy() {
    if (!spyTargets.length) return;
    var line = window.scrollY + window.innerHeight * 0.32;
    var active = null;
    spyTargets.forEach(function (entry) {
      if (entry.section.offsetTop <= line) active = entry;
    });
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 4) {
      active = spyTargets[spyTargets.length - 1];
    }
    spyTargets.forEach(function (entry) {
      entry.link.classList.toggle('is-current', entry === active);
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      setStuck();
      updateSpy();
      ticking = false;
    });
  }, { passive: true });
  setStuck();
  updateSpy();

  /* ---------------------------------------------------- scroll reveal */

  var revealables = $$('[data-reveal]');

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
        var index = Math.min(siblings.indexOf(entry.target), 5);
        entry.target.style.setProperty('--reveal-delay', (index * 55) + 'ms');
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { observer.observe(el); });
  }

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
  var figRailBox = sheet ? $('.figures-rail', sheet) : null;
  var figZoom    = $('#figures-zoom');
  var figLayers  = [$('#figures-img-a'), $('#figures-img-b')];
  var figPrev    = $('#figures-prev');
  var figNext    = $('#figures-next');
  var figRail    = $('#figures-rail');
  var figPos     = $('#figures-pos');
  var figCaption = $('#figures-caption');
  var figCite    = $('#figures-cite');
  var figMeta    = $('#figures-live');
  var figDesc    = $('#figures-desc');
  var figEmpty   = $('#figures-empty');
  var figHint    = $('#figures-hint');

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
    if (figRail) figRail.style.width = (((figIndex + 1) / total) * 100) + '%';
    if (figZoom) {
      figZoom.setAttribute('data-lightbox', fig.src);
      figZoom.setAttribute('aria-label', 'Enlarge figure: ' + (fig.caption || 'this plate'));
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

    if (figLabel) figLabel.textContent = total ? (record.evidence ? 'Report figures' : 'Reference image') : 'Figures';
    if (figSource) {
      figSource.textContent = !total ? ''
        : record.evidence ? (total + (total === 1 ? ' plate' : ' plates'))
        : 'No report figures';
    }
    if (figStage) figStage.hidden = !total;
    if (figMeta) figMeta.hidden = !total;
    if (figEmpty) figEmpty.hidden = !!total;
    if (figHint) figHint.hidden = !many;
    if (figRailBox) figRailBox.hidden = !many;
    if (figPrev) figPrev.hidden = !many;
    if (figNext) figNext.hidden = !many;
    if (figZoom) figZoom.hidden = !total;

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

    $('#record-summary').textContent = record.summary || '';

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
       ones — reset both so every sheet opens at the top. */
    $('.sheet-body', sheet).scrollTop = 0;
    if (sheetPanel) sheetPanel.scrollTop = 0;
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    unlockScroll();
    if (sheetReturn && document.contains(sheetReturn)) sheetReturn.focus();
    sheetReturn = null;
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-open-record]');
    if (opener) {
      event.preventDefault();
      openSheet(opener.getAttribute('data-open-record'), opener);
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
    lightbox.hidden = true;
    unlockScroll();
    lightboxImage.removeAttribute('src');
    if (lightboxReturn && document.contains(lightboxReturn)) lightboxReturn.focus();
    lightboxReturn = null;
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

  /* Key handling is bound at document level so it works no matter where
     focus currently sits, then delegated to whichever layer is open. The
     arrow keys are never claimed while both layers are closed, so ordinary
     scrolling of the page is untouched. */
  function isTypingTarget(el) {
    if (!el) return false;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable;
  }

  document.addEventListener('keydown', function (event) {
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
}());
