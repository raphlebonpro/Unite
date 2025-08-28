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

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashWait, setSplashWait] = useState(true);

  // Délai d'une seconde pour éviter le flash Accueil après inscription
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashWait(false);
    }, 1000);
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
console.log("SESSION: ", session);

  if (splashWait) return null;

return (
  <NavigationContainer>
    {session ? (
      <Stack.Navigator initialRouteName="UniteWelcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UniteWelcome" component={UniteWelcomeScreen} />
        <Stack.Screen name="Main" component={StackNavigator} />
        <Stack.Screen name="Bienvenue" component={BienvenueScreen} />
      </Stack.Navigator>
    ) : (
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Bienvenue" component={BienvenueScreen} />
        <Stack.Screen name="RegisterForm" component={RegisterFormScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    )}
  </NavigationContainer>
);
}
