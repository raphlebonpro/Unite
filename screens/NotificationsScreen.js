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
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Icônes par type
const ICONS = {
 // Sessions
 session_created: { name: 'calendar-plus', color: '#3f4fff' },
 session_deleted_creator: { name: 'trash-can', color: '#757575' },
 session_deleted_participant: { name: 'trash-can-outline', color: '#9e9e9e' },
 session_updated_creator: { name: 'pencil-outline', color: '#f9a825' },
 session_updated_participant: { name: 'pencil-outline', color: '#f9a825' },
 session_joined: { name: 'account-check', color: '#27ae60' },
 session_start_soon: { name: 'clock-outline', color: '#3f51b5' },
 leave_review: { name: 'star-outline', color: '#ff9800' },
 session_full: { name: 'account-group', color: '#27ae60' },


 // Participants
 participant_joined_creator: { name: 'account-multiple-plus', color: '#2196f3' },
 participant_joined_participant: { name: 'account-multiple-plus', color: '#2196f3' },
 participant_left_creator: { name: 'exit-to-app', color: '#f57c00' },
 participant_left_participant: { name: 'exit-to-app', color: '#f57c00' },
 participant_left_self: { name: 'exit-to-app', color: '#607d8b' },
 excluded_from_session: { name: 'account-cancel', color: '#d32f2f' },
 exclude_user: { name: 'account-remove', color: '#e53935' },
 excluded_participant: { name: 'account-cancel', color: '#d32f2f' },


 // Messages
 new_message: { name: 'message-text', color: '#ff7a5a' },


 // Amis
 friend_request: { name: 'account-plus', color: '#42a5f5' },
 friend_request_sent: { name: 'account-arrow-right', color: '#42a5f5' },
 friend_request_accepted: { name: 'account-check', color: '#4caf50' },
 friend_request_accepted_self: { name: 'account-check', color: '#4caf50' },
 friend_request_rejected: { name: 'account-remove', color: '#f44336' },
 friend_joined_session: { name: 'account-heart', color: '#42a5f5' },
 friend_created_session: { name: 'account-plus-outline', color: '#42a5f5' },


 // Social / Progression
 badge_awarded: { name: 'trophy-outline', color: '#ff9800' },
 new_session_nearby: { name: 'map-marker', color: '#00897b' },
 collective_challenge: { name: 'flag-checkered', color: '#ff5722' },
 review_received: { name: 'star', color: '#ffc107' },


 // Profil & préférences
 profile_updated: { name: 'account-circle', color: '#3f4fff' },
 location_preferences_updated: { name: 'map-marker-radius', color: '#00897b' },
 notification_preferences_updated: { name: 'bell-check', color: '#42a5f5' },


 // Divers
 reminder: { name: 'alarm', color: '#ffb300' },
 welcome: { name: 'hand-wave', color: '#ff9100' },
 user_reported: { name: 'alert-circle', color: '#e53935' },
 verify_email_prompt: { name: 'email-alert', color: '#FDD835' },
 verify_email_confirmed: { name: 'check-decagram', color: '#FBC02D' },


 // Reviews (gestion)
 review_published: { name: 'star-outline', color: '#ff9800' },
 review_updated: { name: 'pencil-outline', color: '#4caf50' },
 review_deleted: { name: 'trash-can-outline', color: '#f44336' },


 // Défaut
 default: { name: 'bell-outline', color: '#999' },
 newsletter_subscribed: { name: 'email-check-outline', color: '#2196f3' },
 report_confirmation: { name: 'alert-circle-check-outline', color: '#f57c00' },
 feedback_received: { name: 'comment-check-outline', color: '#4caf50' },
};


// ---------- Thèmes par type
const TYPE_THEME = {
 success:   { tint: '#27ae60', bg: '#E9F7EF' },
 info:      { tint: '#3f4fff', bg: '#EEF0FF' },
 warning:   { tint: '#ffb300', bg: '#FFF6E0' },
 danger:    { tint: '#e53935', bg: '#FDEBEC' },
 neutral:   { tint: '#8892a6', bg: '#F2F4F7' },
};


