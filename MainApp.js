import React, { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, Platform, Alert } from 'react-native';
import Navigation from './navigation/Navigation';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { supabase } from './lib/supabaseClient';
import { useUser } from './context/UserContext';
import { useColorScheme } from 'react-native';
import SafeTop from './components/SafeTop';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 🔔 Handler global des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ Enregistrement du token push
async function registerForPushNotificationsAsync(userId) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications Unite',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6C4A',
        showBadge: true,
      });
    }

    // 📍 Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications désactivées',
        'Active-les dans les paramètres Android pour recevoir les alertes Unite.'
      );
      return;
    }

    // 📲 Token Expo (nécessaire pour Expo Push API)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId:
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId,
    });
    const expoPushToken = tokenData?.data;
    console.log('📲 Token Expo obtenu :', expoPushToken);

    // 🔥 Token FCM natif (debug Android)
    if (Platform.OS === 'android') {
      const fcm = await Notifications.getDevicePushTokenAsync();
      console.log('🔥 Token FCM brut :', fcm?.data || 'Non disponible');
    }

    // 🧱 Sauvegarde dans Supabase
    if (expoPushToken && userId) {
      const { error } = await supabase
        .from('users')
        .update({ expo_push_token: expoPushToken })
        .eq('id', userId);
      if (error) console.warn('⚠️ Erreur update token Supabase :', error.message);
      else console.log('✅ Token enregistré dans Supabase');
    }
  } catch (e) {
    console.error('❌ registerForPushNotificationsAsync error:', e.message);
  }
}

export default function MainApp() {
  const { user } = useUser();
  const notificationListener = useRef();
  const responseListener = useRef();
  const colorScheme = useColorScheme();

  // 🔒 Orientation portrait
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  }, []);

  // 🧱 Harmonisation Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      import('expo-system-ui').then(SystemUI => {
        SystemUI.setBackgroundColorAsync('#FFFFFF');
      });
      NavigationBar.setBackgroundColorAsync('#FFFFFF');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  // 📲 Enregistrement du token utilisateur
  useEffect(() => {
    (async () => {
      if (user?.id) await registerForPushNotificationsAsync(user.id);
    })();
  }, [user]);

  // 🎧 Réception & réponse aux notifs
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        Toast.show({
          type: 'success',
          text1: notification.request.content.title,
          text2: notification.request.content.body,
          position: 'top',
          visibilityTime: 3000,
        });
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('➡️ Réponse à la notif :', response);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

return (
    <SafeAreaProvider>
      <SafeTop>
        <PaperProvider>
          <Navigation />
          <Toast />
        </PaperProvider>
      </SafeTop>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
