// Dubai Maps brand emblem: giant "MAPS" letters filled with a Dubai sunset skyline,
// "DUBAI" across the middle. Original artwork: our own landmark silhouettes, Barlow Condensed (OFL).
// Exports SVG strings; scripts/brand/render.cjs turns them into the PNG assets.

const INK = '#160A26';

// ── landmark silhouettes (viewBox units; ground line at y = G) ──
function palm(x, g, h, lean, scale = 1) {
  const top = [x + lean, g - h];
  const trunk = `<path d="M${x} ${g} Q${x + lean * 0.15} ${g - h * 0.55} ${top[0]} ${top[1]}" fill="none" stroke="currentColor" stroke-width="${9 * scale}" stroke-linecap="round"/>`;
  const leaves = [-160, -128, -95, -60, -25, 12, 40].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const L = (i % 2 ? 62 : 74) * scale;
    const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L + (Math.abs(Math.cos(a)) * L * 0.45)];
    const mid = [(top[0] + tip[0]) / 2, (top[1] + tip[1]) / 2 - 14 * scale];
    const nx = -(tip[1] - top[1]) / L, ny = (tip[0] - top[0]) / L;
    const w = 11 * scale;
    return `<path d="M${top[0]} ${top[1]} Q${mid[0] + nx * w} ${mid[1] + ny * w} ${tip[0]} ${tip[1]} Q${mid[0] - nx * w * 0.4} ${mid[1] - ny * w * 0.4} ${top[0]} ${top[1]}Z"/>`;
  });
  return trunk + leaves.join('');
}

function skyline(G) {
  // Background city band (deterministic pseudo-random blocks)
  let s = 7, band = '';
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let x = 0; x < 1000; ) {
    const w = 14 + rnd() * 26, h = 18 + rnd() * 70;
    band += `<rect x="${x.toFixed(1)}" y="${(G - h).toFixed(1)}" width="${(w - 3).toFixed(1)}" height="${h.toFixed(1)}"/>`;
    x += w;
  }
  const burjKhalifa = `<path d="M352 ${G}V420h10v-60h10v-60h8v-55h6v-55h4l1-70 1-25 1 25 1 70h4v55h6v55h8v60h10v60h10V${G}Z"/>`;
  const emiratesTowers = `<path d="M452 ${G}V262l26-22V${G}Z M484 ${G}V284l22-18V${G}Z"/>`;
  const frame = `<path fill-rule="evenodd" d="M566 ${G}V292h92V${G}Z M582 ${G}V310h60V${G}Z"/>`;
  const museumFuture = `<path fill-rule="evenodd" d="M664 ${G}a58 66 0 1 1 116 0Z M694 ${G - 8}a28 40 0 1 1 56 0Z"/>`;
  const burjAlArab = `<path d="M930 ${G}V214l7-12 3 12V${G}Z M924 232C872 292 842 400 846 ${G}H924Z"/><circle cx="903" cy="300" r="13"/>`;
  // Ain Dubai: ring, spokes and A-frame legs
  const cx = 150, cy = 345, R = 108;
  let spokes = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    spokes += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy + Math.sin(a) * R).toFixed(1)}" stroke="currentColor" stroke-width="3"/>`;
  }
  const ainDubai = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" stroke-width="11"/>${spokes}<circle cx="${cx}" cy="${cy}" r="14"/><path d="M${cx - 6} ${cy}L${cx - 70} ${G}h16L${cx} ${cy + 20}Z M${cx + 6} ${cy}L${cx + 70} ${G}h-16L${cx} ${cy + 20}Z"/>`;
  const palms = palm(36, G, 215, -14, 1.05) + palm(262, G, 170, 12, 0.85) + palm(535, G, 135, -8, 0.7) + palm(796, G, 190, 10, 0.95) + palm(985, G, 150, -10, 0.8);
  return { band, landmarks: burjKhalifa + emiratesTowers + frame + museumFuture + burjAlArab + ainDubai + palms };
}

/**
 * @param {object} o
 * @param {boolean} [o.withDubai] draw the DUBAI wordmark
 */
/** Full-bleed sunset skyline scene for square art (icon). Ground line at y = ground. */
export function sceneSVG(ground = 1000) {
  const G = 505;
  const { band, landmarks } = skyline(G);
  const dy = ground - G;
  return `<defs>
    <linearGradient id="skyFull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2A1F7A"/><stop offset="0.35" stop-color="#7E31C2"/>
      <stop offset="0.62" stop-color="#E5388C"/><stop offset="0.85" stop-color="#FF7D47"/><stop offset="1" stop-color="#FFC45E"/>
    </linearGradient>
    <radialGradient id="sunFull" cx="500" cy="${ground - 60}" r="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFE9A6" stop-opacity="0.9"/><stop offset="0.5" stop-color="#FFC86B" stop-opacity="0.35"/><stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="${ground}" fill="url(#skyFull)"/>
  <circle cx="500" cy="${ground - 60}" r="420" fill="url(#sunFull)"/>
  <g transform="translate(0 ${dy})">
    <g fill="#B52A7A" opacity="0.4">${band}</g>
    <g fill="#3A0D50" color="#3A0D50" opacity="0.8">${landmarks}</g>
  </g>`;
}

/** Visible box of the emblem (letters + outline), in viewBox units. */
export const VB = { y: 92, h: 446 };

export function emblemSVG({ withDubai = true, width = 1000, height = VB.h } = {}) {
  const G = 505; // baseline of MAPS = ground line of the skyline
  const { band, landmarks } = skyline(G);
  const maps = (attrs) => `<text x="500" y="${G}" text-anchor="middle" textLength="950" lengthAdjust="spacingAndGlyphs" font-family="BarlowBlack" font-size="560" ${attrs}>MAPS</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${VB.y} 1000 ${VB.h}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="sky" x1="0" y1="110" x2="0" y2="${G}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3B2AA0"/>
      <stop offset="0.28" stop-color="#8F35CB"/>
      <stop offset="0.58" stop-color="#EC3A8C"/>
      <stop offset="0.82" stop-color="#FF7D47"/>
      <stop offset="1" stop-color="#FFC45E"/>
    </linearGradient>
    <radialGradient id="sun" cx="500" cy="${G - 40}" r="230" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFE9A6" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="#FFC86B" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="letters">${maps('')}</clipPath>
  </defs>

  <!-- drop + outline -->
  <g transform="translate(6 10)">${maps(`fill="${INK}" stroke="${INK}" stroke-width="26" stroke-linejoin="round"`)}</g>
  ${maps(`fill="${INK}" stroke="${INK}" stroke-width="26" stroke-linejoin="round"`)}

  <!-- sunset sky + skyline inside the letters -->
  <g clip-path="url(#letters)">
    <rect x="0" y="0" width="1000" height="540" fill="url(#sky)"/>
    <circle cx="500" cy="${G - 40}" r="230" fill="url(#sun)"/>
    <g fill="#B52A7A" opacity="0.35">${band}</g>
    <g fill="#46105F" color="#46105F" opacity="0.7">${landmarks}</g>
    ${maps('fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="6"')}
  </g>

  ${
    withDubai
      ? `<!-- DUBAI wordmark -->
  <g font-family="BarlowItalic" font-size="214" text-anchor="middle" letter-spacing="6">
    <text x="506" y="408" fill="${INK}" stroke="${INK}" stroke-width="22" stroke-linejoin="round">DUBAI</text>
    <text x="500" y="400" fill="#FFFFFF" stroke="${INK}" stroke-width="16" stroke-linejoin="round" paint-order="stroke">DUBAI</text>
  </g>`
      : ''
  }
</svg>`;
}
