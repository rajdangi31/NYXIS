// ─────────────────────────────────────────────
//  StatRadar — pentagon star chart for 5 stats
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Profile } from '../lib/database.types';
import { STAT_LABELS } from '../lib/gameLogic';

interface StatRadarProps {
  profile: Profile;
}

const STATS: Array<keyof Pick<Profile, 'stats_str' | 'stats_int' | 'stats_vit' | 'stats_dex' | 'stats_wis'>> = [
  'stats_str',
  'stats_vit',
  'stats_dex',
  'stats_int',
  'stats_wis',
];

const NEON = '#00E5FF';
const SIZE = 200;       // SVG canvas width & height
const CX = SIZE / 2;    // centre x
const CY = SIZE / 2;    // centre y
const MAX_RADIUS = 72;  // outer ring radius
const MAX_STAT = 100;   // stat cap for full ring

/** Convert polar to Cartesian, 0° = top */
function polar(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

// Wrap SVG components to support Animated values
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function StatRadar({ profile }: StatRadarProps) {
  const angleStep = 360 / STATS.length;

  // Track each stat with an Animated.Value
  const animatedStats = useRef(STATS.map((k) => new Animated.Value(Math.min(profile[k] as number, MAX_STAT)))).current;

  // Whenever the prop `profile` changes, animate the values to the new stats
  useEffect(() => {
    const animations = STATS.map((key, i) => {
      const rawValue = profile[key] as number;
      const capped = Math.min(rawValue, MAX_STAT);
      return Animated.timing(animatedStats[i], {
        toValue: capped,
        duration: 1200, // 1.2s smooth morph
        useNativeDriver: false, // SVG props cannot use native driver
      });
    });

    Animated.parallel(animations).start();
  }, [profile]);

  // Points for the background rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0].map((fraction) =>
    STATS.map((_, i) => polar(i * angleStep, MAX_RADIUS * fraction))
  );

  const toPolyPoints = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Label positions (slightly past the outer ring)
  const labelPositions = STATS.map((_, i) => polar(i * angleStep, MAX_RADIUS + 18));

  // The actual Polygon string needs to be computed reactively.
  // Because AnimatedPolygon `points` doesn't accept complex listener functions easily, we do a multi-interpolation trick.
  // We'll interpolate each stat value into its "x,y " string segment.
  
  // Create an array of string interpolations for each point
  const pointInterpolations = STATS.map((_, i) => {
    return animatedStats[i].interpolate({
      inputRange: [0, MAX_STAT],
      outputRange: [
        `${polar(i * angleStep, 0).x},${polar(i * angleStep, 0).y}`,
        `${polar(i * angleStep, MAX_RADIUS).x},${polar(i * angleStep, MAX_RADIUS).y}`
      ],
    });
  });

  // Since React Native Animated can't combine multiple string interpolations natively out-of-the-box into a single string prop,
  // we attach a listener to force update state to feed standard Polygon.
  const [livePoints, setLivePoints] = React.useState(
    STATS.map((k, i) => polar(i * angleStep, (Math.min(profile[k] as number, MAX_STAT) / MAX_STAT) * MAX_RADIUS))
  );

  useEffect(() => {
    const id = animatedStats[0].addListener(() => {
      // Just read the __getValue() from all of them
      setLivePoints(
        STATS.map((_, i) => {
          const val = (animatedStats[i] as any).__getValue();
          const radius = (val / MAX_STAT) * MAX_RADIUS;
          return polar(i * angleStep, radius);
        })
      );
    });
    return () => animatedStats[0].removeListener(id);
  }, []);


  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background rings */}
        {rings.map((ring, ri) => (
          <Polygon
            key={`ring-${ri}`}
            points={toPolyPoints(ring)}
            fill="none"
            stroke={ri === 3 ? '#00E5FF33' : '#1A1A1A'}
            strokeWidth={ri === 3 ? 1.5 : 1}
          />
        ))}

        {/* Axis lines from center */}
        {STATS.map((_, i) => {
          const outer = polar(i * angleStep, MAX_RADIUS);
          return (
            <Line
              key={`axis-${i}`}
              x1={CX} y1={CY}
              x2={outer.x} y2={outer.y}
              stroke="#1E1E1E"
              strokeWidth={1}
            />
          );
        })}

        {/* Player stat polygon — filled neon */}
        <Polygon
          points={toPolyPoints(livePoints)}
          fill="#00E5FF18"
          stroke={NEON}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Dots at each stat vertex */}
        {livePoints.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y}
            r={4}
            fill={NEON}
            stroke="#000"
            strokeWidth={1.5}
          />
        ))}

        {/* Axis labels */}
        {STATS.map((key, i) => {
          const pos = labelPositions[i];
          return (
            <SvgText
              key={`label-${i}`}
              x={pos.x}
              y={pos.y + 4}
              fill="#00E5FF"
              fontSize="10"
              textAnchor="middle"
              fontFamily="SpaceMono"
              letterSpacing={1}
            >
              {STAT_LABELS[key]}
            </SvgText>
          );
        })}
      </Svg>

      {/* Numeric stat values in a row below (also live updated) */}
      <View style={styles.statRow}>
        {STATS.map((key, i) => {
           // Create a quick local state for the number readout
           const [liveNum, setLiveNum] = React.useState(profile[key] as number);
           useEffect(() => {
             const listener = animatedStats[i].addListener(({ value }) => setLiveNum(Math.round(value)));
             return () => animatedStats[i].removeListener(listener);
           }, []);
           
           return (
            <View key={key} style={styles.statItem}>
              <Text style={styles.statValue}>{liveNum}</Text>
              <Text style={styles.statLabel}>{STAT_LABELS[key]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  statLabel: {
    color: '#00E5FF',
    fontSize: 9,
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
    marginTop: 2,
  },
});
