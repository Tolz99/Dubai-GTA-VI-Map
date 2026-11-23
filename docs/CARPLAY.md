# CarPlay plan

Dubai Maps is designed to run on CarPlay as a **navigation app**: map on the car screen, blip categories and missions in CarPlay lists, and turn-by-turn guidance in the car's maneuver panel.

## What's already in place
| CarPlay needs | Where it lives now |
|---|---|
| A map the app draws itself | `src/map/` renders the map in a web view that can be hosted in the CarPlay window too |
| Real turn-by-turn guidance (Apple requires this for navigation apps) | `src/lib/guidance.ts` plus OSRM steps in `src/lib/geo.ts`: maneuver type, direction, distance, street, instruction text |
| Places grouped for list templates | `src/data/`: categories → places, brands → malls, missions → stops |
| Phone UI that mirrors the car UI | `DriveHUD.tsx` shows the same data a `CPManeuver` / `CPTravelEstimates` needs |

## What's needed to switch it on
1. **Apple CarPlay Navigation entitlement.** Request it at developer.apple.com/carplay with the Apple Developer account. Apple reviews the app and approval isn't guaranteed. They want real turn-by-turn, which the app now has.
2. **A native CarPlay module.** The community library `react-native-carplay` hasn't been updated since 2024 and doesn't support this React Native version, so this will be a small custom Expo native module (Swift, Apple's CarPlay framework):
   - `CPMapTemplate` with the Dubai Maps map in the CarPlay window
   - `CPListTemplate` for Legend categories, Shopping list matches and Missions
   - `CPNavigationSession` fed from `guidance.ts` (maneuvers, distances, ETA)
   - An Expo config plugin that adds the entitlement and the CarPlay scene to `Info.plist`
3. **A Mac with Xcode** (for the CarPlay Simulator) or a real car / CarPlay head unit to test. Expo Go can't run CarPlay, so it needs a development build (`eas build --profile development`).

## Car-specific rules to respect
- No keyboard while driving. Search in CarPlay uses voice (Siri) or preset lists.
- At most 2 levels of lists, short labels, large blips.
- The map must stay legible in daylight. A brighter CarPlay variant of the neon style may be needed.
