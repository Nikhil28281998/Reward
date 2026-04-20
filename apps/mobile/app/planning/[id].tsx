import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { usePlansStore, useWealthStore } from '../../lib/store';
import { useCards } from '../../hooks/useCards';
import { useSpendSummary } from '../../hooks/useLedger';
import {
  FRAMEWORK_TEMPLATES,
  computeInsight,
  type FrameworkId,
  type FrameworkTemplate,
} from '../../lib/planning/frameworks';
import { formatUSD } from '@reward/shared';

type Period = 'month' | 'quarter' | 'year';
const PERIOD_LABEL: Record<Period, string> = {
  month: 'This month',
  quarter: 'Projected quarter',
  year: 'Projected year',
};
const PERIOD_MULT: Record<Period, number> = { month: 1, quarter: 3, year: 12 };

// Categories matching frameworks.ts
const NEEDS_CATS = new Set([
  'GROCERIES', 'GAS', 'UTILITIES', 'RENT', 'INSURANCE', 'TRANSPORT',
  'HEALTHCARE', 'HOUSING', 'FUEL', 'PHARMACY', 'TRANSIT',
]);
const WANTS_CATS = new Set([
  'DINING', 'ENTERTAINMENT', 'SHOPPING', 'TRAVEL', 'SUBSCRIPTIONS',
  'STREAMING', 'HOBBIES', 'GAMING',
]);

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = FRAMEWORK_TEMPLATES.find((t) => t.id === id) as FrameworkTemplate | undefined;

  const { monthlyIncome, adoptedPlans, removePlan } = usePlansStore();
  const { cards } = useCards();
  const { spendSummary } = useSpendSummary();
  const bankAccounts = useWealthStore((s) => s.bankAccounts);
  const [period, setPeriod] = useState<Period>('month');

  const mult = PERIOD_MULT[period];
  const adopted = adoptedPlans.find((p) => p.templateId === id);

  const monthSpend = Number(spendSummary?.totalSpend ?? 0);
  const periodSpend = monthSpend * mult;
  const periodIncome = monthlyIncome * mult;

  const spendByCategory: Record<string, number> = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of spendSummary?.categories ?? []) {
      const amt = Number((c as any).totalAmount ?? (c as any).amount ?? 0);
      if (amt > 0) out[c.category] = amt;
    }
    return out;
  }, [spendSummary]);

  const needsTotal = useMemo(() => {
    let n = 0;
    for (const [cat, amt] of Object.entries(spendByCategory)) {
      if (NEEDS_CATS.has(cat.toUpperCase())) n += amt;
    }
    return n * mult;
  }, [spendByCategory, mult]);

  const wantsTotal = useMemo(() => {
    let w = 0;
    for (const [cat, amt] of Object.entries(spendByCategory)) {
      if (WANTS_CATS.has(cat.toUpperCase())) w += amt;
    }
    return w * mult;
  }, [spendByCategory, mult]);

  const savingsTotal = Math.max(0, periodIncome - needsTotal - wantsTotal);

  const liabilitiesTotal = (cards ?? []).reduce((s, c) => s + Number(c.currentBalance ?? 0), 0);
  const cashTotal = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const cardsForCompute = (cards ?? []).map((c) => ({
    id: c.id,
    name: c.cardProduct?.name ?? c.nickname ?? 'Card',
    balance: Number(c.currentBalance ?? 0),
    apr: (c as any).apr as number | undefined,
    limit: Number(c.creditLimit ?? 0),
  }));

  const insight = template
    ? computeInsight(template.id, {
        monthlyIncome,
        monthSpend,
        spendByCategory,
        liabilitiesTotal,
        cards: cardsForCompute,
      })
    : null;

  if (!template) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.iconBtnText}>‹</Text>
          </Pressable>
          <Text style={[styles.topTitle, { fontSize: moderateScale(14) }]}>Plan not found</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ padding: Spacing['6'] }}>
          <Text style={{ color: Colors.textSecondary }}>
            This plan no longer exists. Go back to Planning to pick another.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const buckets = computeBuckets(template.id, {
    periodIncome,
    needsTotal,
    wantsTotal,
    savingsTotal,
    liabilitiesTotal,
    cashTotal,
    cards: cardsForCompute,
    period,
  });

  const handleRemove = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm(`Remove ${template.title} from your plan?`)) return;
    }
    removePlan(template.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topTitle, { fontSize: moderateScale(14) }]}>Plan details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['10'] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { marginHorizontal: wp(5) }]}>
          <LinearGradient
            colors={[`${template.colors[0]}55`, `${template.colors[1]}22`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] }}>
            <Text style={{ fontSize: 36 }}>{template.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { fontSize: moderateScale(22) }]}>{template.title}</Text>
              <Text style={[styles.heroSub, { fontSize: moderateScale(12) }]}>{template.sub}</Text>
            </View>
            {adopted ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            ) : null}
          </View>
          {insight ? (
            <View style={styles.insightBox}>
              <Text style={styles.insightEmoji}>{insight.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.insightHeadline, { fontSize: moderateScale(14) }]}>
                  {insight.headline}
                </Text>
                <Text style={[styles.insightBody, { fontSize: moderateScale(12) }]}>
                  {insight.body}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Period selector */}
        <View style={[styles.periodRow, { marginHorizontal: wp(5) }]}>
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodPill, period === p && styles.periodPillActive]}
            >
              <Text
                style={[
                  styles.periodText,
                  { fontSize: moderateScale(12) },
                  period === p && styles.periodTextActive,
                ]}
              >
                {PERIOD_LABEL[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Numbers card */}
        <View style={[styles.numbersCard, { marginHorizontal: wp(5) }]}>
          <View style={styles.numBlock}>
            <Text style={styles.numLabel}>INCOME</Text>
            <Text style={[styles.numValue, { fontSize: moderateScale(18) }]}>
              {monthlyIncome > 0 ? formatUSD(periodIncome) : '—'}
            </Text>
          </View>
          <View style={styles.numDivider} />
          <View style={styles.numBlock}>
            <Text style={styles.numLabel}>SPEND</Text>
            <Text style={[styles.numValue, { fontSize: moderateScale(18) }]}>
              {formatUSD(periodSpend)}
            </Text>
          </View>
          <View style={styles.numDivider} />
          <View style={styles.numBlock}>
            <Text style={styles.numLabel}>
              {template.id.startsWith('debt') ? 'LIABILITIES' : 'SAVINGS'}
            </Text>
            <Text style={[styles.numValue, { fontSize: moderateScale(18) }]}>
              {template.id.startsWith('debt')
                ? formatUSD(liabilitiesTotal)
                : formatUSD(savingsTotal)}
            </Text>
          </View>
        </View>

        {/* Buckets */}
        <View style={{ marginTop: Spacing['6'], paddingHorizontal: wp(5) }}>
          <Text style={[styles.sectionKicker, { fontSize: moderateScale(11) }]}>BUCKETS</Text>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(18) }]}>
            Target vs actual
          </Text>
          <View style={{ marginTop: Spacing['3'], gap: Spacing['3'] }}>
            {buckets.map((b) => (
              <BucketRow key={b.id} bucket={b} />
            ))}
            {buckets.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, { fontSize: moderateScale(12) }]}>
                  {monthlyIncome <= 0 && template.needsIncome
                    ? 'Set your monthly income in Planning to see your bucket split.'
                    : 'No bucket data yet — log more transactions or add accounts to see live progress.'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Playbook (reminder) */}
        <View style={{ marginTop: Spacing['6'], paddingHorizontal: wp(5) }}>
          <Text style={[styles.sectionKicker, { fontSize: moderateScale(11) }]}>PLAYBOOK</Text>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(18) }]}>
            How this plan works
          </Text>
          <View style={{ marginTop: Spacing['3'], gap: Spacing['2'] }}>
            {template.playbook.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: template.colors[0] }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { fontSize: moderateScale(13) }]}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Compare with other active plans */}
        {adoptedPlans.length > 1 ? (
          <View style={{ marginTop: Spacing['6'], paddingHorizontal: wp(5) }}>
            <Text style={[styles.sectionKicker, { fontSize: moderateScale(11) }]}>COMPARE</Text>
            <Text style={[styles.sectionTitle, { fontSize: moderateScale(18) }]}>
              Your other active plans
            </Text>
            <View style={{ marginTop: Spacing['3'], gap: Spacing['2'] }}>
              {adoptedPlans
                .filter((p) => p.templateId !== template.id)
                .map((p) => {
                  const tpl = FRAMEWORK_TEMPLATES.find((t) => t.id === p.templateId);
                  if (!tpl) return null;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => router.replace(`/planning/${tpl.id}`)}
                      style={styles.compareRow}
                    >
                      <View
                        style={[
                          styles.compareIcon,
                          { backgroundColor: `${tpl.colors[0]}33`, borderColor: `${tpl.colors[0]}55` },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{tpl.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.compareTitle, { fontSize: moderateScale(13) }]}>{tpl.title}</Text>
                        <Text style={[styles.compareSub, { fontSize: moderateScale(11) }]}>{tpl.sub}</Text>
                      </View>
                      <Text style={styles.compareChev}>›</Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        ) : null}

        {adopted ? (
          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [styles.removeBtn, { marginHorizontal: wp(5), opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.removeBtnText, { fontSize: moderateScale(13) }]}>
              Remove plan from my account
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.replace('/planning')}
            style={({ pressed }) => [styles.adoptBtn, { marginHorizontal: wp(5), opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient
              colors={template.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.adoptBtnText, { fontSize: moderateScale(14) }]}>
              ＋ Add this plan to my account
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type Bucket = {
  id: string;
  label: string;
  targetLabel: string; // e.g. "50% of income"
  targetAmount: number;
  actualAmount: number;
  color: string;
  subText?: string;
};

function computeBuckets(
  id: FrameworkId,
  inp: {
    periodIncome: number;
    needsTotal: number;
    wantsTotal: number;
    savingsTotal: number;
    liabilitiesTotal: number;
    cashTotal: number;
    cards: Array<{ id: string; name: string; balance: number; apr?: number; limit?: number }>;
    period: Period;
  },
): Bucket[] {
  const { periodIncome, needsTotal, wantsTotal, savingsTotal, liabilitiesTotal, cashTotal, cards, period } = inp;

  switch (id) {
    case 'fifty-thirty-twenty': {
      if (periodIncome <= 0) return [];
      return [
        { id: 'needs', label: 'Needs', targetLabel: '50% of income', targetAmount: periodIncome * 0.5, actualAmount: needsTotal, color: '#0EA5E9' },
        { id: 'wants', label: 'Wants', targetLabel: '30% of income', targetAmount: periodIncome * 0.3, actualAmount: wantsTotal, color: '#F59E0B' },
        { id: 'savings', label: 'Savings', targetLabel: '20% of income', targetAmount: periodIncome * 0.2, actualAmount: savingsTotal, color: '#10B981' },
      ];
    }
    case 'pay-yourself-first': {
      if (periodIncome <= 0) return [];
      return [
        { id: 'save', label: 'Pay yourself', targetLabel: '20% of income', targetAmount: periodIncome * 0.2, actualAmount: savingsTotal, color: '#14B8A6' },
        { id: 'live', label: 'Live on the rest', targetLabel: '80% of income', targetAmount: periodIncome * 0.8, actualAmount: needsTotal + wantsTotal, color: '#6366F1' },
      ];
    }
    case 'zero-based': {
      if (periodIncome <= 0) return [];
      return [
        { id: 'allocated', label: 'Allocated (spend)', targetLabel: '100% of income', targetAmount: periodIncome, actualAmount: needsTotal + wantsTotal, color: '#8B5CF6' },
        { id: 'unallocated', label: 'Unassigned', targetLabel: 'target $0', targetAmount: 0, actualAmount: Math.max(0, periodIncome - needsTotal - wantsTotal), color: '#EF4444', subText: 'Drop into savings before month-end.' },
      ];
    }
    case 'envelope': {
      // Show top needs + wants, static caps = 110% of current actual (illustrative).
      if (needsTotal + wantsTotal <= 0) return [];
      return [
        { id: 'needs', label: 'Needs envelope', targetLabel: 'monthly cap', targetAmount: needsTotal * 1.1, actualAmount: needsTotal, color: '#0EA5E9' },
        { id: 'wants', label: 'Wants envelope', targetLabel: 'monthly cap', targetAmount: wantsTotal * 1.1, actualAmount: wantsTotal, color: '#F59E0B' },
      ];
    }
    case 'debt-snowball': {
      if (!cards.length || liabilitiesTotal <= 0) return [];
      const sorted = [...cards].filter((c) => c.balance > 0).sort((a, b) => a.balance - b.balance);
      const total = sorted.reduce((s, c) => s + c.balance, 0);
      return sorted.slice(0, 5).map((c, i) => ({
        id: c.id,
        label: `${i + 1}. ${c.name}`,
        targetLabel: i === 0 ? 'Attack first' : 'Min payment only',
        targetAmount: total,
        actualAmount: c.balance,
        color: i === 0 ? '#EC4899' : '#6366F1',
      }));
    }
    case 'debt-avalanche': {
      const withApr = cards.filter((c) => c.balance > 0 && (c.apr ?? 0) > 0);
      if (!withApr.length) return [];
      const sorted = [...withApr].sort((a, b) => (b.apr! - a.apr!));
      const total = sorted.reduce((s, c) => s + c.balance, 0);
      return sorted.slice(0, 5).map((c, i) => ({
        id: c.id,
        label: `${c.name}`,
        targetLabel: `${c.apr}% APR`,
        targetAmount: total,
        actualAmount: c.balance,
        color: i === 0 ? '#EF4444' : '#6366F1',
      }));
    }
    case 'emergency-fund': {
      // Use monthly needs to estimate target. Convert needsTotal (already in period)
      // back to per-month baseline by dividing by period multiplier.
      const monthlyNeeds = needsTotal / PERIOD_MULT[period];
      if (monthlyNeeds <= 0) return [];
      const target3 = monthlyNeeds * 3;
      const target6 = monthlyNeeds * 6;
      return [
        { id: '3mo', label: '3-month cushion', targetLabel: 'minimum', targetAmount: target3, actualAmount: Math.min(cashTotal, target3), color: '#10B981' },
        { id: '6mo', label: '6-month cushion', targetLabel: 'comfort', targetAmount: target6, actualAmount: Math.min(cashTotal, target6), color: '#059669' },
      ];
    }
  }
  return [];
}

function BucketRow({ bucket }: { bucket: Bucket }) {
  const pct = bucket.targetAmount > 0
    ? Math.min(100, Math.round((bucket.actualAmount / bucket.targetAmount) * 100))
    : bucket.actualAmount > 0
      ? 100
      : 0;
  const over = bucket.targetAmount > 0 && bucket.actualAmount > bucket.targetAmount;

  return (
    <View style={styles.bucket}>
      <View style={styles.bucketHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bucketLabel, { fontSize: moderateScale(13) }]}>{bucket.label}</Text>
          <Text style={[styles.bucketTarget, { fontSize: moderateScale(11) }]}>{bucket.targetLabel}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bucketActual, { fontSize: moderateScale(14) }]}>
            {formatUSD(bucket.actualAmount)}
          </Text>
          <Text style={[styles.bucketTargetValue, { fontSize: moderateScale(11) }]}>
            target {formatUSD(bucket.targetAmount)}
          </Text>
        </View>
      </View>
      <View style={styles.bucketTrack}>
        <View
          style={[
            styles.bucketFill,
            {
              width: `${pct}%`,
              backgroundColor: over ? Colors.danger : bucket.color,
            },
          ]}
        />
      </View>
      <View style={styles.bucketMetaRow}>
        <Text style={[styles.bucketPct, { fontSize: moderateScale(11), color: over ? Colors.dangerLight : Colors.textSecondary }]}>
          {pct}% of target {over ? '· over budget' : ''}
        </Text>
        {bucket.subText ? (
          <Text style={[styles.bucketSubText, { fontSize: moderateScale(11) }]}>{bucket.subText}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { color: Colors.text, fontSize: 24, fontWeight: '700', marginTop: -3 },
  topTitle: { color: Colors.textSecondary, fontWeight: '600' },

  hero: {
    marginTop: Spacing['2'],
    padding: Spacing['5'],
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.md,
  },
  heroTitle: { color: Colors.text, fontWeight: '800', letterSpacing: -0.3 },
  heroSub: { color: Colors.textSecondary, marginTop: 2 },
  activeBadge: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    paddingHorizontal: Spacing['2'],
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activeBadgeText: { color: Colors.accentLight, fontWeight: '800', letterSpacing: 1, fontSize: 10 },

  insightBox: {
    flexDirection: 'row',
    gap: Spacing['3'],
    marginTop: Spacing['4'],
    padding: Spacing['3'],
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightEmoji: { fontSize: 22 },
  insightHeadline: { color: Colors.text, fontWeight: '700' },
  insightBody: { color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },

  periodRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
    marginTop: Spacing['4'],
  },
  periodPill: {
    flex: 1,
    paddingVertical: Spacing['2'],
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodPillActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryLight },
  periodText: { color: Colors.textSecondary, fontWeight: '600' },
  periodTextActive: { color: Colors.primaryLight, fontWeight: '700' },

  numbersCard: {
    marginTop: Spacing['3'],
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['4'],
  },
  numBlock: { flex: 1, alignItems: 'center' },
  numLabel: { color: Colors.textMuted, letterSpacing: 1, fontWeight: '700', fontSize: 10 },
  numValue: { color: Colors.text, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  numDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing['2'] },

  sectionKicker: { color: Colors.primaryLight, letterSpacing: 1.5, fontWeight: '700' },
  sectionTitle: { color: Colors.text, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },

  bucket: {
    padding: Spacing['4'],
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bucketHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing['3'] },
  bucketLabel: { color: Colors.text, fontWeight: '700' },
  bucketTarget: { color: Colors.textMuted, marginTop: 2 },
  bucketActual: { color: Colors.text, fontWeight: '800' },
  bucketTargetValue: { color: Colors.textMuted, marginTop: 2 },
  bucketTrack: {
    height: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing['3'],
  },
  bucketFill: { height: 8, borderRadius: Radius.full },
  bucketMetaRow: { marginTop: Spacing['2'] },
  bucketPct: { fontWeight: '600' },
  bucketSubText: { color: Colors.textMuted, marginTop: 3 },

  emptyBox: {
    padding: Spacing['4'],
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyText: { color: Colors.textSecondary, lineHeight: 17 },

  step: { flexDirection: 'row', gap: Spacing['3'], alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  stepText: { color: Colors.text, flex: 1, lineHeight: 19 },

  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    padding: Spacing['3'],
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compareIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  compareTitle: { color: Colors.text, fontWeight: '700' },
  compareSub: { color: Colors.textSecondary, marginTop: 2 },
  compareChev: { color: Colors.textMuted, fontSize: 22 },

  adoptBtn: {
    marginTop: Spacing['6'],
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadow.primaryGlow,
  },
  adoptBtnText: { color: Colors.white, fontWeight: '800', letterSpacing: 0.3 },

  removeBtn: {
    marginTop: Spacing['6'],
    height: 44,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerMuted,
  },
  removeBtnText: { color: Colors.dangerLight, fontWeight: '700' },
});
