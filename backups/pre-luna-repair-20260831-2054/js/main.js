(function () {
  'use strict';

  var body = document.body;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.add('motion-ready');
  if (reducedMotion) body.classList.add('reduce-motion');

  var projects = {
    '01': { focus: 'Marine engineering placeholder', summary: 'A temporary marine engineering image reserved for a verified project narrative.', image: 'assets/images/placeholders/p01-marine-engine-room.jpg', alt: 'Temporary preview image of a marine engine room', width: 2560, height: 1920 },
    '02': { focus: 'Wind energy placeholder', summary: 'A temporary wind energy image reserved for a verified project narrative.', image: 'assets/images/placeholders/p02-offshore-wind.jpg', alt: 'Temporary preview image of an offshore wind turbine', width: 800, height: 600 },
    '03': { focus: 'Architecture / structure placeholder', summary: 'A temporary structural engineering image reserved for a verified project narrative.', image: 'assets/images/placeholders/p03-steel-structure.jpg', alt: 'Temporary preview image of a steel structure', width: 2075, height: 3130 },
    '04': { focus: 'UAV systems placeholder', summary: 'A temporary UAV image reserved for a verified project narrative.', image: 'assets/images/placeholders/p04-uav-flight.jpg', alt: 'Temporary preview image of a quadcopter in flight', width: 3840, height: 2160 },
    '05': { focus: 'Thermal / electronics placeholder', summary: 'A temporary thermal electronics image reserved for a verified project narrative.', image: 'assets/images/placeholders/p05-thermal-electronics.jpg', alt: 'Temporary preview image of a circuit board thermography display', width: 3872, height: 2592 },
    '06': { focus: 'Wireless simulation placeholder', summary: 'A temporary wireless systems image reserved for a verified project narrative.', image: 'assets/images/placeholders/p06-wireless-antenna.jpg', alt: 'Temporary preview image of a wireless internet antenna', width: 4000, height: 3000 },
    '07': { focus: 'Motorsport drivetrain placeholder', summary: 'A temporary motorsport drivetrain image reserved for a verified project narrative.', image: 'assets/images/placeholders/p07-racing-engine.jpg', alt: 'Temporary preview image of a racing engine', width: 2630, height: 1973 },
    '08': { focus: 'Mobility engineering placeholder', summary: 'A temporary mobility engineering image reserved for a verified project narrative.', image: 'assets/images/placeholders/p08-electric-vehicle.jpg', alt: 'Temporary preview image of an electric vehicle', width: 4896, height: 3672 },
    '09': { focus: 'Data analysis placeholder', summary: 'A temporary data analysis image reserved for a verified project narrative.', image: 'assets/images/placeholders/p09-data-display.jpg', alt: 'Temporary preview image of a computer display', width: 2048, height: 1536 },
    '10': { focus: 'Quantum computing placeholder', summary: 'A temporary quantum computing image reserved for a verified project narrative.', image: 'assets/images/placeholders/p10-quantum-cryostat.jpg', alt: 'Temporary preview image of a cryostat', width: 3024, height: 4032 }
  };

  var projectNumbers = Object.keys(projects);
  projectNumbers.forEach(function (number, index) {
    projects[number].images = [
      projects[number],
      projects[projectNumbers[(index + 1) % projectNumbers.length]],
      projects[projectNumbers[(index + 2) % projectNumbers.length]]
    ];
  });

  var menuButton = document.querySelector('.menu-button');
  var navigation = document.getElementById('site-navigation');
  if (menuButton && navigation) {
    menuButton.addEventListener('click', function () {
      var isOpen = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navigation.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var hero = document.querySelector('.hero');
  var heroProgress = document.querySelector('.hero-progress');
  var heroStageLabel = document.querySelector('.hero-stage-label');
  var heroProgressFill = document.querySelector('.hero-progress-fill');
  var heroStages = ['Identity', 'Focus', 'Register'];
  var scrollTicking = false;
  function updateHeroProgress() {
    scrollTicking = false;
    if (!hero) return;
    var range = Math.max(1, hero.offsetHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / range));
    document.documentElement.style.setProperty('--hero-progress', progress.toFixed(3));
    hero.classList.toggle('hero-ended', progress >= .999);
    var stage = progress > .66 ? 3 : (progress > .25 ? 2 : 1);
    document.documentElement.style.setProperty('--hero-progress-fill', progress.toFixed(3));
    hero.dataset.heroStage = String(stage);
    if (heroProgressFill) heroProgressFill.style.transform = 'scaleX(' + progress.toFixed(3) + ')';
    if (heroStageLabel) heroStageLabel.textContent = heroStages[stage - 1];
    if (heroProgress) {
      heroProgress.textContent = '0' + stage + ' / 03';
    }
  }
  function requestHeroProgress() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateHeroProgress);
    }
  }
  window.addEventListener('scroll', requestHeroProgress, { passive: true });
  window.addEventListener('resize', requestHeroProgress);
  updateHeroProgress();

  var revealItems = document.querySelectorAll('.reveal');
  document.querySelectorAll('.feature-spread').forEach(function (spread) {
    spread.querySelectorAll('.feature-scene').forEach(function (scene, index) {
      scene.style.setProperty('--reveal-delay', (index * 90) + 'ms');
    });
  });
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var dialog = document.getElementById('case-dialog');
  var dialogNumber = document.getElementById('case-number');
  var dialogTitle = document.getElementById('case-title');
  var dialogSummary = document.getElementById('case-summary');
  var dialogImage = document.getElementById('case-image');
  var dialogMedia = document.getElementById('case-media');
  var dialogGallery = document.getElementById('case-gallery');
  var dialogClose = document.querySelector('.dialog-close');
  var lastTrigger = null;
  var activeDialogProject = null;
  var activeDialogImage = null;

  function getDialogMediaMaxHeight() {
    if (window.matchMedia('(max-width: 580px)').matches) return Math.min(window.innerHeight * .32, 270);
    if (window.matchMedia('(max-width: 920px)').matches) return Math.min(window.innerHeight * .36, 320);
    return Math.min(window.innerHeight * .46, 410);
  }

  function updateDialogMediaSize() {
    if (!dialogMedia || !activeDialogImage || !activeDialogImage.width || !activeDialogImage.height) return;
    var availableWidth = dialogMedia.parentElement ? dialogMedia.parentElement.clientWidth : window.innerWidth;
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
    var layers = dialogMedia.querySelectorAll('.paper-layer');
    layers.forEach(function (layer) {
      layer.getAnimations().forEach(function (animation) { animation.cancel(); });
      layer.style.opacity = '';
      layer.style.transform = '';
      layer.style.clipPath = '';
    });
  }

  function animatePaperLayers(url) {
    if (!dialogMedia) return;
    var layers = dialogMedia.querySelectorAll('.paper-layer');
    layers.forEach(function (layer, index) {
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
    }
    updateGalleryState(activeIndex);
    updateDialogMediaSize();
    resetPaperLayers();
    animatePaperLayers(image.image);
  }

  function buildDialogGallery(project) {
    if (!dialogGallery) return;
    dialogGallery.textContent = '';
    var images = project.images || [project];
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
      button.appendChild(thumbnail);
      button.addEventListener('click', function () {
        setDialogImage(image, index);
      });
      dialogGallery.appendChild(button);
    });
  }

  function populateDialog(projectNumber) {
    var project = projects[projectNumber] || projects['01'];
    activeDialogProject = project;
    if (dialogNumber) dialogNumber.textContent = 'Project ' + projectNumber;
    if (dialogTitle) dialogTitle.textContent = '[Project title]';
    if (dialogSummary) dialogSummary.textContent = project.summary + ' ' + project.focus + '.';
    buildDialogGallery(project);
    setDialogImage(project, 0);
  }

  function openProject(trigger) {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    lastTrigger = trigger;
    var projectNumber = trigger.getAttribute('data-project') || '01';
    var update = function () {
      populateDialog(projectNumber);
      dialog.showModal();
      body.classList.add('dialog-open');
      updateDialogMediaSize();
      window.requestAnimationFrame(updateDialogMediaSize);
    };
    if (document.startViewTransition && !reducedMotion) {
      try { document.startViewTransition(update); } catch (error) { update(); }
    } else update();
    if (dialogClose) window.setTimeout(function () { dialogClose.focus(); }, reducedMotion ? 0 : 80);
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
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
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
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      body.classList.remove('dialog-open');
      resetPaperLayers();
      if (lastTrigger) lastTrigger.focus();
    });
  }
  if (dialogClose) dialogClose.addEventListener('click', function () { if (dialog) dialog.close(); });
  if (dialogImage) dialogImage.addEventListener('load', updateDialogMediaSize);
  window.addEventListener('resize', updateDialogMediaSize);

  var year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
}());
