import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useBackendUserProfile } from '../../lib/useBackendUserProfile';
import CustomModal from '@/components/CustomModal';
import ScreenTransition from '../../components/ScreenTransition';
import axios from 'axios';
import { API_URL } from '../../constants';

const ANIMAL_OPTIONS = ['Cow', 'Dog', 'Cat', 'Bird', 'Horse', 'Reptile', 'Other'];

export default function NGOProfileScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { signOut, getToken } = useAuth();
  const { profile, loading, refetch } = useBackendUserProfile();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Edit form state
  const [suitableFor, setSuitableFor] = useState<string[]>([]);
  const [beds, setBeds] = useState('');
  const [animalCapacity, setAnimalCapacity] = useState('');
  const [totalVolunteers, setTotalVolunteers] = useState('');
  const [ambulances, setAmbulances] = useState('');
  const [medicalFacilities, setMedicalFacilities] = useState('');

  // Populate form when opening modal
  const openEditModal = () => {
    const d = profile?.ngoDetails;
    setSuitableFor(d?.suitableFor || []);
    setBeds(String(d?.beds || 0));
    setAnimalCapacity(String(d?.animalCapacity || 0));
    setTotalVolunteers(String(d?.totalVolunteers || 0));
    setAmbulances(String(d?.ambulances || 0));
    setMedicalFacilities(d?.medicalFacilities || '');
    setEditModalVisible(true);
  };

  const toggleAnimal = (animal: string) => {
    setSuitableFor(prev =>
      prev.includes(animal) ? prev.filter(a => a !== animal) : [...prev, animal]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await axios.put(`${API_URL}/ngos/details`, {
        suitableFor,
        beds: Number(beds) || 0,
        animalCapacity: Number(animalCapacity) || 0,
        totalVolunteers: Number(totalVolunteers) || 0,
        ambulances: Number(ambulances) || 0,
        medicalFacilities,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Facility details updated!');
      setEditModalVisible(false);
      refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to update details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNameSave = async () => {
    if (!editName.trim()) return;
    try {
      const token = await getToken();
      await axios.put(`${API_URL}/ngos/details`, { name: editName.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNameEditing(false);
      refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to update name.');
    }
  };

  const ngoDetails = profile?.ngoDetails;
  const stats = profile?.stats;
  const establishedDate = ngoDetails?.createdAt
    ? new Date(ngoDetails.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

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

        {/* 1. Clean Profile Header — Photo + Name + Badge only */}
        <View style={styles.headerSection}>
          <View style={styles.profileInfo}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: user?.imageUrl }} style={styles.profileImage} />
              <View style={styles.activePulse} />
            </View>

            {/* Editable Name */}
            {nameEditing ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={handleNameSave}
                />
                <TouchableOpacity style={styles.nameCheckBtn} onPress={handleNameSave}>
                  <Ionicons name="checkmark-circle" size={28} color="#00F0D1" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNameEditing(false)}>
                  <Ionicons name="close-circle" size={28} color="#E5E7EB" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameRow}
                onPress={() => {
                  setEditName(profile?.name || user?.fullName || '');
                  setNameEditing(true);
                }}
              >
                <Text style={styles.ngoName}>{profile?.name || user?.fullName}</Text>
                <Ionicons name="create-outline" size={18} color="#9CA3AF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}

            <View style={styles.badgeRow}>
              <Ionicons name="shield-checkmark" size={14} color="#00F0D1" />
              <Text style={styles.ngoTitle}>
                {ngoDetails?.isVerified ? 'Verified Rescue Partner' : 'NGO Representative'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Stats Boxes */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.statValue}>{stats?.active ?? 0}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats?.solved ?? 0}</Text>
            <Text style={styles.statLabel}>Cases Solved</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats?.transferred ?? 0}</Text>
            <Text style={styles.statLabel}>Transferred</Text>
          </View>
        </View>

        {/* 3. See Details Button */}
        <TouchableOpacity
          style={styles.seeDetailsBtn}
          onPress={() => setDetailsModalVisible(true)}
        >
          <View style={styles.seeDetailsBtnInner}>
            <Ionicons name="document-text-outline" size={20} color="#00F0D1" />
            <Text style={styles.seeDetailsBtnText}>See Details</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 4. NGO Dashboard Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NGO DASHBOARD</Text>

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

        <Text style={styles.version}>Pashu Raksha NGO Portal • v2.0.0</Text>
      </ScrollView>

      {/* Edit Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalBody} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
              <Text style={styles.modalTitle}>Edit Facility Details</Text>

              {/* Suitable For — Multi-select chips */}
              <Text style={styles.fieldLabel}>Suitable For</Text>
              <View style={styles.chipContainer}>
                {ANIMAL_OPTIONS.map((animal) => {
                  const selected = suitableFor.includes(animal);
                  return (
                    <TouchableOpacity
                      key={animal}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleAnimal(animal)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{animal}</Text>
                      {selected && <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Number of Beds</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={beds} onChangeText={setBeds} placeholder="0" placeholderTextColor="#D1D5DB" />

              <Text style={styles.fieldLabel}>Total Animal Capacity</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={animalCapacity} onChangeText={setAnimalCapacity} placeholder="0" placeholderTextColor="#D1D5DB" />

              <Text style={styles.fieldLabel}>Total Volunteers</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={totalVolunteers} onChangeText={setTotalVolunteers} placeholder="0" placeholderTextColor="#D1D5DB" />

              <Text style={styles.fieldLabel}>Number of Ambulances</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={ambulances} onChangeText={setAmbulances} placeholder="0" placeholderTextColor="#D1D5DB" />

              <Text style={styles.fieldLabel}>Doctor & Medical Facilities</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                value={medicalFacilities}
                onChangeText={setMedicalFacilities}
                placeholder="e.g., 2 veterinary doctors, X-ray, surgery room"
                placeholderTextColor="#D1D5DB"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#1A1C1E" /> : <Text style={styles.saveBtnText}>Save Details</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* See Details Modal — Profile Info + Facility Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDetailsModalVisible(false)}>
          <Pressable style={styles.detailsModalBody} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.detailsModalTitle}>NGO Details</Text>

              {/* Profile Info Section */}
              <View style={styles.detailInfoCard}>
                {ngoDetails?.address ? (
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="location-outline" size={18} color="#00F0D1" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.detailInfoLabel}>Location</Text>
                      <Text style={styles.detailInfoValue}>{ngoDetails.address}</Text>
                    </View>
                  </View>
                ) : null}
                {profile?.phone ? (
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="call-outline" size={18} color="#00F0D1" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.detailInfoLabel}>Contact</Text>
                      <Text style={styles.detailInfoValue}>{profile.phone}</Text>
                    </View>
                  </View>
                ) : null}
                {establishedDate ? (
                  <View style={[styles.detailInfoRow, { borderBottomWidth: 0 }]}>
                    <Ionicons name="calendar-outline" size={18} color="#00F0D1" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.detailInfoLabel}>Established</Text>
                      <Text style={styles.detailInfoValue}>{establishedDate}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Divider */}
              <View style={styles.detailDivider} />

              {/* Suitable For */}
              <View style={styles.detailSection}>
                <View style={styles.detailSectionRow}>
                  <View style={[styles.detailIconBg, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="paw" size={18} color="#F97316" />
                  </View>
                  <Text style={styles.detailSectionLabel}>Suitable For</Text>
                </View>
                {ngoDetails?.suitableFor && ngoDetails.suitableFor.length > 0 ? (
                  <View style={styles.tagContainer}>
                    {ngoDetails.suitableFor.map((animal) => (
                      <View key={animal} style={styles.tag}>
                        <Text style={styles.tagText}>{animal}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.detailEmptyText}>Not specified</Text>
                )}
              </View>

              {/* Capacity Grid */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailGridBox}>
                  <Ionicons name="bed-outline" size={22} color="#3B82F6" />
                  <Text style={styles.detailGridValue}>{ngoDetails?.beds ?? 0}</Text>
                  <Text style={styles.detailGridLabel}>Beds</Text>
                </View>
                <View style={styles.detailGridBox}>
                  <Ionicons name="home-outline" size={22} color="#10B981" />
                  <Text style={styles.detailGridValue}>{ngoDetails?.animalCapacity ?? 0}</Text>
                  <Text style={styles.detailGridLabel}>Capacity</Text>
                </View>
              </View>
              <View style={styles.detailGridRow}>
                <View style={styles.detailGridBox}>
                  <Ionicons name="people-outline" size={22} color="#8B5CF6" />
                  <Text style={styles.detailGridValue}>{ngoDetails?.totalVolunteers ?? 0}</Text>
                  <Text style={styles.detailGridLabel}>Volunteers</Text>
                </View>
                <View style={styles.detailGridBox}>
                  <Ionicons name="car-outline" size={22} color="#EF4444" />
                  <Text style={styles.detailGridValue}>{ngoDetails?.ambulances ?? 0}</Text>
                  <Text style={styles.detailGridLabel}>Ambulances</Text>
                </View>
              </View>

              {/* Medical */}
              <View style={styles.detailSection}>
                <View style={styles.detailSectionRow}>
                  <View style={[styles.detailIconBg, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="medkit" size={18} color="#059669" />
                  </View>
                  <Text style={styles.detailSectionLabel}>Medical Facilities</Text>
                </View>
                <Text style={styles.detailDescText}>
                  {ngoDetails?.medicalFacilities || 'Not specified'}
                </Text>
              </View>
            </ScrollView>

            {/* Sticky Footer — always visible */}
            <View style={styles.detailsFooter}>
              <TouchableOpacity
                style={styles.detailsEditBtn}
                onPress={() => {
                  setDetailsModalVisible(false);
                  setTimeout(() => openEditModal(), 300);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#1A1C1E" />
                <Text style={styles.detailsEditBtnText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDetailsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8F8' },

  // Header
  headerSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, backgroundColor: '#FFF', borderBottomLeftRadius: 50, borderBottomRightRadius: 50, elevation: 2 },
  profileInfo: { alignItems: 'center' },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#F3F4F6' },
  activePulse: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#00F0D1', borderWidth: 4, borderColor: '#FFF' },
  ngoName: { fontSize: 26, fontWeight: 'bold', color: '#1A1C1E' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 8 },
  nameInput: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E', borderBottomWidth: 2, borderBottomColor: '#00F0D1', paddingVertical: 4, paddingHorizontal: 8, minWidth: 150, textAlign: 'center' },
  nameCheckBtn: { marginLeft: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ngoTitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5 },

  // Stats Row
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: '#FFF', padding: 18, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '600', textAlign: 'center' },

  // See Details Button
  seeDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  seeDetailsBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seeDetailsBtnText: { fontSize: 15, fontWeight: '600', color: '#1A1C1E' },

  // Dashboard Section
  section: { paddingHorizontal: 25, marginTop: 25 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 20, letterSpacing: 2 },
  actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#1A1C1E' },

  logoutBtn: { marginTop: 30, alignItems: 'center', paddingVertical: 18, borderRadius: 24, marginHorizontal: 30, backgroundColor: '#FEF2F2' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 11, marginTop: 30, marginBottom: 50, letterSpacing: 1 },

  // Edit Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBody: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', padding: 25 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 25 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 18 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  chipSelected: { backgroundColor: '#00F0D1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextSelected: { color: '#FFF' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, color: '#1A1C1E' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#00F0D1', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 30 },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
  cancelBtn: { padding: 18, alignItems: 'center', marginTop: 5 },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 15 },

  // Details View Modal
  detailsModalBody: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', padding: 25 },
  detailsModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 20 },
  detailInfoCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 5, marginBottom: 5 },
  detailInfoRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailInfoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  detailInfoValue: { fontSize: 15, fontWeight: '600', color: '#1A1C1E', marginTop: 2 },
  detailDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 18 },
  detailSection: { marginBottom: 20 },
  detailSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailSectionLabel: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
  detailIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detailEmptyText: { fontSize: 13, color: '#D1D5DB', fontStyle: 'italic' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  detailGridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  detailGridBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  detailGridValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E', marginTop: 8 },
  detailGridLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  detailDescText: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  detailsFooter: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15, marginTop: 5 },
  detailsEditBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00F0D1', padding: 18, borderRadius: 16, marginTop: 10 },
  detailsEditBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
});