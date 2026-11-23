import { distanceKm, type LngLat, type RouteResult, type RouteStep } from './geo';

/**
 * Turn-by-turn progress tracking. Pure functions so the same engine can drive
 * the phone HUD and (later) a CarPlay navigation session.
 */
export interface Guidance {
  stepIndex: number;
  /** Metres to the upcoming maneuver. */
  toNext: number;
  /** Metres left on the whole route. */
  remaining: number;
  /** Seconds left (scaled from the route's own duration). */
  remainingSec: number;
  current: RouteStep;
  next?: RouteStep;
  arrived: boolean;
}

const ADVANCE_M = 30;
const ARRIVE_M = 40;

const m = (a: LngLat, lat: number, lng: number) => distanceKm(a[1], a[0], lat, lng) * 1000;

export function startGuidance(route: RouteResult): Guidance {
  // step[0] is "depart"; the first real maneuver is step[1].
  const idx = Math.min(1, route.steps.length - 1);
  const remaining = route.distanceKm * 1000;
  return { stepIndex: idx, toNext: route.steps[0]?.distance ?? remaining, remaining, remainingSec: route.durationSec, current: route.steps[idx], next: route.steps[idx + 1], arrived: false };
}

export function updateGuidance(route: RouteResult, g: Guidance, lat: number, lng: number): Guidance {
  const steps = route.steps;
  let idx = g.stepIndex;
  // Advance past any maneuvers we've reached.
  while (idx < steps.length - 1 && m(steps[idx].location, lat, lng) < ADVANCE_M) idx++;
  const cur = steps[idx];
  const toNext = m(cur.location, lat, lng);
  const after = steps.slice(idx).reduce((n, s) => n + s.distance, 0);
  const remaining = toNext + after;
  const total = route.distanceKm * 1000 || 1;
  const arrived = cur.type === 'arrive' && toNext < ARRIVE_M;
  return { stepIndex: idx, toNext, remaining, remainingSec: route.durationSec * (remaining / total), current: cur, next: steps[idx + 1], arrived };
}

export function fmtDistance(mtr: number) {
  if (mtr < 50) return 'Now';
  if (mtr < 1000) return `${Math.round(mtr / 10) * 10} m`;
  return `${(mtr / 1000).toFixed(mtr < 10000 ? 1 : 0)} km`;
}

export type ManeuverIcon = 'arrowUp' | 'arrowLeft' | 'arrowRight' | 'uturn' | 'roundabout' | 'flag';

export function maneuverIcon(step: RouteStep): ManeuverIcon {
  if (step.type === 'arrive') return 'flag';
  if (step.type === 'roundabout' || step.type === 'rotary') return 'roundabout';
  if (step.modifier === 'uturn') return 'uturn';
  if (step.modifier?.includes('left')) return 'arrowLeft';
  if (step.modifier?.includes('right')) return 'arrowRight';
  return 'arrowUp';
}
