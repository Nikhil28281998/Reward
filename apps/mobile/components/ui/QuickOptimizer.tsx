import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { CATEGORIES } from '@reward/shared';
import { useBestCardQuery } from '../../hooks/useRecommendations';
import type { CardAccount, SpendCategory } from '@reward/shared';

const QUICK_CATS: SpendCategory[] = ['dining', 'groceries', 'travel', 'gas', 'streaming', 'other'];
const QUICK_AMOUNTS = ['$20', '$50', '$100', '$200'];

interface QuickOptimizerProps {
  cards: CardAccount[];
  style?: ViewStyle;
}

export function QuickOptimizer({ cards, style }: QuickOptimizerProps) {
  const [selectedCat, setSelectedCat] = useState<SpendCategory | null>(null);
  const [amount, setAmount] = useState('');
  const { mutate, data: result, isPending, reset } = useBestCardQuery();

  const handleAsk = () => {
    if (!selectedCat) return;
    const amt = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(amt) || amt <= 0) return;
    mutate({ category: selectedCat, amount: amt });
  };

  const handleReset = () => {
    reset();
    setSelectedCat(null);
    setAmount('');
  };

  return (
    <View style={[styles.container, style, { marginHorizontal: wp(5) }]}>
      <Text style={[styles.title, { fontSize: moderateScale(17) }]}>Which card should I use?</Text>

      {/* Category chips */}
      <View style={styles.catRow}>
        {QUICK_CATS.map((cat) => {
          const meta = CATEGORIES[cat as keyof typeof CATEGORIES];
          const isActive = selectedCat === cat;
          return (
            <Pressable
              key={cat}
              style={({ pressed }) => [
                styles.catChip,
                isActive && styles.catChipActive,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                setSelectedCat(cat);
                reset();
              }}
            >
              <Text style={[styles.catChipText, { fontSize: moderateScale(13) }]}>
                {meta?.emoji} {meta?.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Amount row */}
      <View style={styles.amountRow}>
        {QUICK_AMOUNTS.map((a) => (
          <Pressable
            key={a}
            style={({ pressed }) => [
              styles.amountChip,
              amount === a && styles.amountChipActive,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => {
              setAmount(a);
              reset();
            }}
          >
            <Text style={[styles.amountChipText, { fontSize: moderateScale(13) }, amount === a && styles.amountChipTextActive]}>
              {a}
            </Text>
          </Pressable>
        ))}
        <TextInput
          style={[styles.amountInput, { fontSize: moderateScale(14) }]}
          value={amount.startsWith('$') ? amount.slice(1) : amount}
          onChangeText={(v) => {
            setAmount(v);
            reset();
          }}
          placeholder="Custom"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          maxLength={8}
        />
      </View>

      {/* CTA */}
      {!result && (
        <Pressable
          style={({ pressed }) => [
            styles.askBtn,
            { opacity: (!selectedCat || !amount || isPending) ? 0.5 : pressed ? 0.85 : 1 },
          ]}
          onPress={handleAsk}
          disabled={!selectedCat || !amount || isPending}
        >
          <Text style={[styles.askBtnText, { fontSize: moderateScale(15) }]}>
            {isPending ? 'Calculating…' : 'Find best card →'}
          </Text>
        </Pressable>
      )}

      {/* Result */}
      {result && (
        <View style={styles.result}>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultEmoji, { fontSize: moderateScale(28) }]}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultCard, { fontSize: moderateScale(17) }]}>
                {result.cardAccount.nickname ?? result.cardAccount.cardProduct?.name ?? 'Your card'}
              </Text>
              <Text style={[styles.resultSub, { fontSize: moderateScale(13) }]}>
                {result.multiplier}× on {selectedCat} · earns {result.pointsEarned.toLocaleString()} pts
              </Text>
            </View>
          </View>
          <View style={styles.resultValue}>
            <Text style={[styles.resultDollar, { fontSize: moderateScale(15) }]}>
              ≈ ${result.cashValue.toFixed(2)} value
            </Text>
          </View>
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Text style={[styles.resetText, { fontSize: moderateScale(13) }]}>← Ask again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing['4'], borderWidth: 1, borderColor: Colors.border },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, marginBottom: Spacing['4'] },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'], marginBottom: Spacing['3'] },
  catChip: { paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  catChipText: { color: Colors.textSecondary },
  amountRow: { flexDirection: 'row', gap: Spacing['2'], marginBottom: Spacing['4'], flexWrap: 'wrap' },
  amountChip: { paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  amountChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  amountChipText: { color: Colors.textSecondary },
  amountChipTextActive: { color: Colors.primaryLight },
  amountInput: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], color: Colors.text, borderWidth: 1, borderColor: Colors.border, minWidth: 70 },
  askBtn: { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing['3'], alignItems: 'center' },
  askBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },
  result: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.xl, padding: Spacing['4'], gap: Spacing['2'] },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] },
  resultEmoji: {},
  resultCard: { color: Colors.text, fontWeight: Typography.weight.bold },
  resultSub: { color: Colors.textSecondary, marginTop: 2 },
  resultValue: { backgroundColor: Colors.accentMuted, borderRadius: Radius.lg, padding: Spacing['3'], alignSelf: 'flex-start' },
  resultDollar: { color: Colors.accent, fontWeight: Typography.weight.bold },
  resetBtn: { alignSelf: 'flex-start' },
  resetText: { color: Colors.textMuted },
});
