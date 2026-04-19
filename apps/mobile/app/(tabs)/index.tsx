import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  RefreshControl, useWindowDimensions, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedScrollHandler,
  useAnimatedStyle, interpolate, Extrapolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useCards } from '../../hooks/useCards';
import { useSpendSummary } from '../../hooks/useLedger';
import { useAuth } from '../../hooks/useAuth';
import { CardCarousel } from '../../components/ui/CardCarousel';
import { SpendRings } from '../../components/ui/SpendRings';
import { QuickOptimizer } from '../../components/ui/QuickOptimizer';
import { TransactionFeed } from '../../components/ui/TransactionFeed';
import { useLedger } from '../../hooks/useLedger';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const { user } = useAuth();
  const { cards, isLoading: cardsLoading, refetch: refetchCards } = useCards();
  const { transactions, isLoading: ledgerLoading, refetch: refetchLedger } = useLedger();
  const { spendSummary, isLoading: spendLoading } = useSpendSummary();
  const [refreshing, setRefreshing] = useState(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0.7], Extrapolate.CLAMP),
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCards(), refetchLedger()]);
    setRefreshing(false);
  }, [refetchCards, refetchLedger]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const totalPoints = (cards ?? []).reduce((s, c) => s + (c.rewardBalance ?? 0), 0);
  const estimatedValue = (totalPoints * 0.015).toFixed(0);
  const totalBalance = (cards ?? []).reduce((s, c) => s + Number(c.currentBalance), 0);
  const totalLimit = (cards ?? []).reduce((s, c) => s + Number(c.creditLimit ?? 0), 0);
  const utilPct = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, headerOpacity]}>
        <View>
          <Text style={[styles.greeting, { fontSize: moderateScale(13) }]}>{greeting()},</Text>
          <Text style={[styles.name, { fontSize: moderateScale(22) }]}>{firstName} 👋</Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={styles.avatarBtn}
          hitSlop={8}
        >
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { fontSize: moderateScale(16) }]}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Card Carousel */}
        <CardCarousel cards={cards ?? []} isLoading={cardsLoading} />

        {/* Stats bar */}
        <View style={[styles.statsBar, { marginHorizontal: wp(5) }]}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>TOTAL POINTS</Text>
            <Text style={[styles.statValue, { fontSize: moderateScale(18), color: Colors.primary }]}>
              {totalPoints.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>EST. VALUE</Text>
            <Text style={[styles.statValue, { fontSize: moderateScale(18), color: Colors.accent }]}>
              ${estimatedValue}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(10) }]}>UTILIZATION</Text>
            <Text
              style={[
                styles.statValue,
                { fontSize: moderateScale(18) },
                utilPct < 30
                  ? { color: Colors.accent }
                  : utilPct < 50
                  ? { color: Colors.warning }
                  : { color: Colors.danger },
              ]}
            >
              {totalLimit > 0 ? `${utilPct}%` : '—'}
            </Text>
          </View>
        </View>

        {/* Spend Rings */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(17) }]}>This month</Text>
          <Pressable hitSlop={8}>
            <Text style={[styles.sectionAction, { fontSize: moderateScale(13) }]}>Mar 2026 ›</Text>
          </Pressable>
        </View>
        <SpendRings
          categories={spendSummary?.categories ?? []}
          totalSpend={spendSummary?.totalSpend ?? 0}
          isLoading={spendLoading}
          style={{ marginHorizontal: wp(5) }}
        />

        {/* Quick Optimizer */}
        <QuickOptimizer cards={cards ?? []} style={{ marginTop: Spacing['6'] }} />

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(17) }]}>Recent</Text>
          <Pressable onPress={() => router.push('/(tabs)/ledger')} hitSlop={8}>
            <Text style={[styles.sectionAction, { fontSize: moderateScale(13) }]}>See all ›</Text>
          </Pressable>
        </View>
        <TransactionFeed
          transactions={(transactions ?? []).slice(0, 6)}
          isLoading={ledgerLoading}
          style={{ marginHorizontal: wp(5) }}
        />

        <View style={{ height: Spacing['20'] }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  greeting: { color: Colors.textSecondary },
  name: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5, marginTop: 1 },
  avatarBtn: {},
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: Typography.weight.bold },
  scrollContent: { paddingTop: Spacing['2'] },
  statsBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['4'], marginTop: Spacing['4'], borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { color: Colors.textMuted, fontWeight: Typography.weight.bold, letterSpacing: 0.5 },
  statValue: { fontWeight: Typography.weight.bold, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], marginTop: Spacing['6'], marginBottom: Spacing['3'] },
  sectionTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  sectionAction: { color: Colors.textMuted },
});
