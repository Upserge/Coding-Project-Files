import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { QueryProvider } from '@/src/context/QueryProvider';
import { PushNotificationHandler } from '@/src/components/PushNotificationHandler';
import { ThemeProvider as AppThemeProvider } from '@/src/theme/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const needsAuth =
      isConfigured &&
      !user &&
      (segments[0] === 'review' || (segments as string[]).includes('saved'));

    if (needsAuth && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, isConfigured, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AppThemeProvider>
          <AuthProvider>
            <AuthGate>
              <PushNotificationHandler />
              <RootLayoutNav />
            </AuthGate>
          </AuthProvider>
        </AppThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="property/[id]"
          options={{ title: 'Property', headerBackTitle: 'Back' }}
        />
        <Stack.Screen name="landlord/[id]" options={{ title: 'Landlord', headerBackTitle: 'Back' }} />
        <Stack.Screen
          name="review/new"
          options={{ title: 'Write a review', presentation: 'modal', headerBackTitle: 'Back' }}
        />
        <Stack.Screen name="legal/terms" options={{ title: 'Terms of Service' }} />
        <Stack.Screen name="legal/privacy" options={{ title: 'Privacy Policy' }} />
      </Stack>
    </ThemeProvider>
  );
}
