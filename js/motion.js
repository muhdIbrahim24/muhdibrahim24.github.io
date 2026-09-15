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

  /* ------------------------------------------------------------ cat preview

     Cursor-tracked preview card for the project index. Gated to fine
     pointers with hover support; touch and keyboard get the inline
     .cat-thumb instead (the stylesheet handles that switch on its own).
     Keyboard focus anchors the same preview to the row's own edge rather
     than the pointer, and does not start the rAF loop. */

  function catPreview() {
    var box = document.getElementById('catPreview');
    var img = document.getElementById('catPreviewImg');
    var rows = $$('.cat-link[data-preview]');
    if (!box || !img || !rows.length) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var tx = 0, ty = 0, px = 0, py = 0, targetX = 0, targetY = 0;
    var raf = null;
    var active = false;
    var lastSrc = '';

    /* Box size and viewport are cached instead of being read inside the rAF
       loop. offsetWidth/offsetHeight read straight after the previous frame
       wrote box.style.transform forced a synchronous layout on every single
       frame the preview was live. They only actually change when a new row
       sets a new aspect ratio, or when the window resizes. */
    var vw = window.innerWidth, vh = window.innerHeight;
    var bw = 320, bh = 220;

    function remeasure() {
      vw = window.innerWidth; vh = window.innerHeight;
      bw = box.offsetWidth || 320;
      bh = box.offsetHeight || 220;
    }

    window.addEventListener('resize', remeasure, { passive: true });

    function place() {
      var w = bw, h = bh;
      tx += (targetX - tx) * 0.14;
      ty += (targetY - ty) * 0.14;
      var tilt = Math.max(-6, Math.min(6, (tx - px) * 0.5));
      px = tx; py = ty;
      var left = Math.min(Math.max(tx, 0), vw - w);
      var top = Math.min(Math.max(ty, 0), vh - h);
      box.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0) scale(1) rotate(' + tilt.toFixed(2) + 'deg)';
      if (active) raf = window.requestAnimationFrame(place);
      else raf = null;
    }

    function show(row, anchorEvent) {
      var src = row.getAttribute('data-preview');
      if (src && src !== lastSrc) {
        img.src = src;
        lastSrc = src;
      }
      var w = row.getAttribute('data-preview-w');
      var h = row.getAttribute('data-preview-h');
      if (w && h) box.style.aspectRatio = w + ' / ' + h;
      box.classList.add('is-live');
      remeasure();
    }

    function hide() {
      box.classList.remove('is-live');
      active = false;
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    }

    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function (event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        show(row);
        targetX = event.clientX + 28;
        targetY = event.clientY + 28;
        tx = targetX; ty = targetY; px = tx;
        active = true;
        if (!raf) raf = window.requestAnimationFrame(place);
      });
      row.addEventListener('pointermove', function (event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        targetX = event.clientX + 28;
        targetY = event.clientY + 28;
      });
      row.addEventListener('pointerleave', hide);
      row.addEventListener('focusin', function () {
        show(row);
        active = false;
        if (raf) { window.cancelAnimationFrame(raf); raf = null; }
        var rect = row.getBoundingClientRect();
        var left = Math.min(rect.right + 16, vw - bw - 16);
        var top = Math.min(Math.max(rect.top, 16), vh - bh - 16);
        tx = left; ty = top; px = tx;
        box.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0) scale(1) rotate(0deg)';
      });
      row.addEventListener('focusout', hide);
    });
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

  /* --------------------------------------------------------- streamlines

     A slow vector field behind the hero name, drawn the way a flow plot
     draws streamlines: short traces released from a lattice and carried by
     the field. It replaces the contour field, and before that a particle
     system whose trails needed a translucent repaint of the whole canvas
     every frame to fade them.

     The field is evaluated only at lattice points, once per drawn frame,
     and each trace reads it back by interpolating the vector rather than
     the angle, so nothing tears where the angle wraps past a half turn.
     That is about 1,200 trig calls and 9,000 short segments per frame,
     redrawn thirty times a second: the field turns slowly enough that
     sixty would look no different and cost twice as much.

     Gated off entirely (nothing drawn, no canvas sized) under reduced
     motion, on narrow viewports, on low-core-count devices, or if a 2d
     context is unavailable; paused via IntersectionObserver and
     visibilitychange. */

  function flowfield() {
    var canvas = document.getElementById('flowfield');
    if (!canvas) return;
    if (reduceMotion) return;
    if (window.matchMedia('(max-width: 719px)').matches) return;
    if ((navigator.hardwareConcurrency || 8) < 4) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var LAT = 32;      /* spacing of the lattice the field is sampled on */
    var GAP = 64;      /* spacing of the points traces are released from */
    var STEP = 9;      /* how far a trace advances per segment */
    var LEN = 26;      /* segments in one trace */
    var INK = 'rgba(20,20,26,0.075)';
    var VIO = 'rgba(75,34,199,0.13)';
    var FPS = 32;      /* milliseconds between redraws */

    var w = 0, h = 0, lcols = 0, lrows = 0, vx = null, vy = null;
    var running = false, raf = null, t = 0, stamp = 0, drawn = -1e9;

    function seed() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * DPR));
      canvas.height = Math.max(1, Math.round(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      /* The lattice runs two release gaps beyond the canvas on every side,
         so a trace that wanders off an edge still has values to read. */
      lcols = Math.ceil((w + 4 * GAP) / LAT) + 2;
      lrows = Math.ceil((h + 4 * GAP) / LAT) + 2;
      vx = new Float32Array(lcols * lrows);
      vy = new Float32Array(lcols * lrows);
      drawn = -1e9;
    }

    /* Three drifting waves turning the direction of flow. The time
       coefficients are half what they were when this was first tuned,
       which is the speed that was asked for. */
    function field(time) {
      var i = 0, r, c;
      for (r = 0; r < lrows; r++) {
        var y = r * LAT - 2 * GAP;
        for (c = 0; c < lcols; c++) {
          var x = c * LAT - 2 * GAP;
          var a = (Math.sin(x * 0.0027 + time * 0.00008)
                 + Math.cos(y * 0.0031 - time * 0.000065)
                 + 0.6 * Math.sin((x - y) * 0.0019 + time * 0.000045)) * Math.PI;
          vx[i] = Math.cos(a);
          vy[i] = Math.sin(a);
          i++;
        }
      }
    }

    var V = [1, 0];

    function look(x, y) {
      var gx = (x + 2 * GAP) / LAT, gy = (y + 2 * GAP) / LAT;
      if (gx < 0) gx = 0; else if (gx > lcols - 1.001) gx = lcols - 1.001;
      if (gy < 0) gy = 0; else if (gy > lrows - 1.001) gy = lrows - 1.001;
      var c0 = gx | 0, r0 = gy | 0, fx = gx - c0, fy = gy - r0;
      var i00 = r0 * lcols + c0, i10 = i00 + 1, i01 = i00 + lcols, i11 = i01 + 1;
      var a = 1 - fx, b = 1 - fy;
      var ux = (vx[i00] * a + vx[i10] * fx) * b + (vx[i01] * a + vx[i11] * fx) * fy;
      var uy = (vy[i00] * a + vy[i10] * fx) * b + (vy[i01] * a + vy[i11] * fx) * fy;
      var m = Math.sqrt(ux * ux + uy * uy);
      if (m < 1e-6) { V[0] = 1; V[1] = 0; return; }
      V[0] = ux / m; V[1] = uy / m;
    }

    /* Two passes over a checkerboard of release points: the ink traces and
       the violet ones, one stroke call each. */
    function draw(time) {
      field(time);
      ctx.clearRect(0, 0, w, h);
      for (var pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = pass ? VIO : INK;
        ctx.beginPath();
        var row = 0;
        for (var sy = -GAP; sy < h + GAP; sy += GAP) {
          var col = 0;
          for (var sx = -GAP + (row % 2) * GAP / 2; sx < w + GAP; sx += GAP) {
            if ((col + row) % 2 === pass) {
              var x = sx, y = sy;
              ctx.moveTo(x, y);
              for (var k = 0; k < LEN; k++) {
                look(x, y);
                x += V[0] * STEP;
                y += V[1] * STEP;
                ctx.lineTo(x, y);
              }
            }
            col++;
          }
          row++;
        }
        ctx.stroke();
      }
    }

    function frame(now) {
      if (!running) return;
      raf = window.requestAnimationFrame(frame);
      var dt = stamp ? now - stamp : 16;
      stamp = now;
      if (dt > 100) dt = 100;          /* coming back from a pause, no jump */
      t += dt;
      if (now - drawn < FPS) return;
      drawn = now;
      draw(t);
    }

    function start() {
      if (running) return;
      running = true;
      stamp = 0;
      canvas.classList.add('is-in');
      raf = window.requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      stamp = 0;
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
  catPreview();
  magnetic();
  flowfield();
  spine();
  clock();
  initScrollScheduler();
}());
