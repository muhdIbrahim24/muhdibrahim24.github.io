(function () {
  'use strict';

  var overrides = window.PORTFOLIO_MEDIA_OVERRIDES = window.PORTFOLIO_MEDIA_OVERRIDES || {};

  function evidence(id, directory, file, width, height, alt, caption, report, figure, page) {
    return {
      id: id,
      kind: 'image',
      status: 'ready',
      src: 'assets/images/projects/' + directory + '/' + file,
      type: 'image/png',
      width: width,
      height: height,
      alt: alt,
      caption: caption,
      source: { title: report, page: page || '', figure: figure || '', section: '', url: null },
      citation: { label: report + ' · ' + (figure || 'Project analysis') + (page ? ' · PDF p. ' + page : ''), url: null },
      credit: { creator: '', license: '', url: null },
      poster: null,
      tracks: []
    };
  }

  var pde = 'Partial Differential Equations Project (Fall 2025)';
  overrides['project:06'] = [
    evidence('p06-01', 'pde', 'qam-schematic.png', 847, 340,
      'Schematic diagram of the quadrature amplitude modulation transmit and receive chain.',
      'Figure 1: Schematic for Quadrature Amplitude Modulation (QAM).', pde, 'Figure 1', '5'),
    evidence('p06-02', 'pde', 'domain-boundaries.png', 963, 590,
      'Plan of the room slice with four candidate transmitter positions, a cabinet cutout and the desk region.',
      'Figure 3: Domain boundaries for the 5 by 4 m room slice, cabinet cutout and desk region.', pde, 'Figure 3', '11'),
    evidence('p06-03', 'pde', 'ideal-free-space.png', 945, 345,
      'Paired normalized field maps for the ideal free-space reference in the room and desk region.',
      'Figure 4: Ideal free-space reference with router at desk center and about 68% desk coverage.', pde, 'Figure 4', '12'),
    evidence('p06-04', 'pde', 'reflective-field-maps.png', 1510, 1020,
      'Four normalized field maps for reflective-wall simulations at the candidate transmitter positions.',
      'Figure 5: Field coverage for reflective walls across the four candidate transmitter positions.', pde, 'Figure 5', '13'),
    evidence('p06-05', 'pde', 'reflective-coverage.png', 1250, 800,
      'Coverage bar chart for reflective walls at the ten percent threshold.',
      'Figure 6: Field coverage for reflective walls at a 10% threshold.', pde, 'Figure 6', '14'),
    evidence('p06-06', 'pde', 'absorbing-field-maps.png', 1440, 1025,
      'Four normalized field maps for partially absorbing-wall simulations at the candidate transmitter positions.',
      'Figure 7: Field coverage for partially absorbing walls across the four candidate transmitter positions.', pde, 'Figure 7', '15'),
    evidence('p06-07', 'pde', 'absorbing-coverage.png', 1030, 730,
      'Coverage bar chart for partially absorbing walls at the ten percent threshold.',
      'Figure 8: Field coverage for partially absorbing walls.', pde, 'Figure 8', '16'),
    evidence('p06-08', 'pde', 'threshold-comparison.png', 1978, 520,
      'Side-by-side coverage charts comparing five and ten percent threshold settings.',
      'Figures 9–10: Absorbing versus fully reflective coverage at 5% (left) and 10% (right) thresholds.', pde, 'Figures 9–10', '17'),
    evidence('p06-09', 'pde', 'best-transmitter-location.png', 720, 580,
      'Normalized field map for the best partially absorbing-wall transmitter position.',
      'Figure 11: Ideal transmitter position under the selected realistic boundary and initial conditions.', pde, 'Figure 11', '18')
  ];

  var pca = 'Data Analysis Project (Fall 2025)';
  overrides['project:09'] = [
    evidence('p09-01', 'pca', 'preprocessing-matrix.png', 535, 465,
      'Equations showing centering, scaling and construction of the standardized PCA data matrix.',
      'Section 3.2: Centering, scaling and construction of the final PCA data matrix.', pca, 'Section 3.2', ''),
    evidence('p09-02', 'pca', 'convergence-paths.png', 1120, 845,
      'Convergence plots for the sample mean, covariance entries and leading PCA eigenvalue.',
      'Figure 1: Convergence of the sample mean, covariance entries and leading PCA eigenvalue as more days are added.', pca, 'Figure 1', '6'),
    evidence('p09-03', 'pca', 'raw-and-standardised-distributions.png', 1020, 1020,
      'Raw temperature and rental distributions shown above their centred and standardized equivalents.',
      'Figures 2–3: Raw distributions for temperature and rentals, compared with the centred and standardised distributions in z-score units.', pca, 'Figures 2–3', '10'),
    evidence('p09-04', 'pca', 'pc1-stability.png', 1750, 850,
      'PC1 explained variance and selected reduced rank as the sample size increases.',
      'Figure 9: Stability of PC1 explained variance and the chosen reduced rank as sample size increases.', pca, 'Figure 9', '14')
  ];

  var civil = 'Civil Engineering Design Project (Fall 2025)';
  overrides['project:03'] = [
    evidence('p03-01', 'civil', 'architectural-plan.png', 720, 800,
      'Architectural plan of the proposed four-storey residential building in the UAE.',
      'Figure 1: Architectural plan of the proposed four-storey residential building in the UAE.', civil, 'Figure 1', '2'),
    evidence('p03-02', 'civil', 'structural-plan.png', 770, 850,
      'Structural plan showing the proposed building column and beam layout.',
      'Figure 2: Structural plan showing the column and beam layout for the proposed residential building.', civil, 'Figure 2', '3'),
    evidence('p03-03', 'civil', 'sap2000-mesh.png', 1790, 990,
      'SAP2000 slab finite-element mesh shown in plan and three-dimensional views.',
      'Figure 3: Finite-element mesh of the slab in SAP2000, shown in plan (left) and 3D (right).', civil, 'Figure 3', '4'),
    evidence('p03-04', 'civil', 'design-actions-table.png', 1730, 620,
      'Table of absolute design actions exported from SAP2000 to the Excel design sheets.',
      'Table 1: Design actions imported from SAP2000 into the Excel design sheets.', civil, 'Table 1', '5'),
    evidence('p03-05', 'civil', 'bedroom-study.png', 1040, 720,
      'Bedroom render with an integrated study desk, shelving and sleeping area.',
      'Figure 4: Bedroom with integrated study desk.', civil, 'Figure 4', '10'),
    evidence('p03-06', 'civil', 'balcony-landscape.png', 1120, 740,
      'Balcony render looking over the railing toward the landscaped edge.',
      'Figure 5: Balcony railing overlooking landscape.', civil, 'Figure 5', '10'),
    evidence('p03-07', 'civil', 'corner-balcony.png', 740, 470,
      'Corner balcony render with sliding doors connecting the terrace and interior.',
      'Figure 6: Corner balcony with sliding doors.', civil, 'Figure 6', '10'),
    evidence('p03-08', 'civil', 'rear-facade-playground.png', 720, 740,
      'Rear façade render looking over the landscaped courtyard and playground.',
      'Figure 10: Rear façade with playground and trees.', civil, 'Figure 10', '11'),
    evidence('p03-09', 'civil', 'planter-balconies.png', 730, 560,
      'Ground-floor planter and balconies on the residential building render.',
      'Figure 11: Ground-floor planter and balconies.', civil, 'Figure 11', '11'),
    evidence('p03-10', 'civil', 'facade-traditional-comparison.png', 1978, 520,
      'Original exterior model and traditional UAE-inspired AI façade shown side by side.',
      'Figure 14: Side-by-side comparison of the original façade (left) and AI façade 1, traditional UAE inspired (right).', civil, 'Figure 14', '13'),
    evidence('p03-11', 'civil', 'facade-biophilic-comparison.png', 1978, 520,
      'Original exterior model and modern biophilic AI façade shown side by side.',
      'Figure 15: Side-by-side comparison of the original façade (left) and AI façade 2, modern biophilic (right).', civil, 'Figure 15', '14'),
    evidence('p03-12', 'civil', 'interior-contemporary-comparison.png', 1978, 520,
      'Original living-room model and chic contemporary AI interior shown side by side.',
      'Figure 16: Side-by-side comparison of the original interior (left) and chic contemporary AI interior (right).', civil, 'Figure 16', '15'),
    evidence('p03-13', 'civil', 'embodied-carbon.png', 1280, 590,
      'Pie chart showing embodied carbon for the 5th Corner building by category.',
      'Figure 18: Pie chart of embodied carbon for 5th Corner, covering A1–A3, envelope and interiors.', civil, 'Figure 18', '17')
  ];
}());
