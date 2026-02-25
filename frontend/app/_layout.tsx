import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, role, loading } = useBackendUserProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === '(citizen)' || segments[0] === '(ngo)';
    const inDetailsPage = segments[0] === 'details';

    if (!isSignedIn && (inTabsGroup || inDetailsPage)) {
      router.replace('/');
    } 
    else if (isSignedIn && !loading) {
      const hasPhone = Boolean(profile?.phone);
      // 🚨 AGAR PROFILE MISSING HAI (phone null hai), TOH DETAILS PAR BHEJO
      if (!hasPhone) {
        if (!inDetailsPage) {
          router.replace('/details');
        }
      } 
      // Agar profile complete hai, toh role ke hisab se bhejo
      else {
        if (role === 'NGO' && segments[0] !== '(ngo)') {
          router.replace('/(ngo)/home');
        } else if (role === 'citizen' && segments[0] !== '(citizen)') {
          router.replace('/(citizen)/home');
        }
      }
    }
  }, [isSignedIn, isLoaded, profile?.phone, role, loading, segments]);

  const showLoader = !isLoaded || (isSignedIn && loading);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Root index hi hamara login page hai */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(citizen)" options={{ headerShown: false }} />
        <Stack.Screen name="(ngo)" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {showLoader && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#00F0D1" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  const prefix = Linking.createURL('/');
  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!} 
      tokenCache={tokenCache}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}