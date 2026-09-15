/* =========================================================================
   Muhammad Ibrahim: engineering portfolio
   Motion layer. Everything in this file is optional: it is `defer`red,
   loads after js/app.js (which owns all functional behaviour), and the
   whole module tree collapses to a single reveal() pass under
   prefers-reduced-motion. A failure anywhere in here should never leave
   the page unusable or unreadable.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  };

  /* ---------------------------------------------------------------- boot

     Removes .is-booting once fonts are ready (or a 900ms timeout, whichever
     comes first), which is what releases the hero name's two lines into the
     entrance animation declared in the stylesheet. Waiting on the font
     matters: starting the lines while a fallback face is still measured
     would reflow them mid-flight. Runs unconditionally, reduced motion
     included, so the page never gets stuck mid-boot. A second failsafe in
     the document head clears the class at 2s if this file never loads. */

  function boot() {
    function finish() {
      window.requestAnimationFrame(function () {
        root.classList.remove('is-booting');
      });
    }
    if (document.fonts && document.fonts.ready) {
      var settled = false;
      document.fonts.ready.then(function () { if (!settled) { settled = true; finish(); } });
      window.setTimeout(function () { if (!settled) { settled = true; finish(); } }, 900);
    } else {
      window.setTimeout(finish, 300);
    }
  }

  /* -------------------------------------------------------------- reveal

     One IntersectionObserver drives every [data-reveal] element and every
     .plate (the plate's own image clip-wipe is keyed off .plate.is-in, the
     same class this loop adds, so a bench plate or a hero portrait needs no
     separate handling). A [data-stagger] parent gets each of its
     [data-reveal] descendants assigned --d at observe time, capped at six
     steps, exactly as the pre-redesign implementation capped its index. */

  /* The stylesheet puts will-change on every [data-reveal], which pins a
     compositor layer per frame. The reveal is one-shot, so once a frame has
     played its layer is pure overhead: 43 of them held for the life of the
     page. Clearing will-change after the transition has finished (longest
     reveal 1100ms plus up to 420ms of stagger) hands that memory back
     without risking a dropped layer mid-animation. */
  var REVEAL_SETTLE = 1600;

  function releaseLayer(el) {
    window.setTimeout(function () {
      el.classList.remove('is-armed');
      el.style.removeProperty('will-change');
    }, REVEAL_SETTLE);
  }

  function stagger() {
    var groups = $$('[data-stagger]');
    groups.forEach(function (group) {
      var items = $$('[data-reveal]', group);
      items.forEach(function (item, i) {
        item.style.setProperty('--d', Math.min(i * 70, 420) + 'ms');
      });
    });
  }

  /* The "mask" and "wipe" variants hide themselves with a clip-path that
     collapses the element to zero visible area at rest. In this engine a
     clip-path'd target never reports as intersecting (its own intersection
     rect is always zero), so observing the element itself would deadlock:
     it can't reveal because it's clipped, and it can't un-clip because it
     never reveals. Observe the nearest unclipped ancestor for those two
     variants instead, and flip the real element(s) when that ancestor
     scrolls into view. "rise"/"scale" (opacity + transform only) and
     .plate (its own box is never clipped, only the child <img> is) are
     unaffected and are still observed directly. */
  function ioTarget(el) {
    var variant = el.getAttribute('data-reveal');
    if ((variant === 'mask' || variant === 'wipe') && el.parentElement) return el.parentElement;
    return el;
  }

  function reveal() {
    var els = $$('[data-reveal], .plate');
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    stagger();

    var targets = [];
    var members = [];
    els.forEach(function (el) {
      var target = ioTarget(el);
      var idx = targets.indexOf(target);
      if (idx === -1) { targets.push(target); members.push([el]); }
      else members[idx].push(el);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = targets.indexOf(entry.target);
        (idx === -1 ? [entry.target] : members[idx]).forEach(function (el) {
          el.classList.add('is-in');
          releaseLayer(el);
        });
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    /* Anything already on screen at first paint is shown at once, with its
       entrance transition suppressed rather than played. Fading in content
       that is in the viewport before the user has done anything delays the
       largest contentful paint by the length of the fade: measured here,
       the hero lead paragraph became Chrome's LCP element at ~1.87s purely
       because it spent that long fading. The scroll reveal is for content
       arriving from below, which is untouched; the hero name keeps its own
       masked entrance, which is driven by .is-booting, not by this. */
    var fold = window.innerHeight;
    var deferred = [];
    targets.forEach(function (target, i) {
      var box = target.getBoundingClientRect();
      if (box.top < fold && box.bottom > 0) {
        members[i].forEach(function (el) {
          el.classList.add('reveal-now', 'is-in');
        });
      } else {
        deferred.push(target);
      }
    });

    /* Armed a few hundred pixels out so the compositor layer exists by the
       time the transition starts, and only then. */
    var armer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = targets.indexOf(entry.target);
        (idx === -1 ? [entry.target] : members[idx]).forEach(function (el) {
          el.classList.add('is-armed');
        });
        armer.unobserve(entry.target);
      });
    }, { rootMargin: '400px 0px 400px 0px', threshold: 0 });

    deferred.forEach(function (target) {
      armer.observe(target);
      io.observe(target);
    });
  }

  /* ---------------------------------------------------------- bench driver

     One IntersectionObserver over .bench-record: whichever record is
     nearest centre moves .is-live to the matching [data-plate], and
     #benchPos is read straight off that record's own data-pos attribute,
     so no project strings live in JS. */

  function benchDriver() {
    var records = $$('.bench-record');
    var plates = $$('.bench-plate');
    var posEl = document.getElementById('benchPos');
    if (!records.length || !plates.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-record');
        plates.forEach(function (p) {
          p.classList.toggle('is-live', p.getAttribute('data-plate') === id);
        });
        if (posEl) posEl.textContent = entry.target.getAttribute('data-pos') || '';
      });
    }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 });

    records.forEach(function (r) { io.observe(r); });
  }

  /* ----------------------------------------------------------------- shelf

     The project index is a horizontal shelf. Nothing about a page says
     "this scrolls sideways" on its own, and the browser's own scrollbar is
     hidden on most machines, so three things say it instead: a card always
     cut off at the right edge, a rail that shows position and can be
     dragged, and a counter naming the total.

     One passive scroll listener, rAF-throttled, reading scrollLeft once per
     frame and writing one transform. Geometry is cached and only remeasured
     on resize, so nothing forces layout inside the loop. */

  function shelf() {
    var track = document.getElementById('catShelf');
    if (!track) return;
    var wrap  = track.closest('.shelf');
    var rail  = document.getElementById('catRail');
    var grip  = document.getElementById('catGrip');
    var count = document.getElementById('catCount');
    var steps = $$('.shelf-step', wrap);
    var cards = $$('.cat-card', track);
    if (!wrap || !rail || !grip || !cards.length) return;

    var railW = 0, gripW = 40, maxScroll = 0, step = 0, raf = null;

    function measure() {
      railW = rail.clientWidth;
      maxScroll = track.scrollWidth - track.clientWidth;
      var ratio = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
      gripW = Math.max(36, Math.round(railW * Math.min(ratio, 1)));
      grip.style.width = gripW + 'px';
      /* one card plus the gap, taken from the first two cards rather than
         from a hard-coded number, so the card size can change in CSS alone */
      step = cards.length > 1
        ? cards[1].offsetLeft - cards[0].offsetLeft
        : cards[0].offsetWidth;
      paint();
    }

    function paint() {
      var x = track.scrollLeft;
      var progress = maxScroll > 0 ? x / maxScroll : 0;
      grip.style.transform = 'translate3d(' + ((railW - gripW) * progress) + 'px,0,0)';
      if (count) {
        var n = step > 0 ? Math.round(x / step) + 1 : 1;
        count.textContent = (n < 10 ? '0' : '') + Math.min(n, cards.length);
      }
      wrap.classList.toggle('has-more', x < maxScroll - 2);
      steps.forEach(function (b) {
        var dir = +b.getAttribute('data-step');
        b.disabled = dir < 0 ? x <= 2 : x >= maxScroll - 2;
      });
      raf = null;
    }

    track.addEventListener('scroll', function () {
      if (!raf) raf = window.requestAnimationFrame(paint);
    }, { passive: true });

    steps.forEach(function (b) {
      b.addEventListener('click', function () {
        var by = step * Math.max(1, Math.floor(track.clientWidth / step) - 1);
        track.scrollBy({ left: by * +b.getAttribute('data-step'), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    /* Dragging the rail scrolls the shelf, which is what a scrollbar would
       have done if the platform still drew one. */
    var dragging = false;
    function seek(clientX) {
      var box = rail.getBoundingClientRect();
      var p = (clientX - box.left - gripW / 2) / Math.max(1, box.width - gripW);
      track.scrollLeft = Math.max(0, Math.min(1, p)) * maxScroll;
    }
    rail.addEventListener('pointerdown', function (e) {
      dragging = true; wrap.classList.add('is-dragging');
      rail.setPointerCapture(e.pointerId); seek(e.clientX);
    });
    rail.addEventListener('pointermove', function (e) { if (dragging) seek(e.clientX); });
    function endDrag() { dragging = false; wrap.classList.remove('is-dragging'); }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);

    /* Arrow keys once the shelf itself has focus. */
    track.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      track.scrollBy({ left: step * (e.key === 'ArrowRight' ? 1 : -1), behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    var timer;
    window.addEventListener('resize', function () {
      window.clearTimeout(timer); timer = window.setTimeout(measure, 160);
    }, { passive: true });

    measure();
    /* Card widths depend on the font, so remeasure once it has loaded. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  /* ------------------------------------------------------------ magnetic

     .btn / .cat-link / .act-tile carry class="magnetic" in the markup,
     which is what gives them the spring-back transition (scoped to fine
     pointers in the stylesheet); this only ever writes a transform inline
     within a 90px halo, capped at 7px, and clears it on pointerleave. Never
     calls preventDefault, so native clicks and scrolling are untouched. */

  /* Bumped whenever the page scrolls or resizes. A magnetic element stores
     the generation it measured itself in and re-measures only when that no
     longer matches, so invalidating every cached centre costs one integer
     write rather than a walk over every element. */
  var layoutGen = 0;

  function magnetic() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var els = $$('.magnetic');
    if (!els.length) return;
    var HALO = 90, CAP = 7;

    /* The centre is measured once on entry and reused for the whole hover.
       Measuring inside pointermove meant a getBoundingClientRect straight
       after the previous move had written a transform, which forces a
       synchronous layout on every single mouse event. It was also feeding
       on itself: getBoundingClientRect reports the *transformed* box, so
       each pull shifted the centre the next pull was measured from. */
    els.forEach(function (el) {
      var cx = 0, cy = 0, measuredAt = -1;

      function measure() {
        var prev = el.style.transform;
        if (prev) el.style.transform = '';
        var rect = el.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height / 2;
        if (prev) el.style.transform = prev;
        measuredAt = layoutGen;
      }

      el.addEventListener('pointerenter', function (event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        measure();
      });
      el.addEventListener('pointermove', function (event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        if (measuredAt !== layoutGen) measure();
        var dx = event.clientX - cx, dy = event.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > HALO) return;
        var pull = 1 - dist / HALO;
        var tx = Math.max(-CAP, Math.min(CAP, dx * 0.18 * pull));
        var ty = Math.max(-CAP, Math.min(CAP, dy * 0.18 * pull));
        el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
        measuredAt = -1;
      });
    });
  }

  /* ------------------------------------------------------------- contour

     A slowly breathing contour field behind the hero name: isolines of a
     scalar function, drawn with marching squares, the way a pressure or a
     stress plot is drawn. It replaces a particle-advection field whose
     trails smeared across the ground and needed a translucent repaint of
     the whole canvas every frame to fade them.

     Cost per frame is one clearRect, about 1,400 field evaluations and one
     stroke call per level, which is seven. Gated off entirely (canvas never
     created) under reduced motion, on narrow viewports, on low-core-count
     devices, or if a 2d context is unavailable; paused via
     IntersectionObserver and visibilitychange. */

  function flowfield() {
    var canvas = document.getElementById('flowfield');
    if (!canvas) return;
    if (reduceMotion) return;
    if (window.matchMedia('(max-width: 719px)').matches) return;
    if ((navigator.hardwareConcurrency || 8) < 4) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var CELL = 26;
    var LEVELS = [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4];
    var INK = [
      'rgba(20,20,26,0.085)', 'rgba(20,20,26,0.115)', 'rgba(75,34,199,0.135)',
      'rgba(75,34,199,0.20)',  'rgba(75,34,199,0.135)', 'rgba(20,20,26,0.115)',
      'rgba(20,20,26,0.085)'
    ];

    /* Which cell edges each of the sixteen corner patterns cuts.
       Edge 0 is the top of the cell, then right, bottom, left. */
    var CUTS = [
      [], [3, 2], [2, 1], [3, 1], [0, 1], [0, 3, 2, 1], [0, 2], [0, 3],
      [0, 3], [0, 2], [0, 1, 3, 2], [0, 1], [3, 1], [2, 1], [3, 2], []
    ];

    var w = 0, h = 0, cols = 0, rows = 0, vals = null;
    var running = false, raf = null, t = 0;

    function seed() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * DPR));
      canvas.height = Math.max(1, Math.round(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
      vals = new Float32Array(cols * rows);
    }

    /* Three drifting plane waves and one ring, which is enough to keep the
       lines from ever settling into a pattern the eye can predict. */
    function sample(x, y, time) {
      return Math.sin(x * 0.0042 + time * 0.00019)
           + Math.sin(y * 0.0051 - time * 0.00014)
           + Math.sin((x + y) * 0.0026 + time * 0.00011)
           + 0.75 * Math.sin(Math.sqrt((x - w * 0.62) * (x - w * 0.62) +
                                       (y - h * 0.30) * (y - h * 0.30)) * 0.0055 - time * 0.00021);
    }

    function frame() {
      if (!running) return;
      t += 16;

      var r, c, i = 0;
      for (r = 0; r < rows; r++) {
        for (c = 0; c < cols; c++) vals[i++] = sample(c * CELL, r * CELL, t);
      }

      ctx.clearRect(0, 0, w, h);

      for (var L = 0; L < LEVELS.length; L++) {
        var lv = LEVELS[L];
        ctx.strokeStyle = INK[L];
        ctx.beginPath();
        for (r = 0; r < rows - 1; r++) {
          var row0 = r * cols, row1 = row0 + cols;
          var y0 = r * CELL;
          for (c = 0; c < cols - 1; c++) {
            var va = vals[row0 + c], vb = vals[row0 + c + 1];
            var vc = vals[row1 + c + 1], vd = vals[row1 + c];
            var key = (va > lv ? 8 : 0) | (vb > lv ? 4 : 0) | (vc > lv ? 2 : 0) | (vd > lv ? 1 : 0);
            var cut = CUTS[key];
            if (!cut.length) continue;
            var x0 = c * CELL;
            for (var e = 0; e < cut.length; e += 2) {
              edgePoint(cut[e], x0, y0, va, vb, vc, vd, lv, P);
              ctx.moveTo(P[0], P[1]);
              edgePoint(cut[e + 1], x0, y0, va, vb, vc, vd, lv, P);
              ctx.lineTo(P[0], P[1]);
            }
          }
        }
        ctx.stroke();
      }

      raf = window.requestAnimationFrame(frame);
    }

    var P = [0, 0];

    /* Where the level crosses one edge, found by linear interpolation
       between that edge's two corner values. */
    function edgePoint(edge, x0, y0, va, vb, vc, vd, lv, out) {
      var f;
      if (edge === 0)      { f = (lv - va) / (vb - va); out[0] = x0 + f * CELL; out[1] = y0; }
      else if (edge === 1) { f = (lv - vb) / (vc - vb); out[0] = x0 + CELL;     out[1] = y0 + f * CELL; }
      else if (edge === 2) { f = (lv - vd) / (vc - vd); out[0] = x0 + f * CELL; out[1] = y0 + CELL; }
      else                 { f = (lv - va) / (vd - va); out[0] = x0;            out[1] = y0 + f * CELL; }
    }

    function start() {
      if (running) return;
      running = true;
      canvas.classList.add('is-in');
      raf = window.requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
    }

    seed();

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && document.visibilityState === 'visible') start();
          else stop();
        });
      }, { threshold: 0 });
      io.observe(canvas.closest('.hero') || canvas);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') stop();
      else if (canvas.getBoundingClientRect().top < window.innerHeight) start();
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(seed, 200);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ spine

     The stylesheet already lights each .tl-node amber on .tl-item.is-in
     (set by reveal() above), which delivers the "lamps lighting down the
     page" effect on its own. This adds only a harmless, forward-compatible
     .is-drawn toggle on .tl for a future animated spine to hook into. */

  function spine() {
    var tl = $('.tl');
    if (!tl || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { tl.classList.add('is-drawn'); io.unobserve(tl); }
      });
    }, { threshold: 0.1 });
    io.observe(tl);
  }

  /* ------------------------------------------------------------------ clock

     States a computed time only, never a claim. Updates every 30s; no
     seconds are shown so a slower cadence is unobservable. */

  function clock() {
    var targets = [document.getElementById('headClock'), document.getElementById('footClock')].filter(Boolean);
    if (!targets.length) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return; }
    function tick() {
      var text = fmt.format(new Date());
      targets.forEach(function (el) { el.textContent = text; });
    }
    tick();
    window.setInterval(tick, 30000);
  }

  /* ------------------------------------------------------------ progressBar

     Writes --p (0..1 scroll progress) on the masthead progress bar once per
     frame, from the single shared throttled scroll listener below. */

  var mastheadProgress = document.getElementById('mastheadProgress');

  var lastProgress = null;

  /* scrollHeight forces a layout flush, and it was being read on every
     scroll frame even though the document only changes height on resize or
     when a panel opens. Cached, with the cache dropped whenever either of
     those happens. */
  var scrollMax = -1;

  function invalidateScrollMax() { scrollMax = -1; }

  function updateProgress() {
    if (!mastheadProgress) return;
    if (scrollMax < 0) {
      var doc = document.documentElement;
      scrollMax = doc.scrollHeight - doc.clientHeight;
    }
    var max = scrollMax;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    p = p.toFixed(4);
    /* Skip the write when the bar has not actually moved: at rest, and at
       either end of the page, this fires every frame otherwise and each
       write costs a style invalidation for nothing. */
    if (p === lastProgress) return;
    lastProgress = p;
    mastheadProgress.style.setProperty('--p', p);
  }

  /* --------------------------------------------------------- hero parallax

     The one JS-driven parallax layer (the bench plate parallax is native
     scroll-driven animation, entirely in CSS where supported). Written from
     the same shared scroll listener, capped at 90px of travel. */

  var heroGrid = $('.hero .grid-field');

  var lastParallax = null;

  function updateHeroParallax() {
    if (!heroGrid || reduceMotion) return;
    var sy = Math.min(window.scrollY, 900);
    var y = (sy * 0.10).toFixed(1);
    /* Past the 900px cap the value is pinned, so without this the same
       transform is rewritten on every scroll frame for the whole rest of
       the page. */
    if (y === lastParallax) return;
    lastParallax = y;
    heroGrid.style.transform = 'translate3d(0,' + y + 'px,0)';
  }

  /* ------------------------------------------------------------ scheduler

     One shared throttled scroll listener for the whole file: nothing else
     in this module binds its own scroll handler. */

  function initScrollScheduler() {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        layoutGen++;
        updateProgress();
        updateHeroParallax();
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* A resize moves everything and can change the document height, so it
       clears both caches. The document also grows and shrinks when a panel
       opens, which ResizeObserver catches without a listener of its own. */
    window.addEventListener('resize', function () {
      layoutGen++;
      invalidateScrollMax();
    }, { passive: true });
    if ('ResizeObserver' in window && document.body) {
      new ResizeObserver(invalidateScrollMax).observe(document.body);
    }

    updateProgress();
    updateHeroParallax();
  }

  /* ---------------------------------------------------------------- init */

  boot();
  reveal();

  if (reduceMotion) return;

  benchDriver();
  shelf();
  magnetic();
  flowfield();
  spine();
  clock();
  initScrollScheduler();
}());
