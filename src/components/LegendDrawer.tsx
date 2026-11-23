import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ALL_PLACES,
  BRAND_CATEGORIES,
  BRANDS,
  MISSIONS,
  PLACE_CATEGORIES,
  STATS,
  type BrandCategory,
  type PlaceCategory,
} from '../data';
import type { Focus } from '../state/store';
import { APP_NAME, colors } from '../theme/theme';
import { Blip, Body, Display, Glyph, SunsetBar, tap } from './ui';

export type LegendTab = 'map' | 'shops' | 'missions';
type Tab = LegendTab;

interface Props {
  open: boolean;
  onClose: () => void;
  visible: PlaceCategory[];
  setVisible: (v: PlaceCategory[]) => void;
  focus: Focus;
  setFocus: (f: Focus) => void;
  shoppingList: string[];
  toggleShopping: (brandId: string) => void;
  missionDone: Record<string, string[]>;
  openMission: (id: string) => void;
  tab: LegendTab;
  setTab: (t: LegendTab) => void;
}

export function LegendDrawer(p: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const w = Math.min(380, width * 0.88);
  const x = useRef(new Animated.Value(-w)).current;
  const { tab, setTab } = p;
  const [mounted, setMounted] = useState(p.open);

  useEffect(() => {
    if (p.open) setMounted(true);
    Animated.timing(x, { toValue: p.open ? 0 : -w, duration: 240, useNativeDriver: true }).start(() => {
      if (!p.open) setMounted(false);
    });
  }, [p.open, w, x]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: x.interpolate({ inputRange: [-w, 0], outputRange: [0, 1] }) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { width: w, paddingTop: insets.top + 10, transform: [{ translateX: x }] }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Display size={30} color={colors.text}>
              {APP_NAME}
            </Display>
            <Body size={12} color={colors.textDim} weight="semi" style={{ letterSpacing: 1.5 }}>
              {STATS.places} LOCATIONS • {STATS.brands} BRANDS • {STATS.stores} STORES
            </Body>
          </View>
          <Pressable onPress={p.onClose} hitSlop={12} style={{ padding: 6 }}>
            <Glyph icon="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>
        <SunsetBar style={{ marginHorizontal: 18, marginTop: 10 }} />
        <View style={styles.tabs}>
          {(
            [
              ['map', 'MAP LEGEND'],
              ['shops', 'SHOPS'],
              ['missions', 'MISSIONS'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => {
                tap();
                setTab(id);
              }}
              style={[styles.tab, tab === id && styles.tabActive]}
            >
              <Display size={15} color={tab === id ? colors.ink : colors.textDim}>
                {label}
              </Display>
            </Pressable>
          ))}
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
          {tab === 'map' && <MapTab {...p} />}
          {tab === 'shops' && <ShopsTab {...p} />}
          {tab === 'missions' && <MissionsTab {...p} />}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function MapTab({ visible, setVisible }: Props) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    ALL_PLACES.forEach((pl) => (c[pl.cat] = (c[pl.cat] || 0) + 1));
    return c;
  }, []);
  const all = visible.length === PLACE_CATEGORIES.length;
  return (
    <View>
      <View style={styles.sectionHead}>
        <Body size={12} color={colors.textMute} weight="bold" style={{ letterSpacing: 2 }}>
          BLIPS ON MAP
        </Body>
        <Pressable
          onPress={() => {
            tap();
            setVisible(all ? [] : PLACE_CATEGORIES.map((c) => c.id));
          }}
        >
          <Body size={12} color={colors.cyan} weight="bold" style={{ letterSpacing: 1.5 }}>
            {all ? 'HIDE ALL' : 'SHOW ALL'}
          </Body>
        </Pressable>
      </View>
      {PLACE_CATEGORIES.map((c) => {
        const on = visible.includes(c.id);
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              tap();
              setVisible(on ? visible.filter((v) => v !== c.id) : [...visible, c.id]);
            }}
            onLongPress={() => setVisible([c.id])}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Blip color={c.color} icon={c.icon} size={30} dim={!on} />
            <Body size={17} weight="semi" color={on ? colors.text : colors.textMute} style={{ flex: 1 }}>
              {c.label}
            </Body>
            <Body size={14} color={colors.textMute} weight="bold">
              {counts[c.id] || 0}
            </Body>
            <View style={[styles.check, on && { backgroundColor: c.color, borderColor: c.color }]}>
              {on ? <Glyph icon="check" size={14} color={colors.ink} /> : null}
            </View>
          </Pressable>
        );
      })}
      <Body size={12} color={colors.textMute} style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        Tip: long-press a category to show only that one.
      </Body>
    </View>
  );
}

