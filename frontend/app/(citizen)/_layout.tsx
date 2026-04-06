import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CitizenLayout() {
	const insets = useSafeAreaInsets();

	return (
		<Tabs
		screenOptions={{
			// Active tab ka color wahi cyan (#00F0D1)
			tabBarActiveTintColor: '#00F0D1',
			// Inactive tabs ka color gray (#9CA3AF)
			tabBarInactiveTintColor: '#9CA3AF',
			headerShown: false,
			tabBarStyle: {
			backgroundColor: '#FFFFFF',
			borderTopWidth: 1,
			borderTopColor: '#F3F4F6',
			height: 65 + insets.bottom,
			paddingBottom: 10 + insets.bottom,
			paddingTop: 10,
			},
			tabBarLabelStyle: {
			fontSize: 12,
			fontWeight: '600',
			},
		}}
		>
		{/* 1. Home Tab */}
		<Tabs.Screen
			name="home"
			options={{
			title: 'Home',
			tabBarIcon: ({ color, size }) => (
				<Ionicons name="home" size={size} color={color} />
			),
			}}
		/>

		{/* 2. My Reports Tab */}
		<Tabs.Screen
			name="cases"
			options={{
			title: 'My Reports',
			tabBarIcon: ({ color, size }) => (
				<Ionicons name="document-text" size={size} color={color} />
			),
			}}
		/>

		{/* 3. Profile Tab */}
		<Tabs.Screen
			name="profile"
			options={{
			title: 'Profile',
			tabBarIcon: ({ color, size }) => (
				<Ionicons name="person" size={size} color={color} />
			),
			}}
		/>
		</Tabs>
	);
}