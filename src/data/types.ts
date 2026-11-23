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
  /**
   * Opening hours in Dubai time as [open, close] hours, same every day.
   * close > 24 means past midnight (e.g. [10, 25] = 10:00–01:00). Only set when verified.
   */
  hours?: [number, number];
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
