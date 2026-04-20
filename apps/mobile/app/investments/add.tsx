import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { useWealthStore, type Investment } from '../../lib/store';

const BROKERS = ['Fidelity', 'Schwab', 'Vanguard', 'Robinhood', 'Webull', 'E*TRADE', 'Coinbase', 'Kraken'];
const TYPES: Array<{ id: Investment['type']; label: string; emoji: string }> = [
  { id: 'brokerage', label: 'Brokerage', emoji: '📈' },
  { id: 'retirement', label: 'Retirement', emoji: '🌅' },
  { id: 'crypto', label: 'Crypto', emoji: '₿' },
];

export default function AddInvestment() {
  const addInvestment = useWealthStore((s) => s.addInvestment);
  const [type, setType] = useState<Investment['type']>('brokerage');
  const [broker, setBroker] = useState('');
  const [nickname, setNickname] = useState('');
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [value, setValue] = useState('');

  const handleSave = () => {
    const val = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!broker.trim()) {
      const msg = 'Pick a broker or platform.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Required', msg);
      return;
    }
    if (isNaN(val) || val < 0) {
      const msg = 'Enter a valid current value.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Value', msg);
      return;
    }
    const sharesNum = parseFloat(shares.replace(/[^0-9.]/g, ''));
    addInvestment({
      type,
      broker: broker.trim(),
      nickname: nickname.trim() || undefined,
      symbol: symbol.trim().toUpperCase() || undefined,
      shares: !isNaN(sharesNum) && sharesNum > 0 ? sharesNum : undefined,
      value: val,
    });
    router.replace('/(tabs)/wealth');
  };

  const colors: [string, string] =
    type === 'crypto' ? ['#F59E0B', '#EF4444'] :
    type === 'retirement' ? ['#7C3AED', '#4F46E5'] :
    ['#F59E0B', '#F97316'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={6}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { fontSize: moderateScale(16) }]}>Add investment</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing['5'], gap: Spacing['4'], paddingBottom: Spacing['20'] }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={[styles.heroLabel, { fontSize: moderateScale(10) }]}>{type.toUpperCase()}</Text>
          <Text style={[styles.heroName, { fontSize: moderateScale(18) }]}>
            {nickname || broker || symbol || 'New investment'}
          </Text>
          <View>
            <Text style={[styles.heroBalanceLabel, { fontSize: moderateScale(10) }]}>CURRENT VALUE</Text>
            <Text style={[styles.heroBalance, { fontSize: moderateScale(24) }]}>
              ${value ? Number(value.replace(/[^0-9.]/g, '') || 0).toLocaleString() : '0'}
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
              <Text style={[styles.typeChipText, { fontSize: moderateScale(12) }, type === t.id && styles.typeChipTextActive]}>
                {t.emoji} {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { fontSize: moderateScale(11) }]}>BROKER / PLATFORM</Text>
        <View style={styles.chipRow}>
          {BROKERS.map((b) => (
            <Pressable
              key={b}
              onPress={() => setBroker(b)}
              style={({ pressed }) => [styles.chip, broker === b && styles.chipActive, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.chipText, { fontSize: moderateScale(12) }, broker === b && styles.chipTextActive]}>{b}</Text>
            </Pressable>
          ))}
        </View>

        <Field label="BROKER" value={broker} onChangeText={setBroker} placeholder="e.g. Fidelity" />
        <Field label="NICKNAME (optional)" value={nickname} onChangeText={setNickname} placeholder="e.g. Roth IRA" />
        <View style={{ flexDirection: 'row', gap: Spacing['3'] }}>
          <View style={{ flex: 1 }}>
            <Field label="SYMBOL" value={symbol} onChangeText={(t) => setSymbol(t.toUpperCase().replace(/\s+/g, ''))} placeholder="VOO" autoCapitalize="characters" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="SHARES" value={shares} onChangeText={setShares} placeholder="10" keyboardType="decimal-pad" />
          </View>
        </View>
        <Field label="CURRENT VALUE" value={value} onChangeText={setValue} placeholder="$0.00" keyboardType="decimal-pad" />

        <Pressable style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.9 : 1 }]} onPress={handleSave}>
          <Text style={[styles.saveBtnText, { fontSize: moderateScale(15) }]}>Add investment</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
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
        autoCapitalize={autoCapitalize}
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
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1.5 },
  heroName: { color: Colors.white, fontWeight: '800' },
  heroBalanceLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
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
