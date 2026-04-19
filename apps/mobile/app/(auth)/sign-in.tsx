import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useAuth } from '../../hooks/useAuth';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Text style={[styles.backText, { fontSize: moderateScale(15) }]}>← Back</Text>
          </Pressable>

          <Text style={[styles.title, { fontSize: moderateScale(30) }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { fontSize: moderateScale(15) }]}>
            Sign in to your Reward account
          </Text>

          {/* Form */}
          <View style={[styles.form, { width: wp(88) }]}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontSize: moderateScale(13) }]}>{error}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontSize: moderateScale(13) }]}>Email</Text>
              <TextInput
                style={[styles.input, { fontSize: moderateScale(15) }]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontSize: moderateScale(13) }]}>Password</Text>
              <TextInput
                style={[styles.input, { fontSize: moderateScale(15) }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, { fontSize: moderateScale(16) }]}>Sign in</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/(auth)/sign-up')} style={styles.switchLink}>
            <Text style={[styles.switchText, { fontSize: moderateScale(14) }]}>
              Don&apos;t have an account?{' '}
              <Text style={styles.switchCta}>Create one</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: Spacing['6'], paddingBottom: Spacing['10'] },
  backBtn: { alignSelf: 'flex-start', marginTop: Spacing['4'], marginBottom: Spacing['8'] },
  backText: { color: Colors.primary, fontWeight: Typography.weight.medium },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, alignSelf: 'flex-start', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, marginTop: Spacing['1'], alignSelf: 'flex-start', marginBottom: Spacing['8'] },
  form: { gap: Spacing['5'] },
  errorBox: {
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    padding: Spacing['3'],
  },
  errorText: { color: Colors.dangerLight },
  fieldGroup: { gap: Spacing['1.5'] },
  label: { color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  input: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    marginTop: Spacing['3'],
  },
  primaryBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },
  switchLink: { marginTop: Spacing['6'] },
  switchText: { color: Colors.textSecondary },
  switchCta: { color: Colors.primary, fontWeight: Typography.weight.semibold },
});
