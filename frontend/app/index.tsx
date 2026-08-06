import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
  Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '../constants';

const { height } = Dimensions.get('window');

// Ensure WebBrowser completes auth session on native platforms
WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const CLERK_SECRET_KEY =
  process.env.EXPO_PUBLIC_CLERK_SECRET_KEY ||
  'sk_test_4xmZiamtrjSx6gjiQKTlgKlhAyaAqOa0gC4Ikxqh20';

export default function LoginScreen() {
  useWarmUpBrowser();

  const [role, setRole] = useState<'Volunteer' | 'NGO'>('Volunteer');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();

  const handleRoleSelect = (selectedRole: 'Volunteer' | 'NGO') => {
    setRole(selectedRole);
    SecureStore.setItemAsync('user_selected_role', selectedRole).catch(() => {});
  };

  const onGoogleLogin = useCallback(async () => {
    if (isGoogleLoading || isLoggingIn) return;
    setIsGoogleLoading(true);

    try {
      await SecureStore.setItemAsync('user_selected_role', role);
      const redirectUrl = Linking.createURL('/', { scheme: 'pashu-raksha' });

      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl: redirectUrl,
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error("OAuth error", err);
      const errMsg = err?.errors?.[0]?.longMessage || err?.message || "Google sign-in was cancelled or failed.";
      Alert.alert("Google Sign In", errMsg);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [startOAuthFlow, role, isGoogleLoading, isLoggingIn]);

  const onSignInPress = useCallback(async () => {
    if (!isSignInLoaded) {
      Alert.alert("Please wait", "Authentication service is initializing. Please try again in a moment.");
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoggingIn(true);
    try {
      await SecureStore.setItemAsync('user_selected_role', role);
      const trimmedEmail = email.trim().toLowerCase();

      // Reviewer account handling to bypass 2FA / OTP challenges
      if (trimmedEmail === 'reviewer@pashuraksha.com' && password === 'AppTest2026') {
        const tokenResponse = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: 'user_3G59MhMkFRFWnIgHsS00l2Q3T4i' }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData?.token) {
          console.error("Sign-in token error:", tokenData);
          Alert.alert("Sign In Failed", "Could not generate sign-in token. Please try again.");
          return;
        }

        const result = await signIn.create({
          strategy: 'ticket',
          ticket: tokenData.token,
        });

        if (result.status === 'complete' && result.createdSessionId) {
          // Pre-sync reviewer profile for selected role so routing goes directly to corresponding dashboard
          try {
            const reviewerPayload = {
              clerkId: 'user_3G59MhMkFRFWnIgHsS00l2Q3T4i',
              name: role === 'NGO' ? 'App Reviewer (NGO)' : 'App Reviewer',
              email: 'reviewer@pashuraksha.com',
              phone: '9999999999',
              role: role === 'NGO' ? 'NGO' : 'citizen',
              ...(role === 'NGO' && {
                location: {
                  type: 'Point',
                  coordinates: [77.2090, 28.6139]
                },
                ngoDetails: { address: 'Animal Rescue Center, New Delhi', isVerified: true }
              })
            };

            await axios.post(`${API_URL}/users/sync`, reviewerPayload, { timeout: 15000 }).catch(() => {});
          } catch (syncErr) {
            // Non-blocking sync attempt
          }

          await setActive({ session: result.createdSessionId });
        } else {
          Alert.alert("Sign In Failed", `Status: ${result.status}`);
        }
        return;
      }

      // Standard password flow for regular users
      const signInAttempt = await signIn.create({
        identifier: trimmedEmail,
        password,
      });

      if (signInAttempt.status === 'complete' && signInAttempt.createdSessionId) {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.warn("Sign in status not complete", signInAttempt.status);
        Alert.alert("Sign In Failed", `Status: ${signInAttempt.status}`);
      }
    } catch (err: any) {
      console.error("Sign in error", err);
      const errMsg = err.errors?.[0]?.longMessage || err.message || "An error occurred during sign in.";
      Alert.alert("Sign In Failed", errMsg);
    } finally {
      setIsLoggingIn(false);
    }
  }, [isSignInLoaded, email, password, role, signIn, setActive]);

  const onForgotPasswordPress = () => {
    if (email.trim()) {
      Alert.alert(
        "Reset Password",
        `A password reset link can be sent to ${email.trim()}. Would you like to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send Reset Link",
            onPress: async () => {
              try {
                if (signIn) {
                  await signIn.create({
                    strategy: "reset_password_email_code",
                    identifier: email.trim(),
                  });
                  Alert.alert("Success", "Password reset instructions have been sent to your email.");
                }
              } catch (e: any) {
                Alert.alert("Password Reset", e?.errors?.[0]?.longMessage || e?.message || "Please contact support@pashuraksha.com for assistance.");
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Forgot Password",
        "Please enter your email address above to receive password reset instructions, or contact support@pashuraksha.com."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Top Image Section with Gradient Overlay */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/header-image.jpg')}
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
              onPress={() => handleRoleSelect('Volunteer')}
              disabled={isLoggingIn || isGoogleLoading}
            >
              <Text style={[styles.toggleText, role === 'Volunteer' && styles.activeToggleText]}>Volunteer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, role === 'NGO' && styles.activeToggle]}
              onPress={() => handleRoleSelect('NGO')}
              disabled={isLoggingIn || isGoogleLoading}
            >
              <Text style={[styles.toggleText, role === 'NGO' && styles.activeToggleText]}>NGO</Text>
            </TouchableOpacity>
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleBtn, (isGoogleLoading || isLoggingIn) && { opacity: 0.7 }]}
            onPress={onGoogleLogin}
            disabled={isGoogleLoading || isLoggingIn}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#1A1C1E" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleText}>Google</Text>
              </>
            )}
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
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoggingIn && !isGoogleLoading}
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
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                editable={!isLoggingIn && !isGoogleLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoggingIn || isGoogleLoading}
              >
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.forgotPass}
              onPress={onForgotPasswordPress}
              disabled={isLoggingIn || isGoogleLoading}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, (isLoggingIn || isGoogleLoading) && { opacity: 0.7 }]}
            onPress={onSignInPress}
            disabled={isLoggingIn || isGoogleLoading}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={styles.signInText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </>
            )}
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
  input: { flex: 1, paddingVertical: 15, paddingHorizontal: 10, fontSize: 15, color: '#1A1C1E' },
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