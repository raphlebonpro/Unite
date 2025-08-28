import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from './UserContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifUnseen, setNotifUnseen] = useState(0);
  const [refreshNotifs, setRefreshNotifs] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!user?.id) {
      setNotifUnseen(0);
      return;
    }
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) setNotifUnseen(count || 0);
  }, [user?.id]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread, refreshNotifs]);

useEffect(() => {
  if (!user?.id) return;
  const channel = supabase
    .channel('notifications_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      () => fetchUnread()
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      () => fetchUnread()
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      () => fetchUnread()
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [fetchUnread, user?.id]);

  const triggerRefreshNotifs = () => setRefreshNotifs(prev => !prev);

  return (
    <NotificationContext.Provider value={{ notifUnseen, triggerRefreshNotifs }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationRefresh = () => useContext(NotificationContext);
