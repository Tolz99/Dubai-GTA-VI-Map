import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { Rajdhani_500Medium } from '@expo-google-fonts/rajdhani/500Medium';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani/600SemiBold';
import { Rajdhani_700Bold } from '@expo-google-fonts/rajdhani/700Bold';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegendDrawer, type LegendTab } from './components/LegendDrawer';
import { MissionPanel } from './components/MissionPanel';
import { PlaceCard } from './components/PlaceCard';
import { SearchOverlay } from './components/SearchOverlay';
import { Sheet } from './components/Sheet';
import { ShoppingPanel } from './components/ShoppingPanel';
import { Body, Display, Glyph, RoundButton, SunsetBar, tap } from './components/ui';
import {
  ALL_PLACES,
  BRAND_CATEGORIES,
  BRANDS,
  ICON_PATHS,
  MALLS,
  MISSIONS,
  PLACE_CATEGORIES,
  brandById,
  brandCat,
  placeById,
  placeCat,
  type PlaceCategory,
} from './data';
import { distanceKm, fetchRoute, type LngLat, type RouteResult } from './lib/geo';
import { FULL, PARTIAL, rankMalls } from './lib/shopping';
import { NeonMap } from './map/NeonMap';
import type { HighlightItem, MapEvent, MapHandle } from './map/types';
import { usePersistent, type Focus } from './state/store';
import { APP_NAME, APP_TAGLINE, colors } from './theme/theme';

const DOWNTOWN = { lat: 25.1972, lng: 55.2744 };
type SheetKind = 'place' | 'shop' | 'mission' | null;

export default function App() {
  const [fontsLoaded] = useFonts({ Anton_400Regular, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.ink }}>{fontsLoaded ? <Game /> : null}</View>
    </SafeAreaProvider>
  );
}

