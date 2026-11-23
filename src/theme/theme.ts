// Dubai Maps design tokens.
// Game pause-menu language: dark translucent panels, white-on-black type,
// selected rows invert to white, colour reserved for blips and the sunset brand mark.

export const APP_NAME = 'Dubai Maps';

export const colors = {
  ink: '#0A0810',
  panel: 'rgba(12, 10, 18, 0.94)',
  panelSolid: '#0E0C14',
  raised: '#1A1722',
  raisedHi: '#24202E',
  hairline: 'rgba(255, 255, 255, 0.09)',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.64)',
  textMute: 'rgba(255, 255, 255, 0.40)',
  // brand sunset
  sunset: ['#FFB347', '#FF6F61', '#F2387C', '#9B3FD1'] as const,
  pink: '#F2387C',
  orange: '#FF8A4C',
  yellow: '#FFC93C',
  cyan: '#2FD6E8',
  green: '#4CD964',
  waypoint: '#C64BFF',
  danger: '#FF4D4D',
};

export const fonts = {
  heading: 'BarlowCondensed_700Bold',
  headingItalic: 'BarlowCondensed_800ExtraBold_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const radius = { sm: 4, md: 10, lg: 16 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
