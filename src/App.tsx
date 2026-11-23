import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold_Italic } from '@expo-google-fonts/barlow-condensed/800ExtraBold_Italic';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriveHUD } from './components/DriveHUD';
import { LegendDrawer, type LegendTab } from './components/LegendDrawer';
import { MissionPanel } from './components/MissionPanel';
import { PlaceCard } from './components/PlaceCard';
import { SearchOverlay } from './components/SearchOverlay';
import { Sheet } from './components/Sheet';
import { ShoppingPanel } from './components/ShoppingPanel';
import { Glyph, MapButton, T, tap } from './components/ui';
import { ALL_PLACES, BRAND_CATEGORIES, BRANDS, ICON_PATHS, MALLS, MISSIONS, PLACE_CATEGORIES, brandById, brandCat, placeById, type PlaceCategory } from './data';
import { distanceKm, fetchRoute, type LngLat, type RouteResult } from './lib/geo';
import { startGuidance, updateGuidance, type Guidance } from './lib/guidance';
import { FULL, PARTIAL, rankMalls } from './lib/shopping';
import { NeonMap } from './map/NeonMap';
import type { HighlightItem, MapEvent, MapHandle } from './map/types';
import { usePersistent, type Focus } from './state/store';
import { colors, radius } from './theme/theme';

const DOWNTOWN = { lat: 25.1972, lng: 55.2744 };
type SheetKind = 'place' | 'shop' | 'mission' | null;

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
      <View style={{ flex: 1, backgroundColor: colors.ink }}>{fontsLoaded ? <MapScreen /> : null}</View>
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

