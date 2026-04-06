import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useBackendUserProfile } from '../../lib/useBackendUserProfile';
import CustomModal from '@/components/CustomModal';
import ScreenTransition from '../../components/ScreenTransition';

export default function CitizenProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { profile, loading } = useBackendUserProfile();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  if (loading) {
    return (
      <ScreenTransition>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#00F0D1" />
        </View>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* 1. Profile Header Section */}
        <View style={styles.headerSection}>
          {/* <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color="#1A1C1E" />
          </TouchableOpacity> */}
          
          <View style={styles.profileInfo}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: user?.imageUrl }} style={styles.profileImage} />
              {/* <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color="#000" />
              </TouchableOpacity> */}
            </View>
            <Text style={styles.userName}>{profile?.name || user?.fullName}</Text>
            <Text style={styles.userTitle}>Citizen Volunteer</Text>
          </View>
        </View>

        {/* 2. Karma Balance Card (As per Reference) */}
        <View style={styles.karmaCard}>
          <View style={styles.karmaHeader}>
            <View>
              <Text style={styles.karmaLabel}>KARMA BALANCE</Text>
              <Text style={styles.karmaValue}>3,450</Text>
            </View>
            <View style={styles.badgeWrapper}>
              <View style={styles.pawIconBox}>
                <Ionicons name="paw" size={24} color="#00F0D1" />
              </View>
              <Text style={styles.badgeLabel}>Silver Paw</Text>
            </View>
          </View>
          <View style={styles.nextLevelRow}>
             <Text style={styles.levelText}>Next: Gold Guardian</Text>
             <Text style={styles.levelText}>75%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '75%' }]} />
          </View>
          <Text style={styles.progressNote}>50 more points to level up!</Text>
        </View>

        {/* 3. Real-time Impact Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{profile?.stats?.solved ?? 0}</Text>
            <Text style={styles.gridLabel}>Cases Solved</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{profile?.stats?.filed ?? 0}</Text>
            <Text style={styles.gridLabel}>Reports Filed</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{profile?.stats?.saved ?? 0}</Text>
            <Text style={styles.gridLabel}>Animals Saved</Text>
          </View>
        </View>

        {/* 4. Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.iconBox, { backgroundColor: '#E6F4FE' }]}>
              <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>My Reports</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="notifications-outline" size={20} color="#A855F7" />
            </View>
            <Text style={styles.actionLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.iconBox, { backgroundColor: '#E1FBF2' }]}>
              <Ionicons name="globe-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Language</Text>
            <Text style={styles.subLabel}>English</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>v1.0.0 • Pashu Raksha</Text>
      </ScrollView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerSection: { alignItems: 'center', paddingTop: 25, paddingBottom: 30, backgroundColor: '#FFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  settingsBtn: { position: 'absolute', top: 60, right: 25 },
  profileInfo: { alignItems: 'center', marginTop: 25 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#F3F4F6' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#00F0D1', padding: 8, borderRadius: 15, borderWidth: 3, borderColor: '#FFF' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E', marginTop: 15 },
  userTitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  karmaCard: { backgroundColor: '#FFF', margin: 20, borderRadius: 30, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  karmaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  karmaLabel: { fontSize: 12, color: '#9CA3AF', letterSpacing: 1 },
  karmaValue: { fontSize: 32, fontWeight: 'bold', color: '#1A1C1E', marginTop: 5 },
  badgeWrapper: { alignItems: 'center' },
  pawIconBox: { backgroundColor: '#E1FBF2', padding: 12, borderRadius: 20 },
  badgeLabel: { fontSize: 11, fontWeight: 'bold', color: '#00F0D1', marginTop: 6 },
  nextLevelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  levelText: { fontSize: 13, color: '#666', fontWeight: '500' },
  progressTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginTop: 10 },
  progressBar: { height: '100%', backgroundColor: '#00F0D1', borderRadius: 4 },
  progressNote: { fontSize: 12, color: '#9CA3AF', marginTop: 12 },
  gridContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 30 },
  gridItem: { flex: 1, backgroundColor: '#FFF', padding: 18, borderRadius: 25, alignItems: 'center', elevation: 2 },
  gridNumber: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
  gridLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 5, textAlign: 'center' },
  section: { paddingHorizontal: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 20, letterSpacing: 1 },
  actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#1A1C1E' },
  subLabel: { marginRight: 10, color: '#9CA3AF', fontSize: 14 },
  logoutBtn: { marginTop: 20, alignItems: 'center', borderColor: 'red', borderWidth: 1, marginHorizontal: 50, paddingVertical: 12, borderRadius: 20 },
  logoutText: { color: '#EF4444', fontSize: 18, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 11, marginTop: 20, marginBottom: 40 }
});