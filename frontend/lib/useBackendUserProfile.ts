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
    createdAt?: string;
  };
};

const normalizeRole = (role: unknown): BackendRole => {
  return String(role).toUpperCase() === 'NGO' ? 'NGO' : 'citizen';
};

export function useBackendUserProfile() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  const [profile, setProfile] = useState<BackendUserProfile | null>(null);
  const [role, setRole] = useState<BackendRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedForUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isUserLoaded || !isAuthLoaded) return;

    if (!isSignedIn || !user?.id) {
      fetchedForUserIdRef.current = null;
      setProfile(null);
      setRole(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (fetchedForUserIdRef.current === user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });
      const response = await axios.get(`${API_URL}/users/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const data = (response.data?.data || null) as BackendUserProfile | null;
      setProfile(data);
      setRole(normalizeRole(data?.role));
      fetchedForUserIdRef.current = user.id;
    } catch (e: any) {
      const status = e?.response?.status;
      // If profile doesn't exist yet, let UI prompt to complete details.
      if (status === 404) {
        setProfile(null);
        setRole(null);
        setError('Profile not found');
      } else if (status === 401 || status === 403) {
        setError('Authentication failed');
      } else {
        setError(e?.response?.data?.message || e?.message || 'Network error');
      }
      fetchedForUserIdRef.current = user.id;
    } finally {
      setLoading(false);
    }
  }, [getToken, isAuthLoaded, isSignedIn, isUserLoaded, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const retry = useCallback(() => {
    fetchedForUserIdRef.current = null;
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    role: isSignedIn ? role : 'citizen', 
    loading: loading || !isAuthLoaded,
    error,
    retry,
    isReady: isUserLoaded && isAuthLoaded,
    isSignedIn,
    clerkId: user?.id || null,
  };
}
