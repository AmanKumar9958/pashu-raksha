import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '@/constants';

export default function CitizenDashboard({ userData }: { userData?: any }) {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const fetchedReportsForUserIdRef = useRef<string | null>(null);

  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [savedThisMonth, setSavedThisMonth] = useState(0);
  const [loadingStories, setLoadingStories] = useState(true);

  const isCanceledError = (error: any) => {
    return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'RESCUING':
        return { bg: '#FFF4E5', text: '#F59E0B' };
      case 'SAVED':
        return { bg: '#E1FBF2', text: '#10B981' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) return;

    // If signed out (or user missing), clear loading + data
    if (!isSignedIn || !user?.id) {
      fetchedReportsForUserIdRef.current = null;
      setMyReports([]);
      setLoadingReports(false);
      return;
    }

    // Fetch only once per user id (prevents repeated loading loops)
    if (fetchedReportsForUserIdRef.current === user.id) return;
    fetchedReportsForUserIdRef.current = user.id;

    let isMounted = true;
    const controller = new AbortController();

    const fetchMyReports = async () => {
      setLoadingReports(true);
      try {
        const token = await getToken();
        const response = await axios.get(`${API_URL}/cases/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
          signal: controller.signal,
        });

        const raw: any[] = response.data?.data || [];
        const normalized = raw.map((c: any) => {
          const normalizedStatus = c.status === 'IN PROGRESS'
            ? 'RESCUING'
            : c.status === 'RESOLVED'
              ? 'SAVED'
              : c.status;

          const statusStyle = getStatusStyle(normalizedStatus);
          const coords = Array.isArray(c.location?.coordinates) ? c.location.coordinates : null;
          const locText = coords?.length === 2 ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}` : 'Location Shared';

          return {
            id: c._id,
            type: c.description || c.category || 'Reported Case',
            loc: locText,
            status: normalizedStatus,
            color: statusStyle.bg,
            textColor: statusStyle.text,
            img: c.image || c.imageUrl || 'https://via.placeholder.com/150'
          };
        });

        if (isMounted) setMyReports(normalized);
      } catch (error) {
        if (isCanceledError(error)) return;
        console.error('My reports fetch error:', error);
        if (isMounted) setMyReports([]);
      } finally {
        if (isMounted) setLoadingReports(false);
      }
    };

    fetchMyReports();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [getToken, isAuthLoaded, isSignedIn, isUserLoaded, user?.id]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchSuccessStories = async () => {
      setLoadingStories(true);
      try {
        const response = await axios.get(`${API_URL}/cases/success?limit=10`, {
          timeout: 10000,
          signal: controller.signal,
        });
        if (!isMounted) return;
        setSavedThisMonth(response.data?.data?.savedThisMonth || 0);
        setSuccessStories(response.data?.data?.stories || []);
      } catch (error) {
        if (isCanceledError(error)) return;
        console.error('Success stories fetch error:', error);
        if (!isMounted) return;
        setSavedThisMonth(0);
        setSuccessStories([]);
      } finally {
        if (isMounted) setLoadingStories(false);
      }
    };

    fetchSuccessStories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user?.imageUrl }} style={styles.profilePic} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'} 🐾</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications" size={24} color="#1A1C1E" />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {/* 2. Emergency Help Card */}
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Emergency Help</Text>
        <Text style={styles.emergencySub}>Spot an animal in distress? Report it immediately.</Text>
        <TouchableOpacity 
          style={styles.reportBtn}
          onPress={() => router.push('/report' as any)}
        >
          <Ionicons name="alert-circle" size={24} color="black" style={{marginRight: 8}} />
          <Text style={styles.reportBtnText}>REPORT EMERGENCY</Text>
        </TouchableOpacity>
      </View>

      {/* 3. My Reported Cases Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Reported Cases</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cases' as any)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loadingReports ? (
        <ActivityIndicator size="small" color="#00F0D1" style={{ marginBottom: 10 }} />
      ) : myReports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="paw-outline" size={64} color="#EEE" />
          <Text style={styles.emptyText}>No reported cases yet.</Text>
        </View>
      ) : (
        myReports.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.caseCard}>
            <Image source={{ uri: item.img }} style={styles.caseImg} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.caseType} numberOfLines={1}>{item.type}</Text>
              <Text style={styles.caseLoc} numberOfLines={1}>{item.loc}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.color }]}>
              <Text style={[styles.statusText, { color: item.textColor }]}>● {item.status}</Text>
            </View>
          </View>
        ))
      )}

      {/* 4. Success Stories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Success Stories</Text>
        <Text style={styles.successCount}>❤️ {savedThisMonth} Saved this month</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
        {loadingStories ? (
          <View style={styles.storyLoading}>
            <ActivityIndicator size="small" color="#00F0D1" />
          </View>
        ) : successStories.length === 0 ? (
          <View style={styles.storyLoading}>
            <Ionicons name="paw-outline" size={40} color="#EEE" />
            <Text style={styles.storyEmptyText}>No success stories yet.</Text>
          </View>
        ) : (
          successStories.map((story) => (
            <View key={story._id} style={styles.storyCard}>
              <Image
                source={{ uri: story.image || story.imageUrl || 'https://via.placeholder.com/300' }}
                style={styles.storyImg}
              />
              <View style={styles.storyOverlay}>
                <View style={styles.tag}><Text style={styles.tagText}>🐾 SAVED</Text></View>
                <Text style={styles.storyTitle} numberOfLines={2}>
                  {story.description || `${story.category || 'Animal'} rescued successfully!`}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  emergencyCard: { backgroundColor: '#FDFDFD', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 25, elevation: 2 },
  emergencyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  emergencySub: { color: '#666', marginBottom: 20, fontSize: 14 },
  reportBtn: { backgroundColor: '#00F0D1', flexDirection: 'row', padding: 18, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  reportBtnText: { fontWeight: 'bold', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  seeAll: { color: '#9CA3AF', fontSize: 14 },
  caseCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  caseImg: { width: 60, height: 60, borderRadius: 15 },
  caseType: { fontWeight: 'bold', fontSize: 16 },
  caseLoc: { color: '#9CA3AF', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
  storiesScroll: { marginBottom: 40 },
  storyLoading: { width: 260, height: 320, borderRadius: 25, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 15, backgroundColor: '#fff' },
  storyEmptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
  storyCard: { width: 260, height: 320, borderRadius: 25, overflow: 'hidden', marginRight: 15 },
  storyImg: { width: '100%', height: '100%' },
  storyOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 15, backgroundColor: 'rgba(0,0,0,0.4)' },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: 5, borderRadius: 8, marginBottom: 5 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  storyTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  successCount: { color: '#00F0D1', fontSize: 12, fontWeight: 'bold' }
});