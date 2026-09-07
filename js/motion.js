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
     comes first), which is what drives the hero name's 200->720 weight
     transition already declared in the stylesheet. Runs unconditionally,
     reduced motion included, so the page never gets stuck mid-boot. */

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

  function stagger(el) {
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
        });
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (target) { io.observe(target); });
  }

  /* ---------------------------------------------------------- bench driver

     One IntersectionObserver over .bench-record: whichever record is
     nearest centre moves .is-live to the matching [data-plate], and
     #benchPos / #benchCount are read straight off that record's own
     data-pos / data-count attributes, so no project strings live in JS. */

  function benchDriver() {
    var records = $$('.bench-record');
    var plates = $$('.bench-plate');
    var posEl = document.getElementById('benchPos');
    var countEl = document.getElementById('benchCount');
    if (!records.length || !plates.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-record');
        plates.forEach(function (p) {
          p.classList.toggle('is-live', p.getAttribute('data-plate') === id);
        });
        if (posEl) posEl.textContent = entry.target.getAttribute('data-pos') || '';
        if (countEl) countEl.textContent = entry.target.getAttribute('data-count') || '';
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

    function place() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var w = box.offsetWidth || 320, h = box.offsetHeight || 220;
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
        var w = box.offsetWidth || 320;
        var left = Math.min(rect.right + 16, window.innerWidth - w - 16);
        var top = Math.min(Math.max(rect.top, 16), window.innerHeight - (box.offsetHeight || 220) - 16);
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

  function magnetic() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var els = $$('.magnetic');
    if (!els.length) return;
    var HALO = 90, CAP = 7;

    els.forEach(function (el) {
      el.addEventListener('pointermove', function (event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        var dx = event.clientX - cx, dy = event.clientY - cy;
        var dist = Math.hypot(dx, dy);
        if (dist > HALO) return;
        var pull = 1 - dist / HALO;
        var tx = Math.max(-CAP, Math.min(CAP, dx * 0.18 * pull));
        var ty = Math.max(-CAP, Math.min(CAP, dy * 0.18 * pull));
        el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
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

    function frame() {
      if (!running) return;
      t += 16;
      ctx.fillStyle = 'rgba(250,250,248,0.055)';
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var a = field(p.x, p.y, t);
        p.vx = (p.vx + Math.cos(a) * 0.055) * 0.94;
        p.vy = (p.vy + Math.sin(a) * 0.055) * 0.94;
        p.px = p.x; p.py = p.y;
        p.x += p.vx; p.y += p.vy;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        var s = Math.min(1, Math.hypot(p.vx, p.vy) / 1.4);
        ctx.strokeStyle = 'rgba(107,59,245,' + (0.10 + 0.16 * s) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
        p.life -= 1;
        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) spawn(p);
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

  function updateProgress() {
    if (!mastheadProgress) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    mastheadProgress.style.setProperty('--p', p.toFixed(4));
  }

  /* --------------------------------------------------------- hero parallax

     The one JS-driven parallax layer (the bench plate parallax is native
     scroll-driven animation, entirely in CSS where supported). Written from
     the same shared scroll listener, capped at 90px of travel. */

  var heroGrid = $('.hero .grid-field');

  function updateHeroParallax() {
    if (!heroGrid || reduceMotion) return;
    var sy = Math.min(window.scrollY, 900);
    heroGrid.style.transform = 'translate3d(0,' + (sy * 0.10).toFixed(1) + 'px,0)';
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
        updateProgress();
        updateHeroParallax();
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
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
