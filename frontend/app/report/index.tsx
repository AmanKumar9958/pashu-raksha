import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { API_URL } from '../../constants';

export default function ReportFormScreen() {
	const router = useRouter();
	const { getToken } = useAuth();
	const [loading, setLoading] = useState(false);
	const [image, setImage] = useState<string | null>(null);
	const [imageBase64, setImageBase64] = useState<string | null>(null);
	const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
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
		quality: 0.6, // Compress for faster upload
		base64: true,
		});

		if (!result.canceled) {
		setImage(result.assets[0].uri);
		setImageBase64(result.assets[0].base64 || null);
		setImageMimeType(result.assets[0].mimeType || 'image/jpeg');
		}
	};

	// 3. Submit Report to Backend
	const handleSubmit = async () => {
		if (!image || !description || !animalType || !locationText) {
		Alert.alert('Missing Info', 'Please provide an image, animal type, description, and detailed location.');
		return;
		}

		if (!location?.coords) {
		Alert.alert('Location Missing', 'We could not capture your location. Please try again.');
		return;
		}

		if (!imageBase64) {
		Alert.alert('Image Missing', 'Please reselect the image to attach it.');
		return;
		}

		setLoading(true);
		try {
		const token = await getToken();
		if (!token) {
			Alert.alert('Not signed in', 'Please sign in again to submit a report.');
			return;
		}
		const data = {
			image: `data:${imageMimeType};base64,${imageBase64}`,
			description,
			animalType,
			locationText,
			category: 'Other',
			location: [location.coords.longitude, location.coords.latitude]
		};

		await axios.post(`${API_URL}/cases`, data, {
			headers: { Authorization: `Bearer ${token}` }
		});
			
			Alert.alert('Success', 'Report submitted! NGO notified.', [
				{ text: 'OK', onPress: () => router.back() }
			]);
		} catch (error: any) {
		console.error(error);
		const errorMsg = error.response?.data?.message || 'Something went wrong while submitting.';
		const errorDetail = error.response?.data?.error ? `\nDetails: ${error.response?.data?.error}` : '';
		Alert.alert('Error', errorMsg + errorDetail);
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