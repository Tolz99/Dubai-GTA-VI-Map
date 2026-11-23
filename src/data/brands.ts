import type { BrandCategory } from './categories';
import type { Brand } from './types';

// Brand directory: which malls carry which brands.
// Compiled from public mall directories & local knowledge — store line-ups change,
// so each entry is easy to edit. Mall ids are defined in malls.ts.
//
// Shorthand groups:
const BIG7 = 'DM MOE IBN MCC DCC DFC DHM';
const BIG5 = 'DM MOE MCC DCC DHM';
const LUX = 'DM MOE';

function b(name: string, cat: BrandCategory, malls: string): Brand {
  const id = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const ids = Array.from(
    new Set(
      malls
        .replace(/BIG7/g, BIG7)
        .replace(/BIG5/g, BIG5)
        .replace(/LUX/g, LUX)
        .split(/\s+/)
        .filter(Boolean),
    ),
  );
  return { id, name, cat, malls: ids };
}

export const BRANDS: Brand[] = [
  // ───────────── CLOTHING & FASHION ─────────────
  b('Zara', 'fashion', 'BIG7 BJ'),
  b('H&M', 'fashion', 'BIG7 DMM BJ GHU NAK ARAB'),
  b('Uniqlo', 'fashion', 'BIG7 GHU'),
  b('Mango', 'fashion', 'BIG7 DMM BJ'),
  b('Massimo Dutti', 'fashion', 'BIG5 IBN DFC'),
  b('Bershka', 'fashion', 'BIG7 GHU'),
  b('Pull&Bear', 'fashion', 'BIG7'),
  b('Stradivarius', 'fashion', 'BIG7 GHU'),
  b('Oysho', 'fashion', 'DM MOE MCC DHM'),
  b('COS', 'fashion', 'DM MOE DHM CW'),
  b('& Other Stories', 'fashion', 'DM MOE'),
  b('Gap', 'fashion', 'BIG7 DMM'),
  b('Banana Republic', 'fashion', 'DM MOE MCC DFC'),
  b('American Eagle', 'fashion', 'BIG7 DMM BJ'),
  b('Abercrombie & Fitch', 'fashion', 'DM MOE'),
  b('Hollister', 'fashion', 'DM MOE MCC'),
  b("Levi's", 'fashion', 'BIG7 DOM'),
  b('Tommy Hilfiger', 'fashion', 'BIG5 DFC DOM TOV'),
  b('Calvin Klein', 'fashion', 'BIG5 DFC DOM TOV'),
  b('Lacoste', 'fashion', 'BIG5 DFC TOV'),
  b('Polo Ralph Lauren', 'fashion', 'DM MOE TOV'),
  b('Hugo Boss', 'fashion', 'DM MOE DFC DHM TOV'),
  b('Guess', 'fashion', 'BIG7 DOM'),
  b('Diesel', 'fashion', 'DM MOE DOM'),
  b('Marks & Spencer', 'fashion', 'DM MOE MCC DCC DFC DHM IBN MERC'),
  b('Next', 'fashion', 'DM MOE MCC DCC IBN DHM BJ ARAB'),
  b('Splash', 'fashion', 'BIG7 GHU ARAB OASIS'),
  b('Max Fashion', 'fashion', 'MCC DCC IBN GHU ARAB OASIS'),
  b('R&B', 'fashion', 'MCC DCC IBN GHU ARAB'),
  b('Centrepoint', 'fashion', 'MCC IBN ARAB OASIS DOM'),
  b('Bloomingdale’s', 'fashion', 'DM'),
  b('Galeries Lafayette', 'fashion', 'DM'),
  b('Harvey Nichols', 'fashion', 'MOE'),
  b('Reiss', 'fashion', 'DM MOE'),
  b('Ted Baker', 'fashion', 'DM MOE DFC'),
  b('Victoria’s Secret', 'fashion', 'BIG7 DMM'),
  b('Aldo', 'fashion', 'BIG7 DMM BJ GHU'),
  b('Charles & Keith', 'fashion', 'BIG7 DMM'),
  b('Skechers', 'fashion', 'BIG7 ARAB DOM'),
  b('Pandora', 'fashion', 'BIG7 DMM BJ'),
  b('Swarovski', 'fashion', 'BIG5 IBN DFC'),
  b('Ray-Ban', 'fashion', 'DM MOE DHM'),
  b('Brands For Less', 'fashion', 'ARAB OASIS TSC DOM'),

  // ───────────── LUXURY & DESIGNER ─────────────
  b('Louis Vuitton', 'luxury', 'LUX'),
  b('Chanel', 'luxury', 'LUX'),
  b('Gucci', 'luxury', 'LUX'),
  b('Dior', 'luxury', 'LUX'),
  b('Hermès', 'luxury', 'LUX'),
  b('Prada', 'luxury', 'LUX'),
  b('Miu Miu', 'luxury', 'DM'),
  b('Saint Laurent', 'luxury', 'LUX'),
  b('Balenciaga', 'luxury', 'DM'),
  b('Bottega Veneta', 'luxury', 'DM'),
  b('Fendi', 'luxury', 'LUX'),
  b('Versace', 'luxury', 'DM MOE TOV'),
  b('Dolce & Gabbana', 'luxury', 'LUX'),
  b('Valentino', 'luxury', 'DM'),
  b('Givenchy', 'luxury', 'DM'),
  b('Burberry', 'luxury', 'DM MOE TOV'),
  b('Loewe', 'luxury', 'DM'),
  b('Celine', 'luxury', 'DM'),
  b('Alexander McQueen', 'luxury', 'DM'),
  b('Off-White', 'luxury', 'DM'),
  b('Moncler', 'luxury', 'DM'),
  b('Cartier', 'luxury', 'LUX'),
  b('Tiffany & Co.', 'luxury', 'LUX DHM'),
  b('Bulgari', 'luxury', 'LUX'),
  b('Van Cleef & Arpels', 'luxury', 'LUX'),
  b('Rolex (Seddiqi)', 'luxury', 'LUX'),
  b('Patek Philippe (Seddiqi)', 'luxury', 'DM'),
  b('Audemars Piguet', 'luxury', 'DM'),
  b('Omega', 'luxury', 'LUX DFC'),
  b('Tag Heuer', 'luxury', 'BIG5 DFC'),
  b('Michael Kors', 'luxury', 'BIG5 DFC DOM TOV'),
  b('Coach', 'luxury', 'BIG5 DFC TOV'),
  b('Kate Spade', 'luxury', 'DM MOE MCC DHM TOV'),
  b('Tory Burch', 'luxury', 'DM MOE TOV'),
  b('Level Shoes', 'luxury', 'DM'),
  b('Damas Jewellery', 'luxury', 'BIG7 BJ GHU'),

  // ───────────── SNEAKERS & SPORTS ─────────────
  b('Nike', 'sports', 'BIG7 DOM'),
  b('Adidas', 'sports', 'BIG7 DMM DOM'),
  b('Puma', 'sports', 'BIG7 DOM'),
  b('New Balance', 'sports', 'DM MOE MCC DHM'),
  b('Under Armour', 'sports', 'DM MOE MCC DFC'),
  b('Foot Locker', 'sports', 'BIG7 DMM BJ'),
  b('Sun & Sand Sports', 'sports', 'BIG7 DMM BJ GHU ARAB'),
  b('JD Sports', 'sports', 'DM MOE DHM'),
  b('Lululemon', 'sports', 'DM MOE DHM CW'),
  b('Decathlon', 'sports', 'MOE MCC FPJ'),
  b('Go Sport', 'sports', 'MCC DCC IBN'),
  b('Asics', 'sports', 'DM MOE MCC'),
  b('Crocs', 'sports', 'BIG7'),
  b('Vans', 'sports', 'DM MOE MCC DHM'),
  b('Converse', 'sports', 'DM MOE MCC'),
  b('On Running', 'sports', 'DM'),
  b('The North Face', 'sports', 'DM MOE'),
  b('Adventure HQ', 'sports', 'TSC DHM'),
  b('Ski Dubai Shop', 'sports', 'MOE'),

  // ───────────── BEAUTY & FRAGRANCE ─────────────
  b('Sephora', 'beauty', 'BIG7 DMM BJ CW'),
  b('Faces', 'beauty', 'BIG7 DMM GHU'),
  b('Bath & Body Works', 'beauty', 'BIG7 DMM BJ GHU ARAB'),
  b('MAC Cosmetics', 'beauty', 'BIG7'),
  b('Charlotte Tilbury', 'beauty', 'DM MOE'),
  b('Huda Beauty (at Sephora)', 'beauty', 'DM MOE MCC DHM'),
  b('Kiko Milano', 'beauty', 'BIG7 DMM'),
  b('The Body Shop', 'beauty', 'BIG7 BJ'),
  b('Rituals', 'beauty', 'DM MOE DHM'),
  b('Jo Malone London', 'beauty', 'DM MOE DHM'),
  b('Le Labo', 'beauty', 'DM'),
  b('Diptyque', 'beauty', 'DM'),
  b('Tom Ford Beauty', 'beauty', 'DM'),
  b('Ajmal Perfumes', 'beauty', 'BIG7 BJ GHU'),
  b('Arabian Oud', 'beauty', 'BIG7 BJ GHU ARAB'),
  b('Rasasi', 'beauty', 'BIG7 GHU'),
  b('Swiss Arabian', 'beauty', 'MCC DCC IBN GHU'),
  b('Amouage', 'beauty', 'DM MOE'),
  b('Kayali (at Sephora)', 'beauty', 'DM MOE'),
  b('Boots Pharmacy', 'beauty', 'DM MOE MCC DHM DMM'),

  // ───────────── TECH & ELECTRONICS ─────────────
  b('Apple Store', 'tech', 'DM MOE'),
  b('Samsung', 'tech', 'DM MOE MCC DCC'),
  b('Sharaf DG', 'tech', 'BIG7 TSC BJ ARAB'),
  b('Jumbo Electronics', 'tech', 'DM MOE MCC DCC DFC'),
  b('Virgin Megastore', 'tech', 'DM MOE MCC IBN DFC DHM'),
  b('Huawei', 'tech', 'DM MOE MCC'),
  b('Xiaomi', 'tech', 'DM MCC IBN DCC'),
  b('Dyson', 'tech', 'DM MOE'),
  b('Bose', 'tech', 'DM MOE'),
  b('Emax', 'tech', 'IBN MCC ARAB'),
  b('Geekay Games', 'tech', 'DM MOE MCC'),
  b('Carrefour Hypermarket', 'home', 'MOE MCC DCC BJ ARAB'),

  // ───────────── HOME & LIFESTYLE ─────────────
  b('IKEA', 'home', 'DFC FPJ'),
  b('ACE', 'home', 'DFC FPJ'),
  b('Home Centre', 'home', 'MCC IBN OASIS DOM'),
  b('Pottery Barn', 'home', 'DM DFC DHM'),
  b('West Elm', 'home', 'DM DHM'),
  b('Crate & Barrel', 'home', 'DFC'),
  b('Zara Home', 'home', 'DM MOE MCC DHM'),
  b('H&M Home', 'home', 'DM MCC DHM'),
  b('Muji', 'home', 'DM DFC'),
  b('Typo', 'home', 'BIG7'),
  b('Kinokuniya Books', 'home', 'DM'),
  b('Hamleys', 'home', 'MOE'),
  b('Toys R Us', 'home', 'MCC DCC DFC'),
  b('LEGO Store', 'home', 'DM MOE'),
  b('Dragon Mart Traders', 'home', 'DRAG'),
  b('Waitrose', 'home', 'DM DMM SPRINGS GALL'),
  b('Spinneys', 'home', 'DHM MERC'),

  // ───────────── FOOD CHAINS ─────────────
  b('Shake Shack', 'foodchain', 'DM MOE MCC DHM CW BEACH DFC'),
  b('Five Guys', 'foodchain', 'DM MOE MCC DCC DHM DMM BEACH'),
  b('The Cheesecake Factory', 'foodchain', 'DM MOE MCC DFC'),
  b('P.F. Chang’s', 'foodchain', 'DM MOE'),
  b('Texas Roadhouse', 'foodchain', 'DFC IBN'),
  b('Eataly', 'foodchain', 'DM'),
  b('Black Tap', 'foodchain', 'DM'),
  b('Salt', 'foodchain', 'CW DHM'),
  b('McDonald’s', 'foodchain', 'BIG7 DMM BJ GHU ARAB OASIS'),
  b('KFC', 'foodchain', 'BIG7 GHU ARAB OASIS'),
  b('Wingstop', 'foodchain', 'DM MCC DHM'),
  b('Operation: Falafel', 'foodchain', 'DM DHM BEACH BOX'),
  b('Al Mallah', 'foodchain', 'IBN'),
  b('Zaatar w Zeit', 'foodchain', 'DM MOE DHM BOX'),
  b('Social House', 'foodchain', 'DM'),
  b('Din Tai Fung', 'foodchain', 'DM'),
  b('Texas Chicken', 'foodchain', 'MCC DCC IBN'),
  b('Logma', 'foodchain', 'BOX CW'),
  b('Allo Beirut', 'foodchain', 'BOX DHM'),
  b('Hattam', 'foodchain', 'BJ'),

  // ───────────── COFFEE & SWEETS ─────────────
  b('Starbucks', 'cafechain', 'BIG7 DMM BJ GHU CW BEACH'),
  b('Tim Hortons', 'cafechain', 'BIG7 DMM BJ ARAB'),
  b('%Arabica', 'cafechain', 'DM CW DHM BLUE'),
  b('Joe & the Juice', 'cafechain', 'DM MOE DHM CW'),
  b('Bateel Café', 'cafechain', 'DM MOE BJ'),
  b('Paul Café', 'cafechain', 'BIG7 DMM'),
  b('Magnolia Bakery', 'cafechain', 'DM'),
  b('Cinnabon', 'cafechain', 'BIG7 GHU'),
  b('Krispy Kreme', 'cafechain', 'BIG7'),
  b('Kunafa World', 'cafechain', 'DM MOE'),
  b('Gelato Divino', 'cafechain', 'CW BEACH'),
  b('Patchi', 'cafechain', 'DM MOE MCC DCC'),
  b('Godiva', 'cafechain', 'DM MOE'),
];

export const brandById: Record<string, Brand> = Object.fromEntries(BRANDS.map((x) => [x.id, x]));
