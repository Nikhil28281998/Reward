import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useCards } from '../../hooks/useCards';
import { useWealthStore, type ManualCreditCard } from '../../lib/store';
import { LoadingPulse } from '../../components/ui/LoadingPulse';
import { EmptyState } from '../../components/ui/EmptyState';
import type { CardAccount } from '@reward/shared';
import { formatUSD, utilizationHealth } from '@reward/shared';

function CardItem({ card }: { card: CardAccount }) {
  const gradient = (card.cardProduct?.gradient ?? ['#5B21B6', '#7C3AED']) as [string, string];
  const utilPct = card.utilizationPct ?? 0;
  const health = utilizationHealth(utilPct);
  const utilColor = health === 'good' ? Colors.accent : health === 'ok' ? Colors.accent : health === 'warn' ? Colors.warning : Colors.danger;

  return (
    <Pressable
      style={({ pressed }) => [styles.cardItem, { opacity: pressed ? 0.92 : 1, width: wp(90) }]}
      onPress={() => router.push(`/cards/${card.id}`)}
    >
      {/* Card visual header */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardVisual}
      >
        <View style={styles.cardVisualContent}>
          <View>
            <Text style={[styles.cardIssuer, { fontSize: moderateScale(10) }]}>
              {card.cardProduct?.issuer?.toUpperCase() ?? ''}
            </Text>
            <Text style={[styles.cardName, { fontSize: moderateScale(15) }]}>
              {card.nickname ?? card.cardProduct?.name ?? 'Card'}
            </Text>
          </View>
          {card.last4 && (
            <Text style={[styles.cardLast4, { fontSize: moderateScale(14) }]}>
              •••• {card.last4}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Card stats */}
      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontSize: moderateScale(11) }]}>Balance</Text>
          <Text style={[styles.statValue, { fontSize: moderateScale(16) }]}>
            {formatUSD(card.currentBalance)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontSize: moderateScale(11) }]}>Points</Text>
          <Text style={[styles.statValue, { fontSize: moderateScale(16), color: Colors.primary }]}>
            {(card.rewardBalance ?? 0).toLocaleString()}
          </Text>
        </View>
        {card.creditLimit && (
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(11) }]}>Limit</Text>
            <Text style={[styles.statValue, { fontSize: moderateScale(16) }]}>
              {formatUSD(card.creditLimit)}
            </Text>
          </View>
        )}
      </View>

      {/* Utilization bar */}
      {card.creditLimit && (
        <View style={styles.utilSection}>
          <View style={styles.utilLabelRow}>
            <Text style={[styles.utilLabel, { fontSize: moderateScale(12) }]}>Utilization</Text>
            <Text style={[styles.utilPct, { fontSize: moderateScale(12), color: utilColor }]}>
              {utilPct}%
            </Text>
          </View>
          <View style={styles.utilTrack}>
            <View style={[styles.utilFill, { width: `${Math.min(utilPct, 100)}%`, backgroundColor: utilColor }]} />
          </View>
        </View>
      )}

      {/* Reward rates badge row */}
      <View style={styles.rateRow}>
        {((card.cardProduct?.categoryRates ?? []) as Array<{ category: string; multiplier: number }>)
          .slice(0, 3)
          .map((rate) => (
            <View key={rate.category} style={styles.rateBadge}>
              <Text style={[styles.rateMultiplier, { fontSize: moderateScale(13) }]}>
                {rate.multiplier}x
              </Text>
              <Text style={[styles.rateCategory, { fontSize: moderateScale(11) }]}>
                {rate.category}
              </Text>
            </View>
          ))}
      </View>
    </Pressable>
  );
}

