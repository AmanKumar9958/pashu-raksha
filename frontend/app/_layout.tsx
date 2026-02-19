import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { ClerkProvider } from "@clerk/clerk-expo";


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

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  return (
    <>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="details" />
          <Stack.Screen name="report" />
        </Stack>
      </ClerkProvider>
    </>
  )
}
