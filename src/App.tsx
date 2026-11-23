import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold_Italic } from '@expo-google-fonts/barlow-condensed/800ExtraBold_Italic';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriveHUD } from './components/DriveHUD';
import { LegendDrawer, type LegendTab } from './components/LegendDrawer';
import { MissionPanel } from './components/MissionPanel';
import { PlaceCard } from './components/PlaceCard';
import { Radar } from './components/Radar';
import { SearchOverlay } from './components/SearchOverlay';
import { Sheet } from './components/Sheet';
import { ShoppingPanel } from './components/ShoppingPanel';
import { Glyph, MapButton, T, success, tap } from './components/ui';
import { ALL_PLACES, BRAND_CATEGORIES, BRANDS, ICON_PATHS, MALLS, MISSIONS, PLACE_CATEGORIES, brandById, brandCat, placeById, type PlaceCategory } from './data';
import { distanceKm, fetchRoute, type LngLat, type RouteResult } from './lib/geo';
import { startGuidance, updateGuidance, type Guidance } from './lib/guidance';
import { FULL, PARTIAL, rankMalls } from './lib/shopping';
import { NeonMap } from './map/NeonMap';
import type { HighlightItem, MapEvent, MapHandle } from './map/types';
import { usePersistent, type Focus } from './state/store';
import { colors, fonts, radius } from './theme/theme';

const DOWNTOWN = { lat: 25.1972, lng: 55.2744 };
type SheetKind = 'place' | 'shop' | 'mission' | null;
type Loc = { lat: number; lng: number; heading: number | null };

export default function App() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.ink }}>
        {/* The map starts loading immediately, in parallel with the fonts. */}
        <MapScreen fontsLoaded={fontsLoaded} />
      </View>
    </SafeAreaProvider>
  );
}

/** Objective line in the style of a game subtitle: white text, one coloured keyword. */
interface Objective {
  before: string;
  key: string;
  after: string;
  color: string;
}

const MAP_CATEGORIES = [...PLACE_CATEGORIES, ...BRAND_CATEGORIES].map((c) => ({ id: c.id, color: c.color, path: ICON_PATHS[c.icon] }));
const MAP_PLACES = ALL_PLACES.map((p) => ({ id: p.id, name: p.name, cat: p.cat, lat: p.lat, lng: p.lng, featured: !!p.featured }));

const movedM = (a: Loc, b: Loc) => distanceKm(a.lat, a.lng, b.lat, b.lng) * 1000;
const validHeading = (h: number | null | undefined) => (h != null && h >= 0 && !Number.isNaN(h) ? h : null);

