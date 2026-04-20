import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { moderateScale, wp } from '../lib/responsive';
import { useCards } from '../hooks/useCards';
import { AIAvatar } from '../components/ui/AIAvatar';
import { formatUSD } from '@reward/shared';
import { FRAMEWORK_TEMPLATES, type FrameworkTemplate } from '../lib/planning/frameworks';
import { usePlansStore } from '../lib/store';

type Template = {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  colors: [string, string];
  horizon: string;
  amount: number;
  playbook: string[];
};

const TEMPLATES: Template[] = [
  {
    id: 'dream-trip',
    emoji: '🏝️',
    title: 'Dream vacation',
    sub: 'Fly and stay on points',
    colors: ['#0EA5E9', '#6366F1'],
    horizon: '6–12 months',
    amount: 5000,
    playbook: [
      'Open a premium travel card (60–100k bonus after ~$4k spend).',
      'Put recurring bills + a single big-ticket purchase on the new card to hit the MSR.',
      'Transfer points to a partner (Hyatt / United / Flying Blue) for 2× redemption value.',
      'Stack a hotel free-night certificate from an anniversary card.',
    ],
  },
  {
    id: 'wedding',
    emoji: '💍',
    title: 'Wedding fund',
    sub: 'Turn the big bills into big points',
    colors: ['#EC4899', '#F43F5E'],
    horizon: '9–18 months',
    amount: 30000,
    playbook: [
      'Put venue + catering deposits on a 2× everywhere card (Venture / Double Cash).',
      'Open one new dining card — most catering classifies as dining.',
      'Use a business card (if eligible) to stack an extra signup bonus from the same spend.',
      'Cash out points as a statement credit against honeymoon airfare.',
    ],
  },
  {
    id: 'home',
    emoji: '🏠',
    title: 'Home down payment',
    sub: 'Max cashback on every dollar you save',
    colors: ['#F59E0B', '#D97706'],
    horizon: '12–36 months',
    amount: 50000,
    playbook: [
      'Route every recurring bill through a 2% flat cashback card.',
      'Avoid new-card hard pulls 6 months before mortgage application.',
      'Do not carry balances — utilization hits your score fast.',
      'Redeem cashback quarterly straight to your down-payment savings account.',
    ],
  },
  {
    id: 'signup-farm',
    emoji: '🎯',
    title: 'Max signup bonuses',
    sub: 'Earn 200k+ pts this year',
    colors: ['#4F46E5', '#7C3AED'],
    horizon: '12 months',
    amount: 0,
    playbook: [
      'Plan 3–4 new-card openings spaced 3 months apart (respect 5/24).',
      'Pair a premium travel card with a no-annual-fee card from the same ecosystem for free point transfers.',
      'Hit each Minimum Spend Requirement with a pre-planned big-ticket purchase (insurance, tax, tuition).',
      'Track all open MSRs in one place — Labhly can remind you before each deadline.',
    ],
  },
  {
    id: 'emergency',
    emoji: '🛡️',
    title: 'Emergency buffer',
    sub: 'Zero-fee cashback cushion',
    colors: ['#10B981', '#059669'],
    horizon: '3–6 months',
    amount: 3000,
    playbook: [
      'Keep utilization under 10% across all cards — frees up $ if crisis hits.',
      'Set auto-pay to statement balance on the 2% cashback card.',
      'Redeem accumulated cashback straight into a high-yield savings account.',
      'Do not chase new bonuses while building the buffer.',
    ],
  },
  {
    id: 'monthly-budget',
    emoji: '🗓️',
    title: 'Weekly spend plan',
    sub: 'Never leave points on the table',
    colors: ['#14B8A6', '#0D9488'],
    horizon: 'Recurring',
    amount: 0,
    playbook: [
      'Assign one card per category (groceries, gas, dining, travel).',
      'Stash each card\'s best multiplier in a phone widget / wallet order.',
      'Review every Sunday — Labhly flags any purchase made on the wrong card.',
      'Celebrate the wins: compare points/$ month over month.',
    ],
  },
  {
    id: 'retirement',
    emoji: '🌅',
    title: 'Retirement lift',
    sub: 'Let cashback fund your IRA',
    colors: ['#8B5CF6', '#6366F1'],
    horizon: '10+ years',
    amount: 6500,
    playbook: [
      '2% cashback on $35k/yr spend = $700 — one free IRA contribution month.',
      'Avoid annual-fee cards unless they pay for themselves.',
      'Redeem cashback the week you contribute — direct into Roth IRA cash.',
    ],
  },
  {
    id: 'education',
    emoji: '🎓',
    title: 'College / tuition',
    sub: 'Earn while you pay',
    colors: ['#22C55E', '#16A34A'],
    horizon: '2–4 years',
    amount: 20000,
    playbook: [
      'Check if your school accepts credit cards (many do via Flywire/Nelnet for ~2.85% fee).',
      'Only worth it if you\'re opening a card with a bonus ≥ the fee.',
      'Otherwise: route textbooks + supplies to a 5% online shopping card.',
    ],
  },
];

