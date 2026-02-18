import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants';
import * as Location from 'expo-location';
import { useAuth, useUser } from '@clerk/clerk-expo';

export default function DetailsScreen() {
    const router = useRouter();
    const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();

    const [role, setRole] = useState('citizen');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false); // Loading state added
    const [checkingProfile, setCheckingProfile] = useState(true);

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

    const handleSubmit = async () => {
        // Validation: Sirf Phone aur (NGO ke liye Address) check karo agar user already logged in hai
        if (phone.length !== 10) {
            return Alert.alert("Error", "Please enter a valid 10-digit phone number");
        }
        if (role === 'NGO' && !address) {
            return Alert.alert("Error", "NGOs must provide an office address");
        }

        setLoading(true);
        try {
            // 1. Get Token & Permission
            const token = await getToken({skipCache: true}); // Fresh token for security
            let { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setLoading(false);
                return Alert.alert("Permission Denied", "Location is needed to map nearby rescues.");
            }

            // 2. Fetch Location
            let userLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = userLocation.coords;

            // 3. Prepare Payload (Automatic data from Clerk)
            const payload = {
                clerkId: user?.id,
                name: user?.fullName, // Clerk se direct
                email: user?.primaryEmailAddress?.emailAddress, // Clerk se direct
                phone,
                role,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude] // GeoJSON format
                },
                ...(role === 'NGO' && {
                    ngoDetails: { address, isVerified: false }
                })
            };

            // 4. API Call with Bearer Token
            const response = await axios.post(`${API_URL}/users/sync`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                Alert.alert("Success", "Welcome to Pashu Raksha! 🐾");
                router.replace('/(tabs)'); 
            }
        } catch (error: any) {
            console.log("Sync Error:", error.response?.data || error.message);
            Alert.alert("Error", error.response?.data?.message || "Could not save details");
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
                <TextInput 
                    style={styles.input} 
                    placeholder="NGO Office Address" 
                    multiline 
                    onChangeText={setAddress}
                />
            )}

            <TouchableOpacity 
                style={[styles.submitBtn, loading && { backgroundColor: '#ccc' }]} 
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Confirm & Finish</Text>}
            </TouchableOpacity>
        </ScrollView>
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
    submitBtn: { backgroundColor: '#00F0D1', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, elevation: 3 },
    submitBtnText: { fontWeight: 'bold', fontSize: 18 }
});