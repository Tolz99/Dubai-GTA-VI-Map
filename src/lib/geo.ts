export type LngLat = [number, number];

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLng = (bLng - aLng) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function fmtKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function fmtMin(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export interface RouteResult {
  coords: LngLat[];
  distanceKm: number;
  durationSec: number;
  estimated: boolean;
}

/** Driving route via the public OSRM router; falls back to straight lines if offline. */
export async function fetchRoute(points: LngLat[]): Promise<RouteResult> {
  const path = points.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(';');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`,
      { signal: ctrl.signal },
    );
    clearTimeout(t);
    const json = await res.json();
    const r = json.routes?.[0];
    if (r) {
      return { coords: r.geometry.coordinates, distanceKm: r.distance / 1000, durationSec: r.duration, estimated: false };
    }
  } catch {
    // fall through
  }
  let km = 0;
  for (let i = 1; i < points.length; i++) km += distanceKm(points[i - 1][1], points[i - 1][0], points[i][1], points[i][0]);
  return { coords: points, distanceKm: km * 1.3, durationSec: ((km * 1.3) / 45) * 3600, estimated: true };
}