function Game() {
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
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<(RouteResult & { targetId: string }) | null>(null);
  const [routing, setRouting] = useState(false);

  const post = useCallback((msg: Record<string, unknown>) => map.current?.post(msg), []);

  // ── player location ──
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 25 }, (p) =>
          setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
        );
      } catch {
        // location unavailable — app still works
      }
    })();
    return () => sub?.remove();
  }, []);

  // Only treat the player as "in Dubai" if they are within ~120 km.
  const playerInDubai = userLoc && distanceKm(userLoc.lat, userLoc.lng, DOWNTOWN.lat, DOWNTOWN.lng) < 120 ? userLoc : null;

  // ── highlight (what glows on the map) ──
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
      const c = brandCat[b.cat];
      return Object.fromEntries(b.malls.map((m) => [m, { color: c.color, badge: b.name, icon: b.cat }]));
    }
    if (focus.kind === 'brandCat') {
      const c = brandCat[focus.id as keyof typeof brandCat];
      const items: Record<string, HighlightItem> = {};
      MALLS.forEach((m) => {
        const n = BRANDS.filter((b) => b.cat === focus.id && b.malls.includes(m.id)).length;
        if (n) items[m.id] = { color: c.color, badge: `${n} ${c.short}`, icon: c.id };
      });
      return items;
    }
    if (focus.kind === 'mission') {
      const m = MISSIONS.find((x) => x.id === focus.id);
      if (!m) return null;
      return Object.fromEntries(m.stops.map((s) => [s, { color: m.color }]));
    }
    return null;
  }, [focus, shoppingList, playerInDubai]);

  // ── sync with map ──
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
  const toggleShopping = useCallback(
    (id: string) => setShoppingList((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])),
    [setShoppingList],
  );

  const selectPlace = useCallback((id: string) => {
    setSelected(id);
    setSheet('place');
    setSearch(false);
    setDrawer(false);
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
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
    if (focus.kind === 'shopping' && sheet === 'shop') setSheet(null);
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

  // ── objective banner ──
  const objective = useMemo(() => {
    if (focus.kind === 'shopping') {
      if (!shoppingList.length) return { color: colors.pink, title: 'Shopping Run', text: 'Add brands to your list.' };
      const r = rankMalls(shoppingList, playerInDubai);
      const full = r.filter((x) => !x.missing.length);
      return {
        color: full.length ? FULL : PARTIAL,
        title: 'Shopping Run',
        text: full.length ? `Go to ${full[0].mall.name}. ${full.length} ${full.length === 1 ? 'mall has' : 'malls have'} your full list.` : `No mall has all ${shoppingList.length}. Best: ${r[0]?.mall.name ?? '—'}.`,
      };
    }
    if (focus.kind === 'brand') {
      const b = brandById[focus.id];
      const c = brandCat[b.cat];
      const nearest = playerInDubai
        ? [...b.malls].sort((x, y) => distanceKm(playerInDubai.lat, playerInDubai.lng, placeById[x].lat, placeById[x].lng) - distanceKm(playerInDubai.lat, playerInDubai.lng, placeById[y].lat, placeById[y].lng))[0]
        : null;
      return {
        color: c.color,
        title: b.name,
        text: `In ${b.malls.length} ${b.malls.length === 1 ? 'mall' : 'malls'}.${nearest ? ` Nearest: ${placeById[nearest].name}.` : ' Tap a glowing blip.'}`,
      };
    }
    if (focus.kind === 'brandCat') {
      const c = brandCat[focus.id as keyof typeof brandCat];
      return { color: c.color, title: c.label, text: `${highlight ? Object.keys(highlight).length : 0} malls. Badge = number of stores.` };
    }
    if (focus.kind === 'mission') {
      const m = MISSIONS.find((x) => x.id === focus.id)!;
      const next = m.stops.find((s) => !(missionDone[m.id] || []).includes(s));
      return { color: m.color, title: `Mission ${m.number}: ${m.title}`, text: next ? `Go to ${placeById[next].name}.` : 'Mission passed!' };
    }
    return null;
  }, [focus, shoppingList, playerInDubai, highlight, missionDone]);

  const selectedPlace = selected ? placeById[selected] : null;
  const sheetAccent =
    sheet === 'place' && selectedPlace
      ? placeCat[selectedPlace.cat].color
      : sheet === 'mission' && missionId
        ? MISSIONS.find((m) => m.id === missionId)!.color
        : colors.pink;

  return (
    <View style={{ flex: 1 }}>
      <NeonMap ref={map} onEvent={onEvent} />

      {/* ── top HUD ── */}
      <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <RoundButton
            onPress={() => {
              setLegendTab('map');
              setDrawer(true);
            }}
          >
            <Glyph icon="menu" size={22} />
          </RoundButton>
          <View style={styles.titleBox} pointerEvents="none">
            <Display size={26} style={styles.titleShadow}>
              {APP_NAME}
            </Display>
            <SunsetBar style={{ width: 120, marginTop: 1 }} height={2} />
            <Body size={10} weight="bold" color={colors.textDim} style={{ letterSpacing: 2.5, marginTop: 3 }}>
              {APP_TAGLINE}
            </Body>
          </View>
          <RoundButton onPress={() => setSearch(true)}>
            <Glyph icon="search" size={21} />
          </RoundButton>
        </View>

        {objective ? (
          <View style={[styles.objective, { borderLeftColor: objective.color }]}>
            <View style={{ flex: 1 }}>
              <Display size={15} color={objective.color} numberOfLines={1}>
                {objective.title}
              </Display>
              <Body size={14} weight="semi" numberOfLines={2}>
                {objective.text}
              </Body>
            </View>
            <Pressable onPress={clearFocus} hitSlop={10} style={{ padding: 4 }}>
              <Glyph icon="close" size={16} color={colors.textDim} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ── right controls ── */}
      <View style={[styles.right, { top: insets.top + (objective ? 150 : 92) }]} pointerEvents="box-none">
        <RoundButton
          active={tilt}
          onPress={() => {
            setTilt(!tilt);
            post({ type: 'tilt', on: !tilt });
          }}
        >
          <Glyph icon="cube" size={20} color={tilt ? colors.cyan : colors.text} />
        </RoundButton>
        <RoundButton
          onPress={() => {
            if (playerInDubai) post({ type: 'flyTo', lat: playerInDubai.lat, lng: playerInDubai.lng, zoom: 14.5 });
            else post({ type: 'reset' });
          }}
        >
          <Glyph icon="locate" size={20} color={playerInDubai ? colors.cyan : colors.text} />
        </RoundButton>
        <RoundButton
          onPress={() => {
            setTilt(false);
            post({ type: 'reset' });
          }}
        >
          <Glyph icon="compass" size={20} color={colors.pink} />
        </RoundButton>
      </View>

      {/* ── bottom bar ── */}
      {!sheet ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              tap();
              openShop();
            }}
            style={({ pressed }) => [styles.bigBtn, { borderColor: colors.pink }, pressed && styles.pressed]}
          >
            <Glyph icon="bag" size={20} color={colors.pink} />
            <Display size={17}>Shopping Run</Display>
            {shoppingList.length ? (
              <View style={styles.count}>
                <Body size={12} weight="bold" color={colors.ink}>
                  {shoppingList.length}
                </Body>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => {
              tap();
              setLegendTab('missions');
              setDrawer(true);
            }}
            style={({ pressed }) => [styles.bigBtn, { borderColor: colors.yellow }, pressed && styles.pressed]}
          >
            <Glyph icon="star" size={20} color={colors.yellow} />
            <Display size={17}>Missions</Display>
          </Pressable>
        </View>
      ) : null}

      <Sheet
        open={!!sheet}
        accent={sheetAccent}
        maxHeight={sheet === 'mission' ? 0.7 : 0.62}
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
            route={route?.targetId === `mission:${missionId}` ? route : null}
            onStart={() => {
              setSheet(null);
              startMission(missionId);
            }}
            onStop={clearFocus}
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
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBox: { alignItems: 'center' },
  titleShadow: { textShadowColor: 'rgba(255,61,139,0.85)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  objective: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: colors.panel,
    borderLeftWidth: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 3,
  },
  right: { position: 'absolute', right: 14, gap: 10 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  bigBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderRadius: 3,
    transform: [{ skewX: '-8deg' }],
  },
  pressed: { opacity: 0.8, transform: [{ skewX: '-8deg' }, { scale: 0.97 }] },
  count: { backgroundColor: colors.pink, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
});
