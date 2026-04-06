import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useBackendUserProfile } from '../../lib/useBackendUserProfile';
import CustomModal from '@/components/CustomModal';
import ScreenTransition from '../../components/ScreenTransition';

export default function NGOProfileScreen() {
  const { user } = useUser();
  const router = useRouter();
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
          message="Are you sure you want to logout from Pashu Raksha?"
          type="danger"
          onCancel={() => setLogoutModalVisible(false)}
          onConfirm={async () => {
            setLogoutModalVisible(false);
            await signOut();
          }}
        />

        {/* 1. Premium Profile Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileInfo}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: user?.imageUrl }} style={styles.profileImage} />
              <View style={styles.activePulse} />
            </View>
            <Text style={styles.ngoName}>{profile?.name || user?.fullName}</Text>
            <View style={styles.badgeRow}>
               <Ionicons name="shield-checkmark" size={14} color="#00F0D1" />
               <Text style={styles.ngoTitle}>
                 {profile?.ngoDetails?.isVerified ? 'Verified Rescue Partner' : 'NGO Representative'}
               </Text>
            </View>
          </View>
        </View>

        {/* 2. Enhanced Solution Stats Card (Reward UI) */}
        <View style={styles.rewardCard}>
           <View style={styles.rewardHeader}>
              <View style={styles.rewardIconBg}>
                 <Ionicons name="trophy" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                 <Text style={styles.rewardTitle}>Impact Level</Text>
                 <Text style={styles.rewardSubtitle}>You are in the top 10% of rescuers!</Text>
              </View>
           </View>
           
           <View style={styles.mainStatRow}>
              <View style={styles.mainStatBox}>
                 <Text style={styles.mainStatValue}>{profile?.stats?.solved ?? 0}</Text>
                 <Text style={styles.mainStatLabel}>Cases Solved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.mainStatBox}>
                 <Text style={styles.mainStatValue}>{profile?.ngoDetails?.availableUnits ?? 0}</Text>
                 <Text style={styles.mainStatLabel}>Rescue Units</Text>
              </View>
           </View>

           <View style={styles.celebrationTrack}>
               <View style={[styles.celebrationFill, { width: (Math.min((profile?.stats?.solved || 0), 100)) + '%' }]} />
           </View>
           <Text style={styles.goalText}>Next Milestone: 100 Solved Cases</Text>
        </View>

        {/* 3. Operational Pulse Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.pulseItem}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.pulseNumber}>{profile?.stats?.active ?? 0}</Text>
            <Text style={styles.pulseLabel}>Active</Text>
          </View>
          <View style={styles.pulseItem}>
            <View style={[styles.dot, { backgroundColor: '#3B82F6' } ]} />
            <Text style={styles.pulseNumber}>{profile?.stats?.transferred ?? 0}</Text>
            <Text style={styles.pulseLabel}>X-ferred</Text>
          </View>
          <View style={styles.pulseItem}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.pulseNumber}>100%</Text>
            <Text style={styles.pulseLabel}>Uptime</Text>
          </View>
        </View>

        {/* 4. NGO Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NGO DASHBOARD</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.iconBox, { backgroundColor: '#E1FBF2' }]}>
              <Ionicons name="medkit-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Resources & Medical</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(ngo)/notifications')}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#A855F7" />
            </View>
            <Text style={styles.actionLabel}>Team Communication</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="settings-outline" size={20} color="#F97316" />
            </View>
            <Text style={styles.actionLabel}>Profile Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text style={styles.logoutText}>Safe Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>Pashu Raksha NGO Portal • v1.2.0</Text>
      </ScrollView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8F8' },
  headerSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, backgroundColor: '#FFF', borderBottomLeftRadius: 50, borderBottomRightRadius: 50, elevation: 2 },
  profileInfo: { alignItems: 'center' },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#F3F4F6' },
  activePulse: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#00F0D1', borderWidth: 4, borderColor: '#FFF' },
  ngoName: { fontSize: 26, fontWeight: 'bold', color: '#1A1C1E', marginTop: 15 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ngoTitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5 },
  
  // Reward Card UI
  rewardCard: { backgroundColor: '#1A1C1E', margin: 20, borderRadius: 32, padding: 25, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  rewardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  rewardIconBg: { width: 50, height: 50, borderRadius: 20, backgroundColor: '#00F0D1', justifyContent: 'center', alignItems: 'center' },
  rewardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  rewardSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  mainStatRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 25 },
  mainStatBox: { alignItems: 'center' },
  mainStatValue: { fontSize: 32, fontWeight: 'bold', color: '#00F0D1' },
  mainStatLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 5, letterSpacing: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: '#374151' },
  celebrationTrack: { height: 8, backgroundColor: '#374151', borderRadius: 4, marginTop: 10 },
  celebrationFill: { height: '100%', backgroundColor: '#00F0D1', borderRadius: 4 },
  goalText: { fontSize: 11, color: '#9CA3AF', marginTop: 15, textAlign: 'center' },
  
  gridContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 30 },
  pulseItem: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 24, alignItems: 'center', elevation: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  pulseNumber: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
  pulseLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  
  section: { paddingHorizontal: 25 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 20, letterSpacing: 2 },
  actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#1A1C1E' },
  
  logoutBtn: { marginTop: 30, alignItems: 'center', paddingVertical: 18, borderRadius: 24, marginHorizontal: 30, backgroundColor: '#FEF2F2' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 11, marginTop: 30, marginBottom: 50, letterSpacing: 1 }
});