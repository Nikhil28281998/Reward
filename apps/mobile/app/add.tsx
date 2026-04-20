import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { moderateScale } from '../lib/responsive';

type Choice = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: [string, string];
  route: string;
};

const CHOICES: Choice[] = [
  {
    id: 'credit',
    emoji: '💳',
    title: 'Credit card',
    subtitle: 'Track points & cashback from 8+ top US issuers',
    gradient: ['#4F46E5', '#7C3AED'],
    route: '/cards/add',
  },
  {
    id: 'debit',
    emoji: '🏧',
    title: 'Debit card',
    subtitle: 'Track bank offers & merchant cashback on your debit',
    gradient: ['#10B981', '#059669'],
    route: '/cards/add-debit',
  },
  {
    id: 'bank',
    emoji: '🏦',
    title: 'Bank account',
    subtitle: 'Checking or savings — see APY and balances in one place',
    gradient: ['#0EA5E9', '#2563EB'],
    route: '/accounts/add-bank',
  },
  {
    id: 'investment',
    emoji: '📈',
    title: 'Investment',
    subtitle: 'Brokerage, retirement or crypto — track total net worth',
    gradient: ['#F59E0B', '#EF4444'],
    route: '/investments/add',
  },
];

export default function AddChooser() {
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const isWealthScope = scope === 'wealth';
  // Wealth tab focuses on assets/liabilities outside of credit cards
  // (which live in the Cards tab with their own flow).
  const choices = isWealthScope ? CHOICES.filter((c) => c.id !== 'credit') : CHOICES;
  const heroTitle = isWealthScope
    ? 'Add to your wealth view'
    : 'What do you want to track?';
  const heroSub = isWealthScope
    ? 'Bank accounts, debit cards and investments all count toward your net worth.\nCredit cards live in the Cards tab.'
    : 'Labhly brings your entire financial life into one AI-powered view.';
  const topTitle = isWealthScope ? 'Add to wealth' : 'Add to wallet';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={6}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { fontSize: moderateScale(16) }]}>{topTitle}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing['5'], gap: Spacing['4'], paddingBottom: Spacing['20'] }}>
        <View>
          <Text style={[styles.heroTitle, { fontSize: moderateScale(24) }]}>{heroTitle}</Text>
          <Text style={[styles.heroSub, { fontSize: moderateScale(13) }]}>
            {heroSub}
          </Text>
        </View>

        {choices.map((c) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [styles.choice, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push(c.route as any)}
          >
            <LinearGradient
              colors={c.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.choiceEmojiWrap}
            >
              <Text style={styles.choiceEmoji}>{c.emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.choiceTitle, { fontSize: moderateScale(16) }]}>{c.title}</Text>
              <Text style={[styles.choiceSub, { fontSize: moderateScale(12) }]}>{c.subtitle}</Text>
            </View>
            <Text style={styles.choiceChev}>›</Text>
          </Pressable>
        ))}

        <Pressable style={styles.importRow} onPress={() => router.push('/(onboarding)/upload')}>
          <Text style={styles.importEmoji}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.importTitle, { fontSize: moderateScale(14) }]}>Import documents instead</Text>
            <Text style={[styles.importSub, { fontSize: moderateScale(12) }]}>
              Statements, offer screenshots, receipts — we'll categorize them automatically.
            </Text>
          </View>
          <Text style={styles.choiceChev}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.surface },
  iconBtnText: { color: Colors.text, fontSize: 22, fontWeight: '700', lineHeight: 22 },
  topBarTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  heroTitle: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.4 },
  heroSub: { color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
  choice: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing['4'], gap: Spacing['4'], borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  choiceEmojiWrap: { width: 52, height: 52, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  choiceEmoji: { fontSize: 26 },
  choiceTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  choiceSub: { color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  choiceChev: { color: Colors.textMuted, fontSize: 24, fontWeight: '300' },
  importRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(79,70,229,0.08)', borderRadius: Radius.xl, padding: Spacing['4'], gap: Spacing['3'], borderWidth: 1, borderColor: 'rgba(79,70,229,0.2)', borderStyle: 'dashed' },
  importEmoji: { fontSize: 24 },
  importTitle: { color: Colors.text, fontWeight: Typography.weight.semibold },
  importSub: { color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
});
