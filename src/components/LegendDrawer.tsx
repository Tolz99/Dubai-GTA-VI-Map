import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_PLACES, BRAND_CATEGORIES, BRANDS, MISSIONS, PLACE_CATEGORIES, STATS, placeCat, type BrandCategory, type PlaceCategory } from '../data';
import { fmtKm } from '../lib/geo';
import { searchPlaces } from '../lib/search';
import type { Focus } from '../state/store';
import { colors, fonts, radius } from '../theme/theme';
import { Blip, Divider, Glyph, H, Label, MAX_FONT_SCALE, T, tap } from './ui';

export type LegendTab = 'map' | 'shops' | 'missions';

interface Props {
  open: boolean;
  onClose: () => void;
  visible: PlaceCategory[];
  setVisible: (v: PlaceCategory[]) => void;
  favs: string[];
  savedOnly: boolean;
  setSavedOnly: (v: boolean) => void;
  onSelectPlace: (id: string) => void;
  userLoc: { lat: number; lng: number } | null;
  focus: Focus;
  setFocus: (f: Focus) => void;
  shoppingList: string[];
  toggleShopping: (brandId: string) => void;
  missionDone: Record<string, string[]>;
  openMission: (id: string) => void;
  tab: LegendTab;
  setTab: (t: LegendTab) => void;
}

const TABS: [LegendTab, string][] = [
  ['map', 'Legend'],
  ['shops', 'Shops'],
  ['missions', 'Missions'],
];

/** Legend groups (sidebar sections). */
const GROUPS: { title: string; cats: PlaceCategory[] }[] = [
  { title: 'Sights', cats: ['attraction', 'theme', 'culture'] },
  { title: 'Shopping', cats: ['mall', 'souk'] },
  { title: 'Eat & drink', cats: ['food', 'cafe'] },
  { title: 'Outdoors', cats: ['beach', 'park'] },
  { title: 'Stay', cats: ['hotel'] },
];

export const LegendDrawer = memo(function LegendDrawer(p: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const w = Math.min(360, width * 0.88);
  const [x] = useState(() => new Animated.Value(-w));
  const [mounted, setMounted] = useState(p.open);
  if (p.open && !mounted) setMounted(true);
  const onClose = useRef(p.onClose);
  useLayoutEffect(() => {
    onClose.current = p.onClose;
  });

  useEffect(() => {
    Animated.spring(x, { toValue: p.open ? 0 : -w, useNativeDriver: true, damping: 30, stiffness: 300, mass: 0.9 }).start(({ finished }) => {
      if (finished && !p.open) setMounted(false);
    });
  }, [p.open, w, x]);

  // Swipe left to close. (Handlers run on gestures only; the lint rule can't tell.)
  const pan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_e, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_e, g) => x.setValue(Math.min(0, g.dx)),
        onPanResponderRelease: (_e, g) => {
          if (g.dx < -w * 0.3 || g.vx < -0.6) onClose.current();
          else Animated.spring(x, { toValue: 0, useNativeDriver: true, damping: 30, stiffness: 300 }).start();
        },
      }),
    [x, w],
  );

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: x.interpolate({ inputRange: [-w, 0], outputRange: [0, 1] }) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} accessibilityLabel="Close legend" />
      </Animated.View>
      <Animated.View style={[styles.drawer, { width: w, paddingTop: insets.top + 10, transform: [{ translateX: x }] }]} {...pan.panHandlers}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Dubai Maps" />
          <Pressable onPress={p.onClose} hitSlop={12} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close legend">
            <Glyph icon="close" size={16} color={colors.textDim} />
          </Pressable>
        </View>
        <T size={12} color={colors.textMute} style={{ paddingHorizontal: 16, marginTop: 2 }}>
          {STATS.places} places · {STATS.brands} brands · {STATS.stores} store listings
        </T>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map(([id, label]) => {
            const on = p.tab === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  tap();
                  p.setTab(id);
                }}
                style={[styles.tab, on && styles.tabOn]}
              >
                <H size={16} color={on ? colors.ink : colors.textDim}>
                  {label}
                </H>
              </Pressable>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {p.tab === 'map' && <MapTab {...p} />}
          {p.tab === 'shops' && <ShopsTab {...p} />}
          {p.tab === 'missions' && <MissionsTab {...p} />}
        </ScrollView>
      </Animated.View>
    </View>
  );
});

