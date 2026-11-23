import * as Haptics from 'expo-haptics';
import { memo, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ICON_PATHS, type IconName } from '../data/categories';
import { colors, fonts, radius } from '../theme/theme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}
/** Heavier tick for confirmations (waypoint set, favourite added, mission passed). */
export function thud() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
export function success() {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Map blip: rounded colour tile, dark glyph, dark outline. Same drawing as the map (map.js makeBlip). */
export const Blip = memo(function Blip({ color, icon, size = 26, dim, ring }: { color: string; icon: IconName; size?: number; dim?: boolean; ring?: boolean }) {
  const d = ICON_PATHS[icon];
  const g = size * 0.62;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: INK,
        padding: Math.max(1.5, size * 0.07),
        opacity: dim ? 0.3 : 1,
        borderWidth: ring ? 1.5 : 0,
        borderColor: colors.text,
      }}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ flex: 1, borderRadius: size * 0.22, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={g} height={g} viewBox="0 0 24 24">
          <Path d={d} fill={INK} fillRule="evenodd" />
        </Svg>
      </View>
    </View>
  );
});

const INK = '#08060C';
/** Cap Dynamic Type so big accessibility sizes grow text without breaking map overlays. */
export const MAX_FONT_SCALE = 1.35;

const UI_ICONS = {
  menu: 'M3 5.5h18v2H3zm0 5.5h18v2H3zm0 5.5h18v2H3z',
  search: 'M10.5 3a7.5 7.5 0 015.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z',
  close: 'M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z',
  locate: 'M12 2l8.5 19.5L12 17l-8.5 4.5z',
  layers: 'M12 2l10 5.5-10 5.5L2 7.5zm-7.6 9.4L12 15.6l7.6-4.2L22 12.7 12 18.2 2 12.7zm0 5L12 20.6l7.6-4.2L22 17.7 12 23.2 2 17.7z',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zm0 2.3L5.4 8 12 11.7 18.6 8zM5 9.7v6.1l6 3.4v-6.1zm14 0l-6 3.4v6.1l6-3.4z',
  plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z',
  check: 'M9.5 16.2L4.8 11.5 3.4 12.9l6.1 6.1L20.6 7.9l-1.4-1.4z',
  route: 'M6 3a3 3 0 012.8 4H15a4 4 0 010 8H9a1.5 1.5 0 000 3h6.2A3 3 0 1115.2 20H9a3.5 3.5 0 010-7h6a2 2 0 000-4H8.8A3 3 0 116 3z',
  chev: 'M9 5.5L10.4 4l8 8-8 8L9 18.5l6.5-6.5z',
  car: 'M6.5 5h11l2.3 6H21v7h-2v2h-3v-2H8v2H5v-2H3v-7h1.2zm1.4 2l-1.6 4h11.4l-1.6-4zM6.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm11 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  arrowUp: 'M12 3l7 8h-4.5v10h-5V11H5z',
  arrowLeft: 'M3 12l8-7v4.5h6a4 4 0 014 4V21h-4v-7.5a1 1 0 00-1-1h-5V19z',
  arrowRight: 'M21 12l-8-7v4.5H7a4 4 0 00-4 4V21h4v-7.5a1 1 0 011-1h5V19z',
  uturn: 'M8 21V9a5 5 0 0110 0v6h3l-5 6-5-6h3V9a1 1 0 00-2 0v12z',
  roundabout: 'M12 2l5 5h-3.5v2.2a5 5 0 11-3 0V7H7zm0 9a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  flag: 'M5 2h2v20H5zm3 1h11l-2.5 4L19 11H8z',
  heart: 'M12 21.2l-1.4-1.3C5.4 15.2 2 12.1 2 8.3 2 5.2 4.4 2.8 7.5 2.8c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.8-3.4 6.9-8.6 11.6z',
  heartOutline: 'M12 21.2l-1.4-1.3C5.4 15.2 2 12.1 2 8.3 2 5.2 4.4 2.8 7.5 2.8c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1 3.1 0 5.5 2.4 5.5 5.5 0 3.8-3.4 6.9-8.6 11.6zm0-2.7c4.6-4.2 7.8-7.1 7.8-10.2a3.3 3.3 0 00-3.3-3.3c-1.4 0-2.7.9-3.2 2.1h-2.6c-.5-1.2-1.8-2.1-3.2-2.1a3.3 3.3 0 00-3.3 3.3c0 3.1 3.2 6 7.8 10.2z',
  eye: 'M12 5c5 0 9 4.5 10.5 7-1.5 2.5-5.5 7-10.5 7S3 14.5 1.5 12C3 9.5 7 5 12 5zm0 3a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z',
  eyeOff: 'M3.3 2.3l18.4 18.4-1.4 1.4-3.4-3.4A11 11 0 0112 19C7 19 3 14.5 1.5 12a18 18 0 014.2-4.9L1.9 3.7zm4 6.2A15 15 0 003.9 12c1.5 2.1 4.5 5 8.1 5 1.2 0 2.3-.3 3.3-.8l-1.7-1.7a4 4 0 01-5.1-5.1zM12 5c5 0 9 4.5 10.5 7a17 17 0 01-3.1 3.9l-2.5-2.5A4 4 0 0010.6 8L8.4 5.8A9.5 9.5 0 0112 5z',
  minus: 'M4 11h16v2H4z',
  compass: 'M12 2l4 10h-8zm0 20l-4-10h8z',
} as const;
export type UIIcon = keyof typeof UI_ICONS;

