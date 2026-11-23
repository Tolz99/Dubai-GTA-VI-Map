/* global maplibregl, neonStyle */
// Map engine running inside the WebView (iOS/Android) or an iframe (web preview).
// Talks to React Native through a tiny JSON message bridge (single messages or batches).
//
// Performance notes:
// - Place data is uploaded once. Category filters re-upload only the clustered base source;
//   selection and highlights live in their own tiny sources, so a tap never touches the 200+ blips.
// - Nothing animates through setPaintProperty: pulses are CSS animations on DOM markers,
//   so an idle map renders zero frames.
// - Drive mode moves the camera and the player marker together every frame (jumpTo),
//   interpolating between GPS fixes instead of hopping.
(function () {
  var DUBAI = [55.245, 25.155];
  var INK = '#08060C';
  var state = {
    places: [], byId: {}, visible: null, favs: [], savedOnly: false,
    highlight: null, hlMarkers: [], selected: null, ready: false, queue: [],
    drive: false, me: null, meMarker: null, anim: null, lastFix: 0,
  };

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
    maxPitch: 76,
    pitch: 0,
    maxBounds: [[54.6, 24.45], [56.45, 25.6]],
    attributionControl: { compact: true },
    renderWorldCopies: false,
    fadeDuration: 120,
  });
  window.__map = map;

  // ───────── blip tiles drawn from SVG paths ─────────
  // Rounded-square tile in the category colour, dark glyph, thick dark outline.
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function makeBlip(color, path, size, opts) {
    opts = opts || {};
    var ratio = 2;
    var px = Math.round(size * ratio);
    var c = document.createElement('canvas');
    c.width = c.height = px;
    var ctx = c.getContext('2d');
    var m = px * 0.08; // margin for outline / ring
    var s = px - m * 2;
    if (opts.ring) {
      roundRect(ctx, m * 0.2, m * 0.2, px - m * 0.4, px - m * 0.4, s * 0.3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
    roundRect(ctx, m, m, s, s, s * 0.26);
    ctx.fillStyle = INK;
    ctx.fill();
    var b = s * 0.085;
    roundRect(ctx, m + b, m + b, s - 2 * b, s - 2 * b, s * 0.2);
    ctx.fillStyle = color;
    ctx.fill();
    try {
      var p2 = new Path2D(path);
      var g = s * 0.62;
      ctx.save();
      ctx.translate(m + (s - g) / 2, m + (s - g) / 2);
      ctx.scale(g / 24, g / 24);
      ctx.fillStyle = INK;
      ctx.fill(p2, 'evenodd');
      ctx.restore();
    } catch (e) { /* bad path: plain tile */ }
    return { width: px, height: px, data: ctx.getImageData(0, 0, px, px).data };
  }

  // Procedural window façades for towers: dark glass grid with a scatter of warm lit windows.
  // Seeded so every app start draws the same city.
  function makeFacade(glass, frame, litRatio, seed) {
    var px = 64; // 8 x 8 window cells, 2x for retina
    var c = document.createElement('canvas');
    c.width = c.height = px;
    var ctx = c.getContext('2d');
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, px, px);
    var s = seed;
    function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    var cell = 8;
    for (var y = 0; y < px; y += cell) {
      for (var x = 0; x < px; x += cell) {
        var r = rnd();
        var lit = r < litRatio;
        ctx.fillStyle = lit ? (r < litRatio * 0.35 ? '#FFE6A8' : r < litRatio * 0.7 ? '#F6C978' : '#BFD8FF') : glass;
        ctx.globalAlpha = lit ? 0.75 + rnd() * 0.25 : 1;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 3);
        ctx.globalAlpha = 1;
      }
    }
    // faint horizontal floor-plate lines
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var yy = cell - 1; yy < px; yy += cell) ctx.fillRect(0, yy, px, 1);
    return { width: px, height: px, data: ctx.getImageData(0, 0, px, px).data };
  }
  function registerFacades() {
    [['facade-low', '#3A3040', '#2E2733', 0.12, 5], ['facade-mid', '#2C3350', '#23243A', 0.18, 11], ['facade-high', '#33406A', '#262A44', 0.22, 23], ['facade-super', '#4A3F7A', '#2C2440', 0.28, 37]].forEach(function (f) {
      if (!map.hasImage(f[0])) map.addImage(f[0], makeFacade(f[1], f[2], f[3], f[4]), { pixelRatio: 2 });
    });
  }

  function registerIcons(cats) {
    cats.forEach(function (cat) {
      [['blip-', 26, {}], ['blipF-', 34, { ring: true }]].forEach(function (v) {
        var key = v[0] + cat.id;
        if (map.hasImage(key)) map.removeImage(key);
        map.addImage(key, makeBlip(cat.color, cat.path, v[1], v[2]), { pixelRatio: 2 });
      });
    });
  }

  // ───────── data → GeoJSON ─────────
  function feature(p, props) {
    return { type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: props };
  }
  function isShown(p) {
    if (state.savedOnly) return state.favs.indexOf(p.id) >= 0;
    return !state.visible || state.visible.indexOf(p.cat) >= 0;
  }
  function baseData(featured) {
    return {
      type: 'FeatureCollection',
      features: state.places
        .filter(function (p) { return !!p.featured === featured && isShown(p); })
        .map(function (p) {
          return feature(p, { id: p.id, name: p.name, icon: (featured ? 'blipF-' : 'blip-') + p.cat, fav: state.favs.indexOf(p.id) >= 0 ? 1 : 0 });
        }),
    };
  }
  function refreshBase() {
    map.getSource('places').setData(baseData(false));
    map.getSource('featured').setData(baseData(true));
  }
  function emptyFC() { return { type: 'FeatureCollection', features: [] }; }

  var LABEL_LAYOUT = {
    'text-font': ['Noto Sans Bold'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10.5, 15, 12.5],
    'text-letter-spacing': 0.02,
    'text-offset': [0, 1.3],
    'text-anchor': 'top',
    'text-max-width': 9,
    'text-optional': true,
  };
  var LABEL_PAINT = { 'text-color': '#FFFFFF', 'text-halo-color': 'rgba(8,6,12,0.92)', 'text-halo-width': 1.6 };
  var ICON_SIZE = ['interpolate', ['linear'], ['zoom'], 9, 0.72, 12, 0.9, 15, 1.05];

  // Far-zoom skyline from the bundled tower list (tiles carry heights only from z14).
  function skylineData() {
    var raw = window.__SKYLINE || [];
    return {
      type: 'FeatureCollection',
      features: raw.map(function (t) {
        var x = t[2], y = t[3], ring = [[x / 1e5, y / 1e5]];
        for (var i = 4; i < t.length; i += 2) { x += t[i]; y += t[i + 1]; ring.push([x / 1e5, y / 1e5]); }
        ring.push(ring[0]);
        return { type: 'Feature', properties: { h: t[0], b: t[1] }, geometry: { type: 'Polygon', coordinates: [ring] } };
      }),
    };
  }

  function addLayers() {
    map.addSource('skyline', { type: 'geojson', data: skylineData(), buffer: 16, tolerance: 0.5 });
    map.addLayer({ id: 'skyline', type: 'fill-extrusion', source: 'skyline', minzoom: 10, maxzoom: 14,
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'h'], 100, '#3F4A72', 180, '#55508A', 300, '#8A4C8E', 500, '#D8467F'],
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 10, ['*', ['get', 'h'], 0.4], 11.5, ['get', 'h']],
        'fill-extrusion-base': ['get', 'b'],
        'fill-extrusion-opacity': 0.95,
        'fill-extrusion-vertical-gradient': true,
      } }, 'buildings');

    map.addSource('places', { type: 'geojson', data: emptyFC(), cluster: true, clusterMaxZoom: 11, clusterRadius: 38 });
    map.addSource('featured', { type: 'geojson', data: emptyFC() });
    map.addSource('hl', { type: 'geojson', data: emptyFC() });
    map.addSource('sel', { type: 'geojson', data: emptyFC() });
    map.addSource('route', { type: 'geojson', data: emptyFC() });
    map.addSource('stops', { type: 'geojson', data: emptyFC() });

    // Waypoint route
    map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['coalesce', ['get', 'color'], '#C64BFF'], 'line-width': 16, 'line-blur': 10, 'line-opacity': 0.5 } });
    map.addLayer({ id: 'route-core', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['coalesce', ['get', 'color'], '#C64BFF'], 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 15, 7, 18, 14] } });
    map.addLayer({ id: 'route-dash', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-opacity': 0.7, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 15, 2], 'line-dasharray': [0.5, 3] } });

    // Clusters (low zoom): dark disc with a count
    map.addLayer({ id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'],
      paint: {
        'circle-color': 'rgba(14,12,20,0.92)',
        'circle-radius': ['step', ['get', 'point_count'], 13, 8, 16, 20, 19],
        'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 1.6,
      } });
    map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'places', filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
      paint: { 'text-color': '#FFFFFF' } });

    // Regular blips: label from z13.5
    map.addLayer({ id: 'places', type: 'symbol', source: 'places', filter: ['!', ['has', 'point_count']],
      layout: Object.assign({
        'icon-image': ['get', 'icon'], 'icon-size': ICON_SIZE,
        'icon-allow-overlap': ['step', ['zoom'], false, 13, true], 'icon-padding': 1,
        'text-field': ['step', ['zoom'], '', 13.5, ['get', 'name']],
      }, LABEL_LAYOUT),
      paint: Object.assign({ 'icon-opacity': 1, 'text-opacity': 1 }, LABEL_PAINT) });

    // Featured blips: bigger, white ring, always win collisions, labelled from z11.5
    map.addLayer({ id: 'featured', type: 'symbol', source: 'featured',
      layout: Object.assign({
        'icon-image': ['get', 'icon'], 'icon-size': ICON_SIZE, 'icon-allow-overlap': true,
        'text-field': ['step', ['zoom'], '', 11.5, ['get', 'name']],
      }, LABEL_LAYOUT),
      paint: Object.assign({ 'icon-opacity': 1, 'text-opacity': 1 }, LABEL_PAINT) });

    // Favourite marker: small heart-coloured dot on the tile corner
    ['places', 'featured'].forEach(function (src) {
      map.addLayer({ id: src + '-fav', type: 'circle', source: src, filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'fav'], 1]],
        paint: { 'circle-color': '#FF4D7A', 'circle-radius': 4, 'circle-stroke-color': INK, 'circle-stroke-width': 1.5, 'circle-translate': [10, -10] } });
    });

    // Highlighted blips (brand / shopping / mission focus) with badges
    map.addLayer({ id: 'hl', type: 'symbol', source: 'hl',
      layout: Object.assign({
        'icon-image': ['get', 'icon'], 'icon-size': ICON_SIZE, 'icon-allow-overlap': true, 'symbol-sort-key': ['get', 'sort'],
        'text-field': ['case', ['!=', ['get', 'badge'], ''], ['concat', ['get', 'name'], '\n', ['get', 'badge']], ['get', 'name']],
      }, LABEL_LAYOUT),
      paint: Object.assign({}, LABEL_PAINT, { 'text-color': ['get', 'color'] }) });

    // Selection ring
    map.addLayer({ id: 'sel-ring', type: 'circle', source: 'sel',
      paint: { 'circle-color': 'rgba(255,255,255,0.12)', 'circle-radius': 24, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2.5 } }, 'featured');

    // Mission stops (numbered)
    map.addLayer({ id: 'stops-ring', type: 'circle', source: 'stops',
      paint: { 'circle-color': ['get', 'color'], 'circle-radius': 12, 'circle-stroke-color': INK, 'circle-stroke-width': 2.5 } });
    map.addLayer({ id: 'stops-num', type: 'symbol', source: 'stops',
      layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true },
      paint: { 'text-color': INK } });
  }

  // Dim the base blips while something is highlighted.
  function applyDim() {
    var on = !!state.highlight;
    var ids = on ? Object.keys(state.highlight) : [];
    var notHl = ['!', ['in', ['get', 'id'], ['literal', ids]]];
    ['places', 'featured'].forEach(function (l) {
      map.setPaintProperty(l, 'icon-opacity', on ? 0.28 : 1);
      map.setPaintProperty(l, 'text-opacity', on ? 0 : 1);
      map.setFilter(l, l === 'places' ? ['all', ['!', ['has', 'point_count']], notHl] : notHl);
    });
    map.setPaintProperty('clusters', 'circle-opacity', on ? 0.3 : 1);
    map.setPaintProperty('clusters', 'circle-stroke-opacity', on ? 0.3 : 1);
    map.setPaintProperty('cluster-count', 'text-opacity', on ? 0.3 : 1);
  }

  function setHighlight(items) {
    state.highlight = items && Object.keys(items).length ? items : null;
    state.hlMarkers.forEach(function (m) { m.remove(); });
    state.hlMarkers = [];
    var feats = [];
    if (state.highlight) {
      Object.keys(state.highlight).forEach(function (id) {
        var p = state.byId[id];
        if (!p) return;
        var h = state.highlight[id];
        feats.push(feature(p, { id: id, name: p.name, icon: 'blipF-' + (h.icon || p.cat), color: h.color, badge: h.badge || '', sort: 1 }));
        var el = document.createElement('div');
        el.className = 'pulse';
        el.style.setProperty('--c', h.color);
        state.hlMarkers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map));
      });
    }
    map.getSource('hl').setData({ type: 'FeatureCollection', features: feats });
    applyDim();
  }

  // ───────── player marker (DOM, CSS pulse, heading cone) ─────────
  function ensureMe() {
    if (state.meMarker) return state.meMarker;
    var el = document.createElement('div');
    el.className = 'me';
    el.innerHTML = '<div class="me-cone"></div><div class="me-ring"></div><div class="me-dot"></div>';
    state.meMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'viewport' });
    return state.meMarker;
  }
  function setMe(lng, lat, heading) {
    var m = ensureMe();
    m.setLngLat([lng, lat]);
    if (!state.meAdded) { m.addTo(map); state.meAdded = true; }
    var el = m.getElement();
    if (heading != null && !isNaN(heading)) {
      el.classList.add('has-heading');
      m.setRotation(heading);
    }
    state.me = { lng: lng, lat: lat, heading: heading };
  }

  function lerpAngle(a, b, t) {
    var d = ((b - a + 540) % 360) - 180;
    return a + d * t;
  }
  function bearingBetween(a, b) {
    var r = Math.PI / 180;
    var y = Math.sin((b[0] - a[0]) * r) * Math.cos(b[1] * r);
    var x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos((b[0] - a[0]) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  }

  // Drive follow-camera: glide from the last fix to the new one over roughly the fix interval.
  function follow(msg) {
    var now = performance.now();
    var from = state.me ? [state.me.lng, state.me.lat] : [msg.lng, msg.lat];
    var to = [msg.lng, msg.lat];
    var moved = Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1]) > 0.00002;
    var targetBearing = msg.bearing != null ? msg.bearing : moved ? bearingBetween(from, to) : map.getBearing();
    var dur = state.lastFix ? Math.max(350, Math.min(1600, now - state.lastFix)) : 700;
    state.lastFix = now;
    var startBearing = map.getBearing();
    var startZoom = map.getZoom();
    var startPitch = map.getPitch();
    var zoom = msg.zoom || 16.6;
    if (state.anim) cancelAnimationFrame(state.anim);
    var t0 = now;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = state.firstFollow ? k * (2 - k) : k; // ease-out on the first move, linear while gliding
      var pos = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e];
      var br = lerpAngle(startBearing, targetBearing, Math.min(1, e * 1.4));
      setMe(pos[0], pos[1], br);
      map.jumpTo({ center: pos, bearing: br, zoom: startZoom + (zoom - startZoom) * e, pitch: startPitch + (62 - startPitch) * e });
      if (k < 1) state.anim = requestAnimationFrame(step);
      else { state.anim = null; state.firstFollow = false; }
    }
    state.anim = requestAnimationFrame(step);
  }

  function setDrive(on) {
    state.drive = on;
    state.firstFollow = on;
    state.lastFix = 0;
    if (!on && state.anim) { cancelAnimationFrame(state.anim); state.anim = null; }
    map.setPadding(on ? { top: Math.round(window.innerHeight * 0.42), bottom: 0, left: 0, right: 0 } : { top: 0, bottom: 0, left: 0, right: 0 });
    // Fade towers while driving so the route and the car stay visible.
    map.setPaintProperty('buildings', 'fill-extrusion-opacity', on ? 0.45 : 0.96);
    map.setPaintProperty('skyline', 'fill-extrusion-opacity', on ? 0.4 : 0.95);
    map.setPaintProperty('buildings-low', 'fill-extrusion-opacity', on ? 0.45 : 0.96);
    map.setPaintProperty('buildings-tall', 'fill-extrusion-opacity', on ? 0.4 : 0.97);
    map.setPaintProperty('buildings-facade', 'fill-extrusion-opacity', on ? 0.45 : 1);
    document.body.classList.toggle('drive', on);
  }

  // ───────── message handling ─────────
  function handle(msg) {
    if (Array.isArray(msg)) { msg.forEach(handle); return; }
    if (!state.ready) { state.queue.push(msg); return; }
    switch (msg.type) {
      case 'init':
        registerIcons(msg.categories);
        state.places = msg.places;
        state.byId = {};
        msg.places.forEach(function (p) { state.byId[p.id] = p; });
        refreshBase();
        break;
      case 'filter':
        state.visible = msg.visible;
        if (msg.favs) state.favs = msg.favs;
        state.savedOnly = !!msg.savedOnly;
        refreshBase();
        break;
      case 'highlight':
        setHighlight(msg.items);
        if (msg.fit && state.highlight) fitTo(Object.keys(state.highlight));
        break;
      case 'select': {
        state.selected = msg.id;
        var p = msg.id && state.byId[msg.id];
        map.getSource('sel').setData(p ? feature(p, {}) : emptyFC());
        if (p && msg.fly) {
          var h = window.innerHeight;
          map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), msg.zoom || 14.5), pitch: 45, speed: 1.5, curve: 1.3, offset: [0, -Math.round(h * 0.2)], essential: true });
        }
        break;
      }
      case 'flyTo':
        map.flyTo({ center: [msg.lng, msg.lat], zoom: msg.zoom || 14, pitch: msg.pitch == null ? map.getPitch() : msg.pitch, speed: 1.5, essential: true });
        break;
      case 'zoom':
        map.easeTo({ zoom: map.getZoom() + msg.delta, duration: 260 });
        break;
      case 'north':
        map.easeTo({ bearing: 0, duration: 400 });
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
        if (!state.drive) setMe(msg.lng, msg.lat, msg.heading);
        break;
      case 'tilt':
        // 3D: swing into a low, cinematic angle and zoom close enough for façades to appear.
        if (msg.on) map.easeTo({ pitch: 68, bearing: map.getBearing() || -28, zoom: Math.max(map.getZoom(), 15.2), duration: 1100, easing: easeInOut });
        else map.easeTo({ pitch: 0, bearing: 0, duration: 800, easing: easeInOut });
        break;
      case 'drive':
        setDrive(!!msg.on);
        break;
      case 'follow':
        follow(msg);
        break;
      case 'reset':
        map.flyTo({ center: DUBAI, zoom: 10.4, pitch: 0, bearing: 0, speed: 1.6 });
        break;
    }
  }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function fitCoords(coords) {
    if (!coords.length) return;
    var b = new maplibregl.LngLatBounds(coords[0], coords[0]);
    coords.forEach(function (c) { b.extend(c); });
    map.fitBounds(b, { padding: { top: 140, bottom: 300, left: 50, right: 50 }, maxZoom: 15, duration: 900 });
  }
  function fitTo(ids) {
    fitCoords(ids.map(function (id) { return state.byId[id]; }).filter(Boolean).map(function (p) { return [p.lng, p.lat]; }));
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

  map.on('styleimagemissing', function (e) { if (e.id.indexOf('facade-') === 0) registerFacades(); });
  map.on('load', function () {
    registerFacades();
    addLayers();
    state.ready = true;
    var q = state.queue; state.queue = [];
    q.forEach(handle);
    var at = document.querySelector('.maplibregl-ctrl-attrib');
    if (at) at.classList.remove('maplibregl-compact-show');
    send({ type: 'ready' });
  });
  // First frame with tiles drawn: lets the app fade its cover away.
  map.once('idle', function () { send({ type: 'idle' }); });

  var TAP_LAYERS = ['hl', 'featured', 'places', 'clusters'];
  map.on('click', function (e) {
    var pad = 16;
    var feats = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: TAP_LAYERS });
    if (!feats.length) { send({ type: 'mapTap' }); return; }
    // Prefer highlighted, then featured, then the closest regular blip.
    var order = { hl: 0, featured: 1, places: 2, clusters: 3 };
    feats.sort(function (a, b) { return order[a.layer.id] - order[b.layer.id]; });
    var f = feats[0];
    if (f.layer.id === 'clusters') {
      map.getSource('places').getClusterExpansionZoom(f.properties.cluster_id).then(function (z) {
        map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.3, duration: 450 });
      });
      return;
    }
    send({ type: 'select', id: f.properties.id });
  });
  TAP_LAYERS.forEach(function (l) {
    map.on('mouseenter', l, function () { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', l, function () { map.getCanvas().style.cursor = ''; });
  });
  // Bearing is only reported when it settles (drives the compass button), never per frame.
  var lastBearing = 0;
  map.on('moveend', function () {
    var b = Math.round(map.getBearing());
    if (b !== lastBearing) { lastBearing = b; send({ type: 'bearing', bearing: b }); }
  });
  map.on('dragstart', function () { if (!state.drive) send({ type: 'userPan' }); });
})();
