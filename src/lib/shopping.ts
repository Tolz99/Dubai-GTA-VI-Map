import { MALLS, brandById, type Place } from '../data';
import { distanceKm } from './geo';

export interface MallMatch {
  mall: Place;
  have: string[];
  missing: string[];
  km: number | null;
}

/** Rank malls by how many brands from the list they carry, then by distance. */
export function rankMalls(list: string[], userLoc: { lat: number; lng: number } | null): MallMatch[] {
  if (!list.length) return [];
  return MALLS.map((mall) => {
    const have = list.filter((id) => brandById[id]?.malls.includes(mall.id));
    return {
      mall,
      have,
      missing: list.filter((id) => !have.includes(id)),
      km: userLoc ? distanceKm(userLoc.lat, userLoc.lng, mall.lat, mall.lng) : null,
    };
  })
    .filter((m) => m.have.length > 0)
    .sort((a, b) => b.have.length - a.have.length || (a.km ?? 0) - (b.km ?? 0) || a.mall.name.localeCompare(b.mall.name));
}

export const FULL = '#9BFF3D';
export const PARTIAL = '#FFD23F';
