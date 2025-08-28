import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import moment from 'moment';
import 'moment/locale/fr';
moment.locale('fr');
import { useNotificationRefresh } from '../context/NotificationContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const ICONS = {
  session_created: { name: 'calendar-plus', color: '#3f4fff' },
  session_joined: { name: 'account-check', color: '#27ae60' },
  participant_joined: { name: 'account-multiple-plus', color: '#2196f3' },
  new_message: { name: 'message-text', color: '#ff7a5a' },
  reminder: { name: 'alarm', color: '#ffb300' },
  session_updated: { name: 'pencil-outline', color: '#f9a825' },
  session_cancelled: { name: 'close-circle-outline', color: '#f44336' },
  welcome: { name: 'hand-wave', color: '#ff9100' },
  exclude_user: { name: 'account-remove', color: '#e53935' },
  excluded_from_session: { name: 'account-cancel', color: '#d32f2f' },
  session_deleted_creator: { name: 'trash-can', color: '#757575' },
  session_deleted_participant: { name: 'trash-can-outline', color: '#9e9e9e' },
  friend_joined_session: { name: 'account-heart', color: '#42a5f5' },
  friend_created_session: { name: 'account-plus-outline', color: '#42a5f5' },
  leave_review: { name: 'star-outline', color: '#ff9800' },
  review_received: { name: 'star', color: '#ffc107' },
  left_session: { name: 'exit-to-app', color: '#607d8b' },
  inactivity_reminder: { name: 'bell-ring', color: '#7b1fa2' },
  personalized_suggestion: { name: 'map-marker', color: '#00897b' },
  collective_challenge: { name: 'flag-checkered', color: '#ff5722' },
  friend_request: { name: 'account-plus', color: '#42a5f5' },
  friend_request_accepted: { name: 'account-check', color: '#4caf50' },
  friend_request_rejected: { name: 'account-remove', color: '#f44336' },
  user_reported: { name: 'alert-circle', color: '#e53935' },
  session_start_soon: { name: 'clock-outline', color: '#3f51b5' },
  badge_awarded: { name: 'trophy-outline', color: '#ff9800' },
  default: { name: 'bell-outline', color: '#999' },
};


export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastOpenedAt, setLastOpenedAt] = useState(null);
  const openedAtRef = useRef(null);
  const { triggerRefreshNotifs } = useNotificationRefresh();

  const fetchNotifications = useCallback(async (opts = { spinner: false }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotifications([]);
      setLastOpenedAt(null);
      setLoading(false);
      return;
    }
    if (opts.spinner) setLoading(true);

    const [{ data: meta }, { data, error }] = await Promise.all([
      supabase
        .from('user_notification_meta')
        .select('last_opened_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (!error) {
      setNotifications(data || []);
      setLastOpenedAt(meta?.last_opened_at ?? null);
    }
    if (opts.spinner) setLoading(false);
  }, []);

  // 🔄 Marquer toutes les notifs comme lues (optimiste) + sync
  const markAllAsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimiste local
    setNotifications((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      // rollback si échec
      await fetchNotifications({ spinner: false });
    } else {
      triggerRefreshNotifs();
    }
  }, [fetchNotifications, triggerRefreshNotifs]);

  // Initial + realtime INSERT/UPDATE/DELETE
  useEffect(() => {
    (async () => {
      await fetchNotifications({ spinner: true });
    })();

    let channel;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      channel = supabase
        .channel('notifications_live')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications({ spinner: false }),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications({ spinner: false }),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications({ spinner: false }),
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  // Focus/Blur : snapshot + mark read + sauvegarde last_opened_at
  useFocusEffect(
    useCallback(() => {
      openedAtRef.current = new Date();

      (async () => {
        await fetchNotifications({ spinner: false });
        await markAllAsRead();
      })();

      return () => {
        (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !openedAtRef.current) return;
          await supabase
            .from('user_notification_meta')
            .upsert({
              user_id: user.id,
              last_opened_at: openedAtRef.current.toISOString(),
            });
          triggerRefreshNotifs();
        })();
      };
    }, [fetchNotifications, markAllAsRead, triggerRefreshNotifs]),
  );

  // Utils
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }

