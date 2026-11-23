import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ALL_PLACES, placeCat, type PlaceCategory } from '../data';
import { colors } from '../theme/theme';

/**
 * Corner radar for drive mode: nearby blips around the player, heading-up.
 * Pure SVG (no second map instance), so it costs almost nothing per GPS fix.
 */
const SIZE = 132;
const R = SIZE / 2;
const RANGE_KM = 1.6;

function project(lat0: number, lng0: number, lat: number, lng: number) {
  const x = (lng - lng0) * Math.cos((lat0 * Math.PI) / 180) * 111.32;
  const y = (lat - lat0) * 110.57;
  return [x, y];
}

export const Radar = memo(function Radar({
  lat,
  lng,
  heading,
  visible,
  dest,
}: {
  lat: number;
  lng: number;
  heading: number;
  visible: PlaceCategory[];
  dest: { lat: number; lng: number; color: string } | null;
}) {
  const rot = (-heading * Math.PI) / 180;
  const toScreen = (x: number, y: number) => {
    const rx = x * Math.cos(rot) - y * Math.sin(rot);
    const ry = x * Math.sin(rot) + y * Math.cos(rot);
    return [R + (rx / RANGE_KM) * (R - 8), R - (ry / RANGE_KM) * (R - 8)];
  };
  // Candidate blips within ~2x range (cheap pre-filter, recomputed when the car moves ~100 m).
  const qlat = Math.round(lat * 1000) / 1000;
  const qlng = Math.round(lng * 1000) / 1000;
  const near = useMemo(
    () =>
      ALL_PLACES.filter((p) => visible.includes(p.cat))
        .filter((p) => {
          const [x, y] = project(qlat, qlng, p.lat, p.lng);
          return Math.hypot(x, y) < RANGE_KM * 1.6;
        }),
    [qlat, qlng, visible],
  );

  let destMark: { x: number; y: number; edge: boolean } | null = null;
  if (dest) {
    const [x, y] = project(lat, lng, dest.lat, dest.lng);
    const d = Math.hypot(x, y);
    const k = d > RANGE_KM * 0.92 ? (RANGE_KM * 0.92) / d : 1;
    const [sx, sy] = toScreen(x * k, y * k);
    destMark = { x: sx, y: sy, edge: k < 1 };
  }
  const [nx, ny] = toScreen(0, RANGE_KM * 0.86);

  return (
    <View style={styles.wrap} pointerEvents="none" accessible accessibilityLabel="Radar of nearby places">
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={R} cy={R} r={R - 1} fill="rgba(12,10,18,0.86)" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} />
        <Circle cx={R} cy={R} r={(R - 8) / 2} fill="none" stroke="rgba(255,255,255,0.08)" />
        <Line x1={R} y1={6} x2={R} y2={SIZE - 6} stroke="rgba(255,255,255,0.06)" />
        <Line x1={6} y1={R} x2={SIZE - 6} y2={R} stroke="rgba(255,255,255,0.06)" />
        {near.map((p) => {
          const [px, py] = project(lat, lng, p.lat, p.lng);
          const [ex, ey] = toScreen(px, py);
          if (Math.hypot(ex - R, ey - R) > R - 6) return null;
          return <Rect key={p.id} x={ex - 4} y={ey - 4} width={8} height={8} rx={2} fill={placeCat[p.cat].color} stroke="#08060C" strokeWidth={1.5} />;
        })}
        {destMark ? (
          destMark.edge ? (
            <G transform={`translate(${destMark.x} ${destMark.y}) rotate(${(Math.atan2(destMark.y - R, destMark.x - R) * 180) / Math.PI + 90})`}>
              <Path d="M0 -7 L6 5 L0 2 L-6 5 Z" fill={dest!.color} stroke="#08060C" strokeWidth={1.5} />
            </G>
          ) : (
            <Circle cx={destMark.x} cy={destMark.y} r={6} fill={dest!.color} stroke="#08060C" strokeWidth={2} />
          )
        ) : null}
        <SvgText x={nx} y={ny + 4} fill={colors.textDim} fontSize={10} fontWeight="700" textAnchor="middle">
          N
        </SvgText>
        <Path d={`M${R} ${R - 8} L${R + 6} ${R + 6} L${R} ${R + 3} L${R - 6} ${R + 6} Z`} fill="#FFFFFF" stroke="#08060C" strokeWidth={1.5} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, borderRadius: R, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
});
