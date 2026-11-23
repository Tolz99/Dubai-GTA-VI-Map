import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MISSIONS, placeById, placeCat } from '../data';
import { colors, radius } from '../theme/theme';
import { Blip, Button, Glyph, H, Label, T, tap } from './ui';

interface Props {
  missionId: string;
  done: string[];
  toggleStop: (placeId: string) => void;
  active: boolean;
  onStart: () => void;
  onStop: () => void;
  onSelect: (placeId: string) => void;
}

export function MissionPanel({ missionId, done, toggleStop, active, onStart, onStop, onSelect }: Props) {
  const m = MISSIONS.find((x) => x.id === missionId)!;
  const complete = done.length === m.stops.length;
  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 40 }}>
        <View style={[styles.badge, { backgroundColor: m.color }]}>
          <H size={20} color={colors.ink}>
            {m.number}
          </H>
        </View>
        <View style={{ flex: 1 }}>
          <Label>Mission {m.number} · {m.stops.length} stops</Label>
          <H size={28}>{m.title}</H>
        </View>
      </View>
      <T size={15} color={colors.textDim} style={{ marginTop: 10 }}>
        {m.subtitle}
      </T>

      <View style={{ marginTop: 16 }}>
        {m.stops.map((id, i) => {
          const p = placeById[id];
          if (!p) return null;
          const c = placeCat[p.cat];
          const isDone = done.includes(id);
          const last = i === m.stops.length - 1;
          return (
            <View key={id} style={styles.stop}>
              <View style={styles.rail}>
                {!last ? <View style={styles.line} /> : null}
                <View style={[styles.num, isDone && { backgroundColor: colors.text }]}>
                  <T size={12} weight={700} color={isDone ? colors.ink : colors.text}>
                    {i + 1}
                  </T>
                </View>
              </View>
              <Pressable style={styles.stopMain} onPress={() => onSelect(id)}>
                <Blip color={c.color} icon={c.icon} size={24} />
                <View style={{ flex: 1 }}>
                  <T size={15} weight={600} color={isDone ? colors.textMute : colors.text}>
                    {p.name}
                  </T>
                  <T size={12.5} color={colors.textMute}>
                    {p.area}
                  </T>
                </View>
              </Pressable>
              <Pressable
                hitSlop={8}
                accessibilityLabel={isDone ? 'Mark not done' : 'Mark done'}
                onPress={() => {
                  tap();
                  toggleStop(id);
                }}
                style={[styles.box, isDone && styles.boxOn]}
              >
                {isDone ? <Glyph icon="check" size={14} color={colors.ink} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      {complete ? (
        <View style={styles.passed}>
          <Label color={colors.textDim}>Mission passed</Label>
          <H size={30} italic color={m.color}>
            {m.reward}
          </H>
        </View>
      ) : null}

      {active ? (
        <Button label="End mission" variant="secondary" onPress={onStop} style={{ marginTop: 18 }} />
      ) : (
        <Button label="Start mission" icon="route" onPress={onStart} style={{ marginTop: 18 }} />
      )}
      <T size={12} color={colors.textMute} style={{ marginTop: 10, textAlign: 'center' }}>
        Tick each stop as you reach it. Progress is saved on this phone.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  badge: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  rail: { width: 24, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', top: '50%', bottom: '-50%', width: 2, backgroundColor: colors.raisedHi },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.raisedHi, alignItems: 'center', justifyContent: 'center' },
  stopMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 26, height: 26, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.text, borderColor: colors.text },
  passed: { marginTop: 18, paddingVertical: 14, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.raised },
});