const COUNTS: Record<string, number> = {};
ALL_PLACES.forEach((pl) => (COUNTS[pl.cat] = (COUNTS[pl.cat] || 0) + 1));

function MapTab({ visible, setVisible, favs, savedOnly, setSavedOnly, onSelectPlace, userLoc }: Props) {
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const results = useMemo(() => (q.trim() ? searchPlaces(q, userLoc).slice(0, 12) : []), [q, userLoc]);
  const toggle = (ids: PlaceCategory[], on: boolean) => {
    tap();
    setVisible(on ? Array.from(new Set([...visible, ...ids])) : visible.filter((v) => !ids.includes(v)));
  };

  return (
    <View style={{ paddingHorizontal: 12 }}>
      <View style={styles.searchBar}>
        <Glyph icon="search" size={17} color={colors.textMute} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search locations"
          placeholderTextColor={colors.textMute}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          accessibilityLabel="Search locations"
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear search">
            <Glyph icon="close" size={15} color={colors.textMute} />
          </Pressable>
        ) : null}
      </View>

      {q.trim() ? (
        <View style={{ marginTop: 6 }}>
          {results.length ? (
            results.map(({ place: pl, km }) => {
              const c = placeCat[pl.cat];
              return (
                <Pressable key={pl.id} onPress={() => onSelectPlace(pl.id)} style={({ pressed }) => [styles.resultRow, pressed && styles.rowPressed]} accessibilityRole="button">
                  <Blip color={c.color} icon={c.icon} size={24} />
                  <View style={{ flex: 1 }}>
                    <T size={14.5} weight={600} numberOfLines={1}>
                      {pl.name}
                    </T>
                    <T size={12} color={colors.textDim} numberOfLines={1}>
                      {c.label} · {pl.area}
                    </T>
                  </View>
                  {km != null ? (
                    <T size={12} color={colors.textMute}>
                      {fmtKm(km)}
                    </T>
                  ) : null}
                </Pressable>
              );
            })
          ) : (
            <T size={13.5} color={colors.textDim} style={{ padding: 12 }}>
              Nothing matches “{q.trim()}”. Try a brand in the Shops tab.
            </T>
          )}
        </View>
      ) : (
        <>
          <View style={styles.btnRow}>
            <Pressable onPress={() => toggle(PLACE_CATEGORIES.map((c) => c.id), true)} style={({ pressed }) => [styles.outlineBtn, pressed && styles.rowPressed]} accessibilityRole="button">
              <T size={13.5} weight={600}>
                Show all
              </T>
            </Pressable>
            <Pressable onPress={() => toggle(PLACE_CATEGORIES.map((c) => c.id), false)} style={({ pressed }) => [styles.outlineBtn, pressed && styles.rowPressed]} accessibilityRole="button">
              <T size={13.5} weight={600}>
                Hide all
              </T>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              tap();
              setSavedOnly(!savedOnly);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: savedOnly }}
            accessibilityLabel={`Show only saved places, ${favs.length} saved`}
            style={[styles.savedBtn, savedOnly && styles.savedBtnOn]}
          >
            <Glyph icon={savedOnly ? 'heart' : 'heartOutline'} size={17} color={savedOnly ? colors.ink : '#FF4D7A'} />
            <T size={13.5} weight={600} color={savedOnly ? colors.ink : colors.text} style={{ flex: 1 }}>
              {savedOnly ? 'Showing saved only' : 'Saved places only'}
            </T>
            <T size={12.5} weight={600} color={savedOnly ? colors.ink : colors.textMute}>
              {favs.length}
            </T>
          </Pressable>

          {GROUPS.map((g) => {
            const allOn = g.cats.every((c) => visible.includes(c));
            const isCollapsed = collapsed[g.title];
            return (
              <View key={g.title} style={{ marginTop: 14 }}>
                <View style={styles.groupHead}>
                  <Pressable
                    onPress={() => setCollapsed((s) => ({ ...s, [g.title]: !s[g.title] }))}
                    hitSlop={6}
                    style={styles.groupTitle}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: !isCollapsed }}
                  >
                    <View style={{ transform: [{ rotate: isCollapsed ? '0deg' : '90deg' }] }}>
                      <Glyph icon="chev" size={13} color={colors.textMute} />
                    </View>
                    <Label>{g.title}</Label>
                  </Pressable>
                  <Pressable
                    onPress={() => toggle(g.cats, !allOn)}
                    hitSlop={10}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: allOn }}
                    accessibilityLabel={`${g.title} on map`}
                  >
                    <Glyph icon={allOn ? 'eye' : 'eyeOff'} size={18} color={allOn ? colors.text : colors.textMute} />
                  </Pressable>
                </View>
                {!isCollapsed
                  ? g.cats.map((id) => {
                      const c = placeCat[id];
                      const on = visible.includes(id);
                      return (
                        <Pressable
                          key={id}
                          onPress={() => toggle([id], !on)}
                          onLongPress={() => {
                            tap();
                            setVisible([id]);
                          }}
                          accessibilityRole="switch"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={`${c.label}, ${COUNTS[id] || 0} places`}
                          accessibilityHint="Long-press to show only this category"
                          style={({ pressed }) => [styles.catRow, on && styles.catRowOn, pressed && styles.rowPressed]}
                        >
                          <Blip color={c.color} icon={c.icon} size={26} dim={!on} />
                          <T size={15} weight={600} color={on ? colors.text : colors.textMute} style={{ flex: 1 }}>
                            {c.label}
                          </T>
                          <View style={[styles.countPill, on && { backgroundColor: c.color }]}>
                            <T size={12} weight={700} color={on ? colors.ink : colors.textMute} style={{ fontVariant: ['tabular-nums'] }}>
                              {COUNTS[id] || 0}
                            </T>
                          </View>
                        </Pressable>
                      );
                    })
                  : null}
              </View>
            );
          })}
          <T size={12} color={colors.textMute} style={{ paddingHorizontal: 6, paddingTop: 14 }}>
            Long-press a category to show only that one.
          </T>
        </>
      )}
    </View>
  );
}

