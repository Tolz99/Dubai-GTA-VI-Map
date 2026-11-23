import { Linking, Platform } from 'react-native';

export type NavApp = 'apple' | 'google' | 'waze';

export async function openNavigation(app: NavApp, lat: number, lng: number, name: string) {
  const q = encodeURIComponent(name);
  const urls: Record<NavApp, [string, string]> = {
    apple: [`maps://?daddr=${lat},${lng}&q=${q}&dirflg=d`, `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}&dirflg=d`],
    google: [
      `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    ],
    waze: [`waze://?ll=${lat},${lng}&navigate=yes`, `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`],
  };
  const [native, web] = urls[app];
  if (Platform.OS === 'web') {
    window.open(web, '_blank');
    return;
  }
  try {
    if (await Linking.canOpenURL(native)) {
      await Linking.openURL(native);
      return;
    }
  } catch {
    // fall back to web link
  }
  await Linking.openURL(web);
}
