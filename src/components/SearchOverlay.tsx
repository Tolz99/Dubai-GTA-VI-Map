import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_PLACES, BRANDS, brandCat, placeCat } from '../data';
import { colors, fonts } from '../theme/theme';
import { Blip, Body, Glyph } from './ui';

interface Props {
  onClose: () => void;
  onPlace: (id: string) => void;
  onBrand: (id: string) => void;
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function SearchOverlay({ onClose, onPlace, onBrand }: Props) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const { places, brands } = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return { places: ALL_PLACES.filter((p) => p.featured), brands: [] };
    const words = s.split(/\s+/);
    const match = (txt: string) => words.every((w) => norm(txt).includes(w));
    return {
      places: ALL_PLACES.filter((p) => match(`${p.name} ${p.area} ${p.cat} ${placeCat[p.cat].label} ${(p.tags || []).join(' ')}`)).slice(0, 30),
      brands: BRANDS.filter((b) => match(`${b.name} ${brandCat[b.cat].label}`)).slice(0, 20),
    };
  }, [q]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.bar}>
        <Glyph icon="search" size={20} color={colors.pink} />
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder="Places, malls, brands, food…"
          placeholderTextColor={colors.textMute}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
        <Pressable onPress={onClose} hitSlop={10}>
          <Body size={14} weight="bold" color={colors.textDim} style={{ letterSpacing: 1 }}>
            CANCEL
          </Body>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {!q ? (
          <Body size={11} weight="bold" color={colors.textMute} style={styles.section}>
            MUST-SEE
          </Body>
        ) : null}
        {brands.length ? (
          <Body size={11} weight="bold" color={colors.textMute} style={styles.section}>
            BRANDS — SHOW EVERY MALL THAT HAS IT
          </Body>
        ) : null}
        {brands.map((b) => {
          const c = brandCat[b.cat];
          return (
            <Pressable key={b.id} onPress={() => onBrand(b.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Blip color={c.color} icon={c.icon} size={30} />
              <View style={{ flex: 1 }}>
                <Body size={17} weight="bold">
                  {b.name}
                </Body>
                <Body size={13} color={colors.textDim}>
                  {c.label} • in {b.malls.length} {b.malls.length === 1 ? 'mall' : 'malls'}
                </Body>
              </View>
            </Pressable>
          );
        })}
        {q && places.length ? (
          <Body size={11} weight="bold" color={colors.textMute} style={styles.section}>
            PLACES
          </Body>
        ) : null}
        {places.map((p) => {
          const c = placeCat[p.cat];
          return (
            <Pressable key={p.id} onPress={() => onPlace(p.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Blip color={c.color} icon={c.icon} size={30} />
              <View style={{ flex: 1 }}>
                <Body size={17} weight="bold">
                  {p.name}
                </Body>
                <Body size={13} color={colors.textDim}>
                  {c.label} • {p.area}
                </Body>
              </View>
            </Pressable>
          );
        })}
        {q && !places.length && !brands.length ? (
          <Body size={15} color={colors.textDim} style={{ padding: 20 }}>
            Nothing on the map for “{q}” yet.
          </Body>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11,6,24,0.97)' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.pink,
    borderRadius: 4,
    backgroundColor: 'rgba(255,61,139,0.08)',
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.bodySemi, fontSize: 17, paddingVertical: 12 },
  section: { letterSpacing: 2, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 9 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
});