function ShopsTab({ focus, setFocus, shoppingList, toggleShopping, onClose }: Props) {
  const [open, setOpen] = useState<BrandCategory | null>('fashion');
  return (
    <View>
      <View style={styles.sectionHead}>
        <Label>Tap a brand to find it · + adds to list</Label>
      </View>
      {BRAND_CATEGORIES.map((c) => {
        const brands = BRANDS.filter((b) => b.cat === c.id).sort((a, b) => a.name.localeCompare(b.name));
        const isOpen = open === c.id;
        const catOn = focus.kind === 'brandCat' && focus.id === c.id;
        return (
          <View key={c.id}>
            <Pressable
              onPress={() => {
                tap();
                setOpen(isOpen ? null : c.id);
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Blip color={c.color} icon={c.icon} size={26} />
              <T size={15} weight={600} style={{ flex: 1 }}>
                {c.label}
              </T>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  tap();
                  setFocus(catOn ? { kind: 'none' } : { kind: 'brandCat', id: c.id });
                  if (!catOn) onClose();
                }}
                style={[styles.pill, catOn && styles.pillOn]}
              >
                <T size={11.5} weight={600} color={catOn ? colors.ink : colors.text}>
                  {catOn ? 'Showing' : 'Show all'}
                </T>
              </Pressable>
              <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }], marginLeft: 4 }}>
                <Glyph icon="chev" size={16} color={colors.textMute} />
              </View>
            </Pressable>
            {isOpen ? (
              <View style={styles.brandList}>
                {brands.map((b) => {
                  const inList = shoppingList.includes(b.id);
                  const tracked = focus.kind === 'brand' && focus.id === b.id;
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => {
                        tap();
                        setFocus({ kind: 'brand', id: b.id });
                        onClose();
                      }}
                      style={({ pressed }) => [styles.brandRow, tracked && styles.brandRowOn, pressed && styles.rowPressed]}
                    >
                      <T size={14.5} weight={500} color={tracked ? colors.ink : colors.text} style={{ flex: 1 }} numberOfLines={1}>
                        {b.name}
                      </T>
                      <T size={12.5} color={tracked ? colors.ink : colors.textMute}>
                        {b.malls.length} {b.malls.length === 1 ? 'mall' : 'malls'}
                      </T>
                      <Pressable
                        hitSlop={10}
                        accessibilityLabel={inList ? `Remove ${b.name} from list` : `Add ${b.name} to list`}
                        onPress={() => {
                          tap();
                          toggleShopping(b.id);
                        }}
                        style={[styles.add, inList && styles.addOn]}
                      >
                        <Glyph icon={inList ? 'check' : 'plus'} size={14} color={inList ? colors.ink : colors.text} />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <Divider style={{ marginLeft: 20 }} />
          </View>
        );
      })}
    </View>
  );
}

