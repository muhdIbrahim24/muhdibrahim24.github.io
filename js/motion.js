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

  /* -------------------------------------------------------------- flowfield

     Particle-advection field behind the hero name. Gated off entirely
     (canvas never created) under reduced motion, on narrow viewports, on
     low-core-count devices, or if a 2d context is unavailable; paused via
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
    var w = 0, h = 0, N = 0, particles = [];
    var running = false;
    var raf = null;
    var t = 0;

    function field(x, y, time) {
      return (Math.sin(x * 0.0016 + time * 0.00016) + Math.cos(y * 0.0019 - time * 0.00013)) * Math.PI;
    }

    function spawn(p) {
      p.x = p.px = Math.random() * w;
      p.y = p.py = Math.random() * h;
      p.vx = 0; p.vy = 0;
      p.life = 120 + Math.random() * 180;
      return p;
    }

    function seed() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * DPR));
      canvas.height = Math.max(1, Math.round(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      N = Math.max(60, Math.min(180, Math.floor((w * h) / 14000)));
      particles = [];
      for (var i = 0; i < N; i++) particles.push(spawn({}));
      ctx.fillStyle = 'rgba(250,250,248,1)';
      ctx.fillRect(0, 0, w, h);
    }

    /* Every particle used to get its own beginPath/strokeStyle/stroke, so a
       full field cost up to 180 separate stroke calls per frame, ~10,800 a
       second. The only thing that varied between them was the alpha, which
       tracks speed. Quantising speed into a handful of steps lets every
       particle at the same step share one sub-path and one stroke: 5 stroke
       calls a frame instead of 180, for a difference no eye can see.
       Math.hypot is also replaced with a plain sqrt, which is far quicker in
       V8 and is called once per particle per frame. */
    var STEPS = 5;
    var lanes = [];
    var laneInk = [];
    for (var si = 0; si < STEPS; si++) {
      lanes.push([]);
      laneInk.push('rgba(107,59,245,' + (0.10 + 0.16 * ((si + 0.5) / STEPS)).toFixed(3) + ')');
    }

    function frame() {
      if (!running) return;
      t += 16;
      ctx.fillStyle = 'rgba(250,250,248,0.055)';
      ctx.fillRect(0, 0, w, h);

      for (var L = 0; L < STEPS; L++) lanes[L].length = 0;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var a = field(p.x, p.y, t);
        p.vx = (p.vx + Math.cos(a) * 0.055) * 0.94;
        p.vy = (p.vy + Math.sin(a) * 0.055) * 0.94;
        p.px = p.x; p.py = p.y;
        p.x += p.vx; p.y += p.vy;
        var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 1.4;
        if (sp > 1) sp = 1;
        var lane = (sp * STEPS) | 0;
        if (lane >= STEPS) lane = STEPS - 1;
        lanes[lane].push(p.px, p.py, p.x, p.y);
        p.life -= 1;
        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) spawn(p);
      }

      ctx.lineWidth = 1;
      for (var L2 = 0; L2 < STEPS; L2++) {
        var q = lanes[L2];
        if (!q.length) continue;
        ctx.strokeStyle = laneInk[L2];
        ctx.beginPath();
        for (var k = 0; k < q.length; k += 4) {
          ctx.moveTo(q[k], q[k + 1]);
          ctx.lineTo(q[k + 2], q[k + 3]);
        }
        ctx.stroke();
      }

      raf = window.requestAnimationFrame(frame);
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
  catPreview();
  magnetic();
  flowfield();
  spine();
  clock();
  initScrollScheduler();
}());
