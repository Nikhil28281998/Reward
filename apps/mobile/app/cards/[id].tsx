import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { useCard } from '../../hooks/useCards';
import { api } from '../../lib/api';
import { formatUSD } from '@reward/shared';
import { titleCase } from '../../lib/format';

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: card, isLoading, refetch } = useCard(id ?? '');

  if (isLoading || !card) {
    return (
      <SafeAreaView style={styles.loading} edges={['top']}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const gradient = (card.cardProduct?.gradient ?? ['#5B21B6', '#7C3AED']) as [string, string];
  const utilPct = card.utilizationPct ?? 0;
  const utilColor =
    utilPct < 10 ? Colors.accent : utilPct < 30 ? Colors.primaryLight : utilPct < 60 ? Colors.warning : Colors.danger;

  const onDelete = () => {
    const confirm = () => {
      void (async () => {
        try {
          await api.cards.remove(card.id);
          router.replace('/(tabs)/cards');
        } catch (e) {
          Alert.alert('Could not remove', (e as Error).message);
        }
      })();
    };
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Remove ${card.nickname ?? card.cardProduct?.name ?? 'card'} from your wallet?`)) confirm();
    } else {
      Alert.alert('Remove card?', 'This only removes it from Labhly. Your real card is unaffected.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Card detail</Text>
        <Pressable onPress={() => void refetch()} style={styles.refreshBtn} accessibilityLabel="Refresh">
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['2xl'] }}>
        {/* Visual */}
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroIssuer}>{card.cardProduct?.issuer?.toUpperCase() ?? ''}</Text>
          <Text style={styles.heroName}>{card.nickname ?? card.cardProduct?.name ?? 'Card'}</Text>
          {card.last4 && <Text style={styles.heroLast4}>•••• •••• •••• {card.last4}</Text>}
          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroFooterLabel}>BALANCE</Text>
              <Text style={styles.heroFooterValue}>{formatUSD(card.currentBalance ?? 0)}</Text>
            </View>
            <View>
              <Text style={styles.heroFooterLabel}>POINTS</Text>
              <Text style={styles.heroFooterValue}>{(card.rewardBalance ?? 0).toLocaleString()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.grid}>
          <View style={styles.gridCell}>
            <Text style={styles.gridLabel}>Credit limit</Text>
            <Text style={styles.gridValue}>{formatUSD(card.creditLimit ?? 0)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.gridLabel}>Utilization</Text>
            <Text style={[styles.gridValue, { color: utilColor }]}>{utilPct}%</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.gridLabel}>Statement closes</Text>
            <Text style={styles.gridValue}>{card.statementClosingDay ? `Day ${card.statementClosingDay}` : '—'}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.gridLabel}>Payment due</Text>
            <Text style={styles.gridValue}>{card.paymentDueDay ? `Day ${card.paymentDueDay}` : '—'}</Text>
          </View>
        </View>

        {/* Earn rates */}
        {card.cardProduct?.categoryRates && card.cardProduct.categoryRates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earn rates</Text>
            <View style={styles.earnList}>
              {card.cardProduct.categoryRates.map((r, i) => (
                <View key={i} style={styles.earnRow}>
                  <Text style={styles.earnRowCat}>{titleCase(r.category)}</Text>
                  <Text style={styles.earnRowMult}>{r.multiplier}×</Text>
                </View>
              ))}
              <View style={[styles.earnRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.earnRowCat}>Everything else</Text>
                <Text style={styles.earnRowMult}>{card.cardProduct.baseEarnRate ?? 1}×</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push({ pathname: '/best-card', params: { preferredCardId: card.id } })}
          >
            <Text style={styles.actionBtnText}>⚡ Use for next purchase</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtnGhost, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/(tabs)/ledger')}
          >
            <Text style={styles.actionBtnGhostText}>📊 View transactions</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.dangerBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={onDelete}
          >
            <Text style={styles.dangerBtnText}>🗑  Remove from Labhly</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: Colors.text, fontSize: 24, lineHeight: 24 },
  refreshBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: Colors.textMuted, fontSize: 18 },
  title: { color: Colors.text, fontSize: 17, fontWeight: Typography.weight.semibold },

  hero: {
    borderRadius: Radius.xl, padding: Spacing.lg, minHeight: 190,
    justifyContent: 'space-between', ...Shadow.md,
  },
  heroIssuer: { color: 'rgba(255,255,255,0.75)', fontSize: 11, letterSpacing: 1.2 },
  heroName: { color: '#fff', fontSize: 22, fontWeight: Typography.weight.bold, marginTop: 2 },
  heroLast4: { color: 'rgba(255,255,255,0.85)', fontSize: 15, letterSpacing: 2, marginTop: 18 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  heroFooterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1 },
  heroFooterValue: { color: '#fff', fontSize: 16, fontWeight: Typography.weight.semibold, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.lg, gap: Spacing.md },
  gridCell: {
    flexBasis: '48%', flexGrow: 1, backgroundColor: Colors.surface,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  gridLabel: { color: Colors.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  gridValue: { color: Colors.text, fontSize: 17, fontWeight: Typography.weight.semibold, marginTop: 4 },

  section: { marginTop: Spacing.xl },
  sectionTitle: { color: Colors.text, fontSize: 15, fontWeight: Typography.weight.semibold, marginBottom: Spacing.md },
  earnList: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  earnRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  earnRowCat: { color: Colors.text, fontSize: 14 },
  earnRowMult: { color: Colors.primaryLight, fontSize: 15, fontWeight: Typography.weight.semibold },

  actions: { marginTop: Spacing.xl, gap: Spacing.sm },
  actionBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: Typography.weight.semibold },
  actionBtnGhost: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  actionBtnGhostText: { color: Colors.text, fontSize: 15, fontWeight: Typography.weight.semibold },
  dangerBtn: {
    backgroundColor: 'transparent', borderRadius: Radius.xl,
    paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  dangerBtnText: { color: Colors.danger, fontSize: 14, fontWeight: Typography.weight.semibold },
});
