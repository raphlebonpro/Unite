import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Platform, Alert } from 'react-native';
import Navigation from './navigation/Navigation';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import Constants from 'expo-constants';
import { supabase } from './lib/supabaseClient';
import { useUser } from './context/UserContext';
import { useColorScheme } from 'react-native';
import SafeTop from './components/SafeTop';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigate } from './navigation/navigationRef';
import { useChatActivity } from './context/ChatActivityContext';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import * as IntentLauncher from 'expo-intent-launcher';
import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';

console.log("MAINAPP VERSION TEST STORE V3");

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
  const responseListener = useRef();
  const colorScheme = useColorScheme();
  const { activeSessionChatId, activeGroupChatId } = useChatActivity();
  const [pendingStoreRedirect, setPendingStoreRedirect] = useState(false);

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
  try {
    Settings.initializeSDK();
    AppEventsLogger.logEvent('fb_mobile_activate_app');
    console.log('Meta SDK initialisé');
  } catch (e) {
    console.warn('Meta SDK init error:', e.message);
  }
}, []);

useEffect(() => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification?.request?.content?.data;

      // 🚫 Pas de notif si on est DÉJÀ dans le chat session
      if (
        data?.type === 'new_message' &&
        data?.session_id &&
        data.session_id === activeSessionChatId
      ) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      // 🚫 Pas de notif si on est DÉJÀ dans le chat groupe
      if (
        data?.type === 'group_new_message' &&
        data?.group_id &&
        data.group_id === activeGroupChatId
      ) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      // ✅ Sinon notif normale
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });
}, [activeSessionChatId, activeGroupChatId]);

useEffect(() => {
  responseListener.current =
    Notifications.addNotificationResponseReceivedListener(async (response) => {

      let data = response?.notification?.request?.content?.data;

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {}
      }

      if (!data?.type) return;

      // 🔁 APP UPDATE → REDIRECTION STORE
      if (data.type === 'app_update') {
        if (Platform.OS === 'ios') {
          await Linking.openURL('itms-apps://itunes.apple.com/app/id6755112837');
        } else {
          try {
            await IntentLauncher.startActivityAsync(
              'android.intent.action.VIEW',
              {
                data: 'market://details?id=com.uniteapp.collectif',
                packageName: 'com.android.vending',
              }
            );
          } catch {
            await Linking.openURL(
              'https://play.google.com/store/apps/details?id=com.uniteapp.collectif'
            );
          }
        }
        return;
      }

      // 💬 Message session
      if (data.type === 'new_message' && data.session_id) {
        navigate('SessionMessages', {
          sessionId: data.session_id,
          fromNotification: true,
        });
        return;
      }

      // 💬 Message groupe
      if (data.type === 'group_new_message' && data.group_id) {
        navigate('GroupChat', {
          groupId: data.group_id,
          fromNotification: true,
        });
        return;
      }

      // fallback
      if (data.session_id) {
        navigate('SessionDetail', {
          sessionId: data.session_id,
          fromNotification: true,
        });
      }
    });

  return () => responseListener.current?.remove();
}, []);


useEffect(() => {
  const checkAppVersion = async () => {
    try {
      const currentVersion = Application.nativeApplicationVersion;

      const { data, error } = await supabase
        .from('app_config')
        .select('latest_version')
        .single();

      if (error || !data?.latest_version) return;

      const isOlder = (v1, v2) => {
        const a = v1.split('.').map(Number);
        const b = v2.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if ((a[i] || 0) < (b[i] || 0)) return true;
          if ((a[i] || 0) > (b[i] || 0)) return false;
        }
        return false;
      };

      if (isOlder(currentVersion, data.latest_version)) {
        Alert.alert(
          'Nouvelle version disponible',
          'Une mise à jour de Unite est disponible avec des améliorations.',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Mettre à jour',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('https://apps.apple.com/us/app/uniteapp/id6755112837');
                } else {
                  Linking.openURL('https://play.google.com/store/apps/details?id=com.uniteapp.collectif');
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      console.warn('Erreur check version:', e.message);
    }
  };

  checkAppVersion();
}, []);

useEffect(() => {
  // Gère le deep link si l'app est déjà ouverte
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  // Gère le deep link si l'app était fermée
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);

const handleDeepLink = (url) => {
  if (!url) return;
  const parsed = Linking.parse(url);
  // unite://session/ID
  if (parsed.scheme === 'unite' && parsed.hostname === 'session' && parsed.path) {
    const sessionId = parsed.path.replace(/^\//, '');
    navigate('SessionDetail', { sessionId });
  }
  // unite://group/ID
  if (parsed.scheme === 'unite' && parsed.hostname === 'group' && parsed.path) {
    const groupId = parsed.path.replace(/^\//, '');
    navigate('GroupDetail', { groupId });
  }
};

return (
    <SafeAreaProvider>
      <SafeTop>
        <PaperProvider>
          <Navigation />
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
