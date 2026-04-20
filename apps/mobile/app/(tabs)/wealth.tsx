import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useWealthStore } from '../../lib/store';
import { useCards } from '../../hooks/useCards';
import { formatUSD } from '@reward/shared';
import { EmptyState } from '../../components/ui/EmptyState';

export default function WealthScreen() {
  const { cards } = useCards();
  const debitCards = useWealthStore((s) => s.debitCards);
  const bankAccounts = useWealthStore((s) => s.bankAccounts);
  const investments = useWealthStore((s) => s.investments);
  const removeDebit = useWealthStore((s) => s.removeDebitCard);
  const removeBank = useWealthStore((s) => s.removeBankAccount);
  const removeInv = useWealthStore((s) => s.removeInvestment);

  const totalPoints = (cards ?? []).reduce((s, c) => s + (c.rewardBalance ?? 0), 0);
  const pointsValue = totalPoints * 0.015;
  const cashValue = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const invValue = investments.reduce((s, i) => s + i.value, 0);
  const liabilities = (cards ?? []).reduce((s, c) => s + (c.currentBalance ?? 0), 0);
  const assets = cashValue + invValue;
  const netWorth = assets - liabilities;

  const cardCount = (cards ?? []).length + debitCards.length;

  const empty = cardCount === 0 && bankAccounts.length === 0 && investments.length === 0;

  const confirmRemove = (label: string, onConfirm: () => void) => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Remove ${label}?`)) onConfirm();
    } else {
      onConfirm();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: moderateScale(26) }]}>Wealth</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/add?scope=wealth')} hitSlop={8}>
          <Text style={[styles.addBtnText, { fontSize: moderateScale(14) }]}>＋ Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['20'] }} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { marginHorizontal: wp(5) }]}>
          <LinearGradient
            colors={['rgba(79,70,229,0.22)', 'rgba(16,185,129,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.heroLabel, { fontSize: moderateScale(10) }]}>NET WORTH</Text>
          <Text style={[styles.heroValue, { fontSize: moderateScale(34) }]}>
            {formatUSD(netWorth)}
          </Text>
          <View style={styles.heroBreakdown}>
            <Breakdown label="Assets" value={formatUSD(assets)} color={Colors.accentLight} />
            <Breakdown label="Liabilities" value={formatUSD(liabilities)} color={Colors.dangerLight} />
            <Breakdown label="Invested" value={formatUSD(invValue)} color="#F59E0B" />
          </View>
          <Text style={styles.heroPointsLine}>
            Redeemable points: {formatUSD(pointsValue)} · {totalPoints.toLocaleString()} pts
          </Text>
        </View>

        {empty ? (
          <View style={{ marginTop: Spacing['6'] }}>
            <EmptyState
              emoji="📈"
              title="Start building your wealth view"
              body="Add bank accounts, debit cards, and investments to see your entire financial life in one place."
              cta="＋ Add your first account"
              onCta={() => router.push('/add?scope=wealth')}
            />
          </View>
        ) : null}

        {/* Investments */}
        <Section
          title="Investments"
          emptyCta={{ label: '＋ Add investment', route: '/investments/add' }}
          isEmpty={investments.length === 0}
          emptyText="Track brokerage, retirement and crypto balances."
        >
          {investments.map((i) => (
            <View key={i.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: i.type === 'crypto' ? '#F59E0B' : i.type === 'retirement' ? '#7C3AED' : '#F97316' }]}>
                <Text style={styles.rowEmoji}>{i.type === 'crypto' ? '₿' : i.type === 'retirement' ? '🌅' : '📈'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { fontSize: moderateScale(14) }]}>
                  {i.nickname || i.broker}
                </Text>
                <Text style={[styles.rowSub, { fontSize: moderateScale(11) }]}>
                  {i.broker}{i.symbol ? ` · ${i.symbol}` : ''}{i.shares ? ` · ${i.shares} shares` : ''}
                </Text>
              </View>
              <Text style={[styles.rowValue, { fontSize: moderateScale(14) }]}>{formatUSD(i.value)}</Text>
              <Pressable
                onPress={() => confirmRemove(i.nickname || i.broker, () => removeInv(i.id))}
                hitSlop={8}
                style={styles.rowRemove}
                accessibilityLabel="Remove"
              >
                <Text style={styles.rowRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
        </Section>

        {/* Bank accounts */}
        <Section
          title="Bank accounts"
          emptyCta={{ label: '＋ Add bank account', route: '/accounts/add-bank' }}
          isEmpty={bankAccounts.length === 0}
          emptyText="Checking and savings in one place."
        >
          {bankAccounts.map((a) => (
            <View key={a.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: a.type === 'savings' ? '#10B981' : '#2563EB' }]}>
                <Text style={styles.rowEmoji}>🏦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { fontSize: moderateScale(14) }]}>
                  {a.nickname || a.bankName}
                </Text>
                <Text style={[styles.rowSub, { fontSize: moderateScale(11) }]}>
                  {a.type}{a.last4 ? ` · ••${a.last4}` : ''}{a.apy ? ` · ${a.apy}% APY` : ''}
                </Text>
              </View>
              <Text style={[styles.rowValue, { fontSize: moderateScale(14) }]}>{formatUSD(a.balance)}</Text>
              <Pressable
                onPress={() => confirmRemove(a.nickname || a.bankName, () => removeBank(a.id))}
                hitSlop={8}
                style={styles.rowRemove}
                accessibilityLabel="Remove"
              >
                <Text style={styles.rowRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
        </Section>

        {/* Debit cards */}
        <Section
          title="Debit cards"
          emptyCta={{ label: '＋ Add debit card', route: '/cards/add-debit' }}
          isEmpty={debitCards.length === 0}
          emptyText="Track bank offers & merchant cashback."
        >
          {debitCards.map((d) => (
            <View key={d.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: '#059669' }]}>
                <Text style={styles.rowEmoji}>🏧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { fontSize: moderateScale(14) }]}>
                  {d.nickname || `${d.bankName ?? d.issuer} debit`}
                </Text>
                <Text style={[styles.rowSub, { fontSize: moderateScale(11) }]}>
                  {d.bankName ?? d.issuer}{d.last4 ? ` · ••${d.last4}` : ''}
                </Text>
              </View>
              {d.rewardsNote ? (
                <Text style={[styles.rowValue, { fontSize: moderateScale(11), maxWidth: 120, textAlign: 'right', color: Colors.textSecondary }]} numberOfLines={2}>
                  {d.rewardsNote}
                </Text>
              ) : null}
              <Pressable
                onPress={() => confirmRemove(d.nickname || d.bankName || d.issuer, () => removeDebit(d.id))}
                hitSlop={8}
                style={styles.rowRemove}
                accessibilityLabel="Remove"
              >
                <Text style={styles.rowRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
        </Section>

        {/* Credit cards — read-only pointer to Cards tab */}
        <View style={{ marginTop: Spacing['6'], marginHorizontal: wp(5) }}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Credit cards</Text>
            <Pressable hitSlop={6} onPress={() => router.push('/(tabs)/cards')}>
              <Text style={styles.sectionAction}>Manage in Cards tab ›</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/cards')}
            style={[styles.row, { marginBottom: 0 }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#4F46E5' }]}>
              <Text style={styles.rowEmoji}>💳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { fontSize: moderateScale(14) }]}>
                {(cards ?? []).length === 0
                  ? 'No credit cards yet'
                  : `${(cards ?? []).length} credit card${(cards ?? []).length === 1 ? '' : 's'}`}
              </Text>
              <Text style={[styles.rowSub, { fontSize: moderateScale(11) }]}>
                Balances counted as liabilities in net worth above.
              </Text>
            </View>
            <Text style={[styles.rowValue, { fontSize: moderateScale(14), color: Colors.dangerLight }]}>
              −{formatUSD(liabilities)}
            </Text>
          </Pressable>
        </View>

        {!empty ? (
          <Text style={[styles.footerHint, { fontSize: moderateScale(11) }]}>
            Tap × on a row to remove it. Your real accounts are unaffected.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Breakdown({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.breakLabel}>{label}</Text>
      <Text style={[styles.breakValue, { color }]}>{value}</Text>
    </View>
  );
}

function Section({
  title, children, emptyCta, isEmpty, emptyText,
}: {
  title: string;
  children: React.ReactNode;
  emptyCta: { label: string; route: string };
  isEmpty: boolean;
  emptyText: string;
}) {
  return (
    <View style={{ marginTop: Spacing['6'], marginHorizontal: wp(5) }}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable hitSlop={6} onPress={() => router.push(emptyCta.route as any)}>
          <Text style={styles.sectionAction}>{emptyCta.label}</Text>
        </Pressable>
      </View>
      {isEmpty ? (
        <View style={styles.sectionEmpty}>
          <Text style={styles.sectionEmptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={{ gap: 1 }}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['4'] },
  title: { color: Colors.text, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  addBtnText: { color: Colors.white, fontWeight: '700' },
  heroCard: { borderRadius: Radius['2xl'], padding: Spacing['5'], overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  heroLabel: { color: Colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  heroValue: { color: Colors.text, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  heroBreakdown: { flexDirection: 'row', marginTop: Spacing['3'], gap: Spacing['3'] },
  breakLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  breakValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['2'] },
  sectionTitle: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  sectionAction: { color: Colors.primaryLight, fontWeight: '600', fontSize: 12 },
  sectionEmpty: { borderRadius: Radius.xl, padding: Spacing['4'], backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  sectionEmptyText: { color: Colors.textMuted, fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['3'], gap: Spacing['3'], marginBottom: 8 },
  rowIcon: { width: 40, height: 40, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  rowEmoji: { fontSize: 20 },
  rowTitle: { color: Colors.text, fontWeight: '700' },
  rowSub: { color: Colors.textSecondary, marginTop: 2 },
  rowValue: { color: Colors.text, fontWeight: '700' },
  rowRemove: {
    marginLeft: 8, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  rowRemoveText: { color: Colors.textMuted, fontSize: 16, lineHeight: 16, fontWeight: '700' },
  footerHint: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing['6'] },
  heroPointsLine: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
  },
});
