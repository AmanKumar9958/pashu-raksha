import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants';
import * as Location from 'expo-location';
import { useAuth, useUser } from '@clerk/clerk-expo';
import CustomModal from '@/components/CustomModal';

export default function DetailsScreen() {
    const router = useRouter();
    const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();

    const [role, setRole] = useState('citizen');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false); // Loading state added
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

            // If not signed in, go back to login
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

                if (response.data?.data?.phone) {
                    router.replace('/(tabs)');
                    return;
                }
            } catch (error: any) {
                // 404 means user not yet synced -> stay on details
                const status = error?.response?.status;
                if (status !== 404) {
                    console.log('Profile check error:', error?.response?.data || error?.message);
                }
            } finally {
                setCheckingProfile(false);
            }
        };

        checkExistingProfile();
    }, [authLoaded, getToken, isSignedIn, router, user?.id, userLoaded]);

    useEffect(() => {
        // If switching away from NGO role, clear any captured NGO location.
        if (role !== 'NGO') {
            setNgoCoords(null);
            setAddress('');
        }
    }, [role]);

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
        // Validation: Sirf Phone aur (NGO ke liye Address) check karo agar user already logged in hai
        if (phone.length !== 10) {
            showModal({
                type: 'warning',
                title: 'Incomplete details',
                message: 'Please enter a valid 10-digit phone number.',
            });
            return;
        }
        if (role === 'NGO') {
            if (!address.trim()) {
                showModal({
                    type: 'warning',
                    title: 'Incomplete details',
                    message: 'NGOs must provide a Shelter/Office address.',
                });
                return;
            }
            if (!ngoCoords) {
                showModal({
                    type: 'warning',
                    title: 'Location required',
                    message: 'Please share your current location (GPS) to continue.',
                });
                return;
            }
        }

        setLoading(true);
        try {
            // 1. Get Token
            const token = await getToken({skipCache: true}); // Fresh token for security

            // 2. Prepare Payload (Automatic data from Clerk)
            const payload = {
                clerkId: user?.id,
                name: user?.fullName, // Clerk se direct
                email: user?.primaryEmailAddress?.emailAddress, // Clerk se direct
                phone,
                role,
                ...(role === 'NGO' && {
                    location: ngoCoords
                        ? {
                            type: 'Point',
                            coordinates: [ngoCoords.longitude, ngoCoords.latitude]
                        }
                        : undefined,
                    ngoDetails: { address: address.trim(), isVerified: false }
                })
            };

            // 3. API Call with Bearer Token
            const response = await axios.post(`${API_URL}/users/sync`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                showModal({
                    type: 'success',
                    title: 'Success',
                    message: 'Welcome to Pashu Raksha! 🐾',
                    onConfirm: () => router.replace('/(tabs)'),
                });
            }
        } catch (error: any) {
            console.log("Sync Error:", error.response?.data || error.message);
            showModal({
                type: 'warning',
                title: 'Could not save',
                message: error.response?.data?.message || 'Could not save details',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        checkingProfile ? (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00F0D1" />
            </View>
        ) : (
        <>
        <CustomModal
            visible={modalVisible}
            title={modalTitle}
            message={modalMessage}
            type={modalType}
            onCancel={() => setModalVisible(false)}
            onConfirm={() => {
                setModalVisible(false);
                const fn = modalConfirmRef.current;
                modalConfirmRef.current = () => setModalVisible(false);
                fn?.();
            }}
        />

        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Final Steps 🐾</Text>
            <Text style={styles.subHeader}>Confirm your role and phone to continue.</Text>

            {/* Role Selection */}
            <View style={styles.roleBox}>
                <TouchableOpacity 
                    style={[styles.roleBtn, role === 'citizen' && styles.activeRole]} 
                    onPress={() => setRole('citizen')}
                >
                    <Text style={role === 'citizen' ? styles.activeText : styles.inactiveText}>Citizen</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleBtn, role === 'NGO' && styles.activeRole]} 
                    onPress={() => setRole('NGO')}
                >
                    <Text style={role === 'NGO' ? styles.activeText : styles.inactiveText}>NGO</Text>
                </TouchableOpacity>
            </View>

            {/* Read-only inputs (since data comes from Clerk) */}
            <TextInput style={[styles.input, { opacity: 0.6 }]} value={user?.fullName || ''} editable={false} placeholder="Name" />
            <TextInput style={[styles.input, { opacity: 0.6 }]} value={user?.primaryEmailAddress?.emailAddress || ''} editable={false} placeholder="Email" />

            {/* Interactive inputs */}
            <TextInput 
                style={styles.input} 
                placeholder="Phone Number" 
                keyboardType="phone-pad" 
                maxLength={10} 
                onChangeText={setPhone} 
            />

            {role === 'NGO' && (
                <>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Shelter/Office Address" 
                        multiline 
                        onChangeText={setAddress}
                        value={address}
                    />

                    <View style={styles.locationBox}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.locationTitle}>Current Location (GPS)</Text>
                            <Text style={styles.locationSub}>
                                {ngoCoords
                                    ? `${ngoCoords.latitude.toFixed(5)}, ${ngoCoords.longitude.toFixed(5)}`
                                    : 'Not shared yet'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.locationBtn, gettingNgoLocation && { opacity: 0.7 }]}
                            onPress={requestNgoLocation}
                            disabled={gettingNgoLocation}
                        >
                            {gettingNgoLocation ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.locationBtnText}>{ngoCoords ? 'Update' : 'Share'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <TouchableOpacity 
                style={[styles.submitBtn, loading && { backgroundColor: '#ccc' }]} 
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Confirm & Finish</Text>}
            </TouchableOpacity>
        </ScrollView>
        </>
        )
    );
}

const styles = StyleSheet.create({
    container: { padding: 25, flexGrow: 1, backgroundColor: '#fff', justifyContent: 'center' },
    header: { fontSize: 26, fontWeight: 'bold', color: '#1A1C1E' },
    subHeader: { color: '#666', marginBottom: 30 },
    roleBox: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    roleBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
    activeRole: { backgroundColor: '#00F0D1', borderColor: '#00F0D1' },
    activeText: { fontWeight: 'bold', color: '#000' },
    inactiveText: { color: '#666' },
    input: { backgroundColor: '#F5F7F9', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
    locationBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F7F9', padding: 14, borderRadius: 12, marginBottom: 15 },
    locationTitle: { fontWeight: 'bold', color: '#1A1C1E' },
    locationSub: { marginTop: 4, color: '#6B7280', fontSize: 13 },
    locationBtn: { backgroundColor: '#00F0D1', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: 84 },
    locationBtnText: { fontWeight: 'bold', color: '#000' },
    submitBtn: { backgroundColor: '#00F0D1', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, elevation: 3 },
    submitBtnText: { fontWeight: 'bold', fontSize: 18 }
});