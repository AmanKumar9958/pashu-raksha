import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as WebBrowser from "expo-web-browser";
import { useAuth, useSignIn, useOAuth, useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, ScrollView, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '@/constants';

// Browser session complete karne ke liye (Important for OAuth)
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const routedForUserIdRef = useRef<string | null>(null);
  const [routing, setRouting] = useState(false);
  
  // State management
  const [role, setRole] = useState('Volunteer'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth Logic
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const routeAfterLogin = useCallback(async () => {
    if (!authLoaded || !userLoaded || !isSignedIn || !user?.id) return;

    // Only route once per signed-in user id
    if (routedForUserIdRef.current === user.id) return;
    routedForUserIdRef.current = user.id;

    setRouting(true);
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/users/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.data?.phone) {
        router.replace('/(tabs)');
      } else {
        router.replace('/details');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      // If user is not in DB yet, send to onboarding details
      if (status === 404) {
        router.replace('/details');
      } else {
        console.error('Post-login profile check error:', err);
        router.replace('/details');
      }
    } finally {
      setRouting(false);
    }
  }, [authLoaded, getToken, isSignedIn, router, user?.id, userLoaded]);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    if (!isSignedIn) return;
    routeAfterLogin();
  }, [authLoaded, isSignedIn, routeAfterLogin, userLoaded]);

  const onGoogleLoginPress = useCallback(async () => {
    try {
      // Avoid starting a new OAuth flow if a session already exists.
      if (authLoaded && isSignedIn) {
        routeAfterLogin();
        return;
      }

      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        // Yeh URL app.json ki scheme se match hona chahiye
        redirectUrl: Linking.createURL("/", { scheme: "pashu-raksha" }),
      });

      if (createdSessionId) {
        setOAuthActive!({ session: createdSessionId });
        // After session is active, route based on existing profile
        routeAfterLogin();
      }
    } catch (err) {
      console.error("OAuth error", err);
      const message = (err as any)?.errors?.[0]?.message || (err as any)?.message || '';
      if (typeof message === 'string' && message.toLowerCase().includes('already signed in')) {
        routeAfterLogin();
        return;
      }
      Alert.alert("Error", "Google Login failed. Please try again.");
    }
  }, [authLoaded, isSignedIn, routeAfterLogin, startOAuthFlow]);

  // If auth state isn't ready yet, avoid rendering the login UI to prevent a flash.
  if (!authLoaded) {
    return null;
  }

  // While signed in, we immediately route based on profile
  if (isSignedIn || routing) {
    return null;
  }

  // Email/Password Login Logic
  const onSignInPress = async () => {
    if (!isLoaded) return;
    try {
      const completeSignIn = await signIn.create({ identifier: email, password });
      await setActive({ session: completeSignIn.createdSessionId });
      routeAfterLogin();
    } catch (err: any) {
      Alert.alert("Login Failed", err.errors[0]?.message || "Check your credentials");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.headerImageContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e' }} style={styles.headerImage} />
          <View style={styles.iconBadge}><Ionicons name="paw" size={20} color="#00F0D1" /></View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subText}>Please enter your details to sign in.</Text>

          {/* Role Toggle */}
          <View style={styles.toggleContainer}>
            {['Volunteer', 'NGO'].map((r) => (
              <TouchableOpacity key={r} style={[styles.toggleButton, role === r && styles.activeToggle]} onPress={() => setRole(r)}>
                <Text style={[styles.toggleText, role === r && styles.activeToggleText]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Working Google Button */}
          <TouchableOpacity style={styles.googleButton} onPress={onGoogleLoginPress}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} 
              style={{ width: 20, height: 20, marginRight: 10, resizeMode: 'contain' }} 
            />
            <Text style={styles.googleButtonText}>Google Login</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}><View style={styles.line} /><Text style={styles.orText}>Or continue with</Text><View style={styles.line} /></View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="........" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={onSignInPress}>
            <Text style={styles.signInButtonText}>Sign In  →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff' },
  headerImageContainer: { height: 320, width: '100%', position: 'relative' },
  headerImage: { width: '100%', height: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  iconBadge: { position: 'absolute', top: 55, left: 25, backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 10 },
  formContainer: { paddingHorizontal: 25, paddingTop: 30, paddingBottom: 40, backgroundColor: '#fff', marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1A1C1E' },
  subText: { textAlign: 'center', color: '#666', marginBottom: 30, fontSize: 15 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F5F7F9', borderRadius: 25, padding: 6, marginBottom: 30 },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
  activeToggle: { backgroundColor: '#00F0D1' },
  toggleText: { color: '#666', fontWeight: 'bold' },
  activeToggleText: { color: '#000' },
  inputWrapper: { marginBottom: 20 },
  label: { marginBottom: 8, fontWeight: '600', color: '#333', fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7F9', borderRadius: 15, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#000' },
  signInButton: { backgroundColor: '#00F0D1', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  signInButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  orText: { marginHorizontal: 15, color: '#999', fontSize: 13 },
  googleButton: { flexDirection: 'row', borderWidth: 1, borderColor: '#EEE', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  googleButtonText: { fontWeight: '600', color: '#333' },
});