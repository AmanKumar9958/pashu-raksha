import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NGODashboard({ userData }: { userData?: any }) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>NGO Dashboard</Text>
			<Text style={styles.subtitle}>Coming soon</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
	title: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
	subtitle: { marginTop: 8, fontSize: 14, color: '#9CA3AF' },
});
