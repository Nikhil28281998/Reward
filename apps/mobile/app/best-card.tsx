import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { moderateScale, wp } from '../lib/responsive';
import { api } from '../lib/api';
import { CATEGORIES, formatUSD, type SpendCategory } from '@reward/shared';
import { AIAvatar } from '../components/ui/AIAvatar';
import { rewardCurrencyLabel } from '../lib/format';
import { usePremiumStore } from '../lib/store';
import { PremiumPaywall } from '../components/ui/PremiumPaywall';

// Replace raw enum strings (e.g. "CAPITAL_ONE_MILES") in reasoning text with
// human-readable labels so users never see SHOUTY_SNAKE_CASE in the UI.
function prettifyReasoning(s: string): string {
  if (!s) return s;
  return s.replace(/\b[A-Z][A-Z0-9_]{3,}\b/g, (m) => rewardCurrencyLabel(m));
}

type BestResult = {
  cardAccountId: string;
  cardName: string;
  brand: string | null;
  last4: string | null;
  multiplier: number;
  estimatedReward: number;
  rewardCurrency: string;
  reasoning: string;
};

const POPULAR: SpendCategory[] = [
  'dining', 'groceries', 'travel', 'gas', 'streaming', 'online_shopping',
  'transit', 'hotel', 'airfare', 'wholesale',
];

