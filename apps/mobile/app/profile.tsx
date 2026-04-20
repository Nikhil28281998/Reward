import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { moderateScale, wp } from '../lib/responsive';
import { useAuth } from '../hooks/useAuth';
import { useCards } from '../hooks/useCards';
import { usePremiumStore, PREMIUM_PRICE_PROMO_CENTS, PREMIUM_PRICE_REGULAR_CENTS } from '../lib/store';
import { PremiumPaywall } from '../components/ui/PremiumPaywall';

type Row = {
  icon: string;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  danger?: boolean;
};

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View style={{ marginTop: Spacing['5'] }}>
      <Text style={[styles.sectionTitle, { fontSize: moderateScale(11) }]}>{title}</Text>
      <View style={styles.card}>
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            disabled={!r.onPress && !r.toggle}
            style={({ pressed }) => [
              styles.row,
              i !== rows.length - 1 && styles.rowBorder,
              { opacity: pressed && r.onPress ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.rowIcon}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, r.danger && { color: Colors.dangerLight }, { fontSize: moderateScale(14) }]}>
                {r.label}
              </Text>
              {r.sub && <Text style={[styles.rowSub, { fontSize: moderateScale(11) }]}>{r.sub}</Text>}
            </View>
            {r.value && <Text style={[styles.rowValue, { fontSize: moderateScale(12) }]}>{r.value}</Text>}
            {r.toggle && (
              <Switch
                value={r.toggle.value}
                onValueChange={r.toggle.onChange}
                trackColor={{ false: Colors.surfaceRaised, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            )}
            {r.onPress && !r.toggle && <Text style={styles.chevron}>›</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { cards } = useCards();
  const premiumTier = usePremiumStore((s) => s.tier);
  const promoEligible = usePremiumStore((s) => s.promoEligible);
  const cancelPremium = usePremiumStore((s) => s.cancel);
  const isPremium = premiumTier === 'premium';
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [notifTx, setNotifTx] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [bio, setBio] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);

  const doSignOut = () => {
    const go = async () => {
      await signOut();
      router.replace('/(auth)/welcome');
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Sign out of Labhly?')) void go();
    } else {
      Alert.alert('Sign out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void go() },
      ]);
    }
  };

  const doDelete = () => {
    const msg = 'This permanently removes your account, cards, transactions, and offers. This cannot be undone.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        window.alert('Account deletion requires email confirmation. We\'ll send a link to your inbox.');
      }
    } else {
      Alert.alert('Delete account', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Check your email', 'We sent a confirmation link.') },
      ]);
    }
  };

  const initials = (user?.fullName ?? user?.email ?? 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.iconBtn} hitSlop={10}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topTitle, { fontSize: moderateScale(14) }]}>Account & security</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['10'], paddingHorizontal: wp(5) }}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(79,70,229,0.20)', 'rgba(16,185,129,0.10)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { fontSize: moderateScale(20) }]}>{user?.fullName ?? 'You'}</Text>
            <Text style={[styles.email, { fontSize: moderateScale(12) }]}>{user?.email}</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{cards?.length ?? 0}</Text>
                <Text style={styles.heroStatLabel}>cards</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>✓</Text>
                <Text style={styles.heroStatLabel}>verified</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{isPremium ? 'Pro' : 'Free'}</Text>
                <Text style={styles.heroStatLabel}>plan</Text>
              </View>
            </View>
          </View>
        </View>

        <Section
          title="ACCOUNT"
          rows={[
            { icon: '👤', label: 'Edit profile', sub: 'Name, photo, timezone', onPress: () => Alert.alert('Coming soon', 'Profile editing is on the roadmap.') },
            { icon: '📧', label: 'Email', value: user?.email ?? '—' },
            isPremium
              ? {
                  icon: '💎',
                  label: 'Labhly Premium — active',
                  sub: 'AI Assistant, Best-card, unlimited insights',
                  onPress: () => {
                    const confirm = Platform.OS === 'web'
                      ? (typeof window !== 'undefined' && window.confirm('Cancel Premium? You can reactivate anytime.'))
                      : true;
                    if (!confirm) return;
                    if (Platform.OS === 'web') { cancelPremium(); }
                    else {
                      Alert.alert('Cancel Premium?', 'You can reactivate anytime.', [
                        { text: 'Keep premium', style: 'cancel' },
                        { text: 'Cancel', style: 'destructive', onPress: () => cancelPremium() },
                      ]);
                    }
                  },
                }
              : {
                  icon: '💎',
                  label: 'Upgrade to Labhly Premium',
                  sub: promoEligible
                    ? `Launch offer — $${(PREMIUM_PRICE_PROMO_CENTS / 100).toFixed(2)}/mo (reg. $${(PREMIUM_PRICE_REGULAR_CENTS / 100).toFixed(2)})`
                    : `$${(PREMIUM_PRICE_REGULAR_CENTS / 100).toFixed(2)}/mo · unlock AI Assistant + Best-card`,
                  onPress: () => setPaywallOpen(true),
                },
          ]}
        />

        <Section
          title="SECURITY"
          rows={[
            { icon: '🔑', label: 'Change password', onPress: () => Alert.alert('Check your email', 'We sent you a password reset link.') },
            { icon: '🔐', label: 'Two-factor authentication', sub: 'TOTP via Authenticator app', onPress: () => Alert.alert('Coming soon', 'Rolling out in the next release.') },
            { icon: Platform.OS === 'ios' ? '👁️' : '🧬', label: 'Biometric unlock', sub: 'Face / fingerprint sign-in', toggle: { value: bio, onChange: setBio } },
            { icon: '👀', label: 'Hide balances in app', sub: 'Blur account values until tapped', toggle: { value: hideBalances, onChange: setHideBalances } },
            { icon: '🖥️', label: 'Active sessions', sub: 'Review devices signed in', onPress: () => Alert.alert('Sessions', '1 active session · this device (web · Chrome).') },
          ]}
        />

        <Section
          title="NOTIFICATIONS"
          rows={[
            { icon: '🛎️', label: 'New transactions', toggle: { value: notifTx, onChange: setNotifTx } },
            { icon: '🎁', label: 'Offer activations', toggle: { value: notifOffers, onChange: setNotifOffers } },
            { icon: '📬', label: 'Weekly rewards digest', toggle: { value: notifDigest, onChange: setNotifDigest } },
          ]}
        />

        <Section
          title="PRIVACY & DATA"
          rows={[
            { icon: '📜', label: 'Privacy policy', onPress: () => Alert.alert('Privacy', 'Labhly never sells your data. Full policy at labhly.app/privacy.') },
            { icon: '📝', label: 'Terms of service', onPress: () => Alert.alert('Terms', 'Full terms at labhly.app/terms.') },
            { icon: '⬇️', label: 'Export my data', sub: 'CSV of cards, transactions, and offers', onPress: () => Alert.alert('Export queued', 'We\'ll email you a download link within 24 hours.') },
          ]}
        />

        <Section
          title="DANGER ZONE"
          rows={[
            { icon: '🚪', label: 'Sign out', onPress: doSignOut },
            { icon: '🗑️', label: 'Delete account', sub: 'Permanently erase all data', danger: true, onPress: doDelete },
          ]}
        />

        <Text style={[styles.version, { fontSize: moderateScale(11) }]}>Labhly v0.1.0 · © 2026</Text>
      </ScrollView>

      <PremiumPaywall
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason="Upgrade your account to unlock Labhly's AI features."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { color: Colors.text, fontSize: 24, fontWeight: Typography.weight.bold, marginTop: -3 },
  topTitle: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },

  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing['4'], padding: Spacing['4'], borderRadius: Radius['2xl'], borderWidth: 1, borderColor: 'rgba(129,140,248,0.28)', overflow: 'hidden', marginTop: Spacing['3'], backgroundColor: Colors.surface },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
  name: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -0.3 },
  email: { color: Colors.textSecondary, marginTop: 2 },
  heroStatsRow: { flexDirection: 'row', gap: Spacing['4'], marginTop: Spacing['3'] },
  heroStat: {},
  heroStatVal: { color: Colors.text, fontWeight: '800', fontSize: 14 },
  heroStatLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },

  sectionTitle: { color: Colors.textMuted, letterSpacing: 1.5, fontWeight: Typography.weight.bold, marginBottom: Spacing['2'], paddingHorizontal: Spacing['1'] },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'] },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  rowLabel: { color: Colors.text, fontWeight: Typography.weight.semibold },
  rowSub: { color: Colors.textMuted, marginTop: 1 },
  rowValue: { color: Colors.textSecondary },
  chevron: { color: Colors.textMuted, fontSize: 20, fontWeight: Typography.weight.bold },

  version: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing['8'] },
});
