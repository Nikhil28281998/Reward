import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { TransactionRow } from './TransactionRow';
import { LoadingPulse } from './LoadingPulse';
import { EmptyState } from './EmptyState';
import type { Transaction } from '@reward/shared';
import { monthKey, monthLabel } from '@reward/shared';

interface TransactionFeedProps {
  transactions: Transaction[];
  isLoading?: boolean;
  style?: ViewStyle;
  onEndReached?: () => void;
}

type ListItem =
  | { type: 'header'; label: string }
  | { type: 'row'; tx: Transaction };

function buildSections(transactions: Transaction[]): ListItem[] {
  const items: ListItem[] = [];
  let lastKey = '';
  for (const tx of transactions) {
    const key = monthKey(tx.date);
    if (key !== lastKey) {
      items.push({ type: 'header', label: monthLabel(key) });
      lastKey = key;
    }
    items.push({ type: 'row', tx });
  }
  return items;
}

export function TransactionFeed({
  transactions,
  isLoading,
  style,
  onEndReached,
}: TransactionFeedProps) {
  if (isLoading) {
    return <LoadingPulse rows={5} style={style} />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        emoji="📭"
        title="No transactions"
        body="Scan a statement to import transactions"
        style={style}
      />
    );
  }

  const items = buildSections(transactions);

  return (
    <View style={[style, { minHeight: 60 }]}>
      <FlashList
        data={items}
        estimatedItemSize={68}
        keyExtractor={(item, i) =>
          item.type === 'header' ? `header-${i}` : item.tx.id
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text style={[styles.sectionHeader, { fontSize: moderateScale(13) }]}>
                {item.label}
              </Text>
            );
          }
          return <TransactionRow tx={item.tx} />;
        }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { color: Colors.textSecondary, fontWeight: Typography.weight.bold, textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: Spacing['2'], backgroundColor: Colors.background },
});
