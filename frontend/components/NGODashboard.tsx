import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '@/constants';

export default function NGODashboard() {
	const { user } = useUser();
	const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
	const router = useRouter();
	const [nearbyCases, setNearbyCases] = useState([]);
	const [loading, setLoading] = useState(true);
	const [acceptingId, setAcceptingId] = useState<string | null>(null);

	// Stats for NGO
	const stats = [
		{ label: 'Active', count: '12', icon: 'paw', color: '#FFF4E5' },
		{ label: 'Saved', count: '148', icon: 'heart', color: '#E1FBF2' },
	];

	useEffect(() => {
		fetchNearbyCases();
	}, []);

	const fetchNearbyCases = async () => {
		try {
		// In real app, we send NGO's current location to backend to get "nearby" cases
		const response = await axios.get(`${API_URL}/cases/nearby`); 
		setNearbyCases(response.data?.data || []);
		} catch (error) {
		console.error("NGO fetch error:", error);
		} finally {
		setLoading(false);
		}
	};

	const acceptNearbyCase = async (caseId: string) => {
		if (!isAuthLoaded) return;
		if (!isSignedIn) return;
		setAcceptingId(caseId);
		try {
			const token = await getToken({ skipCache: true });
			await axios.put(
				`${API_URL}/cases/${caseId}/accept`,
				{},
				{ headers: { Authorization: `Bearer ${token}` }, timeout: 12000 }
			);
			// Remove from nearby feed (since it's now assigned)
			setNearbyCases((prev: any[]) => prev.filter((c: any) => c?._id !== caseId));
			router.push('/(tabs)/cases');
		} catch (error: any) {
			const msg = error?.response?.data?.message || error?.message || 'Could not accept this case';
			console.error('Accept case error:', msg);
		} finally {
			setAcceptingId(null);
		}
	};

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
		{/* 1. Header Section */}
		<View style={styles.header}>
			<View style={styles.userInfo}>
			<Image source={{ uri: user?.imageUrl }} style={styles.profilePic} />
			<View style={{ marginLeft: 12 }}>
				<Text style={styles.welcomeText}>NGO Portal,</Text>
				<Text style={styles.userName}>{user?.firstName || 'Pashu Rakshak'} 🛡️</Text>
			</View>
			</View>
			<TouchableOpacity style={styles.notificationBtn}>
			<Ionicons name="notifications" size={24} color="#1A1C1E" />
			<View style={styles.dot} />
			</TouchableOpacity>
		</View>

		{/* 2. NGO Quick Stats */}
		<View style={styles.statsRow}>
			{stats.map((s, i) => (
			<View key={i} style={[styles.statCard, { backgroundColor: s.color }]}>
				<Ionicons name={s.icon as any} size={20} color="#1A1C1E" />
				<View style={{ marginLeft: 10 }}>
				<Text style={styles.statCount}>{s.count}</Text>
				<Text style={styles.statLabel}>{s.label}</Text>
				</View>
			</View>
			))}
		</View>

		{/* 3. Main Action: Map View Button */}
		<TouchableOpacity style={styles.mapBtn} onPress={() => router.push('/(tabs)/cases')}>
			<Ionicons name="map" size={22} color="black" style={{ marginRight: 10 }} />
			<Text style={styles.mapBtnText}>VIEW INCIDENT MAP</Text>
		</TouchableOpacity>

		{/* 4. Urgent Alerts Feed */}
		<View style={styles.sectionHeader}>
			<Text style={styles.sectionTitle}>Urgent Alerts Nearby</Text>
			<Text style={styles.liveTag}>● LIVE</Text>
		</View>

		{loading ? (
			<ActivityIndicator size="large" color="#00F0D1" style={{ marginTop: 20 }} />
		) : nearbyCases.length === 0 ? (
			<View style={styles.emptyState}>
			<Ionicons name="checkmark-circle-outline" size={50} color="#E1FBF2" />
			<Text style={styles.emptyText}>All animals safe in your area!</Text>
			</View>
		) : (
			nearbyCases.map((item: any) => (
			<TouchableOpacity key={item._id} style={styles.caseCard}>
				<Image source={{ uri: item.image || item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.caseImg} />
				<View style={styles.caseInfo}>
				<View style={styles.caseHeader}>
					<Text style={styles.caseTitle}>{item.category || item.animalType || 'Alert'}</Text>
					<Text style={styles.distanceText}>📍 2.4 km</Text>
				</View>
				<Text style={styles.caseDesc} numberOfLines={1}>{item.description}</Text>
				
				<View style={styles.caseFooter}>
					<Text style={styles.timeText}>Reported 5m ago</Text>
					<TouchableOpacity
						style={styles.acceptBtn}
						onPress={() => acceptNearbyCase(item._id)}
						disabled={acceptingId === item._id}
					>
						<Text style={styles.acceptBtnText}>{acceptingId === item._id ? '...' : 'Respond'}</Text>
					</TouchableOpacity>
				</View>
				</View>
			</TouchableOpacity>
			))
		)}
		</ScrollView>
	);
	}

	const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 },
	userInfo: { flexDirection: 'row', alignItems: 'center' },
	profilePic: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
	welcomeText: { color: '#666', fontSize: 14 },
	userName: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
	notificationBtn: { padding: 10, backgroundColor: '#F9FAFB', borderRadius: 20 },
	dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
	statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
	statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20 },
	statCount: { fontSize: 18, fontWeight: 'bold' },
	statLabel: { fontSize: 12, color: '#666' },
	mapBtn: { backgroundColor: '#00F0D1', padding: 20, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
	mapBtnText: { fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
	sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
	sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
	liveTag: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
	caseCard: { backgroundColor: '#fff', borderRadius: 25, padding: 12, marginBottom: 15, flexDirection: 'row', borderWidth: 1, borderColor: '#F3F4F6' },
	caseImg: { width: 80, height: 80, borderRadius: 20 },
	caseInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
	caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	caseTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
	distanceText: { fontSize: 12, color: '#00F0D1', fontWeight: 'bold' },
	caseDesc: { fontSize: 13, color: '#666', marginTop: 4 },
	caseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
	timeText: { fontSize: 11, color: '#9CA3AF' },
	acceptBtn: { backgroundColor: '#1A1C1E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
	acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
	emptyState: { alignItems: 'center', paddingVertical: 40 },
	emptyText: { marginTop: 10, color: '#9CA3AF' }
});