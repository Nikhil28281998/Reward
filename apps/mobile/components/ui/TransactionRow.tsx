import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { CATEGORIES } from '@reward/shared';
import { formatUSD } from '@reward/shared';
import type { Transaction } from '@reward/shared';

interface TransactionRowProps {
  tx: Transaction;
  style?: ViewStyle;
  onPress?: () => void;
}

export function TransactionRow({ tx, style, onPress }: TransactionRowProps) {
  const meta = CATEGORIES[tx.category as keyof typeof CATEGORIES];
  const isCredit = tx.isCredit;
  const amountStr = `${isCredit ? '+' : '-'}${formatUSD(tx.amount)}`;

  const dateLabel = (() => {
    const d = new Date(tx.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }, style]}
      onPress={onPress}
      hitSlop={4}
    >
      {/* Category icon */}
      <View style={[styles.iconWrap, { backgroundColor: (meta?.color ?? Colors.primary) + '25' }]}>
        <Text style={[styles.emoji, { fontSize: moderateScale(18) }]}>{meta?.emoji ?? '💳'}</Text>
      </View>

      {/* Merchant + category */}
      <View style={styles.middle}>
        <Text
          style={[styles.merchant, { fontSize: moderateScale(15) }]}
          numberOfLines={1}
        >
          {tx.merchantName ?? tx.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.category, { fontSize: moderateScale(12) }]}>
            {meta?.label ?? tx.category}
          </Text>
          <Text style={[styles.dot]}>·</Text>
          <Text style={[styles.date, { fontSize: moderateScale(12) }]}>{dateLabel}</Text>
        </View>
      </View>

      {/* Amount + reward earned */}
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { fontSize: moderateScale(15) },
            isCredit ? styles.amountCredit : styles.amountDebit,
          ]}
        >
          {amountStr}
        </Text>
        {tx.pointsEarned != null && tx.pointsEarned > 0 && (
          <View style={styles.rewardBadge}>
            <Text style={[styles.rewardText, { fontSize: moderateScale(11) }]}>
              +{tx.pointsEarned} pts
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], paddingVertical: Spacing['3'], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  iconWrap: { width: 42, height: 42, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  emoji: {},
  middle: { flex: 1 },
  merchant: { color: Colors.text, fontWeight: Typography.weight.medium },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  category: { color: Colors.textMuted, textTransform: 'capitalize' },
  dot: { color: Colors.textMuted, fontSize: 12 },
  date: { color: Colors.textMuted },
  right: { alignItems: 'flex-end', gap: 3 },
  amount: { fontWeight: Typography.weight.semibold },
  amountDebit: { color: Colors.text },
  amountCredit: { color: Colors.accent },
  rewardBadge: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  rewardText: { color: Colors.primaryLight, fontWeight: Typography.weight.bold },
});
