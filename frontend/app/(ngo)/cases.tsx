import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenTransition from '../../components/ScreenTransition';

export default function NgoCasesScreen() {
	return (
		<ScreenTransition>
			<View style={styles.container}>
				<Text style={styles.text}>NGO ALL CASES</Text>
			</View>
		</ScreenTransition>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	text: { fontSize: 18, fontWeight: '600' },
});
