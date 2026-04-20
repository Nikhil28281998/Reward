import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { useAuthStore } from '../../lib/store';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.emojiIcon, { opacity: focused ? 1 : 0.55 }]}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (!token) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Pause inactive tabs to free memory & avoid offscreen renders
        freezeOnBlur: true,
        lazy: true,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + Spacing['1'],
          paddingTop: Spacing['1.5'],
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: moderateScale(10),
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="cards"
        options={{ title: 'Cards', tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} /> }}
      />
      <Tabs.Screen
        name="wealth"
        options={{ title: 'Wealth', tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ledger"
        options={{ title: 'Ledger', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      {/* Discover removed from tab bar — now routed from home. Assistant lives at app root as a modal. */}
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabIconActive: { backgroundColor: Colors.primaryMuted },
  emojiIcon: { fontSize: 18, lineHeight: 20, textAlign: 'center' },
});
