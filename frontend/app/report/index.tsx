import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { API_URL } from '../../constants';

const COMMON_ANIMALS = ['Dog', 'Cat', 'Cow', 'Horse', 'Buffalo', 'Goat', 'Monkey', 'Bird', 'Donkey', 'Other'];

const COMMON_CONDITIONS = [
	'Injured / Bleeding',
	'Hit by vehicle',
	'Stuck / Trapped',
	'Starving / Dehydrated',
	'Sick / Diseased',
	'Abused / Beaten',
	'Abandoned',
	'Pregnant & in distress',
	'Other',
];

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
	const [customAnimal, setCustomAnimal] = useState('');
	const [selectedCondition, setSelectedCondition] = useState('');
	const [customCondition, setCustomCondition] = useState('');
	const [locationText, setLocationText] = useState('');
	const [showConditionModal, setShowConditionModal] = useState(false);

	// Derive final values
	const finalAnimalType = animalType === 'Other' ? customAnimal : animalType;
	const finalDescription = selectedCondition === 'Other'
		? customCondition
		: selectedCondition
			? `${selectedCondition}${description ? '. ' + description : ''}`
			: description;

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
		quality: 0.6,
		base64: true,
		});

		if (!result.canceled) {
		setImage(result.assets[0].uri);
		setImageBase64(result.assets[0].base64 || null);
		setImageMimeType(result.assets[0].mimeType || 'image/jpeg');
		}
	};

	// 2b. Capture Image from Camera
	const captureImage = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission needed', 'Camera access is required to take a photo.');
			return;
		}

		let result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.6,
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
		if (!image || !finalDescription || !finalAnimalType || !locationText) {
		Alert.alert('Missing Info', 'Please provide an image, animal type, condition, and location.');
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
			description: finalDescription,
			animalType: finalAnimalType,
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
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
		>
		<ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
		<View style={styles.header}>
			<TouchableOpacity onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={24} color="#1A1C1E" />
			</TouchableOpacity>
			<Text style={styles.title}>Report Incident</Text>
		</View>

		{/* Image Upload Area — Preview or Placeholder */}
		{image ? (
			<View style={styles.imagePreviewContainer}>
				<Image source={{ uri: image }} style={styles.previewImage} />
				<TouchableOpacity style={styles.removeImageBtn} onPress={() => { setImage(null); setImageBase64(null); }}>
					<Ionicons name="close-circle" size={28} color="#EF4444" />
				</TouchableOpacity>
			</View>
		) : (
			<View style={styles.imageButtonsRow}>
				<TouchableOpacity style={styles.imageOptionBtn} onPress={captureImage}>
					<View style={styles.imageOptionInner}>
						<Ionicons name="camera" size={30} color="#10B981" />
						<Text style={styles.imageOptionText}>Take Photo</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.imageOptionBtn} onPress={pickImage}>
					<View style={styles.imageOptionInner}>
						<Ionicons name="images" size={30} color="#6366F1" />
						<Text style={styles.imageOptionText}>Gallery</Text>
					</View>
				</TouchableOpacity>
			</View>
		)}

		{/* Animal Type — Chips */}
		<View style={styles.inputGroup}>
			<Text style={styles.label}>What animal is it?</Text>
			<View style={styles.chipsContainer}>
				{COMMON_ANIMALS.map((animal) => (
					<TouchableOpacity
						key={animal}
						style={[styles.chip, animalType === animal && styles.chipSelected]}
						onPress={() => { setAnimalType(animal); if (animal !== 'Other') setCustomAnimal(''); }}
					>
						<Text style={[styles.chipText, animalType === animal && styles.chipTextSelected]}>{animal}</Text>
					</TouchableOpacity>
				))}
			</View>
			{animalType === 'Other' && (
				<TextInput
					style={[styles.input, { marginTop: 10 }]}
					placeholder="Type animal name..."
					value={customAnimal}
					onChangeText={setCustomAnimal}
				/>
			)}
		</View>

		{/* Condition — Dropdown Selector */}
		<View style={styles.inputGroup}>
			<Text style={styles.label}>Condition of the animal</Text>
			<TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowConditionModal(true)}>
				<Text style={[styles.dropdownBtnText, !selectedCondition && { color: '#9CA3AF' }]}>
					{selectedCondition || 'Select condition...'}
				</Text>
				<Ionicons name="chevron-down" size={20} color="#6B7280" />
			</TouchableOpacity>
			{selectedCondition === 'Other' && (
				<TextInput
					style={[styles.input, { marginTop: 10 }]}
					placeholder="Describe the condition..."
					value={customCondition}
					onChangeText={setCustomCondition}
				/>
			)}
			{/* Extra notes */}
			{selectedCondition && selectedCondition !== 'Other' && (
				<TextInput
					style={[styles.input, styles.textAreaSmall, { marginTop: 10 }]}
					placeholder="Any additional details? (optional)"
					multiline
					numberOfLines={2}
					value={description}
					onChangeText={setDescription}
				/>
			)}
		</View>

		{/* Condition Modal */}
		<Modal visible={showConditionModal} transparent animationType="slide">
			<TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConditionModal(false)}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Select Condition</Text>
					<FlatList
						data={COMMON_CONDITIONS}
						keyExtractor={(item) => item}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={[styles.modalItem, selectedCondition === item && styles.modalItemSelected]}
								onPress={() => {
									setSelectedCondition(item);
									setShowConditionModal(false);
									if (item !== 'Other') setCustomCondition('');
								}}
							>
								<Text style={[styles.modalItemText, selectedCondition === item && styles.modalItemTextSelected]}>{item}</Text>
								{selectedCondition === item && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
							</TouchableOpacity>
						)}
					/>
				</View>
			</TouchableOpacity>
		</Modal>

		{/* Location — Crisp label */}
		<View style={styles.inputGroup}>
			<Text style={styles.label}>📍 Animal's location</Text>
			<Text style={styles.labelHint}>Landmark, street, or area name</Text>
			<TextInput
			style={[styles.input, styles.textAreaSmall]}
			placeholder="e.g. Near City Mall, MG Road"
			multiline
			numberOfLines={2}
			value={locationText}
			onChangeText={setLocationText}
			/>
		</View>

		{/* Location Status Badge */}
		<View style={styles.locationBadge}>
			<Ionicons name="location" size={16} color={location ? "#059669" : "#DC2626"} />
			<Text style={[styles.locationStatusText, { color: location ? "#059669" : "#DC2626" }]}>
			{location ? "GPS location captured ✓" : "Fetching GPS..."}
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
		</KeyboardAvoidingView>
	);
	}

	const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#FFF' },
	content: { padding: 20, paddingBottom: 40 },
	header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 25 },
	title: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#1A1C1E' },

	// Image buttons
	imagePreviewContainer: { height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 25, position: 'relative' },
	previewImage: { width: '100%', height: '100%' },
	removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFF', borderRadius: 14 },
	imageButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
	imageOptionBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', paddingVertical: 28 },
	imageOptionInner: { alignItems: 'center', gap: 8 },
	imageOptionText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },

	// Chips
	inputGroup: { marginBottom: 20 },
	label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
	labelHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 8, marginTop: -4 },
	chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
	chipSelected: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
	chipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
	chipTextSelected: { color: '#059669', fontWeight: '700' },

	// Dropdown
	dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15 },
	dropdownBtnText: { fontSize: 16, color: '#1A1C1E' },

	// Modal
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
	modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
	modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 16 },
	modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
	modalItemSelected: { backgroundColor: '#ECFDF5' },
	modalItemText: { fontSize: 16, color: '#374151' },
	modalItemTextSelected: { color: '#059669', fontWeight: '600' },

	// Input
	input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15, fontSize: 16 },
	textAreaSmall: { height: 70, textAlignVertical: 'top' },

	// Location badge
	locationBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
	locationStatusText: { marginLeft: 6, fontSize: 13, fontWeight: '500' },

	// Submit
	submitBtn: { backgroundColor: '#00F0D1', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 2 },
	submitText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});