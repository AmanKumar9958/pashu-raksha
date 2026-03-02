import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Mock Data for Stories
const SUCCESS_STORIES = [
  { id: '1', title: 'Rex found his forever home!', tag: 'ADOPTED', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e', desc: 'After 2 weeks of care, Rex is now living his best life.' },
  { id: '2', title: 'Luna recovered!', tag: 'RECOVERED', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', desc: 'Thanks to timely help, Luna is completely healthy now.' },
];

export default function CitizenHome() {
  const router = useRouter();

  const renderCaseItem = (title: string, location: string, status: 'RESCUING' | 'PENDING' | 'SAVED', img: string) => {
    const statusColors = {
      RESCUING: { bg: '#FFF4E5', text: '#D97706', icon: 'car' },
      PENDING: { bg: '#F3F4F6', text: '#6B7280', icon: 'time' },
      SAVED: { bg: '#E1FBF2', text: '#059669', icon: 'checkmark-circle' },
    };

    return (
      <TouchableOpacity style={styles.caseCard}>
        <Image source={{ uri: img }} style={styles.caseImg} />
        <View style={styles.caseInfo}>
          <Text style={styles.caseTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.caseLocation} numberOfLines={1}>{location}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[status].bg }]}>
          <Ionicons name={statusColors[status].icon as any} size={14} color={statusColors[status].text} />
          <Text style={[styles.statusText, { color: statusColors[status].text }]}>{status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=sam' }} style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Sam 🐾</Text>
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
        <TouchableOpacity onPress={() => router.push('/(citizen)/cases')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {renderCaseItem('Injured Stray...', 'Sector 4, Near Mar...', 'RESCUING', 'https://images.unsplash.com/photo-1544568100-847a948585b9')}
      {renderCaseItem('Kitten stuck i...', 'Park Ave, West Side', 'PENDING', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce')}
      {renderCaseItem('Abandoned Pup...', 'Main St, Downtown', 'SAVED', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee')}

      {/* 4. Success Stories Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Success Stories</Text>
        <View style={styles.savedCount}>
          <Ionicons name="heart" size={14} color="#00F0D1" />
          <Text style={styles.savedCountText}> 124 Saved this month</Text>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={SUCCESS_STORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.storyCard}>
            <Image source={{ uri: item.image }} style={styles.storyImg} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.storyOverlay}>
              <View style={styles.storyTag}>
                <Ionicons name="paw" size={10} color="#000" />
                <Text style={styles.storyTagText}>{item.tag}</Text>
              </View>
              <Text style={styles.storyTitle}>{item.title}</Text>
              <Text style={styles.storyDesc} numberOfLines={2}>{item.desc}</Text>
            </LinearGradient>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
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
  seeAll: { color: '#9CA3AF', fontSize: 14 },
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