const TYPE_MAP = {
 // Sessions
 session_created: 'info',
 session_deleted_creator: 'neutral',
 session_deleted_participant: 'neutral',
 session_updated_creator: 'warning',
 session_updated_participant: 'warning',
 session_joined: 'success',
 session_start_soon: 'info',
 start: 'info',
 leave_review: 'warning',
 session_full: 'success',


 // Participants
 participant_joined_creator: 'info',
 participant_joined_participant: 'info',
 participant_left_creator: 'warning',
 participant_left_participant: 'warning',
 participant_left_self: 'neutral',
 excluded_from_session: 'danger',
 exclude_user: 'danger',
 excluded_participant: 'danger',


 // Messages
 new_message: 'info',


 // Amis
 friend_request: 'info',
 friend_request_sent: 'info',
 friend_request_accepted: 'success',
 friend_request_accepted_self: 'success',
 friend_request_rejected: 'danger',
 friend_joined_session: 'info',
 friend_created_session: 'info',


 // Social / Progression
 badge_awarded: 'success',
 new_session_nearby: 'info',
 collective_challenge: 'info',
 review_received: 'success',


 // Profil & préférences
 profile_updated: 'success',
 location_preferences_updated: 'info',
 notification_preferences_updated: 'info',


 // Divers
 reminder: 'warning',
 reminder_2h: 'warning',
 welcome: 'info',
 user_reported: 'danger',
 verify_email_prompt: 'warning',
 verify_email_confirmed: 'success',


 // Reviews
 review_published: 'success',
 review_updated: 'info',
 review_deleted: 'danger',


 // Défaut
 default: 'neutral',
 newsletter_subscribed: 'success',
 report_confirmation: 'info',
 feedback_received: 'info',
};


function themeFor(type) {
 const key = TYPE_MAP[type] || 'neutral';
 return TYPE_THEME[key] || TYPE_THEME.neutral;
}


// ---------- Helpers de grouping (Aujourd’hui / Hier / Cette semaine / Plus ancien)
function sectionLabel(dateISO) {
 const d = moment(dateISO);
 if (d.isSame(moment(), 'day')) return 'Aujourd’hui';
 if (d.isSame(moment().subtract(1, 'day'), 'day')) return 'Hier';
 if (d.isAfter(moment().startOf('week'))) return 'Cette semaine';
 return 'Plus ancien';
}


function buildSectioned(notifs = []) {
 const groups = {};
 notifs.forEach(n => {
   const label = sectionLabel(n.created_at);
   if (!groups[label]) groups[label] = [];
   groups[label].push(n);
 });
 const out = [];
 Object.keys(groups).forEach(label => {
   out.push({ __header__: true, id: `h-${label}`, label });
   groups[label].forEach(n => out.push(n));
 });
 return out;
}


export default function NotificationsScreen() {
 const navigation = useNavigation();
 const [notifications, setNotifications] = useState([]);
 const [loading, setLoading] = useState(true);
 const [lastOpenedAt, setLastOpenedAt] = useState(null);
 const openedAtRef = useRef(null);
 const { triggerRefreshNotifs } = useNotificationRefresh();

// remplace ton fetchNotifications
const fetchNotifications = useCallback(async (opts = { spinner: false }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setNotifications([]);
    setLoading(false);
    return;
  }

  if (opts.spinner) setLoading(true);

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ Erreur fetchNotifications:", error);
  } else {
    setNotifications(data || []);
    // 🚫 ne touche plus à lastOpenedAt ici
  }

  if (opts.spinner) setLoading(false);
}, []);

const markAllAsRead = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Optimiste local
  setNotifications((prev) =>
    prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
  );

  // Mise à jour en BDD
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error("❌ Erreur markAllAsRead:", error);
    // rollback si besoin
    await fetchNotifications({ spinner: false });
    return;
  }

  triggerRefreshNotifs();
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


useFocusEffect(
  useCallback(() => {
    let active = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🔸 Récupère la dernière ouverture (avant d’entrer)
      const lastOpen = await AsyncStorage.getItem('lastNotifOpenAt');
      if (lastOpen) setLastOpenedAt(lastOpen);

      // 🔹 Marque toutes les notifs comme lues
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      triggerRefreshNotifs();
      await fetchNotifications({ spinner: false });
    })();

    // 🔸 À la fermeture de la page → on enregistre la nouvelle "dernière ouverture"
    return () => {
      if (active) {
        const now = new Date().toISOString();
        AsyncStorage.setItem('lastNotifOpenAt', now);
        setLastOpenedAt(now);
      }
      active = false;
    };
  }, [fetchNotifications, triggerRefreshNotifs])
);

 // Utils
 async function getToken() {
   const { data: { session } } = await supabase.auth.getSession();
   return session?.access_token || '';
 }


