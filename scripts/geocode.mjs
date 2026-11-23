// Checks every place's coordinates against OpenStreetMap Nominatim.
// Usage: node scripts/geocode.mjs > geocode-report.json
import fs from 'node:fs';
const files = ['src/data/malls.ts', 'src/data/places.ts'];
const items = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /id: '([^']+)', name: '((?:[^'\\]|\\.)+)'.*?area: '((?:[^'\\]|\\.)+)', lat: ([\d.]+), lng: ([\d.]+)/g;
  let m; while ((m = re.exec(src))) items.push({ file: f, id: m[1], name: m[2].replace(/\\u2019/g, "'").replace(/\\'/g, "'"), area: m[3], lat: +m[4], lng: +m[5] });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function dist(a, b, c, d) { const R = 6371, r = Math.PI / 180; const x = (d - b) * r * Math.cos(((a + c) / 2) * r), y = (c - a) * r; return Math.sqrt(x * x + y * y) * R; }
const out = [];
for (const it of items) {
  const q = `${it.name.replace(/\(.*?\)/g, '').replace(/—.*$/, '')}`.trim();
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ae&viewbox=54.85,25.40,56.20,24.70&bounded=1&q=${encodeURIComponent(q)}`;
  let res = [];
  try { res = await (await fetch(url, { headers: { 'User-Agent': 'neon-dxb-map-dev/0.1' } })).json(); } catch (e) {}
  const best = res.map((r) => ({ lat: +r.lat, lng: +r.lon, km: dist(it.lat, it.lng, +r.lat, +r.lon), name: r.display_name.slice(0, 80), type: `${r.class}/${r.type}` })).sort((a, b) => a.km - b.km)[0];
  out.push({ ...it, best });
  console.error(`${it.id.padEnd(24)} ${best ? best.km.toFixed(2).padStart(7) + ' km  ' + best.type + '  ' + best.name : '   --- not found'}`);
  await sleep(1100);
}
fs.writeFileSync(process.argv[2] || 'geocode-report.json', JSON.stringify(out, null, 1));
