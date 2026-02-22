import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Dimensions } from 'react-native';
import { supabase } from '../lib/supabaseClient';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterFormScreen from '../screens/RegisterFormScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import UniteWelcomeScreen from '../screens/UniteWelcomeScreen';
import StackNavigator from './StackNavigator';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) {
    const size =
      Math.min(
        Dimensions.get('window').width,
        Dimensions.get('window').height
      ) * 0.09;

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size={size} color="#FE5D02" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        // 🔐 Stack privé
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="UniteWelcome" component={UniteWelcomeScreen} />
          <Stack.Screen name="Main" component={StackNavigator} />
        </Stack.Navigator>
      ) : (
        // 🌍 Stack public
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="Register"
            component={RegisterFormScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
