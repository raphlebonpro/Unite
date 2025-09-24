import React, { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, useColorScheme, Platform } from 'react-native';
import Navigation from './navigation/Navigation';
import { UserProvider, useUser } from './context/UserContext';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import { supabase } from './lib/supabaseClient';
import { NotificationProvider } from './context/NotificationContext';

// 🔔 Handler global obligatoire pour iOS/foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // ✅ nouvelle API iOS
    shouldShowList: true,    // ✅ nouvelle API iOS
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensurePushTokenIsSaved(userId) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Permission push refusée');
    return;
  }

  // ✅ Récupère toujours un token à jour
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenData.data;

  if (!expoPushToken) {
    console.log('⚠️ Aucun token Expo récupéré');
    return;
  }

  // ✅ Sauvegarde systématiquement (pas seulement si différent)
  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: expoPushToken })
    .eq('id', userId);

  if (error) {
    console.log('❌ Erreur lors de la sauvegarde du token push :', error.message);
  } else {
    console.log('✅ Expo push token mis à jour en BDD :', expoPushToken);
  }
}

function MainApp() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);

    (async () => {
      if (!user?.id) return;

      // 🔹 Sauvegarde le token dès que l’utilisateur est loggé
      await ensurePushTokenIsSaved(user.id);

      // 🔹 Canal Android obligatoire
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    // 🔹 Listener réception foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      Toast.show({
        type: 'success',
        text1: notification.request.content.title,
        text2: notification.request.content.body,
        position: 'top',
        visibilityTime: 3000,
      });
      console.log('📩 Notification reçue (foreground):', notification);
    });

    // 🔹 Listener click sur notif
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
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

export default function App() {
  return (
    <UserProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