function MapScreen() {
  const insets = useSafeAreaInsets();
  const map = useRef<MapHandle>(null);
  const [ready, setReady] = useState(false);

  const [visible, setVisible] = usePersistent<PlaceCategory[]>('visibleCats', PLACE_CATEGORIES.map((c) => c.id));
  const [shoppingList, setShoppingList] = usePersistent<string[]>('shoppingList', []);
  const [missionDone, setMissionDone] = usePersistent<Record<string, string[]>>('missionDone', {});

  const [focus, setFocus] = useState<Focus>({ kind: 'none' });
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [legendTab, setLegendTab] = useState<LegendTab>('map');
  const [search, setSearch] = useState(false);
  const [tilt, setTilt] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number; heading: number | null } | null>(null);
  const [route, setRoute] = useState<(RouteResult & { targetId: string }) | null>(null);
  const [routing, setRouting] = useState(false);
  const [guidance, setGuidance] = useState<Guidance | null>(null);

  const post = useCallback((msg: Record<string, unknown>) => map.current?.post(msg), []);

  // ── player location ──
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading });
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 8 }, (p) =>
          setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude, heading: p.coords.heading }),
        );
      } catch {
        // no location — the app still works
      }
    })();
    return () => sub?.remove();
  }, []);

  const playerInDubai = useMemo(
    () => (userLoc && distanceKm(userLoc.lat, userLoc.lng, DOWNTOWN.lat, DOWNTOWN.lng) < 120 ? userLoc : null),
    [userLoc],
  );

  // ── what glows on the map ──
  const highlight = useMemo<Record<string, HighlightItem> | null>(() => {
    if (focus.kind === 'shopping') {
      if (!shoppingList.length) return null;
      const items: Record<string, HighlightItem> = {};
      rankMalls(shoppingList, playerInDubai).forEach((r) => {
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
  }, [focus, shoppingList, playerInDubai]);

  // ── keep the map in sync ──
  useEffect(() => {
    if (!ready) return;
    post({
      type: 'init',
      categories: [...PLACE_CATEGORIES, ...BRAND_CATEGORIES].map((c) => ({ id: c.id, color: c.color, path: ICON_PATHS[c.icon] })),
      places: ALL_PLACES.map((p) => ({ id: p.id, name: p.name, cat: p.cat, lat: p.lat, lng: p.lng, featured: !!p.featured })),
    });
  }, [ready, post]);
  useEffect(() => {
    if (ready) post({ type: 'filter', visible });
  }, [ready, visible, post]);
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
    if (ready && playerInDubai) post({ type: 'me', lat: playerInDubai.lat, lng: playerInDubai.lng });
  }, [ready, playerInDubai, post]);

  // ── turn-by-turn: advance on every location fix ──
  const guiding = !!guidance;
  useEffect(() => {
    if (!guiding || !route || !playerInDubai) return;
    setGuidance((g) => (g ? updateGuidance(route, g, playerInDubai.lat, playerInDubai.lng) : g));
    post({ type: 'follow', lat: playerInDubai.lat, lng: playerInDubai.lng, bearing: playerInDubai.heading ?? undefined });
  }, [guiding, route, playerInDubai, post]);

  const onEvent = useCallback((e: MapEvent) => {
    if (e.type === 'ready') setReady(true);
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

  const selectPlace = useCallback((id: string) => {
    setSelected(id);
    setSheet('place');
    setSearch(false);
    setDrawer(false);
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setGuidance(null);
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
    setRoute({ ...r, targetId: p.id });
    post({ type: 'stops', stops: [] });
    post({ type: 'route', coords: r.coords, color: colors.waypoint, fit: true });
  }, [selected, playerInDubai, post]);

  const startDrive = useCallback(() => {
    if (!route) return;
    setSheet(null);
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

  const openShop = () => {
    setSelected(null);
    setSheet('shop');
    setFocus({ kind: 'shopping' });
  };

  const openMission = (id: string) => {
    setDrawer(false);
    setSelected(null);
    setMissionId(id);
    setSheet('mission');
  };

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
    return null;
  }, [focus, shoppingList, playerInDubai, highlight, missionDone]);

  const selectedPlace = selected ? placeById[selected] : null;

  const dest = !route
    ? ''
    : route.targetId.startsWith('mission:')
      ? (MISSIONS.find((m) => `mission:${m.id}` === route.targetId)?.title ?? 'Mission')
      : (placeById[route.targetId]?.name ?? '');

  return (
    <View style={{ flex: 1 }}>
      <NeonMap ref={map} onEvent={onEvent} />

      {guidance && route ? (
        <DriveHUD g={guidance} destination={dest} onEnd={endDrive} />
      ) : (
        <>
      {/* top bar */}
      <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <MapButton
          onPress={() => {
            setLegendTab('map');
            setDrawer(true);
          }}
        >
          <Glyph icon="menu" size={20} />
        </MapButton>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Dubai Maps" />
        <View style={styles.controls}>
          <MapButton
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
            onPress={() => {
              if (playerInDubai) post({ type: 'flyTo', lat: playerInDubai.lat, lng: playerInDubai.lng, zoom: 15 });
              else post({ type: 'reset' });
            }}
          >
            <Glyph icon="locate" size={18} color={playerInDubai ? colors.text : colors.textDim} />
          </MapButton>
        </View>
      </View>

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
              <Pressable onPress={clearFocus} hitSlop={10} style={styles.objectiveClose} accessibilityLabel="Cancel">
                <Glyph icon="close" size={12} color={colors.text} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.dock}>
            <Pressable onPress={() => setSearch(true)} style={({ pressed }) => [styles.search, pressed && { opacity: 0.8 }]}>
              <Glyph icon="search" size={18} color={colors.textDim} />
              <T size={16} weight={500} color={colors.textDim}>
                Search Dubai
              </T>
            </Pressable>
            <MapButton onPress={openShop} badge={shoppingList.length || undefined} style={styles.dockBtn}>
              <Glyph icon="bag" size={20} color={colors.text} />
            </MapButton>
            <MapButton
              onPress={() => {
                setLegendTab('missions');
                setDrawer(true);
              }}
              style={styles.dockBtn}
            >
              <Glyph icon="star" size={20} color={colors.text} />
            </MapButton>
          </View>
        </View>
      ) : null}

      <Sheet
        open={!!sheet}
        maxHeight={sheet === 'mission' ? 0.72 : 0.62}
        onClose={() => {
          setSheet(null);
          setSelected(null);
          if (sheet === 'shop' && !shoppingList.length) setFocus({ kind: 'none' });
        }}
      >
        {sheet === 'place' && selectedPlace ? (
          <PlaceCard
            key={selectedPlace.id}
            place={selectedPlace}
            userLoc={playerInDubai}
            route={route}
            routing={routing}
            onWaypoint={setWaypoint}
            onClearRoute={clearRoute}
            onDrive={startDrive}
            shoppingList={shoppingList}
            toggleShopping={toggleShopping}
            onSelect={selectPlace}
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
            toggleStop={(pid) =>
              setMissionDone((d) => {
                const cur = d[missionId] || [];
                return { ...d, [missionId]: cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid] };
              })
            }
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
        onClose={() => setDrawer(false)}
        visible={visible}
        setVisible={setVisible}
        focus={focus}
        setFocus={(f) => {
          setFocus(f);
          if (f.kind !== 'none') {
            setSheet(null);
            setSelected(null);
          }
        }}
        shoppingList={shoppingList}
        toggleShopping={toggleShopping}
        missionDone={missionDone}
        openMission={openMission}
        tab={legendTab}
        setTab={setLegendTab}
      />

      {search ? (
        <SearchOverlay
          onClose={() => setSearch(false)}
          onPlace={selectPlace}
          onBrand={(id) => {
            setSearch(false);
            setSheet(null);
            setSelected(null);
            setFocus({ kind: 'brand', id });
          }}
        />
      ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  logo: { width: 112, height: 57, marginTop: -2 },
  controls: { gap: 8 },
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
});
