import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';
import { useAuth } from '@clerk/clerk-expo';
import React from 'react';

export default function TabLayout() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { role } = useBackendUserProfile();
  const isNgo = String(role).toUpperCase() === 'NGO';

  if (!isAuthLoaded) return null;
  if (!isSignedIn) return null;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#00F0D1' }}>
      <Tabs.Screen
        name="index"
        options={{
          // Home screen label dono ke liye same reh sakta hai
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