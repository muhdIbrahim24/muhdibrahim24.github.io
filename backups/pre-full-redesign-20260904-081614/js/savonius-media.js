(function () {
  'use strict';

  var report = 'Capstone Spring 2025';
  var base = 'assets/images/projects/savonius/';

  function evidence(id, file, width, height, alt, caption, figure, page) {
    return {
      id: id,
      kind: 'image',
      status: 'ready',
      src: base + file,
      type: 'image/png',
      width: width,
      height: height,
      alt: alt,
      caption: caption,
      source: { title: report, page: page, figure: figure, section: '', url: null },
      citation: { label: report + ' · ' + figure + ' · p. ' + page, url: null },
      credit: { creator: 'Muhammad Ibrahim', license: '', url: null },
      poster: null,
      tracks: []
    };
  }

  window.PORTFOLIO_MEDIA_OVERRIDES = window.PORTFOLIO_MEDIA_OVERRIDES || {};
  window.PORTFOLIO_MEDIA_OVERRIDES['project:02'] = [
    evidence('p02-01', 'prototype-lab.png', 603, 648,
      'Blue 1:3 Savonius turbine prototype mounted on a laboratory test bench.',
      '1:3 carbon-fibre-reinforced FDM Savonius prototype mounted on the laboratory test bench.',
      'Figure 37', '35'),
    evidence('p02-02', 'prototype-outdoor-stand.png', 598, 1048,
      'Blue Savonius prototype installed on an outdoor test stand.',
      'The 1:3 prototype installed on the full outdoor test stand.',
      'Figure 39', '36'),
    evidence('p02-03', 'rotor-design-progression.png', 1225, 240,
      'CAD design progression of the Savonius rotor from blade profile to final helical rotor.',
      'Design progression from blade profile to the final 45-degree helical Savonius rotor with end plates.',
      'Figure 33', '33'),
    evidence('p02-04', 'geometry-sketch-and-parameters.png', 823, 826,
      'Parametrized Savonius rotor sketch with the associated geometry parameter table.',
      'Figure 35: Parametrized Sketch, with Table X: Table of Parameters.',
      'Figure 35 and Table X', '34'),
    evidence('p02-05', 'interior-enclosure-mesh.png', 1150, 650,
      'ANSYS Fluent mesh showing the turbine inside an interior enclosure.',
      'ANSYS Fluent mesh of the turbine inside the interior enclosure.',
      'Figure 17', '22'),
    evidence('p02-06', 'velocity-time-serrated-plates.png', 838, 460,
      'ANSYS Fluent maximum velocity trace over flow time for the serrated-edge configuration with plates.',
      'ANSYS Fluent maximum-velocity trace over flow time for the serrated-edge configuration with plates.',
      'Figure 28', '29'),
    evidence('p02-07', 'end-plate-velocity-comparison.png', 1092, 545,
      'ANSYS Fluent velocity comparison chart with and without end plates.',
      'ANSYS Fluent comparison of maximum velocity over flow time, with and without end plates.',
      'Figure 30', '31'),
    evidence('p02-08', 'serrated-leading-edge.png', 295, 700,
      'CAD close-up of the serrated leading edge on the Savonius rotor.',
      'CAD close-up of the serrated leading edge incorporated into the Savonius rotor geometry.',
      'Figure 34', '33')
  ];
}());