export default function CardsScreen() {
  const { width } = useWindowDimensions();
  const { cards, isLoading, refetch } = useCards();
  const manualCards = useWealthStore((s) => s.manualCreditCards);
  const removeManualCard = useWealthStore((s) => s.removeManualCreditCard);

  const confirmRemove = (label: string, onConfirm: () => void) => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Remove ${label}?`)) onConfirm();
    } else {
      onConfirm();
    }
  };

  const totalCount = (cards ?? []).length + manualCards.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: moderateScale(26) }]}>My Cards</Text>
        <View style={{ flexDirection: 'row', gap: Spacing['2'] }}>
          <Pressable
            style={styles.scanBtn}
            onPress={() => router.push('/cards/scan')}
            hitSlop={8}
          >
            <Text style={[styles.scanBtnText, { fontSize: moderateScale(13) }]}>📷 Scan card</Text>
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/cards/add')}
            hitSlop={8}
          >
            <Text style={[styles.addBtnText, { fontSize: moderateScale(14) }]}>＋ Add</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <LoadingPulse rows={3} style={{ marginHorizontal: wp(5) }} />
      ) : totalCount === 0 ? (
        <EmptyState
          emoji="💳"
          title="No cards yet"
          body="Pick from our catalog of top US rewards cards, scan a recent statement, or add one manually."
          cta="Browse catalog"
          onCta={() => router.push('/cards/add')}
        />
      ) : (
        <FlatList
          data={cards ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CardItem card={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListFooterComponent={
            manualCards.length > 0 ? (
              <View style={{ gap: Spacing['3'], marginTop: Spacing['2'] }}>
                <Text style={[styles.manualHeading, { fontSize: moderateScale(12) }]}>
                  MANUAL CARDS
                </Text>
                {manualCards.map((m) => (
                  <ManualCardItem
                    key={m.id}
                    card={m}
                    onRemove={() =>
                      confirmRemove(m.nickname || m.name, () => removeManualCard(m.id))
                    }
                  />
                ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function ManualCardItem({
  card,
  onRemove,
}: {
  card: ManualCreditCard;
  onRemove: () => void;
}) {
  const utilPct =
    card.creditLimit && card.currentBalance
      ? Math.round((card.currentBalance / card.creditLimit) * 100)
      : null;
  return (
    <View style={[styles.cardItem, { width: wp(90) }]}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardVisual}
      >
        <View style={styles.cardVisualContent}>
          <View>
            <Text style={[styles.cardIssuer, { fontSize: moderateScale(10) }]}>
              {card.issuer.toUpperCase()} · MANUAL
            </Text>
            <Text style={[styles.cardName, { fontSize: moderateScale(15) }]}>
              {card.nickname || card.name}
            </Text>
          </View>
          {card.last4 ? (
            <Text style={[styles.cardLast4, { fontSize: moderateScale(14) }]}>
              •••• {card.last4}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
      <View style={styles.cardStats}>
        {card.creditLimit ? (
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(11) }]}>Limit</Text>
            <Text style={[styles.statValue, { fontSize: moderateScale(16) }]}>
              {formatUSD(card.creditLimit)}
            </Text>
          </View>
        ) : null}
        {card.annualFee !== undefined ? (
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(11) }]}>Annual fee</Text>
            <Text style={[styles.statValue, { fontSize: moderateScale(16) }]}>
              {card.annualFee === 0 ? 'No fee' : formatUSD(card.annualFee)}
            </Text>
          </View>
        ) : null}
        {utilPct !== null ? (
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { fontSize: moderateScale(11) }]}>Util</Text>
            <Text style={[styles.statValue, { fontSize: moderateScale(16) }]}>{utilPct}%</Text>
          </View>
        ) : null}
      </View>
      {card.rewardsNote ? (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: moderateScale(11),
            paddingHorizontal: Spacing['4'],
            paddingTop: Spacing['2'],
          }}
        >
          {card.rewardsNote}
        </Text>
      ) : null}
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={styles.manualRemove}
        accessibilityLabel="Remove manual card"
      >
        <Text style={styles.manualRemoveText}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['4'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  addBtnText: { color: Colors.white, fontWeight: Typography.weight.semibold },
  scanBtn: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderWidth: 1, borderColor: Colors.border },
  scanBtnText: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },
  list: { gap: Spacing['4'], paddingHorizontal: wp(5), paddingBottom: Spacing['20'] },
  cardItem: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  cardVisual: { height: 90, padding: Spacing['4'] },
  cardVisualContent: { flex: 1, justifyContent: 'space-between' },
  cardIssuer: { color: 'rgba(255,255,255,0.65)', fontWeight: Typography.weight.bold, letterSpacing: 1 },
  cardName: { color: Colors.white, fontWeight: Typography.weight.bold, marginTop: 2 },
  cardLast4: { color: 'rgba(255,255,255,0.8)', fontWeight: Typography.weight.medium, letterSpacing: 2 },
  cardStats: { flexDirection: 'row', paddingHorizontal: Spacing['4'], paddingTop: Spacing['4'] },
  stat: { flex: 1 },
  statLabel: { color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: Typography.weight.bold },
  statValue: { color: Colors.text, fontWeight: Typography.weight.bold, marginTop: 2 },
  utilSection: { paddingHorizontal: Spacing['4'], paddingTop: Spacing['4'] },
  utilLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing['1.5'] },
  utilLabel: { color: Colors.textMuted },
  utilPct: { fontWeight: Typography.weight.semibold },
  utilTrack: { height: 4, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: 'hidden' },
  utilFill: { height: 4, borderRadius: Radius.full },
  rateRow: { flexDirection: 'row', gap: Spacing['2'], paddingHorizontal: Spacing['4'], paddingTop: Spacing['3'], paddingBottom: Spacing['4'] },
  rateBadge: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['1.5'], alignItems: 'center' },
  rateMultiplier: { color: Colors.primary, fontWeight: Typography.weight.bold },
  rateCategory: { color: Colors.textMuted, textTransform: 'capitalize' },
  manualHeading: { color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 2 },
  manualRemove: { alignSelf: 'flex-end', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'] },
  manualRemoveText: { color: Colors.dangerLight, fontSize: 12, fontWeight: '700' },
});
