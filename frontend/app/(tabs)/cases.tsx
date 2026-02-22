import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { API_URL } from '@/constants';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';

export default function ReportedCasesScreen() {
  const { role, loading: loadingRole } = useBackendUserProfile();
  const isNgo = String(role).toUpperCase() === 'NGO';

  if (loadingRole) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00F0D1" style={{ marginTop: 50 }} />
      </View>
    );
  }

  if (isNgo) {
    return <NGOCasesScreen />;
  }

  return <CitizenCasesScreen />;
}

function CitizenCasesScreen() {
  type UiStatus = 'PENDING' | 'RESCUING' | 'SAVED' | 'TRANSFERRED';

  type CaseItem = {
    _id: string;
    image?: string;
    imageUrl?: string;
    description?: string;
    category?: string;
    status?: string;
    location?: { coordinates?: number[] };
    createdAt?: string;
  };

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const fetchedForUserIdRef = useRef<string | null>(null);
  const loggedErrorRef = useRef<string | null>(null);

  // 1. Fetch Cases from Backend
  const fetchMyCases = useCallback(async () => {
    if (!isAuthLoaded) return;
    if (!isSignedIn || !user?.id) {
      setCases([]);
      setLoading(false);
      setRefreshing(false);
      fetchedForUserIdRef.current = null;
      return;
    }

    // Avoid re-fetch spam caused by rerenders / getToken identity changes.
    if (!refreshing && fetchedForUserIdRef.current === user.id) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      // Hum sirf is specific user ke reports fetch karenge
      const response = await axios.get(`${API_URL}/cases/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases((response.data?.data as CaseItem[]) || []);
      fetchedForUserIdRef.current = user.id;
      loggedErrorRef.current = null;
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401 || status === 403) return;

      const msg =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Network error';

      if (loggedErrorRef.current !== msg) {
        loggedErrorRef.current = msg;
        console.error("Fetch Error:", msg);
      }

      // Mark fetched to prevent infinite retry loops; user can pull-to-refresh.
      fetchedForUserIdRef.current = user.id;
      setCases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, isAuthLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    fetchMyCases();
  }, [fetchMyCases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchedForUserIdRef.current = null;
    fetchMyCases();
  };

  const normalizeStatus = useCallback((status?: string): UiStatus => {
    if (!status) return 'PENDING';
    const s = String(status).toUpperCase();
    if (s === 'IN PROGRESS' || s === 'ACCEPTED' || s === 'RESCUING') return 'RESCUING';
    if (s === 'RESOLVED' || s === 'SAVED') return 'SAVED';
    if (s === 'TRANSFERRED') return 'TRANSFERRED';
    if (s === 'PENDING') return 'PENDING';
    return 'PENDING';
  }, []);

  const statusLabel = useCallback((status: UiStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'RESCUING':
        return 'In progress';
      case 'SAVED':
        return 'Resolved';
      case 'TRANSFERRED':
        return 'Transferred';
      default:
        return 'Pending';
    }
  }, []);

  const getStatusStyle = useCallback((status: UiStatus) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'RESCUING':
        return { bg: '#FFF4E5', text: '#F59E0B' };
      case 'SAVED':
        return { bg: '#E1FBF2', text: '#10B981' };
      case 'TRANSFERRED':
        return { bg: '#F3F4F6', text: '#6B7280' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  }, []);

  const toCoordText = useCallback((item: CaseItem) => {
    const coords = Array.isArray(item.location?.coordinates) ? item.location?.coordinates : null;
    if (coords && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
    }
    return 'Location Shared';
  }, []);

  const formatDateTime = useCallback((iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const date = d.toLocaleDateString('en-IN');
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  }, []);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Reported Cases</Text>
        <Text style={styles.screenSubTitle}>Track the status of your reports</Text>
      </View>
    );
  }, []);

  const renderCaseItem = useCallback(({ item }: { item: CaseItem }) => {
    const normalizedStatus = normalizeStatus(item.status);
    const statusStyle = getStatusStyle(normalizedStatus);
    const when = formatDateTime(item.createdAt);
    const title = item.category || 'Reported Case';
    const desc = item.description || '';
    const img = item.image || item.imageUrl || 'https://via.placeholder.com/150';

    return (
      <View style={styles.card}>
        <Image source={{ uri: img }} style={styles.caseImg} />

        <View style={styles.detailsContainer}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}> 
              <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
              <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{statusLabel(normalizedStatus)}</Text>
            </View>

            {when ? (
              <Text style={styles.metaText} numberOfLines={1}>{when}</Text>
            ) : (
              <View />
            )}
          </View>

          <Text style={styles.title} numberOfLines={1}>{title} 🐾</Text>

          {desc ? (
            <Text style={styles.description} numberOfLines={2}>
              {desc}
            </Text>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="location-sharp" size={14} color="#9CA3AF" />
            <Text style={styles.infoText} numberOfLines={1}>{toCoordText(item)}</Text>
          </View>
        </View>
      </View>
    );
  }, [formatDateTime, getStatusStyle, normalizeStatus, statusLabel, toCoordText]);

  const keyExtractor = useCallback((item: CaseItem) => item._id, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00F0D1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={80} color="#EEE" />
              <Text style={styles.emptyText}>You haven’t reported any cases yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function NGOCasesScreen() {
  type NgoCaseItem = {
    _id: string;
    image?: string;
    imageUrl?: string;
    description?: string;
    category?: string;
    status?: string;
    createdAt?: string;
  };

  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [cases, setCases] = useState<NgoCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const fetchedForUserIdRef = useRef<string | null>(null);
  const loggedErrorRef = useRef<string | null>(null);

  const fetchNgoCases = useCallback(async (scope: 'ongoing' | 'all' = 'ongoing') => {
    if (!isAuthLoaded) return;
    if (!isSignedIn || !user?.id) {
      setCases([]);
      setLoading(false);
      setRefreshing(false);
      fetchedForUserIdRef.current = null;
      return;
    }

    if (!refreshing && fetchedForUserIdRef.current === user.id && scope === 'ongoing') {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/cases/ngo/${user.id}?scope=${scope}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000,
      });
      setCases((res.data?.data as NgoCaseItem[]) || []);
      fetchedForUserIdRef.current = user.id;
      loggedErrorRef.current = null;
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401 || status === 403) return;
      const msg =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Network error';
      if (loggedErrorRef.current !== msg) {
        loggedErrorRef.current = msg;
        console.error('NGO cases fetch error:', msg);
      }
      fetchedForUserIdRef.current = user.id;
      setCases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, isAuthLoaded, isSignedIn, refreshing, user?.id]);

  useEffect(() => {
    fetchNgoCases('ongoing');
  }, [fetchNgoCases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchedForUserIdRef.current = null;
    fetchNgoCases('ongoing');
  };

  const normalizeNgoStatus = useCallback((status?: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'IN PROGRESS' || s === 'IN_PROGRESS' || s === 'ACCEPTED' || s === 'RESCUING') return 'IN PROGRESS';
    if (s === 'RESOLVED' || s === 'SAVED') return 'RESOLVED';
    if (s === 'TRANSFERRED') return 'TRANSFERRED';
    return 'PENDING';
  }, []);

  const statusStyle = useCallback((normalized: string) => {
    switch (normalized) {
      case 'PENDING':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'IN PROGRESS':
        return { bg: '#FFF4E5', text: '#F59E0B' };
      case 'RESOLVED':
        return { bg: '#E1FBF2', text: '#10B981' };
      case 'TRANSFERRED':
        return { bg: '#F3F4F6', text: '#6B7280' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  }, []);

  const updateStatus = useCallback(async (caseId: string, nextStatus: 'IN PROGRESS' | 'RESOLVED' | 'TRANSFERRED') => {
    if (!isAuthLoaded) return;
    if (!isSignedIn || !user?.id) return;
    setUpdatingId(caseId);
    try {
      const token = await getToken({ skipCache: true });
      const res = await axios.put(
        `${API_URL}/cases/${caseId}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 12000 }
      );
      const updated = res.data?.data;
      if (updated?._id) {
        setCases((prev) => prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)));
      }
      // If resolved/transferred, remove from ongoing list
      if (nextStatus === 'RESOLVED' || nextStatus === 'TRANSFERRED') {
        setCases((prev) => prev.filter((c) => c._id !== caseId));
      }
    } catch (error) {
      const msg =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Could not update status';
      console.error('Update status error:', msg);
    } finally {
      setUpdatingId(null);
    }
  }, [getToken, isAuthLoaded, isSignedIn, user?.id]);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Ongoing Cases</Text>
        <Text style={styles.screenSubTitle}>Update rescue status as you work</Text>
      </View>
    );
  }, []);

  const renderNgoCase = useCallback(({ item }: { item: NgoCaseItem }) => {
    const normalized = normalizeNgoStatus(item.status);
    const pill = statusStyle(normalized);
    const img = item.image || item.imageUrl || 'https://via.placeholder.com/150';
    const desc = item.description || '';
    const title = item.category || 'Reported Case';
    const isUpdating = updatingId === item._id;

    return (
      <View style={styles.card}>
        <Image source={{ uri: img }} style={styles.caseImg} />
        <View style={styles.detailsContainer}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: pill.text }]} />
              <Text style={[styles.statusPillText, { color: pill.text }]}>{normalized}</Text>
            </View>
            {isUpdating ? <ActivityIndicator size="small" color="#00F0D1" /> : <View />}
          </View>

          <Text style={styles.title} numberOfLines={1}>{title} 🛡️</Text>
          {desc ? <Text style={styles.description} numberOfLines={2}>{desc}</Text> : null}

          <View style={styles.ngoActionsRow}>
            <TouchableOpacity
              style={[styles.ngoActionBtn, normalized === 'IN PROGRESS' && styles.ngoActionBtnActive]}
              disabled={isUpdating}
              onPress={() => updateStatus(item._id, 'IN PROGRESS')}
            >
              <Text style={[styles.ngoActionText, normalized === 'IN PROGRESS' && styles.ngoActionTextActive]}>In progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ngoActionBtn, normalized === 'RESOLVED' && styles.ngoActionBtnActive]}
              disabled={isUpdating}
              onPress={() => updateStatus(item._id, 'RESOLVED')}
            >
              <Text style={[styles.ngoActionText, normalized === 'RESOLVED' && styles.ngoActionTextActive]}>Saved</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ngoActionBtn, normalized === 'TRANSFERRED' && styles.ngoActionBtnActive]}
              disabled={isUpdating}
              onPress={() => updateStatus(item._id, 'TRANSFERRED')}
            >
              <Text style={[styles.ngoActionText, normalized === 'TRANSFERRED' && styles.ngoActionTextActive]}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [normalizeNgoStatus, statusStyle, updateStatus, updatingId]);

  const keyExtractor = useCallback((item: NgoCaseItem) => item._id, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00F0D1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cases}
          renderItem={renderNgoCase}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={72} color="#EEE" />
              <Text style={styles.emptyText}>No ongoing cases assigned yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: { paddingTop: 18, paddingBottom: 14 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
  screenSubTitle: { marginTop: 6, color: '#6B7280', fontSize: 13 },
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
  detailsContainer: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  metaText: { color: '#9CA3AF', fontSize: 11, fontWeight: '700' },
  title: { marginTop: 10, fontSize: 16, fontWeight: '900', color: '#1A1C1E' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoText: { color: '#6B7280', fontSize: 13, marginLeft: 5 },
  description: { fontSize: 13, color: '#4B5563', marginTop: 6 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#9CA3AF', marginTop: 15, fontSize: 16 },
  ngoActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ngoActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ngoActionBtnActive: {
    borderColor: '#1A1C1E',
  },
  ngoActionText: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  ngoActionTextActive: { color: '#1A1C1E' }
});