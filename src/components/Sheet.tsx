import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme/theme';
import { Glyph } from './ui';

/**
 * Draggable bottom sheet with two snap points (peek and full), sized to its content.
 * - Drag the sheet (anywhere while peeking, from the top of the list while expanded).
 * - Flick down past the peek height to dismiss.
 * Content must scroll with <SheetScrollView> so the sheet knows the list's offset and height.
 */

interface Ctx {
  expanded: boolean;
  onScrollY: (y: number) => void;
  onContentH: (h: number) => void;
  bottomInset: number;
}
const SheetCtx = createContext<Ctx | null>(null);

const CHROME = 22; // grabber strip above the content
const SPRING = { damping: 30, stiffness: 320, mass: 0.9, useNativeDriver: true } as const;

export function Sheet({
  open,
  onClose,
  children,
  peek = 0.46,
  max = 0.9,
  label = 'Details',
  contentKey,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Peek height as a fraction of the screen. */
  peek?: number;
  /** Max height as a fraction of the screen. */
  max?: number;
  label?: string;
  /** Changing this (e.g. a new place) drops the sheet back to its peek height. */
  contentKey?: string;
}) {
  const { height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxH = Math.round(H * max - insets.top);
  const [contentH, setContentH] = useState(0);
  const fullH = Math.min(maxH, Math.max(contentH + CHROME, 160));
  const peekH = Math.min(Math.round(H * peek), fullH);
  const snaps = useMemo(() => (peekH < fullH - 24 ? [peekH, fullH] : [fullH]), [peekH, fullH]);

  const [mounted, setMounted] = useState(open);
  const [snapIdx, setSnapIdx] = useState(0);
  const [y] = useState(() => new Animated.Value(H)); // translateY from the "fully open" position
  const yNow = useRef(H);
  const scrollY = useRef(0);
  const dragStart = useRef(0);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  // Opening (or new content) starts at the peek height. Adjusting state during render is the
  // React-recommended way to reset state on a prop change.
  const [prev, setPrev] = useState({ open, contentKey });
  if (prev.open !== open || prev.contentKey !== contentKey) {
    setPrev({ open, contentKey });
    if (open) {
      setMounted(true);
      setSnapIdx(0);
    }
  }

  useEffect(() => {
    const id = y.addListener(({ value }) => (yNow.current = value));
    return () => y.removeListener(id);
  }, [y]);

  const offsetFor = useCallback((h: number) => fullH - h, [fullH]);

  const animateTo = useCallback(
    (toY: number, after?: () => void) => {
      Animated.spring(y, { ...SPRING, toValue: toY }).start(({ finished }) => finished && after?.());
    },
    [y],
  );

  // close: slide out, then unmount
  useEffect(() => {
    scrollY.current = 0;
    if (!open) animateTo(fullH + 40, () => setMounted(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contentKey]);

  // Follow content size / snap changes (also performs the opening slide).
  useEffect(() => {
    if (!open || !contentH) return; // wait for the first measurement so the sheet doesn't grow mid-slide
    const i = Math.min(snapIdx, snaps.length - 1);
    animateTo(offsetFor(snaps[i]));
  }, [open, contentH, snaps, snapIdx, offsetFor, animateTo]);

  const expanded = snapIdx === snaps.length - 1;
  const state = useRef({ expanded, snaps, fullH, offsetFor, snapIdx });
  useLayoutEffect(() => {
    state.current = { expanded, snaps, fullH, offsetFor, snapIdx };
  });

  // Handlers only read refs when a gesture happens, never during render (the lint rule can't tell
  // PanResponder callbacks apart from render code).
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        if (Math.abs(g.dy) < 6 || Math.abs(g.dy) < Math.abs(g.dx) * 1.3) return false;
        const s = state.current;
        if (!s.expanded) return true; // peeking: the whole sheet drags
        return g.dy > 0 && scrollY.current <= 0; // expanded: pull down from the top of the list
      },
      onPanResponderGrant: () => {
        y.stopAnimation();
        dragStart.current = yNow.current;
      },
      onPanResponderMove: (_e, g) => {
        let next = dragStart.current + g.dy;
        if (next < 0) next = next / 3; // rubber band above full height
        y.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const s = state.current;
        const projected = yNow.current + g.vy * 160;
        const visible = s.fullH - projected;
        if (visible < s.snaps[0] * 0.6 || (g.vy > 1.4 && !s.expanded)) {
          animateTo(s.fullH + 40, () => {
            setMounted(false);
            onCloseRef.current();
          });
          return;
        }
        let best = 0;
        s.snaps.forEach((h, i) => {
          if (Math.abs(h - visible) < Math.abs(s.snaps[best] - visible)) best = i;
        });
        setSnapIdx(best);
        animateTo(s.offsetFor(s.snaps[best]));
      },
      onPanResponderTerminate: () => {
        const s = state.current;
        animateTo(s.offsetFor(s.snaps[Math.min(s.snapIdx, s.snaps.length - 1)]));
      },
    }),
  );

  const ctx = useMemo<Ctx>(
    () => ({
      expanded,
      onScrollY: (v) => (scrollY.current = v),
      onContentH: (h) => setContentH((old) => (Math.abs(old - h) > 1 ? h : old)),
      bottomInset: insets.bottom,
    }),
    [expanded, insets.bottom],
  );

  if (!mounted) return null;
  return (
    <Animated.View
      accessibilityViewIsModal={false}
      accessibilityLabel={label}
      style={[styles.sheet, { height: fullH, transform: [{ translateY: y }] }]}
      {...pan.panHandlers}
    >
      <Pressable
        onPress={() => {
          const next = expanded ? 0 : snaps.length - 1;
          setSnapIdx(next);
        }}
        accessibilityRole="adjustable"
        accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
        style={styles.grabZone}
      >
        <View style={styles.grabber} />
      </Pressable>
      <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
        <Glyph icon="close" size={16} color={colors.textDim} />
      </Pressable>
      <SheetCtx.Provider value={ctx}>{children}</SheetCtx.Provider>
    </Animated.View>
  );
}

/** ScrollView that cooperates with <Sheet> drag gestures and sizes the sheet to its content. */
export function SheetScrollView({ children, contentContainerStyle, ...rest }: ScrollViewProps & { children: ReactNode }) {
  const ctx = useContext(SheetCtx);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => ctx?.onScrollY(e.nativeEvent.contentOffset.y), [ctx]);
  return (
    <ScrollView
      {...rest}
      scrollEnabled={ctx ? ctx.expanded : true}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={(_w, h) => ctx?.onContentH(h)}
      contentContainerStyle={[contentContainerStyle, { paddingBottom: (ctx?.bottomInset ?? 0) + 20 }]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
    overflow: 'hidden',
    userSelect: 'none',
  },
  grabZone: { height: CHROME, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)' },
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
