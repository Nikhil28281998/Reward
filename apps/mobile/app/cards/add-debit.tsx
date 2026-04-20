import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { useWealthStore } from '../../lib/store';

const POPULAR_BANKS = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One', 'PNC', 'US Bank', 'Ally', 'SoFi'];

export default function AddDebitCard() {
  const addDebitCard = useWealthStore((s) => s.addDebitCard);
  const [bank, setBank] = useState('');
  const [nickname, setNickname] = useState('');
  const [last4, setLast4] = useState('');
  const [rewardsNote, setRewardsNote] = useState('');

  const handleSave = () => {
    if (!bank.trim()) {
      if (Platform.OS === 'web') window.alert('Pick or type a bank issuer.');
      else Alert.alert('Bank required', 'Pick or type a bank issuer.');
      return;
    }
    const cleanLast4 = last4.replace(/\D/g, '').slice(0, 4);
    addDebitCard({
      issuer: bank.trim(),
      nickname: nickname.trim() || undefined,
      last4: cleanLast4 || undefined,
      bankName: bank.trim(),
      rewardsNote: rewardsNote.trim() || undefined,
    });
    router.replace('/(tabs)/wealth');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={6}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { fontSize: moderateScale(16) }]}>Add debit card</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing['5'], gap: Spacing['4'], paddingBottom: Spacing['20'] }}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={[styles.heroLabel, { fontSize: moderateScale(10) }]}>DEBIT CARD</Text>
          <Text style={[styles.heroName, { fontSize: moderateScale(18) }]}>{nickname || bank || 'New debit card'}</Text>
          {last4 ? <Text style={[styles.heroLast4, { fontSize: moderateScale(14) }]}>•••• {last4}</Text> : null}
        </LinearGradient>

        <Text style={[styles.sectionLabel, { fontSize: moderateScale(11) }]}>POPULAR BANKS</Text>
        <View style={styles.chipRow}>
          {POPULAR_BANKS.map((b) => (
            <Pressable
              key={b}
              onPress={() => setBank(b)}
              style={({ pressed }) => [styles.chip, bank === b && styles.chipActive, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.chipText, { fontSize: moderateScale(12) }, bank === b && styles.chipTextActive]}>
                {b}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field label="BANK" value={bank} onChangeText={setBank} placeholder="e.g. Chase" />
        <Field label="NICKNAME (optional)" value={nickname} onChangeText={setNickname} placeholder="e.g. Daily debit" />
        <Field label="LAST 4" value={last4} onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))} placeholder="••••" keyboardType="number-pad" inputMode="numeric" maxLength={4} />
        <Field
          label="DEBIT OFFERS NOTE (optional)"
          value={rewardsNote}
          onChangeText={setRewardsNote}
          placeholder="e.g. 5% back on Target via BofA offers"
          multiline
        />

        <Text style={[styles.hint, { fontSize: moderateScale(11) }]}>
          💡 Debit cards often have bank-specific merchant offers (BofA Deals, Chase Offers, Wells Fargo Deals). Labhly helps
          you activate and track those.
        </Text>

        <Pressable style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.9 : 1 }]} onPress={handleSave}>
          <Text style={[styles.saveBtnText, { fontSize: moderateScale(15) }]}>Add debit card</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength, multiline, inputMode, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  maxLength?: number;
  multiline?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View>
      <Text style={[styles.fieldLabel, { fontSize: moderateScale(11) }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
        style={[styles.fieldInput, { fontSize: moderateScale(15), minHeight: multiline ? 70 : undefined }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.surface },
  iconBtnText: { color: Colors.text, fontSize: 22, fontWeight: '700', lineHeight: 22 },
  topBarTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  hero: { borderRadius: Radius['2xl'], padding: Spacing['5'], minHeight: 130, justifyContent: 'space-between', ...Shadow.md },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5 },
  heroName: { color: Colors.white, fontWeight: '800' },
  heroLast4: { color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  sectionLabel: { color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginTop: Spacing['2'] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
  chip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryLight },
  fieldLabel: { color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: Colors.surface, color: Colors.text, borderRadius: Radius.xl, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderWidth: 1, borderColor: Colors.border },
  hint: { color: Colors.textSecondary, lineHeight: 16, backgroundColor: 'rgba(79,70,229,0.08)', borderRadius: Radius.lg, padding: Spacing['3'] },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing['4'], alignItems: 'center', marginTop: Spacing['2'], ...Shadow.primaryGlow },
  saveBtnText: { color: Colors.white, fontWeight: '700' },
});
