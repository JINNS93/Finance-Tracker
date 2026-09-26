import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import auth from '@react-native-firebase/auth';
import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/loginscreen';
import SignUpScreen from './src/screens/SignUpScreen';
import { AppProvider } from './src/context/AppContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1a2e' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Inset the top for the status bar; the tab bar handles the bottom */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <AppProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {user ? (
                <Stack.Screen name="MainTabs" component={TabNavigator} />
              ) : (
                // Both Login and SignUp must be registered while signed out,
                // otherwise navigation.navigate('SignUp') fails with
                // "action navigate with payload ... was not handled by any navigator"
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="SignUp" component={SignUpScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0B0F' },
});