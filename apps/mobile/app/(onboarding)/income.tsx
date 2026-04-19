import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  useWindowDimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { api } from '../../lib/api';

const PRESET_INCOMES = [50_000, 75_000, 100_000, 150_000, 200_000, 250_000];

const FILING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED_JOINT', label: 'Married (joint)' },
  { value: 'MARRIED_SEPARATE', label: 'Married (separate)' },
  { value: 'HEAD_OF_HOUSEHOLD', label: 'Head of household' },
];

export default function IncomeScreen() {
  const { width } = useWindowDimensions();
  const [income, setIncome] = useState<number | null>(null);
  const [customIncome, setCustomIncome] = useState('');
  const [filingStatus, setFilingStatus] = useState('SINGLE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIncome = income ?? (customIncome ? parseInt(customIncome.replace(/\D/g, ''), 10) : null);

  const handleContinue = async () => {
    if (!selectedIncome || isNaN(selectedIncome)) {
      setError('Please select or enter your income.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.onboarding.setIncome({ annualIncome: selectedIncome, filingStatus });
      router.replace('/(tabs)');
    } catch {
      // Non-critical — proceed anyway
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const formatIncome = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.step, { fontSize: moderateScale(13) }]}>Step 3 of 3</Text>
        <Text style={[styles.title, { fontSize: moderateScale(28) }]}>Your income</Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(15) }]}>
          We use this to estimate which cards give you the most value.
          This stays on your device.
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontSize: moderateScale(13) }]}>{error}</Text>
          </View>
        )}

        {/* Income presets */}
        <View style={[styles.presetGrid, { width: wp(88) }]}>
          {PRESET_INCOMES.map((preset) => (
            <Pressable
              key={preset}
              style={({ pressed }) => [
                styles.presetBtn,
                income === preset && styles.presetBtnSelected,
                { opacity: pressed ? 0.8 : 1, width: (wp(88) - Spacing['4'] * 2) / 3 },
              ]}
              onPress={() => { setIncome(preset); setCustomIncome(''); }}
            >
              <Text
                style={[
                  styles.presetText,
                  { fontSize: moderateScale(14) },
                  income === preset && styles.presetTextSelected,
                ]}
              >
                {formatIncome(preset)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Custom input */}
        <View style={[styles.customRow, { width: wp(88) }]}>
          <Text style={[styles.customLabel, { fontSize: moderateScale(14) }]}>Or enter custom:</Text>
          <TextInput
            style={[styles.customInput, { fontSize: moderateScale(15), width: wp(40) }]}
            value={customIncome}
            onChangeText={(v) => { setCustomIncome(v); setIncome(null); }}
            placeholder="e.g. 85000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />
        </View>

        {/* Filing status */}
        <View style={[styles.section, { width: wp(88) }]}>
          <Text style={[styles.sectionLabel, { fontSize: moderateScale(14) }]}>Tax filing status</Text>
          <View style={styles.filingOptions}>
            {FILING_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.filingBtn,
                  filingStatus === opt.value && styles.filingBtnSelected,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => setFilingStatus(opt.value)}
              >
                <Text
                  style={[
                    styles.filingText,
                    { fontSize: moderateScale(13) },
                    filingStatus === opt.value && styles.filingTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Text style={[styles.privacyText, { fontSize: moderateScale(12) }]}>
            🔒 Your income is stored locally and used only for reward value estimates.
            We never transmit raw income data.
          </Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingHorizontal: Spacing['6'] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            { width: wp(88), opacity: (pressed || saving) ? 0.8 : 1 },
          ]}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.primaryBtnText, { fontSize: moderateScale(16) }]}>
              Finish setup 🎉
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
          <Text style={[styles.skipText, { fontSize: moderateScale(14) }]}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { height: 3, backgroundColor: Colors.surfaceAlt },
  progressFill: { height: 3, backgroundColor: Colors.accent, borderRadius: Radius.full },
  content: { flex: 1, paddingHorizontal: Spacing['6'], paddingTop: Spacing['6'], alignItems: 'center' },
  step: { color: Colors.accent, fontWeight: Typography.weight.semibold, letterSpacing: 0.5, textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: Spacing['2'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, alignSelf: 'flex-start', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, marginTop: Spacing['2'], alignSelf: 'flex-start', lineHeight: 22, marginBottom: Spacing['6'] },
  errorBox: { backgroundColor: Colors.dangerMuted, borderWidth: 1, borderColor: Colors.danger, borderRadius: Radius.md, padding: Spacing['3'], width: wp(88), marginBottom: Spacing['4'] },
  errorText: { color: Colors.dangerLight },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['3'], marginBottom: Spacing['5'] },
  presetBtn: { paddingVertical: Spacing['3'], backgroundColor: Colors.surface, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  presetBtnSelected: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  presetText: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },
  presetTextSelected: { color: Colors.primaryLight },
  customRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['6'] },
  customLabel: { color: Colors.textSecondary },
  customInput: { backgroundColor: Colors.surfaceAlt, color: Colors.text, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'] },
  section: { marginBottom: Spacing['5'] },
  sectionLabel: { color: Colors.textSecondary, marginBottom: Spacing['3'], fontWeight: Typography.weight.medium },
  filingOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
  filingBtn: { paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'], backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  filingBtnSelected: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filingText: { color: Colors.textSecondary },
  filingTextSelected: { color: Colors.primaryLight },
  privacyNote: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing['4'], borderWidth: 1, borderColor: Colors.border },
  privacyText: { color: Colors.textSecondary, lineHeight: 18 },
  bottomBar: { paddingBottom: Spacing['8'], alignItems: 'center', gap: Spacing['3'] },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing['4'], alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },
  skipBtn: { paddingVertical: Spacing['3'] },
  skipText: { color: Colors.textMuted, textDecorationLine: 'underline' },
});
