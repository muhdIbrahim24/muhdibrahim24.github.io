(function () {
  'use strict';

  var body = document.body;
  var projectMap = window.PORTFOLIO_PROJECTS;
  var projectKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  var acceptedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reducedMotion = reducedMotionQuery ? reducedMotionQuery.matches : false;
  var motionAnimations = [];
  var mediaAnimations = [];
  var idleHandles = [];
  var state = {
    projectId: null,
    activeIndex: 0,
    requestToken: 0,
    dialogOpen: false,
    lightboxOpen: false,
    trigger: null,
    activeMedia: null,
    loadedMedia: null,
    closingDialog: false,
    closingLightbox: false,
    previousBodyPaddingRight: ''
  };

  function query(selector, root) { return (root || document).querySelector(selector); }
  function queryAll(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function isFiniteNumber(value) { return typeof value === 'number' && isFinite(value); }
  function isPositiveInteger(value) { return isFiniteNumber(value) && value > 0 && Math.floor(value) === value; }
  function isAcceptedMime(value) { return acceptedMime.indexOf(value) !== -1; }

  function validFocalPoint(point) {
    return point && isFiniteNumber(point.x) && isFiniteNumber(point.y) && point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100;
  }

  function validateManifest(manifest) {
    if (!manifest || typeof manifest !== 'object') return false;
    var seenIds = {};
    var seenSrc = {};
    for (var keyIndex = 0; keyIndex < projectKeys.length; keyIndex += 1) {
      var key = projectKeys[keyIndex];
      var project = manifest[key];
      if (!project || project.id !== key || typeof project.title !== 'string' || typeof project.focus !== 'string' || typeof project.summary !== 'string') return false;
      if (!Array.isArray(project.media) || project.media.length !== 5) return false;
      for (var mediaIndex = 0; mediaIndex < project.media.length; mediaIndex += 1) {
        var media = project.media[mediaIndex];
        if (!media || typeof media.id !== 'string' || seenIds[media.id]) return false;
        seenIds[media.id] = true;
        if (!media.fit || typeof media.fit.featured !== 'string' || typeof media.fit.thumbnail !== 'string' || typeof media.fit.expanded !== 'string' || !validFocalPoint(media.focalPoint)) return false;
        if (media.status === 'future' || media.kind === 'slot') {
          if (media.kind !== 'slot' || media.status !== 'future' || media.src !== null || media.type !== null || media.width !== null || media.height !== null || typeof media.alt !== 'string' || typeof media.caption !== 'string' || media.poster !== null) return false;
          continue;
        }
        if (media.kind !== 'image' || typeof media.src !== 'string' || !media.src || !isAcceptedMime(media.type) || !isPositiveInteger(media.width) || !isPositiveInteger(media.height) || typeof media.alt !== 'string' || typeof media.caption !== 'string') return false;
        if (seenSrc[media.src]) return false;
        seenSrc[media.src] = true;
        if (media.poster !== null) {
          if (!media.poster || typeof media.poster.src !== 'string' || !isAcceptedMime(media.poster.type) || !isPositiveInteger(media.poster.width) || !isPositiveInteger(media.poster.height) || typeof media.poster.alt !== 'string') return false;
        }
        if (media.type === 'image/gif' && media.status === 'verified-project-media' && media.poster !== null && media.poster.type === 'image/gif') return false;
      }
    }
    var manifestKeys = Object.keys(manifest);
    return manifestKeys.length === projectKeys.length && projectKeys.every(function (key) { return manifestKeys.indexOf(key) !== -1; });
  }

  var manifestValid = validateManifest(projectMap);

  function projectFor(id) {
    if (manifestValid && projectMap[id]) return projectMap[id];
    return manifestValid ? projectMap['01'] : null;
  }

  function cancelAnimations(list) {
    list.forEach(function (animation) {
      if (animation && typeof animation.cancel === 'function') animation.cancel();
    });
    list.length = 0;
  }

  function cancelAllMotion() {
    cancelAnimations(motionAnimations);
    cancelAnimations(mediaAnimations);
    queryAll('*').forEach(function (element) {
      if (!element.getAnimations) return;
      element.getAnimations().forEach(function (animation) { animation.cancel(); });
    });
  }

  function finalMotionState() {
    cancelAnimations(motionAnimations);
    queryAll('.hero-word, .title-word, [data-motion-item], [data-motion-scene] .scene-copy, [data-motion-scene] .scene-image-button, [data-feature-media]').forEach(function (element) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.clipPath = 'none';
    });
    var rule = query('.hero-rule');
    if (rule) rule.style.transform = 'scaleX(1)';
  }

  function animateElement(element, keyframes, options, list) {
    if (!element || reducedMotion || typeof element.animate !== 'function') {
      if (element) {
        var finalFrame = keyframes[keyframes.length - 1];
        Object.keys(finalFrame).forEach(function (property) { element.style[property] = finalFrame[property]; });
      }
      return null;
    }
    var animation = element.animate(keyframes, options);
    (list || motionAnimations).push(animation);
    animation.finished.then(function () {
      var index = (list || motionAnimations).indexOf(animation);
      if (index !== -1) (list || motionAnimations).splice(index, 1);
    }).catch(function () {});
    return animation;
  }

  function wrapSectionTitles() {
    queryAll('[data-motion-title] h2').forEach(function (heading) {
      if (heading.getAttribute('data-motion-wrapped') === 'true') return;
      var words = heading.textContent.trim().split(/\s+/);
      heading.textContent = '';
      words.forEach(function (word, index) {
        if (index) heading.appendChild(document.createTextNode(' '));
        var mask = document.createElement('span');
        mask.className = 'title-word-mask';
        var inner = document.createElement('span');
        inner.className = 'title-word';
        inner.textContent = word;
        mask.appendChild(inner);
        heading.appendChild(mask);
      });
      heading.setAttribute('data-motion-wrapped', 'true');
    });
  }

  function animateHero() {
    var words = queryAll('.hero-word');
    if (reducedMotion) { finalMotionState(); return; }
    words.forEach(function (word, index) {
      animateElement(word, [{ opacity: 0, transform: 'translateY(108%)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 680, delay: index ? 120 : 40, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' });
    });
    animateElement(query('.hero-rule'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 720, delay: 180, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' });
  }

  function animateTitle(title) {
    if (!title || title.getAttribute('data-motion-done') === 'true') return;
    title.setAttribute('data-motion-done', 'true');
    queryAll('.title-word', title).forEach(function (word, index) {
      var delay = Math.min(index, 6) * 45;
      animateElement(word, [{ opacity: 0, transform: 'translateY(108%)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, delay: delay, easing: 'cubic-bezier(.25, 1, .5, 1)', fill: 'forwards' });
    });
  }

  function animateList(list) {
    if (!list || list.getAttribute('data-motion-done') === 'true') return;
    list.setAttribute('data-motion-done', 'true');
    queryAll('[data-motion-item]', list).filter(function (item) { return item.parentElement === list; }).forEach(function (item, index) {
      var delay = Math.min(index, 6) * 42;
      animateElement(item, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, delay: delay, easing: 'cubic-bezier(.25, 1, .5, 1)', fill: 'forwards' });
    });
  }

  function animateScene(scene) {
    if (!scene || scene.getAttribute('data-motion-done') === 'true') return;
    scene.setAttribute('data-motion-done', 'true');
    var copy = query('.scene-copy', scene);
    var image = query('[data-feature-media]', scene);
    animateElement(copy, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, delay: 90, easing: 'cubic-bezier(.25, 1, .5, 1)', fill: 'forwards' });
    var reverse = query('.scene-layout-reverse', scene);
    animateElement(image, [{ opacity: 0, clipPath: reverse ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0)' }], { duration: 600, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' });
  }

  function startMotion() {
    wrapSectionTitles();
    animateHero();
    if (reducedMotion) { finalMotionState(); return; }
    if (!('IntersectionObserver' in window)) { finalMotionState(); return; }
    var observer;
    try {
      observer = new IntersectionObserver(function (entries, instance) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var target = entry.target;
          if (target.hasAttribute('data-motion-title')) animateTitle(target);
          else if (target.hasAttribute('data-motion-scene')) animateScene(target);
          else if (target.hasAttribute('data-motion-list')) animateList(target);
          instance.unobserve(target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
      queryAll('[data-motion-title], [data-motion-scene], [data-motion-list]').forEach(function (element) { observer.observe(element); });
      window.setTimeout(function () { observer.disconnect(); finalMotionState(); }, 2600);
    } catch (error) { finalMotionState(); }
  }

  function setNavigationOpen(isOpen, restoreFocus) {
    var menuButton = query('.menu-button');
    var navigation = query('#site-navigation');
    if (!menuButton || !navigation) return;
    var mobileMedia = window.matchMedia ? window.matchMedia('(max-width: 920px)') : null;
    var shouldOpen = Boolean(isOpen);
    navigation.classList.toggle('open', shouldOpen);
    menuButton.setAttribute('aria-expanded', String(shouldOpen));
    body.classList.toggle('nav-open', shouldOpen && (!mobileMedia || mobileMedia.matches));
    if (!shouldOpen && restoreFocus) menuButton.focus();
  }

  function setupNavigation() {
    var menuButton = query('.menu-button');
    var navigation = query('#site-navigation');
    var mobileMedia = window.matchMedia ? window.matchMedia('(max-width: 920px)') : null;
    if (!menuButton || !navigation) return;
    menuButton.addEventListener('click', function () { setNavigationOpen(menuButton.getAttribute('aria-expanded') !== 'true', false); });
    queryAll('a', navigation).forEach(function (link) { link.addEventListener('click', function () { setNavigationOpen(false, false); }); });
    document.addEventListener('pointerdown', function (event) {
      if (menuButton.getAttribute('aria-expanded') !== 'true' || navigation.contains(event.target) || menuButton.contains(event.target)) return;
      setNavigationOpen(false, false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { event.preventDefault(); setNavigationOpen(false, true); }
    });
    function closeAtBreakpoint(event) { if (!event.matches) setNavigationOpen(false, false); }
    if (mobileMedia) {
      if (mobileMedia.addEventListener) mobileMedia.addEventListener('change', closeAtBreakpoint);
      else if (mobileMedia.addListener) mobileMedia.addListener(closeAtBreakpoint);
    }
  }

  var dialog = query('#case-dialog');
  var dialogNumber = query('#case-number');
  var dialogTitle = query('#case-title');
  var dialogSummary = query('#case-summary');
  var dialogClose = query('.dialog-close', dialog);
  var dialogContent = query('.dialog-content', dialog);
  var mediaStage = query('#case-media');
  var mediaViewport = query('#media-viewport');
  var mediaImage = query('#case-image');
  var mediaLoading = query('#media-loading');
  var mediaFuture = query('#media-future');
  var mediaError = query('#media-error');
  var mediaCaption = query('#media-caption');
  var mediaLiveStatus = query('#media-live-status');
  var mediaCounter = query('#media-counter');
  var mediaExpand = query('#media-expand');
  var mediaPrev = query('#media-prev');
  var mediaNext = query('#media-next');
  var mediaThumbnails = query('#media-thumbnails');
  var lightbox = query('#media-lightbox');
  var lightboxClose = query('#lightbox-close');
  var lightboxImage = query('#lightbox-image');
  var lightboxTitle = query('#lightbox-title');
  var lightboxCounter = query('#lightbox-counter');
  var lightboxCaption = query('#lightbox-caption');

  function lockBodyScroll() {
    if (!state.dialogOpen && !state.lightboxOpen) {
      state.previousBodyPaddingRight = body.style.paddingRight;
      var scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      if (scrollbarWidth) body.style.paddingRight = scrollbarWidth + 'px';
    }
    body.classList.add('dialog-open');
  }

  function unlockBodyScroll() {
    if (state.dialogOpen || state.lightboxOpen) return;
    body.classList.remove('dialog-open');
    body.style.paddingRight = state.previousBodyPaddingRight;
  }

  function sourceForMedia(media) {
    if (reducedMotion && media.type === 'image/gif') return media.poster && media.poster.src ? media.poster.src : null;
    return media.src;
  }

  function labelForMedia(media, index) {
    if (media.status === 'future') return 'Future slot ' + (index + 1) + ' of 5';
    if (media.type === 'image/gif' && reducedMotion && !media.poster) return 'Animated media paused. Static preview not supplied.';
    return 'Show image ' + (index + 1) + ' of 5';
  }

  function applyFocal(element, media) {
    if (!element || !media || !media.focalPoint) return;
    element.style.setProperty('--focal-x', media.focalPoint.x + '%');
    element.style.setProperty('--focal-y', media.focalPoint.y + '%');
  }

  function hydrateFeatureMedia() {
    queryAll('[data-feature-media]').forEach(function (image) {
      var project = projectFor(image.getAttribute('data-feature-media'));
      var media = project && project.media ? project.media[0] : null;
      if (!media || media.status === 'future') return;
      var source = sourceForMedia(media);
      if (!source) {
        image.removeAttribute('src');
        image.alt = labelForMedia(media, 0);
        image.removeAttribute('width');
        image.removeAttribute('height');
        return;
      }
      image.src = source;
      image.alt = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.alt : media.alt;
      image.width = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.width : media.width;
      image.height = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.height : media.height;
      image.decoding = 'async';
      applyFocal(image, media);
    });
  }

  function updatePanels(panel) {
    if (mediaLoading) mediaLoading.hidden = panel !== 'loading';
    if (mediaFuture) mediaFuture.hidden = panel !== 'future';
    if (mediaError) mediaError.hidden = panel !== 'error';
    if (mediaImage) mediaImage.hidden = panel !== 'image';
  }

  function setLiveStatus(message) { if (mediaLiveStatus) mediaLiveStatus.textContent = message; }

  function updateMediaControls() {
    var index = state.activeIndex;
    if (mediaCounter) mediaCounter.textContent = 'Image ' + (index + 1) + ' of 5';
    if (lightboxCounter) lightboxCounter.textContent = 'Image ' + (index + 1) + ' of 5';
    if (mediaPrev) mediaPrev.disabled = index <= 0;
    if (mediaNext) mediaNext.disabled = index >= 4;
    queryAll('.media-thumbnail', mediaThumbnails).forEach(function (button, buttonIndex) { button.setAttribute('aria-pressed', String(buttonIndex === index)); });
  }

  function thumbnailMediaSource(media) {
    if (reducedMotion && media.type === 'image/gif') return media.poster && media.poster.src ? media.poster.src : null;
    return media.src;
  }

  function createThumbnail(media, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-thumbnail';
    button.setAttribute('aria-pressed', String(index === 0));
    button.setAttribute('aria-label', labelForMedia(media, index));
    button.setAttribute('data-media-index', String(index));
    if (media.status === 'future') {
      button.classList.add('media-thumbnail-future');
      var futureLabel = document.createElement('span');
      futureLabel.className = 'media-thumbnail-label';
      futureLabel.textContent = 'Future ' + String(index + 1).padStart(2, '0');
      button.appendChild(futureLabel);
    } else {
      var source = thumbnailMediaSource(media);
      if (source) {
        var image = document.createElement('img');
        image.src = source;
        image.alt = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.alt : media.alt;
        image.width = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.width : media.width;
        image.height = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.height : media.height;
        image.loading = 'eager';
        image.decoding = 'async';
        applyFocal(image, media);
        button.appendChild(image);
      } else {
        var pausedLabel = document.createElement('span');
        pausedLabel.className = 'media-thumbnail-label';
        pausedLabel.textContent = 'Animated media paused. Static preview not supplied.';
        button.appendChild(pausedLabel);
      }
    }
    button.addEventListener('click', function () { selectMedia(index, true); });
    return button;
  }

  function populateThumbnails(project) {
    if (!mediaThumbnails) return;
    mediaThumbnails.textContent = '';
    project.media.forEach(function (media, index) { mediaThumbnails.appendChild(createThumbnail(media, index)); });
    updateMediaControls();
  }

  function animateMediaOut() {
    cancelAnimations(mediaAnimations);
    if (reducedMotion || !mediaImage || mediaImage.hidden || typeof mediaImage.animate !== 'function') return;
    mediaAnimations.push(mediaImage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'cubic-bezier(.25, 1, .5, 1)', fill: 'forwards' }));
  }

  function animateMediaIn() {
    if (reducedMotion || !mediaImage || typeof mediaImage.animate !== 'function') return;
    var animation = mediaImage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' });
    mediaAnimations.push(animation);
  }

  function showFuture(media, index, token) {
    if (token !== state.requestToken) return;
    state.loadedMedia = null;
    updatePanels('future');
    if (mediaFuture) mediaFuture.textContent = media.alt + ' ' + media.caption;
    if (mediaCaption) mediaCaption.textContent = media.caption;
    if (mediaExpand) mediaExpand.disabled = true;
    setLiveStatus('Future media slot ' + (index + 1) + ' of 5. No project asset has been supplied.');
  }

  function showGifFallback(media, index, token) {
    if (token !== state.requestToken) return;
    state.loadedMedia = null;
    updatePanels('error');
    if (mediaError) mediaError.textContent = 'Animated media paused. Static preview not supplied.';
    if (mediaCaption) mediaCaption.textContent = media.caption || 'Animated media paused. Static preview not supplied.';
    if (mediaExpand) mediaExpand.disabled = true;
    setLiveStatus('Animated media paused. Static preview not supplied.');
  }

  function showMediaError(media, token) {
    if (token !== state.requestToken) return;
    state.loadedMedia = null;
    updatePanels('error');
    if (mediaError) mediaError.textContent = 'Preview image could not be loaded.';
    if (mediaCaption) mediaCaption.textContent = 'Preview image could not be loaded. ' + media.caption;
    if (mediaExpand) mediaExpand.disabled = true;
    setLiveStatus('Preview image could not be loaded.');
  }

  function showLoadedMedia(media, index, token, source) {
    if (token !== state.requestToken || !mediaImage) return;
    state.loadedMedia = media;
    mediaImage.src = source;
    mediaImage.alt = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.alt : media.alt;
    mediaImage.width = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.width : media.width;
    mediaImage.height = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.height : media.height;
    mediaImage.decoding = 'async';
    applyFocal(mediaImage, media);
    updatePanels('image');
    if (mediaCaption) mediaCaption.textContent = media.caption;
    if (mediaExpand) mediaExpand.disabled = false;
    setLiveStatus('Image ' + (index + 1) + ' of 5 loaded.');
    animateMediaIn();
    scheduleAdjacentPreload();
  }

  function loadMedia(media, index) {
    state.requestToken += 1;
    var token = state.requestToken;
    state.activeMedia = media;
    state.loadedMedia = null;
    animateMediaOut();
    updatePanels('loading');
    if (mediaImage) { mediaImage.removeAttribute('src'); mediaImage.alt = ''; }
    if (mediaExpand) mediaExpand.disabled = true;
    updateMediaControls();
    if (media.status === 'future') { showFuture(media, index, token); return; }
    var source = sourceForMedia(media);
    if (!source && media.type === 'image/gif' && reducedMotion) { showGifFallback(media, index, token); return; }
    if (!source) { showMediaError(media, token); return; }
    var settled = false;
    function finishLoaded() {
      if (settled || token !== state.requestToken) return;
      if (!mediaImage.naturalWidth && !mediaImage.complete) return;
      settled = true;
      showLoadedMedia(media, index, token, source);
    }
    function finishError() { if (settled || token !== state.requestToken) return; settled = true; showMediaError(media, token); }
    mediaImage.onload = finishLoaded;
    mediaImage.onerror = finishError;
    mediaImage.src = source;
    if (typeof mediaImage.decode === 'function') {
      mediaImage.decode().then(finishLoaded).catch(function () { if (mediaImage.complete && mediaImage.naturalWidth === 0) finishError(); });
    }
  }

  function preloadAdjacentPreviews() {
    if (reducedMotion || !state.projectId) return;
    var project = projectFor(state.projectId);
    if (!project) return;
    [state.activeIndex - 1, state.activeIndex + 1].forEach(function (index) {
      if (index < 0 || index >= project.media.length) return;
      var media = project.media[index];
      var source = sourceForMedia(media);
      if (media.status === 'future' || !source) return;
      var image = new Image();
      image.decoding = 'async';
      image.src = source;
    });
  }

  function scheduleAdjacentPreload() {
    idleHandles.forEach(function (handle) {
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    });
    idleHandles = [];
    if (reducedMotion) return;
    if (window.requestIdleCallback) idleHandles.push(window.requestIdleCallback(preloadAdjacentPreviews, { timeout: 900 }));
    else idleHandles.push(window.setTimeout(preloadAdjacentPreviews, 180));
  }

  function selectMedia(index, fromUser) {
    var project = projectFor(state.projectId);
    if (!project || index < 0 || index >= project.media.length || index === state.activeIndex && fromUser) return;
    state.activeIndex = index;
    loadMedia(project.media[index], index);
    if (state.lightboxOpen) closeLightbox(false);
  }

  function animatePaperOpen() {
    var layers = queryAll('.paper-layer', mediaStage);
    cancelAnimations(motionAnimations);
    if (reducedMotion || !layers.length) return;
    layers.forEach(function (layer, index) {
      var animation = layer.animate([{ opacity: 0, transform: index === 0 ? 'translate(-8px, 18px) rotate(-4deg)' : 'translate(8px, 12px) rotate(3deg)' }, { opacity: 1, transform: index === 0 ? 'translate(-8px, 8px) rotate(-1deg)' : 'translate(8px, -6px) rotate(1deg)' }], { duration: 320, delay: index * 40, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' });
      motionAnimations.push(animation);
    });
  }

  function populateDialog(projectId) {
    var project = projectFor(projectId);
    if (!project) return null;
    state.projectId = project.id;
    state.activeIndex = 0;
    if (dialogNumber) dialogNumber.textContent = 'Project ' + project.id;
    if (dialogTitle) dialogTitle.textContent = project.title;
    if (dialogSummary) dialogSummary.textContent = project.summary + ' ' + project.focus + '.';
    populateThumbnails(project);
    loadMedia(project.media[0], 0);
    return project;
  }

  function openCase(trigger) {
    if (!dialog || typeof dialog.showModal !== 'function' || state.closingDialog) return;
    var projectId = trigger.getAttribute('data-project') || '01';
    var project = populateDialog(projectId);
    if (!project) return;
    state.trigger = trigger;
    try {
      dialog.showModal();
      state.dialogOpen = true;
      lockBodyScroll();
      animatePaperOpen();
      if (dialogClose) dialogClose.focus();
    } catch (error) {
      state.dialogOpen = false;
      unlockBodyScroll();
    }
  }

  function closeCaseNow() {
    if (!dialog || !dialog.open) return;
    state.closingDialog = false;
    state.requestToken += 1;
    cancelAnimations(mediaAnimations);
    cancelAnimations(motionAnimations);
    dialog.close();
  }

  function closeCase() {
    if (!dialog || !dialog.open || state.closingDialog) return;
    if (state.lightboxOpen) { closeLightbox(true); return; }
    if (reducedMotion || !dialogContent || typeof dialogContent.animate !== 'function') { closeCaseNow(); return; }
    state.closingDialog = true;
    var animation = dialogContent.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 180, easing: 'cubic-bezier(.25, 1, .5, 1)', fill: 'forwards' });
    animation.finished.then(closeCaseNow).catch(function () { closeCaseNow(); });
  }

  function openLightbox() {
    if (!lightbox || typeof lightbox.showModal !== 'function' || !state.loadedMedia || !sourceForMedia(state.loadedMedia) || state.lightboxOpen) return;
    var media = state.loadedMedia;
    var source = sourceForMedia(media);
    if (lightboxImage) {
      lightboxImage.src = source;
      lightboxImage.alt = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.alt : media.alt;
      lightboxImage.width = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.width : media.width;
      lightboxImage.height = media.poster && reducedMotion && media.type === 'image/gif' ? media.poster.height : media.height;
      applyFocal(lightboxImage, media);
    }
    if (lightboxTitle) lightboxTitle.textContent = 'Full image';
    if (lightboxCaption) lightboxCaption.textContent = media.caption;
    updateMediaControls();
    try {
      lightbox.showModal();
      state.lightboxOpen = true;
      lockBodyScroll();
      if (lightboxClose) lightboxClose.focus();
    } catch (error) { state.lightboxOpen = false; }
  }

  function closeLightboxNow() {
    if (!lightbox || !lightbox.open) return;
    state.closingLightbox = false;
    lightbox.close();
  }

  function closeLightbox(restoreFocus) {
    if (!lightbox || !lightbox.open || state.closingLightbox) return;
    if (reducedMotion || !lightbox.querySelector('.lightbox-content') || typeof lightbox.querySelector('.lightbox-content').animate !== 'function') { closeLightboxNow(); return; }
    state.closingLightbox = true;
    var content = lightbox.querySelector('.lightbox-content');
    var animation = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'cubic-bezier(.25, 1, .5, 1)', fill: 'forwards' });
    animation.finished.then(function () { closeLightboxNow(); if (restoreFocus && mediaExpand) mediaExpand.focus(); }).catch(function () { closeLightboxNow(); });
  }

  function focusablesIn(container) {
    if (!container) return [];
    return queryAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])', container).filter(function (element) { return !element.disabled && !element.hidden && element.offsetParent !== null; });
  }

  function trapTab(event, container) {
    if (event.key !== 'Tab') return false;
    var focusables = focusablesIn(container);
    if (!focusables.length) return false;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); return true; }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); return true; }
    return false;
  }

  function mediaKeydown(event) {
    if (!state.dialogOpen || state.lightboxOpen || !dialog || !dialog.open) return;
    var target = event.target;
    var inBrowser = target && (target.closest ? target.closest('.media-toolbar, .media-stage, .media-controls') : false);
    if (!inBrowser) return;
    var nextIndex = null;
    if (event.key === 'ArrowLeft') nextIndex = state.activeIndex - 1;
    if (event.key === 'ArrowRight') nextIndex = state.activeIndex + 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = 4;
    if (nextIndex === null) return;
    event.preventDefault();
    if (nextIndex !== state.activeIndex && nextIndex >= 0 && nextIndex < 5) selectMedia(nextIndex, false);
  }

  function setupDialog() {
    if (!dialog) return;
    queryAll('.project-trigger').forEach(function (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', function () { openCase(trigger); });
    });
    if (mediaPrev) mediaPrev.addEventListener('click', function () { selectMedia(state.activeIndex - 1, true); });
    if (mediaNext) mediaNext.addEventListener('click', function () { selectMedia(state.activeIndex + 1, true); });
    if (mediaExpand) mediaExpand.addEventListener('click', openLightbox);
    if (dialogClose) dialogClose.addEventListener('click', closeCase);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeCase(); });
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closeCase(); return; }
      mediaKeydown(event);
      trapTab(event, dialog);
    });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) closeCase(); });
    dialog.addEventListener('close', function () {
      state.dialogOpen = false;
      state.closingDialog = false;
      unlockBodyScroll();
      if (state.trigger && document.contains(state.trigger)) state.trigger.focus();
    });
    if (lightbox) {
      lightbox.addEventListener('cancel', function (event) { event.preventDefault(); closeLightbox(true); });
      lightbox.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { event.preventDefault(); closeLightbox(true); return; }
        trapTab(event, lightbox);
      });
      lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(true); });
      lightbox.addEventListener('close', function () {
        state.lightboxOpen = false;
        state.closingLightbox = false;
        var content = lightbox.querySelector('.lightbox-content');
        if (content) { content.style.opacity = ''; }
        unlockBodyScroll();
        if (state.dialogOpen && mediaExpand) mediaExpand.focus();
      });
    }
  }

  function onMotionPreferenceChange(event) {
    reducedMotion = event.matches;
    if (state.lightboxOpen) closeLightbox(false);
    cancelAllMotion();
    if (reducedMotion) finalMotionState();
    hydrateFeatureMedia();
    if (state.dialogOpen && state.projectId) {
      var project = projectFor(state.projectId);
      if (project) { populateThumbnails(project); loadMedia(project.media[state.activeIndex], state.activeIndex); }
    }
  }

  queryAll('[data-feature-media]').forEach(function (image) { image.addEventListener('error', function () { image.removeAttribute('src'); }); });
  hydrateFeatureMedia();
  setupNavigation();
  setupDialog();
  startMotion();
  if (reducedMotionQuery) {
    if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', onMotionPreferenceChange);
    else if (reducedMotionQuery.addListener) reducedMotionQuery.addListener(onMotionPreferenceChange);
  }
  var year = query('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());
}());