function MissionsTab({ missionDone, openMission }: Props) {
  const total = MISSIONS.reduce((n, m) => n + m.stops.length, 0);
  const done = MISSIONS.reduce((n, m) => n + (missionDone[m.id]?.length || 0), 0);
  const pct = Math.round((done / total) * 100);
  return (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label>Dubai completion</Label>
          <H size={22}>{pct}%</H>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      </View>
      {MISSIONS.map((m) => {
        const d = missionDone[m.id]?.length || 0;
        const complete = d === m.stops.length;
        return (
          <Pressable
            key={m.id}
            onPress={() => {
              tap();
              openMission(m.id);
            }}
            style={({ pressed }) => [styles.mission, pressed && styles.rowPressed]}
          >
            <View style={[styles.missionBadge, { backgroundColor: m.color }]}>
              {complete ? <Glyph icon="check" size={16} color={colors.ink} /> : <H size={17} color={colors.ink}>{m.number}</H>}
            </View>
            <View style={{ flex: 1 }}>
              <H size={17}>{m.title}</H>
              <T size={12.5} color={colors.textDim} numberOfLines={1}>
                {m.subtitle}
              </T>
            </View>
            <T size={12.5} weight={600} color={complete ? colors.green : colors.textMute}>
              {d}/{m.stops.length}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.raised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, marginTop: 14 },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 15, height: 44, outlineWidth: 0 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 8, borderRadius: radius.sm },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  outlineBtn: { flex: 1, height: 38, borderRadius: radius.sm + 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  savedBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 40, marginTop: 8, paddingHorizontal: 12, borderRadius: radius.sm + 2, backgroundColor: colors.raised },
  savedBtnOn: { backgroundColor: colors.text },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6 },
  groupTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, minHeight: 46, borderRadius: radius.sm + 2, marginBottom: 4, borderWidth: 1, borderColor: colors.hairline },
  catRowOn: { backgroundColor: colors.raised, borderColor: 'transparent' },
  countPill: { minWidth: 30, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: colors.raisedHi, alignItems: 'center', justifyContent: 'center' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.panel, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.hairline },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  logo: { width: 132, height: 66 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 12, marginTop: 12, marginBottom: 4, backgroundColor: colors.raised, borderRadius: 6, padding: 3 },
  tab: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  tabOn: { backgroundColor: colors.text },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, minHeight: 48 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  count: { fontVariant: ['tabular-nums'], minWidth: 20, textAlign: 'right' },
  toggle: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.text, borderColor: colors.text },
  pill: { height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.raisedHi, justifyContent: 'center' },
  pillOn: { backgroundColor: colors.text },
  brandList: { paddingBottom: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 60, paddingRight: 20, minHeight: 42 },
  brandRowOn: { backgroundColor: colors.text },
  add: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.raisedHi, alignItems: 'center', justifyContent: 'center' },
  addOn: { backgroundColor: colors.text },
  track: { height: 4, backgroundColor: colors.raised, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.text },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, minHeight: 60 },
  missionBadge: { width: 34, height: 34, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
});
