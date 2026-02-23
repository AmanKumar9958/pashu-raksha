import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import React, { useEffect } from "react";
// Auth redirects are handled at the root layout.


// token cache logic
const tokenCache = {
  async getToken(key: string) {
    try{
      return SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("Error getting token from cache:", error);
      return null;
    }
  },
  async saveToken(key: string, value: string){
    try{
      return SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("Error saving token to cache:", error);
    }
  }
}

function RootNavigator() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isLoaded, isSignedIn } = useAuth();

  const getActiveRouteName = (state: any): string | null => {
    if (!state || !state.routes || state.index == null) return null;
    const route = state.routes[state.index];
    if (route?.state) return getActiveRouteName(route.state);
    return route?.name || null;
  };

  useEffect(() => {
    if (!isLoaded) return;

    // Always force signed-out users back to login.
    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    if (!navigationState?.key) return;
    const activeRouteName = getActiveRouteName(navigationState);

    // If signed in and sitting on the login screen, move to tabs.
    if (activeRouteName === "index") {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn, navigationState, router]);

  return (
    <>
      <StatusBar style="dark" translucent={false} backgroundColor="#fff" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationTypeForReplace: 'push',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="details" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="report" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootNavigator />
    </ClerkProvider>
  );
}
