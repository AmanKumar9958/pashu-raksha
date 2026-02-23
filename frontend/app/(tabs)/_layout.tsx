import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';
import { useAuth } from '@clerk/clerk-expo';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { role, loading } = useBackendUserProfile();

  // 1. Agar auth load ho raha hai, toh wait karo
  if (!isAuthLoaded) return null;

  // 2. 🚨 CRITICAL: Agar user signed out hai, toh Layout render hi mat karo
  // Ye redirection ke waqt hone wale crash ko rokta hai
  if (!isSignedIn) return null;

  // 3. Agar role load ho raha hai, toh ek chota spinner dikhao (Optional)
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="small" color="#00F0D1" />
      </View>
    );
  }

  const isNgo = String(role).toUpperCase() === 'NGO';

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#00F0D1', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color }) => (
            <Ionicons name={isNgo ? 'briefcase' : 'list'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}