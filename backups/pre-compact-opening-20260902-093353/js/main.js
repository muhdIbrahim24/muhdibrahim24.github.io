(function () {
  'use strict';

  var PROJECT_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  var projects = window.PORTFOLIO_PROJECTS || {};
  var reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var state = {
    projectId: null,
    mediaIndex: 0,
    mediaToken: 0,
    activeMedia: null,
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

  function sourceFor(media) {
    if (!media || media.status === 'future' || !media.src) return null;
    if (reducedMotion() && media.type === 'image/gif') return media.poster && media.poster.src ? media.poster.src : null;
    return media.src;
  }

  function imageDetails(media) {
    if (reducedMotion() && media && media.type === 'image/gif' && media.poster) return media.poster;
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
    var offset = direction === 'up' ? '-105%' : '105%';
    all('.hero-word', hero).forEach(function (word, index) {
      motionAnimate(word, [{ opacity: 0, transform: 'translateY(' + offset + ')' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 680, delay: 70 + index * 130, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
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
    all('.title-word, .hero-word, .hero-summary, .hero-rule, [data-motion-item], [data-motion-scene] .scene-copy, [data-motion-scene] .scene-image-button').forEach(clearMotionState);
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
    all('.title-word, .hero-word, .hero-summary, .hero-rule, [data-motion-item], [data-motion-scene] .scene-copy, [data-motion-scene] .scene-image-button').forEach(clearMotionState);
    wrapHeadings();
    var targets = all('[data-motion-hero], [data-motion-title], [data-motion-scene], [data-motion-list]');
    all('[data-motion-item]').forEach(function (item) { if (!item.closest('[data-motion-list]')) targets.push(item); });
    state.motionTargets = targets;
    function parts(target) {
      if (target.hasAttribute('data-motion-hero')) return all('.hero-word', target).concat([one('.hero-summary', target), one('.hero-rule', target)]).filter(Boolean);
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
          var distance = part.classList.contains('hero-word') || part.classList.contains('title-word') ? (direction === 'up' ? '-105%' : '105%') : offset + 'px';
          run(part, isRule ? [{ transform:'scaleX(0)' }, { transform:'scaleX(1)' }] : [{ opacity:0, transform:'translateY(' + distance + ')' }, { opacity:1, transform:'translateY(0)' }], { duration:isRule ? 620 : 540, delay:Math.min(index,8)*55, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }, target, token);
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
      set.forEach(function (part) { run(part, [{ opacity:1, transform:'translateY(0)', clipPath:'inset(0)' }, { opacity:0, transform:'translateY(' + offset + 'px)', clipPath:part.classList.contains('scene-image-button') ? (direction === 'up' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)') : 'inset(0)' }], { duration:170, easing:'cubic-bezier(.25,1,.5,1)', fill:'both' }, target, token); });
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
      var project = projectFor(image.getAttribute('data-feature-media'));
      var media = project.media[0];
      var source = sourceFor(media);
      if (!media || !source) return;
      var details = imageDetails(media);
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
      image.addEventListener('error', function () {
        var card = image.closest('.image-card');
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
    var caption = one('#media-caption');
    var liveStatus = one('#media-live-status');
    var counter = one('#media-counter');
    var expand = one('#media-expand');
    var previous = one('#media-prev');
    var next = one('#media-next');
    var thumbnails = one('#media-thumbnails');
    var lightbox = one('#media-lightbox');
    var lightboxClose = one('#lightbox-close');
    var lightboxImage = one('#lightbox-image');
    var lightboxTitle = one('#lightbox-title');
    var lightboxCounter = one('#lightbox-counter');
    var lightboxCaption = one('#lightbox-caption');
    if (!caseDialog || !caseTitle || !thumbnails) return;

    function setPanel(name) {
      if (loadingPanel) loadingPanel.hidden = name !== 'loading';
      if (futurePanel) futurePanel.hidden = name !== 'future';
      if (errorPanel) errorPanel.hidden = name !== 'error';
      if (image) image.hidden = name !== 'image';
      if (viewport) viewport.setAttribute('aria-busy', String(name === 'loading'));
    }
    function announce(message) { if (liveStatus) liveStatus.textContent = message; }
    function updateControls(project) {
      var length = project.media.length || 1;
      var position = state.mediaIndex + 1;
      if (counter) counter.textContent = 'Media ' + position + ' of ' + length;
      if (lightboxCounter) lightboxCounter.textContent = 'Media ' + position + ' of ' + length;
      if (previous) previous.disabled = state.mediaIndex <= 0;
      if (next) next.disabled = state.mediaIndex >= length - 1;
      all('.media-thumbnail', thumbnails).forEach(function (button, index) { button.setAttribute('aria-pressed', String(index === state.mediaIndex)); });
    }
    function mediaLabel(media, index, length) {
      if (media.status === 'future') return 'Future slot ' + (index + 1) + ' of ' + length;
      return 'Show media ' + (index + 1) + ' of ' + length;
    }
    function buildThumbnails(project) {
      thumbnails.textContent = '';
      project.media.forEach(function (media, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'media-thumbnail';
        button.dataset.mediaIndex = String(index);
        button.setAttribute('aria-label', mediaLabel(media, index, project.media.length));
        button.setAttribute('aria-pressed', String(index === 0));
        if (media.status === 'future' || !sourceFor(media)) {
          button.classList.add('media-thumbnail-future');
          var slot = document.createElement('span');
          slot.className = 'media-thumbnail-label';
          slot.textContent = media.status === 'future' ? 'Future ' + String(index + 1).padStart(2, '0') : 'Preview unavailable';
          button.appendChild(slot);
        } else {
          var thumb = document.createElement('img');
          var details = imageDetails(media);
          thumb.src = sourceFor(media);
          thumb.alt = '';
          thumb.loading = 'lazy';
          thumb.decoding = 'async';
          if (details.width) thumb.width = details.width;
          if (details.height) thumb.height = details.height;
          applyFocalPoint(thumb, media);
          button.appendChild(thumb);
        }
        thumbnails.appendChild(button);
      });
    }
    function showMedia(project, index, announceChange) {
      if (!project.media.length) {
        state.activeMedia = null;
        if (futurePanel) futurePanel.textContent = 'Media will be added here.';
        if (caption) caption.textContent = 'No media has been supplied.';
        if (expand) expand.disabled = true;
        setPanel('future');
        return;
      }
      state.mediaIndex = Math.max(0, Math.min(index, project.media.length - 1));
      state.mediaToken += 1;
      var token = state.mediaToken;
      var media = project.media[state.mediaIndex];
      var source = sourceFor(media);
      state.activeMedia = null;
      updateControls(project);
      if (expand) expand.disabled = true;
      if (media.status === 'future') {
        if (futurePanel) futurePanel.textContent = (media.alt || 'Future media slot.') + ' ' + (media.caption || '');
        if (caption) caption.textContent = media.caption || 'Future project media slot.';
        setPanel('future');
        if (announceChange) announce('Future media slot ' + (state.mediaIndex + 1) + ' of ' + project.media.length + '.');
        return;
      }
      if (!source) {
        if (errorPanel) errorPanel.textContent = 'Animated media is paused and no static poster is available.';
        if (caption) caption.textContent = media.caption || 'Preview unavailable.';
        setPanel('error');
        if (announceChange) announce('Preview unavailable.');
        return;
      }
      setPanel('loading');
      if (caption) caption.textContent = media.caption || '';
      var loader = new Image();
      loader.onload = function () {
        if (token !== state.mediaToken || !state.caseOpen) return;
        var details = imageDetails(media);
        image.src = source;
        image.alt = details.alt || media.alt || '';
        if (details.width) image.width = details.width;
        if (details.height) image.height = details.height;
        applyFocalPoint(image, media);
        state.activeMedia = media;
        setPanel('image');
        if (expand) expand.disabled = false;
        if (!reducedMotion() && typeof image.animate === 'function') image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
        if (announceChange) announce('Media ' + (state.mediaIndex + 1) + ' of ' + project.media.length + ' loaded.');
      };
      loader.onerror = function () {
        if (token !== state.mediaToken || !state.caseOpen) return;
        if (errorPanel) errorPanel.textContent = 'Preview image could not be loaded.';
        setPanel('error');
        announce('Preview image could not be loaded.');
      };
      loader.src = source;
    }
    function animatePaperOpen() {
      if (reducedMotion() || !stage || typeof stage.animate !== 'function') return;
      var back = one('.paper-layer-back', stage);
      var middle = one('.paper-layer-middle', stage);
      animate(stage, [{ opacity: 0, transform: 'translateY(16px) scale(.985)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
        { duration: 430, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      animate(back, [{ transform: 'translate(-18px,18px) rotate(-4deg) scale(.95)' }, { transform: 'translate(-8px,8px) rotate(-1deg) scale(1)' }],
        { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      animate(middle, [{ transform: 'translate(19px,-15px) rotate(4deg) scale(.95)' }, { transform: 'translate(8px,-6px) rotate(1deg) scale(1)' }],
        { duration: 610, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    }
    function futureMedia(recordId, slot, typeLabel) {
      return { id: recordId + '-' + slot, kind: 'slot', status: 'future', src: null, type: null, width: null, height: null,
        fit: { featured: 'cover', thumbnail: 'cover', expanded: 'contain' }, focalPoint: { x: 50, y: 50 },
        alt: 'Future media slot ' + slot + '. No asset supplied.', caption: 'Future ' + typeLabel.toLowerCase() + ' media slot ' + slot + ' of 5. No asset has been supplied.', poster: null };
    }
    function entryRecord(trigger) {
      var type = trigger.getAttribute('data-entry-type');
      var id = trigger.getAttribute('data-entry-id');
      var source = one('.entry-source', trigger);
      if (!type || !id || !source) return null;
      var title = (one('.card-title', trigger) || one('h3', trigger));
      var organisation = one('[data-entry-organisation]', source);
      var summary = one('[data-entry-summary]', source);
      var date = one('time', trigger);
      var preview = source.getAttribute('data-preview');
      var typeLabel = type === 'research' ? 'Research' : 'Activity';
      var first = { id: type + '-' + id + '-01', kind: 'image', status: 'temporary-preview', src: preview, type: 'image/jpeg',
        width: Number(source.getAttribute('data-preview-width')) || 1, height: Number(source.getAttribute('data-preview-height')) || 1,
        fit: { featured: 'cover', thumbnail: 'cover', expanded: 'contain' }, focalPoint: { x: 50, y: 50 },
        alt: source.getAttribute('data-preview-alt') || 'Temporary preview image',
        caption: 'Temporary stock image only. It is not ' + type + ' evidence.', poster: null };
      var detail = all('[data-detail-label]', source).map(function (item) { return { label: item.getAttribute('data-detail-label'), text: item.textContent.trim() }; });
      return { type: type, id: id, typeLabel: typeLabel, title: title ? title.textContent.trim() : typeLabel,
        organisation: organisation ? organisation.textContent.trim() : '', dates: date ? date.textContent.trim() : '',
        focus: organisation ? organisation.textContent.trim() : typeLabel, summary: summary ? summary.textContent.trim() : '',
        detailBlocks: detail, media: [first, futureMedia(type + '-' + id, 2, typeLabel), futureMedia(type + '-' + id, 3, typeLabel), futureMedia(type + '-' + id, 4, typeLabel), futureMedia(type + '-' + id, 5, typeLabel)] };
    }
    function projectRecord(id) {
      var project = projectFor(id);
      return { type: 'project', id: id, typeLabel: 'Project P' + id, title: project.title, organisation: '', dates: '', focus: project.focus || 'Engineering project', summary: project.summary || '', media: project.media,
        detailBlocks: [{ label: 'Brief', text: project.details.brief }, { label: 'Personal contribution', text: project.details.contribution }, { label: 'Method', text: project.details.method }, { label: 'Result', text: project.details.result }, { label: 'Limitations', text: project.details.limitations }] };
    }
    function renderDetailBlocks(record) {
      if (!detailBlocks) return;
      detailBlocks.textContent = '';
      (record.detailBlocks || []).forEach(function (block) {
        var section = document.createElement('section'); var heading = document.createElement('h3'); var paragraph = document.createElement('p');
        heading.textContent = block.label; paragraph.textContent = block.text; section.appendChild(heading); section.appendChild(paragraph); detailBlocks.appendChild(section);
      });
    }
    function openProject(trigger) {
      var projectId = trigger.getAttribute('data-project');
      var record = projectId && PROJECT_IDS.indexOf(projectId) !== -1 ? projectRecord(projectId) : entryRecord(trigger);
      if (!record) return;
      var project = record;
      state.projectId = record.type === 'project' ? record.id : record.type + '-' + record.id;
      state.activeRecord = record;
      state.mediaIndex = 0;
      state.opener = trigger;
      if (caseNumber) caseNumber.textContent = record.typeLabel;
      caseTitle.textContent = project.title;
      if (caseFocus) caseFocus.textContent = [project.focus, project.dates].filter(Boolean).join(' / ');
      if (caseSummary) caseSummary.textContent = project.summary || '';
      renderDetailBlocks(record);
      buildThumbnails(project);
      if (caseContent) caseContent.scrollTop = 0;
      lockPage();
      try { state.caseOpen = openNativeDialog(caseDialog); }
      catch (error) {
        state.caseOpen = false;
        unlockPage();
        console.error('[portfolio:open-project]', error);
        return;
      }
      showMedia(project, 0, false);
      animatePaperOpen();
      window.setTimeout(function () { if (caseClose) caseClose.focus(); }, 0);
    }
    function closeProject() {
      if (!state.caseOpen && !caseDialog.open) return;
      if (state.lightboxOpen || (lightbox && lightbox.open)) closeLightbox(false);
      state.mediaToken += 1;
      state.caseOpen = false;
      closeNativeDialog(caseDialog);
    }
    function openLightbox() {
      if (!state.caseOpen || !state.activeMedia || !lightbox || !lightboxImage) return;
      var source = sourceFor(state.activeMedia);
      if (!source) return;
      var details = imageDetails(state.activeMedia);
      lightboxImage.src = source;
      lightboxImage.alt = details.alt || state.activeMedia.alt || '';
      if (lightboxTitle) lightboxTitle.textContent = (state.activeRecord || projectFor(state.projectId)).title;
      if (lightboxCaption) lightboxCaption.textContent = state.activeMedia.caption || '';
      try { state.lightboxOpen = openNativeDialog(lightbox); }
      catch (error) { state.lightboxOpen = false; console.error('[portfolio:open-lightbox]', error); return; }
      window.setTimeout(function () { if (lightboxClose) lightboxClose.focus(); }, 0);
    }
    function closeLightbox(restoreFocus) {
      if (!state.lightboxOpen && (!lightbox || !lightbox.open)) return;
      state.lightboxOpen = false;
      closeNativeDialog(lightbox);
      if (restoreFocus && expand) window.setTimeout(function () { expand.focus(); }, 0);
    }
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('.project-trigger[data-project], .entry-trigger[data-entry-type][data-entry-id]');
      if (trigger && !trigger.disabled) { event.preventDefault(); openProject(trigger); }
    });
    thumbnails.addEventListener('click', function (event) {
      var button = event.target.closest('.media-thumbnail[data-media-index]');
      if (button && state.caseOpen) showMedia(state.activeRecord || projectFor(state.projectId), Number(button.dataset.mediaIndex), true);
    });
    if (previous) previous.addEventListener('click', function () { showMedia(state.activeRecord || projectFor(state.projectId), state.mediaIndex - 1, true); });
    if (next) next.addEventListener('click', function () { showMedia(state.activeRecord || projectFor(state.projectId), state.mediaIndex + 1, true); });
    if (expand) expand.addEventListener('click', openLightbox);
    if (caseClose) caseClose.addEventListener('click', closeProject);
    if (lightboxClose) lightboxClose.addEventListener('click', function () { closeLightbox(true); });
    caseDialog.addEventListener('cancel', function (event) { event.preventDefault(); closeProject(); });
    caseDialog.addEventListener('click', function (event) { if (event.target === caseDialog) closeProject(); });
    caseDialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (state.lightboxOpen) closeLightbox(true);
        else closeProject();
        return;
      }
      if (state.lightboxOpen) return;
      if (event.key === 'ArrowLeft' && previous && !previous.disabled) { event.preventDefault(); showMedia(state.activeRecord || projectFor(state.projectId), state.mediaIndex - 1, true); }
      if (event.key === 'ArrowRight' && next && !next.disabled) { event.preventDefault(); showMedia(state.activeRecord || projectFor(state.projectId), state.mediaIndex + 1, true); }
    });
    caseDialog.addEventListener('close', function () {
      state.caseOpen = false;
      state.projectId = null;
      state.activeRecord = null;
      state.activeMedia = null;
      unlockPage();
      var opener = state.opener;
      state.opener = null;
      if (opener && document.contains(opener)) window.setTimeout(function () { opener.focus(); }, 0);
    });
    if (lightbox) {
      lightbox.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { event.preventDefault(); closeLightbox(true); }
      });
      lightbox.addEventListener('cancel', function (event) { event.preventDefault(); closeLightbox(true); });
      lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(true); });
      lightbox.addEventListener('close', function () { state.lightboxOpen = false; unlockPage(); });
    }
    all('.entry-trigger[disabled]').forEach(function (trigger) { trigger.disabled = false; });
  }

  function setupMotionPreference() {
    if (!reduceMotionQuery) return;
    function changed(event) {
      if (event.matches) finishAllMotion();
      else setupMotionBidirectional();
      hydrateFeatureImages();
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
