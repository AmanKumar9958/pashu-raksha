import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { API_URL } from '@/constants';

type Category = 'Injured' | 'Sick' | 'Accident' | 'Other';
type Coords = { latitude: number; longitude: number };

const CATEGORIES: { label: string; value: Category; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Injured', value: 'Injured', icon: 'medkit-outline' },
  { label: 'Sick', value: 'Sick', icon: 'bandage-outline' },
  { label: 'Accident', value: 'Accident', icon: 'car-outline' },
  { label: 'Other', value: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

function guessMimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function uploadToCloudinary(params: {
  cloudName: string;
  uploadPreset: string;
  uri: string;
}): Promise<string> {
  const { cloudName, uploadPreset, uri } = params;

  const form = new FormData();
  form.append('upload_preset', uploadPreset);

  const file: any = {
    uri,
    name: `report_${Date.now()}.jpg`,
    type: guessMimeTypeFromUri(uri),
  };
  form.append('file', file);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const data = await response.json();
  if (!response.ok) {
    const msg = typeof data?.error?.message === 'string' ? data.error.message : 'Image upload failed';
    throw new Error(msg);
  }

  const url = data?.secure_url || data?.url;
  if (!url) throw new Error('Cloudinary did not return an image URL');
  return url;
}

export default function ReportScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();

  const [category, setCategory] = useState<Category>('Other');
  const [description, setDescription] = useState('');

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const cloudinary = useMemo(() => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;
    return { cloudName, uploadPreset };
  }, []);

  const requestAndGetLocation = async (): Promise<Coords> => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(next);
      return next;
    } finally {
      setGettingLocation(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setPickedImageUri(uri);
  };

  const resolveImageUrl = async (): Promise<string> => {
    const trimmed = imageUrlInput.trim();
    if (trimmed.length > 0) {
      if (!/^https?:\/\//i.test(trimmed)) throw new Error('Image URL must start with http(s)');
      return trimmed;
    }

    if (!pickedImageUri) {
      throw new Error('Please attach an image or paste an image URL');
    }

    if (!cloudinary) {
      throw new Error(
        'Image upload is not configured. Either paste an image URL, or set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.'
      );
    }

    setUploadingImage(true);
    try {
      return await uploadToCloudinary({
        cloudName: cloudinary.cloudName,
        uploadPreset: cloudinary.uploadPreset,
        uri: pickedImageUri,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = async () => {
    if (!isAuthLoaded) return;
    if (!isSignedIn || !user?.id) {
      Alert.alert('Sign in required', 'Please sign in to report an emergency.');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Add details', 'Please describe the situation (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken({ skipCache: true });

      // Ensure user exists in Mongo (created via /users/sync)
      let reporterMongoId: string | null = null;
      try {
        const profileRes = await axios.get(`${API_URL}/users/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        reporterMongoId = profileRes.data?.data?._id || null;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          Alert.alert('Complete your profile', 'Please add your phone number first.', [
            { text: 'Go to Details', onPress: () => router.push('/details' as any) },
            { text: 'Cancel', style: 'cancel' },
          ]);
          return;
        }
        throw err;
      }

      if (!reporterMongoId) throw new Error('Could not find your user profile in the database');

      const loc = coords ?? (await requestAndGetLocation());
      const imageUrl = await resolveImageUrl();

      const payload = {
        reporterID: reporterMongoId,
        image: imageUrl,
        description: description.trim(),
        category,
        location: [loc.longitude, loc.latitude],
      };

      const res = await axios.post(`${API_URL}/cases`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to submit report');
      }

      Alert.alert('Reported', 'Your emergency report has been submitted. NGOs nearby can now respond.');
      router.back();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong';
      Alert.alert('Could not report', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const coordText = coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Not shared yet';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color="#1A1C1E" />
        </TouchableOpacity>
        <Text style={styles.title}>Report Emergency</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.categoryPill, category === c.value && styles.categoryPillActive]}
              onPress={() => setCategory(c.value)}
            >
              <Ionicons name={c.icon} size={18} color={category === c.value ? '#000' : '#666'} />
              <Text style={[styles.categoryText, category === c.value && styles.categoryTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Description</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Describe what you saw…"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Location</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>{coordText}</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={requestAndGetLocation} disabled={gettingLocation}>
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.smallBtnText}>Use current</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Photo</Text>
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Ionicons name="image-outline" size={18} color="#000" />
          <Text style={styles.imageBtnText}>{pickedImageUri ? 'Change selected image' : 'Pick an image'}</Text>
        </TouchableOpacity>

        <Text style={[styles.muted, { marginTop: 10, marginBottom: 6 }]}>Or paste image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={imageUrlInput}
          onChangeText={setImageUrlInput}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting || uploadingImage}>
          {(submitting || uploadingImage) ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.submitText}>Submit report</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 55, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F7F9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  card: { paddingHorizontal: 18, paddingTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1C1E' },
  muted: { color: '#6B7280', fontSize: 13 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#fff' },
  categoryPillActive: { backgroundColor: '#00F0D1', borderColor: '#00F0D1' },
  categoryText: { color: '#666', fontWeight: '700', fontSize: 13 },
  categoryTextActive: { color: '#000' },
  textarea: { marginTop: 10, minHeight: 110, borderRadius: 16, backgroundColor: '#F5F7F9', padding: 14, textAlignVertical: 'top' },
  rowBetween: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#00F0D1', borderRadius: 14 },
  smallBtnText: { fontWeight: '800', color: '#000' },
  imageBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 16, backgroundColor: '#F5F7F9' },
  imageBtnText: { fontWeight: '700', color: '#000' },
  input: { borderRadius: 16, backgroundColor: '#F5F7F9', padding: 14 },
  submitBtn: { marginTop: 20, backgroundColor: '#00F0D1', padding: 16, borderRadius: 18, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '900', color: '#000' },
});
