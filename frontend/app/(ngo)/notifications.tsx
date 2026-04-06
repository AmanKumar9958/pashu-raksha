import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants';
import ScreenTransition from '../../components/ScreenTransition';

export default function NgoNotificationsScreen() {
	const router = useRouter();
	const { getToken } = useAuth();
	const [notifications, setNotifications] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const fetchNotifications = useCallback(async () => {
		try {
			const token = await getToken();
			const res = await axios.get(`${API_URL}/notifications`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setNotifications(res.data.data || []);
		} catch (err) {
			console.error('Error fetching notifications:', err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [getToken]);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	const onRefresh = () => {
		setRefreshing(true);
		fetchNotifications();
	};

	const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
		let message = '';
		if (status === 'DECLINED') {
			// In a real app we might show an input, for now static
			message = 'Our shelter is currently at full capacity.';
		}

		try {
			const token = await getToken();
			await axios.put(`${API_URL}/notifications/${id}/respond`, {
				status,
				message
			}, { headers: { Authorization: `Bearer ${token}` } });
			
			Alert.alert(status === 'ACCEPTED' ? 'Case Accepted' : 'Request Declined', 
				status === 'ACCEPTED' ? 'The case has been added to your ongoing list.' : 'The transfer request was declined.');
			fetchNotifications();
		} catch (err) {
			Alert.alert('Error', 'Unable to process your request.');
		}
	};

	const renderItem = ({ item }: { item: any }) => (
		<View style={styles.notifCard}>
			<View style={styles.notifHeader}>
				<View style={styles.iconBox}>
					<Ionicons name="swap-horizontal" size={20} color="#00F0D1" />
				</View>
				<Text style={styles.notifType}>Case Transfer Request</Text>
				<Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
			</View>

			<View style={styles.caseInfo}>
				<Text style={styles.senderName}>{item.sender?.name} wants to transfer a case:</Text>
				<Text style={styles.caseDesc} numberOfLines={2}>"{item.caseId?.description}" ({item.caseId?.animalType})</Text>
				{item.message && <Text style={styles.senderMsg}>Message: {item.message}</Text>}
			</View>

			{item.status === 'PENDING' ? (
				<View style={styles.actionRow}>
					<TouchableOpacity 
						style={[styles.actionBtn, styles.declineBtn]} 
						onPress={() => handleRespond(item._id, 'DECLINED')}
					>
						<Text style={styles.declineText}>Decline</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={[styles.actionBtn, styles.acceptBtn]} 
						onPress={() => handleRespond(item._id, 'ACCEPTED')}
					>
						<Text style={styles.acceptText}>Accept</Text>
					</TouchableOpacity>
				</View>
			) : (
				<View style={styles.statusRow}>
					<Text style={[styles.statusText, { color: item.status === 'ACCEPTED' ? '#10B981' : '#EF4444' }]}>
						{item.status === 'ACCEPTED' ? 'ACCEPTED' : 'DECLINED'}
					</Text>
				</View>
			)}
		</View>
	);

	return (
		<ScreenTransition>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color="#1A1C1E" />
					</TouchableOpacity>
					<Text style={styles.title}>Notifications</Text>
					<TouchableOpacity onPress={onRefresh}>
						<Ionicons name="refresh" size={20} color="#00F0D1" />
					</TouchableOpacity>
				</View>

				<FlatList
					data={notifications}
					keyExtractor={(item) => item._id}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00F0D1']} />}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Ionicons name="notifications-off-outline" size={60} color="#E5E7EB" />
							<Text style={styles.emptyText}>No new notifications.</Text>
						</View>
					}
				/>
			</View>
		</ScreenTransition>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F9FAFB' },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF' },
	title: { fontSize: 20, fontWeight: 'bold', flex: 1, marginLeft: 15 },
	listContent: { padding: 15 },
	notifCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 2 },
	notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
	iconBox: { width: 32, height: 32, backgroundColor: '#E1FBF2', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
	notifType: { marginLeft: 10, fontSize: 13, fontWeight: 'bold', color: '#6B7280', flex: 1 },
	time: { fontSize: 11, color: '#9CA3AF' },
	caseInfo: { marginBottom: 15 },
	senderName: { fontSize: 14, fontWeight: '600', color: '#1A1C1E' },
	caseDesc: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginTop: 4 },
	senderMsg: { fontSize: 12, color: '#9CA3AF', marginTop: 6, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
	actionRow: { flexDirection: 'row', gap: 12 },
	actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
	declineBtn: { borderColor: '#EF4444' },
	acceptBtn: { backgroundColor: '#00F0D1', borderColor: '#00F0D1' },
	declineText: { color: '#EF4444', fontWeight: 'bold' },
	acceptText: { color: '#1A1C1E', fontWeight: 'bold' },
	statusRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, alignItems: 'center' },
	statusText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
	emptyContainer: { alignItems: 'center', paddingTop: 100 },
	emptyText: { marginTop: 15, color: '#9CA3AF', fontSize: 16 }
});
