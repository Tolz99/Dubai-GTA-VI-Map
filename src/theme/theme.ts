// Original "Neon Gulf" palette — sunset pinks, cyan water, violet night.
// Inspired by retro-neon open-world game maps. Not affiliated with any game studio.

export const APP_NAME = 'NEON DXB';
export const APP_TAGLINE = 'DUBAI • MAP • MISSIONS';

export const colors = {
  ink: '#0B0618',
  panel: 'rgba(14, 8, 30, 0.94)',
  panelSolid: '#120A26',
  panelLight: '#1C1238',
  line: 'rgba(255, 255, 255, 0.10)',
  text: '#F6F1FF',
  textDim: '#A79BC9',
  textMute: '#6E6391',
  pink: '#FF3D8B',
  orange: '#FF8A3D',
  yellow: '#FFD23F',
  cyan: '#29E3FF',
  violet: '#B66DFF',
  waypoint: '#E040FB',
  sunset: ['#FFD23F', '#FF8A3D', '#FF3D8B', '#B66DFF'] as const,
};

export const fonts = {
  display: 'Anton_400Regular',
  body: 'Rajdhani_500Medium',
  bodyBold: 'Rajdhani_700Bold',
  bodySemi: 'Rajdhani_600SemiBold',
};
