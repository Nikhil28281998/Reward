import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { useWealthStore, type BankAccount } from '../../lib/store';

const POPULAR_BANKS = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One', 'Ally', 'SoFi', 'Marcus', 'Discover'];
const TYPES: Array<{ id: BankAccount['type']; label: string; emoji: string }> = [
  { id: 'checking', label: 'Checking', emoji: '🟦' },
  { id: 'savings', label: 'Savings', emoji: '🟩' },
];

export default function AddBankAccount() {
  const addBankAccount = useWealthStore((s) => s.addBankAccount);
  const [type, setType] = useState<BankAccount['type']>('checking');
  const [bankName, setBankName] = useState('');
  const [nickname, setNickname] = useState('');
  const [last4, setLast4] = useState('');
  const [balance, setBalance] = useState('');
  const [apy, setApy] = useState('');

  const handleSave = () => {
    const bal = parseFloat(balance.replace(/[^0-9.]/g, ''));
    if (!bankName.trim()) {
      const msg = 'Bank name is required.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Required', msg);
      return;
    }
    if (isNaN(bal) || bal < 0) {
      const msg = 'Enter a valid current balance.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Balance', msg);
      return;
    }
    const apyNum = parseFloat(apy.replace(/[^0-9.]/g, ''));
    addBankAccount({
      type,
      bankName: bankName.trim(),
      nickname: nickname.trim() || undefined,
      last4: last4.replace(/\D/g, '').slice(0, 4) || undefined,
      balance: bal,
      apy: !isNaN(apyNum) && apyNum > 0 ? apyNum : undefined,
    });
    router.replace('/(tabs)/wealth');
  };

  const colors: [string, string] = type === 'savings' ? ['#10B981', '#0EA5E9'] : ['#0EA5E9', '#2563EB'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={6}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { fontSize: moderateScale(16) }]}>Add bank account</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing['5'], gap: Spacing['4'], paddingBottom: Spacing['20'] }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={[styles.heroLabel, { fontSize: moderateScale(10) }]}>{type.toUpperCase()} ACCOUNT</Text>
          <Text style={[styles.heroName, { fontSize: moderateScale(18) }]}>
            {nickname || bankName || 'New account'}
          </Text>
          <View>
            <Text style={[styles.heroBalanceLabel, { fontSize: moderateScale(10) }]}>BALANCE</Text>
            <Text style={[styles.heroBalance, { fontSize: moderateScale(24) }]}>
              ${balance ? Number(balance.replace(/[^0-9.]/g, '') || 0).toLocaleString() : '0'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setType(t.id)}
              style={({ pressed }) => [styles.typeChip, type === t.id && styles.typeChipActive, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.typeChipText, { fontSize: moderateScale(13) }, type === t.id && styles.typeChipTextActive]}>
                {t.emoji} {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { fontSize: moderateScale(11) }]}>POPULAR BANKS</Text>
        <View style={styles.chipRow}>
          {POPULAR_BANKS.map((b) => (
            <Pressable
              key={b}
              onPress={() => setBankName(b)}
              style={({ pressed }) => [styles.chip, bankName === b && styles.chipActive, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.chipText, { fontSize: moderateScale(12) }, bankName === b && styles.chipTextActive]}>
                {b}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field label="BANK" value={bankName} onChangeText={setBankName} placeholder="e.g. Ally" />
        <Field label="NICKNAME (optional)" value={nickname} onChangeText={setNickname} placeholder="e.g. HYSA" />
        <Field label="LAST 4" value={last4} onChangeText={(t) => setLast4(t.replace(/\D/g, '').slice(0, 4))} placeholder="••••" keyboardType="number-pad" inputMode="numeric" maxLength={4} />
        <View style={{ flexDirection: 'row', gap: Spacing['3'] }}>
          <View style={{ flex: 1 }}>
            <Field label="CURRENT BALANCE" value={balance} onChangeText={setBalance} placeholder="$0.00" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="APY %" value={apy} onChangeText={setApy} placeholder="4.50" keyboardType="decimal-pad" />
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.9 : 1 }]} onPress={handleSave}>
          <Text style={[styles.saveBtnText, { fontSize: moderateScale(15) }]}>Add account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength, inputMode, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  maxLength?: number;
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
        style={[styles.fieldInput, { fontSize: moderateScale(15) }]}
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
  hero: { borderRadius: Radius['2xl'], padding: Spacing['5'], minHeight: 160, justifyContent: 'space-between', ...Shadow.md },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5 },
  heroName: { color: Colors.white, fontWeight: '800' },
  heroBalanceLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 },
  heroBalance: { color: Colors.white, fontWeight: '800', marginTop: 2 },
  sectionLabel: { color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginTop: Spacing['2'] },
  typeRow: { flexDirection: 'row', gap: Spacing['2'] },
  typeChip: { flex: 1, paddingVertical: Spacing['3'], borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  typeChipText: { color: Colors.textSecondary, fontWeight: '700' },
  typeChipTextActive: { color: Colors.primaryLight },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
  chip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryLight },
  fieldLabel: { color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: Colors.surface, color: Colors.text, borderRadius: Radius.xl, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing['4'], alignItems: 'center', marginTop: Spacing['2'], ...Shadow.primaryGlow },
  saveBtnText: { color: Colors.white, fontWeight: '700' },
});
