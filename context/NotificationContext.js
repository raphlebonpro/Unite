import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import * as Notifications from 'expo-notifications';
import { useUser } from './UserContext'; // ✅ on récupère l’utilisateur du UserProvider

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user, loading: userLoading } = useUser(); // ✅ attend que le user soit prêt
  const [notifUnseen, setNotifUnseen] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- Récupère le nombre de notifications non lues
  const fetchUnread = async () => {
    if (!user?.id) {
      setNotifUnseen(0);
      setLoading(false);
      return;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifUnseen(count || 0);
    } else {
      console.error('❌ Erreur fetchUnread:', error);
      setNotifUnseen(0);
    }
    setLoading(false);
  };

  // --- Abonnement realtime + polling (uniquement quand le user est prêt)
  useEffect(() => {
    if (userLoading || !user?.id) return; // ⏳ attend que le UserContext soit chargé

    let channel;
    let interval;

    const init = async () => {
      await fetchUnread();

      // --- Abonnement aux changements sur la table notifications
      channel = supabase
        .channel('notif_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await fetchUnread();
          }
        )
        .subscribe((status) => {
          console.log('📡 Canal notifications :', status);
        });

      // --- Sécurité : rafraîchit toutes les 5 secondes
      interval = setInterval(fetchUnread, 5000);

      setLoading(false);
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (interval) clearInterval(interval);
    };
  }, [user?.id, userLoading]);

  // --- Mise à jour du badge sur l’icône (Android + iOS)
  useEffect(() => {
    async function updateBadge() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            showBadge: true,
          });
        }
        await Notifications.setBadgeCountAsync(notifUnseen);
      } catch (err) {
        console.warn('⚠️ Erreur setBadgeCountAsync', err);
      }
    }

    updateBadge();
  }, [notifUnseen]);

  return (
    <NotificationContext.Provider
      value={{
        notifUnseen,
        refreshUnread: fetchUnread,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationRefresh() {
  return useContext(NotificationContext);
}
