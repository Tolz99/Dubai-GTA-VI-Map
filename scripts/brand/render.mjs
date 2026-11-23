// Renders the brand emblem to PNG assets with Chromium (Playwright).
// Usage: node scripts/brand/render.mjs [outDir]    (defaults to ./assets)
// Needs Playwright with Chromium installed (globally is fine).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { emblemSVG, sceneSVG, VB } from './emblem.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const out = path.resolve(process.argv[2] || path.join(root, 'assets'));
const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const font = (dir, file) =>
  'data:font/ttf;base64,' + fs.readFileSync(path.join(root, 'node_modules/@expo-google-fonts/barlow-condensed', dir, file)).toString('base64');
const FONTS = `
@font-face{font-family:BarlowBlack;src:url(${font('900Black', 'BarlowCondensed_900Black.ttf')})}
@font-face{font-family:BarlowItalic;src:url(${font('800ExtraBold_Italic', 'BarlowCondensed_800ExtraBold_Italic.ttf')})}`;

// Sunset sky backdrop for the square icon / splash (palms + skyline silhouettes at the bottom).
function iconSVG(size, { transparent = false, scale = 0.86, lift = 0 } = {}) {
  const w = 1000 * scale;
  const h = VB.h * scale;
  const x = (1000 - w) / 2;
  const y = (1000 - h) / 2 - VB.y * scale - lift;
  const inner = emblemSVG().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A0F3A"/><stop offset="0.55" stop-color="#3A1460"/><stop offset="1" stop-color="#14091F"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.55" r="0.55">
      <stop offset="0" stop-color="#F2387C" stop-opacity="0.55"/><stop offset="1" stop-color="#F2387C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${transparent ? '' : sceneSVG(1000) + '<rect width="1000" height="1000" fill="url(#bg)" opacity="0.35"/>'}
  <g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>
</svg>`;
}

const jobs = [
  // [file, svg, width, height, transparent]
  ['logo.png', emblemSVG({ width: 1000, height: VB.h }), 1000, VB.h, true],
  ['icon.png', iconSVG(1024, { scale: 0.96, lift: 90 }), 1024, 1024, false],
  ['splash-icon.png', iconSVG(1024, { transparent: true, scale: 0.9 }), 1024, 1024, true],
  ['android-icon-foreground.png', iconSVG(1024, { transparent: true, scale: 0.62 }), 1024, 1024, true],
  ['favicon.png', iconSVG(48, { scale: 0.96, lift: 90 }), 48, 48, false],
];

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
fs.mkdirSync(out, { recursive: true });
for (const [file, svg, w, h, transparent] of jobs) {
  // logo renders at 2x for crisp downscaling in the app
  const k = file === 'logo.png' ? 2 : 1;
  await page.setViewportSize({ width: w * k, height: h * k });
  const sized = svg.replace(/width="\d+" height="\d+"/, `width="${w * k}" height="${h * k}"`);
  await page.setContent(`<html><head><style>${FONTS}html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${sized}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(out, file), omitBackground: transparent, clip: { x: 0, y: 0, width: w * k, height: h * k } });
  console.log('wrote', file);
}
await browser.close();
