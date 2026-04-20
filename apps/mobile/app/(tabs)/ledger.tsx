import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, SectionList,
  TextInput, useWindowDimensions, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { usePaginatedLedger, useSpendSummary } from '../../hooks/useLedger';
import { TransactionRow } from '../../components/ui/TransactionRow';
import { LoadingPulse } from '../../components/ui/LoadingPulse';
import { EmptyState } from '../../components/ui/EmptyState';
import { CATEGORIES, CATEGORY_ORDER } from '@reward/shared';
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

const FILTER_CATS: readonly string[] = ['all', ...CATEGORY_ORDER];

export default function LedgerScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePaginatedLedger();
  const { spendSummary } = useSpendSummary();

  const allTransactions: Transaction[] = useMemo(
    () => data?.pages.flatMap((p) => p.transactions) ?? [],
    [data],
  );

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include last 12 months so filter is useful even on new accounts.
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    for (const tx of allTransactions) set.add(monthKey(tx.date));
    return Array.from(set).sort().reverse();
  }, [allTransactions]);

  const filtered = useMemo(() => {
    let txs = allTransactions;
    if (selectedMonth !== 'all') {
      txs = txs.filter((t) => monthKey(t.date) === selectedMonth);
    }
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
  }, [allTransactions, search, filterCat, selectedMonth]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  const monthDisplay = selectedMonth === 'all' ? 'All time' : monthLabel(selectedMonth);
  const monthTotal = filtered.filter((t) => !t.isCredit).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontSize: moderateScale(26) }]}>Ledger</Text>
          <Pressable
            style={styles.monthPill}
            onPress={() => setShowMonthPicker(true)}
            hitSlop={6}
          >
            <Text style={[styles.monthPillText, { fontSize: moderateScale(12) }]}>
              📅 {monthDisplay} ▾
            </Text>
          </Pressable>
        </View>
        <View style={styles.totalBadge}>
          <Text style={[styles.totalLabel, { fontSize: moderateScale(11) }]}>Spent</Text>
          <Text style={[styles.totalValue, { fontSize: moderateScale(15) }]}>
            {formatUSD(monthTotal)}
          </Text>
        </View>
      </View>

      {/* Month picker modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable style={styles.monthBackdrop} onPress={() => setShowMonthPicker(false)}>
          <Pressable style={styles.monthSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.monthSheetTitle}>Filter by month</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              <Pressable
                style={[styles.monthOpt, selectedMonth === 'all' && styles.monthOptActive]}
                onPress={() => { setSelectedMonth('all'); setShowMonthPicker(false); }}
              >
                <Text style={[styles.monthOptText, selectedMonth === 'all' && styles.monthOptTextActive]}>All time</Text>
              </Pressable>
              {availableMonths.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.monthOpt, selectedMonth === m && styles.monthOptActive]}
                  onPress={() => { setSelectedMonth(m); setShowMonthPicker(false); }}
                >
                  <Text style={[styles.monthOptText, selectedMonth === m && styles.monthOptTextActive]}>
                    {monthLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
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
      </ScrollView>

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
  monthPill: { alignSelf: 'flex-start', backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: 6, marginTop: 4, borderWidth: 1, borderColor: 'rgba(129,140,248,0.35)' },
  monthPillText: { color: Colors.primaryLight, fontWeight: '700' },
  monthBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing['5'] },
  monthSheet: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing['4'], width: '100%', maxWidth: 400, borderWidth: 1, borderColor: Colors.border },
  monthSheetTitle: { color: Colors.text, fontWeight: '700', fontSize: 15, marginBottom: Spacing['3'] },
  monthOpt: { paddingVertical: Spacing['3'], paddingHorizontal: Spacing['3'], borderRadius: Radius.lg },
  monthOptActive: { backgroundColor: Colors.primaryMuted },
  monthOptText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  monthOptTextActive: { color: Colors.primaryLight, fontWeight: '700' },
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
