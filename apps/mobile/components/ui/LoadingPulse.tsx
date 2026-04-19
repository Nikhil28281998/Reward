import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, interpolate,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { wp } from '../../lib/responsive';

interface LoadingPulseProps {
  rows?: number;
  height?: number;
  style?: ViewStyle;
}

function PulseBar({ width, height = 16, delay }: { width: number | string; height?: number; delay: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 + delay }),
        withTiming(1, { duration: 600 + delay }),
      ),
      -1,
      false,
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width,
          height,
          backgroundColor: Colors.surfaceAlt,
          borderRadius: Radius.md,
        },
      ]}
    />
  );
}

export function LoadingPulse({ rows = 3, height = 64, style }: LoadingPulseProps) {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, { height }]}>
          {height > 32 ? (
            /* Card-like skeleton */
            <>
              <View style={styles.rowLeft}>
                <PulseBar width={44} height={44} delay={i * 80} />
              </View>
              <View style={styles.rowRight}>
                <PulseBar width={wp(45)} height={16} delay={i * 80 + 40} />
                <PulseBar width={wp(30)} height={12} delay={i * 80 + 80} />
              </View>
              <PulseBar width={wp(15)} height={16} delay={i * 80 + 60} />
            </>
          ) : (
            /* Simple bar */
            <PulseBar width="100%" height={height} delay={i * 80} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing['3'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] },
  rowLeft: {},
  rowRight: { flex: 1, gap: Spacing['2'] },
});