export default function BestCardScreen() {
  const [category, setCategory] = useState<SpendCategory>('dining');
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPremium = usePremiumStore((s) => s.tier === 'premium');
  const [paywallOpen, setPaywallOpen] = useState(!isPremium);

  const findBest = async () => {
    if (!isPremium) {
      setPaywallOpen(true);
      return;
    }
    const amt = Number(amount);
    if (!category || !Number.isFinite(amt) || amt <= 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.recommendations.bestCard({ category, amount: amt });
      const r = (res.data?.result ?? null) as BestResult | null;
      if (!r) setError('No matching card found — try adding a card first.');
      else setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not compute.');
    } finally {
      setLoading(false);
    }
  };

  const meta = CATEGORIES[category];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.iconBtn} hitSlop={10}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['2'] }}>
          <AIAvatar size="sm" />
          <Text style={[styles.topTitle, { fontSize: moderateScale(14) }]}>Best card for purchase</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['10'] }}>
        <View style={{ paddingHorizontal: wp(5), paddingTop: Spacing['3'] }}>
          <Text style={[styles.heading, { fontSize: moderateScale(22) }]}>
            What are you buying?
          </Text>
          <Text style={[styles.sub, { fontSize: moderateScale(13) }]}>
            We'll find the card in your wallet that earns you the most on this purchase.
          </Text>
        </View>

        <View style={styles.chipRow}>
          {POPULAR.map((cat) => {
            const m = CATEGORIES[cat];
            const active = cat === category;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{m?.emoji}</Text>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive, { fontSize: moderateScale(12) }]}>
                  {m?.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.amountCard, { marginHorizontal: wp(5) }]}>
          <Text style={[styles.amountLabel, { fontSize: moderateScale(11) }]}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.dollar, { fontSize: moderateScale(28) }]}>$</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { fontSize: moderateScale(34) }]}
              placeholder="50"
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.primaryLight}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing['2'], marginTop: Spacing['3'] }}>
            {['10', '25', '50', '100', '250', '500'].map((q) => (
              <Pressable key={q} onPress={() => setAmount(q)} style={styles.quickAmt}>
                <Text style={[styles.quickAmtText, { fontSize: moderateScale(12) }]}>${q}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={findBest}
          disabled={loading}
          style={({ pressed }) => [styles.cta, { opacity: loading ? 0.6 : pressed ? 0.9 : 1, marginHorizontal: wp(5) }]}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={[styles.ctaText, { fontSize: moderateScale(15) }]}>⚡ Find my best card</Text>}
        </Pressable>

        {error && (
          <View style={[styles.errorBox, { marginHorizontal: wp(5) }]}>
            <Text style={{ color: Colors.dangerLight }}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={[styles.resultWrap, { marginHorizontal: wp(5) }]}>
            <LinearGradient
              colors={['rgba(16,185,129,0.18)', 'rgba(79,70,229,0.12)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.resultKicker, { fontSize: moderateScale(11) }]}>✨ LABHLY RECOMMENDS</Text>
            <Text style={[styles.resultCardName, { fontSize: moderateScale(22) }]}>{result.cardName}</Text>
            {result.last4 && (
              <Text style={[styles.resultLast4, { fontSize: moderateScale(12) }]}>•••• {result.last4}</Text>
            )}
            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatLabel, { fontSize: moderateScale(10) }]}>MULTIPLIER</Text>
                <Text style={[styles.resultStatValue, { fontSize: moderateScale(20) }]}>{result.multiplier}×</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatLabel, { fontSize: moderateScale(10) }]}>YOU'LL EARN</Text>
                <Text style={[styles.resultStatValue, { fontSize: moderateScale(20), color: Colors.accentLight }]}>
                  {result.rewardCurrency === 'CASHBACK'
                    ? formatUSD(result.estimatedReward)
                    : `${Math.round(result.estimatedReward).toLocaleString()} ${rewardCurrencyLabel(result.rewardCurrency)}`}
                </Text>
              </View>
            </View>
            <Text style={[styles.resultReason, { fontSize: moderateScale(13) }]}>{prettifyReasoning(result.reasoning)}</Text>
          </View>
        )}
      </ScrollView>
      <PremiumPaywall
        visible={paywallOpen}
        onClose={() => { setPaywallOpen(false); if (!isPremium) router.back(); }}
        reason="Best-card recommendations use Labhly's AI — unlock them with Premium."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { color: Colors.text, fontSize: 24, fontWeight: Typography.weight.bold, marginTop: -3 },
  topTitle: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },

  heading: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -0.5 },
  sub: { color: Colors.textSecondary, marginTop: Spacing['2'], lineHeight: 20 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'], paddingHorizontal: wp(5), marginTop: Spacing['4'] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryLight },
  chipLabel: { color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  chipLabelActive: { color: Colors.primaryLight, fontWeight: Typography.weight.semibold },

  amountCard: { marginTop: Spacing['5'], padding: Spacing['5'], backgroundColor: Colors.surface, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border },
  amountLabel: { color: Colors.textMuted, letterSpacing: 1.2, fontWeight: Typography.weight.bold },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: Spacing['2'] },
  dollar: { color: Colors.textMuted, fontWeight: Typography.weight.bold, marginRight: 4, lineHeight: 38 },
  amountInput: { color: Colors.text, fontWeight: Typography.weight.extrabold, flex: 1, padding: 0, letterSpacing: -1 },
  quickAmt: { paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  quickAmtText: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },

  cta: { marginTop: Spacing['5'], height: 54, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...Shadow.primaryGlow },
  ctaText: { color: Colors.white, fontWeight: Typography.weight.bold, letterSpacing: 0.3 },

  errorBox: { marginTop: Spacing['4'], padding: Spacing['3'], borderRadius: Radius.lg, backgroundColor: Colors.dangerMuted, borderWidth: 1, borderColor: Colors.danger },

  resultWrap: { marginTop: Spacing['6'], padding: Spacing['5'], borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)' },
  resultKicker: { color: Colors.accentLight, letterSpacing: 1.5, fontWeight: Typography.weight.bold },
  resultCardName: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -0.5, marginTop: Spacing['2'] },
  resultLast4: { color: Colors.textSecondary, marginTop: 2, letterSpacing: 1 },
  resultStats: { flexDirection: 'row', gap: Spacing['5'], marginTop: Spacing['4'] },
  resultStat: { flex: 1 },
  resultStatLabel: { color: Colors.textMuted, letterSpacing: 1, fontWeight: Typography.weight.bold },
  resultStatValue: { color: Colors.text, fontWeight: Typography.weight.extrabold, marginTop: 2 },
  resultReason: { color: Colors.textSecondary, marginTop: Spacing['4'], lineHeight: 20 },
});
