// Extracts Dubai's towers (render_height >= MIN_H) from OpenFreeMap z14 vector tiles into a small
// GeoJSON (src/map/web/skyline.json). The tiles only carry building heights from z14, so this
// file is what lets the 3D skyline show from far away (z10–14).
// Re-run occasionally:  NODE_USE_ENV_PROXY=1 node scripts/build-skyline.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { VectorTile } = require('@mapbox/vector-tile');
const Pbf = require('pbf');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const Z = 14;
const MIN_H = 100;
// Urban Dubai: Jebel Ali/Marina → Deira/Festival City
const BBOX = [54.98, 24.98, 55.45, 25.33];

const lon2x = (lon) => Math.floor(((lon + 180) / 360) * 2 ** Z);
const lat2y = (lat) => Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z);

const tj = await (await fetch('https://tiles.openfreemap.org/planet')).json();
const url = tj.tiles[0];
const jobs = [];
for (let x = lon2x(BBOX[0]); x <= lon2x(BBOX[2]); x++) for (let y = lat2y(BBOX[3]); y <= lat2y(BBOX[1]); y++) jobs.push([x, y]);
console.log(`${jobs.length} tiles`);

const seen = new Set();
const features = [];
const r5 = (n) => Math.round(n * 1e5) / 1e5;
async function work() {
  while (jobs.length) {
    const [x, y] = jobs.shift();
    let buf;
    for (let tries = 0; tries < 3 && !buf; tries++) {
      try {
        const res = await fetch(url.replace('{z}', Z).replace('{x}', x).replace('{y}', y));
        if (res.status === 204 || res.status === 404) break;
        buf = new Uint8Array(await res.arrayBuffer());
      } catch {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    if (!buf) continue;
    const layer = new VectorTile(new Pbf(buf)).layers.building;
    if (!layer) continue;
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const h = f.properties.render_height;
      if (!(h >= MIN_H)) continue;
      const g = f.toGeoJSON(x, y, Z).geometry;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const poly of polys) {
        const ring = poly[0].map(([a, b]) => [r5(a), r5(b)]);
        const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
        const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
        const key = `${cx.toFixed(4)},${cy.toFixed(4)},${h}`;
        if (seen.has(key)) continue;
        seen.add(key);
        features.push({ type: 'Feature', properties: { h, b: f.properties.render_min_height || 0 }, geometry: { type: 'Polygon', coordinates: [ring] } });
      }
    }
  }
}
await Promise.all([work(), work(), work(), work()]);
features.sort((a, b) => a.properties.h - b.properties.h);
// Compact encoding: [height, base, x0, y0, dx1, dy1, ...] with coords as integers of 1e-5 degrees,
// delta-encoded, closing point dropped. map.js decodes it back to GeoJSON.
const towers = features.map((f) => {
  const ring = f.geometry.coordinates[0].slice(0, -1).map(([a, b]) => [Math.round(a * 1e5), Math.round(b * 1e5)]);
  const out = [Math.round(f.properties.h), Math.round(f.properties.b), ring[0][0], ring[0][1]];
  for (let i = 1; i < ring.length; i++) {
    const dx = ring[i][0] - ring[i - 1][0];
    const dy = ring[i][1] - ring[i - 1][1];
    if (dx || dy) out.push(dx, dy);
  }
  return out;
});
const json = JSON.stringify(towers);
fs.writeFileSync(path.join(root, 'src/map/web/skyline.json'), json);
console.log(`${towers.length} tower parts, ${(json.length / 1024).toFixed(0)} KB, tallest ${features.at(-1)?.properties.h} m`);
