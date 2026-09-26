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

// SIGN UP SCREEN

export default function SignUpScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // VALIDATION
  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // REGISTER
  const register = async () => {
    if (!name.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    if (!isEmailValid(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email.trim(),
        password,
      );

      // createUserWithEmailAndPassword doesn't set a name, so store it
      // on the user as displayName with updateProfile
      await userCredential.user.updateProfile({
        displayName: name.trim(),
      });

      Alert.alert('Success', 'Account created!');
      // No navigation needed: App.tsx's onAuthStateChanged sees the
      // new session and switches to MainTabs.
    } catch (error: any) {
      Alert.alert('Register Error', `${error.code}\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE SIGN UP (placeholder)
  const signUpWithGoogle = async () => {
    Alert.alert(
      'Google Sign Up',
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
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#777"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />

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
              placeholder="At least 6 characters"
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

          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#777"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            editable={!loading}
          />

          {/* REGISTER BUTTON */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={register}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OTHER SIGNUP METHODS */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={signUpWithGoogle}
          disabled={loading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* LOGIN LINK */}
        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.loginLink}>Login</Text>
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

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
  },

  loginHint: {
    color: '#8B8B99',
    fontSize: 14,
  },

  loginLink: {
    color: '#D4A017',
    fontSize: 14,
    fontWeight: '700',
  },
});