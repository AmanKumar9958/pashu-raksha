import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CitizenCasesScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>Citizen Cases</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	text: { fontSize: 18, fontWeight: '600' },
});
