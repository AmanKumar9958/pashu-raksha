import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Linking, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '../../constants';
import ScreenTransition from '../../components/ScreenTransition';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NgoCasesScreen() {
	const { user } = useUser();
	const { getToken } = useAuth();
	const [ongoingCases, setOngoingCases] = useState<any[]>([]);
	const [completedCases, setCompletedCases] = useState<any[]>([]);
	const [ngos, setNgos] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [transferModalVisible, setTransferModalVisible] = useState(false);
	const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
	const [historyExpanded, setHistoryExpanded] = useState(false);
	
	// Detail Modal State
	const [detailModalVisible, setDetailModalVisible] = useState(false);
	const [selectedCase, setSelectedCase] = useState<any>(null);

	const fetchData = useCallback(async () => {
		if (!user?.id) return;
		try {
			const token = await getToken();
			// Fetch scope=all to get resolved cases too
			const [casesRes, ngosRes] = await Promise.all([
				axios.get(`${API_URL}/cases/ngo/${user.id}?scope=all`, { headers: { Authorization: `Bearer ${token}` } }),
				axios.get(`${API_URL}/ngos/all`, { headers: { Authorization: `Bearer ${token}` } })
			]);
			
			const allCases = casesRes.data.data || [];
			setOngoingCases(allCases.filter((c: any) => c.status === 'PENDING' || c.status === 'IN PROGRESS'));
			setCompletedCases(allCases.filter((c: any) => c.status === 'RESOLVED'));
			
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

	const toggleHistory = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setHistoryExpanded(!historyExpanded);
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

	const renderOngoingItem = ({ item }: { item: any }) => (
		<TouchableOpacity 
			style={styles.caseCard}
			onPress={() => {
				setSelectedCase(item);
				setDetailModalVisible(true);
			}}
		>
			<Image source={{ uri: item.image }} style={styles.caseImage} />
			<View style={styles.caseDetails}>
				<View style={styles.headerRow}>
					<Text style={styles.animalType}>{item.animalType}</Text>
					<View style={[styles.statusBadge, item.status === 'PENDING' ? styles.pendingBadge : styles.progressBadge]}>
						<Text style={styles.statusText}>{item.status}</Text>
					</View>
				</View>
				<Text style={styles.description} numberOfLines={1}>{item.description}</Text>
				<View style={styles.actionRow}>
					<TouchableOpacity 
						style={[styles.btn, styles.resolveBtn]} 
						onPress={(e) => {
							e.stopPropagation();
							handleResolve(item._id);
						}}
					>
						<Text style={styles.btnText}>Resolve</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={[styles.btn, styles.transferBtn]} 
						onPress={(e) => {
							e.stopPropagation();
							handleTransferInitiate(item._id);
						}}
					>
						<Text style={styles.btnText}>Transfer</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	);

	const renderCompletedItem = (item: any) => (
		<View key={item._id} style={styles.completedCard}>
			<View style={styles.completedInfo}>
				<View style={styles.completedHeader}>
					<Text style={styles.completedTitle}>{item.animalType}</Text>
					<Ionicons name="checkmark-circle" size={20} color="#059669" />
				</View>
				<Text style={styles.completedDesc} numberOfLines={1}>{item.description}</Text>
				<View style={styles.dateRow}>
					<View style={styles.dateItem}>
						<Ionicons name="time-outline" size={12} color="#9CA3AF" />
						<Text style={styles.dateText}>Acc: {item?.acceptedAt ? new Date(item.acceptedAt).toLocaleDateString() : (item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A')}</Text>
					</View>
					<View style={styles.dateItem}>
						<Ionicons name="calendar-outline" size={12} color="#059669" />
						<Text style={[styles.dateText, {color: '#059669'}]}>Res: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : new Date(item.updatedAt).toLocaleDateString()}</Text>
					</View>
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
					<Text style={styles.title}>NGO Case Center</Text>
					<TouchableOpacity onPress={onRefresh}>
						<Ionicons name="refresh" size={24} color="#1A1C1E" />
					</TouchableOpacity>
				</View>

				<ScrollView 
					style={{ flex: 1 }} 
					contentContainerStyle={styles.scrollContent}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00F0D1']} />}
				>
					{/* Ongoing Section */}
					<Text style={styles.sectionHeader}>Active Rescues ({ongoingCases.length})</Text>
					{ongoingCases.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Ionicons name="paw-outline" size={60} color="#E5E7EB" />
							<Text style={styles.emptyText}>No active cases assigned.</Text>
						</View>
					) : (
						ongoingCases.map((item) => renderOngoingItem({ item }))
					)}

					{/* History Accordion */}
					<View style={styles.historyContainer}>
						<TouchableOpacity style={styles.historyHeader} onPress={toggleHistory}>
							<View style={styles.historyTitleRow}>
								<Ionicons name="archive-outline" size={20} color="#1A1C1E" />
								<Text style={styles.historyTitle}>Completed History ({completedCases.length})</Text>
							</View>
							<Ionicons name={historyExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
						</TouchableOpacity>

						{historyExpanded && (
							<View style={styles.historyBody}>
								{completedCases.length === 0 ? (
									<Text style={styles.noHistoryText}>No completed cases yet.</Text>
								) : (
									completedCases.map(renderCompletedItem)
								)}
							</View>
						)}
					</View>
				</ScrollView>

				{/* Case Details Modal */}
				<Modal
					animationType="slide"
					transparent={true}
					visible={detailModalVisible}
					onRequestClose={() => setDetailModalVisible(false)}
				>
					<Pressable 
						style={styles.detailModalOverlay} 
						onPress={() => setDetailModalVisible(false)}
					>
						<Pressable 
							style={styles.detailModalBody}
							onPress={(e) => e.stopPropagation()}
						>
							<View style={styles.modalHandle} />
							
							<ScrollView showsVerticalScrollIndicator={false}>
								<Image source={{ uri: selectedCase?.image }} style={styles.detailModalImage} />
								<View style={styles.detailModalContent}>
									<View style={styles.detailModalHeader}>
										<View>
											<Text style={styles.detailModalTitle}>{selectedCase?.animalType}</Text>
											<Text style={styles.detailModalSubtitle}>{selectedCase?.category} Case</Text>
										</View>
										<TouchableOpacity 
											style={styles.directionCircle}
											onPress={() => {
												const lat = selectedCase?.location?.coordinates[1];
												const lng = selectedCase?.location?.coordinates[0];
												if (lat && lng) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
											}}
										>
											<Ionicons name="navigate" size={24} color="#FFF" />
										</TouchableOpacity>
									</View>

									<View style={styles.detailGrid}>
										<View style={styles.detailItem}>
											<Ionicons name="calendar-outline" size={18} color="#00F0D1" />
											<View style={{ marginLeft: 10 }}>
												<Text style={styles.detailLabel}>Posted On</Text>
												<Text style={styles.detailValue}>{selectedCase?.createdAt ? new Date(selectedCase.createdAt).toLocaleDateString() : 'N/A'}</Text>
											</View>
										</View>
										<View style={styles.detailItem}>
											<Ionicons name="time-outline" size={18} color="#00F0D1" />
											<View style={{ marginLeft: 10 }}>
												<Text style={styles.detailLabel}>Accepted On</Text>
												<Text style={styles.detailValue}>
													{selectedCase?.acceptedAt 
														? new Date(selectedCase.acceptedAt).toLocaleDateString() 
														: (selectedCase?.updatedAt ? new Date(selectedCase.updatedAt).toLocaleDateString() : 'N/A')}
												</Text>
											</View>
										</View>
									</View>

									<View style={styles.detailItem}>
										<Ionicons name="person-outline" size={18} color="#00F0D1" />
										<View style={{ marginLeft: 10 }}>
											<Text style={styles.detailLabel}>Reported By</Text>
											<Text style={styles.detailValue}>{selectedCase?.reporterID?.name || 'Anonymous'}</Text>
										</View>
									</View>

									<View style={styles.divider} />
									<Text style={styles.descriptionTitle}>Description</Text>
									<Text style={styles.modalDescription}>{selectedCase?.description}</Text>

									<TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModalVisible(false)}>
										<Text style={styles.closeBtnText}>Close Details</Text>
									</TouchableOpacity>
								</View>
							</ScrollView>
						</Pressable>
					</Pressable>
				</Modal>

				{/* Transfer NGO Modal */}
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
	scrollContent: { padding: 15 },
	sectionHeader: { fontSize: 16, fontWeight: '700', color: '#4B5563', marginBottom: 15, marginTop: 10 },
	caseCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, flexDirection: 'row', padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
	caseImage: { width: 90, height: 90, borderRadius: 15 },
	caseDetails: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
	headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	animalType: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
	statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
	progressBadge: { backgroundColor: '#E0F2FE' },
	pendingBadge: { backgroundColor: '#FEF3C7' },
	statusText: { fontSize: 10, color: '#0369A1', fontWeight: 'bold' },
	description: { fontSize: 13, color: '#6B7280' },
	actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
	btn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
	resolveBtn: { backgroundColor: '#00F0D1' },
	transferBtn: { backgroundColor: '#F3F4F6' },
	btnText: { fontSize: 12, fontWeight: 'bold', color: '#1A1C1E' },
	
	// History Styles
	historyContainer: { marginTop: 20, marginBottom: 40 },
	historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 1 },
	historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	historyTitle: { fontSize: 15, fontWeight: '600', color: '#1A1C1E' },
	historyBody: { marginTop: 10 },
	completedCard: { backgroundColor: '#F9FAFB', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
	completedInfo: { flex: 1 },
	completedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
	completedTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E' },
	completedDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
	dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
	dateItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
	dateText: { fontSize: 11, color: '#9CA3AF' },
	noHistoryText: { textAlign: 'center', color: '#9CA3AF', marginVertical: 20 },
	
	emptyContainer: { alignItems: 'center', paddingVertical: 50 },
	emptyText: { marginTop: 15, color: '#9CA3AF', fontSize: 16 },
	
	// Modal Styles
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	detailModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	detailModalBody: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', overflow: 'hidden' },
	modalHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginVertical: 15 },
	detailModalImage: { width: '100%', height: 250 },
	detailModalContent: { padding: 25 },
	detailModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
	detailModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
	detailModalSubtitle: { fontSize: 14, color: '#9CA3AF' },
	directionCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00F0D1', justifyContent: 'center', alignItems: 'center' },
	detailGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
	detailItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
	detailLabel: { fontSize: 12, color: '#9CA3AF' },
	detailValue: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginLeft: 10 },
	divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },
	descriptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 8 },
	modalDescription: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
	closeBtn: { padding: 18, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 15, marginTop: 20 },
	closeBtnText: { color: '#6B7280', fontWeight: '600' },
	
	modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '70%', padding: 20 },
	modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
	modalTitle: { fontSize: 20, fontWeight: 'bold' },
	ngoList: { flex: 1 },
	ngoCard: { padding: 15, backgroundColor: '#F9FAFB', borderRadius: 15, marginBottom: 10 },
	ngoInfo: { flex: 1 },
	ngoName: { fontSize: 16, fontWeight: 'bold' },
	ngoLoc: { fontSize: 12, color: '#9CA3AF', marginTop: 4 }
});
