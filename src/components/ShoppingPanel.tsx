import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { BRANDS, brandById, brandCat } from '../data';
import { fmtKm } from '../lib/geo';
import { FULL, PARTIAL, rankMalls } from '../lib/shopping';
import { colors, fonts, radius } from '../theme/theme';
import { Button, Divider, Glyph, H, Label, T, tap } from './ui';

const QUICK = ['zara', 'nike', 'sephora', 'apple-store', 'uniqlo', 'handm', 'bath-and-body-works', 'lululemon', 'louis-vuitton', 'ikea', 'shake-shack', 'starbucks'];

interface Props {
  list: string[];
  toggle: (id: string) => void;
  clear: () => void;
  userLoc: { lat: number; lng: number } | null;
  onPickMall: (id: string) => void;
}

export function ShoppingPanel({ list, toggle, clear, userLoc, onPickMall }: Props) {
  const [q, setQ] = useState('');
  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return QUICK.filter((id) => !list.includes(id) && brandById[id]).map((id) => brandById[id]);
    return BRANDS.filter((b) => b.name.toLowerCase().includes(s) && !list.includes(b.id)).slice(0, 12);
  }, [q, list]);
  const results = useMemo(() => rankMalls(list, userLoc), [list, userLoc]);
  const full = results.filter((r) => r.missing.length === 0);

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <H size={28} style={{ paddingRight: 40 }}>Shopping run</H>
      <T size={14} color={colors.textDim} style={{ marginTop: 2 }}>
        Add what you’re shopping for. Malls that carry it light up on the map.
      </T>

      <View style={styles.input}>
        <Glyph icon="search" size={18} color={colors.textMute} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Add a brand"
          placeholderTextColor={colors.textMute}
          style={styles.inputText}
          autoCorrect={false}
          returnKeyType="done"
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Glyph icon="close" size={16} color={colors.textMute} />
          </Pressable>
        ) : null}
      </View>

      <Label style={{ marginTop: 14 }}>{q ? 'Matches' : 'Popular'}</Label>
      <View style={styles.wrap}>
        {suggestions.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => {
              tap();
              toggle(b.id);
              setQ('');
            }}
            style={({ pressed }) => [styles.sugg, pressed && { opacity: 0.6 }]}
          >
            <View style={[styles.dot, { backgroundColor: brandCat[b.cat].color }]} />
            <T size={13.5} weight={500}>
              {b.name}
            </T>
            <Glyph icon="plus" size={13} color={colors.textMute} />
          </Pressable>
        ))}
        {!suggestions.length ? (
          <T size={13} color={colors.textMute}>
            No brand called “{q}” yet.
          </T>
        ) : null}
      </View>

      {list.length ? (
        <>
          <View style={styles.listHead}>
            <Label>Your list · {list.length}</Label>
            <Pressable onPress={clear} hitSlop={8}>
              <Label color={colors.text}>Clear</Label>
            </Pressable>
          </View>
          <View style={styles.wrap}>
            {list.map((id) => {
              const b = brandById[id];
              if (!b) return null;
              return (
                <Pressable key={id} onPress={() => toggle(id)} style={styles.item} accessibilityLabel={`Remove ${b.name}`}>
                  <T size={13.5} weight={600} color={colors.ink}>
                    {b.name}
                  </T>
                  <Glyph icon="close" size={12} color={colors.ink} />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summary}>
            {full.length ? (
              <T size={15} weight={500}>
                <T size={15} weight={700} color={FULL}>
                  {full.length} {full.length === 1 ? 'mall has' : 'malls have'} everything.
                </T>{' '}
                Best bet: {full[0].mall.name}.
              </T>
            ) : (
              <T size={15} weight={500}>
                No single mall has your whole list. Split it across the malls below.
              </T>
            )}
          </View>

          <View style={styles.results}>
            {results.map((r, i) => {
              const isFull = r.missing.length === 0;
              return (
                <View key={r.mall.id}>
                  {i > 0 ? <Divider style={{ marginLeft: 66 }} /> : null}
                  <Pressable onPress={() => onPickMall(r.mall.id)} style={({ pressed }) => [styles.result, pressed && { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                    <View style={[styles.score, { backgroundColor: isFull ? FULL : PARTIAL }]}>
                      <H size={16} color={colors.ink}>
                        {r.have.length}/{list.length}
                      </H>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T size={15} weight={600}>
                        {r.mall.name}
                      </T>
                      <T size={12.5} color={colors.textDim} numberOfLines={2}>
                        {[r.mall.area, r.km != null ? fmtKm(r.km) : null].filter(Boolean).join(' · ')}
                        {r.missing.length ? ` · no ${r.missing.map((m) => brandById[m]?.name).join(', ')}` : ''}
                      </T>
                    </View>
                    <Glyph icon="chev" size={14} color={colors.textMute} />
                  </Pressable>
                </View>
              );
            })}
          </View>
          {results.length ? (
            <Button label={`Go to ${results[0].mall.name}`} icon="route" onPress={() => onPickMall(results[0].mall.id)} style={{ marginTop: 16 }} />
          ) : (
            <T size={14} color={colors.textDim} style={{ marginTop: 12 }}>
              None of the mapped malls list these brands yet.
            </T>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, height: 46, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.raised },
  inputText: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16, height: 46 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sugg: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 32, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: colors.raised },
  dot: { width: 6, height: 6, borderRadius: 3 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 32, paddingHorizontal: 11, borderRadius: radius.sm, backgroundColor: colors.text },
  summary: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.raised },
  results: { marginTop: 8 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 62 },
  score: { width: 52, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
