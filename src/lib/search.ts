import { ALL_PLACES, BRANDS, brandCat, placeCat, type Brand, type Place } from '../data';
import { distanceKm } from './geo';

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ');

// Pre-normalised search text per place, built once.
const PLACE_INDEX = ALL_PLACES.map((p) => ({
  p,
  name: norm(p.name),
  hay: norm(`${p.name} ${p.area} ${placeCat[p.cat].label} ${(p.tags || []).join(' ')}`),
}));
const BRAND_INDEX = BRANDS.map((b) => ({ b, name: norm(b.name), hay: norm(`${b.name} ${brandCat[b.cat].label}`) }));

type Loc = { lat: number; lng: number } | null;

export interface PlaceHit {
  place: Place;
  km: number | null;
}

/** Places matching every word. Name matches rank first, then nearest (when we know where you are). */
export function searchPlaces(q: string, loc: Loc): PlaceHit[] {
  const s = norm(q.trim());
  if (!s) return [];
  const words = s.split(/\s+/);
  return PLACE_INDEX.filter((x) => words.every((w) => x.hay.includes(w)))
    .map((x) => {
      const km = loc ? distanceKm(loc.lat, loc.lng, x.p.lat, x.p.lng) : null;
      const rank = x.name.startsWith(s) ? 0 : words.every((w) => x.name.includes(w)) ? 1 : 2;
      return { place: x.p, km, rank };
    })
    .sort((a, b) => a.rank - b.rank || (a.km ?? 0) - (b.km ?? 0) || a.place.name.localeCompare(b.place.name))
    .map(({ place, km }) => ({ place, km }));
}

export function searchBrands(q: string): Brand[] {
  const s = norm(q.trim());
  if (!s) return [];
  const words = s.split(/\s+/);
  return BRAND_INDEX.filter((x) => words.every((w) => x.hay.includes(w)))
    .sort((a, b) => Number(!a.name.startsWith(s)) - Number(!b.name.startsWith(s)) || a.b.name.localeCompare(b.b.name))
    .map((x) => x.b);
}

/** Closest places to a point, optionally excluding one id. */
export function nearest(loc: { lat: number; lng: number }, n: number, exclude?: string, filter?: (p: Place) => boolean): PlaceHit[] {
  return ALL_PLACES.filter((p) => p.id !== exclude && (!filter || filter(p)))
    .map((p) => ({ place: p, km: distanceKm(loc.lat, loc.lng, p.lat, p.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}
