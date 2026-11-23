import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { BRANDS, brandById, brandCat } from '../data';
import { fmtKm } from '../lib/geo';
import { FULL, PARTIAL, rankMalls } from '../lib/shopping';
import { colors, fonts } from '../theme/theme';
import { ActionButton, Body, Display, Glyph, tap } from './ui';

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
    <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Body size={12} weight="bold" color={colors.pink} style={{ letterSpacing: 2 }}>
        SIDE MISSION
      </Body>
      <Display size={28}>Shopping Run</Display>
      <Body size={14} color={colors.textDim} style={{ marginTop: 2 }}>
        Add the brands you need — we light up every mall that has them.
      </Body>

      <View style={styles.inputWrap}>
        <Glyph icon="search" size={18} color={colors.textMute} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search brands — Zara, Nike, Apple…"
          placeholderTextColor={colors.textMute}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>
      <View style={styles.wrap}>
        {suggestions.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => {
              tap();
              toggle(b.id);
              setQ('');
            }}
            style={({ pressed }) => [styles.sugg, { borderColor: brandCat[b.cat].color + '77' }, pressed && { opacity: 0.6 }]}
          >
            <Glyph icon="plus" size={12} color={brandCat[b.cat].color} />
            <Body size={14} weight="semi">
              {b.name}
            </Body>
          </Pressable>
        ))}
      </View>

      {list.length ? (
        <>
          <View style={styles.listHead}>
            <Body size={11} weight="bold" color={colors.textMute} style={{ letterSpacing: 2 }}>
              YOUR LIST • {list.length}
            </Body>
            <Pressable onPress={clear} hitSlop={8}>
              <Body size={11} weight="bold" color={colors.pink} style={{ letterSpacing: 1.5 }}>
                CLEAR
              </Body>
            </Pressable>
          </View>
          <View style={styles.wrap}>
            {list.map((id) => {
              const b = brandById[id];
              if (!b) return null;
              const c = brandCat[b.cat].color;
              return (
                <Pressable key={id} onPress={() => toggle(id)} style={[styles.item, { backgroundColor: c + '26', borderColor: c }]}>
                  <Body size={14} weight="bold">
                    {b.name}
                  </Body>
                  <Glyph icon="close" size={12} color={colors.textDim} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.objective, { borderLeftColor: full.length ? FULL : PARTIAL }]}>
            <Body size={15} weight="semi">
              {full.length ? (
                <>
                  <Body size={15} weight="bold" color={FULL}>
                    {full.length} {full.length === 1 ? 'mall has' : 'malls have'} everything.
                  </Body>{' '}
                  Best bet: <Body size={15} weight="bold" color={colors.yellow}>{full[0].mall.name}</Body>
                </>
              ) : (
                <>No single mall has your full list — split the run across the malls below.</>
              )}
            </Body>
          </View>

          {results.map((r, i) => {
            const isFull = r.missing.length === 0;
            const col = isFull ? FULL : PARTIAL;
            return (
              <Pressable key={r.mall.id} onPress={() => onPickMall(r.mall.id)} style={({ pressed }) => [styles.result, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <View style={[styles.rank, { borderColor: col }, i === 0 && { backgroundColor: col }]}>
                  <Display size={15} color={i === 0 ? colors.ink : col}>
                    {r.have.length}/{list.length}
                  </Display>
                </View>
                <View style={{ flex: 1 }}>
                  <Display size={17}>{r.mall.name}</Display>
                  <Body size={13} color={colors.textDim} numberOfLines={2}>
                    {r.mall.area}
                    {r.km != null ? ` • ${fmtKm(r.km)}` : ''}
                    {r.missing.length ? `  —  missing ${r.missing.map((m) => brandById[m]?.name).join(', ')}` : ''}
                  </Body>
                </View>
                <Glyph icon="chev" size={16} color={colors.textMute} />
              </Pressable>
            );
          })}
          {results.length ? (
            <ActionButton label={`Go to ${results[0].mall.name}`} icon="route" color={colors.waypoint} onPress={() => onPickMall(results[0].mall.id)} style={{ marginTop: 14 }} />
          ) : (
            <Body size={14} color={colors.textDim} style={{ marginTop: 12 }}>
              None of the mapped malls list these brands yet.
            </Body>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,61,139,0.5)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.bodySemi, fontSize: 16, paddingVertical: 11 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  sugg: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 6 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 6 },
  objective: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4, marginTop: 18, marginBottom: 8 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rank: { width: 52, height: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-8deg' }] },
});
