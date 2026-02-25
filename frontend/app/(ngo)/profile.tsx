import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';
import CustomModal from '@/components/CustomModal';

export default function NGOProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { profile, loading } = useBackendUserProfile();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#00F0D1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <CustomModal
        visible={logoutModalVisible}
        title="Logout"
        message="Are you sure you want to logout from Pashu Raksha?"
        type="danger"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await signOut();
        }}
      />

      {/* 1. Profile Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#1A1C1E" />
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: user?.imageUrl }} style={styles.profileImage} />
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.ngoName}>{profile?.name || user?.fullName}</Text>
          {/* NGO Title mentioning the registration status */}
          <Text style={styles.ngoTitle}>
            {profile?.ngoDetails?.isVerified ? 'Verified NGO Partner' : 'NGO Representative'}
          </Text>
        </View>
      </View>

      {/* 2. Impact/Stats Card (Dog House Style Icon) */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View>
            <Text style={styles.statsLabel}>RESCUE CAPACITY</Text>
            <Text style={styles.statsValue}>{profile?.ngoDetails?.availableUnits ?? 0} Units</Text>
          </View>
          <View style={styles.badgeWrapper}>
            <Ionicons name="home-outline" size={24} color="#00F0D1" />
            <Text style={styles.badgeText}>Tier 1</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: '75%' }]} />
        </View>
        <Text style={styles.progressNote}>75% verification completed</Text>
      </View>

      {/* 3. Real-time Count Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.gridNumber}>156</Text>
          <Text style={styles.gridLabel}>Cases Solved</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridNumber}>12</Text>
          <Text style={styles.gridLabel}>Active Rescues</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridNumber}>08</Text>
          <Text style={styles.gridLabel}>Transferred</Text>
        </View>
      </View>

      {/* 4. NGO Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NGO ACCOUNT</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.iconBox, { backgroundColor: '#E6F4FE' }]}>
            <Ionicons name="business-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.actionLabel}>Shelter Details</Text>
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
      
      <Text style={styles.version}>v1.0.2 • Connected to Backend DB</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, backgroundColor: '#FFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  settingsBtn: { position: 'absolute', top: 60, right: 25 },
  profileInfo: { alignItems: 'center', marginTop: 25 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#F3F4F6' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#00F0D1', padding: 8, borderRadius: 15, borderWidth: 3, borderColor: '#FFF' },
  ngoName: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E', marginTop: 15 },
  ngoTitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  statsCard: { backgroundColor: '#FFF', margin: 20, borderRadius: 30, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLabel: { fontSize: 12, color: '#9CA3AF', letterSpacing: 1 },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: '#1A1C1E', marginTop: 5 },
  badgeWrapper: { alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#00F0D1', marginTop: 4 },
  progressTrack: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, marginTop: 20 },
  progressBar: { height: '100%', backgroundColor: '#00F0D1', borderRadius: 5 },
  progressNote: { fontSize: 12, color: '#9CA3AF', marginTop: 12 },
  gridContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 30 },
  gridItem: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 25, alignItems: 'center', elevation: 2 },
  gridNumber: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
  gridLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 5, textAlign: 'center' },
  section: { paddingHorizontal: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 20, letterSpacing: 1 },
  actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#1A1C1E' },
  subLabel: { marginRight: 10, color: '#9CA3AF', fontSize: 14 },
  logoutBtn: { marginTop: 30, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 20, marginBottom: 40 }
});