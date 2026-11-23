import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_PLACES, BRANDS, brandCat, placeCat } from '../data';
import { colors, fonts, radius } from '../theme/theme';
import { Blip, Divider, Glyph, Label, T } from './ui';

interface Props {
  onClose: () => void;
  onPlace: (id: string) => void;
  onBrand: (id: string) => void;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function SearchOverlay({ onClose, onPlace, onBrand }: Props) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const { places, brands } = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return { places: ALL_PLACES.filter((p) => p.featured), brands: [] };
    const words = s.split(/\s+/);
    const match = (txt: string) => words.every((w) => norm(txt).includes(w));
    return {
      places: ALL_PLACES.filter((p) => match(`${p.name} ${p.area} ${placeCat[p.cat].label} ${(p.tags || []).join(' ')}`)).slice(0, 30),
      brands: BRANDS.filter((b) => match(`${b.name} ${brandCat[b.cat].label}`)).slice(0, 20),
    };
  }, [q]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.barRow}>
        <View style={styles.bar}>
          <Glyph icon="search" size={18} color={colors.textMute} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search Dubai"
            placeholderTextColor={colors.textMute}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="search"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <Glyph icon="close" size={16} color={colors.textMute} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onClose} hitSlop={10}>
          <T size={15} weight={500}>
            Cancel
          </T>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {brands.length ? <Label style={styles.section}>Brands · shows every mall that has it</Label> : null}
        {brands.map((b, i) => {
          const c = brandCat[b.cat];
          return (
            <View key={b.id}>
              {i > 0 ? <Divider style={{ marginLeft: 62 }} /> : null}
              <Pressable onPress={() => onBrand(b.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
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
        {places.length ? <Label style={styles.section}>{q ? 'Places' : 'Must-see'}</Label> : null}
        {places.map((p, i) => {
          const c = placeCat[p.cat];
          return (
            <View key={p.id}>
              {i > 0 ? <Divider style={{ marginLeft: 62 }} /> : null}
              <Pressable onPress={() => onPlace(p.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Blip color={c.color} icon={c.icon} size={26} />
                <View style={{ flex: 1 }}>
                  <T size={16} weight={600}>
                    {p.name}
                  </T>
                  <T size={13} color={colors.textDim}>
                    {c.label} · {p.area}
                  </T>
                </View>
              </Pressable>
            </View>
          );
        })}
        {q && !places.length && !brands.length ? (
          <T size={15} color={colors.textDim} style={{ padding: 20 }}>
            No results for “{q}”.
          </T>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: colors.panelSolid },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 6 },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.raised },
  input: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16, height: 44 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, minHeight: 60 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
});
