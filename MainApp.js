import React, { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, useColorScheme, Platform, Alert } from 'react-native';
import Navigation from './navigation/Navigation';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import Constants from 'expo-constants';
import { supabase } from './lib/supabaseClient';
import { useUser } from './context/UserContext';

// 🔔 Handler global pour le comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ Fonction robuste d'enregistrement du token
async function registerForPushNotificationsAsync(userId) {
  try {
    // 1️⃣ Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        "Notifications désactivées",
        "Active-les dans les paramètres Android pour recevoir les alertes Unite."
      );
      return;
    }

    // 2️⃣ Canal Android (obligatoire avant le token)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications Unite',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6C4A',
        showBadge: true,
      });
    }

    // 3️⃣ Token Expo lié à ton projectId (⚠️ sinon pas de push Android)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    const expoPushToken = tokenData?.data;

    if (!expoPushToken) {
      console.warn('❌ Aucun token Expo récupéré.');
      return;
    }

    console.log('✅ Expo Push Token obtenu :', expoPushToken);

    // 4️⃣ Enregistre le token dans Supabase
    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: expoPushToken })
      .eq('id', userId);

    if (error) console.warn('⚠️ Erreur update token Supabase :', error.message);
  } catch (e) {
    console.error('❌ registerForPushNotificationsAsync error:', e.message);
  }
}

export default function MainApp() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const notificationListener = useRef();
  const responseListener = useRef();

  // 🔒 Orientation portrait uniquement
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  }, []);

  // 📲 Enregistrement du token utilisateur
  useEffect(() => {
    (async () => {
      if (user?.id) {
        await registerForPushNotificationsAsync(user.id);
      }
    })();
  }, [user]);

  // 🎧 Réception et interaction avec les notifs
  useEffect(() => {
    // Affiche un toast à la réception
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      Toast.show({
        type: 'success',
        text1: notification.request.content.title,
        text2: notification.request.content.body,
        position: 'top',
        visibilityTime: 3000,
      });
    });

    // Log lorsqu'un utilisateur interagit avec la notif
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('➡️ Réponse à la notif :', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <PaperProvider>
        <Navigation />
        <Toast />
      </PaperProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});