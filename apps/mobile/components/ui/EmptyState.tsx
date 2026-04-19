import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';

interface EmptyStateProps {
  emoji: string;
  title: string;
  body?: string;
  cta?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ emoji, title, body, cta, onCta, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.emoji, { fontSize: moderateScale(52) }]}>{emoji}</Text>
      <Text style={[styles.title, { fontSize: moderateScale(19) }]}>{title}</Text>
      {body && <Text style={[styles.body, { fontSize: moderateScale(14) }]}>{body}</Text>}
      {cta && onCta && (
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={onCta}
        >
          <Text style={[styles.ctaText, { fontSize: moderateScale(15) }]}>{cta}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['16'], paddingHorizontal: Spacing['8'] },
  emoji: { marginBottom: Spacing['4'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, textAlign: 'center', marginBottom: Spacing['2'] },
  body: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  ctaBtn: { marginTop: Spacing['6'], backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingHorizontal: Spacing['8'], paddingVertical: Spacing['3'] },
  ctaText: { color: Colors.white, fontWeight: Typography.weight.bold },
});
