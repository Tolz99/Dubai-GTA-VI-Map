import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BRAND_CATEGORIES, brandsByMall, placeById, placeCat, placesInMall, type BrandCategory, type Place } from '../data';
import { distanceKm, fmtKm, fmtMin, type RouteResult } from '../lib/geo';
import { openNavigation } from '../lib/navigate';
import { colors } from '../theme/theme';
import { ActionButton, Blip, Body, Chip, Display, Glyph, tap } from './ui';

interface Props {
  place: Place;
  userLoc: { lat: number; lng: number } | null;
  route: (RouteResult & { targetId: string }) | null;
  routing: boolean;
  onWaypoint: () => void;
  onClearRoute: () => void;
  shoppingList: string[];
  toggleShopping: (id: string) => void;
  onSelect: (id: string) => void;
}

export function PlaceCard({ place, userLoc, route, routing, onWaypoint, onClearRoute, shoppingList, toggleShopping, onSelect }: Props) {
  const cat = placeCat[place.cat];
  const isMall = place.cat === 'mall';
  const myRoute = route && route.targetId === place.id ? route : null;
  const dist = userLoc ? distanceKm(userLoc.lat, userLoc.lng, place.lat, place.lng) : null;
  const parent = place.inMall ? placeById[place.inMall] : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Blip color={cat.color} icon={cat.icon} size={44} ring="#FFFFFF" />
        <View style={{ flex: 1, paddingRight: 28 }}>
          <Body size={12} weight="bold" color={cat.color} style={{ letterSpacing: 2 }}>
            {cat.short}
            {place.price ? `  •  ${'$'.repeat(place.price)}` : ''}
            {dist != null ? `  •  ${fmtKm(dist)} AWAY` : ''}
          </Body>
          <Display size={26} numberOfLines={2}>
            {place.name}
          </Display>
          <Body size={14} color={colors.textDim} weight="semi">
            {place.area}
          </Body>
        </View>
      </View>

      <Body size={15} color={colors.text} style={{ marginTop: 12, lineHeight: 21 }}>
        {place.blurb}
      </Body>

      {parent ? (
        <Pressable onPress={() => onSelect(parent.id)} style={styles.parent}>
          <Glyph icon="bag" size={14} color={colors.pink} />
          <Body size={13} weight="bold" color={colors.pink}>
            INSIDE {parent.name.toUpperCase()}
          </Body>
        </Pressable>
      ) : null}

      {place.tags?.length ? (
        <View style={styles.tags}>
          {place.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Body size={12} weight="bold" color={colors.textDim} style={{ letterSpacing: 0.6 }}>
                {t.toUpperCase()}
              </Body>
            </View>
          ))}
        </View>
      ) : null}

      {/* Waypoint / GPS */}
      <View style={styles.actions}>
        {myRoute ? (
          <ActionButton label="Clear waypoint" icon="close" color={colors.waypoint} filled={false} onPress={onClearRoute} style={{ flex: 1 }} />
        ) : (
          <ActionButton label={routing ? 'Routing…' : 'Set waypoint'} icon="route" color={colors.waypoint} onPress={onWaypoint} style={{ flex: 1 }} />
        )}
      </View>
      {myRoute ? (
        <View style={styles.routeInfo}>
          <Display size={22} color={colors.waypoint}>
            {fmtMin(myRoute.durationSec)}
          </Display>
          <Body size={14} weight="semi" color={colors.textDim}>
            {fmtKm(myRoute.distanceKm)} by car{myRoute.estimated ? ' (estimate)' : ''}
            {userLoc ? '' : ' • from Downtown'}
          </Body>
        </View>
      ) : null}
      <Body size={11} weight="bold" color={colors.textMute} style={{ letterSpacing: 2, marginTop: 14, marginBottom: 8 }}>
        START GPS IN
      </Body>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionButton small label="Apple Maps" filled={false} color={colors.text} onPress={() => openNavigation('apple', place.lat, place.lng, place.name)} style={{ flex: 1 }} />
        <ActionButton small label="Google" filled={false} color={colors.text} onPress={() => openNavigation('google', place.lat, place.lng, place.name)} style={{ flex: 1 }} />
        <ActionButton small label="Waze" filled={false} color={colors.cyan} onPress={() => openNavigation('waze', place.lat, place.lng, place.name)} style={{ flex: 1 }} />
      </View>

      {isMall ? <MallDirectory mallId={place.id} shoppingList={shoppingList} toggleShopping={toggleShopping} onSelect={onSelect} /> : null}
    </ScrollView>
  );
}

function MallDirectory({ mallId, shoppingList, toggleShopping, onSelect }: { mallId: string; shoppingList: string[]; toggleShopping: (id: string) => void; onSelect: (id: string) => void }) {
  const brands = brandsByMall[mallId] || [];
  const inside = placesInMall[mallId] || [];
  const cats = useMemo(() => BRAND_CATEGORIES.filter((c) => brands.some((b) => b.cat === c.id)), [brands]);
  const [cat, setCat] = useState<BrandCategory | 'all'>('all');
  const shown = cat === 'all' ? brands : brands.filter((b) => b.cat === cat);
  const colorOf = (c: BrandCategory) => BRAND_CATEGORIES.find((x) => x.id === c)!.color;

  return (
    <View style={{ marginTop: 22 }}>
      {inside.length ? (
        <View style={{ marginBottom: 16 }}>
          <Body size={11} weight="bold" color={colors.textMute} style={{ letterSpacing: 2, marginBottom: 8 }}>
            INSIDE THIS MALL
          </Body>
          {inside.map((p) => {
            const c = placeCat[p.cat];
            return (
              <Pressable key={p.id} onPress={() => onSelect(p.id)} style={styles.insideRow}>
                <Blip color={c.color} icon={c.icon} size={24} />
                <Body size={15} weight="semi" style={{ flex: 1 }}>
                  {p.name}
                </Body>
                <Glyph icon="chev" size={14} color={colors.textMute} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Body size={11} weight="bold" color={colors.textMute} style={{ letterSpacing: 2 }}>
          STORE DIRECTORY • {brands.length} BRANDS
        </Body>
        <Body size={11} weight="semi" color={colors.textMute}>
          tap = add to list
        </Body>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
        <Pressable
          onPress={() => {
            tap();
            setCat('all');
          }}
          style={[styles.catTab, cat === 'all' && { backgroundColor: colors.text, borderColor: colors.text }]}
        >
          <Body size={12} weight="bold" color={cat === 'all' ? colors.ink : colors.textDim}>
            ALL
          </Body>
        </Pressable>
        {cats.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              tap();
              setCat(c.id);
            }}
            style={[styles.catTab, { borderColor: c.color + '66' }, cat === c.id && { backgroundColor: c.color, borderColor: c.color }]}
          >
            <Body size={12} weight="bold" color={cat === c.id ? colors.ink : c.color}>
              {c.short}
            </Body>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.tags}>
        {shown.map((b) => (
          <Chip key={b.id} label={b.name} color={colorOf(b.cat)} active={shoppingList.includes(b.id)} onPress={() => toggleShopping(b.id)} />
        ))}
      </View>
      <Body size={11} color={colors.textMute} style={{ marginTop: 14 }}>
        Store line-ups change — check the mall's official directory before a special trip.
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  parent: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  routeInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 10 },
  catTab: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3 },
  insideRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});
