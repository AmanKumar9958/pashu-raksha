import * as Linking from 'expo-linking';
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [role, setRole] = useState<'Volunteer' | 'NGO'>('Volunteer');
  const [showPassword, setShowPassword] = useState(false);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onGoogleLogin = useCallback(async () => {
    try {
      // Clerk ko batao ki login ke baad kahan aana hai
      const redirectUrl = Linking.createURL('/', { scheme: 'pashu-raksha' });
      
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Note: setActive hone ke baad _layout.tsx ka useEffect 
        // khud user ko /details par redirect kar dega.
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, [startOAuthFlow]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView bouncings={false} showsVerticalScrollIndicator={false}>
        {/* Top Image Section with Gradient Overlay */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e' }} 
            style={styles.headerImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,1)']}
            style={styles.gradient}
          />
          <View style={styles.pawBadge}>
            <Ionicons name="paw" size={20} color="#00F0D1" />
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.subTitle}>Please enter your details to sign in.</Text>

          {/* Role Toggle */}
          <View style={styles.toggleWrapper}>
            <TouchableOpacity 
              style={[styles.toggleBtn, role === 'Volunteer' && styles.activeToggle]}
              onPress={() => setRole('Volunteer')}
            >
              <Text style={[styles.toggleText, role === 'Volunteer' && styles.activeToggleText]}>Volunteer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, role === 'NGO' && styles.activeToggle]}
              onPress={() => setRole('NGO')}
            >
              <Text style={[styles.toggleText, role === 'NGO' && styles.activeToggleText]}>NGO</Text>
            </TouchableOpacity>
          </View>

          {/* Google Button */}
          <TouchableOpacity style={styles.googleBtn} onPress={onGoogleLogin}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} 
              style={styles.googleIcon}
            />
            <Text style={styles.googleText}>Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or continue with</Text>
              <View style={styles.line} />
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput 
                placeholder="name@example.com" 
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput 
                placeholder="........" 
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.forgotPass}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.signInBtn}>
            <Text style={styles.signInText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  imageContainer: { height: height * 0.35, width: '100%' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  pawBadge: { 
    position: 'absolute', top: 50, left: 20, 
    backgroundColor: '#FFF', padding: 10, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  formContainer: { paddingHorizontal: 25, marginTop: -20 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1A1C1E' },
  subTitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 30 },
  toggleWrapper: { 
    flexDirection: 'row', backgroundColor: '#F3F4F6', 
    borderRadius: 25, padding: 5, marginBottom: 30 
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
  activeToggle: { backgroundColor: '#00F0D1' },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  activeToggleText: { color: '#000' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1C1E', marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#F3F4F6'
  },
  input: { flex: 1, paddingVertical: 15, paddingHorizontal: 10, fontSize: 15 },
  forgotPass: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: '#00F0D1', fontSize: 13, fontWeight: '600' },
  signInBtn: { 
    backgroundColor: '#00F0D1', flexDirection: 'row', 
    justifyContent: 'center', alignItems: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 30, marginTop: 10,
    shadowColor: '#00F0D1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  signInText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  orText: { marginHorizontal: 10, color: '#9CA3AF', fontSize: 12 },
  googleBtn: { 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 12, borderWidth: 1, borderColor: '#EEE', paddingVertical: 15, borderRadius: 30
  },
  googleIcon: { width: 20, height: 20 },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1A1C1E' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 40 },
  footerBase: { color: '#9CA3AF', fontSize: 14 },
  signUpText: { color: '#00F0D1', fontSize: 14, fontWeight: 'bold' }
});