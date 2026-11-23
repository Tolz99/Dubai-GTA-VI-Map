import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme/theme';
import { Glyph } from './ui';

/** Bottom card. Slides up, grabber + close, no decoration. */
export function Sheet({ open, onClose, children, maxHeight = 0.6 }: { open: boolean; onClose: () => void; children: ReactNode; maxHeight?: number }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(height)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.spring(y, { toValue: open ? 0 : height, useNativeDriver: true, damping: 26, stiffness: 260, mass: 0.9 }).start(() => {
      if (!open) setMounted(false);
    });
  }, [open, height, y]);

  if (!mounted) return null;
  return (
    <Animated.View style={[styles.sheet, { maxHeight: height * maxHeight, paddingBottom: insets.bottom, transform: [{ translateY: y }] }]}>
      <View style={styles.grabber} />
      <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Close">
        <Glyph icon="close" size={16} color={colors.textDim} />
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 8 },
  close: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