export default function PlanningScreen() {
  const { cards } = useCards();
  const totalPoints = (cards ?? []).reduce((s, c) => s + (c.rewardBalance ?? 0), 0);
  const estimatedCash = totalPoints * 0.015;

  const [open, setOpen] = useState<Template | null>(null);
  const [openFw, setOpenFw] = useState<FrameworkTemplate | null>(null);
  const [incomeDraft, setIncomeDraft] = useState('');
  const { monthlyIncome, setMonthlyIncome, adoptedPlans, adoptPlan, removePlan } = usePlansStore();

  const isAdopted = (id: string) => adoptedPlans.some((p) => p.templateId === id);

  const handleAdoptFramework = (fw: FrameworkTemplate) => {
    if (fw.needsIncome && monthlyIncome <= 0) {
      const n = parseFloat(incomeDraft.replace(/[^0-9.]/g, ''));
      if (!n || n <= 0) return; // keep modal open, user sees prompt
      setMonthlyIncome(n);
      adoptPlan(fw.id, { monthlyIncome: n });
    } else {
      adoptPlan(fw.id, monthlyIncome > 0 ? { monthlyIncome } : undefined);
    }
    setOpenFw(null);
    setIncomeDraft('');
    // Jump to the detail view so the user immediately sees their plan with data
    router.push(`/planning/${fw.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.iconBtn} hitSlop={10}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topTitle, { fontSize: moderateScale(14) }]}>Financial planning</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['10'] }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: wp(5), paddingTop: Spacing['2'] }}>
          <View style={styles.heroBadge}>
            <AIAvatar size="sm" />
            <Text style={[styles.heroBadgeText, { fontSize: moderateScale(11) }]}>AI-CURATED PLAYBOOKS</Text>
          </View>
          <Text style={[styles.heading, { fontSize: moderateScale(26) }]}>
            Turn your goals into a rewards plan.
          </Text>
          <Text style={[styles.sub, { fontSize: moderateScale(14) }]}>
            Pick a template — Labhly turns it into a step-by-step action plan using the cards in
            your wallet. You currently have{' '}
            <Text style={{ color: Colors.accentLight, fontWeight: Typography.weight.bold }}>
              {formatUSD(estimatedCash)}
            </Text>{' '}
            of redeemable value to work with.
          </Text>
        </View>

        <View style={styles.grid}>
          {TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setOpen(t)}
              style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={t.colors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.tileOverlay} />
              <Text style={{ fontSize: 30 }}>{t.emoji}</Text>
              <Text style={[styles.tileTitle, { fontSize: moderateScale(15) }]}>{t.title}</Text>
              <Text style={[styles.tileSub, { fontSize: moderateScale(11) }]}>{t.sub}</Text>
              <View style={styles.tileChipRow}>
                <Text style={[styles.tileChip, { fontSize: moderateScale(10) }]}>{t.horizon}</Text>
                {t.amount > 0 && (
                  <Text style={[styles.tileChip, { fontSize: moderateScale(10) }]}>
                    goal {t.amount >= 1000 ? `$${(t.amount / 1000).toFixed(0)}k` : `$${t.amount}`}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Finance frameworks ──────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: wp(5), marginTop: Spacing['8'] }}>
          <Text style={[styles.sectionKicker, { fontSize: moderateScale(11) }]}>
            BUDGETING FRAMEWORKS
          </Text>
          <Text style={[styles.sectionTitle, { fontSize: moderateScale(20) }]}>
            Add a budget to your account
          </Text>
          <Text style={[styles.sectionSub, { fontSize: moderateScale(13) }]}>
            Adopt a classic like 50/30/20 — Labhly plugs in your real spend and shows a live insight on Home.
          </Text>
        </View>
        <View style={styles.frameworkList}>
          {FRAMEWORK_TEMPLATES.map((fw) => {
            const adopted = isAdopted(fw.id);
            return (
              <Pressable
                key={fw.id}
                onPress={() => adopted ? router.push(`/planning/${fw.id}`) : setOpenFw(fw)}
                style={({ pressed }) => [styles.fwRow, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.fwIcon, { backgroundColor: `${fw.colors[0]}33`, borderColor: `${fw.colors[0]}55` }]}>
                  <Text style={{ fontSize: 22 }}>{fw.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fwTitle, { fontSize: moderateScale(14) }]}>{fw.title}</Text>
                  <Text style={[styles.fwSub, { fontSize: moderateScale(12) }]}>
                    {adopted ? 'Tap to see live progress →' : fw.sub}
                  </Text>
                </View>
                {adopted ? (
                  <View style={styles.fwBadge}>
                    <Text style={[styles.fwBadgeText, { fontSize: moderateScale(10) }]}>ACTIVE</Text>
                  </View>
                ) : (
                  <Text style={[styles.fwChev, { fontSize: moderateScale(20) }]}>›</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Template detail modal */}
      <Modal visible={!!open} animationType="slide" transparent onRequestClose={() => setOpen(null)}>
        <View style={styles.sheetScrim}>
          <View style={styles.sheet}>
            {open && (
              <>
                <LinearGradient
                  colors={[`${open.colors[0]}33`, 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.sheetHead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], flex: 1 }}>
                    <Text style={{ fontSize: 32 }}>{open.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetTitle, { fontSize: moderateScale(20) }]}>{open.title}</Text>
                      <Text style={[styles.sheetSub, { fontSize: moderateScale(12) }]}>{open.horizon}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setOpen(null)} style={styles.sheetClose} hitSlop={10}>
                    <Text style={styles.sheetCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={[styles.playbookKicker, { fontSize: moderateScale(11) }]}>PLAYBOOK</Text>
                {open.playbook.map((step, i) => (
                  <View key={i} style={styles.step}>
                    <View style={[styles.stepNum, { backgroundColor: open.colors[0] }]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { fontSize: moderateScale(14) }]}>{step}</Text>
                  </View>
                ))}

                <Pressable
                  onPress={() => { setOpen(null); router.push('/(tabs)/assistant'); }}
                  style={({ pressed }) => [styles.sheetCta, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <LinearGradient colors={['#4F46E5', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Text style={styles.sheetCtaText}>✦ Plan this with Labhly AI</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Framework adoption modal */}
      <Modal visible={!!openFw} animationType="slide" transparent onRequestClose={() => setOpenFw(null)}>
        <View style={styles.sheetScrim}>
          <View style={styles.sheet}>
            {openFw && (
              <>
                <LinearGradient
                  colors={[`${openFw.colors[0]}33`, 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.sheetHead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], flex: 1 }}>
                    <Text style={{ fontSize: 32 }}>{openFw.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetTitle, { fontSize: moderateScale(20) }]}>{openFw.title}</Text>
                      <Text style={[styles.sheetSub, { fontSize: moderateScale(12) }]}>{openFw.horizon}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setOpenFw(null)} style={styles.sheetClose} hitSlop={10}>
                    <Text style={styles.sheetCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={[styles.fwBlurb, { fontSize: moderateScale(14) }]}>{openFw.blurb}</Text>

                <Text style={[styles.playbookKicker, { fontSize: moderateScale(11), marginTop: Spacing['4'] }]}>HOW IT WORKS</Text>
                {openFw.playbook.map((step, i) => (
                  <View key={i} style={styles.step}>
                    <View style={[styles.stepNum, { backgroundColor: openFw.colors[0] }]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { fontSize: moderateScale(14) }]}>{step}</Text>
                  </View>
                ))}

                {openFw.needsIncome && monthlyIncome <= 0 && !isAdopted(openFw.id) ? (
                  <View style={{ marginTop: Spacing['4'] }}>
                    <Text style={[styles.incomeLabel, { fontSize: moderateScale(11) }]}>YOUR MONTHLY TAKE-HOME</Text>
                    <TextInput
                      value={incomeDraft}
                      onChangeText={(t) => setIncomeDraft(t.replace(/[^0-9.]/g, ''))}
                      placeholder="e.g. 5000"
                      placeholderTextColor={Colors.textMuted}
                      inputMode="decimal"
                      keyboardType="decimal-pad"
                      style={[styles.incomeInput, { fontSize: moderateScale(18) }]}
                    />
                    <Text style={[styles.incomeHint, { fontSize: moderateScale(11) }]}>
                      Used only on your device to compute your split.
                    </Text>
                  </View>
                ) : null}

                {isAdopted(openFw.id) ? (
                  <Pressable
                    onPress={() => { removePlan(openFw.id); setOpenFw(null); }}
                    style={({ pressed }) => [styles.sheetCta, styles.sheetCtaDanger, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Text style={styles.sheetCtaText}>Remove from my plan</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleAdoptFramework(openFw)}
                    style={({ pressed }) => [styles.sheetCta, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <LinearGradient colors={openFw.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Text style={styles.sheetCtaText}>
                      {openFw.needsIncome && monthlyIncome <= 0 && !incomeDraft ? 'Enter income to activate' : '＋ Add to my plan'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { color: Colors.text, fontSize: 24, fontWeight: Typography.weight.bold, marginTop: -3 },
  topTitle: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },

  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], alignSelf: 'flex-start', backgroundColor: Colors.surface, paddingHorizontal: Spacing['2'], paddingVertical: Spacing['1'], borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing['3'] },
  heroBadgeText: { color: Colors.primaryLight, letterSpacing: 1.2, fontWeight: Typography.weight.bold },
  heading: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -0.5 },
  sub: { color: Colors.textSecondary, marginTop: Spacing['2'], lineHeight: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: wp(5) - Spacing['2'], paddingTop: Spacing['5'], gap: Spacing['3'] },
  tile: { width: (wp(90) - Spacing['3']) / 2, minHeight: 160, borderRadius: Radius['2xl'], padding: Spacing['4'], overflow: 'hidden', justifyContent: 'flex-end', ...Shadow.md },
  tileOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9,9,11,0.42)' },
  tileTitle: { color: Colors.white, fontWeight: Typography.weight.extrabold, marginTop: Spacing['3'], letterSpacing: -0.3 },
  tileSub: { color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  tileChipRow: { flexDirection: 'row', gap: Spacing['2'], marginTop: Spacing['3'], flexWrap: 'wrap' },
  tileChip: { color: Colors.white, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: Spacing['2'], paddingVertical: 2, borderRadius: Radius.full, overflow: 'hidden', fontWeight: Typography.weight.semibold },

  sheetScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius['3xl'], borderTopRightRadius: Radius['3xl'], padding: Spacing['5'], paddingBottom: Spacing['8'], maxHeight: '85%', overflow: 'hidden' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['5'] },
  sheetTitle: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -0.3 },
  sheetSub: { color: Colors.textSecondary, marginTop: 2 },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { color: Colors.text, fontSize: 16 },

  playbookKicker: { color: Colors.primaryLight, letterSpacing: 1.5, fontWeight: Typography.weight.bold, marginBottom: Spacing['3'] },
  step: { flexDirection: 'row', gap: Spacing['3'], marginBottom: Spacing['3'], alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: 12 },
  stepText: { color: Colors.text, flex: 1, lineHeight: 20 },

  sheetCta: { marginTop: Spacing['5'], height: 52, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...Shadow.primaryGlow },
  sheetCtaText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: 15, letterSpacing: 0.3 },
  sheetCtaDanger: { backgroundColor: Colors.dangerMuted, borderWidth: 1, borderColor: Colors.danger },

  sectionKicker: { color: Colors.primaryLight, letterSpacing: 1.5, fontWeight: Typography.weight.bold, marginBottom: Spacing['2'] },
  sectionTitle: { color: Colors.text, fontWeight: Typography.weight.extrabold, letterSpacing: -0.4 },
  sectionSub: { color: Colors.textSecondary, marginTop: Spacing['2'], lineHeight: 19 },

  frameworkList: { paddingHorizontal: wp(5), paddingTop: Spacing['4'], gap: Spacing['2'] },
  fwRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], padding: Spacing['3'], backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  fwIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fwTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  fwSub: { color: Colors.textSecondary, marginTop: 2 },
  fwChev: { color: Colors.textMuted, fontWeight: Typography.weight.bold },
  fwBadge: { backgroundColor: 'rgba(16,185,129,0.18)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)', paddingHorizontal: Spacing['2'], paddingVertical: 3, borderRadius: Radius.full },
  fwBadgeText: { color: Colors.accentLight, fontWeight: Typography.weight.bold, letterSpacing: 1.2 },
  fwBlurb: { color: Colors.textSecondary, lineHeight: 20 },

  incomeLabel: { color: Colors.textSecondary, letterSpacing: 1.2, fontWeight: Typography.weight.bold, marginBottom: Spacing['2'] },
  incomeInput: { backgroundColor: Colors.surfaceAlt, color: Colors.text, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], fontWeight: Typography.weight.bold },
  incomeHint: { color: Colors.textMuted, marginTop: Spacing['2'] },
});
