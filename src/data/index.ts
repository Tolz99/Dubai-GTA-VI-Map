import { BRANDS } from './brands';
import { BRAND_CATEGORIES, PLACE_CATEGORIES, brandCat, placeCat } from './categories';
import { MALLS } from './malls';
import { MISSIONS } from './missions';
import { PLACES } from './places';
import type { Brand, Place } from './types';

export * from './categories';
export * from './types';
export { BRANDS, MALLS, MISSIONS, PLACES };

export const ALL_PLACES: Place[] = [...MALLS, ...PLACES];
export const placeById: Record<string, Place> = Object.fromEntries(ALL_PLACES.map((p) => [p.id, p]));
export const brandById: Record<string, Brand> = Object.fromEntries(BRANDS.map((b) => [b.id, b]));

export const brandsByMall: Record<string, Brand[]> = {};
for (const b of BRANDS) {
  for (const m of b.malls) {
    (brandsByMall[m] ||= []).push(b);
  }
}
for (const k of Object.keys(brandsByMall)) brandsByMall[k].sort((a, b) => a.name.localeCompare(b.name));

export const placesInMall: Record<string, Place[]> = {};
for (const p of PLACES) if (p.inMall) (placesInMall[p.inMall] ||= []).push(p);

export function categoryColor(p: Place) {
  return placeCat[p.cat].color;
}

export function brandColor(b: Brand) {
  return brandCat[b.cat].color;
}

export const STATS = {
  places: ALL_PLACES.length,
  malls: MALLS.length,
  brands: BRANDS.length,
  stores: BRANDS.reduce((n, b) => n + b.malls.length, 0),
  missions: MISSIONS.length,
};

export { BRAND_CATEGORIES, PLACE_CATEGORIES, brandCat, placeCat };
