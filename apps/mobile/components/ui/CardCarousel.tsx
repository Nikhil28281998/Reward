import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
  interpolate, Extrapolate, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp, hp } from '../../lib/responsive';
import { useUIStore } from '../../lib/store';
import { LoadingPulse } from './LoadingPulse';
import { formatUSD } from '@reward/shared';
import type { CardAccount } from '@reward/shared';

const CARD_WIDTH = wp(80);
const CARD_HEIGHT = hp(22);
const CARD_GAP = Spacing['4'];
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_PADDING = (100 - 80) / 2; // wp(10) each side

interface CardCarouselProps {
  cards: CardAccount[];
  isLoading?: boolean;
}

function CardVisual({ card, index, scrollX, totalCards }: {
  card: CardAccount;
  index: number;
  scrollX: Animated.SharedValue<number>;
  totalCards: number;
}) {
  const gradient = (card.cardProduct?.gradient ?? ['#3B1FA8', '#7C3AED']) as [string, string];
  const utilPct = card.utilizationPct ?? 0;

  const animStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolate.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [12, 0, 12], Extrapolate.CLAMP);

    return { transform: [{ scale }, { translateY }] };
  });

  return (
    <Animated.View style={[{ width: CARD_WIDTH, height: CARD_HEIGHT }, animStyle]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1 }}
        style={styles.card}
      >
        {/* Glossy overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Card chip */}
        <View style={styles.chip}>
          <View style={styles.chipLeft} />
          <View style={styles.chipRight} />
        </View>

        {/* Issuer + name */}
        <View style={styles.cardHeader}>
          <Text style={[styles.cardIssuer, { fontSize: moderateScale(10) }]}>
            {card.cardProduct?.issuer?.toUpperCase() ?? 'CARD'}
          </Text>
          <Text style={[styles.cardName, { fontSize: moderateScale(17) }]}>
            {card.nickname ?? card.cardProduct?.name ?? 'My Card'}
          </Text>
        </View>

        {/* Last 4 */}
        {card.last4 && (
          <Text style={[styles.cardNumber, { fontSize: moderateScale(16) }]}>
            •••• •••• •••• {card.last4}
          </Text>
        )}

        {/* Balance + points row */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.footerLabel, { fontSize: moderateScale(9) }]}>BALANCE</Text>
            <Text style={[styles.footerValue, { fontSize: moderateScale(16) }]}>
              {formatUSD(card.currentBalance)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.footerLabel, { fontSize: moderateScale(9) }]}>POINTS</Text>
            <Text style={[styles.footerValue, { fontSize: moderateScale(16) }]}>
              {(card.rewardBalance ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Utilization strip at bottom */}
        {card.creditLimit && (
          <View style={styles.utilStrip}>
            <View
              style={[
                styles.utilFill,
                {
                  width: `${Math.min(utilPct, 100)}%`,
                  backgroundColor:
                    utilPct < 30
                      ? Colors.accent
                      : utilPct < 50
                      ? Colors.warning
                      : Colors.danger,
                },
              ]}
            />
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

export function CardCarousel({ cards, isLoading }: CardCarouselProps) {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const { activeCardIndex, setActiveCardIndex } = useUIStore();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const onScrollEnd = useCallback((e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveCardIndex(newIndex);
  }, [setActiveCardIndex]);

  if (isLoading) {
    return <LoadingPulse rows={1} height={CARD_HEIGHT} style={{ marginHorizontal: wp(SIDE_PADDING) }} />;
  }

  if (!cards || cards.length === 0) {
    return (
      <View style={[styles.emptyCard, { width: CARD_WIDTH, height: CARD_HEIGHT, marginHorizontal: wp(SIDE_PADDING) }]}>
        <Text style={{ fontSize: 36 }}>💳</Text>
        <Text style={[{ fontSize: moderateScale(15), color: Colors.textSecondary, marginTop: Spacing['2'] }]}>
          Add your first card
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Animated.FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: wp(SIDE_PADDING),
          gap: CARD_GAP,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index }) => (
          <CardVisual
            card={item}
            index={index}
            scrollX={scrollX}
            totalCards={cards.length}
          />
        )}
      />

      {/* Page dots */}
      {cards.length > 1 && (
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeCardIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius['2xl'], padding: Spacing['5'], justifyContent: 'space-between', overflow: 'hidden', ...Shadow.lg },
  chip: { flexDirection: 'row', width: 32, height: 24, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing['3'] },
  chipLeft: { flex: 1, backgroundColor: 'rgba(255,215,0,0.7)', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  chipRight: { flex: 1, backgroundColor: 'rgba(255,185,0,0.55)', borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  cardHeader: {},
  cardIssuer: { color: 'rgba(255,255,255,0.6)', fontWeight: Typography.weight.bold, letterSpacing: 1.5 },
  cardName: { color: Colors.white, fontWeight: Typography.weight.bold, letterSpacing: -0.3, marginTop: 2 },
  cardNumber: { color: 'rgba(255,255,255,0.75)', letterSpacing: 2, fontWeight: Typography.weight.medium },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerLabel: { color: 'rgba(255,255,255,0.55)', fontWeight: Typography.weight.bold, letterSpacing: 1 },
  footerValue: { color: Colors.white, fontWeight: Typography.weight.bold, marginTop: 1 },
  utilStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  utilFill: { height: 3 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing['4'] },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: Colors.primary, width: 18 },
  dotInactive: { backgroundColor: Colors.textMuted },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
});
