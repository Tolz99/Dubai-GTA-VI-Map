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

export interface RouteStep {
  /** Human instruction, e.g. "Turn right onto Sheikh Zayed Road". */
  instruction: string;
  street: string;
  type: string;
  modifier?: string;
  exit?: number;
  /** Metres from this maneuver to the next one. */
  distance: number;
  duration: number;
  location: LngLat;
}

export interface RouteResult {
  coords: LngLat[];
  distanceKm: number;
  durationSec: number;
  estimated: boolean;
  steps: RouteStep[];
}

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

/** Turn an OSRM maneuver into a short spoken-style instruction. */
export function instructionFor(type: string, modifier: string | undefined, street: string, exit?: number): string {
  const onto = street ? ` onto ${street}` : '';
  const mod = modifier && modifier !== 'straight' ? modifier : '';
  switch (type) {
    case 'depart':
      return street ? `Head out on ${street}` : 'Head out';
    case 'arrive':
      return 'You have arrived';
    case 'roundabout':
    case 'rotary':
      return `At the roundabout, take the ${ORD[exit || 1] || `${exit}th`} exit${onto}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Exit the roundabout${onto}`;
    case 'on ramp':
      return `Take the ramp${mod ? ` on the ${mod.replace('slight ', '')}` : ''}${onto}`;
    case 'off ramp':
      return `Take the exit${mod ? ` on the ${mod.replace('slight ', '')}` : ''}${onto}`;
    case 'fork':
      return `Keep ${mod.replace('slight ', '') || 'straight'} at the fork${onto}`;
    case 'merge':
      return `Merge${mod ? ` ${mod.replace('slight ', '')}` : ''}${onto}`;
    case 'new name':
    case 'continue':
      return mod && mod !== 'straight' ? `Keep ${mod.replace('slight ', '')}${onto}` : `Continue${onto}`;
    default:
      if (modifier === 'uturn') return `Make a U-turn${onto}`;
      return mod ? `Turn ${mod}${onto}` : `Continue${onto}`;
  }
}

/** Driving route via the public OSRM router; falls back to straight lines if offline. */
export async function fetchRoute(points: LngLat[]): Promise<RouteResult> {
  const path = points.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(';');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=true`,
      { signal: ctrl.signal },
    );
    clearTimeout(t);
    const json = await res.json();
    const r = json.routes?.[0];
    if (r) {
      const steps: RouteStep[] = (r.legs || []).flatMap((leg: any) =>
        (leg.steps || []).map((st: any) => {
          const street = st.name || st.ref || '';
          return {
            instruction: instructionFor(st.maneuver.type, st.maneuver.modifier, street, st.maneuver.exit),
            street,
            type: st.maneuver.type,
            modifier: st.maneuver.modifier,
            exit: st.maneuver.exit,
            distance: st.distance,
            duration: st.duration,
            location: st.maneuver.location as LngLat,
          };
        }),
      );
      return { coords: r.geometry.coordinates, distanceKm: r.distance / 1000, durationSec: r.duration, estimated: false, steps };
    }
  } catch {
    // fall through
  }
  let km = 0;
  for (let i = 1; i < points.length; i++) km += distanceKm(points[i - 1][1], points[i - 1][0], points[i][1], points[i][0]);
  const last = points[points.length - 1];
  return {
    coords: points,
    distanceKm: km * 1.3,
    durationSec: ((km * 1.3) / 45) * 3600,
    estimated: true,
    steps: [
      { instruction: 'Head towards destination', street: '', type: 'depart', distance: km * 1300, duration: ((km * 1.3) / 45) * 3600, location: points[0] },
      { instruction: 'You have arrived', street: '', type: 'arrive', distance: 0, duration: 0, location: last },
    ],
  };
}
