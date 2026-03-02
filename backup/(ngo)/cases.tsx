import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NgoCasesScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>NGO Cases</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	text: { fontSize: 18, fontWeight: '600' },
});
