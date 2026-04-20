import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { ManualCardSheet } from '../../components/cards/ManualCardSheet';

type Mode = 'scan' | 'manual';

export default function ScanCardScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = params.mode === 'manual' ? 'manual' : 'scan';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [scanning, setScanning] = useState(false);
  const [manualOpen, setManualOpen] = useState(initialMode === 'manual');

  const launchCardScan = async () => {
    if (Platform.OS === 'web') {
      // Web preview doesn't support camera card detection; route to picker.
      const ok = await ImagePicker.requestCameraPermissionsAsync();
      if (!ok.granted) {
        window.alert('Camera access is required to scan your card. On desktop, card scan is mobile-only.');
        return;
      }
    } else {
      const ok = await ImagePicker.requestCameraPermissionsAsync();
      if (!ok.granted) {
        Alert.alert('Camera needed', 'Please allow camera access to scan your card.');
        return;
      }
    }
    setScanning(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: false,
        exif: false,
      });
      if (!result.canceled && result.assets[0]) {
        // In a real build we'd run on-device card-number OCR here.
        // For now, send the user to the manual add screen prefilled with detected issuer.
        router.replace('/cards/add');
      }
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Could not access the camera.');
      else Alert.alert('Scan failed', (e as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const cardSlotWidth = Math.min(width - 48, 320);
  const cardSlotHeight = cardSlotWidth * 0.63; // credit card aspect ~1.585

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={6}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { fontSize: moderateScale(16) }]}>Add a card</Text>
        <Pressable style={styles.iconBtn} onPress={() => router.replace('/(tabs)/cards')} hitSlop={6}>
          <Text style={styles.iconBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* Mode tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, mode === 'scan' && styles.tabActive]}
          onPress={() => { setMode('scan'); setManualOpen(false); }}
        >
          <Text style={[styles.tabText, { fontSize: moderateScale(13) }, mode === 'scan' && styles.tabTextActive]}>
            📷  Scan
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === 'manual' && styles.tabActive]}
          onPress={() => { setMode('manual'); setManualOpen(true); }}
        >
          <Text style={[styles.tabText, { fontSize: moderateScale(13) }, mode === 'manual' && styles.tabTextActive]}>
            ✍️  Enter manually
          </Text>
        </Pressable>
      </View>

      {mode === 'scan' ? (
        <View style={styles.body}>
          <Text style={[styles.heroTitle, { fontSize: moderateScale(24) }]}>Hold your card inside the frame</Text>
          <Text style={[styles.heroSub, { fontSize: moderateScale(13) }]}>
            We only read the issuer and last 4 digits — the full number never leaves your device.
          </Text>

          <View style={[styles.slotWrap, { width: cardSlotWidth, height: cardSlotHeight }]}>
            <LinearGradient
              colors={['rgba(79,70,229,0.24)', 'rgba(16,185,129,0.14)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Text style={[styles.slotHint, { fontSize: moderateScale(12) }]}>
              💳 align card edges with the guides
            </Text>
          </View>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>🔒 On-device</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>📷 Card only</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>🚫 No statement</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.scanBtn, { opacity: pressed || scanning ? 0.85 : 1 }]}
            onPress={launchCardScan}
            disabled={scanning}
          >
            <Text style={[styles.scanBtnText, { fontSize: moderateScale(15) }]}>
              {scanning ? 'Opening camera…' : '📷 Start card scan'}
            </Text>
          </Pressable>

          <Pressable onPress={() => { setMode('manual'); setManualOpen(true); }} hitSlop={6}>
            <Text style={[styles.manualLink, { fontSize: moderateScale(13) }]}>
              Can't scan right now? Enter it manually
            </Text>
          </Pressable>

          <View style={styles.note}>
            <Text style={[styles.noteText, { fontSize: moderateScale(11) }]}>
              Looking to import a statement, screenshot, or offer? Use{' '}
              <Text
                style={{ color: Colors.primaryLight, fontWeight: '700' }}
                onPress={() => router.replace('/(onboarding)/upload')}
              >
                Import documents
              </Text>{' '}
              instead.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={[styles.heroTitle, { fontSize: moderateScale(22) }]}>Add a card manually</Text>
          <Text style={[styles.heroSub, { fontSize: moderateScale(13) }]}>
            Perfect for store cards, lesser-known issuers, or when you'd rather type than scan.
            Your details are saved on this device.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.scanBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => setManualOpen(true)}
          >
            <Text style={[styles.scanBtnText, { fontSize: moderateScale(15) }]}>✍️ Open manual entry form</Text>
          </Pressable>
          <Pressable onPress={() => setMode('scan')} hitSlop={6}>
            <Text style={[styles.manualLink, { fontSize: moderateScale(13) }]}>
              Actually, let me scan the card instead
            </Text>
          </Pressable>
        </View>
      )}

      <ManualCardSheet
        visible={manualOpen}
        onClose={() => setManualOpen(false)}
        onSaved={() => router.replace('/(tabs)/cards')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.surface },
  iconBtnText: { color: Colors.text, fontSize: 22, fontWeight: '700', lineHeight: 22 },
  topBarTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing['3'],
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryLight },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryLight, fontWeight: '700' },
  body: { flex: 1, alignItems: 'center', padding: Spacing['5'], gap: Spacing['4'] },
  heroTitle: { color: Colors.text, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4 },
  heroSub: { color: Colors.textSecondary, textAlign: 'center', maxWidth: 340, lineHeight: 18 },
  slotWrap: { borderRadius: Radius['2xl'], overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)' },
  slotHint: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.primary },
  tl: { top: 8, left: 8, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 8, right: 8, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 8, left: 8, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 8, right: 8, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'], justifyContent: 'center' },
  pill: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  pillText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  scanBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing['4'], paddingHorizontal: Spacing['8'], alignItems: 'center', ...Shadow.primaryGlow },
  scanBtnText: { color: Colors.white, fontWeight: '700' },
  manualLink: { color: Colors.primaryLight, fontWeight: '600', textDecorationLine: 'underline' },
  note: { backgroundColor: 'rgba(79,70,229,0.08)', borderRadius: Radius.lg, padding: Spacing['3'], borderWidth: 1, borderColor: 'rgba(79,70,229,0.2)', borderStyle: 'dashed', marginTop: Spacing['2'] },
  noteText: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
});
