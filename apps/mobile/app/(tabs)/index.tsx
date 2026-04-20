import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, RefreshControl, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
  interpolate, Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useCards } from '../../hooks/useCards';
import { useLedger, useSpendSummary } from '../../hooks/useLedger';
import { useAuth } from '../../hooks/useAuth';
import { CardCarousel } from '../../components/ui/CardCarousel';
import { TransactionFeed } from '../../components/ui/TransactionFeed';
import { InsightHero, type Insight } from '../../components/ui/InsightHero';
import { CATEGORIES, formatUSD } from '@reward/shared';
import { usePlansStore } from '../../lib/store';
import { FRAMEWORK_TEMPLATES, computeInsight, type FrameworkId } from '../../lib/planning/frameworks';
import { useRecommendations } from '../../hooks/useRecommendations';

export default function HomeScreen() {
  const scrollY = useSharedValue(0);
  const { user } = useAuth();
  const { cards, isLoading: cardsLoading, refetch: refetchCards } = useCards();
  const { transactions, isLoading: ledgerLoading, refetch: refetchLedger } = useLedger();
  const { spendSummary } = useSpendSummary();
  const [refreshing, setRefreshing] = useState(false);

  const scrollHandler = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0.85], Extrapolate.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -4], Extrapolate.CLAMP) }],
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

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const cardList = cards ?? [];
  const totalPoints = cardList.reduce((s, c) => s + (c.rewardBalance ?? 0), 0);
  const estimatedValue = totalPoints * 0.015;
  const totalLimit = cardList.reduce((s, c) => s + Number(c.creditLimit ?? 0), 0);
  const totalBalance = cardList.reduce((s, c) => s + Number(c.currentBalance), 0);
  const utilPct = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  const monthSpend = spendSummary?.totalSpend ?? 0;

  // ─── Plan-derived insights (50/30/20, emergency fund, debt snowball …) ────
  const { monthlyIncome, adoptedPlans } = usePlansStore();
  const { recommendations } = useRecommendations();

  const planInsights = useMemo<Insight[]>(() => {
    if (adoptedPlans.length === 0) return [];
    const spendByCategory: Record<string, number> = {};
    for (const c of spendSummary?.categories ?? []) {
      const amt = Number((c as any).totalAmount ?? (c as any).amount ?? 0);
      if (amt > 0) spendByCategory[c.category] = amt;
    }
    const cardsForPlan = cardList.map((c) => ({
      id: c.id,
      name: c.cardProduct?.name ?? c.nickname ?? 'Card',
      balance: Number(c.currentBalance ?? 0),
      apr: (c as any).apr as number | undefined,
      limit: Number(c.creditLimit ?? 0),
    }));
    const out: Insight[] = [];
    for (const plan of adoptedPlans) {
      const insight = computeInsight(plan.templateId as FrameworkId, {
        monthlyIncome,
        monthSpend,
        spendByCategory,
        liabilitiesTotal: cardsForPlan.reduce((s, c) => s + c.balance, 0),
        cards: cardsForPlan,
      });
      if (insight) out.push(insight);
    }
    return out;
  }, [adoptedPlans, monthlyIncome, monthSpend, spendSummary, cardList]);

  // ─── Compute live insights from real data ─────────────────────────────────
  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (cardList.length === 0) {
      out.push({
        emoji: '✨',
        headline: 'Add your first card to unlock Labhly',
        body: "Pick from 8+ top US rewards cards and we'll start tracking your points instantly.",
      });
      return out;
    }

    const topCard = [...cardList].sort((a, b) => (b.rewardBalance ?? 0) - (a.rewardBalance ?? 0))[0];
    if (topCard && (topCard.rewardBalance ?? 0) > 0) {
      const value = ((topCard.rewardBalance ?? 0) * 0.015).toFixed(0);
      out.push({
        emoji: '💎',
        headline: `Your ${topCard.cardProduct?.name ?? 'card'} is sitting on $${value} of value`,
        body: 'Transfer points to a partner program for up to 2× redemption value before they age out.',
        chip: `${(topCard.rewardBalance ?? 0).toLocaleString()} pts`,
      });
    }

    if (spendSummary?.categories?.length) {
      const top = [...spendSummary.categories].sort((a, b) => Number((b as any).totalAmount ?? (b as any).amount ?? 0) - Number((a as any).totalAmount ?? (a as any).amount ?? 0))[0];
      if (top) {
        const amt = Number((top as any).totalAmount ?? (top as any).amount ?? 0);
        const meta = CATEGORIES[top.category as keyof typeof CATEGORIES];
        out.push({
          emoji: meta?.emoji ?? '📊',
          headline: `${formatUSD(amt)} on ${meta?.label ?? top.category} this month`,
          body: 'Tap "Best card now" before your next purchase to make sure you\'re earning the top multiplier.',
          chip: monthSpend > 0 ? `${Math.round((amt / monthSpend) * 100)}%` : undefined,
        });
      }
    }

    if (utilPct >= 30) {
      out.push({
        emoji: '⚠️',
        headline: `Utilization is ${utilPct}% — pay down before statement closes`,
        body: 'Keeping balances under 30% lifts your credit score within one cycle.',
        chip: `${utilPct}%`,
      });
    } else if (totalLimit > 0) {
      out.push({
        emoji: '🛡️',
        headline: `Credit health: utilization ${utilPct}%`,
        body: "Lenders love this. You're in the safest band — keep doing what you're doing.",
        chip: 'Healthy',
      });
    }

    return out;
  }, [cardList, spendSummary, utilPct, totalLimit, monthSpend]);

  // Interleave plan insights at the top so an adopted 50/30/20 shows first.
  const heroInsights = useMemo<Insight[]>(
    () => [...planInsights, ...insights],
    [planInsights, insights],
  );

  // Top sponsored partner card (referral revenue slot)
  const sponsored = useMemo(() => {
    const list = recommendations ?? [];
    return list.find((r) => (r as any).isSponsored) ?? list[0] ?? null;
  }, [recommendations]);

  const quickActions = [
    { id: 'best',     emoji: '⚡', label: 'Best card now',    sub: 'Per purchase',    onPress: () => router.push('/best-card') },
    { id: 'planning', emoji: '🎯', label: 'Plan a goal',      sub: 'AI playbooks',    onPress: () => router.push('/planning') },
    { id: 'offers',   emoji: '🎁', label: 'Activate offers',  sub: 'New deals',       onPress: () => router.push('/(tabs)/discover') },
    { id: 'add',      emoji: '＋', label: 'Add to wallet',    sub: 'Card · bank · more', onPress: () => router.push('/add') },
    { id: 'import',   emoji: '📄', label: 'Import documents', sub: 'Statements · offers', onPress: () => router.push('/(onboarding)/upload') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Pressable onPress={() => router.push('/profile')} hitSlop={6} style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {((user?.fullName ?? user?.email ?? 'U').split(' ').map((s) => s[0]).join('').slice(0, 2) || 'U').toUpperCase()}
          </Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: Spacing['3'] }}>
          <Text style={[styles.greeting, { fontSize: moderateScale(13) }]}>{greeting()}{firstName ? ',' : ''}</Text>
          <Text style={[styles.name, { fontSize: moderateScale(22) }]}>{firstName ? `${firstName} 👋` : '👋'}</Text>
        </View>
        <Pressable onPress={() => router.push('/assistant')} style={styles.aiBtn} hitSlop={6}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#10B981']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.aiBtnInner}
          >
            <Text style={[styles.aiBtnText, { fontSize: moderateScale(18) }]}>✦</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing['20'] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* AI Insight Hero */}
        <View style={{ marginHorizontal: wp(5), marginTop: Spacing['2'] }}>
          <InsightHero insights={heroInsights} />
        </View>

        {/* Wealth glass card */}
        <View style={[styles.wealth, { marginHorizontal: wp(5) }]}>
          <LinearGradient
            colors={['rgba(79,70,229,0.18)', 'rgba(16,185,129,0.10)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.wealthRow}>
            <View style={{ flex: 1.1 }}>
              <Text style={[styles.wealthLabel, { fontSize: moderateScale(10) }]}>NET REWARDS VALUE</Text>
              <Text style={[styles.wealthValue, { fontSize: moderateScale(34) }]}>
                ${estimatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
              <Text style={[styles.wealthSub, { fontSize: moderateScale(12) }]}>
                {totalPoints.toLocaleString()} pts across {cardList.length} card{cardList.length === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.wealthDivider} />
            <View style={{ flex: 1, gap: Spacing['3'] }}>
              <View>
                <Text style={[styles.wealthMiniLabel, { fontSize: moderateScale(10) }]}>SPENT THIS MO</Text>
                <Text style={[styles.wealthMiniValue, { fontSize: moderateScale(15) }]}>
                  {formatUSD(monthSpend)}
                </Text>
              </View>
              <View>
                <Text style={[styles.wealthMiniLabel, { fontSize: moderateScale(10) }]}>UTILIZATION</Text>
                <Text style={[
                  styles.wealthMiniValue,
                  { fontSize: moderateScale(15), color: utilPct < 30 ? Colors.accentLight : utilPct < 50 ? Colors.warning : Colors.danger },
                ]}>
                  {totalLimit > 0 ? `${utilPct}%` : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sponsored partner slot */}
        {sponsored ? (
          <Pressable
            onPress={() => router.push('/(tabs)/discover')}
            style={({ pressed }) => [styles.partner, { marginHorizontal: wp(5), opacity: pressed ? 0.92 : 1 }]}
          >
            <LinearGradient
              colors={['rgba(245,158,11,0.14)', 'rgba(236,72,153,0.08)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.partnerHead}>
              <Text style={[styles.partnerKicker, { fontSize: moderateScale(9) }]}>
                PARTNER OFFER · EARN WITH LABHLY
              </Text>
              <Text style={[styles.partnerClose, { fontSize: moderateScale(11) }]}>›</Text>
            </View>
            <Text style={[styles.partnerTitle, { fontSize: moderateScale(15) }]} numberOfLines={2}>
              {(sponsored as any).cardProduct?.name ?? (sponsored as any).name ?? 'Featured rewards card'}
            </Text>
            <Text style={[styles.partnerBody, { fontSize: moderateScale(12) }]} numberOfLines={2}>
              {(sponsored as any).reasoning ?? (sponsored as any).description ?? 'A card worth a look for your spend profile.'}
            </Text>
            {((sponsored as any).estimatedAnnualValue ?? 0) > 0 ? (
              <View style={styles.partnerChipRow}>
                <View style={styles.partnerChip}>
                  <Text style={[styles.partnerChipText, { fontSize: moderateScale(10) }]}>
                    ~${Math.round((sponsored as any).estimatedAnnualValue ?? 0)}/yr potential
                  </Text>
                </View>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {/* Quick action strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionStrip}
        >
          {quickActions.map((a) => (
            <Pressable
              key={a.id}
              style={({ pressed }) => [styles.action, { opacity: pressed ? 0.85 : 1 }]}
              onPress={a.onPress}
            >
              <View style={styles.actionEmojiWrap}>
                <Text style={[styles.actionEmoji, { fontSize: moderateScale(20) }]}>{a.emoji}</Text>
              </View>
              <Text style={[styles.actionLabel, { fontSize: moderateScale(12) }]}>{a.label}</Text>
              <Text style={[styles.actionSub, { fontSize: moderateScale(10) }]}>{a.sub}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Card carousel */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(15) }]}>Your wallet</Text>
          <Pressable hitSlop={6} onPress={() => router.push('/(tabs)/cards')}>
            <Text style={[styles.sectionAction, { fontSize: moderateScale(12) }]}>Manage ›</Text>
          </Pressable>
        </View>
        <CardCarousel cards={cardList} isLoading={cardsLoading} />

        {/* Recent transactions (compact) */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(15) }]}>Recent activity</Text>
          <Pressable hitSlop={6} onPress={() => router.push('/(tabs)/ledger')}>
            <Text style={[styles.sectionAction, { fontSize: moderateScale(12) }]}>See all ›</Text>
          </Pressable>
        </View>
        <TransactionFeed
          transactions={(transactions ?? []).slice(0, 4)}
          isLoading={ledgerLoading}
          style={{ marginHorizontal: wp(5) }}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['5'], paddingTop: Spacing['2'], paddingBottom: Spacing['3'] },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: 'rgba(129,140,248,0.4)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: Colors.primaryLight, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  greeting: { color: Colors.textSecondary },
  name: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5, marginTop: 1 },
  aiBtn: { borderRadius: 22 },
  aiBtnInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...Shadow.primaryGlow },
  aiBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },

  // Wealth glass card
  wealth: {
    marginTop: Spacing['4'],
    borderRadius: Radius['2xl'],
    padding: Spacing['5'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    backgroundColor: Colors.surface,
  },
  wealthRow: { flexDirection: 'row', alignItems: 'stretch' },
  wealthLabel: { color: Colors.textMuted, letterSpacing: 1.2, fontWeight: Typography.weight.bold },
  wealthValue: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -1, marginTop: 4 },
  wealthSub: { color: Colors.textSecondary, marginTop: 4 },
  wealthDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing['4'] },
  wealthMiniLabel: { color: Colors.textMuted, letterSpacing: 1, fontWeight: Typography.weight.bold },
  wealthMiniValue: { color: Colors.text, fontWeight: Typography.weight.bold, marginTop: 2 },

  // Action strip
  actionStrip: { gap: Spacing['3'], paddingHorizontal: wp(5), paddingTop: Spacing['5'] },
  action: { width: 96, padding: Spacing['3'], borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'flex-start' },
  actionEmojiWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2'] },
  actionEmoji: {},
  actionLabel: { color: Colors.text, fontWeight: Typography.weight.semibold },
  actionSub: { color: Colors.textMuted, marginTop: 2 },

  // Section header
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(5), marginTop: Spacing['6'], marginBottom: Spacing['3'] },
  sectionTitle: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.2 },
  sectionAction: { color: Colors.primaryLight, fontWeight: Typography.weight.semibold },

  // Sponsored partner slot
  partner: {
    marginTop: Spacing['4'],
    borderRadius: Radius['2xl'],
    padding: Spacing['4'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.32)',
    backgroundColor: Colors.surface,
  },
  partnerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['2'] },
  partnerKicker: { color: '#F59E0B', letterSpacing: 1.4, fontWeight: Typography.weight.bold },
  partnerClose: { color: Colors.textMuted, fontWeight: Typography.weight.bold },
  partnerTitle: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.2 },
  partnerBody: { color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  partnerChipRow: { flexDirection: 'row', gap: Spacing['2'], marginTop: Spacing['3'] },
  partnerChip: { backgroundColor: 'rgba(16,185,129,0.18)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)', paddingHorizontal: Spacing['2'], paddingVertical: 3, borderRadius: Radius.full },
  partnerChipText: { color: Colors.accentLight, fontWeight: Typography.weight.bold },
});
