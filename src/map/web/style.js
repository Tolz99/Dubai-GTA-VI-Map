// Original neon-sunset vector style on OpenMapTiles schema (served free by OpenFreeMap).
// eslint-disable-next-line no-unused-vars
function neonStyle() {
  var C = {
    bg: '#14111C',
    land: '#14111C',
    residential: '#1A1624',
    industrial: '#18141F',
    sand: '#211A24',
    park: '#13302A',
    grass: '#142B25',
    water: '#0D2C3C',
    waterDeep: '#0A2230',
    shore: '#2FD6E8',
    motorway: '#F2387C',
    trunk: '#FF8A4C',
    primary: '#CFC6E0',
    secondary: '#6E6385',
    minor: '#3A3348',
    service: '#2A2534',
    rail: '#2FD6E8',
    label: '#E9E4F2',
    labelDim: '#8C849C',
    halo: '#0A0810',
  };
  var font = ['Noto Sans Bold'];
  var fontReg = ['Noto Sans Regular'];
  var fontIt = ['Noto Sans Italic'];
  var nameExpr = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];

  function roadWidth(base) {
    return ['interpolate', ['exponential', 1.5], ['zoom'], 8, base * 0.25, 12, base, 16, base * 4, 19, base * 12];
  }

  return {
    version: 8,
    name: 'Neon Gulf',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    // Low sunset key light from the Gulf (west-south-west) so tower faces shade like real glass at dusk.
    light: { anchor: 'map', position: [1.3, 250, 55], color: '#FFD9B8', intensity: 0.42 },
    // Dusk sky + distance haze; only visible when the camera is tilted (3D / drive).
    sky: {
      'sky-color': '#120C24',
      'horizon-color': '#7A3270',
      'fog-color': '#21172E',
      'sky-horizon-blend': 0.85,
      'horizon-fog-blend': 0.9,
      'fog-ground-blend': 0.4,
      'atmosphere-blend': 0,
    },
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': C.bg } },
      { id: 'landcover-sand', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['==', ['get', 'class'], 'sand'], paint: { 'fill-color': C.sand } },
      { id: 'landcover-green', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland', 'wetland']]], paint: { 'fill-color': C.grass, 'fill-opacity': 0.8 } },
      { id: 'landuse-res', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood']]], paint: { 'fill-color': C.residential } },
      { id: 'landuse-ind', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['industrial', 'commercial', 'retail', 'railway']]], paint: { 'fill-color': C.industrial } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': C.park, 'fill-opacity': 0.9 } },
      { id: 'landuse-green', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['pitch', 'cemetery', 'stadium', 'golf']]], paint: { 'fill-color': C.park, 'fill-opacity': 0.7 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 8, C.waterDeep, 13, C.water] } },
      { id: 'water-glow', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': C.shore, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.25, 14, 0.5], 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 3], 'line-blur': 2 } },
      { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': C.shore, 'line-opacity': 0.75, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1] } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': C.water, 'line-width': 1.5 } },
      { id: 'aeroway', type: 'fill', source: 'omt', 'source-layer': 'aeroway', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#241A45' } },
      { id: 'runway', type: 'line', source: 'omt', 'source-layer': 'aeroway', filter: ['in', ['get', 'class'], ['literal', ['runway', 'taxiway']]], paint: { 'line-color': '#3A2D66', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 20] } },

      // Roads
      { id: 'road-service', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 14, filter: ['in', ['get', 'class'], ['literal', ['service', 'track', 'path']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.service, 'line-width': roadWidth(0.5) } },
      { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 11, filter: ['in', ['get', 'class'], ['literal', ['minor', 'tertiary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.minor, 'line-width': roadWidth(0.8) } },
      { id: 'road-secondary', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['==', ['get', 'class'], 'secondary'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.secondary, 'line-width': roadWidth(1) } },
      { id: 'road-primary', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'primary'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.primary, 'line-width': roadWidth(1.2), 'line-opacity': 0.55 } },
      { id: 'road-trunk-glow', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'trunk'], paint: { 'line-color': C.trunk, 'line-width': roadWidth(4), 'line-blur': 6, 'line-opacity': 0.25 } },
      { id: 'road-trunk', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'trunk'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.trunk, 'line-width': roadWidth(1.5) } },
      { id: 'road-motorway-glow', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], paint: { 'line-color': C.motorway, 'line-width': roadWidth(5), 'line-blur': 8, 'line-opacity': 0.22 } },
      { id: 'road-motorway', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.motorway, 'line-width': roadWidth(1.8) } },
      { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 10, filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]], paint: { 'line-color': C.rail, 'line-opacity': 0.55, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 3], 'line-dasharray': [2, 1.5] } },

      // 3D buildings. Three layers so towers can wear a window façade up close:
      //  - low-rise: matte sand-stone tones (villas < 12 m keep them up close)
      //  - towers far away: glass/steel tones graded by height
      //  - towers up close (z15+): procedural lit-window texture ('facade-*' images from map.js)
      { id: 'buildings', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14, maxzoom: 15,
        filter: ['<', ['coalesce', ['get', 'render_height'], 5], 30],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 0, '#2B2631', 12, '#332C3A', 29, '#3A3346'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 5],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.96,
          'fill-extrusion-vertical-gradient': true,
        } },
      { id: 'buildings-low', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 15,
        filter: ['<', ['coalesce', ['get', 'render_height'], 5], 12],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 0, '#2B2631', 12, '#332C3A', 29, '#3A3346'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 5],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.96,
          'fill-extrusion-vertical-gradient': true,
        } },
      { id: 'buildings-tall', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14, maxzoom: 15,
        filter: ['>=', ['coalesce', ['get', 'render_height'], 5], 30],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 30, '#353A55', 90, '#3F4A72', 180, '#55508A', 300, '#8A4C8E', 500, '#D8467F'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 5],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.97,
          'fill-extrusion-vertical-gradient': true,
        } },
      { id: 'buildings-facade', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 15,
        filter: ['>=', ['coalesce', ['get', 'render_height'], 5], 12],
        paint: {
          'fill-extrusion-pattern': ['step', ['coalesce', ['get', 'render_height'], 5], 'facade-low', 30, 'facade-mid', 90, 'facade-high', 250, 'facade-super'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 5],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 1,
        } },

      // Labels
      { id: 'water-name', type: 'symbol', source: 'omt', 'source-layer': 'water_name', layout: { 'text-field': nameExpr, 'text-font': fontIt, 'text-size': 12, 'text-letter-spacing': 0.2 }, paint: { 'text-color': '#5FC9DA', 'text-halo-color': C.halo, 'text-halo-width': 1 } },
      { id: 'road-name', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 13, layout: { 'symbol-placement': 'line', 'text-field': nameExpr, 'text-font': fontReg, 'text-size': 11, 'text-transform': 'uppercase', 'text-letter-spacing': 0.1 }, paint: { 'text-color': C.labelDim, 'text-halo-color': C.halo, 'text-halo-width': 1.2 } },
      { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 11, filter: ['in', ['get', 'class'], ['literal', ['neighbourhood', 'quarter', 'suburb', 'hamlet', 'village']]],
        layout: { 'text-field': nameExpr, 'text-font': font, 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 15, 16], 'text-transform': 'uppercase', 'text-letter-spacing': 0.08, 'text-max-width': 8, 'symbol-sort-key': 10 },
        paint: { 'text-color': '#FFFFFF', 'text-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.7, 14, 0.9], 'text-halo-color': C.halo, 'text-halo-width': 2.2 } },
      { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: { 'text-field': nameExpr, 'text-font': font, 'text-size': 18, 'text-transform': 'uppercase', 'text-letter-spacing': 0.25 },
        paint: { 'text-color': '#FFFFFF', 'text-halo-color': C.halo, 'text-halo-width': 2.6 } },
    ],
  };
}
