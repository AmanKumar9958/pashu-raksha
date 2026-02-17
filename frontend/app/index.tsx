import React, { useState, useCallback } from 'react';
import * as WebBrowser from "expo-web-browser";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
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
  
  // State management
  const [role, setRole] = useState('Volunteer'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth Logic
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onGoogleLoginPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        // Yeh URL app.json ki scheme se match hona chahiye
        redirectUrl: Linking.createURL("/details", { scheme: "pashu-raksha" }),
      });

      if (createdSessionId) {
        setOAuthActive!({ session: createdSessionId });
        // Google se login ke baad onboarding (details) par bhejo
        router.replace("/details");
      }
    } catch (err) {
      console.error("OAuth error", err);
      Alert.alert("Error", "Google Login failed. Please try again.");
    }
  }, [startOAuthFlow]);

  // Email/Password Login Logic
  const onSignInPress = async () => {
    if (!isLoaded) return;
    try {
      const completeSignIn = await signIn.create({ identifier: email, password });
      await setActive({ session: completeSignIn.createdSessionId });
      checkUserStatus(email);
    } catch (err: any) {
      Alert.alert("Login Failed", err.errors[0]?.message || "Check your credentials");
    }
  };

  const checkUserStatus = async (userEmail: string) => {
    try {
      const response = await axios.post(`${API_URL}/users/sync`, { email: userEmail });
      if (response.data.data?.phone) {
        router.replace("/(tabs)");
      } else {
        router.replace("/details");
      }
    } catch (err) {
      router.replace("/details");
    }
  }

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

          <View style={styles.dividerContainer}><View style={styles.line} /><Text style={styles.orText}>Or continue with</Text><View style={styles.line} /></View>

          {/* Working Google Button */}
          <TouchableOpacity style={styles.googleButton} onPress={onGoogleLoginPress}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} 
              style={{ width: 20, height: 20, marginRight: 10, resizeMode: 'contain' }} 
            />
            <Text style={styles.googleButtonText}>Google Login</Text>
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