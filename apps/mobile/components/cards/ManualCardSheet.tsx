import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { useWealthStore } from '../../lib/store';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function ManualCardSheet({ visible, onClose, onSaved }: Props) {
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
      creditLimit: !isNaN(limitNum) && limitNum > 0 ? Math.max(0, Math.min(1_000_000, limitNum)) : undefined,
      annualFee: !isNaN(feeNum) && feeNum >= 0 ? Math.max(0, Math.min(10_000, feeNum)) : undefined,
      rewardsNote: rewards.trim() || undefined,
    });
    reset();
    onClose();
    onSaved?.();
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
                  maxLength={10}
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
                  maxLength={8}
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
});
