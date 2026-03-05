import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function ReportFormScreen() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [image, setImage] = useState<string | null>(null);
	const [location, setLocation] = useState<Location.LocationObject | null>(null);
	const [description, setDescription] = useState('');
	const [animalType, setAnimalType] = useState('');
	const [locationText, setLocationText] = useState('');

	// 1. Get Location automatically on mount
	useEffect(() => {
		(async () => {
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission denied', 'Allow location access to report cases nearby.');
			return;
		}
		let loc = await Location.getCurrentPositionAsync({});
		setLocation(loc);
		})();
	}, []);

	// 2. Pick Image from Gallery
	const pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ImagePicker.MediaTypeOptions.Images,
		allowsEditing: true,
		aspect: [4, 3],
		quality: 0.5, // Compress for faster upload
		});

		if (!result.canceled) {
		setImage(result.assets[0].uri);
		}
	};

	// 3. Submit Report to Backend
	const handleSubmit = async () => {
		if (!image || !description || !animalType) {
		Alert.alert('Missing Info', 'Please provide an image, animal type, and description.');
		return;
		}

		setLoading(true);
		try {
		// API call placeholder using axios
		// Bhai, EXPO_PUBLIC_API_URL ka use karna jo .env mein hai
		const formData = new FormData();
		formData.append('description', description);
		formData.append('type', animalType);
		formData.append('latitude', location?.coords.latitude.toString() || '');
		formData.append('longitude', location?.coords.longitude.toString() || '');
		formData.append('locationText', locationText);
		
		// Image upload logic
		const filename = image.split('/').pop();
		const match = /\.(\w+)$/.exec(filename || '');
		const type = match ? `image/${match[1]}` : `image`;
		formData.append('photo', { uri: image, name: filename, type } as any);

		// await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/reports`, formData);
		
		Alert.alert('Success', 'Report submitted! NGO notified.', [
			{ text: 'OK', onPress: () => router.back() }
		]);
		} catch (error) {
		console.error(error);
		Alert.alert('Error', 'Something went wrong while submitting.');
		} finally {
		setLoading(false);
		}
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
		<View style={styles.header}>
			<TouchableOpacity onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={24} color="#1A1C1E" />
			</TouchableOpacity>
			<Text style={styles.title}>Report Incident</Text>
		</View>

		{/* Image Upload Area */}
		<TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
			{image ? (
			<Image source={{ uri: image }} style={styles.previewImage} />
			) : (
			<View style={styles.placeholderBox}>
				<Ionicons name="camera-outline" size={40} color="#9CA3AF" />
				<Text style={styles.placeholderText}>Tap to add photo</Text>
			</View>
			)}
		</TouchableOpacity>

		{/* Input Fields */}
		<View style={styles.inputGroup}>
			<Text style={styles.label}>What animal is it?</Text>
			<TextInput
			style={styles.input}
			placeholder="e.g. Dog, Cat, Cow"
			value={animalType}
			onChangeText={setAnimalType}
			/>
		</View>

		<View style={styles.inputGroup}>
			<Text style={styles.label}>Describe the condition</Text>
			<TextInput
			style={[styles.input, styles.textArea]}
			placeholder="Describe injury or situation..."
			multiline
			numberOfLines={4}
			value={description}
			onChangeText={setDescription}
			/>
		</View>

		<View>
			<Text style={styles.label}>
				Enter the current or last location of the injured animal. We automatically fetch your location, but you can edit it if needed.
			</Text>
			<TextInput
			style={[styles.input, styles.textArea]}
			placeholder="Enter current or last location..."
			multiline
			numberOfLines={4}
			value={locationText}
			onChangeText={setLocationText}
			/>
		</View>

		{/* Location Status Badge */}
		<View style={styles.locationBadge}>
			<Ionicons name="location" size={16} color={location ? "#059669" : "#DC2626"} />
			<Text style={[styles.locationText, { color: location ? "#059669" : "#DC2626" }]}>
			{location ? "Location Captured" : "Fetching Location..."}
			</Text>
		</View>

		{/* Submit Button */}
		<TouchableOpacity 
			style={[styles.submitBtn, loading && { backgroundColor: '#9CA3AF' }]} 
			onPress={handleSubmit}
			disabled={loading}
		>
			{loading ? (
			<ActivityIndicator color="#FFF" />
			) : (
			<Text style={styles.submitText}>Submit Report</Text>
			)}
		</TouchableOpacity>
		</ScrollView>
	);
	}

	const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#FFF' },
	content: { padding: 20 },
	header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 25 },
	title: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#1A1C1E' },
	imagePicker: { height: 220, backgroundColor: '#F3F4F6', borderRadius: 20, overflow: 'hidden', marginBottom: 25, borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB' },
	previewImage: { width: '100%', height: '100%' },
	placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	placeholderText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
	inputGroup: { marginBottom: 20 },
	label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
	input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15, fontSize: 16 },
	textArea: { height: 120, textAlignVertical: 'top' },
	locationBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
	locationText: { marginLeft: 6, fontSize: 13, fontWeight: '500' },
	submitBtn: { backgroundColor: '#00F0D1', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 2 },
	submitText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});