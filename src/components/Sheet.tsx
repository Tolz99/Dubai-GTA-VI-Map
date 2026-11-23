import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import { Glyph } from './ui';

/** Bottom "briefing" panel with a colored top edge. */
export function Sheet({ open, onClose, children, accent = colors.pink, maxHeight = 0.62 }: { open: boolean; onClose: () => void; children: ReactNode; accent?: string; maxHeight?: number }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(height)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.spring(y, { toValue: open ? 0 : height, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.9 }).start(() => {
      if (!open) setMounted(false);
    });
  }, [open, height, y]);

  if (!mounted) return null;
  return (
    <Animated.View
      style={[
        styles.sheet,
        { maxHeight: height * maxHeight, paddingBottom: insets.bottom + 8, borderTopColor: accent, transform: [{ translateY: y }] },
      ]}
    >
      <View style={[styles.glow, { backgroundColor: accent }]} />
      <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
        <Glyph icon="close" size={18} color={colors.textDim} />
      </Pressable>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderTopWidth: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  glow: { position: 'absolute', top: -3, left: 0, right: 0, height: 14, opacity: 0.18 },
  close: { position: 'absolute', right: 12, top: 12, zIndex: 5, padding: 6 },
});
