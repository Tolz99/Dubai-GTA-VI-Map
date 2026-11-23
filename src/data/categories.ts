// Map categories (blips) and shop categories (brand directory).

export type PlaceCategory =
  | 'attraction'
  | 'mall'
  | 'food'
  | 'cafe'
  | 'beach'
  | 'park'
  | 'souk'
  | 'theme'
  | 'culture'
  | 'hotel';

export type BrandCategory =
  | 'fashion'
  | 'luxury'
  | 'sports'
  | 'beauty'
  | 'tech'
  | 'home'
  | 'foodchain'
  | 'cafechain';

export type IconName =
  | 'star'
  | 'bag'
  | 'shirt'
  | 'diamond'
  | 'shoe'
  | 'perfume'
  | 'phone'
  | 'sofa'
  | 'fork'
  | 'cup'
  | 'umbrella'
  | 'tree'
  | 'dome'
  | 'bolt'
  | 'museum'
  | 'bed';

export interface CategoryDef<T extends string> {
  id: T;
  label: string;
  short: string;
  color: string;
  icon: IconName;
}

export const PLACE_CATEGORIES: CategoryDef<PlaceCategory>[] = [
  { id: 'attraction', label: 'Main Attractions', short: 'ATTRACTION', color: '#FFC93C', icon: 'star' },
  { id: 'mall', label: 'Malls', short: 'MALL', color: '#F2387C', icon: 'bag' },
  { id: 'food', label: 'Restaurants', short: 'RESTAURANT', color: '#FF8A4C', icon: 'fork' },
  { id: 'cafe', label: 'Cafés & Desserts', short: 'CAFÉ', color: '#E9B872', icon: 'cup' },
  { id: 'beach', label: 'Beaches', short: 'BEACH', color: '#2FD6E8', icon: 'umbrella' },
  { id: 'park', label: 'Parks & Nature', short: 'PARK', color: '#4CD964', icon: 'tree' },
  { id: 'souk', label: 'Souks & Heritage', short: 'SOUK', color: '#D08A45', icon: 'dome' },
  { id: 'theme', label: 'Theme Parks & Thrills', short: 'THRILL', color: '#FF4D4D', icon: 'bolt' },
  { id: 'culture', label: 'Museums & Culture', short: 'CULTURE', color: '#7EA6FF', icon: 'museum' },
  { id: 'hotel', label: 'Iconic Hotels', short: 'HOTEL', color: '#FFFFFF', icon: 'bed' },
];

export const BRAND_CATEGORIES: CategoryDef<BrandCategory>[] = [
  { id: 'fashion', label: 'Clothing & Fashion', short: 'FASHION', color: '#5AC8FA', icon: 'shirt' },
  { id: 'luxury', label: 'Luxury & Designer', short: 'LUXURY', color: '#B78CFF', icon: 'diamond' },
  { id: 'sports', label: 'Sneakers & Sports', short: 'SPORTS', color: '#A6E22E', icon: 'shoe' },
  { id: 'beauty', label: 'Beauty & Fragrance', short: 'BEAUTY', color: '#FF7AC8', icon: 'perfume' },
  { id: 'tech', label: 'Tech & Electronics', short: 'TECH', color: '#4D8DFF', icon: 'phone' },
  { id: 'home', label: 'Home & Lifestyle', short: 'HOME', color: '#46C9B5', icon: 'sofa' },
  { id: 'foodchain', label: 'Food Chains', short: 'FOOD', color: '#FF8A4C', icon: 'fork' },
  { id: 'cafechain', label: 'Coffee & Sweets', short: 'COFFEE', color: '#E9B872', icon: 'cup' },
];

export const placeCat = Object.fromEntries(PLACE_CATEGORIES.map((c) => [c.id, c])) as Record<
  PlaceCategory,
  CategoryDef<PlaceCategory>
>;
export const brandCat = Object.fromEntries(BRAND_CATEGORIES.map((c) => [c.id, c])) as Record<
  BrandCategory,
  CategoryDef<BrandCategory>
>;

