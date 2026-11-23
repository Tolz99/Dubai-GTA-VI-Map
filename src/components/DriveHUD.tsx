import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtKm, fmtMin } from '../lib/geo';
import { fmtDistance, maneuverIcon, type Guidance } from '../lib/guidance';
import { colors, radius } from '../theme/theme';
import { Button, Glyph, H, T } from './ui';

/** Turn-by-turn heads-up display (phone). Mirrors what a CarPlay maneuver panel shows. */
export function DriveHUD({ g, destination, onEnd }: { g: Guidance; destination: string; onEnd: () => void }) {
  const insets = useSafeAreaInsets();
  // Clock for the ETA, ticking every 30 s (render stays pure).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const eta = new Date(now + g.remainingSec * 1000);
  const etaStr = `${eta.getHours().toString().padStart(2, '0')}:${eta.getMinutes().toString().padStart(2, '0')}`;
  return (
    <>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={styles.maneuver}>
          <View style={styles.icon}>
            <Glyph icon={maneuverIcon(g.current)} size={40} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <H size={34}>{g.arrived ? 'Arrived' : fmtDistance(g.toNext)}</H>
            <T size={17} weight={600} numberOfLines={2}>
              {g.arrived ? destination : g.current.instruction}
            </T>
          </View>
        </View>
        {g.next && !g.arrived ? (
          <View style={styles.then}>
            <T size={13} weight={600} color={colors.textDim}>
              Then
            </T>
            <Glyph icon={maneuverIcon(g.next)} size={16} color={colors.textDim} />
            <T size={13} color={colors.textDim} numberOfLines={1} style={{ flex: 1 }}>
              {g.next.instruction}
            </T>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <H size={28}>{fmtMin(g.remainingSec)}</H>
            <T size={14} color={colors.textDim}>
              {fmtKm(g.remaining / 1000)} · arrive {etaStr}
            </T>
          </View>
          <T size={13} color={colors.textMute} numberOfLines={1}>
            To {destination}
          </T>
        </View>
        <Button label="End" variant="tint" tint={colors.danger} onPress={onEnd} compact style={{ minWidth: 76 }} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12 },
  maneuver: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.panel },
  icon: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  then: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: colors.panel },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, backgroundColor: colors.panel, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
});
