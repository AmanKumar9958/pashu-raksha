import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import NGODashboard  from '../../components/NGODashboard';
import  CitizenDashboard  from '../../components/CitizenDashboard';
import { API_URL } from '@/constants.js';

export default function HomeScreen() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedForUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) return;

    // If user is not signed in, don't keep spinner forever
    if (!user?.id) {
      fetchedForUserIdRef.current = null;
      setRole(null);
      setLoading(false);
      return;
    }

    // Fetch only once per user id (prevents repeated loading)
    if (fetchedForUserIdRef.current === user.id) return;
    fetchedForUserIdRef.current = user.id;

    const fetchUserRole = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        // Backend se user ka role fetch karein
        const response = await axios.get(`${API_URL}/users/profile/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRole(response.data.data.role); // 'citizen' ya 'NGO'
      } catch (error) {
        console.error("Role fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id, getToken, isUserLoaded, isAuthLoaded]);

  if (!isUserLoaded || !isAuthLoaded || loading) {
    return <ActivityIndicator size="large" color="#00F0D1" style={{flex:1}} />;
  }

  // Yahan se screens split hongi
  return role === 'NGO' ? <NGODashboard userData={user} /> : <CitizenDashboard userData={user} />;

}