export function Glyph({ icon, size = 20, color = colors.text }: { icon: UIIcon | IconName; size?: number; color?: string }) {
  const d = (UI_ICONS as Record<string, string>)[icon] ?? ICON_PATHS[icon as IconName];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

/** Condensed uppercase heading. */
export function H({ children, size = 20, color = colors.text, italic, style, numberOfLines, accessibilityRole }: { children: ReactNode; size?: number; color?: string; italic?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number; accessibilityRole?: 'header' }) {
  return (
    <Text
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[{ fontFamily: italic ? fonts.headingItalic : fonts.heading, fontSize: size, lineHeight: Math.round(size * 1.08), color, textTransform: 'uppercase', letterSpacing: 0.3 }, style]}
    >
      {children}
    </Text>
  );
}

/** Body text. */
export function T({ children, size = 15, color = colors.text, weight = 400, style, numberOfLines }: { children: ReactNode; size?: number; color?: string; weight?: 400 | 500 | 600 | 700; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const fontFamily = weight === 700 ? fonts.bodyBold : weight === 600 ? fonts.bodySemi : weight === 500 ? fonts.bodyMedium : fonts.body;
  return (
    <Text numberOfLines={numberOfLines} maxFontSizeMultiplier={MAX_FONT_SCALE} style={[{ fontFamily, fontSize: size, lineHeight: Math.round(size * 1.38), color }, style]}>
      {children}
    </Text>
  );
}

/** Small tracked label used for section headers. */
export function Label({ children, color = colors.textMute, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, color, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

/** Square translucent map control. */
export function MapButton({ onPress, children, active, badge, style, label }: { onPress: () => void; children: ReactNode; active?: boolean; badge?: number; style?: StyleProp<ViewStyle>; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      accessibilityState={active != null ? { selected: active } : undefined}
      hitSlop={4}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.mapBtn, active && s.mapBtnActive, pressed && s.pressed, style]}
    >
      {children}
      {badge ? (
        <View style={s.badge}>
          <Text maxFontSizeMultiplier={1.2} style={s.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type Variant = 'primary' | 'secondary' | 'tint';
/** Primary = white bar with black text (selected-menu look). */
export function Button({ label, onPress, variant = 'primary', icon, tint = colors.waypoint, style, compact }: { label: string; onPress: () => void; variant?: Variant; icon?: UIIcon | IconName; tint?: string; style?: StyleProp<ViewStyle>; compact?: boolean }) {
  const bg = variant === 'primary' ? colors.text : variant === 'tint' ? tint : 'transparent';
  const fg = variant === 'secondary' ? colors.text : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        s.btn,
        compact && { height: 40, paddingHorizontal: 12 },
        { backgroundColor: bg },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.raised },
        pressed && s.pressed,
        style,
      ]}
    >
      {icon ? <Glyph icon={icon} size={compact ? 16 : 18} color={fg} /> : null}
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[s.btnText, compact && { fontSize: 15 }, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, color, onPress, active }: { label: string; color: string; onPress?: () => void; active?: boolean }) {
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
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityState={active != null ? { selected: active } : undefined}
      style={({ pressed }) => [s.chip, active && s.chipActive, pressed && s.pressed]}
    >
      <View style={[s.chipDot, { backgroundColor: color }]} />
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[s.chipText, active && { color: colors.ink }]} numberOfLines={1}>
        {label}
      </Text>
      {active ? <Glyph icon="check" size={13} color={colors.ink} /> : null}
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline }, style]} />;
}

const s = StyleSheet.create({
  pressed: { opacity: 0.72 },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnActive: { backgroundColor: colors.text },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 10.5 },
  btn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
  },
  btnText: { fontFamily: fonts.heading, fontSize: 17, letterSpacing: 0.6, textTransform: 'uppercase' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.raised,
  },
  chipActive: { backgroundColor: colors.text },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13.5 },
});
