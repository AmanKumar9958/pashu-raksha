import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Emergency</Text>
      <Text style={styles.subtitle}>Report form coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
