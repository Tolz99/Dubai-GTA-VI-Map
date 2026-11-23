# Dubai Maps: Dubai, mapped like an open-world game

A game-style map of Dubai for iPhone (Android and web also work). Every mall, landmark, beach, souk and famous restaurant is a colour-coded blip. There's a **map legend sidebar**, **story missions**, and a **Shopping Run**: add the brands you want (Zara, Nike, Sephora…) and every mall that has them lights up, ranked by how much of your list it covers.

> Original art, icons and branding in the visual language of open-world game maps. Not affiliated with, or using assets from, any game or studio.

## What's in it

| | |
|---|---|
| **203 locations** | 42 malls, 14 main attractions, 53 restaurants (incl. Fat Sandwich, JVC), 17 cafés, 10 beaches, 18 parks, 9 souks, 16 thrills, 13 culture, 11 iconic hotels |
| **181 brands / 783 store listings** | Fashion, luxury, sneakers, beauty & oud, tech, home, food chains, coffee & sweets |
| **12 story missions** | Downtown, Old Dubai, Palm, Marina Nights, Desert Run, Hatta… with progress saved on the phone |
| **Map** | Custom "Neon Gulf" vector style: glowing pink motorways, cyan coastline, dashed Metro lines, and a dusk 3D city: sunset lighting, sky and haze, lit-window façades up close and a full skyline from far away |

### Features
- **Legend sidebar** (Legend tab on the left edge, swipe to close) with three tabs:
  - **Map legend**: search, Show all / Hide all, *Saved places only*, grouped categories with eye toggles and counts (long-press = show only that one)
  - **Shops**: full brand directory by category. Tap a brand to light up its malls, **+** to add it to your shopping list, **SHOW** to light up every mall in a category with store counts
  - **Missions**: 12 multi-stop story missions plus a city completion %
- **Shopping Run**: build a list and see which malls have everything (green), which have part of it (yellow) and what's missing
- **Briefing card** for every blip, in a draggable sheet (peek / full): description, tags, distance, *open now* (where hours are verified), save ♥, nearby places, mall store directory, "inside this mall" attractions
- **Saved places**: heart any place; saved places get a dot on the map, a section in search and a filter in the legend
- **Set waypoint**: draws a glowing driving route with ETA (OpenStreetMap routing)
- **Start GPS**: hands off to Apple Maps, Google Maps or Waze for turn-by-turn
- **Search** across places, areas, tags and brands, nearest first, with *Near you* and *Saved* when empty
- **Drive mode**: turn-by-turn guidance (next maneuver, distance, street, then-step, ETA) on a smooth follow-camera, with a corner radar of nearby blips and the destination
- **3D**: cinematic tilt, zoom +/−, compass, locate me; blips cluster at low zoom
- **CarPlay**: designed in, see [docs/CARPLAY.md](docs/CARPLAY.md) for what's in place and what's needed

## Run it on your iPhone (5 minutes, no Mac needed)

1. Install **Expo Go** from the App Store on your iPhone.
2. On any computer with [Node.js 20+](https://nodejs.org):
   ```bash
   git clone https://github.com/tolz99/dubai-gta-vi-map.git
   cd dubai-gta-vi-map
   npm install
   npm start
   ```
3. Scan the QR code with your iPhone camera. The app opens in Expo Go.

Same Wi-Fi is easiest. If it won't connect, run `npx expo start --tunnel`.

## Publish to the App Store

You need an **Apple Developer account** ($99/year) and a free **Expo account**. No Mac required, because Expo builds in the cloud.

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production   # cloud build, asks for your Apple login
eas submit --platform ios                       # uploads to App Store Connect / TestFlight
```

Before submitting, change `ios.bundleIdentifier` in `app.json` (currently `com.dubaimaps.app`) to something you own. App Store names must be unique, so check that "Dubai Maps" is free in App Store Connect.

## Project layout

```
src/
  App.tsx                 main screen: HUD, state, map wiring
  components/             LegendDrawer, PlaceCard, ShoppingPanel, MissionPanel, SearchOverlay, DriveHUD, Sheet, ui
  data/
    malls.ts              31 malls (coordinates, blurbs, highlights)
    places.ts             attractions, restaurants, cafés, beaches, parks, souks, hotels…
    brands.ts             brand → malls directory  ← edit store line-ups here
    missions.ts           story missions
    categories.ts         blip categories, colours, icon glyphs
  lib/guidance.ts         turn-by-turn engine (phone HUD now, CarPlay later)
  map/
    web/style.js          the custom neon map style
    web/map.js            map engine (MapLibre GL) — blips, routes, highlights
    NeonMap.tsx           WebView host (iOS/Android)
    NeonMap.web.tsx       iframe host (web)
scripts/
  build-map-html.mjs      bundles MapLibre + style + engine + skyline into one offline HTML (runs on install)
  build-skyline.mjs       re-extracts the far-zoom 3D skyline (towers ≥ 100 m) from OpenFreeMap tiles
  geocode.mjs             checks every place's coordinates against OpenStreetMap
```

### Editing data
- **Add a store**: in `src/data/brands.ts`, add the mall id to the brand's list, e.g. `b('Zara', 'fashion', 'BIG7 BJ CW')`.
- **Add a place**: add an entry to `src/data/places.ts` with `cat`, `lat` and `lng`, then run `npm run geocode` to check it. Add `hours: [open, close]` (Dubai time, `close` > 24 = after midnight) only when verified; it powers the *open now* hint.

## Data and credits
- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, vector tiles by [OpenFreeMap](https://openfreemap.org) / OpenMapTiles. Routing by [OSRM](https://project-osrm.org).
- Store line-ups are compiled from public mall directories and change over time. Treat them as a guide and check the mall's official directory before a special trip.
- Fonts: Barlow Condensed and Inter (SIL Open Font License).
