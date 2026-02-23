import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '@/constants';
import CustomModal from '@/components/CustomModal';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';

// -------------------------------------------------------------------------
// MAIN PROFILE SCREEN
// -------------------------------------------------------------------------
export default function ProfileScreen() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { role, loading: loadingRole } = useBackendUserProfile();

  const content = useMemo(() => {
    // 1. Agar auth load nahi hua ya user sign out ho gaya, toh blank return karo
    if (!isAuthLoaded || !isSignedIn) return null;

    // 2. Loading state jab tak backend se role na mil jaye
    if (loadingRole) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#00F0D1" />
        </View>
      );
    }

    // 3. Role based rendering
    return String(role).toUpperCase() === 'NGO' ? <NGOProfileScreen /> : <CitizenProfileScreen />;
  }, [role, loadingRole, isAuthLoaded, isSignedIn]);

  return content;
}

// -------------------------------------------------------------------------
// CITIZEN PROFILE SUB-COMPONENT
// -------------------------------------------------------------------------
function CitizenProfileScreen() {
  const { user } = useUser();
  const { signOut, getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, animalsSaved: 0 });
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const fetchedForUserIdRef = useRef<string | null>(null);
  const loggedErrorRef = useRef<string | null>(null);

  useEffect(() => {
    // Safety check: Don't run effect if not signed in
    if (!isAuthLoaded || !isSignedIn || !user?.id) return;
    if (fetchedForUserIdRef.current === user.id) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const response = await axios.get(`${API_URL}/users/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 12000,
        });

        if (cancelled) return;
        setStats({
          totalReports: response.data?.data?.totalReports || 0,
          animalsSaved: response.data?.data?.animalsSaved || 0,
        });
        fetchedForUserIdRef.current = user.id;
      } catch (error) {
        if (cancelled) return;
        console.log('Stats fetch error:', (error as any)?.message);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthLoaded, isSignedIn, user?.id]);

  // 🚨 CRITICAL GUARD: Stop rendering if user is null (prevents white screen)
  if (!user) return null;

  return (
    <>
      <CustomModal
        visible={logoutModalVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        type="danger"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await signOut();
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          <Text style={styles.name}>{user.fullName || 'User'}</Text>
          <Text style={styles.roleTag}>CITIZEN 🐾</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalReports}</Text>
            <Text style={styles.statLabel}>Reported</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#EEE' }]}>
            <Text style={styles.statNumber}>{stats.animalsSaved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Top 5%</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoTile}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user.primaryEmailAddress?.emailAddress || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoTile}>
            <Ionicons name="phone-portrait-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>+91 9958414868</Text> 
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setLogoutModalVisible(true)}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Pashu Raksha v1.0.2 • Made with ❤️</Text>
      </ScrollView>
    </>
  );
}

// -------------------------------------------------------------------------
// NGO PROFILE SUB-COMPONENT
// -------------------------------------------------------------------------
function NGOProfileScreen() {
  type NgoCaseItem = { _id: string; status?: string };
  const { user } = useUser();
  const { signOut, getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { profile } = useBackendUserProfile();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [cases, setCases] = useState<NgoCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchedForUserIdRef = useRef<string | null>(null);

  const fetchNgoAllCases = useCallback(async () => {
    if (!isAuthLoaded || !isSignedIn || !user?.id) return;

    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/cases/ngo/${user.id}?scope=all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000,
      });
      setCases((res.data?.data as NgoCaseItem[]) || []);
      fetchedForUserIdRef.current = user.id;
    } catch (error) {
      console.error('NGO cases fetch error:', (error as any)?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, isAuthLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (isSignedIn && isAuthLoaded && user?.id) {
      fetchNgoAllCases();
    }
  }, [isSignedIn, isAuthLoaded, user?.id]);

  const stats = useMemo(() => {
    const normalize = (s?: string) => String(s || '').toUpperCase();
    return {
      total: cases.length,
      pending: cases.filter((c) => normalize(c.status) === 'PENDING').length,
      inProgress: cases.filter((c) => normalize(c.status).includes('PROGRESS')).length,
      resolved: cases.filter((c) => normalize(c.status) === 'RESOLVED').length,
      transferred: cases.filter((c) => normalize(c.status) === 'TRANSFERRED').length,
    };
  }, [cases]);

  // 🚨 CRITICAL GUARD
  if (!user) return null;

  return (
    <>
      <CustomModal
        visible={logoutModalVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        type="danger"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await signOut();
        }}
      />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNgoAllCases(); }} />}
      >
        <View style={styles.header}>
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          <Text style={styles.name}>{user.fullName || 'NGO Partner'}</Text>
          <Text style={styles.roleTag}>NGO 🛡️</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNumber}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#EEE' }]}><Text style={styles.statNumber}>{stats.inProgress}</Text><Text style={styles.statLabel}>In progress</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>{stats.resolved}</Text><Text style={styles.statLabel}>Solved</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoTile}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </View>
          <View style={styles.infoTile}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profile?.phone || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setLogoutModalVisible(true)}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>{loading ? 'Updating...' : 'Pashu Raksha v1.0.2 • Made with ❤️'}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#00F0D1' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 15, color: '#1A1C1E' },
  roleTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 10, fontWeight: 'bold', color: '#666', marginTop: 8 },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  section: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  infoTile: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoTextContainer: { marginLeft: 15 },
  infoLabel: { fontSize: 12, color: '#9CA3AF' },
  infoValue: { fontSize: 15, color: '#1A1C1E', fontWeight: '500' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 15 },
  actionBtnText: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#1A1C1E' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginVertical: 40 }
});