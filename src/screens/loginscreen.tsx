import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import auth from '@react-native-firebase/auth';

// LOGIN SCREEN

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // EMAIL / PASSWORD LOGIN
  const login = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      // No navigation needed: App.tsx's onAuthStateChanged sees the
      // sign-in and switches to MainTabs.
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD: send a Firebase reset email to the address entered above
  const forgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Enter Your Email', 'Type your email above, then tap "Forgot password?" again.');
      return;
    }

    setLoading(true);
    try {
      await auth().sendPasswordResetEmail(trimmed);
      Alert.alert('Check Your Email', `A password reset link has been sent to ${trimmed}.`);
    } catch (error: any) {
      Alert.alert('Reset Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN (placeholder — wire up with
  // @react-native-google-signin/google-signin when ready)
  const loginWithGoogle = async () => {
    Alert.alert(
      'Google Login',
      'Google Sign-In needs to be connected with @react-native-google-signin/google-signin. Let me know when you have the client ID set up and I will wire this up.',
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* LOGO */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FT</Text>
          </View>
          <Text style={styles.appName}>FinTrack</Text>
          <Text style={styles.subtitle}>Login to continue</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#777"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#777"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeBtnInline}
              onPress={() => setShowPassword(prev => !prev)}
            >
              <Text style={styles.eyeTxt}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={forgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={login}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OTHER LOGIN METHODS */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={loginWithGoogle}
          disabled={loading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* SIGN UP LINK */}
        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp' as never)}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 50,
  },

  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logo: {
    width: 80,
    height: 80,
    marginBottom: 14,
  },

  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#15151C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#D4A017',
  },

  logoText: {
    color: '#D4A017',
    fontSize: 26,
    fontWeight: 'bold',
  },

  appName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#8B8B99',
    fontSize: 14,
    marginTop: 6,
  },

  form: {
    backgroundColor: '#15151C',
    borderRadius: 20,
    padding: 20,
  },

  fieldLabel: {
    color: '#8B8B99',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },

  input: {
    backgroundColor: '#0B0B0F',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 15,
  },

  passwordInputWrapper: {
    backgroundColor: '#0B0B0F',
    borderRadius: 14,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },

  eyeBtnInline: {
    paddingHorizontal: 14,
  },

  eyeTxt: {
    fontSize: 18,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 6,
  },

  forgotTxt: {
    color: '#D4A017',
    fontSize: 13,
  },

  button: {
    backgroundColor: '#D4A017',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#23232D',
  },

  dividerText: {
    color: '#8B8B99',
    fontSize: 12,
  },

  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#15151C',
    borderWidth: 1,
    borderColor: '#23232D',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  googleIcon: {
    color: '#D4A017',
    fontSize: 18,
    fontWeight: 'bold',
  },

  googleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
  },

  signupHint: {
    color: '#8B8B99',
    fontSize: 14,
  },

  signupLink: {
    color: '#D4A017',
    fontSize: 14,
    fontWeight: '700',
  },
});