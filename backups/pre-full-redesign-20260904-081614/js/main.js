(function () {
  'use strict';

  var PROJECT_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  var projects = window.PORTFOLIO_PROJECTS || {};
  var mediaRegistry = window.PORTFOLIO_MEDIA || {};
  var reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var state = {
    projectId: null,
    mediaIndex: 0,
    mediaToken: 0,
    activeMedia: null,
    activeElement: null,
    activeRecord: null,
    opener: null,
    caseOpen: false,
    lightboxOpen: false,
    scrollLocked: false,
    savedPaddingRight: '',
    motionObserver: null,
    animations: [],
    motionAnimations: new Map(),
    motionStates: new WeakMap(),
    motionGeneration: new WeakMap(),
    motionTargets: [],
    lastScrollY: window.scrollY || 0,
    scrollDirection: 'down',
    motionScrollBound: false,
    motionRaf: 0
    ,gifAnimating: false
    ,mediaPlayback: {}
    ,caseOpenToken: 0
    ,caseCloseToken: 0
    ,lightboxOpenToken: 0
  };

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function reducedMotion() { return Boolean(reduceMotionQuery && reduceMotionQuery.matches); }

  function safely(name, setup) {
    try { setup(); }
    catch (error) { console.error('[portfolio:' + name + ']', error); }
  }

  function projectFor(id) {
    var project = projects[id];
    if (project && project.id === id && Array.isArray(project.media)) return project;
    return {
      id: id,
      title: 'Project details unavailable',
      focus: 'Engineering project',
      summary: 'Verified project information is unavailable.',
      details: { brief: 'Unavailable.', contribution: 'Unavailable.', method: 'Unavailable.', result: 'Unavailable.', limitations: 'Unavailable.' },
      media: []
    };
  }

  function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(object || {}, key); }

  function mediaKind(media) {
    if (media && media.kind === 'video') return 'video';
    if (media && media.kind === 'gif') return 'gif';
    if (media && media.kind === 'image/gif') return 'gif';
    if (media && media.kind && media.kind !== 'image' && media.kind !== 'slot') return 'unknown';
    if (media && media.type === 'image/gif') return 'gif';
    if (media && media.type && String(media.type).indexOf('video/') === 0) return 'video';
    if (media && media.type && ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif'].indexOf(String(media.type)) === -1) return 'unknown';
    if (media && media.kind === 'slot') return 'slot';
    return 'image';
  }

  function copyObject(input, keys, fallback) {
    var result = {};
    var source = input || fallback || {};
    keys.forEach(function (key) { result[key] = source[key] == null ? (key === 'url' ? null : '') : source[key]; });
    return result;
  }

  function normalizeMedia(media, index) {
    var item = media || {};
    var src = item.src ? String(item.src) : null;
    if (src && !/^(?:https?:|file:|blob:|data:image\/|\.\.?\/|\/|assets\/)/i.test(src)) src = null;
    var poster = item.poster && typeof item.poster === 'object' ? item.poster : null;
    return {
      id: item.id ? String(item.id) : 'media-' + String(index + 1).padStart(2, '0'),
      kind: mediaKind(item),
      status: item.status ? String(item.status) : (src ? 'ready' : 'future'),
      src: src,
      type: item.type ? String(item.type) : (src ? 'image/jpeg' : null),
      width: Number(item.width) || null,
      height: Number(item.height) || null,
      alt: item.alt ? String(item.alt) : '',
      caption: item.caption ? String(item.caption) : '',
      source: copyObject(item.source, ['title', 'page', 'figure', 'section', 'url'], { title: '', page: '', figure: '', section: '', url: null }),
      citation: copyObject(item.citation, ['label', 'url'], { label: '', url: null }),
      credit: copyObject(item.credit, ['creator', 'license', 'url'], { creator: '', license: '', url: null }),
      poster: poster ? {
        src: poster.src && /^(?:https?:|file:|blob:|data:image\/|\.\.?\/|\/|assets\/)/i.test(String(poster.src)) ? String(poster.src) : null,
        type: poster.type ? String(poster.type) : null,
        width: Number(poster.width) || null,
        height: Number(poster.height) || null,
        alt: poster.alt ? String(poster.alt) : (item.alt || ''),
        caption: poster.caption ? String(poster.caption) : (item.caption || ''),
        source: copyObject(poster.source, ['title', 'page', 'figure', 'section', 'url'], { title: '', page: '', figure: '', section: '', url: null }),
        citation: copyObject(poster.citation, ['label', 'url'], { label: '', url: null }),
        credit: copyObject(poster.credit, ['creator', 'license', 'url'], { creator: '', license: '', url: null })
      } : null,
      tracks: Array.isArray(item.tracks) ? item.tracks.map(function (track) {
        var trackSrc = track && track.src ? String(track.src) : '';
        if (trackSrc && !/^(?:https?:|file:|blob:|\.\.?\/|\/|assets\/)/i.test(trackSrc)) trackSrc = '';
        return { src: trackSrc, kind: track && track.kind ? String(track.kind) : 'captions', srclang: track && track.srclang ? String(track.srclang) : 'en', label: track && track.label ? String(track.label) : 'English' };
      }).filter(function (track) { return track.src; }) : []
    };
  }

  function galleryFor(key, fallback) {
    if (hasOwn(mediaRegistry, key) && Array.isArray(mediaRegistry[key])) return mediaRegistry[key].map(normalizeMedia);
    return Array.isArray(fallback) ? fallback.map(normalizeMedia) : [];
  }

  function sourceFor(media, animateGif) {
    if (!media || media.status === 'future' || !media.src || !/^(?:https?:|file:|blob:|data:image\/|\.\.?\/|\/|assets\/)/i.test(String(media.src))) return null;
    if (mediaKind(media) === 'gif' && !animateGif) return media.poster && media.poster.src ? media.poster.src : null;
    return media.src;
  }

  function imageDetails(media, animateGif) {
    if (mediaKind(media) === 'gif' && !animateGif && media && media.poster && media.poster.src) return media.poster;
    return media;
  }

  function applyFocalPoint(element, media) {
    if (!element || !media || !media.focalPoint) return;
    element.style.setProperty('--focal-x', String(media.focalPoint.x) + '%');
    element.style.setProperty('--focal-y', String(media.focalPoint.y) + '%');
  }

  function lockPage() {
    if (state.scrollLocked) return;
    state.scrollLocked = true;
    state.savedPaddingRight = document.body.style.paddingRight;
    var scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (scrollbar) document.body.style.paddingRight = scrollbar + 'px';
    document.body.classList.add('dialog-open');
  }

  function unlockPage() {
    if (state.caseOpen || state.lightboxOpen || !state.scrollLocked) return;
    state.scrollLocked = false;
    document.body.classList.remove('dialog-open');
    document.body.style.paddingRight = state.savedPaddingRight;
  }

  function openNativeDialog(dialog) {
    if (!dialog) return false;
    if (dialog.open) return true;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      dialog.setAttribute('open', '');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
    }
    return true;
  }

  function closeNativeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    }
  }

  function setupNavigation() {
    var button = one('.menu-button');
    var navigation = one('#site-navigation');
    if (!button || !navigation) return;
    function setOpen(open, restoreFocus) {
      navigation.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open && window.innerWidth <= 960);
      if (!open && restoreFocus) button.focus();
    }
    button.addEventListener('click', function () { setOpen(button.getAttribute('aria-expanded') !== 'true', false); });
    navigation.addEventListener('click', function (event) { if (event.target.closest('a')) setOpen(false, false); });
    document.addEventListener('pointerdown', function (event) {
      if (button.getAttribute('aria-expanded') === 'true' && !navigation.contains(event.target) && !button.contains(event.target)) setOpen(false, false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { event.preventDefault(); setOpen(false, true); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) setOpen(false, false); }, { passive: true });
  }

  function rememberAnimation(animation) {
    if (!animation) return;
    state.animations.push(animation);
    animation.finished.then(function () {
      var index = state.animations.indexOf(animation);
      if (index !== -1) state.animations.splice(index, 1);
      animation.cancel();
    }).catch(function () {});
  }

  function animate(element, frames, options) {
    if (!element || reducedMotion() || typeof element.animate !== 'function') return;
    rememberAnimation(element.animate(frames, options));
  }

  function wrapHeadings() {
    all('[data-motion-title] h2').forEach(function (heading) {
      if (heading.dataset.motionWrapped === 'true') return;
      var label = heading.textContent.trim();
      heading.setAttribute('aria-label', label);
      heading.textContent = '';
      label.split(/\s+/).forEach(function (word, index) {
        if (index) heading.appendChild(document.createTextNode(' '));
        var mask = document.createElement('span');
        var inner = document.createElement('span');
        mask.className = 'title-word-mask';
        inner.className = 'title-word';
        inner.setAttribute('aria-hidden', 'true');
        inner.textContent = word;
        mask.appendChild(inner);
        heading.appendChild(mask);
      });
      heading.dataset.motionWrapped = 'true';
    });
  }

  function cancelMotionAnimation(element) {
    var previous = state.motionAnimations.get(element);
    if (!previous) return;
    try { previous.cancel(); } catch (error) {}
    state.motionAnimations.delete(element);
  }

  function motionAnimate(element, frames, options, onfinish) {
    if (!element || reducedMotion() || typeof element.animate !== 'function') return;
    cancelMotionAnimation(element);
    var animation = element.animate(frames, options);
    state.motionAnimations.set(element, animation);
    animation.finished.then(function () {
      if (state.motionAnimations.get(element) !== animation) return;
      if (typeof animation.commitStyles === 'function') animation.commitStyles();
      animation.cancel();
      state.motionAnimations.delete(element);
      if (onfinish) onfinish();
    }).catch(function () {});
  }

  function setMotionState(element, opacity, transform, clipPath) {
    if (!element) return;
    element.style.opacity = opacity;
    element.style.transform = transform;
    if (clipPath !== undefined) element.style.clipPath = clipPath;
  }

  function clearMotionState(element) {
    if (!element) return;
    cancelMotionAnimation(element);
    element.style.removeProperty('opacity');
    element.style.removeProperty('transform');
    element.style.removeProperty('clip-path');
  }

  function listItems(list) {
    return all('[data-motion-item]', list).filter(function (item) { return item.closest('[data-motion-list]') === list; });
  }

  function revealTitle(container, direction) {
    all('.title-word', container).forEach(function (word, index) {
      var offset = direction === 'up' ? '-105%' : '105%';
      motionAnimate(word, [{ opacity: 0, transform: 'translateY(' + offset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 520, delay: Math.min(index, 7) * 55, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    });
  }

  function revealScene(scene, direction) {
    var copy = one('.scene-copy', scene);
    var imageButton = one('.scene-image-button', scene);
    var offset = direction === 'up' ? '-18px' : '18px';
    var wipe = direction === 'up' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    motionAnimate(copy, [{ opacity: 0, transform: 'translateY(' + offset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 480, delay: 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    motionAnimate(imageButton, [{ opacity: 0, clipPath: wipe }, { opacity: 1, clipPath: 'inset(0)' }],
      { duration: 680, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  }

  function revealList(list, direction) {
    var items = listItems(list);
    if (direction === 'up') items.reverse();
    items.forEach(function (item, index) {
      var offset = direction === 'up' ? '-14px' : '14px';
      motionAnimate(item, [{ opacity: 0, transform: 'translateY(' + offset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 420, delay: Math.min(index, 8) * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    });
  }

  function revealStandalone(item, direction) {
    var offset = direction === 'up' ? '-14px' : '14px';
    motionAnimate(item, [{ opacity: 0, transform: 'translateY(' + offset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 440, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  }

  function revealHero(hero, direction) {
    var image = one('.hero-placeholder-card', hero);
    motionAnimate(image, [{ opacity: 0, clipPath: direction === 'up' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0)' }],
      { duration: 580, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    var offset = direction === 'up' ? '-105%' : '105%';
    all('.hero-word', hero).forEach(function (word, index) {
      motionAnimate(word, [{ opacity: 0, transform: 'translateY(' + offset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 680, delay: 300 + index * 130, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    });
    var summaryOffset = direction === 'up' ? '-16px' : '16px';
    motionAnimate(one('.hero-summary', hero), [{ opacity: 0, transform: 'translateY(' + summaryOffset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 520, delay: 260, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    motionAnimate(one('.hero-rule', hero), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: 760, delay: 210, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  }

  function exitTarget(target, direction) {
    var offset = direction === 'up' ? '12px' : '-12px';
    function exitElement(element, clipPath) {
      motionAnimate(element, [{ opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' }, { opacity: 0, transform: 'translateY(' + offset + ')', clipPath: clipPath || 'inset(0)' }],
        { duration: 180, easing: 'cubic-bezier(.25,1,.5,1)', fill: 'both' });
    }
    if (target.hasAttribute('data-motion-title')) {
      all('.title-word', target).forEach(function (word) { exitElement(word); });
    } else if (target.hasAttribute('data-motion-scene')) {
      exitElement(one('.scene-copy', target));
      exitElement(one('.scene-image-button', target), direction === 'up' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)');
    } else if (target.hasAttribute('data-motion-list')) {
      listItems(target).forEach(function (item) { exitElement(item); });
    } else if (target.hasAttribute('data-motion-hero')) {
      exitElement(one('.hero-placeholder-card', target), direction === 'up' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)');
      all('.hero-word', target).forEach(function (word) { exitElement(word); });
      exitElement(one('.hero-summary', target));
      motionAnimate(one('.hero-rule', target), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: 180, easing: 'cubic-bezier(.25,1,.5,1)', fill: 'both' });
    } else exitElement(target);
    target.dataset.motionState = 'armed';
  }

  function revealTarget(target, direction) {
    if (!target) return;
    target.dataset.motionState = 'visible';
    if (target.hasAttribute('data-motion-hero')) revealHero(target, direction);
    else if (target.hasAttribute('data-motion-title')) revealTitle(target, direction);
    else if (target.hasAttribute('data-motion-scene')) revealScene(target, direction);
    else if (target.hasAttribute('data-motion-list')) revealList(target, direction);
    else revealStandalone(target, direction);
  }

  function finishAllMotion() {
    if (state.motionObserver) state.motionObserver.disconnect();
    state.motionObserver = null;
    state.motionAnimations.forEach(function (animation) { try { animation.cancel(); } catch (error) {} });
    state.motionAnimations.clear();
    state.animations.forEach(function (animation) { try { animation.finish(); } catch (error) { animation.cancel(); } });
    state.animations.length = 0;
    all('.title-word, .hero-word, .hero-placeholder-card, .hero-summary, .hero-rule, [data-motion-item], [data-motion-scene] .scene-copy, [data-motion-scene] .scene-image-button').forEach(clearMotionState);
  }

  function setupMotion() {
    finishAllMotion();
    wrapHeadings();
    var targets = all('[data-motion-hero], [data-motion-title], [data-motion-scene], [data-motion-list]');
    all('[data-motion-item]').forEach(function (item) { if (!item.closest('[data-motion-list]')) targets.push(item); });
    state.motionTargets = targets;
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    if (!state.motionScrollBound) {
      window.addEventListener('scroll', function () {
        var current = window.scrollY || 0;
        if (current !== state.lastScrollY) state.scrollDirection = current > state.lastScrollY ? 'down' : 'up';
        state.lastScrollY = current;
      }, { passive: true });
      state.motionScrollBound = true;
    }
    state.motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) revealTarget(entry.target, state.scrollDirection);
        else if (entry.target.dataset.motionState === 'visible') exitTarget(entry.target, state.scrollDirection);
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    targets.forEach(function (target) { state.motionObserver.observe(target); });
  }

  /* Direction-aware motion. Content remains readable before this enhancement runs. */
  function setupMotionBidirectional() {
    if (state.motionObserver) state.motionObserver.disconnect();
    state.motionAnimations.forEach(function (animation) { try { animation.cancel(); } catch (error) {} });
    state.motionAnimations.clear();
    all('.title-word, .hero-word, .hero-placeholder-card, .hero-summary, .hero-rule, [data-motion-item], [data-motion-scene] .scene-copy, [data-motion-scene] .scene-image-button').forEach(clearMotionState);
    wrapHeadings();
    var targets = all('[data-motion-hero], [data-motion-title], [data-motion-scene], [data-motion-list]');
    all('[data-motion-item]').forEach(function (item) { if (!item.closest('[data-motion-list]')) targets.push(item); });
    state.motionTargets = targets;
    function parts(target) {
      if (target.hasAttribute('data-motion-hero')) return [one('.hero-placeholder-card', target)].concat(all('.hero-word', target), [one('.hero-summary', target), one('.hero-rule', target)]).filter(Boolean);
      if (target.hasAttribute('data-motion-title')) return all('.title-word', target);
      if (target.hasAttribute('data-motion-scene')) return [one('.scene-copy', target), one('.scene-image-button', target)].filter(Boolean);
      if (target.hasAttribute('data-motion-list')) return listItems(target);
      return [target];
    }
    function stateOf(target, next) { if (next) { state.motionStates.set(target, next); target.dataset.motionState = next; } return state.motionStates.get(target) || 'idle'; }
    function generation(target) { var value = (state.motionGeneration.get(target) || 0) + 1; state.motionGeneration.set(target, value); return value; }
    function run(part, frames, options, target, token) {
      if (!part || reducedMotion() || typeof part.animate !== 'function') return;
      cancelMotionAnimation(part);
      var animation = part.animate(frames, options);
      state.motionAnimations.set(part, animation);
      animation.finished.then(function () {
        if (state.motionGeneration.get(target) !== token || state.motionAnimations.get(part) !== animation) return;
        if (typeof animation.commitStyles === 'function') animation.commitStyles();
        animation.cancel(); state.motionAnimations.delete(part);
      }).catch(function () {});
    }
    function play(target, direction) {
      var token = generation(target), set = parts(target), offset = direction === 'up' ? -18 : 18;
      stateOf(target, 'entering');
      if (target.hasAttribute('data-motion-title') || target.hasAttribute('data-motion-hero')) {
        set.forEach(function (part, index) {
          var isRule = part.classList.contains('hero-rule');
          var isHeroImage = part.classList.contains('hero-placeholder-card');
          var distance = part.classList.contains('hero-word') || part.classList.contains('title-word') ? (direction === 'up' ? '-105%' : '105%') : offset + 'px';
          var frames = isRule ? [{ transform:'scaleX(0)' }, { transform:'scaleX(1)' }] : isHeroImage ? [{ opacity:0, clipPath:direction === 'up' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { opacity:1, clipPath:'inset(0)' }] : [{ opacity:0, transform:'translateY(' + distance + ')' }, { opacity:1, transform:'translateY(0)' }];
          var delay = isHeroImage ? 0 : Math.min(index,8)*55 + (target.hasAttribute('data-motion-hero') ? 260 : 0);
          run(part, frames, { duration:isRule ? 620 : isHeroImage ? 580 : 540, delay:delay, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }, target, token);
        });
      } else if (target.hasAttribute('data-motion-scene')) {
        run(set[0], [{ opacity:0, transform:'translateY(' + offset + 'px)' }, { opacity:1, transform:'translateY(0)' }], { duration:460, delay:100, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }, target, token);
        run(set[1], [{ opacity:0, clipPath:direction === 'up' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { opacity:1, clipPath:'inset(0)' }], { duration:640, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }, target, token);
      } else {
        if (direction === 'up') set = set.slice().reverse();
        set.forEach(function (part, index) { run(part, [{ opacity:0, transform:'translateY(' + offset + 'px)' }, { opacity:1, transform:'translateY(0)' }], { duration:420, delay:Math.min(index,8)*48, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }, target, token); });
      }
      window.setTimeout(function () { if (state.motionGeneration.get(target) === token) stateOf(target, 'visible'); }, 710);
    }
    function arm(target, direction) {
      var token = generation(target), set = parts(target), offset = direction === 'up' ? 12 : -12;
      stateOf(target, 'exiting');
      set.forEach(function (part) { var isImage = part.classList.contains('scene-image-button') || part.classList.contains('hero-placeholder-card'); run(part, [{ opacity:1, transform:'translateY(0)', clipPath:'inset(0)' }, { opacity:0, transform:'translateY(' + offset + 'px)', clipPath:isImage ? (direction === 'up' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)') : 'inset(0)' }], { duration:170, easing:'cubic-bezier(.25,1,.5,1)', fill:'both' }, target, token); });
      window.setTimeout(function () { if (state.motionGeneration.get(target) === token) stateOf(target, 'idle'); }, 190);
    }
    if (reducedMotion() || !('IntersectionObserver' in window) || !('animate' in document.documentElement)) return;
    if (!state.motionScrollBound) {
      window.addEventListener('scroll', function () {
        if (state.motionRaf) return;
        state.motionRaf = window.requestAnimationFrame(function () {
          var current = window.scrollY || 0;
          if (current !== state.lastScrollY) state.scrollDirection = current > state.lastScrollY ? 'down' : 'up';
          state.lastScrollY = current;
          targets.forEach(function (target) {
            var rect = target.getBoundingClientRect(), motionState = stateOf(target);
            if ((rect.bottom < 0 || rect.top > window.innerHeight) && (motionState === 'visible' || motionState === 'entering')) arm(target, state.scrollDirection);
          });
          state.motionRaf = 0;
        });
      }, { passive:true });
      state.motionScrollBound = true;
    }
    state.motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var current = stateOf(entry.target), rect = entry.target.getBoundingClientRect();
        if (entry.isIntersecting) { if (current !== 'visible') play(entry.target, state.scrollDirection); }
        else if ((rect.bottom < 0 || rect.top > window.innerHeight) && (current === 'visible' || current === 'entering')) arm(entry.target, state.scrollDirection);
      });
    }, { root:null, rootMargin:'0px 0px -8% 0px', threshold:[0,.06,.25] });
    targets.forEach(function (target) { stateOf(target, 'idle'); state.motionObserver.observe(target); });
  }

  function hydrateFeatureImages() {
    all('[data-feature-media]').forEach(function (image) {
      var id = image.getAttribute('data-feature-media');
      var project = projectFor(id);
      var mediaList = galleryFor('project:' + id, project.media);
      var media = mediaList[0];
      var source = sourceFor(media, false);
      var button = image.closest('.scene-image-button');
      if (!media || !source) { image.removeAttribute('src'); if (button) button.classList.add('media-unavailable'); return; }
      var details = imageDetails(media, false);
      image.src = source;
      image.alt = details.alt || media.alt || '';
      if (details.width) image.width = details.width;
      if (details.height) image.height = details.height;
      applyFocalPoint(image, media);
      image.addEventListener('error', function () {
        var button = image.closest('.scene-image-button');
        if (button) button.classList.add('media-unavailable');
      }, { once: true });
    });
  }

  function setupCardImages() {
    all('.image-card .card-media').forEach(function (image) {
      if (image.hasAttribute('data-card-static')) return;
      var card = image.closest('.image-card');
      var trigger = image.closest('.entry-trigger');
      var key = trigger ? trigger.getAttribute('data-entry-type') + ':' + trigger.getAttribute('data-entry-id') : 'project:' + (card && card.getAttribute('data-project') || '');
      var fallback = [{ id: key + '-01', kind: 'image', status: 'temporary-preview', src: image.getAttribute('src'), type: 'image/jpeg', width: image.width || null, height: image.height || null, alt: image.getAttribute('alt') || '', caption: '' }];
      var list = galleryFor(key, fallback);
      var media = list[0];
      var source = sourceFor(media, false);
      var stockLabel = card && one('.stock-label', card);
      if (stockLabel) stockLabel.hidden = Boolean(media && media.status !== 'temporary-preview');
      if (!media || !source || mediaKind(media) === 'unknown') { image.removeAttribute('src'); if (card) card.classList.add('media-unavailable'); return; }
      var details = imageDetails(media, false) || media;
      image.src = source; image.alt = details.alt || media.alt || '';
      if (details.width) image.width = details.width;
      if (details.height) image.height = details.height;
      applyFocalPoint(image, media);
      image.addEventListener('error', function () {
        if (card) card.classList.add('media-unavailable');
      }, { once: true });
    });
  }

  function setupProjects() {
    var caseDialog = one('#case-dialog');
    var caseNumber = one('#case-number');
    var caseTitle = one('#case-title');
    var caseSummary = one('#case-summary');
    var caseFocus = one('#case-focus');
    var detailBlocks = one('#entry-detail-blocks');
    var caseContent = one('.dialog-content', caseDialog);
    var caseClose = one('.dialog-close', caseDialog);
    var stage = one('#case-media');
    var viewport = one('#media-viewport');
    var loadingPanel = one('#media-loading');
    var futurePanel = one('#media-future');
    var errorPanel = one('#media-error');
    var image = one('#case-image');
    var video = one('#case-video');
    var caption = one('#media-caption');
    var sourceText = one('#media-source');
    var liveStatus = one('#media-live-status');
    var counter = one('#media-counter');
    var expand = one('#media-expand');
    var playAnimation = one('#media-play-animation');
    var lightboxPlayAnimation = one('#lightbox-play-animation');
    var retry = one('#media-retry');
    var previous = one('#media-prev');
    var next = one('#media-next');
    var thumbnails = one('#media-thumbnails');
    var lightbox = one('#media-lightbox');
    var lightboxViewport = one('#lightbox-viewport');
    var lightboxClose = one('#lightbox-close');
    var lightboxTitle = one('#lightbox-title');
    var lightboxCounter = one('#lightbox-counter');
    var lightboxCaption = one('#lightbox-caption');
    var lightboxSource = one('#lightbox-source');
    var loadTimeout = 0;
    var setupDone = false;
    if (!caseDialog || !caseTitle || !thumbnails || !viewport) return;

    function currentRecord() { return state.activeRecord || projectFor(state.projectId); }
    function currentMedia() { var record = currentRecord(); return record && Array.isArray(record.media) ? record.media : []; }
    function mediaType(media) { return mediaKind(media); }
    function isAnimated(media) { return mediaType(media) === 'gif'; }
    function isVideo(media) { return mediaType(media) === 'video' || String(media && media.type || '').indexOf('video/') === 0; }
    function announce(message) { if (liveStatus) liveStatus.textContent = message; }
    function clearLoadTimeout() { if (loadTimeout) { window.clearTimeout(loadTimeout); loadTimeout = 0; } }

    function setPanel(name) {
      if (loadingPanel) loadingPanel.hidden = name !== 'loading';
      if (futurePanel) futurePanel.hidden = name !== 'future' && name !== 'empty';
      if (errorPanel) errorPanel.hidden = name !== 'error';
      if (image) image.hidden = name !== 'image' || state.activeElement !== image;
      if (video) video.hidden = name !== 'video' || state.activeElement !== video;
      viewport.setAttribute('aria-busy', String(name === 'loading'));
    }

    function safeSourceUrl(url) {
      if (!url) return null;
      var value = String(url).trim();
      if (/^(?:https?:|\.\.?\/|\/|assets\/)/i.test(value)) return value;
      return null;
    }

    function renderSource(target, media) {
      if (!target) return;
      target.textContent = '';
      if (!media) return;
      var pieces = [];
      if (media.citation && media.citation.label) pieces.push(media.citation.label);
      if (pieces.length) target.textContent = pieces.join(' · ');
      /* URLs stay in the data contract; a source label is intentionally plain
       * text so a reviewed manifest can never inject a link into the viewer. */
      target.dataset.sourceUrl = safeSourceUrl(media.citation && media.citation.url) || '';
    }

    function updateControls(record) {
      var list = record && Array.isArray(record.media) ? record.media : [];
      var length = list.length;
      var position = length ? state.mediaIndex + 1 : 0;
      if (counter) counter.textContent = 'Media ' + position + ' of ' + length;
      if (lightboxCounter) lightboxCounter.textContent = 'Media ' + position + ' of ' + length;
      if (previous) previous.disabled = !length || state.mediaIndex <= 0;
      if (next) next.disabled = !length || state.mediaIndex >= length - 1;
      if (expand) expand.disabled = !state.activeMedia || !state.activeElement;
      all('.media-thumbnail', thumbnails).forEach(function (button, index) {
        button.setAttribute('aria-pressed', String(index === state.mediaIndex));
      });
    }

    function scrollSelectedThumbnail() {
      var selected = one('.media-thumbnail[aria-pressed="true"]', thumbnails);
      if (!selected) return;
      var left = selected.offsetLeft; var right = left + selected.offsetWidth;
      if (left < thumbnails.scrollLeft) thumbnails.scrollLeft = left;
      else if (right > thumbnails.scrollLeft + thumbnails.clientWidth) thumbnails.scrollLeft = right - thumbnails.clientWidth;
    }

    function mediaLabel(media, index, length) {
      if (!media || media.status === 'future') return 'Future media slot ' + (index + 1) + ' of ' + length;
      if (isAnimated(media) && !sourceFor(media, false)) return 'Animated media ' + (index + 1) + ' of ' + length + ', poster unavailable';
      if (isVideo(media) && !media.poster) return 'Video ' + (index + 1) + ' of ' + length + ', poster unavailable';
      return 'Show media ' + (index + 1) + ' of ' + length;
    }

    function syncAnimationControls() {
      var media = currentMedia()[state.mediaIndex];
      var visible = Boolean(media && isAnimated(media) && !reducedMotion());
      [playAnimation, lightboxPlayAnimation].forEach(function (button) {
        if (!button) return;
        button.hidden = !visible;
        button.textContent = state.gifAnimating ? 'Stop animation' : 'Play animation';
      });
    }

    function buildThumbnails(record) {
      thumbnails.textContent = '';
      var list = record && Array.isArray(record.media) ? record.media : [];
      thumbnails.setAttribute('aria-label', list.length ? 'Choose from ' + list.length + ' media items' : 'No media supplied');
      list.forEach(function (media, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'media-thumbnail';
        button.dataset.mediaIndex = String(index);
        button.setAttribute('aria-label', mediaLabel(media, index, list.length));
        button.setAttribute('aria-pressed', String(index === state.mediaIndex));
        var thumbSource = isVideo(media) ? (media.poster && media.poster.src ? media.poster.src : null) : sourceFor(media, false);
        if (media.status === 'future' || !thumbSource || mediaType(media) === 'unknown') {
          button.classList.add('media-thumbnail-future');
          var slot = document.createElement('span');
          slot.className = 'media-thumbnail-label';
          slot.textContent = media.status === 'future' ? 'Future ' + String(index + 1).padStart(2, '0') : (isAnimated(media) ? 'Poster unavailable' : 'Preview unavailable');
          button.appendChild(slot);
        } else {
          var thumb = document.createElement('img');
          var details = imageDetails(media, false) || media;
          thumb.src = thumbSource;
          thumb.alt = '';
          thumb.loading = 'lazy';
          thumb.decoding = 'async';
          if (details.width) thumb.width = details.width;
          if (details.height) thumb.height = details.height;
          applyFocalPoint(thumb, media);
          thumb.addEventListener('error', function () { button.classList.add('media-thumbnail-future'); thumb.remove(); var label = document.createElement('span'); label.className = 'media-thumbnail-label'; label.textContent = 'Preview unavailable'; button.appendChild(label); }, { once: true });
          button.appendChild(thumb);
        }
        thumbnails.appendChild(button);
      });
    }

    function saveVideoState() {
      if (!video || !state.activeMedia || state.activeElement !== video) return;
      state.mediaPlayback[playbackKey(state.activeMedia)] = {
        currentTime: Number(video.currentTime) || 0,
        playbackRate: Number(video.playbackRate) || 1,
        volume: typeof video.volume === 'number' ? video.volume : 1,
        muted: Boolean(video.muted),
        paused: Boolean(video.paused)
      };
    }

    function playbackKey(media) {
      var record = state.activeRecord;
      return (record ? record.type + ':' + record.id + '|' : '') + String(media && media.id || 'media');
    }

    function pauseAndDisposeVideo() {
      if (!video) return;
      saveVideoState();
      video.onloadedmetadata = null;
      video.oncanplay = null;
      video.onerror = null;
      try { video.pause(); } catch (error) {}
      video.removeAttribute('src');
      while (video.firstChild) video.removeChild(video.firstChild);
      try { video.load(); } catch (error) {}
    }

    function detachActiveMedia() {
      clearLoadTimeout();
      if (state.activeElement === video) pauseAndDisposeVideo();
      if (image) { image.onload = null; image.onerror = null; image.removeAttribute('src'); image.hidden = true; }
      if (video) video.hidden = true;
      state.activeElement = null;
      state.activeMedia = null;
    }

    function setDimensions(element, details) {
      if (!element || !details) return;
      element.removeAttribute('width'); element.removeAttribute('height');
      if (details.width) element.width = details.width;
      if (details.height) element.height = details.height;
    }

    function applySavedVideoState() {
      if (!video || !state.activeMedia) return;
      var saved = state.mediaPlayback[playbackKey(state.activeMedia)];
      if (!saved) return;
      video.playbackRate = saved.playbackRate;
      video.volume = saved.volume;
      video.muted = saved.muted;
      if (Number.isFinite(saved.currentTime) && saved.currentTime > 0) {
        try { video.currentTime = saved.currentTime; } catch (error) {}
      }
    }

    function beginLoad(media, token, element, source, readyName, details, shouldAnnounce) {
      state.activeElement = element;
      state.activeMedia = media;
      var mediaTarget = state.lightboxOpen && lightboxViewport ? lightboxViewport : viewport;
      if (element.parentNode !== mediaTarget) mediaTarget.appendChild(element);
      setDimensions(element, details);
      applyFocalPoint(element, media);
      element.hidden = true;
      setPanel('loading');
      var settled = false;
      function valid() { return token === state.mediaToken && state.caseOpen && state.activeMedia === media && state.activeElement === element; }
      function succeed() {
        if (settled || !valid()) return;
        settled = true; clearLoadTimeout(); setPanel(readyName); if (expand) expand.disabled = false;
        if (shouldAnnounce) announce('Media ' + (state.mediaIndex + 1) + ' of ' + currentMedia().length + ' loaded.');
        scrollSelectedThumbnail();
      }
      function fail(message) {
        if (settled || !valid()) return;
        settled = true; clearLoadTimeout(); if (errorPanel) errorPanel.textContent = message; if (retry) retry.hidden = false; setPanel('error'); announce(message);
      }
      if (element === image) {
        element.onload = succeed;
        element.onerror = function () { fail('Preview image could not be loaded.'); };
        element.src = source;
      } else {
        element.onloadedmetadata = function () { if (!valid()) return; applySavedVideoState(); succeed(); };
        element.oncanplay = succeed;
        element.onerror = function () { fail('Preview video could not be loaded.'); };
        element.preload = 'metadata';
        element.src = source;
        element.load();
      }
      loadTimeout = window.setTimeout(function () { fail('Preview took too long to load. Try again.'); }, 8000);
    }

    function showEmpty(record) {
      state.mediaToken += 1;
      detachActiveMedia();
      state.mediaIndex = 0;
      updateControls(record);
      if (futurePanel) futurePanel.textContent = 'No media has been supplied.';
      if (caption) caption.textContent = 'No media has been supplied.';
      renderSource(sourceText, null);
      if (retry) retry.hidden = true;
      setPanel('empty');
    }

    var announceChange = false;
    function showMedia(record, index, shouldAnnounce, animateGif) {
      var list = record && Array.isArray(record.media) ? record.media : [];
      announceChange = Boolean(shouldAnnounce);
      if (!list.length) { showEmpty(record); announceChange = false; return; }
      state.mediaIndex = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
      state.mediaToken += 1;
      var token = state.mediaToken;
      var media = list[state.mediaIndex];
      state.gifAnimating = Boolean(animateGif);
      if (state.lightboxOpen && state.activeElement) moveActive(viewport);
      detachActiveMedia();
      updateControls(record);
      if (retry) retry.hidden = true;
      syncAnimationControls();
      if (expand) expand.textContent = isVideo(media) ? 'Enlarge video' : 'Enlarge image';
      if (caption) caption.textContent = media.caption || '';
      renderSource(sourceText, media);
      if (media.status === 'future') {
        if (futurePanel) futurePanel.textContent = (media.alt || 'Future media slot.') + ' ' + (media.caption || '');
        setPanel('future'); announceChange = false; if (shouldAnnounce) announce('Future media slot ' + (state.mediaIndex + 1) + ' of ' + list.length + '.'); return;
      }
      if (mediaType(media) === 'unknown') {
        if (errorPanel) errorPanel.textContent = 'This media item has an unsupported type.';
        setPanel('error'); announceChange = false; return;
      }
      var source = sourceFor(media, state.gifAnimating);
      var details = imageDetails(media, state.gifAnimating) || media;
      if (!source) {
        if (errorPanel) errorPanel.textContent = isAnimated(media) ? 'Animated media needs a static poster before it can be shown.' : 'Preview is unavailable.';
        setPanel('error'); announceChange = false; return;
      }
      if (isVideo(media)) {
        if (!video) { if (errorPanel) errorPanel.textContent = 'Video playback is unavailable in this browser.'; setPanel('error'); announceChange = false; return; }
        if (media.poster && media.poster.src) video.poster = media.poster.src; else video.removeAttribute('poster');
        video.alt = media.alt || '';
        (media.tracks || []).forEach(function (track) {
          var node = document.createElement('track'); node.kind = track.kind || 'captions'; node.src = track.src; node.srclang = track.srclang || 'en'; node.label = track.label || 'English'; video.appendChild(node);
        });
        beginLoad(media, token, video, source, 'video', details, shouldAnnounce);
      } else {
        if (!image) { if (errorPanel) errorPanel.textContent = 'Image preview is unavailable.'; setPanel('error'); announceChange = false; return; }
        image.alt = details.alt || media.alt || '';
        beginLoad(media, token, image, source, 'image', details, shouldAnnounce);
      }
      announceChange = false;
    }

    function renderEmphasised(paragraph, text, label) {
      var patterns = {
        'Personal contribution': /^(?:Owned|Contributed|Engineered|Developed|Performed|Produced|Investigated|Conceived)\b/g,
        Method: /\b(?:SolidWorks(?: Simulation)?|Simulink|ANSYS Fluent|AutoCAD|Revit|SAP2000|Dynamo|DS18B20|MATLAB|OpenFOAM|HPC|FEM|Helmholtz model)\b/g,
        Result: /(?:about 33%|62% faster|56% to 80%|3 to 15 W|under one minute|15 slab-to-beam conflicts|40% reduction|1,130 mm wingspan|10°C in 24 minutes|96 to 108 W|approximately 40% simulated desk coverage|about 13 times|1\.2 to 1\.5 safety factor|81% of the variance|28% simulated ventilation gain|25-member international industry panel)/gi,
        Limitations: /(?:not a sea trial|simulated only|not a constructed building|not measured|not been bench-tested|not available|No coefficient of performance|No physical router measurement|observational analysis)/gi
      };
      var expression = patterns[label];
      if (!expression) { paragraph.textContent = text; return; }
      var cursor = 0; var match;
      while ((match = expression.exec(text))) {
        if (match.index > cursor) paragraph.appendChild(document.createTextNode(text.slice(cursor, match.index)));
        var strong = document.createElement('strong'); strong.textContent = match[0]; paragraph.appendChild(strong); cursor = match.index + match[0].length;
      }
      if (cursor < text.length) paragraph.appendChild(document.createTextNode(text.slice(cursor)));
    }

    function renderDetailBlocks(record) {
      if (!detailBlocks) return;
      detailBlocks.textContent = '';
      (record.detailBlocks || []).forEach(function (block) {
        var section = document.createElement('section'); var heading = document.createElement('h3'); var paragraph = document.createElement('p');
        heading.textContent = block.label; renderEmphasised(paragraph, block.text || '', block.label); section.appendChild(heading); section.appendChild(paragraph); detailBlocks.appendChild(section);
      });
    }

    function futureMedia(recordId, slot, typeLabel) {
      return normalizeMedia({ id: recordId + '-' + slot, kind: 'slot', status: 'future', src: null, type: null, width: null, height: null, alt: 'Future media slot ' + slot + '. No asset supplied.', caption: 'Future ' + typeLabel.toLowerCase() + ' media slot ' + slot + ' of 5. No asset has been supplied.' }, slot - 1);
    }

    function entryRecord(trigger) {
      var type = trigger.getAttribute('data-entry-type'); var id = trigger.getAttribute('data-entry-id'); var source = one('.entry-source', trigger);
      if (!type || !id || !source) return null;
      var title = one('.card-title', trigger); var organisation = one('[data-entry-organisation]', source); var summary = one('[data-entry-summary]', source); var date = one('time', trigger);
      var fallback = [normalizeMedia({ id: type + '-' + id + '-01', kind: 'image', status: 'temporary-preview', src: source.getAttribute('data-preview'), type: 'image/jpeg', width: Number(source.getAttribute('data-preview-width')) || null, height: Number(source.getAttribute('data-preview-height')) || null, alt: source.getAttribute('data-preview-alt') || 'Temporary preview image', caption: 'Temporary stock image only. It is not ' + type + ' evidence.' }, 0)];
      for (var slot = 2; slot <= 5; slot += 1) fallback.push(futureMedia(type + '-' + id, slot, type === 'research' ? 'Research' : 'Activity'));
      return { type: type, id: id, typeLabel: type === 'research' ? 'Research' : 'Activity', title: title ? title.textContent.trim() : type, organisation: organisation ? organisation.textContent.trim() : '', dates: date ? date.textContent.trim() : '', focus: organisation ? organisation.textContent.trim() : type, summary: summary ? summary.textContent.trim() : '', detailBlocks: all('[data-detail-label]', source).map(function (item) { return { label: item.getAttribute('data-detail-label'), text: item.textContent.trim() }; }), media: galleryFor(type + ':' + id, fallback) };
    }

    function projectRecord(id) {
      var project = projectFor(id);
      return { type: 'project', id: id, typeLabel: 'Project P' + id, title: project.title, organisation: '', dates: '', focus: project.focus || 'Engineering project', summary: project.summary || '', media: galleryFor('project:' + id, project.media), detailBlocks: [{ label: 'Brief', text: project.details.brief }, { label: 'Personal contribution', text: project.details.contribution }, { label: 'Method', text: project.details.method }, { label: 'Result', text: project.details.result }, { label: 'Limitations', text: project.details.limitations }] };
    }

    function openProject(trigger) {
      var projectId = trigger.getAttribute('data-project'); var record = projectId && PROJECT_IDS.indexOf(projectId) !== -1 ? projectRecord(projectId) : entryRecord(trigger);
      if (!record) return;
      state.caseOpenToken += 1; var openToken = state.caseOpenToken; state.caseCloseToken = 0; state.projectId = record.type === 'project' ? record.id : record.type + '-' + record.id; state.activeRecord = record; state.mediaIndex = 0; state.gifAnimating = false; state.opener = trigger;
      if (caseNumber) caseNumber.textContent = record.typeLabel; caseTitle.textContent = record.title; if (caseFocus) caseFocus.textContent = [record.focus, record.dates].filter(Boolean).join(' / '); if (caseSummary) caseSummary.textContent = record.summary || '';
      renderDetailBlocks(record); buildThumbnails(record); if (caseContent) caseContent.scrollTop = 0; lockPage();
      try { state.caseOpen = openNativeDialog(caseDialog); } catch (error) { state.caseOpen = false; unlockPage(); console.error('[portfolio:open-project]', error); return; }
      showMedia(record, 0, false); window.setTimeout(function () { if (state.caseOpen && state.caseOpenToken === openToken && state.opener === trigger && caseClose) caseClose.focus(); }, 0);
    }

    function moveActive(target) {
      if (!state.activeElement || !target) return;
      if (state.activeElement === video) saveVideoState();
      if (state.activeElement.parentNode !== target) target.appendChild(state.activeElement);
    }
    function openLightbox() {
      if (!state.caseOpen || !state.activeMedia || !state.activeElement || !lightbox || !lightboxViewport) return;
      moveActive(lightboxViewport); if (lightboxTitle) lightboxTitle.textContent = state.activeRecord ? state.activeRecord.title : 'Full media'; if (lightboxCaption) lightboxCaption.textContent = state.activeMedia.caption || ''; renderSource(lightboxSource, state.activeMedia); state.lightboxOpenToken += 1;
      try { state.lightboxOpen = openNativeDialog(lightbox); } catch (error) { moveActive(viewport); state.lightboxOpen = false; console.error('[portfolio:open-lightbox]', error); return; }
      window.setTimeout(function () { if (state.lightboxOpen && lightboxClose) lightboxClose.focus(); }, 0);
    }

    function closeLightbox(restoreFocus) {
      if (!state.lightboxOpen && (!lightbox || !lightbox.open)) return;
      state.lightboxOpen = false; moveActive(viewport); setPanel(isVideo(state.activeMedia) ? 'video' : 'image'); var token = state.lightboxOpenToken; closeNativeDialog(lightbox);
      if (restoreFocus && expand) window.setTimeout(function () { if (!state.caseOpen || token !== state.lightboxOpenToken) return; expand.focus(); }, 0);
    }

    function closeProject() {
      if (!state.caseOpen && !caseDialog.open) return;
      if (state.lightboxOpen || (lightbox && lightbox.open)) closeLightbox(false);
      state.mediaToken += 1; clearLoadTimeout(); state.caseCloseToken = state.caseOpenToken; state.caseOpen = false; detachActiveMedia(); closeNativeDialog(caseDialog); unlockPage();
    }

    function backdropClick(event, dialog) { var rect = dialog.getBoundingClientRect(); return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; }

    document.addEventListener('click', function (event) { var trigger = event.target.closest('.project-trigger[data-project], .entry-trigger[data-entry-type][data-entry-id]'); if (trigger && !trigger.disabled) { event.preventDefault(); openProject(trigger); } });
    thumbnails.addEventListener('click', function (event) { var button = event.target.closest('.media-thumbnail[data-media-index]'); if (button && state.caseOpen) showMedia(currentRecord(), Number(button.dataset.mediaIndex), true); });
    if (previous) previous.addEventListener('click', function () { showMedia(currentRecord(), state.mediaIndex - 1, true); });
    if (next) next.addEventListener('click', function () { showMedia(currentRecord(), state.mediaIndex + 1, true); });
    if (expand) expand.addEventListener('click', openLightbox);
    function toggleGif() { var media = currentMedia()[state.mediaIndex]; if (!media || !isAnimated(media) || reducedMotion()) return; var animateGif = !state.gifAnimating; showMedia(currentRecord(), state.mediaIndex, true, animateGif); syncAnimationControls(); }
    if (playAnimation) playAnimation.addEventListener('click', toggleGif);
    if (lightboxPlayAnimation) lightboxPlayAnimation.addEventListener('click', toggleGif);
    if (retry) retry.addEventListener('click', function () { showMedia(currentRecord(), state.mediaIndex, true, state.gifAnimating); });
    if (caseClose) caseClose.addEventListener('click', closeProject);
    if (lightboxClose) lightboxClose.addEventListener('click', function () { closeLightbox(true); });
    caseDialog.addEventListener('cancel', function (event) { event.preventDefault(); if (state.lightboxOpen) closeLightbox(true); else closeProject(); });
    caseDialog.addEventListener('click', function (event) { if (backdropClick(event, caseDialog)) closeProject(); });
    caseDialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); if (state.lightboxOpen) closeLightbox(true); else closeProject(); return; }
      if (state.lightboxOpen || event.target === video || (video && video.contains(event.target))) return;
      if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (event.key === 'ArrowLeft' && previous && !previous.disabled) { event.preventDefault(); showMedia(currentRecord(), state.mediaIndex - 1, true); }
      if (event.key === 'ArrowRight' && next && !next.disabled) { event.preventDefault(); showMedia(currentRecord(), state.mediaIndex + 1, true); }
    });
    caseDialog.addEventListener('close', function () {
      /* A consumer may call dialog.close() directly.  Clean up that path too,
       * but ignore a late close event from an older, already reopened modal. */
      if (caseDialog.open) return;
      if (state.caseOpen) { if (state.lightboxOpen) closeLightbox(false); state.caseOpen = false; state.mediaToken += 1; clearLoadTimeout(); detachActiveMedia(); }
      if (state.caseCloseToken && state.caseCloseToken !== state.caseOpenToken) return;
      var closeToken = state.caseOpenToken;
      state.projectId = null; state.activeRecord = null; state.activeMedia = null; state.activeElement = null; unlockPage(); var opener = state.opener; state.opener = null; if (opener && document.contains(opener)) window.setTimeout(function () { if (!state.caseOpen && state.caseOpenToken === closeToken) opener.focus(); }, 0);
    });
    if (lightbox) {
      lightbox.addEventListener('keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); closeLightbox(true); } });
      lightbox.addEventListener('cancel', function (event) { event.preventDefault(); closeLightbox(true); });
      lightbox.addEventListener('click', function (event) { if (backdropClick(event, lightbox)) closeLightbox(true); });
      lightbox.addEventListener('close', function () {
        if (lightbox.open) return;
        if (state.lightboxOpen) {
          state.lightboxOpen = false;
          moveActive(viewport);
          setPanel(isVideo(state.activeMedia) ? 'video' : 'image');
          if (state.caseOpen && expand) window.setTimeout(function () { if (state.caseOpen && !state.lightboxOpen) expand.focus(); }, 0);
        }
        if (state.caseOpen) unlockPage();
      });
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden && video && state.activeElement === video) { saveVideoState(); try { video.pause(); } catch (error) {} } });
    state.mediaRefresh = function () { if (state.caseOpen && state.activeRecord) showMedia(state.activeRecord, state.mediaIndex, false, reducedMotion() ? false : state.gifAnimating); };
    all('.entry-trigger[disabled]').forEach(function (trigger) { trigger.disabled = false; });
    setupDone = true;
  }

  function setupMotionPreference() {
    if (!reduceMotionQuery) return;
    function changed(event) {
      if (event.matches) finishAllMotion();
      else setupMotionBidirectional();
      hydrateFeatureImages();
      if (event.matches && state.activeElement && state.activeElement.tagName === 'VIDEO') {
        try { state.activeElement.pause(); } catch (error) {}
      }
      if (typeof state.mediaRefresh === 'function') state.mediaRefresh();
    }
    if (reduceMotionQuery.addEventListener) reduceMotionQuery.addEventListener('change', changed);
    else if (reduceMotionQuery.addListener) reduceMotionQuery.addListener(changed);
  }

  function initialise() {
    var year = one('#current-year');
    if (year) year.textContent = String(new Date().getFullYear());
    safely('navigation', setupNavigation);
    safely('feature-media', hydrateFeatureImages);
    safely('card-media', setupCardImages);
    safely('projects', setupProjects);
    safely('motion', setupMotionBidirectional);
    safely('motion-preference', setupMotionPreference);
    document.documentElement.classList.add('portfolio-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
}());
