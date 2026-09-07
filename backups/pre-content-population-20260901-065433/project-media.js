(function () {
  'use strict';

  var disclaimer = 'Temporary preview image set. These images are not representations of the portfolio owner’s work.';

  function preview(id, src, type, width, height, alt, focalPoint) {
    return {
      id: id,
      kind: 'image',
      status: 'temporary-preview',
      src: src,
      type: type,
      width: width,
      height: height,
      fit: { featured: 'cover', thumbnail: 'cover', expanded: 'contain' },
      focalPoint: focalPoint,
      alt: alt,
      caption: disclaimer,
      poster: null
    };
  }

  function future(projectId, slot) {
    return {
      id: 'p' + projectId + '-' + slot,
      kind: 'slot',
      status: 'future',
      src: null,
      type: null,
      width: null,
      height: null,
      fit: { featured: 'cover', thumbnail: 'cover', expanded: 'contain' },
      focalPoint: { x: 50, y: 50 },
      alt: 'Future media slot ' + slot + '. No asset supplied.',
      caption: 'Future media slot ' + slot + ' of 5. No project asset has been supplied.',
      poster: null
    };
  }

  function slots(projectId, first) {
    return [first, future(projectId, 2), future(projectId, 3), future(projectId, 4), future(projectId, 5)];
  }

  var projects = {
    '01': {
      id: '01', title: '[Project title]', focus: 'Marine engineering placeholder',
      summary: 'A temporary marine engineering image reserved for a verified project narrative.',
      media: slots('01', preview('p01-01', 'assets/images/placeholders/p01-marine-engine-room.jpg', 'image/jpeg', 1920, 1440, 'Temporary preview image of a marine engine room', { x: 50, y: 50 }))
    },
    '02': {
      id: '02', title: '[Project title]', focus: 'Wind energy placeholder',
      summary: 'A temporary wind energy image reserved for a verified project narrative.',
      media: slots('02', preview('p02-01', 'assets/images/placeholders/p02-offshore-wind.jpg', 'image/jpeg', 800, 600, 'Temporary preview image of an offshore wind turbine', { x: 50, y: 50 }))
    },
    '03': {
      id: '03', title: '[Project title]', focus: 'Architecture / structure placeholder',
      summary: 'A temporary structural engineering image reserved for a verified project narrative.',
      media: slots('03', preview('p03-01', 'assets/images/placeholders/p03-steel-structure.jpg', 'image/jpeg', 960, 1448, 'Temporary preview image of a steel structure', { x: 50, y: 42 }))
    },
    '04': {
      id: '04', title: '[Project title]', focus: 'UAV systems placeholder',
      summary: 'A temporary UAV image reserved for a verified project narrative.',
      media: slots('04', preview('p04-01', 'assets/images/placeholders/p04-uav-flight.jpg', 'image/jpeg', 1920, 1080, 'Temporary preview image of a quadcopter in flight', { x: 50, y: 50 }))
    },
    '05': {
      id: '05', title: '[Project title]', focus: 'Thermal / electronics placeholder',
      summary: 'A temporary thermal electronics image reserved for a verified project narrative.',
      media: slots('05', preview('p05-01', 'assets/images/placeholders/p05-thermal-electronics.jpg', 'image/jpeg', 1920, 1285, 'Temporary preview image of a circuit board thermography display', { x: 50, y: 35 }))
    },
    '06': {
      id: '06', title: '[Project title]', focus: 'Wireless simulation placeholder',
      summary: 'A temporary wireless systems image reserved for a verified project narrative.',
      media: slots('06', preview('p06-01', 'assets/images/placeholders/p06-wireless-antenna.jpg', 'image/jpeg', 960, 1280, 'Temporary preview image of a wireless internet antenna', { x: 50, y: 50 }))
    },
    '07': {
      id: '07', title: '[Project title]', focus: 'Motorsport drivetrain placeholder',
      summary: 'A temporary motorsport drivetrain image reserved for a verified project narrative.',
      media: slots('07', preview('p07-01', 'assets/images/placeholders/p07-racing-engine.jpg', 'image/jpeg', 1920, 1440, 'Temporary preview image of a racing engine', { x: 50, y: 50 }))
    },
    '08': {
      id: '08', title: '[Project title]', focus: 'Mobility engineering placeholder',
      summary: 'A temporary mobility engineering image reserved for a verified project narrative.',
      media: slots('08', preview('p08-01', 'assets/images/placeholders/p08-electric-vehicle.jpg', 'image/jpeg', 1920, 1440, 'Temporary preview image of an electric vehicle', { x: 50, y: 50 }))
    },
    '09': {
      id: '09', title: '[Project title]', focus: 'Data analysis placeholder',
      summary: 'A temporary data analysis image reserved for a verified project narrative.',
      media: slots('09', preview('p09-01', 'assets/images/placeholders/p09-data-display.jpg', 'image/jpeg', 1920, 1440, 'Temporary preview image of a computer display', { x: 50, y: 50 }))
    },
    '10': {
      id: '10', title: '[Project title]', focus: 'Quantum computing placeholder',
      summary: 'A temporary quantum computing image reserved for a verified project narrative.',
      media: slots('10', preview('p10-01', 'assets/images/placeholders/p10-quantum-cryostat.jpg', 'image/jpeg', 960, 1280, 'Temporary preview image of a cryostat', { x: 50, y: 50 }))
    }
  };

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  window.PORTFOLIO_PROJECTS = deepFreeze(projects);
}());
