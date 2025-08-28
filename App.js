import React, { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, useColorScheme, Platform, Alert } from 'react-native';
import Navigation from './navigation/Navigation';
import { UserProvider, useUser } from './context/UserContext';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import { supabase } from './lib/supabaseClient';
import { NotificationProvider } from './context/NotificationContext';


async function ensurePushTokenIsSaved(userId, savedToken) {
 const { status } = await Notifications.getPermissionsAsync();
 if (status !== 'granted') return;
 const tokenData = await Notifications.getExpoPushTokenAsync();
 const expoPushToken = tokenData.data;
 if (!expoPushToken) return;
 if (expoPushToken !== savedToken) {
   const { error } = await supabase
     .from('users')
     .update({ expo_push_token: expoPushToken })
     .eq('id', userId);
   if (error) {
     console.log('Erreur lors de la sauvegarde du token push :', error.message);
   } else {
     console.log('Expo push token mis à jour en BDD');
   }
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
     if (!user || !user.id) return;
     const { data: userData } = await supabase
       .from('users')
       .select('expo_push_token')
       .eq('id', user.id)
       .single();
     const savedToken = userData?.expo_push_token || null;
     await ensurePushTokenIsSaved(user.id, savedToken);
     if (Platform.OS === 'android') {
       Notifications.setNotificationChannelAsync('default', {
         name: 'default',
         importance: Notifications.AndroidImportance.MAX,
         vibrationPattern: [0, 250, 250, 250],
         lightColor: '#FF231F7C',
       });
     }
   })();
 }, [user]);


 useEffect(() => {
   notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
     // 👉 Affiche le toast !
     Toast.show({
       type: 'success',
       text1: notification.request.content.title,
       text2: notification.request.content.body,
       position: 'top',
       visibilityTime: 3000,
     });
     console.log('Notification reçue (app ouverte):', notification);
   });


   responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
     console.log('Réponse à la notif :', response);
   });


   return () => {
     Notifications.removeNotificationSubscription(notificationListener.current);
     Notifications.removeNotificationSubscription(responseListener.current);
   };
 }, []);


return (
 <SafeAreaView style={[styles.safe, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
   <PaperProvider>
     <NotificationProvider>
       <Navigation />
     </NotificationProvider>
     <Toast />
   </PaperProvider>
 </SafeAreaView>
);
}


export default function App() {
 return (
   <UserProvider>
      <MainApp />
   </UserProvider>
  );
}


const styles = StyleSheet.create({
 safe: { flex: 1 },
});
