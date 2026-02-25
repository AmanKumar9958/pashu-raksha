import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo'; // Logo fetch karne ke liye
import { useBackendUserProfile } from '@/lib/useBackendUserProfile'; // Real-time DB data ke liye

export default function NGOHome() {
  const router = useRouter();
  const { user } = useUser(); // User's email profile logo yahan se aayega
  const { profile, loading, refetch } = useBackendUserProfile(); // Real-time DB stats

  // Loader jab tak DB se data na aa jaye
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#00F0D1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Dynamic Header (Logo from Email) */}
      <View style={styles.header}>
        <View style={styles.ngoInfo}>
          {/* Clerk se user ka profile picture (email logo) fetch kiya */}
          <Image 
            source={{ uri: user?.imageUrl }} 
            style={styles.logo} 
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            {/* Real-time Name from DB */}
            <Text style={styles.ngoName}>{profile?.name || user?.fullName} 🏠</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications" size={24} color="#1A1C1E" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* 2. Main Action Card with Dog House Icon */}
      <View style={styles.nearbyCard}>
        <View style={styles.nearbyInfo}>
          <View style={styles.iconRow}>
            <Text style={styles.nearbyTitle}>Nearby Cases</Text>
          </View>
          <Text style={styles.nearbySub}>Check for distress reports within your rescue zone.</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkBtn} 
          onPress={() => router.push('/(ngo)/cases')}
        >
          <Text style={styles.checkBtnText}>CHECK NOW</Text>
          <Ionicons name="search" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 3. Real-time Performance Stats from DB */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          {/* DB se available units ya active cases fetch karega */}
          <Text style={styles.statValue}>{profile?.ngoDetails?.availableUnits ?? 0}</Text>
          <Text style={styles.statLabel}>Available Units</Text>
        </View>
        <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F3F4F6' }]}>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.ngoDetails?.isVerified ? 'YES' : 'PENDING'}</Text>
          <Text style={styles.statLabel}>Verification</Text>
        </View>
      </View>

      {/* 4. Urgent Reports Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Urgent Reports</Text>
        <TouchableOpacity onPress={refetch}>
          <Ionicons name="refresh" size={20} color="#00F0D1" />
        </TouchableOpacity>
      </View>

      {/* Placeholder for real-time list integration */}
      <TouchableOpacity style={styles.urgentCaseCard}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1544568100-847a948585b9' }} 
          style={styles.caseImg} 
        />
        <View style={styles.caseContent}>
          <View style={styles.caseHeader}>
            <Text style={styles.caseTitle}>Injured Stray</Text>
            <View style={styles.distanceTag}>
              <Text style={styles.distanceText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.caseLoc}><Ionicons name="pin" size={12} /> {profile?.ngoDetails?.address || 'Detecting...'}</Text>
          <View style={styles.caseFooter}>
            <Text style={styles.timeText}>Awaiting Action</Text>
            <TouchableOpacity style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>Rescue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.footerNote}>Fetching real-time data from Pashu Raksha DB.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8F8', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 },
  ngoInfo: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#00F0D1' }, // Circular logo from email
  welcomeText: { fontSize: 14, color: '#666' },
  ngoName: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  notificationBtn: { padding: 10, backgroundColor: '#F9FAFB', borderRadius: 20 },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 2, borderColor: '#FFF' },
  nearbyCard: { backgroundColor: '#fff', borderRadius: 32, padding: 25, marginBottom: 25 },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  nearbyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
  nearbySub: { fontSize: 14, color: '#9CA3AF', marginTop: 8, marginBottom: 20 },
  checkBtn: { backgroundColor: '#00F0D1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 20, gap: 10 },
  checkBtnText: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 25, paddingVertical: 20, marginBottom: 30 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  urgentCaseCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 },
  caseImg: { width: 90, height: 90, borderRadius: 20 },
  caseContent: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
  distanceTag: { backgroundColor: '#E1FBF2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  distanceText: { fontSize: 10, color: '#059669', fontWeight: 'bold' },
  caseLoc: { fontSize: 13, color: '#666', marginTop: 4 },
  caseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  timeText: { fontSize: 11, color: '#9CA3AF' },
  viewBtn: { backgroundColor: '#00F0D1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  viewBtnText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  footerNote: { textAlign: 'center', color: '#CCC', fontSize: 11, marginTop: 10, marginBottom: 40 }
});