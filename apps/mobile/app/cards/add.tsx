import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useCardCatalog, useCreateCard } from '../../hooks/useCards';
import { useWealthStore } from '../../lib/store';
import { LoadingPulse } from '../../components/ui/LoadingPulse';
import type { CardProduct } from '@reward/shared';

const FILTERS = ['All', 'Travel', 'Cashback', 'Dining', 'No annual fee'] as const;
type Filter = typeof FILTERS[number];

function CardTile({ product, onPress }: { product: CardProduct; onPress: () => void }) {
  const gradient = (product.gradient ?? ['#3730A3', '#4F46E5']) as [string, string];
  const topRate = (product.categoryRates ?? [])[0];
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.92 : 1 }]}
      onPress={onPress}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileVisual}>
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.tileIssuer, { fontSize: moderateScale(10) }]}>{product.issuer.toUpperCase()}</Text>
        <Text style={[styles.tileName, { fontSize: moderateScale(15) }]} numberOfLines={2}>{product.name}</Text>
        {product.signupBonus ? (
          <View style={styles.tileBadge}>
            <Text style={[styles.tileBadgeText, { fontSize: moderateScale(10) }]}>
              +{product.signupBonus.toLocaleString()} bonus
            </Text>
          </View>
        ) : null}
      </LinearGradient>
      <View style={styles.tileMeta}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tileMetaLabel, { fontSize: moderateScale(10) }]}>ANNUAL FEE</Text>
          <Text style={[styles.tileMetaValue, { fontSize: moderateScale(13) }]}>
            {Number(product.annualFee) === 0 ? 'No fee' : `$${Number(product.annualFee)}`}
          </Text>
        </View>
        {topRate ? (
          <View style={styles.tileRate}>
            <Text style={[styles.tileRateMult, { fontSize: moderateScale(14) }]}>{topRate.multiplier}×</Text>
            <Text style={[styles.tileRateCat, { fontSize: moderateScale(10) }]}>{topRate.category}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function AddCardSheet({ product, onClose }: { product: CardProduct | null; onClose: () => void }) {
  const [last4, setLast4] = useState('');
  const [nickname, setNickname] = useState('');
  const [limit, setLimit] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutate, isPending } = useCreateCard();

  const handleAdd = () => {
    if (!product) return;
    setErrorMsg(null);
    const cleanLast4 = last4.replace(/\D/g, '').slice(0, 4);
    if (cleanLast4 && cleanLast4.length !== 4) {
      setErrorMsg('Last 4 must be 4 digits, or leave it blank.');
      return;
    }
    const limitNum = parseFloat(limit.replace(/[^0-9.]/g, ''));
    mutate(
      {
        cardProductId: product.id,
        last4: cleanLast4 || undefined,
        nickname: nickname.trim() || undefined,
        creditLimit: !isNaN(limitNum) && limitNum > 0 ? limitNum : undefined,
      },
      {
        onSuccess: () => { onClose(); router.back(); },
        onError: (e: unknown) => {
          const msg = (e as Error).message ?? '';
          if (/already|exist|409|duplicate/i.test(msg)) {
            setErrorMsg('You already have this card in your wallet.');
          } else {
            setErrorMsg(msg || 'Could not add card. Please try again.');
          }
        },
      },
    );
  };

  if (!product) return null;
  const gradient = (product.gradient ?? ['#3730A3', '#4F46E5']) as [string, string];

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sheetVisual}>
            <Text style={[styles.sheetIssuer, { fontSize: moderateScale(11) }]}>{product.issuer.toUpperCase()}</Text>
            <Text style={[styles.sheetName, { fontSize: moderateScale(20) }]}>{product.name}</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: Spacing['5'], gap: Spacing['4'] }}>
            <View>
              <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>NICKNAME (optional)</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. Travel pick"
                placeholderTextColor={Colors.textMuted}
                style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                maxLength={40}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing['3'] }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>LAST 4</Text>
                <TextInput
                  value={last4}
                  onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>LIMIT ($)</Text>
                <TextInput
                  value={limit}
                  onChangeText={setLimit}
                  placeholder="10000"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.sheetCta, { opacity: pressed || isPending ? 0.7 : 1 }]}
              onPress={handleAdd}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={[styles.sheetCtaText, { fontSize: moderateScale(15) }]}>Add to wallet</Text>
              )}
            </Pressable>
            {errorMsg ? (
              <View style={{ backgroundColor: Colors.dangerMuted, padding: Spacing['3'], borderRadius: Radius.md }}>
                <Text style={{ color: Colors.dangerLight, fontSize: moderateScale(12) }}>{errorMsg}</Text>
              </View>
            ) : null}
            <Text style={[styles.sheetNote, { fontSize: moderateScale(11) }]}>
              Labhly never asks for full card numbers. We use last-4 only to match transactions.
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AddCardScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [picked, setPicked] = useState<CardProduct | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const { data: products, isLoading } = useCardCatalog(query);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (filter === 'No annual fee') return Number(p.annualFee) === 0;
      if (filter === 'Travel')   return (p.categoryRates ?? []).some((r) => ['travel', 'hotel', 'airfare'].includes(r.category));
      if (filter === 'Cashback') return p.rewardCurrency === 'CASHBACK';
      if (filter === 'Dining')   return (p.categoryRates ?? []).some((r) => r.category === 'dining');
      return true;
    });
  }, [products, filter]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { fontSize: moderateScale(22) }]}>‹</Text>
        </Pressable>
        <Text style={[styles.topTitle, { fontSize: moderateScale(17) }]}>Add a card</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { width: wp(90), alignSelf: 'center' }]}>
        <Text style={{ fontSize: 15 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { fontSize: moderateScale(14) }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or issuer…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { fontSize: moderateScale(12) }, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingPulse rows={4} style={{ marginHorizontal: wp(5) }} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={{ gap: Spacing['3'], paddingHorizontal: wp(5) }}
          contentContainerStyle={{ gap: Spacing['3'], paddingBottom: Spacing['10'], paddingTop: Spacing['2'] }}
          renderItem={({ item }) => <CardTile product={item} onPress={() => setPicked(item)} />}
          ListHeaderComponent={
            <Pressable
              style={({ pressed }) => [styles.manualTile, { opacity: pressed ? 0.9 : 1 }]}
              onPress={() => setManualOpen(true)}
            >
              <Text style={styles.manualEmoji}>✍️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.manualTitle, { fontSize: moderateScale(14) }]}>
                  Can't find your card? Add it manually
                </Text>
                <Text style={[styles.manualSub, { fontSize: moderateScale(11) }]}>
                  Enter issuer, name, limit and fee — we'll track it in your wallet.
                </Text>
              </View>
              <Text style={styles.manualChev}>›</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: Spacing['10'] }}>
              <Text style={{ fontSize: 36 }}>🔎</Text>
              <Text style={{ color: Colors.textSecondary, marginTop: Spacing['2'] }}>No cards match.</Text>
            </View>
          }
        />
      )}

      <AddCardSheet product={picked} onClose={() => setPicked(null)} />
      <ManualCardSheet visible={manualOpen} onClose={() => setManualOpen(false)} />
    </SafeAreaView>
  );
}

function ManualCardSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addManual = useWealthStore((s) => s.addManualCreditCard);
  const [issuer, setIssuer] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [last4, setLast4] = useState('');
  const [limit, setLimit] = useState('');
  const [fee, setFee] = useState('');
  const [rewards, setRewards] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setIssuer(''); setName(''); setNickname(''); setLast4('');
    setLimit(''); setFee(''); setRewards(''); setErr(null);
  };

  const handleSave = () => {
    setErr(null);
    if (!issuer.trim() || !name.trim()) {
      setErr('Issuer and card name are required.');
      return;
    }
    const cleanLast4 = last4.replace(/\D/g, '').slice(0, 4);
    if (cleanLast4 && cleanLast4.length !== 4) {
      setErr('Last 4 must be 4 digits, or leave it blank.');
      return;
    }
    const limitNum = parseFloat(limit.replace(/[^0-9.]/g, ''));
    const feeNum = parseFloat(fee.replace(/[^0-9.]/g, ''));
    addManual({
      issuer: issuer.trim(),
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      last4: cleanLast4 || undefined,
      creditLimit: !isNaN(limitNum) && limitNum > 0 ? limitNum : undefined,
      annualFee: !isNaN(feeNum) && feeNum >= 0 ? feeNum : undefined,
      rewardsNote: rewards.trim() || undefined,
    });
    reset();
    onClose();
    router.back();
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sheetVisual}
          >
            <Text style={[styles.sheetIssuer, { fontSize: moderateScale(11) }]}>MANUAL ENTRY</Text>
            <Text style={[styles.sheetName, { fontSize: moderateScale(20) }]}>
              Add your own credit card
            </Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: Spacing['5'], gap: Spacing['4'] }}>
            <View style={{ flexDirection: 'row', gap: Spacing['3'] }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>ISSUER *</Text>
                <TextInput
                  value={issuer}
                  onChangeText={setIssuer}
                  placeholder="e.g. Apple"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  maxLength={30}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>CARD NAME *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Apple Card"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  maxLength={40}
                />
              </View>
            </View>

            <View>
              <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>NICKNAME (optional)</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. Daily driver"
                placeholderTextColor={Colors.textMuted}
                style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                maxLength={40}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing['3'] }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>LAST 4</Text>
                <TextInput
                  value={last4}
                  onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>LIMIT ($)</Text>
                <TextInput
                  value={limit}
                  onChangeText={setLimit}
                  placeholder="10000"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>FEE ($)</Text>
                <TextInput
                  value={fee}
                  onChangeText={setFee}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View>
              <Text style={[styles.sheetLabel, { fontSize: moderateScale(12) }]}>REWARDS NOTE (optional)</Text>
              <TextInput
                value={rewards}
                onChangeText={setRewards}
                placeholder="e.g. 3% on Apple purchases, 2% Apple Pay"
                placeholderTextColor={Colors.textMuted}
                style={[styles.sheetInput, { fontSize: moderateScale(15) }]}
                maxLength={120}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.sheetCta, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleSave}
            >
              <Text style={[styles.sheetCtaText, { fontSize: moderateScale(15) }]}>Save to wallet</Text>
            </Pressable>
            {err ? (
              <View style={{ backgroundColor: Colors.dangerMuted, padding: Spacing['3'], borderRadius: Radius.md }}>
                <Text style={{ color: Colors.dangerLight, fontSize: moderateScale(12) }}>{err}</Text>
              </View>
            ) : null}
            <Text style={[styles.sheetNote, { fontSize: moderateScale(11) }]}>
              Stored only on this device. Counts toward your wallet overview.
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'] },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: Colors.surface },
  backText: { color: Colors.text, fontWeight: Typography.weight.bold, lineHeight: 22 },
  topTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], backgroundColor: Colors.surface, borderRadius: Radius.xl, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing['3'] },
  searchInput: { flex: 1, color: Colors.text },
  filterRow: { flexDirection: 'row', gap: Spacing['2'], paddingHorizontal: wp(5), paddingBottom: Spacing['3'] },
  filterPill: { paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary },
  filterTextActive: { color: Colors.primaryLight, fontWeight: Typography.weight.semibold },
  tile: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  tileVisual: { padding: Spacing['3'], height: 120, justifyContent: 'space-between', overflow: 'hidden' },
  tileIssuer: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, fontWeight: Typography.weight.bold },
  tileName: { color: Colors.white, fontWeight: Typography.weight.bold, letterSpacing: -0.2 },
  tileBadge: { backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: Radius.full, paddingHorizontal: Spacing['2'], paddingVertical: 2, alignSelf: 'flex-start' },
  tileBadgeText: { color: Colors.white, fontWeight: Typography.weight.bold },
  tileMeta: { flexDirection: 'row', alignItems: 'center', padding: Spacing['3'], gap: Spacing['2'] },
  tileMetaLabel: { color: Colors.textMuted, fontWeight: Typography.weight.bold, letterSpacing: 0.5 },
  tileMetaValue: { color: Colors.text, fontWeight: Typography.weight.bold, marginTop: 1 },
  tileRate: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.md, paddingHorizontal: Spacing['2'], paddingVertical: Spacing['1.5'], alignItems: 'center', minWidth: 48 },
  tileRateMult: { color: Colors.primaryLight, fontWeight: Typography.weight.bold },
  tileRateCat: { color: Colors.textMuted, textTransform: 'capitalize' },

  // Sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: Radius['3xl'], borderTopRightRadius: Radius['3xl'], maxHeight: '85%', paddingBottom: Spacing['8'] },
  sheetHandle: { width: 36, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: Spacing['3'], marginBottom: Spacing['3'] },
  sheetVisual: { padding: Spacing['5'], marginHorizontal: Spacing['5'], borderRadius: Radius['2xl'], minHeight: 110, justifyContent: 'space-between' },
  sheetIssuer: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, fontWeight: Typography.weight.bold },
  sheetName: { color: Colors.white, fontWeight: Typography.weight.bold, letterSpacing: -0.3, marginTop: Spacing['2'] },
  sheetLabel: { color: Colors.textMuted, letterSpacing: 0.5, fontWeight: Typography.weight.bold, marginBottom: Spacing['2'] },
  sheetInput: { backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  sheetCta: { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing['4'], alignItems: 'center', ...Shadow.primaryGlow },
  sheetCtaText: { color: Colors.white, fontWeight: Typography.weight.bold },
  sheetNote: { color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },

  // Manual entry tile
  manualTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.10)',
    borderRadius: Radius.xl,
    padding: Spacing['4'],
    gap: Spacing['3'],
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.3)',
    borderStyle: 'dashed',
    marginHorizontal: 0,
    marginBottom: Spacing['3'],
  },
  manualEmoji: { fontSize: 24 },
  manualTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  manualSub: { color: Colors.textSecondary, marginTop: 2, lineHeight: 15 },
  manualChev: { color: Colors.textMuted, fontSize: 24, fontWeight: '300' },
});
