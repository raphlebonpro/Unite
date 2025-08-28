// context/UserContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const UserContext = createContext();
const AVATAR_BUCKET = 'avatars'; // adapte si besoin

// (Optionnel) Comportement des notifs reçues quand l’app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const resolvePublicAvatarUrl = useCallback((profile) => {
    if (!profile) return null;
    if (profile.avatar_url && typeof profile.avatar_url === 'string') return profile.avatar_url;
    if (profile.avatar_path && typeof profile.avatar_path === 'string') {
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(profile.avatar_path);
      return data?.publicUrl || null;
    }
    return null;
  }, []);

  // 🔹 Enregistre (ou met à jour) le token Expo pour l’utilisateur connecté
  const registerPushToken = useCallback(async (userId) => {
    try {
      if (!userId) return;

      // Simulateurs : pas de push
      if (!Constants.isDevice) {
        console.log('⚠️ Push désactivé : simulateur détecté.');
        return;
      }

      // Android : créer un channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('⚠️ Permission de notifications refusée.');
        return;
      }

      // Récup token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        Constants?.expoConfig?.projectId ||
        undefined;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      const expoPushToken = tokenData?.data;
      if (!expoPushToken) return;

      console.log('📲 Expo Push Token:', expoPushToken);

      // Éviter les updates inutiles : ne write que si le token a changé
      const { data: existing, error: readErr } = await supabase
        .from('users')
        .select('expo_push_token')
        .eq('id', userId)
        .maybeSingle();

      if (readErr) {
        console.warn('🔎 Lecture expo_push_token échouée (non bloquant):', readErr.message);
      }

      if (existing?.expo_push_token !== expoPushToken) {
        const { error: updErr } = await supabase
          .from('users')
          .update({ expo_push_token: expoPushToken })
          .eq('id', userId);

        if (updErr) {
          console.error('❌ Update expo_push_token échoué:', updErr.message);
        } else {
          console.log('✅ expo_push_token enregistré/actualisé.');
        }
      }
    } catch (e) {
      console.error('❌ registerPushToken error:', e);
    }
  }, []);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    const merged = data ? { ...authUser, ...data } : authUser;
    setUser(merged);
    setAvatarUrl(resolvePublicAvatarUrl(data));
    setLoading(false);

    // 👉 Dès qu’on connaît le user, on s’assure d’avoir un push token stocké
    registerPushToken(authUser.id);
  }, [resolvePublicAvatarUrl, registerPushToken]);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const authUser = data?.user || null;
    await fetchUserProfile(authUser);
  }, [fetchUserProfile]);

  const bumpAvatarVersion = useCallback(() => setAvatarVersion((v) => v + 1), []);

  useEffect(() => {
    let unsub = null;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user || null;
      await fetchUserProfile(authUser);

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const nextAuthUser = session?.user || null;
        await fetchUserProfile(nextAuthUser);
      });
      unsub = authListener?.subscription;
    };

    init();

    return () => {
      if (unsub && typeof unsub.unsubscribe === 'function') unsub.unsubscribe();
    };
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        avatarUrl,
        avatarVersion,
        bumpAvatarVersion,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
