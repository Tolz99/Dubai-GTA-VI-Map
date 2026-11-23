import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_PLACES, brandCat, placeById, placeCat, type Place } from '../data';
import { fmtKm } from '../lib/geo';
import { openState } from '../lib/hours';
import { nearest, searchBrands, searchPlaces, type PlaceHit } from '../lib/search';
import { colors, fonts, radius } from '../theme/theme';
import { Blip, Divider, Glyph, Label, MAX_FONT_SCALE, T } from './ui';

interface Props {
  onClose: () => void;
  onPlace: (id: string) => void;
  onBrand: (id: string) => void;
  favs: string[];
  userLoc: { lat: number; lng: number } | null;
}

const FEATURED = ALL_PLACES.filter((p) => p.featured);

export const SearchOverlay = memo(function SearchOverlay({ onClose, onPlace, onBrand, favs, userLoc }: Props) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [fade]);

  const { places, brands } = useMemo(() => ({ places: searchPlaces(q, userLoc).slice(0, 40), brands: searchBrands(q).slice(0, 20) }), [q, userLoc]);
  const saved = useMemo(() => favs.map((id) => placeById[id]).filter(Boolean) as Place[], [favs]);
  const nearby = useMemo(() => (userLoc ? nearest(userLoc, 8) : []), [userLoc]);

  const hasQ = !!q.trim();
  return (
    <Animated.View style={[styles.wrap, { paddingTop: insets.top + 10, opacity: fade }]}>
      <View style={styles.barRow}>
        <View style={styles.bar}>
          <Glyph icon="search" size={18} color={colors.textMute} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Places, areas, brands"
            placeholderTextColor={colors.textMute}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="search"
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            accessibilityLabel="Search Dubai"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear search">
              <Glyph icon="close" size={16} color={colors.textMute} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <T size={15} weight={500}>
            Cancel
          </T>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {hasQ ? (
          <>
            {brands.length ? <Label style={styles.section}>Brands · lights up every mall that has it</Label> : null}
            {brands.map((b, i) => {
              const c = brandCat[b.cat];
              return (
                <View key={b.id}>
                  {i > 0 ? <Divider style={{ marginLeft: 62 }} /> : null}
                  <Pressable onPress={() => onBrand(b.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
                    <Blip color={c.color} icon={c.icon} size={26} />
                    <View style={{ flex: 1 }}>
                      <T size={16} weight={600}>
                        {b.name}
                      </T>
                      <T size={13} color={colors.textDim}>
                        {c.label} · {b.malls.length} {b.malls.length === 1 ? 'mall' : 'malls'}
                      </T>
                    </View>
                  </Pressable>
                </View>
              );
            })}
            {places.length ? <Label style={styles.section}>Places{userLoc ? ' · nearest first' : ''}</Label> : null}
            <PlaceRows hits={places} onPlace={onPlace} />
            {!places.length && !brands.length ? (
              <View style={styles.empty}>
                <Glyph icon="search" size={28} color={colors.textMute} />
                <T size={15} color={colors.textDim} style={{ textAlign: 'center' }}>
                  No results for “{q.trim()}”.{'\n'}Try an area (JLT, Deira), a category (beach, café) or a brand.
                </T>
              </View>
            ) : null}
          </>
        ) : (
          <>
            {saved.length ? (
              <>
                <Label style={styles.section}>Saved</Label>
                <PlaceRows hits={saved.map((p) => ({ place: p, km: null }))} onPlace={onPlace} />
              </>
            ) : null}
            {nearby.length ? (
              <>
                <Label style={styles.section}>Near you</Label>
                <PlaceRows hits={nearby} onPlace={onPlace} />
              </>
            ) : null}
            <Label style={styles.section}>Must-see</Label>
            <PlaceRows hits={FEATURED.map((p) => ({ place: p, km: null }))} onPlace={onPlace} />
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
});

function PlaceRows({ hits, onPlace }: { hits: PlaceHit[]; onPlace: (id: string) => void }) {
  return (
    <>
      {hits.map(({ place: p, km }, i) => {
        const c = placeCat[p.cat];
        const o = openState(p);
        return (
          <View key={p.id}>
            {i > 0 ? <Divider style={{ marginLeft: 62 }} /> : null}
            <Pressable onPress={() => onPlace(p.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
              <Blip color={c.color} icon={c.icon} size={26} ring={p.featured} />
              <View style={{ flex: 1 }}>
                <T size={16} weight={600} numberOfLines={1}>
                  {p.name}
                </T>
                <T size={13} color={colors.textDim} numberOfLines={1}>
                  {c.label} · {p.area}
                  {o ? (
                    <T size={13} color={o.open ? colors.green : colors.textMute}>
                      {'  ·  '}
                      {o.open ? 'Open now' : 'Closed'}
                    </T>
                  ) : null}
                </T>
              </View>
              {km != null ? (
                <T size={13} weight={600} color={colors.textMute}>
                  {fmtKm(km)}
                </T>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: colors.panelSolid },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 6 },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.raised },
  input: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16, height: 44, outlineWidth: 0 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, minHeight: 60 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingTop: 48 },
});
