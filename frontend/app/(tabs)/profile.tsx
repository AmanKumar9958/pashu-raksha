import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '@/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, animalsSaved: 0 });

  const fetchUserStats = useCallback(async () => {
    try {
      const token = await getToken();
      // Backend se user ke stats fetch karein
      const response = await axios.get(`${API_URL}/users/profile/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Maan lete hain backend saved count bhi bhej raha hai
      setStats({
        totalReports: response.data.data.totalReports || 0,
        animalsSaved: response.data.data.animalsSaved || 0
      });
    } catch (error) {
      console.log("Stats fetch error:", error);
    }
  }, [getToken, user?.id]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } finally {
            router.replace('/');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 1. Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
        <Text style={styles.name}>{user?.fullName || 'Aman Kumar'}</Text>
        <Text style={styles.roleTag}>CITIZEN 🐾</Text>
      </View>

      {/* 2. Impact Stats Card */}
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

      {/* 3. Personal Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        
        <View style={styles.infoTile}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.primaryEmailAddress?.emailAddress}</Text>
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

      {/* 4. Settings & Logout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#1A1C1E" />
          <Text style={styles.actionBtnText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { marginTop: 10 }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Pashu Raksha v1.0.2 • Made with ❤️</Text>
    </ScrollView>
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