const handleNotificationPress = (notif) => {
  try {
    // 🔹 Marque comme lue en optimiste
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      triggerRefreshNotifs();
      supabase.from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)
        .catch(() => {});
    }

    // 🔸 Sécurité : si notif sans type → ignore
    if (!notif?.type) return;

    // === 🎯 ROUTAGE LOGIQUE PAR TYPE ===

    // 👋 Bienvenue
    if (notif.type === 'welcome') {
      navigation.navigate('Bienvenue');
      return;
    }

    // 💬 Nouveau message
    if (notif.type === 'new_message' && notif.session_id) {
      navigation.navigate('SessionMessages', {
        sessionId: notif.session_id,
      });
      return;
    }

    // 🧍 Demande d’ami reçue
    if (notif.type === 'friend_request' && notif.sender_id) {
      navigation.navigate('UserProfile', {
        userId: notif.sender_id,
        source: 'friend_request',
      });
      return;
    }

// ⭐ Avis à laisser après session → d’abord la note globale de session
if (notif.type === 'leave_review' && notif.session_id) {
  navigation.navigate('SessionFeedback', {
    sessionId: notif.session_id,
    fromNotification: true,
  });
  return;
}

// ⭐ Nouvel avis reçu → redirige vers la page des avis reçus
if (notif.type === 'review_received') {
  supabase.auth.getUser().then(({ data, error }) => {
    if (error || !data?.user?.id) {
      console.warn("⚠️ Impossible d’obtenir l’utilisateur pour review_received", error);
      return;
    }

    navigation.navigate('UserReview', { userId: data.user.id });
  });
  return;
}

    // 🏅 Badge gagné
    if (notif.type === 'badge_awarded') {
      navigation.navigate('Profile');
      return;
    }

    // ⚔️ Défi collectif
    if (notif.type === 'collective_challenge') {
      navigation.navigate('CollectiveChallenges');
      return;
    }

    // ⭐ Avis reçu
    if (notif.type === 'review_received' && notif.sender_id) {
      navigation.navigate('UserProfile', { userId: notif.sender_id });
      return;
    }

    // 💥 Ami a rejoint une session
if (notif.type === 'friend_joined_session' && notif.session_id) {
  navigation.navigate('SessionDetail', {
    sessionId: notif.session_id,
    fromNotification: true,
  });
  return;
}

    //Notif compte vérifié
    if (notif.type === 'verify_email_prompt') {
  navigation.navigate('VerifyEmail'); // écran qu’on fera ensuite
  return;
}

        // ❌ Session annulée faute de coéquipiers → redirige vers écran simplifié
    if (notif.type === 'session_cancelled_solo') {
      const sessionId =
        notif.session_id ||
        notif.data?.session_id ||
        notif.metadata?.session_id ||
        null;

      navigation.navigate('SessionCancelled', {
        sessionId,
        title: notif.title,
        body: notif.body,
      });
      return;
    }

    // 🔥 Tous les types liés à une session
    const sessionTypes = [
      'session_created',
      'session_joined',
      'participant_joined_creator',
      'participant_joined_participant',
      'session_updated_creator',
      'session_updated_participant',
      'session_deleted_creator',
      'session_deleted_participant',
      'session_start_soon',
      'start',
      'reminder_2h',
      
      'excluded_from_session',
      'exclude_user',
      'participant_left_creator',
      'participant_left_participant',
      'participant_left_self',
      'session_full',
      'new_session_nearby',
      'friend_invited_session',
      'friend_joined_session',
    ];

if (sessionTypes.includes(notif.type)) {
  const sessionId =
    notif.session_id ||
    notif.data?.session_id ||
    notif.metadata?.session_id ||
    null;

  if (!sessionId) {
    console.warn(`⚠️ Pas de session_id pour la notif: ${notif.type}`);
    return;
  }

  // Redirection unique pour tous les cas liés à une session
  navigation.navigate('SessionDetail', {
    sessionId,
    fromNotification: true,
  });
  return;
}

  } catch (err) {
    console.error('❌ Erreur handleNotificationPress:', err);
    Alert.alert('Erreur', "Impossible d’ouvrir cette notification.");
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


 // ---------- Rendu (header de section + carte premium)
const renderNotif = ({ item }) => {
  // Header de section
  if (item.__header__) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{item.label}</Text>
      </View>
    );
  }

  const icon = ICONS[item.type] || ICONS.default;
  const theme = themeFor(item.type);

  // 💡 Badge “Nouveau” : seulement si la notif est arrivée après la dernière fermeture
const isNewSinceLastOpen =
  lastOpenedAt && typeof lastOpenedAt === "string"
    ? new Date(item.created_at) > new Date(lastOpenedAt)
    : false;

