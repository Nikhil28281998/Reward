import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp, hp } from '../../lib/responsive';
import { api } from '../../lib/api';

type UploadOption = { icon: string; label: string; sublabel: string; action: () => void };

export default function UploadScreen() {
  const { width } = useWindowDimensions();
  const [uploading, setUploading] = useState(false);
  const [statementId, setStatementId] = useState<string | null>(null);

  const uploadFile = async (uri: string, name: string, mimeType: string) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri, name, type: mimeType } as unknown as Blob);
      const res = await api.onboarding.uploadStatement(form);
      const { statementId: sid } = res.data as { statementId: string };
      setStatementId(sid);
      router.push({ pathname: '/(onboarding)/cards-confirm', params: { statementId: sid } });
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Please allow camera access in Settings to scan statements.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.92,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, 'statement.jpg', 'image/jpeg');
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsMultipleSelection: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.fileName ?? 'statement.jpg', asset.mimeType ?? 'image/jpeg');
    }
  };

  const openDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, 'application/pdf');
    }
  };

  const options: UploadOption[] = [
    { icon: '📷', label: 'Scan with camera', sublabel: 'Point at any statement page', action: openCamera },
    { icon: '🖼️', label: 'Choose screenshot', sublabel: 'Import from your photo library', action: openGallery },
    { icon: '📄', label: 'Upload PDF', sublabel: 'Import your e-statement PDF', action: openDocument },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '33%' }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.step, { fontSize: moderateScale(13) }]}>Step 1 of 3</Text>
        <Text style={[styles.title, { fontSize: moderateScale(28) }]}>Add your first card</Text>
        <Text style={[styles.subtitle, { fontSize: moderateScale(15) }]}>
          Upload a recent statement — we&apos;ll detect your card and import transactions automatically.
        </Text>

        {/* Upload illustration */}
        <View style={[styles.illustration, { width: wp(88), height: hp(20) }]}>
          <LinearGradient
            colors={[Colors.surface, Colors.surfaceAlt]}
            style={styles.illustrationGradient}
          >
            {uploading ? (
              <View style={styles.uploadingState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={[styles.uploadingText, { fontSize: moderateScale(15) }]}>
                  Uploading & processing…
                </Text>
                <Text style={[styles.uploadingSubtext, { fontSize: moderateScale(13) }]}>
                  OCR magic in progress ✨
                </Text>
              </View>
            ) : (
              <View style={styles.illustrationContent}>
                <Text style={{ fontSize: 52 }}>📋</Text>
                <Text style={[styles.illustrationText, { fontSize: moderateScale(14) }]}>
                  Your statement goes here
                </Text>
                <View style={styles.illustrationBadge}>
                  <Text style={[styles.badgeText, { fontSize: moderateScale(11) }]}>
                    🔒 Processed on-device
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Upload options */}
        {!uploading && (
          <View style={[styles.options, { width: wp(88) }]}>
            {options.map((opt) => (
              <Pressable
                key={opt.label}
                style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.75 : 1 }]}
                onPress={opt.action}
              >
                <View style={styles.optionIcon}>
                  <Text style={{ fontSize: moderateScale(22) }}>{opt.icon}</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { fontSize: moderateScale(15) }]}>{opt.label}</Text>
                  <Text style={[styles.optionSublabel, { fontSize: moderateScale(13) }]}>{opt.sublabel}</Text>
                </View>
                <Text style={[styles.optionChevron, { fontSize: moderateScale(18) }]}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Skip */}
        {!uploading && (
          <Pressable style={styles.skipBtn} onPress={() => router.push('/(onboarding)/income')}>
            <Text style={[styles.skipText, { fontSize: moderateScale(14) }]}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { height: 3, backgroundColor: Colors.surfaceAlt, marginTop: 0 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: Radius.full },
  content: { flex: 1, paddingHorizontal: Spacing['6'], paddingTop: Spacing['6'], alignItems: 'center' },
  step: { color: Colors.primary, fontWeight: Typography.weight.semibold, letterSpacing: 0.5, textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: Spacing['2'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, alignSelf: 'flex-start', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, marginTop: Spacing['2'], alignSelf: 'flex-start', lineHeight: 22, marginBottom: Spacing['6'] },
  illustration: { borderRadius: Radius['2xl'], overflow: 'hidden', marginBottom: Spacing['6'], ...Shadow.md },
  illustrationGradient: { flex: 1 },
  illustrationContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing['2'] },
  illustrationText: { color: Colors.textSecondary },
  illustrationBadge: { backgroundColor: Colors.accentMuted, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['1'] },
  badgeText: { color: Colors.accentLight, fontWeight: Typography.weight.medium },
  uploadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing['3'] },
  uploadingText: { color: Colors.text, fontWeight: Typography.weight.semibold },
  uploadingSubtext: { color: Colors.textSecondary },
  options: { gap: Spacing['3'] },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['4'], gap: Spacing['4'], borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  optionIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optionLabel: { color: Colors.text, fontWeight: Typography.weight.semibold },
  optionSublabel: { color: Colors.textSecondary, marginTop: 2 },
  optionChevron: { color: Colors.textMuted },
  skipBtn: { marginTop: Spacing['6'], paddingVertical: Spacing['3'] },
  skipText: { color: Colors.textMuted, textDecorationLine: 'underline' },
});
