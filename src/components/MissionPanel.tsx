import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MISSIONS, placeById, placeCat } from '../data';
import { fmtKm, fmtMin, type RouteResult } from '../lib/geo';
import { colors } from '../theme/theme';
import { ActionButton, Blip, Body, Display, Glyph, tap } from './ui';

interface Props {
  missionId: string;
  done: string[];
  toggleStop: (placeId: string) => void;
  active: boolean;
  route: RouteResult | null;
  onStart: () => void;
  onStop: () => void;
  onSelect: (placeId: string) => void;
}

export function MissionPanel({ missionId, done, toggleStop, active, route, onStart, onStop, onSelect }: Props) {
  const m = MISSIONS.find((x) => x.id === missionId)!;
  const complete = done.length === m.stops.length;
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
      <Body size={12} weight="bold" color={m.color} style={{ letterSpacing: 2 }}>
        STORY MISSION {m.number}
      </Body>
      <Display size={30}>{m.title}</Display>
      <Body size={15} color={colors.textDim}>
        {m.subtitle}
      </Body>
      {active && route ? (
        <Body size={14} weight="semi" color={m.color} style={{ marginTop: 8 }}>
          {m.stops.length} stops • {fmtKm(route.distanceKm)} • ~{fmtMin(route.durationSec)} driving
        </Body>
      ) : null}

      <View style={{ marginTop: 14 }}>
        {m.stops.map((id, i) => {
          const p = placeById[id];
          if (!p) return null;
          const c = placeCat[p.cat];
          const isDone = done.includes(id);
          return (
            <View key={id} style={styles.stop}>
              <View style={styles.rail}>
                <View style={[styles.num, { borderColor: m.color }, isDone && { backgroundColor: m.color }]}>
                  <Display size={13} color={isDone ? colors.ink : m.color}>
                    {i + 1}
                  </Display>
                </View>
                {i < m.stops.length - 1 ? <View style={[styles.line, { backgroundColor: m.color + '55' }]} /> : null}
              </View>
              <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => onSelect(id)}>
                <Blip color={c.color} icon={c.icon} size={24} />
                <View style={{ flex: 1 }}>
                  <Body size={16} weight="bold" color={isDone ? colors.textMute : colors.text} style={isDone ? { textDecorationLine: 'line-through' } : undefined}>
                    {p.name}
                  </Body>
                  <Body size={12} color={colors.textMute}>
                    {p.area}
                  </Body>
                </View>
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  tap();
                  toggleStop(id);
                }}
                style={[styles.box, isDone && { backgroundColor: m.color, borderColor: m.color }]}
              >
                {isDone ? <Glyph icon="check" size={14} color={colors.ink} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      {complete ? (
        <View style={[styles.reward, { borderColor: m.color }]}>
          <Body size={12} weight="bold" color={colors.textDim} style={{ letterSpacing: 2 }}>
            MISSION PASSED
          </Body>
          <Display size={26} color={m.color}>
            {m.reward}
          </Display>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {active ? (
          <ActionButton label="Stop mission" icon="close" color={m.color} filled={false} onPress={onStop} style={{ flex: 1 }} />
        ) : (
          <ActionButton label="Start mission" icon="route" color={m.color} onPress={onStart} style={{ flex: 1 }} />
        )}
      </View>
      <Body size={11} color={colors.textMute} style={{ marginTop: 10 }}>
        Tick each stop when you get there. Progress is saved on your phone.
      </Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  rail: { width: 28, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center' },
  num: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink, zIndex: 2 },
  line: { position: 'absolute', top: '50%', bottom: '-50%', width: 2 },
  box: { width: 26, height: 26, borderWidth: 1.5, borderColor: colors.textMute, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  reward: { borderWidth: 1.5, padding: 14, marginTop: 16, alignItems: 'center', transform: [{ skewX: '-6deg' }] },
});
