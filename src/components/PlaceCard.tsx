import { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BRAND_CATEGORIES, brandCat, brandsByMall, placeById, placeCat, placesInMall, type BrandCategory, type Place } from '../data';
import { distanceKm, fmtKm, fmtMin, type RouteResult } from '../lib/geo';
import { openState } from '../lib/hours';
import { openNavigation, type NavApp } from '../lib/navigate';
import { nearest } from '../lib/search';
import { colors, radius } from '../theme/theme';
import { SheetScrollView } from './Sheet';
import { Blip, Button, Chip, Divider, Glyph, H, Label, T, tap, thud } from './ui';

interface Props {
  place: Place;
  userLoc: { lat: number; lng: number } | null;
  route: (RouteResult & { targetId: string }) | null;
  routing: boolean;
  /** The router couldn't be reached and the route is a straight-line estimate. */
  routeError?: boolean;
  onWaypoint: () => void;
  onClearRoute: () => void;
  onDrive: () => void;
  shoppingList: string[];
  toggleShopping: (id: string) => void;
  onSelect: (id: string) => void;
  isFav: boolean;
  toggleFav: (id: string) => void;
}

const NAV_APPS: [NavApp, string][] = [
  ['apple', 'Apple Maps'],
  ['google', 'Google Maps'],
  ['waze', 'Waze'],
];

export const PlaceCard = memo(function PlaceCard({ place, userLoc, route, routing, routeError, onWaypoint, onClearRoute, onDrive, shoppingList, toggleShopping, onSelect, isFav, toggleFav }: Props) {
  const cat = placeCat[place.cat];
  const myRoute = route && route.targetId === place.id ? route : null;
  const dist = userLoc ? distanceKm(userLoc.lat, userLoc.lng, place.lat, place.lng) : null;
  const parent = place.inMall ? placeById[place.inMall] : null;
  const meta = [cat.short, place.area, place.price ? '$'.repeat(place.price) : null, dist != null ? fmtKm(dist) : null].filter(Boolean).join('  ·  ');
  const open = openState(place);
  const near = useMemo(() => nearest(place, 4, place.id, (p) => p.inMall !== place.id && p.id !== place.inMall), [place]);

  return (
    <SheetScrollView contentContainerStyle={styles.body}>
      <View style={styles.head}>
        <Blip color={cat.color} icon={cat.icon} size={38} ring={place.featured} />
        <View style={{ flex: 1, paddingRight: 36 }}>
          <T size={12} weight={600} color={colors.textDim} numberOfLines={1}>
            {meta}
          </T>
          <H size={28} numberOfLines={2} style={{ marginTop: 2 }} accessibilityRole="header">
            {place.name}
          </H>
        </View>
      </View>

      <View style={styles.quickRow}>
        <Pressable
          onPress={() => {
            thud();
            toggleFav(place.id);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: isFav }}
          accessibilityLabel={isFav ? `Remove ${place.name} from saved` : `Save ${place.name}`}
          style={({ pressed }) => [styles.saveBtn, isFav && styles.saveBtnOn, pressed && { opacity: 0.7 }]}
        >
          <Glyph icon={isFav ? 'heart' : 'heartOutline'} size={16} color={isFav ? colors.ink : '#FF4D7A'} />
          <T size={13} weight={600} color={isFav ? colors.ink : colors.text}>
            {isFav ? 'Saved' : 'Save'}
          </T>
        </Pressable>
        {open ? (
          <View style={[styles.openPill, { borderColor: open.open ? colors.green : colors.hairline }]}>
            <View style={[styles.openDot, { backgroundColor: open.open ? colors.green : colors.danger }]} />
            <T size={12.5} weight={600} color={open.open ? colors.text : colors.textDim}>
              {open.label}
            </T>
          </View>
        ) : null}
      </View>

      <T size={15} color={colors.textDim} style={{ marginTop: 12 }}>
        {place.blurb}
      </T>

      {parent ? (
        <Pressable onPress={() => onSelect(parent.id)} style={styles.parent}>
          <Blip color={placeCat.mall.color} icon="bag" size={18} />
          <T size={13} weight={600}>
            Inside {parent.name}
          </T>
          <Glyph icon="chev" size={14} color={colors.textMute} />
        </Pressable>
      ) : null}

      {place.tags?.length ? (
        <View style={styles.tags}>
          {place.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <T size={12} weight={500} color={colors.textDim}>
                {t}
              </T>
            </View>
          ))}
        </View>
      ) : null}

      {/* Route */}
      {myRoute ? (
        <View style={styles.routeBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <H size={30} color={colors.text}>
                {fmtMin(myRoute.durationSec)}
              </H>
              <T size={13} color={colors.textDim}>
                {fmtKm(myRoute.distanceKm)}
                {myRoute.estimated ? ' · estimated' : ' · fastest route'}
                {userLoc ? '' : ' · from Downtown'}
              </T>
            </View>
            <Pressable onPress={onClearRoute} hitSlop={8} style={styles.clear}>
              <T size={13} weight={600} color={colors.textDim}>
                Clear
              </T>
            </Pressable>
          </View>
          {routeError ? (
            <T size={12.5} color={colors.yellow} style={{ marginTop: 8 }}>
              Couldn’t reach the router, so this is a straight-line estimate. Check your connection, or open it in Apple Maps below.
            </T>
          ) : null}
          <Button label="Drive" icon="car" onPress={onDrive} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <Button label={routing ? 'Finding route…' : 'Set waypoint'} icon="route" onPress={onWaypoint} style={{ marginTop: 18 }} />
      )}

      <View style={styles.navRow}>
        <Label style={{ marginRight: 4 }}>Open in</Label>
        {NAV_APPS.map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => {
              tap();
              openNavigation(id, place.lat, place.lng, place.name);
            }}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
          >
            <T size={13} weight={600}>
              {label}
            </T>
          </Pressable>
        ))}
      </View>

      {place.cat === 'mall' ? <MallDirectory mallId={place.id} shoppingList={shoppingList} toggleShopping={toggleShopping} onSelect={onSelect} /> : null}

      <View style={{ marginTop: 22 }}>
        <Label style={{ marginBottom: 4 }}>Nearby</Label>
        {near.map(({ place: p, km }, i) => {
          const c = placeCat[p.cat];
          return (
            <View key={p.id}>
              {i > 0 ? <Divider style={{ marginLeft: 38 }} /> : null}
              <Pressable onPress={() => onSelect(p.id)} style={({ pressed }) => [styles.insideRow, pressed && { opacity: 0.6 }]} accessibilityRole="button">
                <Blip color={c.color} icon={c.icon} size={24} />
                <View style={{ flex: 1 }}>
                  <T size={15} weight={500} numberOfLines={1}>
                    {p.name}
                  </T>
                  <T size={12} color={colors.textMute} numberOfLines={1}>
                    {c.label}
                  </T>
                </View>
                <T size={12.5} color={colors.textMute}>
                  {fmtKm(km ?? 0)}
                </T>
              </Pressable>
            </View>
          );
        })}
      </View>
    </SheetScrollView>
  );
});

