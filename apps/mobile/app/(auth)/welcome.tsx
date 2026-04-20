import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp, hp } from '../../lib/responsive';

const VALUE_PROPS = [
  { emoji: '📸', title: 'Scan any statement', body: 'Point your camera — we extract everything instantly' },
  { emoji: '🏆', title: 'Always earn max rewards', body: 'Real-time card recommendations for every purchase' },
  { emoji: '✈️', title: 'Plan your dream trip', body: 'We show you exactly which points to use and how' },
];

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <LinearGradient
      colors={['#09090B', '#0F0A1E', '#09090B']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      {/* Background glow */}
      <View style={[styles.glowOrb, { top: height * 0.15, left: width * 0.1 }]} />
      <View style={[styles.glowOrb2, { top: height * 0.35, right: width * 0.05 }]} />

      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo / wordmark */}
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>💳</Text>
            </View>
            <Text style={[styles.logoText, { fontSize: moderateScale(28) }]}>Labhly</Text>
          </View>

          {/* Hero headline */}
          <Text style={[styles.headline, { fontSize: moderateScale(36) }]}>
            Every dollar{'\n'}
            <Text style={styles.headlineAccent}>working harder</Text>
          </Text>

          <Text style={[styles.subheadline, { fontSize: moderateScale(16) }]}>
            Scan your statements. Maximize points.{'\n'}Travel smarter.
          </Text>

          {/* Value props */}
          <View style={[styles.propsContainer, { marginTop: hp(4) }]}>
            {VALUE_PROPS.map((vp) => (
              <View key={vp.title} style={styles.propRow}>
                <View style={styles.propEmoji}>
                  <Text style={{ fontSize: moderateScale(20) }}>{vp.emoji}</Text>
                </View>
                <View style={styles.propText}>
                  <Text style={[styles.propTitle, { fontSize: moderateScale(15) }]}>{vp.title}</Text>
                  <Text style={[styles.propBody, { fontSize: moderateScale(13) }]}>{vp.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View style={[styles.ctas, { opacity: fadeAnim }]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { width: wp(88), opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={[styles.primaryBtnText, { fontSize: moderateScale(16) }]}>
                Get started free
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, { width: wp(88), opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={[styles.secondaryBtnText, { fontSize: moderateScale(15) }]}>
              I already have an account
            </Text>
          </Pressable>

          <Text style={[styles.legal, { fontSize: moderateScale(11) }]}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
            {'\n'}Card data stays on your device.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primaryMuted,
    opacity: 0.4,
  },
  glowOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accentMuted,
    opacity: 0.25,
  },
  container: { flex: 1, justifyContent: 'space-between' },
  content: { paddingHorizontal: Spacing['6'], paddingTop: Spacing['12'] },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], marginBottom: Spacing['8'] },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 22 },
  logoText: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  headline: { color: Colors.text, fontWeight: Typography.weight.black, lineHeight: 44, letterSpacing: -1 },
  headlineAccent: { color: Colors.primary },
  subheadline: { color: Colors.textSecondary, marginTop: Spacing['4'], lineHeight: 24 },
  propsContainer: { gap: Spacing['5'] },
  propRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing['4'] },
  propEmoji: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  propText: { flex: 1 },
  propTitle: { color: Colors.text, fontWeight: Typography.weight.semibold },
  propBody: { color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  ctas: {
    paddingHorizontal: Spacing['6'],
    paddingBottom: Spacing['8'],
    alignItems: 'center',
    gap: Spacing['3'],
  },
  primaryBtn: { borderRadius: Radius['2xl'], overflow: 'hidden' },
  primaryBtnGradient: {
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },
  secondaryBtn: {
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  legal: { color: Colors.textMuted, textAlign: 'center', lineHeight: 16, marginTop: Spacing['2'] },
  legalLink: { color: Colors.primaryLight, textDecorationLine: 'underline' },
});
