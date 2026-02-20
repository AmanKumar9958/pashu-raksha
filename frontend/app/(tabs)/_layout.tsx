import React from 'react';
import { Dimensions, Easing } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const screenWidth = Dimensions.get('window').width;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00F0D1', // Aapka brand color
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        // Prevent any background showing through during transitions
        sceneStyle: { backgroundColor: '#fff' },
        // Animate between tabs
        animationEnabled: true,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          },
        },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-screenWidth, 0, screenWidth],
                }),
              },
            ],
          },
        }),
        tabBarStyle: {
          height: 55,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: '#EEE',
          backgroundColor: '#fff',
        },
      }}
    >
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