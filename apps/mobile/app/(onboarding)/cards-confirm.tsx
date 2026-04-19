import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { api } from '../../lib/api';

interface DetectedCard {
  id: string;
  name: string;
  issuer: string;
  gradient: [string, string];
  transactionCount: number;
}

// Mock detected cards for UI — replaced by real API response
const MOCK_CARDS: DetectedCard[] = [
  { id: 'csp', name: 'Sapphire Preferred', issuer: 'Chase', gradient: ['#1A56DB', '#1C64F2'], transactionCount: 24 },
  { id: 'amex-gold', name: 'Gold Card', issuer: 'American Express', gradient: ['#92400E', '#B45309'], transactionCount: 0 },
];

export default function CardsConfirmScreen() {
  const { statementId } = useLocalSearchParams<{ statementId: string }>();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detectedCards] = useState<DetectedCard[]>(MOCK_CARDS);

  useEffect(() => {
    if (!statementId) { setLoading(false); return; }
    // Poll for OCR status
    const poll = setInterval(async () => {
      try {
        const res = await api.onboarding.statementStatus(statementId);
        if (res.data.ocrStatus === 'COMPLETED' || res.data.ocrStatus === 'FAILED') {
          setLoading(false);
          clearInterval(poll);
        }
      } catch {
        setLoading(false);
        clearInterval(poll);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [statementId]);

  const handleConfirm = async () => {
    if (!selectedCardId) return;
    setConfirming(true);
    try {
      if (statementId) {
        await api.onboarding.confirmCard({
          statementId,
          cardProductId: selectedCardId,
        });
      }
      router.push('/(onboarding)/income');
    } catch (err) {
      // Ignore and proceed — card confirmation is best-effort
      router.push('/(onboarding)/income');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingTitle, { fontSize: moderateScale(18) }]}>Analyzing statement…</Text>
          <Text style={[styles.loadingSubtitle, { fontSize: moderateScale(14) }]}>
            Detecting card and extracting transactions
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '66%' }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.step, { fontSize: moderateScale(13) }]}>Step 2 of 3</Text>
        <Text style={[styles.title, { fontSize: moderateScale(28) }]}>Confirm your card</Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(15) }]}>
          We detected the following card. Tap to confirm which card this statement belongs to.
        </Text>

        <FlatList
          data={detectedCards}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.cardList}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.cardRow,
                selectedCardId === item.id && styles.cardRowSelected,
                { opacity: pressed ? 0.85 : 1, width: wp(88) },
              ]}
              onPress={() => setSelectedCardId(item.id)}
            >
              {/* Mini card visual */}
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.miniCard}
              >
                <Text style={[styles.miniCardIssuer, { fontSize: moderateScale(9) }]}>{item.issuer.toUpperCase()}</Text>
                <Text style={[styles.miniCardName, { fontSize: moderateScale(12) }]}>{item.name}</Text>
              </LinearGradient>

              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { fontSize: moderateScale(15) }]}>
                  {item.issuer} {item.name}
                </Text>
                {item.transactionCount > 0 && (
                  <Text style={[styles.txCount, { fontSize: moderateScale(13) }]}>
                    {item.transactionCount} transactions detected
                  </Text>
                )}
              </View>

              {/* Checkmark */}
              <View style={[styles.check, selectedCardId === item.id && styles.checkSelected]}>
                {selectedCardId === item.id && <Text style={{ color: Colors.white, fontSize: 12 }}>✓</Text>}
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <Pressable style={[styles.addDifferentBtn, { width: wp(88) }]}>
              <Text style={[styles.addDifferentText, { fontSize: moderateScale(14) }]}>
                ＋ This isn&apos;t my card — search catalog
              </Text>
            </Pressable>
          }
        />
      </View>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingHorizontal: Spacing['6'] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            { width: wp(88), opacity: (pressed || confirming || !selectedCardId) ? 0.6 : 1 },
          ]}
          onPress={handleConfirm}
          disabled={!selectedCardId || confirming}
        >
          {confirming ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.confirmBtnText, { fontSize: moderateScale(16) }]}>
              Confirm card
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(onboarding)/income')} style={styles.skipBtn}>
          <Text style={[styles.skipText, { fontSize: moderateScale(14) }]}>Skip — confirm later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { height: 3, backgroundColor: Colors.surfaceAlt },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: Radius.full },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing['4'] },
  loadingTitle: { color: Colors.text, fontWeight: Typography.weight.semibold },
  loadingSubtitle: { color: Colors.textSecondary },
  content: { flex: 1, paddingHorizontal: Spacing['6'], paddingTop: Spacing['6'] },
  step: { color: Colors.primary, fontWeight: Typography.weight.semibold, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Spacing['2'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, marginTop: Spacing['2'], lineHeight: 22, marginBottom: Spacing['5'] },
  cardList: { gap: Spacing['3'], alignItems: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['4'], gap: Spacing['4'], borderWidth: 1, borderColor: Colors.border },
  cardRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  miniCard: { width: 64, height: 40, borderRadius: Radius.sm, padding: 6, justifyContent: 'space-between' },
  miniCardIssuer: { color: 'rgba(255,255,255,0.7)', fontWeight: Typography.weight.bold, letterSpacing: 0.5 },
  miniCardName: { color: Colors.white, fontWeight: Typography.weight.semibold },
  cardInfo: { flex: 1 },
  cardName: { color: Colors.text, fontWeight: Typography.weight.semibold },
  txCount: { color: Colors.accent, marginTop: 2 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addDifferentBtn: { marginTop: Spacing['4'], paddingVertical: Spacing['4'], alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  addDifferentText: { color: Colors.primary, fontWeight: Typography.weight.medium },
  bottomBar: { paddingBottom: Spacing['8'], alignItems: 'center', gap: Spacing['3'] },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing['4'], alignItems: 'center' },
  confirmBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },
  skipBtn: { paddingVertical: Spacing['3'] },
  skipText: { color: Colors.textMuted, textDecorationLine: 'underline' },
});