// 24x24 solid glyphs (even-odd fill). Drawn as game-map blips: colour fill + thick dark outline.
export const ICON_PATHS: Record<IconName, string> = {
  star: 'M12 1.8l3.1 6.6 7.1.9-5.2 4.9 1.3 7.1L12 17.8l-6.3 3.5L7 14.2 1.8 9.3l7.1-.9z',
  bag: 'M4.5 8h15l-1.2 14H5.7zM8 8V6.8a4 4 0 018 0V8h-2.4V6.8a1.6 1.6 0 00-3.2 0V8z',
  shirt: 'M8.2 2.5h2a1.8 1.8 0 003.6 0h2l5.7 3.6-2.6 4.6-2.2-1.2V21.5H7.3V9.5l-2.2 1.2-2.6-4.6z',
  diamond: 'M6.4 3.5h11.2L22.5 9.4 12 21.5 1.5 9.4zM8 5.5L5.6 9h12.8L16 5.5z',
  shoe: 'M1.8 18V11l4.4-.8 2.6-3.4 2.6 1-.9 2.3 3.1 2.1 6.4 1.3c1.7.4 2.4 1.8 2.4 4.5zM1.8 19.4h20.4V22H1.8z',
  perfume: 'M9.5 1.8h5v3.4h-5zM7.4 6.6h9.2l1.4 3.2v9.4a3 3 0 01-3 3H9a3 3 0 01-3-3V9.8z',
  phone: 'M7.2 1.5h9.6A2.2 2.2 0 0119 3.7v16.6a2.2 2.2 0 01-2.2 2.2H7.2A2.2 2.2 0 015 20.3V3.7a2.2 2.2 0 012.2-2.2zM7.4 4.2v13.4h9.2V4.2z',
  sofa: 'M5 5.5h14a2 2 0 012 2V10a3 3 0 00-3 3v.5H6V13a3 3 0 00-3-3V7.5a2 2 0 012-2zM1.5 13a2 2 0 014 0v2.5h13V13a2 2 0 014 0v6.5h-2.2v2h-2.4v-2H6.1v2H3.7v-2H1.5z',
  fork: 'M5.5 1.8h1.6v6h1.2v-6h1.6v6h1.2v-6h1.6v7.6a3 3 0 01-2.3 2.9v10H7.8v-10a3 3 0 01-2.3-2.9zM16.6 1.8c2.6 0 4 3.4 4 8.4v3.4h-2.2v8.6h-2.7V1.8z',
  cup: 'M2.8 8.2h14.4v5.4a5.6 5.6 0 01-5.6 5.6H8.4a5.6 5.6 0 01-5.6-5.6zM17.2 9.2h1.6a3.2 3.2 0 010 6.4h-2v-2.3h2a.9.9 0 000-1.8h-1.6zM2.5 20.3h15.5v2.2H2.5zM6.6 1.8h2.2v4.6H6.6zM11 1.8h2.2v4.6H11z',
  umbrella: 'M12 2.5a9.5 9.5 0 019.5 9.5h-19A9.5 9.5 0 0112 2.5zM10.8 12h2.4v8.2h-2.4zM4.5 19.8h15v2.4h-15z',
  tree: 'M12 1.5l6.5 8.5h-3.3l4.6 6.8h-6.6v5.7h-2.4v-5.7H4.2l4.6-6.8H5.5z',
  dome: 'M12 1.5c3.4 2.2 5.6 4 5.6 7.4v1.3H6.4V8.9c0-3.4 2.2-5.2 5.6-7.4zM4.5 11.5h15v11h-5v-5.2a2.5 2.5 0 00-5 0v5.2h-5z',
  bolt: 'M14 1.5L3.8 13.8h6.6L8.8 22.5 20.2 9.2h-7z',
  museum: 'M12 1.5l10.5 5.2v2.6h-21V6.7zM3.5 10.6h3.2v8.2H3.5zm6.9 0h3.2v8.2h-3.2zm6.9 0h3.2v8.2h-3.2zM1.5 20h21v2.6h-21z',
  bed: 'M1.8 4.5h2.6v7.8h17.8V18h-2.6v-2.6H4.4V18H1.8zM6.8 6.6a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8zM10.5 7.2h7.5a4.2 4.2 0 014.2 4.2v.4H10.5z',
};
