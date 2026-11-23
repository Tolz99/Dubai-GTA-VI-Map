import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ICON_PATHS, type IconName } from '../data/categories';
import { colors, fonts } from '../theme/theme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

export function Blip({ color, icon, size = 28, ring = '#0B0618', dim }: { color: string; icon: IconName; size?: number; ring?: string; dim?: boolean }) {
  const inner = size * 0.56;
  return (
    <View style={{ width: size, height: size, opacity: dim ? 0.35 : 1 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1.5} fill={color} stroke={ring} strokeWidth={2} />
      </Svg>
      <View style={{ position: 'absolute', left: (size - inner) / 2, top: (size - inner) / 2 }}>
        <Svg width={inner} height={inner} viewBox="0 0 24 24">
          <Path d={ICON_PATHS[icon]} fill="#0B0618" />
        </Svg>
      </View>
    </View>
  );
}

export function Glyph({ icon, size = 20, color = colors.text }: { icon: IconName | 'menu' | 'search' | 'close' | 'locate' | 'cube' | 'compass' | 'plus' | 'check' | 'route' | 'trash' | 'chev'; size?: number; color?: string }) {
  const extra: Record<string, string> = {
    menu: 'M3 5h18v2.5H3zm0 5.75h18v2.5H3zM3 16.5h12V19H3z',
    search: 'M10 3a7 7 0 015.6 11.2l5.1 5.1-1.8 1.8-5.1-5.1A7 7 0 1110 3zm0 2.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z',
    close: 'M5.6 4l6.4 6.4L18.4 4 20 5.6 13.6 12l6.4 6.4-1.6 1.6-6.4-6.4L5.6 20 4 18.4 10.4 12 4 5.6z',
    locate: 'M11 2h2v3.1A7 7 0 0118.9 11H22v2h-3.1A7 7 0 0113 18.9V22h-2v-3.1A7 7 0 015.1 13H2v-2h3.1A7 7 0 0111 5.1zm1 5a5 5 0 100 10 5 5 0 000-10zm0 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z',
    cube: 'M12 2l9 5v10l-9 5-9-5V7zm0 2.3L5.4 8 12 11.7 18.6 8zM5 9.7v6.1l6 3.4v-6.1zm14 0l-6 3.4v6.1l6-3.4z',
    compass: 'M12 2l4 10-4 10-4-10zm0 4.5L9.8 12h4.4z',
    plus: 'M10.75 4h2.5v6.75H20v2.5h-6.75V20h-2.5v-6.75H4v-2.5h6.75z',
    check: 'M9.5 16.2L4.8 11.5 3 13.3l6.5 6.5L21 8.3l-1.8-1.8z',
    route: 'M6 3a3 3 0 012.8 4H15a4 4 0 010 8H9a1.5 1.5 0 000 3h6.2A3 3 0 1115.2 20H9a3.5 3.5 0 010-7h6a2 2 0 000-4H8.8A3 3 0 116 3z',
    trash: 'M9 3h6l1 2h4v2H4V5h4zM6 8h12l-1 13H7z',
    chev: 'M8.6 5.4L10 4l8 8-8 8-1.4-1.4L15.2 12z',
  };
  const d = (ICON_PATHS as Record<string, string>)[icon] ?? extra[icon];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} />
    </Svg>
  );
}

export function Display({ children, style, size = 22, color = colors.text, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; size?: number; color?: string; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: fonts.display, fontSize: size, color, letterSpacing: 0.6, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, size = 15, color = colors.text, weight = 'medium', numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; size?: number; color?: string; weight?: 'medium' | 'semi' | 'bold'; numberOfLines?: number }) {
  const fontFamily = weight === 'bold' ? fonts.bodyBold : weight === 'semi' ? fonts.bodySemi : fonts.body;
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily, fontSize: size, color }, style]}>
      {children}
    </Text>
  );
}

export function SunsetBar({ style, height = 3 }: { style?: StyleProp<ViewStyle>; height?: number }) {
  return <LinearGradient colors={[...colors.sunset]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[{ height }, style]} />;
}

export function RoundButton({ onPress, children, active, style, badge }: { onPress: () => void; children: ReactNode; active?: boolean; style?: StyleProp<ViewStyle>; badge?: number }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.round, active && s.roundActive, pressed && { transform: [{ scale: 0.92 }] }, style]}
    >
      {children}
      {badge ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ActionButton({ label, onPress, color = colors.pink, icon, filled = true, style, small }: { label: string; onPress: () => void; color?: string; icon?: Parameters<typeof Glyph>[0]['icon']; filled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        s.action,
        small && { paddingVertical: 8, paddingHorizontal: 12 },
        filled ? { backgroundColor: color, borderColor: color } : { borderColor: color, backgroundColor: 'transparent' },
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {icon ? <Glyph icon={icon} size={small ? 14 : 17} color={filled ? colors.ink : color} /> : null}
      <Text style={[s.actionText, small && { fontSize: 13 }, { color: filled ? colors.ink : color }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, color, onPress, active, onLongPress }: { label: string; color: string; onPress?: () => void; active?: boolean; onLongPress?: () => void }) {
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              tap();
              onPress();
            }
          : undefined
      }
      onLongPress={onLongPress}
      style={({ pressed }) => [s.chip, { borderColor: color + (active ? 'FF' : '55'), backgroundColor: active ? color + '33' : 'rgba(255,255,255,0.03)' }, pressed && { opacity: 0.7 }]}
    >
      <View style={[s.chipDot, { backgroundColor: color }]} />
      <Text style={[s.chipText, active && { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActive: { borderColor: colors.cyan, backgroundColor: 'rgba(41,227,255,0.15)' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  badgeText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 11 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    transform: [{ skewX: '-8deg' }],
  },
  actionText: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    borderWidth: 1,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { color: colors.textDim, fontFamily: fonts.bodySemi, fontSize: 13 },
});
