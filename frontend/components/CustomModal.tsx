import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomModal({ visible, title, message, type, onConfirm, onCancel }: CustomModalProps) {
  const iconName = type === 'success' ? 'checkmark-circle' : type === 'danger' ? 'log-out' : 'alert-circle';
  const iconColor = type === 'success' ? '#10B981' : type === 'danger' ? '#EF4444' : '#F59E0B';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName as any} size={40} color={iconColor} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: iconColor }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {type === 'danger' ? 'Logout' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', backgroundColor: '#fff', borderRadius: 30, padding: 25, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 10 },
  message: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelText: { fontWeight: 'bold', color: '#666' },
  confirmBtn: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  confirmText: { fontWeight: 'bold', color: '#fff' }
});