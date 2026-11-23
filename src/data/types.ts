import type { BrandCategory, PlaceCategory } from './categories';

export interface Place {
  id: string;
  name: string;
  cat: PlaceCategory;
  area: string;
  lat: number;
  lng: number;
  blurb: string;
  tags?: string[];
  /** 1 = cheap eats … 4 = splurge */
  price?: 1 | 2 | 3 | 4;
  featured?: boolean;
  /** If this place sits inside a mall (id of that mall). */
  inMall?: string;
}

export interface Brand {
  id: string;
  name: string;
  cat: BrandCategory;
  /** Mall ids where the brand has a store. */
  malls: string[];
}

export interface StoryMission {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  /** Ordered place ids. */
  stops: string[];
  reward: string;
}
