import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useBackendUserProfile } from '../../lib/useBackendUserProfile';
import axios from 'axios';
import { API_URL } from '../../constants';
import ScreenTransition from '../../components/ScreenTransition';

type CaseItem = {
  _id: string;
  image: string;
  description: string;
  category?: string;
  status?: string;
  location?: { coordinates?: number[] };
};

export default function CitizenHome() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { profile, loading } = useBackendUserProfile();
  const [myCases, setMyCases] = useState<CaseItem[]>([]);
  const [stories, setStories] = useState<CaseItem[]>([]);
  const [savedThisMonth, setSavedThisMonth] = useState(0);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [casesRefreshing, setCasesRefreshing] = useState(false);
  const casesRequestIdRef = useRef(0);

  const statusColors = useMemo(() => ({
    PENDING: { bg: '#F3F4F6', text: '#6B7280', icon: 'time', label: 'PENDING' },
    'IN PROGRESS': { bg: '#FFF4E5', text: '#D97706', icon: 'car', label: 'IN PROGRESS' },
    RESOLVED: { bg: '#E1FBF2', text: '#059669', icon: 'checkmark-circle', label: 'RESOLVED' },
    TRANSFERRED: { bg: '#DBEAFE', text: '#2563EB', icon: 'swap-horizontal', label: 'TRANSFERRED' },
  }), []);

  const formatLocation = (coordinates?: number[]) => {
    if (!coordinates || coordinates.length < 2) return 'Location unavailable';
    const [lng, lat] = coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') return 'Location unavailable';
    return `Lat ${lat.toFixed(3)}, Lng ${lng.toFixed(3)}`;
  };

  useEffect(() => {
    let isMounted = true;
    setStoriesLoading(true);

    axios
      .get(`${API_URL}/cases/success?limit=10`)
      .then((response) => {
        const payload = response.data?.data;
        if (!isMounted) return;
        setStories(payload?.stories || []);
        setSavedThisMonth(payload?.savedThisMonth || 0);
      })
      .catch(() => {
        if (!isMounted) return;
        setStories([]);
        setSavedThisMonth(0);
      })
      .finally(() => {
        if (!isMounted) return;
        setStoriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchMyCases = useCallback(async (showRefreshing = false) => {
    if (!isAuthLoaded || !isUserLoaded) return;
    if (!isSignedIn || !user?.id) {
      setMyCases([]);
      return;
    }

    const requestId = ++casesRequestIdRef.current;
    if (showRefreshing) setCasesRefreshing(true);

    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/cases/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (requestId !== casesRequestIdRef.current) return;
      setMyCases(response.data?.data || []);
    } catch (e) {
      if (requestId !== casesRequestIdRef.current) return;
      setMyCases([]);
    } finally {
      if (requestId !== casesRequestIdRef.current) return;
      if (showRefreshing) setCasesRefreshing(false);
    }
  }, [getToken, isAuthLoaded, isSignedIn, isUserLoaded, user?.id]);

  useEffect(() => {
    fetchMyCases();
  }, [fetchMyCases]);

  const renderCaseItem = (item: CaseItem) => {
    const normalizedStatus = String(item.status || 'PENDING').toUpperCase();
    const status = statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.PENDING;

    return (
      <TouchableOpacity style={styles.caseCard}>
        <Image source={{ uri: item.image }} style={styles.caseImg} />
        <View style={styles.caseInfo}>
          <Text style={styles.caseTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.caseLocation} numberOfLines={1}>{formatLocation(item.location?.coordinates)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={14} color={status.text} />
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenTransition>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#00F0D1" />
        </View>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={22} color="#1A1C1E" />
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{profile?.name || user?.fullName || 'there'} 🐾</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications" size={24} color="#1A1C1E" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* 2. Emergency Help Card */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency Help</Text>
          <Text style={styles.emergencySub}>Spot an animal in distress? Report it immediately.</Text>
          <TouchableOpacity 
            style={styles.reportBtn} 
            onPress={() => router.push('/report')}
          >
            <View style={styles.reportIconCircle}>
              <Ionicons name="megaphone" size={20} color="#000" />
            </View>
            <Text style={styles.reportBtnText}>REPORT EMERGENCY</Text>
          </TouchableOpacity>
        </View>

        {/* 3. My Reported Cases Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Reported Cases</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => fetchMyCases(true)}
              disabled={casesRefreshing}
            >
              {casesRefreshing ? (
                <ActivityIndicator size="small" color="#00F0D1" />
              ) : (
                <Ionicons name="refresh" size={18} color="#00F0D1" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(citizen)/cases')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {myCases.length === 0 ? (
          <Text style={styles.emptyText}>No reports yet.</Text>
        ) : (
          myCases.slice(0, 3).map((item) => (
            <View key={item._id}>{renderCaseItem(item)}</View>
          ))
        )}

        {/* 4. Success Stories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Success Stories</Text>
          <View style={styles.savedCount}>
            <Ionicons name="heart" size={14} color="#00F0D1" />
            <Text style={styles.savedCountText}> {savedThisMonth} Saved this month</Text>
          </View>
        </View>

        {storiesLoading ? (
          <View style={styles.sectionLoader}>
            <ActivityIndicator size="small" color="#00F0D1" />
          </View>
        ) : stories.length === 0 ? (
          <Text style={styles.emptyText}>No success stories yet.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stories}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View style={styles.storyCard}>
                <Image source={{ uri: item.image }} style={styles.storyImg} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.storyOverlay}>
                  <View style={styles.storyTag}>
                    <Ionicons name="paw" size={10} color="#000" />
                    <Text style={styles.storyTagText}>{String(item.category || 'RESOLVED').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.storyTitle} numberOfLines={1}>Rescue Resolved</Text>
                  <Text style={styles.storyDesc} numberOfLines={2}>{item.description}</Text>
                </LinearGradient>
              </View>
            )}
          />
        )}
      </ScrollView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  welcomeText: { fontSize: 14, color: '#666' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
  notificationBtn: { padding: 10, backgroundColor: '#F9FAFB', borderRadius: 20 },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 2, borderColor: '#FFF' },
  emergencyCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, marginBottom: 30, borderWidth: 1, borderColor: '#F3F4F6' },
  emergencyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
  emergencySub: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 20 },
  reportBtn: { backgroundColor: '#00F0D1', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 25, gap: 12 },
  reportIconCircle: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 15 },
  reportBtnText: { fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5, color: '#000' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  sectionLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  seeAll: { color: '#9CA3AF', fontSize: 14 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  refreshBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 13, marginBottom: 10 },
  caseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 25, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  caseImg: { width: 60, height: 60, borderRadius: 20 },
  caseInfo: { flex: 1, marginLeft: 15 },
  caseTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
  caseLocation: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  savedCount: { flexDirection: 'row', alignItems: 'center' },
  savedCountText: { fontSize: 12, color: '#00F0D1', fontWeight: '600' },
  storyCard: { width: 280, height: 350, marginRight: 20, borderRadius: 30, overflow: 'hidden' },
  storyImg: { width: '100%', height: '100%' },
  storyOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20 },
  storyTag: { backgroundColor: '#FFF', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4, marginBottom: 10 },
  storyTagText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  storyTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  storyDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
});