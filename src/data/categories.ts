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
  | 'drop'
  | 'phone'
  | 'sofa'
  | 'fork'
  | 'cup'
  | 'wave'
  | 'tree'
  | 'lantern'
  | 'bolt'
  | 'column'
  | 'key';

export interface CategoryDef<T extends string> {
  id: T;
  label: string;
  short: string;
  color: string;
  icon: IconName;
}

export const PLACE_CATEGORIES: CategoryDef<PlaceCategory>[] = [
  { id: 'attraction', label: 'Main Attractions', short: 'ATTRACTION', color: '#FFD23F', icon: 'star' },
  { id: 'mall', label: 'Malls', short: 'MALL', color: '#FF3D8B', icon: 'bag' },
  { id: 'food', label: 'Restaurants', short: 'RESTAURANT', color: '#FF8A3D', icon: 'fork' },
  { id: 'cafe', label: 'Cafés & Desserts', short: 'CAFÉ', color: '#F5B971', icon: 'cup' },
  { id: 'beach', label: 'Beaches', short: 'BEACH', color: '#3DFFD8', icon: 'wave' },
  { id: 'park', label: 'Parks & Nature', short: 'PARK', color: '#45E08A', icon: 'tree' },
  { id: 'souk', label: 'Souks & Heritage', short: 'SOUK', color: '#E8A54B', icon: 'lantern' },
  { id: 'theme', label: 'Theme Parks & Thrills', short: 'THRILL', color: '#FF4D5E', icon: 'bolt' },
  { id: 'culture', label: 'Museums & Culture', short: 'CULTURE', color: '#8FA8FF', icon: 'column' },
  { id: 'hotel', label: 'Iconic Hotels', short: 'HOTEL', color: '#E6E1FF', icon: 'key' },
];

export const BRAND_CATEGORIES: CategoryDef<BrandCategory>[] = [
  { id: 'fashion', label: 'Clothing & Fashion', short: 'FASHION', color: '#29E3FF', icon: 'shirt' },
  { id: 'luxury', label: 'Luxury & Designer', short: 'LUXURY', color: '#B66DFF', icon: 'diamond' },
  { id: 'sports', label: 'Sneakers & Sports', short: 'SPORTS', color: '#9BFF3D', icon: 'shoe' },
  { id: 'beauty', label: 'Beauty & Fragrance', short: 'BEAUTY', color: '#FF8AD8', icon: 'drop' },
  { id: 'tech', label: 'Tech & Electronics', short: 'TECH', color: '#4D9BFF', icon: 'phone' },
  { id: 'home', label: 'Home & Lifestyle', short: 'HOME', color: '#5FD3C6', icon: 'sofa' },
  { id: 'foodchain', label: 'Food Chains', short: 'FOOD', color: '#FF8A3D', icon: 'fork' },
  { id: 'cafechain', label: 'Coffee & Sweets', short: 'COFFEE', color: '#F5B971', icon: 'cup' },
];

export const placeCat = Object.fromEntries(PLACE_CATEGORIES.map((c) => [c.id, c])) as Record<
  PlaceCategory,
  CategoryDef<PlaceCategory>
>;
export const brandCat = Object.fromEntries(BRAND_CATEGORIES.map((c) => [c.id, c])) as Record<
  BrandCategory,
  CategoryDef<BrandCategory>
>;

// 24x24 glyph paths shared by the native UI (react-native-svg) and the map (canvas/SVG).
export const ICON_PATHS: Record<IconName, string> = {
  star: 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z',
  bag: 'M6 8h12l1 13H5zM9 8V6.5a3 3 0 016 0V8h-1.8V6.5a1.2 1.2 0 00-2.4 0V8z',
  shirt: 'M8 3l4 2.2L16 3l5 3.5-2.4 4-1.6-1V21H7V9.5l-1.6 1L3 6.5z',
  diamond: 'M7 4h10l4 5-9 12L3 9zm-.9 5h11.8l-2.6-3.3H8.7z',
  shoe: 'M2 14.5V9l5 1.5 3-3 2 .5-1 2.5 3 1.5 6 1.5c1.7.5 2 1.5 2 3.5H2zM2 19h20v2H2z',
  drop: 'M12 2.5s6.5 7.2 6.5 11.7a6.5 6.5 0 01-13 0C5.5 9.7 12 2.5 12 2.5z',
  phone: 'M7.5 2h9A1.5 1.5 0 0118 3.5v17a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 20.5v-17A1.5 1.5 0 017.5 2zM8 5v13h8V5z',
  sofa: 'M5 7a2 2 0 012-2h10a2 2 0 012 2v3h-2v3H7v-3H5zM2 11a2 2 0 014 0v3h12v-3a2 2 0 014 0v7h-2v2h-2v-2H6v2H4v-2H2z',
  fork: 'M6 2h1.5v6H9V2h1.5v6H12V2h1.5v7a3 3 0 01-2.5 3v10H8.5V12A3 3 0 016 9zM17 2c2 0 3 2.5 3 7v4h-2v9h-2.5V2z',
  cup: 'M4 8h13v5a6 6 0 01-6 6h-1a6 6 0 01-6-6zm13 1.5h1.5a2.5 2.5 0 010 5H17V13h1.5a1 1 0 000-2H17zM3 20.5h15V22H3zM8 2.5c1 1 1 2 0 3s-1 2 0 3M12 2.5c1 1 1 2 0 3s-1 2 0 3',
  wave: 'M2 10c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2v3c-2.5 0-2.5-2-5-2s-2.5 2-5 2-2.5-2-5-2-2.5 2-5 2zm0 6c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2v3c-2.5 0-2.5-2-5-2s-2.5 2-5 2-2.5-2-5-2-2.5 2-5 2z',
  tree: 'M12 2l6 8h-3l4 6h-6v6h-2v-6H5l4-6H6z',
  lantern: 'M10 2h4v2h2l1 3H7l1-3h2zM7 8h10l-1 10H8zm1 11h8l-1 3H9z',
  bolt: 'M13.5 2L4 14h6.5L9 22l11-13h-6.8z',
  column: 'M12 2l10 5v2H2V7zM4 10h3v8H4zm6.5 0h3v8h-3zm6.5 0h3v8h-3zM2 19h20v3H2z',
  key: 'M8 3a5 5 0 014.6 7H22v4h-3v3h-3v-3h-3.4A5 5 0 118 3zm0 3.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
};
