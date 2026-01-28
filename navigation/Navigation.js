import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Dimensions } from 'react-native';
import { supabase } from '../lib/supabaseClient';

// Import screens/stacks
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import BienvenueScreen from '../screens/BienvenueScreen';
import RegisterFormScreen from '../screens/RegisterFormScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MainTabs from './MainTabs';
import StackNavigator from './StackNavigator';
import UniteWelcomeScreen from '../screens/UniteWelcomeScreen';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashWait, setSplashWait] = useState(true);

  // Petit délai pour éviter le flash d'Accueil après inscription
  useEffect(() => {
    const timer = setTimeout(() => setSplashWait(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Récupération et écoute de la session Supabase
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth event:", _event);
      setSession(session);
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // Loading écran de démarrage
  if (loading) {
    const size = Math.min(Dimensions.get('window').width, Dimensions.get('window').height) * 0.09;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#fff" }}>
        <ActivityIndicator size={size} color="#FF914D" />
      </View>
    );
  }

  if (splashWait) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      {session ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Accès quand l’utilisateur est connecté */}
          <Stack.Screen name="UniteWelcome" component={UniteWelcomeScreen} />
          <Stack.Screen name="Main" component={StackNavigator} />
          <Stack.Screen name="Bienvenue" component={BienvenueScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Accès quand l’utilisateur n’est PAS connecté */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterFormScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
