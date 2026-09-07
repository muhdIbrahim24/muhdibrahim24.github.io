(function () {
  'use strict';

  var body = document.body;
  var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reducedMotion = reducedMotionQuery ? reducedMotionQuery.matches : false;

  var projects = {
    '01': { focus: 'Marine engineering placeholder', summary: 'A temporary marine engineering image reserved for a verified project narrative.', image: 'assets/images/placeholders/p01-marine-engine-room.jpg', alt: 'Temporary preview image of a marine engine room', width: 1920, height: 1440 },
    '02': { focus: 'Wind energy placeholder', summary: 'A temporary wind energy image reserved for a verified project narrative.', image: 'assets/images/placeholders/p02-offshore-wind.jpg', alt: 'Temporary preview image of an offshore wind turbine', width: 800, height: 600 },
    '03': { focus: 'Architecture / structure placeholder', summary: 'A temporary structural engineering image reserved for a verified project narrative.', image: 'assets/images/placeholders/p03-steel-structure.jpg', alt: 'Temporary preview image of a steel structure', width: 960, height: 1448 },
    '04': { focus: 'UAV systems placeholder', summary: 'A temporary UAV image reserved for a verified project narrative.', image: 'assets/images/placeholders/p04-uav-flight.jpg', alt: 'Temporary preview image of a quadcopter in flight', width: 1920, height: 1080 },
    '05': { focus: 'Thermal / electronics placeholder', summary: 'A temporary thermal electronics image reserved for a verified project narrative.', image: 'assets/images/placeholders/p05-thermal-electronics.jpg', alt: 'Temporary preview image of a circuit board thermography display', width: 1920, height: 1285 },
    '06': { focus: 'Wireless simulation placeholder', summary: 'A temporary wireless systems image reserved for a verified project narrative.', image: 'assets/images/placeholders/p06-wireless-antenna.jpg', alt: 'Temporary preview image of a wireless internet antenna', width: 960, height: 1280 },
    '07': { focus: 'Motorsport drivetrain placeholder', summary: 'A temporary motorsport drivetrain image reserved for a verified project narrative.', image: 'assets/images/placeholders/p07-racing-engine.jpg', alt: 'Temporary preview image of a racing engine', width: 1920, height: 1440 },
    '08': { focus: 'Mobility engineering placeholder', summary: 'A temporary mobility engineering image reserved for a verified project narrative.', image: 'assets/images/placeholders/p08-electric-vehicle.jpg', alt: 'Temporary preview image of an electric vehicle', width: 1920, height: 1440 },
    '09': { focus: 'Data analysis placeholder', summary: 'A temporary data analysis image reserved for a verified project narrative.', image: 'assets/images/placeholders/p09-data-display.jpg', alt: 'Temporary preview image of a computer display', width: 1920, height: 1440 },
    '10': { focus: 'Quantum computing placeholder', summary: 'A temporary quantum computing image reserved for a verified project narrative.', image: 'assets/images/placeholders/p10-quantum-cryostat.jpg', alt: 'Temporary preview image of a cryostat', width: 960, height: 1280 }
  };

  /* Navigation stays a non-modal disclosure: no focus trap, but Escape and outside pointer close it. */
  var menuButton = document.querySelector('.menu-button');
  var navigation = document.getElementById('site-navigation');
  var mobileMedia = window.matchMedia ? window.matchMedia('(max-width: 920px)') : null;

  function setNavigationOpen(isOpen, restoreFocus) {
    if (!menuButton || !navigation) return;
    var shouldOpen = Boolean(isOpen);
    navigation.classList.toggle('open', shouldOpen);
    menuButton.setAttribute('aria-expanded', String(shouldOpen));
    body.classList.toggle('nav-open', shouldOpen && (!mobileMedia || mobileMedia.matches));
    if (!shouldOpen && restoreFocus) menuButton.focus();
  }

  if (menuButton && navigation) {
    menuButton.addEventListener('click', function () {
      setNavigationOpen(menuButton.getAttribute('aria-expanded') !== 'true', false);
    });

    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setNavigationOpen(false, false); });
    });

    document.addEventListener('pointerdown', function (event) {
      if (menuButton.getAttribute('aria-expanded') !== 'true') return;
      if (navigation.contains(event.target) || menuButton.contains(event.target)) return;
      setNavigationOpen(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || menuButton.getAttribute('aria-expanded') !== 'true') return;
      event.preventDefault();
      setNavigationOpen(false, true);
    });

    function closeNavigationOnBreakpointChange(event) {
      if (!event.matches) setNavigationOpen(false, false);
    }
    if (mobileMedia) {
      if (mobileMedia.addEventListener) mobileMedia.addEventListener('change', closeNavigationOnBreakpointChange);
      else if (mobileMedia.addListener) mobileMedia.addListener(closeNavigationOnBreakpointChange);
    }
  }

  /* Reveal enhancement is opt-in only after IntersectionObserver constructs successfully. */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  document.querySelectorAll('.feature-spread').forEach(function (spread) {
    spread.querySelectorAll('.feature-scene').forEach(function (scene, index) {
      scene.style.setProperty('--reveal-delay', (index * 90) + 'ms');
    });
  });

  function showAllReveals() {
    body.classList.remove('motion-enhanced');
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  if (reducedMotionQuery) {
    var onMotionPreferenceChange = function (event) {
      reducedMotion = event.matches;
      if (reducedMotion) showAllReveals();
    };
    if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', onMotionPreferenceChange);
    else if (reducedMotionQuery.addListener) reducedMotionQuery.addListener(onMotionPreferenceChange);
  }

  if (reducedMotion || !('IntersectionObserver' in window) || !revealItems.length) {
    showAllReveals();
  } else {
    var revealObserver = null;
    var observerReady = false;
    try {
      revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
      body.classList.add('motion-enhanced');
      revealItems.forEach(function (item) { revealObserver.observe(item); });
      observerReady = true;
    } catch (error) {
      showAllReveals();
    }

    /* Never let an observer or rendering pause leave content hidden. */
    window.setTimeout(function () {
      if (!observerReady) return;
      showAllReveals();
      if (revealObserver) revealObserver.disconnect();
    }, 1800);
  }

  /* Case dialog */
  var dialog = document.getElementById('case-dialog');
  var dialogNumber = document.getElementById('case-number');
  var dialogTitle = document.getElementById('case-title');
  var dialogSummary = document.getElementById('case-summary');
  var dialogImage = document.getElementById('case-image');
  var dialogMedia = document.getElementById('case-media');
  var dialogGallery = document.getElementById('case-gallery');
  var dialogClose = document.querySelector('.dialog-close');
  var lastTrigger = null;
  var activeDialogImage = null;
  var previousBodyPaddingRight = '';

  function getDialogMediaMaxHeight() {
    if (window.matchMedia && window.matchMedia('(max-width: 680px)').matches) return Math.min(window.innerHeight * .3, 250);
    if (window.matchMedia && window.matchMedia('(max-width: 920px)').matches) return Math.min(window.innerHeight * .36, 320);
    return Math.min(window.innerHeight * .44, 420);
  }

  function updateDialogMediaSize() {
    if (!dialogMedia || !activeDialogImage || !activeDialogImage.width || !activeDialogImage.height) return;
    var parent = dialogMedia.parentElement;
    var availableWidth = parent ? parent.clientWidth : window.innerWidth;
    if (!availableWidth) return;
    var maxHeight = getDialogMediaMaxHeight();
    var scale = Math.min(availableWidth / activeDialogImage.width, maxHeight / activeDialogImage.height);
    var mediaWidth = Math.max(1, Math.round(activeDialogImage.width * scale));
    var mediaHeight = Math.max(1, Math.round(activeDialogImage.height * scale));
    dialogMedia.style.width = mediaWidth + 'px';
    dialogMedia.style.height = mediaHeight + 'px';
    dialogMedia.style.aspectRatio = activeDialogImage.width + ' / ' + activeDialogImage.height;
  }

  function resetPaperLayers() {
    if (!dialogMedia) return;
    dialogMedia.querySelectorAll('.paper-layer').forEach(function (layer) {
      if (layer.getAnimations) layer.getAnimations().forEach(function (animation) { animation.cancel(); });
      layer.style.opacity = '';
      layer.style.transform = '';
      layer.style.clipPath = '';
    });
  }

  function animatePaperLayers(url) {
    if (!dialogMedia) return;
    dialogMedia.querySelectorAll('.paper-layer').forEach(function (layer, index) {
      layer.style.backgroundImage = 'url("' + url + '")';
      if (reducedMotion || !layer.animate) {
        layer.style.opacity = '1';
        layer.style.transform = 'none';
        layer.style.clipPath = 'inset(0)';
        return;
      }
      var offset = index === 0 ? '-12px' : (index === 1 ? '8px' : '0');
      var rotation = index === 0 ? '-4deg' : (index === 1 ? '3deg' : '0deg');
      layer.animate([
        { opacity: 0, transform: 'translate(' + offset + ', 18px) rotate(' + rotation + ') scale(.72)', clipPath: 'polygon(46% 7%, 61% 0, 95% 28%, 100% 69%, 69% 100%, 30% 94%, 0 65%, 8% 22%)' },
        { opacity: 1, transform: 'translate(0, 0) rotate(0deg) scale(1)', clipPath: 'inset(0)' }
      ], { duration: 720, delay: index * 55, easing: 'cubic-bezier(.2, .72, .2, 1)', fill: 'forwards' });
    });
  }

  function updateGalleryState(activeIndex) {
    if (!dialogGallery) return;
    dialogGallery.querySelectorAll('.case-gallery-item').forEach(function (button, index) {
      button.setAttribute('aria-pressed', String(index === activeIndex));
    });
  }

  function setDialogImage(image, activeIndex) {
    if (!image) return;
    activeDialogImage = image;
    if (dialogImage) {
      dialogImage.src = image.image;
      dialogImage.alt = image.alt;
      dialogImage.width = image.width;
      dialogImage.height = image.height;
      dialogImage.decoding = 'async';
    }
    updateGalleryState(activeIndex);
    updateDialogMediaSize();
    resetPaperLayers();
    animatePaperLayers(image.image);
  }

  function buildDialogGallery(project) {
    if (!dialogGallery) return;
    dialogGallery.textContent = '';
    var images = Array.isArray(project.images) && project.images.length ? project.images : [project];
    if (images.length <= 1) {
      dialogGallery.hidden = true;
      return;
    }
    dialogGallery.hidden = false;
    images.forEach(function (image, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'case-gallery-item';
      button.setAttribute('aria-pressed', String(index === 0));
      button.setAttribute('aria-label', 'Show temporary preview image ' + (index + 1) + ' of ' + images.length);
      var thumbnail = document.createElement('img');
      thumbnail.src = image.image;
      thumbnail.alt = image.alt;
      thumbnail.width = image.width;
      thumbnail.height = image.height;
      thumbnail.loading = index === 0 ? 'eager' : 'lazy';
      thumbnail.decoding = 'async';
      button.appendChild(thumbnail);
      button.addEventListener('click', function () { setDialogImage(image, index); });
      dialogGallery.appendChild(button);
    });
  }

  function populateDialog(projectNumber) {
    var project = projects[projectNumber] || projects['01'];
    if (dialogNumber) dialogNumber.textContent = 'Project ' + projectNumber;
    if (dialogTitle) dialogTitle.textContent = '[Project title]';
    if (dialogSummary) dialogSummary.textContent = project.summary + ' ' + project.focus + '.';
    buildDialogGallery(project);
    setDialogImage(project, 0);
  }

  function lockBodyScroll() {
    previousBodyPaddingRight = body.style.paddingRight;
    var scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (scrollbarWidth) body.style.paddingRight = scrollbarWidth + 'px';
    body.classList.add('dialog-open');
  }

  function unlockBodyScroll() {
    body.classList.remove('dialog-open');
    body.style.paddingRight = previousBodyPaddingRight;
  }

  function closeDialog() {
    if (dialog && dialog.open) dialog.close();
  }

  function openProject(trigger) {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    lastTrigger = trigger;
    var projectNumber = trigger.getAttribute('data-project') || '01';
    populateDialog(projectNumber);
    try {
      dialog.showModal();
      lockBodyScroll();
      updateDialogMediaSize();
      window.requestAnimationFrame(updateDialogMediaSize);
      if (dialogClose) window.setTimeout(function () { dialogClose.focus(); }, reducedMotion ? 0 : 80);
    } catch (error) {
      unlockBodyScroll();
    }
  }

  document.querySelectorAll('.project-trigger').forEach(function (trigger) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.addEventListener('click', function () { openProject(trigger); });
  });

  function getDialogFocusables() {
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(function (element) {
      return !element.disabled && element.offsetParent !== null;
    });
  }

  if (dialog) {
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeDialog();
    });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusables = getDialogFocusables();
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog();
    });

    dialog.addEventListener('close', function () {
      unlockBodyScroll();
      resetPaperLayers();
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
  }

  if (dialogClose) dialogClose.addEventListener('click', closeDialog);
  if (dialogImage) dialogImage.addEventListener('load', updateDialogMediaSize);
  window.addEventListener('resize', updateDialogMediaSize);

  var year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
}());
