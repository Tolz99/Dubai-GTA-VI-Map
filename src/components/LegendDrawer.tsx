import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_PLACES, BRAND_CATEGORIES, BRANDS, MISSIONS, PLACE_CATEGORIES, STATS, type BrandCategory, type PlaceCategory } from '../data';
import type { Focus } from '../state/store';
import { colors } from '../theme/theme';
import { Blip, Divider, Glyph, H, Label, T, tap } from './ui';

export type LegendTab = 'map' | 'shops' | 'missions';

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

const TABS: [LegendTab, string][] = [
  ['map', 'Legend'],
  ['shops', 'Shops'],
  ['missions', 'Missions'],
];

export function LegendDrawer(p: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const w = Math.min(360, width * 0.86);
  const x = useRef(new Animated.Value(-w)).current;
  const [mounted, setMounted] = useState(p.open);

  useEffect(() => {
    if (p.open) setMounted(true);
    Animated.timing(x, { toValue: p.open ? 0 : -w, duration: 220, useNativeDriver: true }).start(() => {
      if (!p.open) setMounted(false);
    });
  }, [p.open, w, x]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: x.interpolate({ inputRange: [-w, 0], outputRange: [0, 1] }) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} accessibilityLabel="Close legend" />
      </Animated.View>
      <Animated.View style={[styles.drawer, { width: w, paddingTop: insets.top + 12, transform: [{ translateX: x }] }]}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Pressable onPress={p.onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Close">
            <Glyph icon="close" size={16} color={colors.textDim} />
          </Pressable>
        </View>
        <T size={12} color={colors.textMute} style={{ paddingHorizontal: 20, marginTop: 6 }}>
          {STATS.places} places · {STATS.brands} brands · {STATS.stores} store listings
        </T>

        <View style={styles.tabs}>
          {TABS.map(([id, label]) => {
            const on = p.tab === id;
            return (
              <Pressable
                key={id}
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

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {p.tab === 'map' && <MapTab {...p} />}
          {p.tab === 'shops' && <ShopsTab {...p} />}
          {p.tab === 'missions' && <MissionsTab {...p} />}
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
        <Label>On the map</Label>
        <Pressable
          hitSlop={8}
          onPress={() => {
            tap();
            setVisible(all ? [] : PLACE_CATEGORIES.map((c) => c.id));
          }}
        >
          <Label color={colors.text}>{all ? 'Hide all' : 'Show all'}</Label>
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
            <Blip color={c.color} icon={c.icon} size={26} dim={!on} />
            <T size={15} weight={500} color={on ? colors.text : colors.textMute} style={{ flex: 1 }}>
              {c.label}
            </T>
            <T size={13} color={colors.textMute} style={styles.count}>
              {counts[c.id] || 0}
            </T>
            <View style={[styles.toggle, on && styles.toggleOn]}>{on ? <Glyph icon="check" size={13} color={colors.ink} /> : null}</View>
          </Pressable>
        );
      })}
      <T size={12} color={colors.textMute} style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        Long-press a category to show only that one.
      </T>
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
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.panel, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.hairline },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  logo: { width: 150, height: 76 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 4, backgroundColor: colors.raised, borderRadius: 6, padding: 3 },
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