function MapScreen({ fontsLoaded }: { fontsLoaded: boolean }) {
  const insets = useSafeAreaInsets();
  const map = useRef<MapHandle>(null);
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);

  const [visible, setVisible] = usePersistent<PlaceCategory[]>('visibleCats', PLACE_CATEGORIES.map((c) => c.id));
  const [shoppingList, setShoppingList] = usePersistent<string[]>('shoppingList', []);
  const [missionDone, setMissionDone] = usePersistent<Record<string, string[]>>('missionDone', {});
  const [favs, setFavs] = usePersistent<string[]>('favourites', []);
  const [savedOnly, setSavedOnly] = useState(false);

  const [focus, setFocus] = useState<Focus>({ kind: 'none' });
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [legendTab, setLegendTab] = useState<LegendTab>('map');
  const [search, setSearch] = useState(false);
  const [tilt, setTilt] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [userLoc, setUserLoc] = useState<Loc | null>(null);
  const [route, setRoute] = useState<(RouteResult & { targetId: string }) | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const guiding = !!guidance;

  const post = useCallback((msg: Record<string, unknown>) => map.current?.post(msg), []);

  // ── player location ──
  // Outside drive mode, only re-render when the player moved 15 m+ (GPS jitter would otherwise
  // re-render the whole screen every second). In drive mode every fix counts.
  const guidingRef = useRef(false);
  useLayoutEffect(() => {
    guidingRef.current = guiding;
  });
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    const onFix = (p: Location.LocationObject) => {
      const next: Loc = { lat: p.coords.latitude, lng: p.coords.longitude, heading: validHeading(p.coords.heading) };
      setUserLoc((prev) => {
        if (!prev) return next;
        const d = movedM(prev, next);
        if (!guidingRef.current && d < 15) return prev;
        // No course from the GPS (slow / stationary): derive one from movement.
        if (next.heading == null && d > 4) {
          const y = Math.sin(((next.lng - prev.lng) * Math.PI) / 180) * Math.cos((next.lat * Math.PI) / 180);
          const x =
            Math.cos((prev.lat * Math.PI) / 180) * Math.sin((next.lat * Math.PI) / 180) -
            Math.sin((prev.lat * Math.PI) / 180) * Math.cos((next.lat * Math.PI) / 180) * Math.cos(((next.lng - prev.lng) * Math.PI) / 180);
          next.heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        } else if (next.heading == null) next.heading = prev.heading;
        return next;
      });
    };
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) onFix(last);
        sub = await Location.watchPositionAsync(
          guiding
            ? { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 1000 }
            : { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
          onFix,
        );
        if (cancelled) sub.remove();
      } catch {
        // no location: the app still works
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [guiding]);

  const playerInDubai = useMemo(
    () => (userLoc && distanceKm(userLoc.lat, userLoc.lng, DOWNTOWN.lat, DOWNTOWN.lng) < 120 ? userLoc : null),
    [userLoc],
  );

  // ── what glows on the map (independent of location so GPS fixes don't re-send it) ──
  const highlight = useMemo<Record<string, HighlightItem> | null>(() => {
    if (focus.kind === 'shopping') {
      if (!shoppingList.length) return null;
      const items: Record<string, HighlightItem> = {};
      rankMalls(shoppingList, null).forEach((r) => {
        items[r.mall.id] = { color: r.missing.length ? PARTIAL : FULL, badge: `${r.have.length}/${shoppingList.length}` };
      });
      return items;
    }
    if (focus.kind === 'brand') {
      const b = brandById[focus.id];
      if (!b) return null;
      return Object.fromEntries(b.malls.map((m) => [m, { color: brandCat[b.cat].color, badge: b.name, icon: b.cat }]));
    }
    if (focus.kind === 'brandCat') {
      const c = brandCat[focus.id as keyof typeof brandCat];
      const items: Record<string, HighlightItem> = {};
      MALLS.forEach((m) => {
        const n = BRANDS.filter((b) => b.cat === focus.id && b.malls.includes(m.id)).length;
        if (n) items[m.id] = { color: c.color, badge: `${n} stores`, icon: c.id };
      });
      return items;
    }
    if (focus.kind === 'mission') {
      const m = MISSIONS.find((x) => x.id === focus.id);
      return m ? Object.fromEntries(m.stops.map((s) => [s, { color: m.color }])) : null;
    }
    return null;
  }, [focus, shoppingList]);

  // ── keep the map in sync (each effect sends only its own small message) ──
  useEffect(() => {
    if (ready) post({ type: 'init', categories: MAP_CATEGORIES, places: MAP_PLACES });
  }, [ready, post]);
  useEffect(() => {
    if (ready) post({ type: 'filter', visible, favs, savedOnly });
  }, [ready, visible, favs, savedOnly, post]);
  const lastFocusKey = useRef('');
  useEffect(() => {
    if (!ready) return;
    const key = JSON.stringify(focus);
    const fit = key !== lastFocusKey.current && focus.kind !== 'mission';
    lastFocusKey.current = key;
    post({ type: 'highlight', items: highlight, fit: fit && !!highlight });
  }, [ready, highlight, focus, post]);
  useEffect(() => {
    if (ready) post({ type: 'select', id: selected, fly: !!selected });
  }, [ready, selected, post]);
  useEffect(() => {
    if (ready && playerInDubai && !guiding) post({ type: 'me', lat: playerInDubai.lat, lng: playerInDubai.lng, heading: playerInDubai.heading });
  }, [ready, playerInDubai, guiding, post]);

  // ── turn-by-turn: advance on every location fix ──
  const arrivedRef = useRef(false);
  useEffect(() => {
    if (!guiding || !route || !playerInDubai) return;
    setGuidance((g) => {
      if (!g) return g;
      const next = updateGuidance(route, g, playerInDubai.lat, playerInDubai.lng);
      if (next.arrived && !arrivedRef.current) {
        arrivedRef.current = true;
        success();
      }
      return next;
    });
    post({ type: 'follow', lat: playerInDubai.lat, lng: playerInDubai.lng, bearing: playerInDubai.heading ?? undefined });
  }, [guiding, route, playerInDubai, post]);

  const onEvent = useCallback((e: MapEvent) => {
    if (e.type === 'ready') setReady(true);
    else if (e.type === 'idle') setPainted(true);
    else if (e.type === 'bearing') setBearing(e.bearing);
    else if (e.type === 'select') {
      tap();
      setSelected(e.id);
      setSheet('place');
    } else if (e.type === 'mapTap') {
      setSheet((s) => (s === 'place' ? null : s));
      setSelected(null);
    }
  }, []);

  // ── actions ──
  const toggleShopping = useCallback((id: string) => setShoppingList((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])), [setShoppingList]);
  const toggleFav = useCallback((id: string) => setFavs((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l])), [setFavs]);

  const selectPlace = useCallback((id: string) => {
    setSelected(id);
    setSheet('place');
    setSearch(false);
    setDrawer(false);
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setGuidance(null);
    setRouteError(false);
    post({ type: 'drive', on: false });
    post({ type: 'route', coords: null });
    post({ type: 'stops', stops: [] });
  }, [post]);

  const setWaypoint = useCallback(async () => {
    if (!selected) return;
    const p = placeById[selected];
    const from = playerInDubai || DOWNTOWN;
    setRouting(true);
    const r = await fetchRoute([
      [from.lng, from.lat],
      [p.lng, p.lat],
    ]);
    setRouting(false);
    setRouteError(r.estimated);
    tap();
    setRoute({ ...r, targetId: p.id });
    post({ type: 'stops', stops: [] });
    post({ type: 'route', coords: r.coords, color: colors.waypoint, fit: true });
  }, [selected, playerInDubai, post]);

  const startDrive = useCallback(() => {
    if (!route) return;
    setSheet(null);
    arrivedRef.current = false;
    setGuidance(startGuidance(route));
    post({ type: 'drive', on: true });
    const from = playerInDubai || DOWNTOWN;
    post({ type: 'follow', lat: from.lat, lng: from.lng, bearing: playerInDubai?.heading ?? undefined });
  }, [route, playerInDubai, post]);

  const endDrive = useCallback(() => {
    setGuidance(null);
    setTilt(false);
    post({ type: 'drive', on: false });
    post({ type: 'tilt', on: false });
    if (route) post({ type: 'route', coords: route.coords, color: colors.waypoint, fit: true });
  }, [route, post]);

  const startMission = useCallback(
    async (id: string) => {
      const m = MISSIONS.find((x) => x.id === id)!;
      const pts: LngLat[] = m.stops.map((s) => [placeById[s].lng, placeById[s].lat]);
      setFocus({ kind: 'mission', id });
      post({ type: 'stops', stops: pts, color: m.color });
      setRouting(true);
      const r = await fetchRoute(pts);
      setRouting(false);
      setRoute({ ...r, targetId: `mission:${id}` });
      post({ type: 'route', coords: r.coords, color: m.color, fit: true });
    },
    [post],
  );

  const clearFocus = useCallback(() => {
    if (focus.kind === 'mission' || route?.targetId.startsWith('mission:')) clearRoute();
    if (sheet === 'shop') setSheet(null);
    setFocus({ kind: 'none' });
  }, [focus, route, clearRoute, sheet]);

  const openShop = useCallback(() => {
    setSelected(null);
    setSheet('shop');
    setFocus({ kind: 'shopping' });
  }, []);

  const openMission = useCallback((id: string) => {
    setDrawer(false);
    setSelected(null);
    setMissionId(id);
    setSheet('mission');
  }, []);

  const openLegend = useCallback((t: LegendTab) => {
    setLegendTab(t);
    setDrawer(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const setFocusFromDrawer = useCallback((f: Focus) => {
    setFocus(f);
    if (f.kind !== 'none') {
      setSheet(null);
      setSelected(null);
    }
  }, []);
  const closeSearch = useCallback(() => setSearch(false), []);
  const onSearchBrand = useCallback((id: string) => {
    setSearch(false);
    setSheet(null);
    setSelected(null);
    setFocus({ kind: 'brand', id });
  }, []);

  // ── objective subtitle ──
  const objective = useMemo<Objective | null>(() => {
    if (focus.kind === 'shopping') {
      if (!shoppingList.length) return { before: 'Add brands to your ', key: 'shopping list', after: '.', color: colors.pink };
      const r = rankMalls(shoppingList, playerInDubai);
      const full = r.filter((x) => !x.missing.length);
      return full.length
        ? { before: 'Go to ', key: full[0].mall.name, after: '. It has your whole list.', color: FULL }
        : { before: 'No mall has all of it. Start at ', key: r[0]?.mall.name ?? '—', after: '.', color: PARTIAL };
    }
    if (focus.kind === 'brand') {
      const b = brandById[focus.id];
      const p = playerInDubai;
      const nearest = p
        ? [...b.malls].sort((x, y) => distanceKm(p.lat, p.lng, placeById[x].lat, placeById[x].lng) - distanceKm(p.lat, p.lng, placeById[y].lat, placeById[y].lng))[0]
        : null;
      return nearest
        ? { before: `${b.name} is in ${b.malls.length} malls. Nearest: `, key: placeById[nearest].name, after: '.', color: brandCat[b.cat].color }
        : { before: 'Find ', key: b.name, after: ` in ${b.malls.length} ${b.malls.length === 1 ? 'mall' : 'malls'}.`, color: brandCat[b.cat].color };
    }
    if (focus.kind === 'brandCat') {
      const c = brandCat[focus.id as keyof typeof brandCat];
      return { before: '', key: c.label, after: ` in ${highlight ? Object.keys(highlight).length : 0} malls.`, color: c.color };
    }
    if (focus.kind === 'mission') {
      const m = MISSIONS.find((x) => x.id === focus.id)!;
      const next = m.stops.find((s) => !(missionDone[m.id] || []).includes(s));
      return next ? { before: 'Go to ', key: placeById[next].name, after: '.', color: m.color } : { before: '', key: 'Mission passed', after: '', color: m.color };
    }
    if (savedOnly) return { before: 'Showing your ', key: `${favs.length} saved ${favs.length === 1 ? 'place' : 'places'}`, after: '.', color: '#FF4D7A' };
    return null;
  }, [focus, shoppingList, playerInDubai, highlight, missionDone, savedOnly, favs.length]);

  const selectedPlace = selected ? placeById[selected] : null;

  const dest = !route
    ? ''
    : route.targetId.startsWith('mission:')
      ? (MISSIONS.find((m) => `mission:${m.id}` === route.targetId)?.title ?? 'Mission')
      : (placeById[route.targetId]?.name ?? '');
  const destPoint = useMemo(() => {
    if (!route) return null;
    const last = route.coords[route.coords.length - 1];
    return last ? { lng: last[0], lat: last[1], color: colors.waypoint } : null;
  }, [route]);

  const clearObjective = useCallback(() => {
    if (savedOnly && focus.kind === 'none') setSavedOnly(false);
    else clearFocus();
  }, [savedOnly, focus.kind, clearFocus]);

  const closeSheet = useCallback(() => {
    setSheet(null);
    setSelected(null);
    if (sheet === 'shop' && !shoppingList.length) setFocus({ kind: 'none' });
  }, [sheet, shoppingList.length]);

  const toggleMissionStop = useCallback(
    (pid: string) => {
      if (!missionId) return;
      setMissionDone((d) => {
        const cur = d[missionId] || [];
        const next = cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid];
        const m = MISSIONS.find((x) => x.id === missionId);
        if (m && next.length === m.stops.length && cur.length < next.length) success();
        return { ...d, [missionId]: next };
      });
    },
    [missionId, setMissionDone],
  );

  const showUI = fontsLoaded;
  return (
    <View style={{ flex: 1 }}>
      <NeonMap ref={map} onEvent={onEvent} />

      {!showUI ? null : guidance && route ? (
        <>
          <DriveHUD g={guidance} destination={dest} onEnd={endDrive} />
          {playerInDubai ? (
            <View style={[styles.radar, { bottom: insets.bottom + 96 }]} pointerEvents="none">
              <Radar lat={playerInDubai.lat} lng={playerInDubai.lng} heading={playerInDubai.heading ?? 0} visible={visible} dest={destPoint} />
            </View>
          ) : null}
        </>
      ) : (
        <>
          {/* top bar */}
          <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Dubai Maps" />
            <View style={styles.controls} pointerEvents="box-none">
              <View style={styles.zoomGroup}>
                <Pressable onPress={() => post({ type: 'zoom', delta: 1 })} style={({ pressed }) => [styles.zoomBtn, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel="Zoom in">
                  <Glyph icon="plus" size={20} />
                </Pressable>
                <View style={styles.zoomDivider} />
                <Pressable onPress={() => post({ type: 'zoom', delta: -1 })} style={({ pressed }) => [styles.zoomBtn, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel="Zoom out">
                  <Glyph icon="minus" size={20} />
                </Pressable>
              </View>
              <MapButton
                label="3D view"
                active={tilt}
                onPress={() => {
                  setTilt(!tilt);
                  post({ type: 'tilt', on: !tilt });
                }}
              >
                <T size={13} weight={700} color={tilt ? colors.ink : colors.text}>
                  3D
                </T>
              </MapButton>
              <MapButton
                label={playerInDubai ? 'Go to my location' : 'Show all of Dubai'}
                onPress={() => {
                  if (playerInDubai) post({ type: 'flyTo', lat: playerInDubai.lat, lng: playerInDubai.lng, zoom: 15 });
                  else post({ type: 'reset' });
                }}
              >
                <Glyph icon="locate" size={18} color={playerInDubai ? colors.text : colors.textDim} />
              </MapButton>
              {Math.abs(bearing) > 2 ? (
                <MapButton label="Point north" onPress={() => post({ type: 'north' })}>
                  <View style={{ transform: [{ rotate: `${-bearing}deg` }] }}>
                    <Glyph icon="compass" size={20} color={colors.pink} />
                  </View>
                </MapButton>
              ) : null}
            </View>
          </View>

          {/* legend edge tab */}
          {!drawer ? <EdgeTab onPress={() => openLegend('map')} count={savedOnly ? favs.length : PLACE_CATEGORIES.length - visible.length} savedOnly={savedOnly} /> : null}

          {/* objective subtitle + bottom dock */}
          {!sheet ? (
            <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
              {objective ? (
                <View style={styles.objectiveRow} pointerEvents="box-none">
                  <T size={16} weight={600} style={styles.objective}>
                    {objective.before}
                    <T size={16} weight={700} color={objective.color} style={styles.objective}>
                      {objective.key}
                    </T>
                    {objective.after}
                  </T>
                  <Pressable onPress={clearObjective} hitSlop={10} style={styles.objectiveClose} accessibilityRole="button" accessibilityLabel="Cancel">
                    <Glyph icon="close" size={12} color={colors.text} />
                  </Pressable>
                </View>
              ) : null}
              <View style={styles.dock}>
                <Pressable
                  onPress={() => setSearch(true)}
                  style={({ pressed }) => [styles.search, pressed && { opacity: 0.8 }]}
                  accessibilityRole="search"
                  accessibilityLabel="Search Dubai"
                >
                  <Glyph icon="search" size={18} color={colors.textDim} />
                  <T size={16} weight={500} color={colors.textDim}>
                    Search Dubai
                  </T>
                </Pressable>
                <MapButton label="Shopping run" onPress={openShop} badge={shoppingList.length || undefined} style={styles.dockBtn}>
                  <Glyph icon="bag" size={20} color={colors.text} />
                </MapButton>
                <MapButton label="Missions" onPress={() => openLegend('missions')} style={styles.dockBtn}>
                  <Glyph icon="star" size={20} color={colors.text} />
                </MapButton>
              </View>
            </View>
          ) : null}

          <Sheet
            open={!!sheet}
            peek={sheet === 'mission' ? 0.56 : sheet === 'shop' ? 0.6 : 0.46}
            onClose={closeSheet}
            contentKey={sheet === 'place' ? (selected ?? '') : (sheet ?? '')}
            label={sheet === 'place' ? (selectedPlace?.name ?? 'Place') : sheet === 'shop' ? 'Shopping run' : 'Mission'}
          >
            {sheet === 'place' && selectedPlace ? (
              <PlaceCard
                key={selectedPlace.id}
                place={selectedPlace}
                userLoc={playerInDubai}
                route={route}
                routing={routing}
                routeError={routeError}
                onWaypoint={setWaypoint}
                onClearRoute={clearRoute}
                onDrive={startDrive}
                shoppingList={shoppingList}
                toggleShopping={toggleShopping}
                onSelect={selectPlace}
                isFav={favs.includes(selectedPlace.id)}
                toggleFav={toggleFav}
              />
            ) : null}
            {sheet === 'shop' ? (
              <ShoppingPanel
                list={shoppingList}
                toggle={toggleShopping}
                clear={() => setShoppingList([])}
                userLoc={playerInDubai}
                onPickMall={(id) => {
                  setFocus({ kind: 'shopping' });
                  selectPlace(id);
                }}
              />
            ) : null}
            {sheet === 'mission' && missionId ? (
              <MissionPanel
                missionId={missionId}
                done={missionDone[missionId] || []}
                toggleStop={toggleMissionStop}
                active={focus.kind === 'mission' && focus.id === missionId}
                onStart={() => {
                  setSheet(null);
                  startMission(missionId);
                }}
                onStop={() => {
                  setSheet(null);
                  clearFocus();
                }}
                onSelect={(pid) => post({ type: 'flyTo', lat: placeById[pid].lat, lng: placeById[pid].lng, zoom: 15, pitch: 45 })}
              />
            ) : null}
          </Sheet>

          <LegendDrawer
            open={drawer}
            onClose={closeDrawer}
            visible={visible}
            setVisible={setVisible}
            favs={favs}
            savedOnly={savedOnly}
            setSavedOnly={setSavedOnly}
            onSelectPlace={selectPlace}
            userLoc={playerInDubai}
            focus={focus}
            setFocus={setFocusFromDrawer}
            shoppingList={shoppingList}
            toggleShopping={toggleShopping}
            missionDone={missionDone}
            openMission={openMission}
            tab={legendTab}
            setTab={setLegendTab}
          />

          {search ? <SearchOverlay onClose={closeSearch} onPlace={selectPlace} onBrand={onSearchBrand} favs={favs} userLoc={playerInDubai} /> : null}
        </>
      )}

      <Cover hidden={painted && fontsLoaded} />
    </View>
  );
}

/** Vertical tab on the left edge that opens the legend sidebar. */
const EdgeTab = memo(function EdgeTab({ onPress, count, savedOnly }: { onPress: () => void; count: number; savedOnly: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.edgeTab, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={count ? `Map legend, ${count} ${savedOnly ? 'saved' : 'hidden'}` : 'Map legend'}
      hitSlop={{ right: 8, top: 6, bottom: 6 }}
    >
      <Glyph icon="menu" size={16} color={colors.text} />
      <View style={styles.edgeLabelBox}>
        <Text maxFontSizeMultiplier={1} style={styles.edgeLabel}>
          LEGEND
        </Text>
      </View>
      {count ? <View style={[styles.edgeDot, savedOnly && { backgroundColor: '#FF4D7A' }]} /> : null}
    </Pressable>
  );
});

/** Splash-coloured cover with the logo that fades once the first map frame is painted. */
function Cover({ hidden }: { hidden: boolean }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000); // never block on slow tiles
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!hidden && !timedOut) return;
    Animated.timing(opacity, { toValue: 0, duration: 380, useNativeDriver: true }).start(() => setGone(true));
  }, [hidden, timedOut, opacity]);
  if (gone) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.cover, { opacity }]} pointerEvents="none">
      <Image source={require('../assets/logo.png')} style={{ width: 260, height: 116 }} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  logo: { width: 124, height: 55, marginTop: 2 },
  controls: { gap: 8, alignItems: 'flex-end' },
  zoomGroup: { width: 44, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  zoomBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginHorizontal: 8 },
  edgeTab: {
    position: 'absolute',
    left: 0,
    top: '40%',
    width: 34,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panel,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 0,
    borderColor: colors.hairline,
  },
  edgeLabelBox: { width: 16, height: 62, alignItems: 'center', justifyContent: 'center' },
  edgeLabel: { width: 62, textAlign: 'center', color: colors.text, fontFamily: fonts.heading, fontSize: 14, letterSpacing: 1.6, transform: [{ rotate: '90deg' }] },
  edgeDot: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.ink },
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  objective: { textAlign: 'center', flexShrink: 1, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  objectiveClose: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  dock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  dockBtn: { width: 50, height: 50 },
  radar: { position: 'absolute', left: 12 },
  cover: { backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});

