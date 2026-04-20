import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/theme';
import { getStoredToken } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PhoneFrame } from '../components/ui/PhoneFrame';

// Prevent splash screen from hiding before fonts / auth check
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Auth token is now hydrated synchronously by useAuthStore on web.
    // On native we still want to warm up storage → state, then hide splash.
    async function bootstrap() {
      try {
        const stored = await getStoredToken();
        if (stored && !useAuthStore.getState().token) {
          useAuthStore.setState({ token: stored });
        }
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    void bootstrap();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor={Colors.background} />
            <PhoneFrame>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="best-card" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                <Stack.Screen name="planning" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                <Stack.Screen name="assistant" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="add" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                <Stack.Screen name="accounts/add-bank" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="investments/add" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="cards/[id]" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </PhoneFrame>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
