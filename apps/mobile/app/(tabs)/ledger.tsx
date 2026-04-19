import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, SectionList,
  TextInput, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { usePaginatedLedger, useSpendSummary } from '../../hooks/useLedger';
import { TransactionRow } from '../../components/ui/TransactionRow';
import { LoadingPulse } from '../../components/ui/LoadingPulse';
import { EmptyState } from '../../components/ui/EmptyState';
import { CATEGORIES } from '@reward/shared';
import type { Transaction } from '@reward/shared';
import { monthKey, monthLabel, formatUSD } from '@reward/shared';

function groupByDate(transactions: Transaction[]): Array<{ title: string; data: Transaction[] }> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = monthKey(tx.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return Array.from(groups.entries()).map(([key, data]) => ({
    title: monthLabel(key),
    data,
  }));
}

const FILTER_CATS = ['all', 'dining', 'travel', 'groceries', 'gas', 'streaming', 'other'] as const;

export default function LedgerScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePaginatedLedger();
  const { spendSummary } = useSpendSummary();

  const allTransactions: Transaction[] = useMemo(
    () => data?.pages.flatMap((p) => p.transactions) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    let txs = allTransactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.merchantName ?? '').toLowerCase().includes(q),
      );
    }
    if (filterCat !== 'all') {
      txs = txs.filter((t) => t.category === filterCat);
    }
    return txs;
  }, [allTransactions, search, filterCat]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: moderateScale(26) }]}>Ledger</Text>
        {spendSummary && (
          <View style={styles.totalBadge}>
            <Text style={[styles.totalLabel, { fontSize: moderateScale(11) }]}>This month</Text>
            <Text style={[styles.totalValue, { fontSize: moderateScale(15) }]}>
              {formatUSD(spendSummary.totalSpend)}
            </Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { width: wp(90), alignSelf: 'center' }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { fontSize: moderateScale(14) }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category filters */}
      <View style={styles.filterRow}>
        {FILTER_CATS.map((cat) => {
          const meta = cat !== 'all' ? CATEGORIES[cat as keyof typeof CATEGORIES] : null;
          return (
            <Pressable
              key={cat}
              style={({ pressed }) => [
                styles.filterPill,
                filterCat === cat && styles.filterPillActive,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => setFilterCat(cat)}
            >
              <Text style={[styles.filterText, { fontSize: moderateScale(12) }, filterCat === cat && styles.filterTextActive]}>
                {meta ? `${meta.emoji} ${meta.label}` : 'All'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Transaction list */}
      {isLoading ? (
        <LoadingPulse rows={8} style={{ marginHorizontal: wp(5) }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No transactions"
          body={search ? 'Try a different search term' : 'Scan a statement to import transactions'}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionRow tx={item} style={{ marginHorizontal: wp(5) }} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { marginHorizontal: wp(5) }]}>
              <Text style={[styles.sectionTitle, { fontSize: moderateScale(13) }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionTotal, { fontSize: moderateScale(13) }]}>
                {formatUSD(section.data.filter((t) => !t.isCredit).reduce((s, t) => s + Number(t.amount), 0))}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['4'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  totalBadge: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing['3'], alignItems: 'flex-end', borderWidth: 1, borderColor: Colors.border },
  totalLabel: { color: Colors.textMuted, fontWeight: Typography.weight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { color: Colors.text, fontWeight: Typography.weight.bold, marginTop: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderWidth: 1, borderColor: Colors.border, gap: Spacing['2'], marginBottom: Spacing['3'] },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.text },
  filterRow: { flexDirection: 'row', gap: Spacing['2'], paddingHorizontal: Spacing['4'], marginBottom: Spacing['3'] },
  filterPill: { paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  filterTextActive: { color: Colors.primaryLight },
  listContent: { paddingBottom: Spacing['20'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.background, paddingVertical: Spacing['2'], marginBottom: Spacing['1'] },
  sectionTitle: { color: Colors.textSecondary, fontWeight: Typography.weight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTotal: { color: Colors.textMuted },
});
