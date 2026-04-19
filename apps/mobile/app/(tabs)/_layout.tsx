import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';
import { useAuthStore } from '../../lib/store';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <View style={{ opacity: focused ? 1 : 0.55 }}>
        {/* Using text emoji as icon for now — replace with @expo/vector-icons in production */}
        <View style={styles.emojiIcon}>
          {/* Actual icon rendered by system emoji for speed */}
        </View>
      </View>
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
        name="ledger"
        options={{ title: 'Ledger', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} /> }}
      />
      <Tabs.Screen
        name="assistant"
        options={{ title: 'Ask AI', tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  tabIconActive: { backgroundColor: Colors.primaryMuted },
  emojiIcon: { width: 20, height: 20 },
});
