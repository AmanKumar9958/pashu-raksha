import { useAuth, useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';

export type BackendRole = 'citizen' | 'NGO';

export type BackendUserProfile = {
  _id: string;
  clerkId: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: BackendRole;
  ngoDetails?: {
    isVerified?: boolean;
    specialization?: string[];
    availableUnits?: number;
    address?: string;
  };
};

export function useBackendUserProfile() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  const [profile, setProfile] = useState<BackendUserProfile | null>(null);
  const [role, setRole] = useState<BackendRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Isse baar-baar फालतू API calls nahi hongi
  const fetchedForUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async () => {
    // 1. Agar Clerk abhi load hi nahi hua, toh ruko
    if (!isUserLoaded || !isAuthLoaded) return;

    // 2. Agar user signed in nahi hai, toh state clear karo aur ruko
    if (!isSignedIn || !user?.id) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      fetchedForUserIdRef.current = null;
      return;
    }

    // 3. Agar wahi user hai jiska data pehle se hai, toh dubara fetch mat karo
    if (fetchedForUserIdRef.current === user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/users/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const data = response.data?.data as BackendUserProfile;
      
      setProfile(data);
      // Backend se jo role aaye use normalize karke save karo
      setRole(data?.role === 'NGO' ? 'NGO' : 'citizen');
      
      fetchedForUserIdRef.current = user.id;
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        // User backend mein nahi hai (Shayad naya user hai)
        setProfile(null);
        setRole('citizen'); // Default role
      } else {
        setError(e.message || 'Error fetching profile');
      }
    } finally {
      setLoading(false);
    }
  }, [isUserLoaded, isAuthLoaded, isSignedIn, user?.id, getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    role,
    loading,
    error,
    isReady: isUserLoaded && isAuthLoaded && !loading,
    refetch: () => {
      fetchedForUserIdRef.current = null;
      fetchProfile();
    }
  };
}