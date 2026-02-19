import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
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
        <Text style={styles.cardTitle}>What happened?</Text>
        <Text style={styles.cardSub}>Choose a category and add a short description.</Text>

        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => {
            const active = c.value === category;
            return (
              <TouchableOpacity
                key={c.value}
                onPress={() => setCategory(c.value)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
              >
                <Ionicons name={c.icon} size={16} color={active ? '#000' : '#6B7280'} style={{ marginRight: 6 }} />
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.textArea}
          placeholder="Describe the animal’s condition, nearby landmarks, urgency..."
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={600}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>{description.length}/600</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photo</Text>
        <Text style={styles.cardSub}>
          Attach a clear photo. If Cloudinary isn’t configured, paste an image URL.
        </Text>

        <TouchableOpacity style={styles.imageBtn} onPress={pickImage} disabled={submitting || uploadingImage}>
          <Ionicons name="image-outline" size={20} color="#1A1C1E" style={{ marginRight: 8 }} />
          <Text style={styles.imageBtnText}>{pickedImageUri ? 'Change Photo' : 'Pick Photo'}</Text>
        </TouchableOpacity>

        {pickedImageUri ? (
          <Image source={{ uri: pickedImageUri }} style={styles.previewImg} />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Or paste image URL (https://...)"
          value={imageUrlInput}
          onChangeText={setImageUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={Platform.select({ ios: 'url', android: 'default' })}
        />

        {cloudinary ? (
          <Text style={styles.cloudHint}>Uploads enabled via Cloudinary.</Text>
        ) : (
          <Text style={styles.cloudHintMuted}>
            Uploads not configured. Set `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` and `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <Text style={styles.cardSub}>We use your current location to find nearby rescuers.</Text>

        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Shared coordinates</Text>
            <Text style={styles.locationValue} numberOfLines={1}>{coordText}</Text>
          </View>

          <TouchableOpacity
            style={styles.locationBtn}
            onPress={() => requestAndGetLocation().catch((e) => Alert.alert('Location', e?.message || 'Could not fetch location'))}
            disabled={gettingLocation || submitting}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.locationBtnText}>Use current</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.submitBtn, (submitting || uploadingImage) && { opacity: 0.6 }]} onPress={submit} disabled={submitting || uploadingImage}>
        {submitting || uploadingImage ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="alert-circle" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>REPORT EMERGENCY</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
    marginBottom: 18,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },

  card: { backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
  cardSub: { marginTop: 4, color: '#6B7280', fontSize: 13 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#fff' },
  categoryPillActive: { backgroundColor: '#00F0D1', borderColor: '#00F0D1' },
  categoryText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#000' },

  textArea: { marginTop: 12, backgroundColor: '#F5F7F9', borderRadius: 14, padding: 14, minHeight: 120, fontSize: 15 },
  hint: { marginTop: 8, color: '#9CA3AF', fontSize: 12, textAlign: 'right' },

  imageBtn: { marginTop: 12, backgroundColor: '#F9FAFB', padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  imageBtnText: { fontWeight: '700', color: '#1A1C1E' },
  previewImg: { width: '100%', height: 200, borderRadius: 16, marginTop: 12, backgroundColor: '#EEE' },
  input: { marginTop: 12, backgroundColor: '#F5F7F9', borderRadius: 14, padding: 14, fontSize: 14 },
  cloudHint: { marginTop: 10, color: '#10B981', fontSize: 12, fontWeight: '700' },
  cloudHintMuted: { marginTop: 10, color: '#9CA3AF', fontSize: 12 },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  locationLabel: { color: '#9CA3AF', fontSize: 12 },
  locationValue: { color: '#1A1C1E', fontWeight: '700', marginTop: 4 },
  locationBtn: { backgroundColor: '#00F0D1', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, minWidth: 110, alignItems: 'center' },
  locationBtnText: { fontWeight: '800', color: '#000' },

  submitBtn: { backgroundColor: '#00F0D1', borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitBtnText: { fontWeight: '900', fontSize: 15, color: '#000' },
});
