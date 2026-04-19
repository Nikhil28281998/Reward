import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../lib/store';

export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  // If already authenticated, go straight to app
  if (token) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ animation: 'none' }} />
      <Stack.Screen name="sign-in" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
