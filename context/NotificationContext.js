// context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as Notifications from 'expo-notifications';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifUnseen, setNotifUnseen] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- Compte direct sur notifications
  const fetchUnread = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
      console.error("❌ Erreur fetchUnread:", error);
      setNotifUnseen(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    let channel;
    let interval;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      await fetchUnread();

      // --- Abonnement realtime
      channel = supabase
        .channel('notif_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async () => {
            await fetchUnread();
          }
        )
        .subscribe((status) => {
          console.log("📡 Status canal notifications:", status);
        });

      // --- Poll toutes les 5 secondes (sécurité)
      interval = setInterval(fetchUnread, 5000);
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (interval) clearInterval(interval);
    };
  }, []);

  // --- Badge icône app
  useEffect(() => {
    Notifications.setBadgeCountAsync(notifUnseen).catch(err =>
      console.warn("⚠️ Erreur setBadgeCountAsync", err)
    );
  }, [notifUnseen]);

  return (
    <NotificationContext.Provider value={{ notifUnseen, refreshUnread: fetchUnread, loading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationRefresh() {
  return useContext(NotificationContext);
}
