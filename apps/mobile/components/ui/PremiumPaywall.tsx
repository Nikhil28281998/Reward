import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import {
  usePremiumStore,
  PREMIUM_PRICE_REGULAR_CENTS,
  PREMIUM_PRICE_PROMO_CENTS,
} from '../../lib/store';

const FEATURES = [
  { emoji: '🤖', title: 'AI Assistant', body: 'Ask Labhly anything about your cards, redemptions, or spend — personalized answers in seconds.' },
  { emoji: '⚡', title: 'Best card for every purchase', body: 'Point-of-sale recommendations that stack multipliers, caps, and signup bonuses.' },
  { emoji: '🎯', title: 'AI goal playbooks', body: 'Turn wedding, travel, or debt goals into a step-by-step plan using your real wallet.' },
  { emoji: '📈', title: 'Unlimited insights', body: 'Every framework recompute, every card scan, every redemption tip — no caps.' },
];

export function PremiumPaywall({
  visible,
  onClose,
  reason,
}: {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const { promoEligible, activate } = usePremiumStore();
  const priceCents = promoEligible ? PREMIUM_PRICE_PROMO_CENTS : PREMIUM_PRICE_REGULAR_CENTS;
  const priceLabel = `$${(priceCents / 100).toFixed(2)}`;

  const handleActivate = () => {
    activate();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={['rgba(124,58,237,0.35)', 'rgba(79,70,229,0.10)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Pressable onPress={onClose} style={styles.close} hitSlop={10}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <ScrollView contentContainerStyle={{ padding: Spacing['5'], paddingBottom: Spacing['8'] }} showsVerticalScrollIndicator={false}>
            <Text style={styles.badge}>LABHLY PREMIUM</Text>
            <Text style={[styles.title, { fontSize: moderateScale(26) }]}>
              Your AI financial co-pilot.
            </Text>
            {reason ? (
              <Text style={[styles.reason, { fontSize: moderateScale(13) }]}>{reason}</Text>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={[styles.price, { fontSize: moderateScale(38) }]}>{priceLabel}</Text>
              <Text style={[styles.period, { fontSize: moderateScale(13) }]}>/month</Text>
              {promoEligible ? (
                <View style={styles.promoPill}>
                  <Text style={[styles.promoPillText, { fontSize: moderateScale(10) }]}>
                    LAUNCH OFFER · save 80%
                  </Text>
                </View>
              ) : null}
            </View>
            {promoEligible ? (
              <Text style={[styles.regularLine, { fontSize: moderateScale(11) }]}>
                Regular price $4.99/mo · locked in while promo is active
              </Text>
            ) : null}

            <View style={{ marginTop: Spacing['5'], gap: Spacing['3'] }}>
              {FEATURES.map((f) => (
                <View key={f.title} style={styles.featureRow}>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { fontSize: moderateScale(14) }]}>{f.title}</Text>
                    <Text style={[styles.featureBody, { fontSize: moderateScale(12) }]}>{f.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleActivate}
              style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.ctaText, { fontSize: moderateScale(15) }]}>
                Start premium — {priceLabel}/mo
              </Text>
            </Pressable>

            <Text style={[styles.fineprint, { fontSize: moderateScale(10) }]}>
              Cancel anytime from Profile. No ads, no data selling. Card rewards, ledger and net-worth tracking stay free forever.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    maxHeight: '90%',
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    top: Spacing['3'],
    right: Spacing['4'],
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  badge: {
    color: '#C4B5FD',
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  title: { color: Colors.text, fontWeight: '800', letterSpacing: -0.5, marginTop: 6 },
  reason: { color: Colors.textSecondary, marginTop: 8, lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: Spacing['4'], flexWrap: 'wrap', gap: 6 },
  price: { color: Colors.white, fontWeight: '800', letterSpacing: -1 },
  period: { color: Colors.textMuted, marginBottom: 8 },
  promoPill: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing['2'],
    paddingVertical: 3,
    marginLeft: 8,
    marginBottom: 10,
  },
  promoPillText: { color: Colors.accentLight, fontWeight: '800', letterSpacing: 1 },
  regularLine: { color: Colors.textMuted, marginTop: 4 },

  featureRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing['3'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureTitle: { color: Colors.text, fontWeight: '700' },
  featureBody: { color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },

  cta: {
    marginTop: Spacing['6'],
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadow.primaryGlow,
  },
  ctaText: { color: Colors.white, fontWeight: '800', letterSpacing: 0.3 },

  fineprint: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing['4'],
    lineHeight: 14,
  },
});
