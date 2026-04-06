import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '../../constants';
import ScreenTransition from '../../components/ScreenTransition';

export default function CitizenCasesScreen() {
	const { user } = useUser();
	const { getToken } = useAuth();
	const [cases, setCases] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const fetchMyCases = useCallback(async () => {
		if (!user?.id) return;
		try {
			const token = await getToken();
			const res = await axios.get(`${API_URL}/cases/user/${user.id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setCases(res.data.data || []);
		} catch (err) {
			console.error('Error fetching citizen cases:', err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [user?.id, getToken]);

	useEffect(() => {
		fetchMyCases();
	}, [fetchMyCases]);

	const onRefresh = () => {
		setRefreshing(true);
		fetchMyCases();
	};

	const getStatusColor = (status: string) => {
		switch (status.toUpperCase()) {
			case 'PENDING': return '#F59E0B';
			case 'IN PROGRESS': return '#3B82F6';
			case 'RESOLVED': return '#10B981';
			case 'TRANSFERRED': return '#6366F1';
			default: return '#9CA3AF';
		}
	};

	const renderItem = ({ item }: { item: any }) => (
		<View style={styles.caseCard}>
			<Image source={{ uri: item.image }} style={styles.caseImage} />
			<View style={styles.caseDetails}>
				<View style={styles.headerRow}>
					<Text style={styles.animalType}>{item.animalType}</Text>
					<View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
						<Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
					</View>
				</View>
				<Text style={styles.description} numberOfLines={2}>{item.description}</Text>
				<View style={styles.footerRow}>
					<Ionicons name="location-outline" size={14} color="#6B7280" />
					<Text style={styles.location} numberOfLines={1}>{item.locationText || 'Location details'}</Text>
				</View>
				<View style={styles.dateRow}>
					<Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
				</View>
			</View>
		</View>
	);

	if (loading && !refreshing) {
		return (
			<ScreenTransition>
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#00F0D1" />
				</View>
			</ScreenTransition>
		);
	}

	return (
		<ScreenTransition>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>My Reported Cases</Text>
					<TouchableOpacity onPress={onRefresh}>
						<Ionicons name="refresh" size={24} color="#1A1C1E" />
					</TouchableOpacity>
				</View>

				<FlatList
					data={cases}
					keyExtractor={(item) => item._id}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00F0D1']} />
					}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Ionicons name="document-text-outline" size={60} color="#E5E7EB" />
							<Text style={styles.emptyText}>You haven't reported any cases yet.</Text>
						</View>
					}
				/>
			</View>
		</ScreenTransition>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F9FAFB' },
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
	title: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
	listContent: { padding: 15 },
	caseCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, flexDirection: 'row', padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
	caseImage: { width: 100, height: 100, borderRadius: 15 },
	caseDetails: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
	headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	animalType: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
	statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
	statusText: { fontSize: 11, fontWeight: 'bold' },
	description: { fontSize: 14, color: '#4B5563', marginVertical: 4 },
	footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
	location: { fontSize: 12, color: '#6B7280', marginLeft: 4, flex: 1 },
	dateRow: { marginTop: 4 },
	date: { fontSize: 11, color: '#9CA3AF' },
	emptyContainer: { alignItems: 'center', paddingTop: 100 },
	emptyText: { marginTop: 15, color: '#9CA3AF', fontSize: 16 },
});
