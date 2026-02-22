import React, { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import NGODashboard  from '../../components/NGODashboard';
import  CitizenDashboard  from '../../components/CitizenDashboard';
import { useBackendUserProfile } from '@/lib/useBackendUserProfile';

export default function HomeScreen() {
  const router = useRouter();
  const { role, loading, error, retry, isReady, isSignedIn } = useBackendUserProfile();

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) router.replace('/');
  }, [isReady, isSignedIn, router]);

  if (!isReady || loading) {
    return <ActivityIndicator size="large" color="#00F0D1" style={{flex:1}} />;
  }

  if (!isSignedIn) {
    return null;
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1C1E', textAlign: 'center' }}>
          Couldn’t load your dashboard
        </Text>
        <Text style={{ marginTop: 10, color: '#6B7280', textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={retry}
          style={{ marginTop: 16, backgroundColor: '#00F0D1', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 }}
        >
          <Text style={{ fontWeight: '900', color: '#000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (role === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#00F0D1" />
        <Text style={{ marginTop: 12, color: '#6B7280', textAlign: 'center' }}>
          Loading your dashboard...
        </Text>
        <TouchableOpacity
          onPress={retry}
          style={{ marginTop: 16, backgroundColor: '#00F0D1', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 }}
        >
          <Text style={{ fontWeight: '900', color: '#000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Yahan se screens split hongi
  return String(role).toUpperCase() === 'NGO' ? <NGODashboard /> : <CitizenDashboard />;

}