(function () {
  'use strict';

  /*
   * Public media registry.
   *
   * The registry is intentionally data-only.  `main.js` owns rendering and
   * interaction, while this file owns the portable, documented media shape.
   * Existing project slots are normalised here so adding a real asset later
   * does not require editing card, feature and dialog markup separately.
   */
  var sourceCatalog = {
    'p01-marine-engine-room.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Engine_room_-_P3020119.JPG',
      creator: 'Henry Pearson (Henry P)',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0'
    },
    'p02-offshore-wind.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Off-shore_Wind_Farm_Turbine.jpg',
      creator: 'Phil Hollman',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0'
    },
    'p03-steel-structure.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Steel_structure.jpg',
      creator: 'Maxim Sinelshchikov',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0'
    },
    'p04-uav-flight.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Quadcopter_Drone_in_flight.jpg',
      creator: 'Project Kei / Keita.Honda',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0'
    },
    'p05-thermal-electronics.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Thermography_of_electronics.JPG',
      creator: 'Pieter Kuiper',
      license: 'Public domain',
      licenseUrl: null
    },
    'p06-wireless-antenna.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:WiFi_Wireless_internet_Antenna_(Bologna)_in_2023.01.jpg',
      creator: 'CAPTAIN RAJU',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0'
    },
    'p07-racing-engine.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Coventry_Climax_FWMV_in_Cooper_T66.jpg',
      creator: 'John Chapman (Pyrope)',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0'
    },
    'p08-electric-vehicle.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Electric_vehicle.jpg',
      creator: 'Gausanchennai',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0'
    },
    'p09-data-display.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Computer_monitor_screen_image_simulated.jpg',
      creator: 'Andrew pmk~commonswiki',
      license: 'CC BY 2.0 and GFDL',
      licenseUrl: null
    },
    'p10-quantum-cryostat.jpg': {
      page: 'https://commons.wikimedia.org/wiki/File:Cryostat.jpg',
      creator: 'P..W. Frako-Term sp. z o.o.',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0'
    }
  };

  function emptySource() {
    return { title: '', page: '', figure: '', section: '', url: null };
  }

  function safeMediaUrl(value) {
    if (!value) return null;
    var url = String(value).trim();
    return /^(?:https?:|file:|blob:|data:image\/|\.\.?\/|\/|assets\/)/i.test(url) ? url : null;
  }

  function sourceFor(src) {
    var source = emptySource();
    if (!src) return source;
    var file = String(src).split('/').pop();
    var details = sourceCatalog[file];
    if (!details) return source;
    source.title = 'Wikimedia Commons';
    source.page = details.page;
    source.figure = file;
    source.section = 'Temporary preview image sources';
    source.url = details.page;
    return source;
  }

  function citationFor(src) {
    var details = sourceCatalog[String(src || '').split('/').pop()];
    return { label: details ? 'Wikimedia Commons file page' : '', url: details ? details.page : null };
  }

  function creditFor(src) {
    var details = sourceCatalog[String(src || '').split('/').pop()];
    return { creator: details ? details.creator : '', license: details ? details.license : '', url: details ? details.licenseUrl : null };
  }

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

  function copySource(source, fallback) {
    var result = emptySource();
    var input = source || fallback || {};
    Object.keys(result).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(input, key)) result[key] = input[key] == null ? (key === 'url' ? null : '') : String(input[key]);
    });
    return result;
  }

  function copyCitation(citation, fallback) {
    var input = citation || fallback || {};
    return { label: input.label ? String(input.label) : '', url: input.url ? String(input.url) : null };
  }

  function copyCredit(credit, fallback) {
    var input = credit || fallback || {};
    return { creator: input.creator ? String(input.creator) : '', license: input.license ? String(input.license) : '', url: input.url ? String(input.url) : null };
  }

  function copyPoster(poster, parent) {
    if (!poster || typeof poster !== 'object') return null;
    var posterSrc = safeMediaUrl(poster.src);
    return {
      src: posterSrc,
      type: poster.type ? String(poster.type) : (posterSrc ? 'image/jpeg' : null),
      width: Number(poster.width) || null,
      height: Number(poster.height) || null,
      alt: poster.alt ? String(poster.alt) : (parent.alt || ''),
      caption: poster.caption ? String(poster.caption) : (parent.caption || ''),
      source: copySource(poster.source, sourceFor(posterSrc)),
      citation: copyCitation(poster.citation, citationFor(posterSrc)),
      credit: copyCredit(poster.credit, creditFor(posterSrc))
    };
  }

  function copyTracks(tracks) {
    if (!Array.isArray(tracks)) return [];
    return tracks.map(function (track) {
      return {
        src: safeMediaUrl(track && track.src) || '',
        kind: track && track.kind ? String(track.kind) : 'captions',
        srclang: track && track.srclang ? String(track.srclang) : 'en',
        label: track && track.label ? String(track.label) : 'English'
      };
    }).filter(function (track) { return track.src; });
  }

  function normalize(media, fallbackId) {
    var item = media || {};
    var src = safeMediaUrl(item.src);
    var sourceFallback = sourceFor(src);
    var citationFallback = citationFor(src);
    var creditFallback = creditFor(src);
    var normalized = {
      id: item.id ? String(item.id) : String(fallbackId || 'media-01'),
      kind: mediaKind(item),
      status: item.status ? String(item.status) : (src ? 'ready' : 'future'),
      src: src,
      type: item.type ? String(item.type) : (src ? 'image/jpeg' : null),
      width: Number(item.width) || null,
      height: Number(item.height) || null,
      alt: item.alt ? String(item.alt) : '',
      caption: item.caption ? String(item.caption) : '',
      source: copySource(item.source, sourceFallback),
      citation: copyCitation(item.citation, citationFallback),
      credit: copyCredit(item.credit, creditFallback),
      poster: null,
      tracks: copyTracks(item.tracks)
    };
    normalized.poster = copyPoster(item.poster, normalized);
    return normalized;
  }

  function future(recordId, slot, label) {
    return normalize({
      id: recordId + '-' + String(slot).padStart(2, '0'), kind: 'slot', status: 'future',
      src: null, type: null, width: null, height: null,
      alt: 'Future media slot ' + slot + '. No asset supplied.',
      caption: 'Future ' + label.toLowerCase() + ' media slot ' + slot + ' of 5. No asset has been supplied.'
    });
  }

  function defaultSlots(prefix, first, label) {
    var result = [normalize(first, prefix + '-01')];
    for (var slot = 2; slot <= 5; slot += 1) result.push(future(prefix, slot, label));
    return result;
  }

  function entryMedia(trigger) {
    var type = trigger.getAttribute('data-entry-type');
    var id = trigger.getAttribute('data-entry-id');
    var source = trigger.querySelector('.entry-source');
    if (!type || !id || !source) return null;
    var label = type === 'research' ? 'research' : 'activity';
    return defaultSlots(type + '-' + id, {
      id: type + '-' + id + '-01', kind: 'image', status: 'temporary-preview',
      src: source.getAttribute('data-preview'), type: 'image/jpeg',
      width: Number(source.getAttribute('data-preview-width')) || null,
      height: Number(source.getAttribute('data-preview-height')) || null,
      alt: source.getAttribute('data-preview-alt') || 'Temporary preview image',
      caption: 'Temporary stock image only. It is not ' + type + ' evidence.'
    }, label);
  }

  var registry = {};
  /* Approved production manifests can be supplied before this script as
   * `window.PORTFOLIO_MEDIA_OVERRIDES`.  A preloaded `PORTFOLIO_MEDIA` object
   * is accepted as the same reviewed override for static QA fixtures. */
  var reviewedMedia = window.PORTFOLIO_MEDIA_OVERRIDES || window.PORTFOLIO_MEDIA || {};
  var projects = window.PORTFOLIO_PROJECTS || {};
  Object.keys(projects).forEach(function (id) {
    if (projects[id] && Array.isArray(projects[id].media)) {
      registry['project:' + id] = projects[id].media.map(function (media, index) { return normalize(media, 'p' + id + '-' + String(index + 1).padStart(2, '0')); });
    }
  });
  if (typeof document !== 'undefined') {
    Array.prototype.forEach.call(document.querySelectorAll('.entry-trigger[data-entry-type][data-entry-id]'), function (trigger) {
      var type = trigger.getAttribute('data-entry-type');
      var id = trigger.getAttribute('data-entry-id');
      var media = entryMedia(trigger);
      if (media) registry[type + ':' + id] = media;
    });
  }

  Object.keys(reviewedMedia).forEach(function (key) {
    if (Array.isArray(reviewedMedia[key])) registry[key] = reviewedMedia[key].map(function (media, index) { return normalize(media, key + '-' + String(index + 1).padStart(2, '0')); });
  });

  /* A consumer may replace this object before main.js runs (for example with
   * a reviewed production manifest).  Keep the fixture-facing global stable. */
  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  window.PORTFOLIO_MEDIA = deepFreeze(registry);
  window.PORTFOLIO_MEDIA_SCHEMA_VERSION = '1.0';
}());
