import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#00F0D1', // Aapka brand color
      tabBarInactiveTintColor: '#666',
      headerShown: false,
      tabBarStyle: { 
        height: 55, 
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE'
      }
    }}>
      {/* Home Screen Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nearby',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />

      {/* My Cases Tab */}
      <Tabs.Screen
        name="cases"
        options={{
          title: 'My Cases',
          tabBarLabel: 'Cases',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size} color={color} />
          ),
        }}
      />

      {/* User Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}