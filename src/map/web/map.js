/* global maplibregl, neonStyle */
// Map engine running inside the WebView (iOS/Android) or an iframe (web preview).
// Talks to React Native through a tiny JSON message bridge.
(function () {
  var DUBAI = [55.245, 25.155];
  var state = { places: [], visible: null, highlight: null, selected: null, icons: {}, ready: false, queue: [], pulse: 0 };

  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage({ __neon: true, payload: s }, '*');
  }

  var map = new maplibregl.Map({
    container: 'map',
    style: neonStyle(),
    center: DUBAI,
    zoom: 10.4,
    minZoom: 8.5,
    maxZoom: 19,
    pitch: 0,
    maxBounds: [[54.6, 24.45], [56.45, 25.6]],
    attributionControl: { compact: true },
    dragRotate: true,
    pitchWithRotate: true,
    fadeDuration: 150,
  });
  window.__map = map;

  // ───────── blip icons drawn from SVG paths ─────────
  // Game-style blip: solid colour silhouette with a thick dark outline (no bubble).
  function makeBlip(color, path, size, opts) {
    opts = opts || {};
    var ratio = 2;
    var px = size * ratio;
    var c = document.createElement('canvas');
    c.width = c.height = px;
    var ctx = c.getContext('2d');
    var pad = px * 0.14;
    var scale = (px - pad * 2) / 24;
    var p2;
    try { p2 = new Path2D(path); } catch (e) { return { width: px, height: px, data: new Uint8ClampedArray(px * px * 4) }; }
    ctx.save();
    ctx.translate(pad, pad);
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (opts.halo) {
      ctx.shadowColor = opts.halo;
      ctx.shadowBlur = 10;
    }
    ctx.strokeStyle = '#08060C';
    ctx.lineWidth = 3.6;
    ctx.stroke(p2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.fill(p2, 'evenodd');
    if (opts.ring) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 0.9;
      ctx.stroke(p2);
    }
    ctx.restore();
    return { width: px, height: px, data: ctx.getImageData(0, 0, px, px).data };
  }

  function registerIcons(cats) {
    cats.forEach(function (cat) {
      var key = 'blip-' + cat.id;
      if (map.hasImage(key)) map.removeImage(key);
      map.addImage(key, makeBlip(cat.color, cat.path, 30), { pixelRatio: 2 });
      var keyF = 'blipF-' + cat.id;
      if (map.hasImage(keyF)) map.removeImage(keyF);
      map.addImage(keyF, makeBlip(cat.color, cat.path, 40, { halo: 'rgba(0,0,0,0.6)' }), { pixelRatio: 2 });
    });
  }

  // ───────── data → GeoJSON ─────────
  function placesGeoJSON() {
    var hl = state.highlight;
    return {
      type: 'FeatureCollection',
      features: state.places
        .filter(function (p) { return !state.visible || state.visible.indexOf(p.cat) >= 0 || (hl && hl[p.id]); })
        .map(function (p) {
          var h = hl && hl[p.id];
          return {
            type: 'Feature',
            id: p.idx,
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: {
              id: p.id,
              name: p.name,
              icon: (p.featured || h ? 'blipF-' : 'blip-') + (h && h.icon ? h.icon : p.cat),
              featured: p.featured ? 1 : 0,
              dim: hl && !h ? 1 : 0,
              hl: h ? 1 : 0,
              hlColor: h ? h.color : '#FFFFFF',
              badge: h && h.badge ? h.badge : '',
              sel: state.selected === p.id ? 1 : 0,
              sort: h ? 3 : p.featured ? 2 : 1,
            },
          };
        }),
    };
  }

  function refresh() {
    var src = map.getSource('places');
    if (src) src.setData(placesGeoJSON());
  }

  function emptyFC() { return { type: 'FeatureCollection', features: [] }; }

  function addLayers() {
    map.addSource('places', { type: 'geojson', data: emptyFC() });
    map.addSource('route', { type: 'geojson', data: emptyFC() });
    map.addSource('stops', { type: 'geojson', data: emptyFC() });
    map.addSource('me', { type: 'geojson', data: emptyFC() });

    // Waypoint route
    map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['coalesce', ['get', 'color'], '#C64BFF'], 'line-width': 16, 'line-blur': 10, 'line-opacity': 0.55 } });
    map.addLayer({ id: 'route-core', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['coalesce', ['get', 'color'], '#C64BFF'], 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 15, 7] } });
    map.addLayer({ id: 'route-dash', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-opacity': 0.7, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 15, 2], 'line-dasharray': [0.5, 3] } });

    // Highlight pulse rings
    map.addLayer({ id: 'places-halo', type: 'circle', source: 'places', filter: ['==', ['get', 'hl'], 1],
      paint: { 'circle-color': ['get', 'hlColor'], 'circle-radius': 26, 'circle-opacity': 0.25, 'circle-blur': 0.6 } });
    map.addLayer({ id: 'places-sel', type: 'circle', source: 'places', filter: ['==', ['get', 'sel'], 1],
      paint: { 'circle-color': 'rgba(255,255,255,0.10)', 'circle-radius': 22, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2 } });

    map.addLayer({ id: 'places', type: 'symbol', source: 'places', filter: ['all', ['==', ['get', 'hl'], 0], ['==', ['get', 'featured'], 0]],
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 12, 0.9, 15, 1.05],
        'icon-allow-overlap': ['step', ['zoom'], false, 13, true],
        'icon-padding': 1,
        'symbol-sort-key': ['get', 'sort'],
        'text-field': ['step', ['zoom'],
          ['case',
            ['!=', ['get', 'badge'], ''], ['concat', ['get', 'name'], '\n', ['get', 'badge']],
            ['==', ['get', 'featured'], 1], ['get', 'name'],
            ''],
          13.5,
          ['case',
            ['!=', ['get', 'badge'], ''], ['concat', ['get', 'name'], '\n', ['get', 'badge']],
            ['get', 'name']]],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10.5, 15, 12.5],
        'text-letter-spacing': 0.02,
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-max-width': 9,
        'text-optional': true,
      },
      paint: {
        'icon-opacity': ['case', ['==', ['get', 'dim'], 1], 0.28, 1],
        'text-opacity': ['case', ['==', ['get', 'dim'], 1], 0, 1],
        'text-color': ['case', ['==', ['get', 'hl'], 1], ['get', 'hlColor'], '#FFFFFF'],
        'text-halo-color': 'rgba(8,6,12,0.9)',
        'text-halo-width': 1.6,
      } });

    map.addLayer({ id: 'places-top', type: 'symbol', source: 'places', filter: ['any', ['==', ['get', 'hl'], 1], ['==', ['get', 'featured'], 1]],
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 12, 0.9, 15, 1.05],
        'icon-allow-overlap': true,
        'symbol-sort-key': ['get', 'sort'],
        'text-field': ['step', ['zoom'],
          ['case',
            ['!=', ['get', 'badge'], ''], ['concat', ['get', 'name'], '\n', ['get', 'badge']],
            ['==', ['get', 'featured'], 1], ['get', 'name'],
            ''],
          13.5,
          ['case',
            ['!=', ['get', 'badge'], ''], ['concat', ['get', 'name'], '\n', ['get', 'badge']],
            ['get', 'name']]],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10.5, 15, 12.5],
        'text-letter-spacing': 0.02,
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-max-width': 9,
        'text-optional': true,
      },
      paint: {
        'icon-opacity': ['case', ['==', ['get', 'dim'], 1], 0.28, 1],
        'text-opacity': ['case', ['==', ['get', 'dim'], 1], 0, 1],
        'text-color': ['case', ['==', ['get', 'hl'], 1], ['get', 'hlColor'], '#FFFFFF'],
        'text-halo-color': 'rgba(8,6,12,0.9)',
        'text-halo-width': 1.6,
      } });

    // Mission stops (numbered)
    map.addLayer({ id: 'stops-ring', type: 'circle', source: 'stops',
      paint: { 'circle-color': ['get', 'color'], 'circle-radius': 12, 'circle-stroke-color': '#08060C', 'circle-stroke-width': 2.5 } });
    map.addLayer({ id: 'stops-num', type: 'symbol', source: 'stops',
      layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true, 'icon-allow-overlap': true },
      paint: { 'text-color': '#08060C' } });

    // Player position
    map.addLayer({ id: 'me-pulse', type: 'circle', source: 'me', paint: { 'circle-color': '#FFFFFF', 'circle-radius': 20, 'circle-opacity': 0.2 } });
    map.addLayer({ id: 'me-dot', type: 'circle', source: 'me',
      paint: { 'circle-color': '#FFFFFF', 'circle-radius': 7, 'circle-stroke-color': '#08060C', 'circle-stroke-width': 2.5 } });
  }

  function animate() {
    state.pulse = (state.pulse + 1) % 120;
    var t = state.pulse / 120;
    if (map.getLayer('places-halo')) {
      map.setPaintProperty('places-halo', 'circle-radius', 18 + 16 * t);
      map.setPaintProperty('places-halo', 'circle-opacity', 0.45 * (1 - t));
    }
    if (map.getLayer('me-pulse')) {
      map.setPaintProperty('me-pulse', 'circle-radius', 10 + 22 * t);
      map.setPaintProperty('me-pulse', 'circle-opacity', 0.35 * (1 - t));
    }
    setTimeout(function () { requestAnimationFrame(animate); }, 33);
  }

  // ───────── message handling ─────────
  function handle(msg) {
    if (!state.ready) { state.queue.push(msg); return; }
    switch (msg.type) {
      case 'init':
        registerIcons(msg.categories);
        state.places = msg.places.map(function (p, i) { p.idx = i + 1; return p; });
        refresh();
        break;
      case 'filter':
        state.visible = msg.visible;
        refresh();
        break;
      case 'highlight':
        state.highlight = msg.items;
        refresh();
        if (msg.fit && msg.items) fitTo(Object.keys(msg.items));
        break;
      case 'select':
        state.selected = msg.id;
        refresh();
        if (msg.id && msg.fly) {
          var p = state.places.find(function (x) { return x.id === msg.id; });
          if (p) map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), msg.zoom || 14.5), pitch: 50, speed: 1.4, offset: [0, -90] });
        }
        break;
      case 'flyTo':
        map.flyTo({ center: [msg.lng, msg.lat], zoom: msg.zoom || 14, pitch: msg.pitch == null ? map.getPitch() : msg.pitch, speed: 1.4 });
        break;
      case 'route':
        map.getSource('route').setData(msg.coords ? { type: 'Feature', properties: { color: msg.color || '#C64BFF' }, geometry: { type: 'LineString', coordinates: msg.coords } } : emptyFC());
        if (msg.coords && msg.fit) fitCoords(msg.coords);
        break;
      case 'stops':
        map.getSource('stops').setData({ type: 'FeatureCollection', features: (msg.stops || []).map(function (s, i) {
          return { type: 'Feature', properties: { n: String(i + 1), color: msg.color || '#FFD23F' }, geometry: { type: 'Point', coordinates: s } };
        }) });
        break;
      case 'me':
        map.getSource('me').setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [msg.lng, msg.lat] } });
        break;
      case 'tilt':
        map.easeTo({ pitch: msg.on ? 60 : 0, bearing: msg.on ? -20 : 0, duration: 800 });
        break;
      case 'drive':
        map.setPaintProperty('buildings', 'fill-extrusion-opacity', msg.on ? 0.28 : ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 0.92]);
        break;
      case 'follow':
        map.easeTo({ center: [msg.lng, msg.lat], zoom: msg.zoom || 16.3, pitch: 60, bearing: msg.bearing || map.getBearing(), duration: 900, offset: [0, 120] });
        break;
      case 'reset':
        map.flyTo({ center: DUBAI, zoom: 10.4, pitch: 0, bearing: 0, speed: 1.6 });
        break;
    }
  }

  function fitCoords(coords) {
    if (!coords.length) return;
    var b = new maplibregl.LngLatBounds(coords[0], coords[0]);
    coords.forEach(function (c) { b.extend(c); });
    map.fitBounds(b, { padding: { top: 140, bottom: 300, left: 50, right: 50 }, maxZoom: 15, duration: 900 });
  }
  function fitTo(ids) {
    fitCoords(state.places.filter(function (p) { return ids.indexOf(p.id) >= 0; }).map(function (p) { return [p.lng, p.lat]; }));
  }

  function onMessage(ev) {
    var data = ev.data;
    if (data && data.__neonIn) data = data.payload;
    if (typeof data !== 'string') return;
    try { handle(JSON.parse(data)); } catch (e) { /* ignore foreign messages */ }
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);
  window.NEON = { receive: function (s) { handle(typeof s === 'string' ? JSON.parse(s) : s); } };

  map.on('load', function () {
    addLayers();
    state.ready = true;
    var q = state.queue; state.queue = [];
    q.forEach(handle);
    animate();
    var at = document.querySelector('.maplibregl-ctrl-attrib');
    if (at) at.classList.remove('maplibregl-compact-show');
    send({ type: 'ready' });
  });

  map.on('click', function (e) {
    var pad = 14;
    var feats = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: ['places', 'places-top'] });
    var f = feats.filter(function (x) { return !x.properties.dim; })[0] || feats[0];
    if (f) send({ type: 'select', id: f.properties.id });
    else send({ type: 'mapTap' });
  });
  map.on('mouseenter', 'places', function () { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseenter', 'places-top', function () { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'places', function () { map.getCanvas().style.cursor = ''; });
  map.on('rotate', function () { send({ type: 'bearing', bearing: map.getBearing() }); });
})();
