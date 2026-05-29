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

        {/* 1. Premium Profile Header Section */}
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

            {/* Location, Phone & Established Date */}
            <View style={styles.metaRow}>
              {ngoDetails?.address ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.metaText}>{ngoDetails.address}</Text>
                </View>
              ) : null}
              {profile?.phone ? (
                <View style={styles.metaItem}>
                  <Ionicons name="call-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.metaText}>{profile.phone}</Text>
                </View>
              ) : null}
              {establishedDate ? (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.metaText}>Est. {establishedDate}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* 2. Stats Boxes — Active / Solved / Transferred */}
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

        {/* 3. Facility Details Section */}
        <View style={styles.facilitySection}>
          <View style={styles.facilitySectionHeader}>
            <Text style={styles.facilitySectionTitle}>Facility Details</Text>
            <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
              <Ionicons name="create-outline" size={16} color="#00F0D1" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Suitable For Tags */}
          {ngoDetails?.suitableFor && ngoDetails.suitableFor.length > 0 ? (
            <View style={styles.facilityCard}>
              <View style={styles.facilityRow}>
                <View style={[styles.facilityIconBg, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="paw" size={18} color="#F97316" />
                </View>
                <Text style={styles.facilityLabel}>Suitable For</Text>
              </View>
              <View style={styles.tagContainer}>
                {ngoDetails.suitableFor.map((animal) => (
                  <View key={animal} style={styles.tag}>
                    <Text style={styles.tagText}>{animal}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Capacity & Resources Grid */}
          <View style={styles.facilityGrid}>
            <View style={styles.facilityGridItem}>
              <View style={[styles.facilityIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="bed-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.facilityGridValue}>{ngoDetails?.beds ?? 0}</Text>
              <Text style={styles.facilityGridLabel}>Beds</Text>
            </View>
            <View style={styles.facilityGridItem}>
              <View style={[styles.facilityIconBg, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="home-outline" size={18} color="#10B981" />
              </View>
              <Text style={styles.facilityGridValue}>{ngoDetails?.animalCapacity ?? 0}</Text>
              <Text style={styles.facilityGridLabel}>Capacity</Text>
            </View>
            <View style={styles.facilityGridItem}>
              <View style={[styles.facilityIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="people-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.facilityGridValue}>{ngoDetails?.totalVolunteers ?? 0}</Text>
              <Text style={styles.facilityGridLabel}>Volunteers</Text>
            </View>
            <View style={styles.facilityGridItem}>
              <View style={[styles.facilityIconBg, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="car-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.facilityGridValue}>{ngoDetails?.ambulances ?? 0}</Text>
              <Text style={styles.facilityGridLabel}>Ambulances</Text>
            </View>
          </View>

          {/* Medical Facilities */}
          {ngoDetails?.medicalFacilities ? (
            <View style={styles.facilityCard}>
              <View style={styles.facilityRow}>
                <View style={[styles.facilityIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="medkit" size={18} color="#059669" />
                </View>
                <Text style={styles.facilityLabel}>Medical Facilities</Text>
              </View>
              <Text style={styles.medicalText}>{ngoDetails.medicalFacilities}</Text>
            </View>
          ) : null}
        </View>

        {/* 4. NGO Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NGO DASHBOARD</Text>

          <TouchableOpacity style={styles.actionItem} onPress={openEditModal}>
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

              {/* Numeric Fields */}
              <Text style={styles.fieldLabel}>Number of Beds</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={beds}
                onChangeText={setBeds}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
              />

              <Text style={styles.fieldLabel}>Total Animal Capacity</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={animalCapacity}
                onChangeText={setAnimalCapacity}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
              />

              <Text style={styles.fieldLabel}>Total Volunteers</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={totalVolunteers}
                onChangeText={setTotalVolunteers}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
              />

              <Text style={styles.fieldLabel}>Number of Ambulances</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={ambulances}
                onChangeText={setAmbulances}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
              />

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

              {/* Save Button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#1A1C1E" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Details</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
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
  metaRow: { alignItems: 'center', marginTop: 12, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#9CA3AF' },

  // Stats Row
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: '#FFF', padding: 18, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '600', textAlign: 'center' },

  // Facility Section
  facilitySection: { marginTop: 25, paddingHorizontal: 20 },
  facilitySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  facilitySectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#00F0D1' },

  facilityCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  facilityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  facilityIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  facilityLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563' },

  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },

  facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  facilityGridItem: { width: '47%', backgroundColor: '#FFF', borderRadius: 20, padding: 18, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  facilityGridValue: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E', marginTop: 10 },
  facilityGridLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },

  medicalText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },

  // Dashboard Section
  section: { paddingHorizontal: 25, marginTop: 10 },
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
});