const Card = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.cardOuter,
          { transform: [{ scale }] },
        ]}
      >
        <View style={[styles.cardInner, !item.is_read && styles.cardUnread]}>
          {/* Accent vertical */}
          <LinearGradient
            colors={[theme.tint, theme.tint + '88']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.accentBar}
          />
          {/* Contenu */}
          <View style={styles.cardContent}>
            <View style={[styles.iconRing, { backgroundColor: theme.bg, borderColor: theme.tint }]}>
              <MaterialCommunityIcons name={icon.name} size={20} color={theme.tint} />
              {!item.is_read && <View style={[styles.unreadDot, { borderColor: theme.bg }]} />}
            </View>

            <View style={styles.textCol}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !item.is_read && { color: theme.tint }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.time}>{moment(item.created_at).fromNow()}</Text>
              </View>

              <Text style={styles.body} numberOfLines={3}>{item.body}</Text>

              {isNewSinceLastOpen && (
                <View style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.tint }]}>
                  <Text style={[styles.chipText, { color: theme.tint }]}>Nouveau</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.trailing}>
              <Feather name="x" size={18} color="#B8C0CC" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
return <Card onPress={() => handleNotificationPress(item)} />
}

 // ---------- Data sectionnée pour FlatList
 const dataSectioned = buildSectioned(notifications);


 return (
   <SafeAreaView style={styles.safe}>
     <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
{notifications.length > 0 && (
  <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FDECEC',
      }}
      onPress={handleDeleteAll}
      activeOpacity={0.84}
    >
      <Feather name="trash-2" size={17} color="#D83C3C" style={{ marginRight: 7 }} />
      <Text style={{ color: '#D83C3C', fontWeight: '600' }}>
        Effacer toutes les notifications
      </Text>
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
         data={dataSectioned}
         renderItem={renderNotif}
         keyExtractor={(item) => String(item.id || item.label)}
         contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }}
         showsVerticalScrollIndicator={false}
       />
     )}
   </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor:'#F7F8FA' },

 // Section headers
 sectionHeader: {
   paddingHorizontal: wp('4%'),
   paddingTop: hp('0.5%'),
   paddingBottom: hp('0.6%'),
 },
 sectionHeaderText: {
   color: '#7B88A8',
   fontWeight: '700',
   letterSpacing: 0.3,
   fontSize: wp('3.5%'),
   textTransform: 'uppercase',
 },


 // Cartes premium
 cardOuter: {
   paddingHorizontal: wp('3.2%'),
   paddingVertical: hp('0.7%'),
 },
 cardInner: {
   backgroundColor: '#fff',
   borderRadius: 14,
   borderWidth: 1,
   borderColor: '#E7EBF3',
   overflow: 'hidden',
   shadowColor: '#000',
   shadowOpacity: 0.06,
   shadowRadius: 8,
   shadowOffset: { width: 0, height: 4 },
   elevation: 2,
 },
 cardUnread: {
   borderColor: '#D8DEFF',
   backgroundColor: '#F9FAFF',
 },
 accentBar: {
   position: 'absolute',
   left: 0,
   top: 0,
   bottom: 0,
   width: 4,
 },
 cardContent: {
   flexDirection: 'row',
   alignItems: 'flex-start',
   paddingVertical: hp('1.6%'),
   paddingHorizontal: wp('3.4%'),
   gap: wp('3%'),
 },


 iconRing: {
   width: wp('10.5%'),
   height: wp('10.5%'),
   borderRadius: wp('5.25%'),
   alignItems: 'center',
   justifyContent: 'center',
   borderWidth: 2,
   position: 'relative',
   marginTop: 2,
 },
 unreadDot: {
   position: 'absolute',
   top: -2,
   right: -2,
   width: 10,
   height: 10,
   borderRadius: 5,
   backgroundColor: '#3f4fff',
   borderWidth: 2,
 },
textCol: { flex: 1 },
titleRow: {
 flexDirection: 'row',
 alignItems: 'center',
},
title: {
 flex: 1,              // prend toute la place dispo
 flexShrink: 1,
 fontSize: wp('4.4%'),
 fontWeight: '800',
 color: '#1F2430',
 marginRight: wp('2%'),
},
time: {
 fontSize: wp('3.2%'),
 color: '#96A0B2',
 fontWeight: '600',
 marginLeft: 'auto',   // colle l'heure à droite
},
 body: {
   marginTop: 4,
   fontSize: wp('3.8%'),
   color: '#3A4152',
   lineHeight: hp('2.5%'),
 },


 chip: {
   alignSelf: 'flex-start',
   marginTop: 8,
   paddingVertical: 4,
   paddingHorizontal: 10,
   borderRadius: 999,
   borderWidth: 1,
 },
 chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },


 trailing: { paddingLeft: 6, paddingTop: 2, alignSelf: 'flex-start' },


 // État vide
 emptyBox: { alignItems: 'center', marginTop: hp('10.2%') },
 emptyText: { color: '#8a8c96', fontSize: wp('4.2%'), marginTop: hp('2.3%'), fontWeight: '500' },
});
