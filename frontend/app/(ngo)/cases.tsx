import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '../../constants';
import ScreenTransition from '../../components/ScreenTransition';

export default function NgoCasesScreen() {
	const { user } = useUser();
	const { getToken } = useAuth();
	const [cases, setCases] = useState<any[]>([]);
	const [ngos, setNgos] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [transferModalVisible, setTransferModalVisible] = useState(false);
	const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!user?.id) return;
		try {
			const token = await getToken();
			const [casesRes, ngosRes] = await Promise.all([
				axios.get(`${API_URL}/cases/ngo/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
				axios.get(`${API_URL}/ngos/all`, { headers: { Authorization: `Bearer ${token}` } })
			]);
			setCases(casesRes.data.data || []);
			// Filter out self from transfer list
			setNgos((ngosRes.data.data || []).filter((n: any) => n.clerkId !== user.id));
		} catch (err) {
			console.error('Error fetching NGO data:', err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [user?.id, getToken]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const onRefresh = () => {
		setRefreshing(true);
		fetchData();
	};

	const handleResolve = async (id: string) => {
		Alert.alert('Resolve Case', 'Confirm that the animal has been rescued and treated?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Confirm',
				onPress: async () => {
					try {
						const token = await getToken();
						await axios.put(`${API_URL}/cases/${id}/resolve`, {}, {
							headers: { Authorization: `Bearer ${token}` }
						});
						Alert.alert('Success', 'Case marked as resolved!');
						fetchData();
					} catch (err) {
						Alert.alert('Error', 'Failed to resolve case');
					}
				}
			}
		]);
	};

	const handleTransferInitiate = (caseId: string) => {
		setSelectedCaseId(caseId);
		setTransferModalVisible(true);
	};

	const sendTransferRequest = async (targetNgoId: string) => {
		if (!selectedCaseId) return;
		try {
			const token = await getToken();
			await axios.post(`${API_URL}/notifications/transfer`, {
				receiverId: targetNgoId,
				caseId: selectedCaseId,
				message: 'Requesting case transfer due to capacity/location.'
			}, { headers: { Authorization: `Bearer ${token}` } });
			
			Alert.alert('Request Sent', 'Transfer request has been sent to the NGO. Status will change once they accept.');
			setTransferModalVisible(false);
		} catch (err) {
			Alert.alert('Error', 'Failed to send transfer request');
		}
	};

	const renderItem = ({ item }: { item: any }) => (
		<View style={styles.caseCard}>
			<Image source={{ uri: item.image }} style={styles.caseImage} />
			<View style={styles.caseDetails}>
				<View style={styles.headerRow}>
					<Text style={styles.animalType}>{item.animalType}</Text>
					<View style={styles.statusBadge}>
						<Text style={styles.statusText}>{item.status}</Text>
					</View>
				</View>
				<Text style={styles.description} numberOfLines={1}>{item.description}</Text>
				<View style={styles.actionRow}>
					<TouchableOpacity style={[styles.btn, styles.resolveBtn]} onPress={() => handleResolve(item._id)}>
						<Text style={styles.btnText}>Resolve</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.btn, styles.transferBtn]} onPress={() => handleTransferInitiate(item._id)}>
						<Text style={styles.btnText}>Transfer</Text>
					</TouchableOpacity>
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
					<Text style={styles.title}>Ongoing Rescues</Text>
					<TouchableOpacity onPress={onRefresh}>
						<Ionicons name="refresh" size={24} color="#1A1C1E" />
					</TouchableOpacity>
				</View>

				<FlatList
					data={cases}
					keyExtractor={(item) => item._id}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00F0D1']} />}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Ionicons name="paw-outline" size={60} color="#E5E7EB" />
							<Text style={styles.emptyText}>No active cases assigned to you.</Text>
						</View>
					}
				/>

				{/* Transfer NGO Selection Modal */}
				<Modal visible={transferModalVisible} animationType="slide" transparent>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<View style={styles.modalHeader}>
								<Text style={styles.modalTitle}>Select NGO to Transfer</Text>
								<TouchableOpacity onPress={() => setTransferModalVisible(false)}>
									<Ionicons name="close" size={24} color="#000" />
								</TouchableOpacity>
							</View>
							<ScrollView style={styles.ngoList}>
								{ngos.map((ngo) => (
									<TouchableOpacity key={ngo._id} style={styles.ngoCard} onPress={() => sendTransferRequest(ngo._id)}>
										<View style={styles.ngoInfo}>
											<Text style={styles.ngoName}>{ngo.name}</Text>
											<Text style={styles.ngoLoc}><Ionicons name="location" size={12}/> {ngo.ngoDetails?.address || 'Verified'}</Text>
										</View>
										<View style={styles.ngoStats}>
											<View style={styles.statLine}>
												<Text style={styles.statVal}>{ngo.stats?.solved}</Text>
												<Text style={styles.statLab}>Solved</Text>
											</View>
											<View style={styles.statLine}>
												<Text style={styles.statVal}>{ngo.stats?.transferred}</Text>
												<Text style={styles.statLab}>X-fer</Text>
											</View>
										</View>
									</TouchableOpacity>
								))}
							</ScrollView>
						</View>
					</View>
				</Modal>
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
	caseCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, flexDirection: 'row', padding: 12, elevation: 2 },
	caseImage: { width: 90, height: 90, borderRadius: 15 },
	caseDetails: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
	headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	animalType: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
	statusBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
	statusText: { fontSize: 10, color: '#0369A1', fontWeight: 'bold' },
	description: { fontSize: 13, color: '#6B7280' },
	actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
	btn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
	resolveBtn: { backgroundColor: '#00F0D1' },
	transferBtn: { backgroundColor: '#F3F4F6' },
	btnText: { fontSize: 12, fontWeight: 'bold', color: '#1A1C1E' },
	emptyContainer: { alignItems: 'center', paddingTop: 100 },
	emptyText: { marginTop: 15, color: '#9CA3AF', fontSize: 16 },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '70%', padding: 20 },
	modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
	modalTitle: { fontSize: 20, fontWeight: 'bold' },
	ngoList: { flex: 1 },
	ngoCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#F9FAFB', borderRadius: 15, marginBottom: 10 },
	ngoInfo: { flex: 1 },
	ngoName: { fontSize: 16, fontWeight: 'bold' },
	ngoLoc: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
	ngoStats: { flexDirection: 'row', gap: 15, alignItems: 'center' },
	statLine: { alignItems: 'center' },
	statVal: { fontSize: 14, fontWeight: 'bold' },
	statLab: { fontSize: 9, color: '#9CA3AF' }
});