const handleNotificationPress = async (notif) => {
  // Marque comme lue si besoin
  if (!notif.is_read) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    triggerRefreshNotifs();
  }

  // 🔗 Nouveau comportement pour les demandes d'amis
  if (notif.type === 'friend_request' && notif.sender_id) {
    navigation.navigate('UserProfile', {
      userId: notif.sender_id,
      source: 'friend_request', // pour afficher Accepter/Refuser sur le profil
    });
    return;
  }

  if (notif.type === 'welcome') {
    navigation.navigate('Bienvenue');
    return;
  }

  if (
    [
      'session_created',
      'session_joined',
      'participant_joined',
      'session_updated',
      'session_cancelled',
      'excluded_from_session',
      'exclude_user',
      'left_session',
      'session_deleted_creator',
      'session_deleted_participant',
      'session_start_soon',
    ].includes(notif.type)
  ) {
    navigation.navigate('SessionDetail', { sessionId: notif.session_id });
    return;
  }

  if (notif.type === 'new_message') {
    navigation.navigate('Messages', { sessionId: notif.session_id });
    return;
  }

  if (notif.type === 'badge_awarded') {
    navigation.navigate('Profil'); // ou "Badges"
    return;
  }

  if (notif.type === 'collective_challenge') {
    navigation.navigate('Defis');
    return;
  }
};

  const handleDelete = async (notifId) => {
    Alert.alert('Supprimer cette notification ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('notifications').delete().eq('id', notifId);
          setNotifications((prev) => prev.filter((n) => n.id !== notifId));
          triggerRefreshNotifs();
        },
      },
    ]);
  };

  const handleDeleteAll = async () => {
    Alert.alert('Tout effacer', 'Es-tu sûr de vouloir supprimer toutes tes notifications ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('notifications').delete().eq('user_id', user.id);
          setNotifications([]);
          triggerRefreshNotifs();
        },
      },
    ]);
  };

  const renderNotif = ({ item }) => {
    const icon = ICONS[item.type] || ICONS.default;
    const isNewSinceLastOpen = !lastOpenedAt ? true : new Date(item.created_at) > new Date(lastOpenedAt);

    // Demande d’ami = carte spéciale avec boutons
    if (item.type === 'friend_request') {
return (
  <TouchableOpacity
    style={[
      styles.notifWrap,
      !item.is_read && styles.notifUnread,
      isNewSinceLastOpen && styles.notifNewSinceOpen
    ]}
    onPress={() => handleNotificationPress(item)}
    activeOpacity={0.83}
  >
    <View style={[styles.iconCircle, { backgroundColor: '#42a5f522' }]}>
      <MaterialCommunityIcons name="account-plus" size={22} color="#42a5f5" />
      {!item.is_read && <View style={styles.unreadBadge} />}
    </View>

    <View style={styles.notifTextBox}>
      <View style={styles.titleRow}>
        <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.notifTime}>{moment(item.created_at).fromNow()}</Text>
      </View>

      <Text style={styles.notifContent} numberOfLines={3}>
        {item.body}
      </Text>

      {/* Indication subtile qu'on peut appuyer */}
      <Text style={{ marginTop: 6, fontSize: 12, color: '#6b6b6b' }}>
        Appuie pour voir le profil et répondre
      </Text>
    </View>

    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
      <Feather name="x" size={18} color="#c7c8d9" />
    </TouchableOpacity>
  </TouchableOpacity>
);
    }

    // Cas par défaut
    return (
      <TouchableOpacity
        style={[styles.notifWrap, !item.is_read && styles.notifUnread, isNewSinceLastOpen && styles.notifNewSinceOpen]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.83}
      >
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '22' }]}>
          <MaterialCommunityIcons name={icon.name} size={22} color={icon.color} />
          {!item.is_read && <View style={styles.unreadBadge} />}
        </View>
        <View style={styles.notifTextBox}>
          <View style={styles.titleRow}>
            <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.notifTime}>{moment(item.created_at).fromNow()}</Text>
          </View>
          <Text style={styles.notifContent} numberOfLines={3}>
            {item.body}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Feather name="x" size={18} color="#c7c8d9" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fd" />
      {notifications.length > 0 && (
        <View style={styles.centeredBtnWrap}>
          <TouchableOpacity style={styles.clearAllBtn} onPress={handleDeleteAll} activeOpacity={0.84}>
            <Feather name="trash-2" size={17} color="#f44336" style={{ marginRight: 7 }} />
            <Text style={styles.clearAllText}>Effacer toutes les notifications</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color="#3f4fff" />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="bell-off-outline" size={60} color="#bbb" />
          <Text style={styles.emptyText}>Aucune notification pour l’instant</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotif}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f9fd' },

  centeredBtnWrap: {
    alignItems: 'center',
    marginTop: hp('1.4%'),
    marginBottom: hp('0.3%'),
    width: '100%',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3e7f2',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.1%'),
    paddingHorizontal: wp('6%'),
    alignSelf: 'center',
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: hp('0.2%') },
    shadowRadius: wp('0.7%'),
  },
  clearAllText: {
    color: '#3f4fff',
    fontWeight: 'bold',
    fontSize: wp('4.2%'),
    letterSpacing: 0.07,
  },

  notifWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3.4%'),
    borderBottomWidth: 1,
    borderColor: '#edf1f7',
    backgroundColor: '#f8fafd',
    minHeight: hp('7%'),
    gap: wp('2.5%'),
  },
  notifUnread: { backgroundColor: '#eef2ff' },
  notifNewSinceOpen: { backgroundColor: '#FFF7E6' },

  iconCircle: {
    width: wp('12.3%'),
    height: wp('12.3%'),
    borderRadius: wp('6.2%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f4fd',
    marginRight: wp('2.7%'),
    marginTop: hp('0.1%'),
    position: 'relative'
  },
  unreadBadge: {
    position: 'absolute',
    top: hp('0.7%'),
    right: wp('1.3%'),
    width: wp('2.6%'),
    height: wp('2.6%'),
    borderRadius: wp('1.3%'),
    backgroundColor: '#3f4fff',
    borderWidth: 2,
    borderColor: '#fff'
  },
  notifTextBox: { flex: 1, minHeight: hp('4.5%') },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: hp('0.25%') },
  notifTitle: {
    fontSize: wp('4.4%'),
    fontWeight: 'bold',
    color: '#20223A',
    letterSpacing: 0.01,
    flexShrink: 1,
    marginRight: wp('2.7%'),
    maxWidth: '78%',
  },
  notifTitleUnread: { color: '#3f4fff' },
  notifTime: {
    fontSize: wp('3.2%'),
    color: '#95a1b9',
    marginLeft: wp('0.7%'),
    fontWeight: '500',
    alignSelf: 'flex-end',
  },
  notifContent: {
    fontSize: wp('3.8%'),
    color: '#383c4c',
    marginTop: hp('0.12%'),
    fontWeight: '500',
    lineHeight: hp('2.5%'),
    maxWidth: '99%'
  },
  deleteBtn: { paddingLeft: wp('1.8%'), paddingTop: hp('0.35%'), alignSelf: 'flex-start', opacity: 0.62 },
  emptyBox: { alignItems: 'center', marginTop: hp('10.2%') },
  emptyText: { color: '#8a8c96', fontSize: wp('4.2%'), marginTop: hp('2.3%'), fontWeight: '500' },
  actionBtn: {
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 6,
},
actionBtnText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 13,
},
});
