import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { useBackendUserProfile } from '../lib/useBackendUserProfile';
import { API_URL } from '../constants';

// Ensure OAuth deep linking works on native platforms
WebBrowser.maybeCompleteAuthSession();

const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_Y2l2aWwtaWd1YW5hLTYyLmNsZXJrLmFjY291bnRzLmRldiQ';

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
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Ping backend to wake up sleeping Render instance early
  useEffect(() => {
    try {
      const pingUrl = API_URL.replace(/\/api\/?$/, '');
      axios.get(pingUrl, { timeout: 5000 }).catch(() => {});
    } catch (e) {
      // Ignore ping errors
    }
  }, []);

  // Determine if we should wait for backend profile
  // Only wait if signed in AND profile is still loading
  const waitingForProfile = isSignedIn && loading;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isNavigationReady) return;
    // Don't navigate while profile is still loading — wait for it
    if (waitingForProfile) return;

    const inTabsGroup = segments[0] === '(citizen)' || segments[0] === '(ngo)';
    const inDetailsPage = segments[0] === 'details';
    const inReportPage = segments[0] === 'report';

    if (!isSignedIn && (inTabsGroup || inDetailsPage)) {
      setTimeout(() => router.replace('/'), 0);
    } 
    else if (isSignedIn) {
      const hasPhone = Boolean(profile?.phone);
      // 🚨 AGAR PROFILE MISSING HAI (phone null hai), TOH DETAILS PAR BHEJO
      if (!hasPhone) {
        if (!inDetailsPage && !inReportPage) {
          setTimeout(() => router.replace('/details'), 0);
        }
      } 
      // Agar profile complete hai, toh role ke hisab se bhejo
      else if (!inReportPage) {
        if (role === 'NGO' && segments[0] !== '(ngo)') {
          setTimeout(() => router.replace('/(ngo)/home'), 0);
        } else if (role === 'citizen' && segments[0] !== '(citizen)') {
          setTimeout(() => router.replace('/(citizen)/home'), 0);
        }
      }
    }
  }, [isSignedIn, isLoaded, profile?.phone, role, waitingForProfile, segments, isNavigationReady]);

  // Only block on Clerk auth loading — NOT on backend profile
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#00F0D1" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false }}
        screenListeners={{
          state: () => {
            if (!isNavigationReady) setIsNavigationReady(true);
          },
        }}
      >
        {/* Root index hi hamara login page hai */}
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(citizen)" options={{ headerShown: false }} />
        <Stack.Screen name="(ngo)" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
        <Stack.Screen name="report/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      tokenCache={tokenCache}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}