function MallDirectory({ mallId, shoppingList, toggleShopping, onSelect }: { mallId: string; shoppingList: string[]; toggleShopping: (id: string) => void; onSelect: (id: string) => void }) {
  const brands = useMemo(() => brandsByMall[mallId] || [], [mallId]);
  const inside = placesInMall[mallId] || [];
  const cats = useMemo(() => BRAND_CATEGORIES.filter((c) => brands.some((b) => b.cat === c.id)), [brands]);
  const [cat, setCat] = useState<BrandCategory | 'all'>('all');
  const shown = cat === 'all' ? brands : brands.filter((b) => b.cat === cat);

  return (
    <View style={{ marginTop: 22 }}>
      {inside.length ? (
        <View style={{ marginBottom: 20 }}>
          <Label style={{ marginBottom: 6 }}>Inside this mall</Label>
          {inside.map((p, i) => {
            const c = placeCat[p.cat];
            return (
              <View key={p.id}>
                {i > 0 ? <Divider style={{ marginLeft: 38 }} /> : null}
                <Pressable onPress={() => onSelect(p.id)} style={({ pressed }) => [styles.insideRow, pressed && { opacity: 0.6 }]}>
                  <Blip color={c.color} icon={c.icon} size={24} />
                  <T size={15} weight={500} style={{ flex: 1 }}>
                    {p.name}
                  </T>
                  <Glyph icon="chev" size={14} color={colors.textMute} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>Store directory · {brands.length}</Label>
        <T size={12} color={colors.textMute}>
          Tap to add to list
        </T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segments}>
        {[{ id: 'all' as const, short: 'All', color: colors.text }, ...cats].map((c) => {
          const on = cat === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                tap();
                setCat(c.id);
              }}
              style={[styles.segment, on && styles.segmentOn]}
            >
              {c.id !== 'all' ? <View style={[styles.dot, { backgroundColor: c.color }]} /> : null}
              <T size={12.5} weight={600} color={on ? colors.ink : colors.textDim} style={{ textTransform: 'capitalize' }}>
                {c.id === 'all' ? 'All' : c.short.toLowerCase()}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.tags}>
        {shown.map((b) => (
          <Chip key={b.id} label={b.name} color={brandCat[b.cat].color} active={shoppingList.includes(b.id)} onPress={() => toggleShopping(b.id)} />
        ))}
      </View>
      <T size={12} color={colors.textMute} style={{ marginTop: 16 }}>
        Store line-ups change. Check the mall’s official directory before a special trip.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4 },
  head: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.raised },
  saveBtnOn: { backgroundColor: colors.text },
  openPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  parent: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 12, alignSelf: 'flex-start', backgroundColor: colors.raised, paddingHorizontal: 10, height: 34, borderRadius: radius.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { backgroundColor: colors.raised, paddingHorizontal: 9, height: 26, justifyContent: 'center', borderRadius: radius.sm },
  routeBox: { marginTop: 18, padding: 14, borderRadius: radius.md, backgroundColor: colors.raised, borderLeftWidth: 3, borderLeftColor: colors.waypoint },
  clear: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: colors.raisedHi, justifyContent: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  navBtn: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.raised, justifyContent: 'center' },
  insideRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 46 },
  segments: { gap: 6, paddingVertical: 10 },
  segment: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 11, borderRadius: 15, backgroundColor: colors.raised },
  segmentOn: { backgroundColor: colors.text },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
