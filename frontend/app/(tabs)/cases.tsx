import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { API_URL } from '@/constants';

export default function ReportedCasesScreen() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();

  // 1. Fetch Cases from Backend
  const fetchMyCases = async () => {
    try {
      const token = await getToken();
      // Hum sirf is specific user ke reports fetch karenge
      const response = await axios.get(`${API_URL}/cases/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(response.data.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyCases();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyCases();
  };

  // 2. Status Badge Helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#F3F4F6', text: '#6B7280' };
      case 'RESCUING': return { bg: '#FFF4E5', text: '#F59E0B' };
      case 'SAVED': return { bg: '#E1FBF2', text: '#10B981' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const renderCaseItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const reportDate = new Date(item.createdAt).toLocaleDateString('en-IN');
    const reportTime = new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.caseImg} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.animalType}>{item.animalType} 🐾</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>● {item.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-sharp" size={14} color="#9CA3AF" />
            <Text style={styles.infoText} numberOfLines={1}>{item.address || 'Location Shared'}</Text>
          </View>

          <View style={styles.dateTimeRow}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>{reportDate}</Text>
            </View>
            <View style={[styles.infoRow, { marginLeft: 15 }]}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>{reportTime}</Text>
            </View>
          </View>

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>"{item.description}"</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>My Reported Cases</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#00F0D1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={80} color="#EEE" />
              <Text style={styles.emptyText}>You haven't reported any cases yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 20, color: '#1A1C1E' },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  caseImg: { width: 90, height: 110, borderRadius: 15, backgroundColor: '#F5F7F9' },
  detailsContainer: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  animalType: { fontSize: 17, fontWeight: 'bold', color: '#1A1C1E' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoText: { color: '#6B7280', fontSize: 13, marginLeft: 5 },
  dateTimeRow: { flexDirection: 'row', marginTop: 8 },
  description: { fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginTop: 8 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#9CA3AF', marginTop: 15, fontSize: 16 }
});