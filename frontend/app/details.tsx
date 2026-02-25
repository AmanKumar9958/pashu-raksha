import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as Location from 'expo-location';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { API_URL } from '@/constants';
import CustomModal from '@/components/CustomModal';

export default function DetailsScreen() {
  const router = useRouter();
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [role, setRole] = useState<'citizen' | 'NGO'>('citizen');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [ngoCoords, setNgoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingNgoLocation, setGettingNgoLocation] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'danger' | 'warning'>('warning');
  const modalConfirmRef = useRef<() => void>(() => setModalVisible(false));

  const showModal = useCallback((params: {
    title: string;
    message: string;
    type?: 'success' | 'danger' | 'warning';
    onConfirm?: () => void;
  }) => {
    setModalTitle(params.title);
    setModalMessage(params.message);
    setModalType(params.type ?? 'warning');
    modalConfirmRef.current = params.onConfirm ?? (() => setModalVisible(false));
    setModalVisible(true);
  }, []);

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!authLoaded || !userLoaded) return;

      if (!isSignedIn || !user?.id) {
        setCheckingProfile(false);
        router.replace('/');
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.get(`${API_URL}/users/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Agar profile already exists aur phone number hai, toh redirect karo
        if (response.data?.data?.phone) {
          const userRole = response.data?.data?.role === 'NGO' ? 'NGO' : 'citizen';
          if (userRole === 'NGO') {
            router.replace('/(ngo)/home');
          } else {
            router.replace('/(citizen)/home');
          }
          return;
        }
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          console.log('Profile check error:', error?.message);
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    checkExistingProfile();
  }, [authLoaded, isSignedIn, userLoaded, user?.id]);

  const requestNgoLocation = async () => {
    setGettingNgoLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showModal({
          type: 'warning',
          title: 'Permission needed',
          message: 'Please allow location access to set your NGO current location.',
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setNgoCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (error: any) {
      showModal({
        type: 'warning',
        title: 'Location error',
        message: error?.message || 'Could not get your current location',
      });
    } finally {
      setGettingNgoLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (phone.length !== 10) {
      showModal({
        type: 'warning',
        title: 'Incomplete details',
        message: 'Please enter a valid 10-digit phone number.',
      });
      return;
    }

    if (role === 'NGO') {
      if (!address.trim() || !ngoCoords) {
        showModal({
          type: 'warning',
          title: 'NGO Details Missing',
          message: 'NGOs must provide address and GPS location.',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const token = await getToken({ skipCache: true });
      const payload = {
        clerkId: user?.id,
        name: user?.fullName,
        email: user?.primaryEmailAddress?.emailAddress,
        phone,
        role,
        ...(role === 'NGO' && {
          location: {
            type: 'Point',
            coordinates: [ngoCoords?.longitude, ngoCoords?.latitude]
          },
          ngoDetails: { address: address.trim(), isVerified: false }
        })
      };

      const response = await axios.post(`${API_URL}/users/sync`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showModal({
          type: 'success',
          title: 'Success',
          message: 'Welcome to Pashu Raksha! 🐾',
          onConfirm: () => {
            if (role === 'NGO') {
              router.replace('/(ngo)/home');
            } else {
              router.replace('/(citizen)/home');
            }
          },
        });
      }
    } catch (error: any) {
      showModal({
        type: 'warning',
        title: 'Could not save',
        message: error.response?.data?.message || 'Error saving details',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00F0D1" />
      </View>
    );
  }

  return (
    <>
      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onCancel={() => setModalVisible(false)}
        onConfirm={() => {
          setModalVisible(false);
          modalConfirmRef.current?.();
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Final Steps 🐾</Text>
        <Text style={styles.subHeader}>Confirm your role and phone to continue.</Text>

        <View style={styles.roleBox}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'citizen' && styles.activeRole]} 
            onPress={() => setRole('citizen')}
          >
            <Text style={[styles.roleText, role === 'citizen' && styles.activeText]}>Citizen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'NGO' && styles.activeRole]} 
            onPress={() => setRole('NGO')}
          >
            <Text style={[styles.roleText, role === 'NGO' && styles.activeText]}>NGO</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={[styles.input, { color: '#9CA3AF' }]} value={user?.fullName || ''} editable={false} />
        <TextInput style={[styles.input, { color: '#9CA3AF' }]} value={user?.primaryEmailAddress?.emailAddress || ''} editable={false} />

        <TextInput 
          style={styles.input} 
          placeholder="Phone Number" 
          keyboardType="phone-pad" 
          maxLength={10} 
          onChangeText={setPhone} 
          placeholderTextColor="#9CA3AF"
        />

        {role === 'NGO' && (
          <>
            <TextInput 
              style={styles.input} 
              placeholder="Shelter/Office Address" 
              multiline 
              onChangeText={setAddress}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.locationBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>GPS Location</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  {ngoCoords ? `${ngoCoords.latitude.toFixed(4)}, ${ngoCoords.longitude.toFixed(4)}` : 'Required for NGOs'}
                </Text>
              </View>
              <TouchableOpacity style={styles.locationBtn} onPress={requestNgoLocation}>
                {gettingNgoLocation ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.locationBtnText}>Share</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Confirm & Finish</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, flexGrow: 1, backgroundColor: '#fff', justifyContent: 'center' },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1A1C1E' },
  subHeader: { color: '#666', marginBottom: 30, marginTop: 5 },
  roleBox: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  roleBtn: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', backgroundColor: '#F9FAFB' },
  activeRole: { backgroundColor: '#00F0D1', borderColor: '#00F0D1' },
  roleText: { fontWeight: '600', color: '#9CA3AF' },
  activeText: { color: '#000' },
  input: { backgroundColor: '#F9FAFB', padding: 18, borderRadius: 20, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  locationTitle: { fontWeight: 'bold', color: '#1A1C1E' },
  locationBtn: { backgroundColor: '#00F0D1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15 },
  locationBtnText: { fontWeight: 'bold', fontSize: 13 },
  submitBtn: { backgroundColor: '#00F0D1', padding: 20, borderRadius: 25, alignItems: 'center', marginTop: 20, shadowColor: '#00F0D1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { fontWeight: 'bold', fontSize: 18 }
});