function ShopsTab({ focus, setFocus, shoppingList, toggleShopping, onClose }: Props) {
  const [open, setOpen] = useState<BrandCategory | null>('fashion');
  return (
    <View>
      <View style={styles.sectionHead}>
        <Body size={12} color={colors.textMute} weight="bold" style={{ letterSpacing: 2 }}>
          TAP A BRAND TO FIND IT • + TO ADD TO LIST
        </Body>
      </View>
      {BRAND_CATEGORIES.map((c) => {
        const brands = BRANDS.filter((b) => b.cat === c.id).sort((a, b) => a.name.localeCompare(b.name));
        const isOpen = open === c.id;
        const catFocused = focus.kind === 'brandCat' && focus.id === c.id;
        return (
          <View key={c.id}>
            <Pressable
              onPress={() => {
                tap();
                setOpen(isOpen ? null : c.id);
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Blip color={c.color} icon={c.icon} size={30} />
              <Body size={17} weight="semi" style={{ flex: 1 }}>
                {c.label}
              </Body>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  tap();
                  setFocus(catFocused ? { kind: 'none' } : { kind: 'brandCat', id: c.id });
                  if (!catFocused) onClose();
                }}
                style={[styles.mini, { borderColor: c.color }, catFocused && { backgroundColor: c.color }]}
              >
                <Body size={11} weight="bold" color={catFocused ? colors.ink : c.color} style={{ letterSpacing: 1 }}>
                  {catFocused ? 'SHOWN' : 'SHOW'}
                </Body>
              </Pressable>
              <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
                <Glyph icon="chev" size={16} color={colors.textMute} />
              </View>
            </Pressable>
            {isOpen &&
              brands.map((b) => {
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
                    style={({ pressed }) => [styles.brandRow, pressed && styles.rowPressed, tracked && { backgroundColor: c.color + '22' }]}
                  >
                    <View style={[styles.brandDot, { backgroundColor: c.color }]} />
                    <Body size={16} weight="semi" style={{ flex: 1 }} numberOfLines={1}>
                      {b.name}
                    </Body>
                    <Body size={13} color={colors.textMute} weight="semi">
                      {b.malls.length} {b.malls.length === 1 ? 'mall' : 'malls'}
                    </Body>
                    <Pressable
                      hitSlop={10}
                      onPress={() => {
                        tap();
                        toggleShopping(b.id);
                      }}
                      style={[styles.plus, inList && { backgroundColor: colors.pink, borderColor: colors.pink }]}
                    >
                      <Glyph icon={inList ? 'check' : 'plus'} size={14} color={inList ? colors.ink : colors.pink} />
                    </Pressable>
                  </Pressable>
                );
              })}
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
      <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Body size={12} color={colors.textMute} weight="bold" style={{ letterSpacing: 2 }}>
            CITY COMPLETION
          </Body>
          <Display size={26} color={colors.yellow}>
            {pct}%
          </Display>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(pct, 1)}%` }]} />
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
            <View style={[styles.missionNum, { borderColor: m.color }, complete && { backgroundColor: m.color }]}>
              {complete ? <Glyph icon="check" size={18} color={colors.ink} /> : <Display size={18} color={m.color}>{m.number}</Display>}
            </View>
            <View style={{ flex: 1 }}>
              <Display size={18} color={colors.text}>
                {m.title}
              </Display>
              <Body size={13} color={colors.textDim} numberOfLines={1}>
                {m.subtitle}
              </Body>
            </View>
            <Body size={13} weight="bold" color={complete ? m.color : colors.textMute}>
              {d}/{m.stops.length}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,2,12,0.55)' },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,61,139,0.35)',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    transform: [{ skewX: '-8deg' }],
  },
  tabActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 9 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.textMute,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mini: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 3 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 32, paddingRight: 18, paddingVertical: 8 },
  brandDot: { width: 6, height: 6, borderRadius: 3 },
  plus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: colors.yellow },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10 },
  missionNum: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
