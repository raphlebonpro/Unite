import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import {
  notifyYouJoinedSession,
  notifyParticipantJoinedCreator,
  notifyParticipantJoinedOthers,
  notifyParticipantLeft,
  notifyExclusion
} from '../helpers/notifications';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MapboxGL from '../mapboxConfig';

const STATIC_MAP_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&name=U';

function formatDateTime(date, time) {
  if (!date) return '';
  const dateTimeStr = time ? `${date}T${time}` : date;
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSessionFinished(session) {
  if (!session?.date || !session?.time) return false;
  const dateTime = new Date(`${session.date}T${session.time.length === 5 ? session.time : session.time.slice(0, 5)}`);
  return dateTime.getTime() < Date.now();
}

async function scheduleSessionReminder(session) {
  const sessionDateTime = new Date(`${session.date}T${session.time.length === 5 ? session.time : session.time.slice(0, 5)}`);
  const reminderDate = new Date(sessionDateTime.getTime() - 2 * 60 * 60 * 1000); // 2h avant
  if (reminderDate < new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Session à venir',
      body: `Ta session "${session.title}" commence dans 2h !`,
      data: { sessionId: session.id },
    },
    trigger: reminderDate,
  });
}

const SessionDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId } = route.params;

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [user, setUser] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);

  // Ajoute un nouvel état
const [invitation, setInvitation] = useState(null);

useEffect(() => {
  if (user && sessionId) {
    checkInvitation();
  }
}, [user, sessionId]);

async function checkInvitation() {
  if (!user?.id) return;

  const { data, error } = await supabase
    .from('session_invitations')
    .select('id, inviter_id, created_at')
    .eq('session_id', sessionId)
    .eq('invited_id', user.id)
    .maybeSingle();

  console.log("📩 checkInvitation:", { data, error });

if (!error && data) {
  const { data: inviter } = await supabase
    .from('users')
    .select('username')
    .eq('id', data.inviter_id)
    .maybeSingle();

  setInvitation({
    ...data,
    inviter_username: inviter?.username || null,
  });
}
}

  // Kick states
  const [isKicked, setIsKicked] = useState(false);
  const [checkingKick, setCheckingKick] = useState(true);

  const [participantsLoading, setParticipantsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  // 👉 Déplacé en fonction réutilisable
  const fetchSession = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setSession(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sessionId) fetchSession();
  }, [sessionId]);

  // Vérification kickée
  useEffect(() => {
    const checkKicked = async () => {
      setCheckingKick(true);
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser || !session?.id) {
        setIsKicked(false);
        setCheckingKick(false);
        return;
      }
      const { data } = await supabase
        .from('sessions_kicked')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', currentUser.id)
        .single();
      setIsKicked(!!data);
      setCheckingKick(false);
    };
    checkKicked();
  }, [session?.id]);

  // 🔄 Recharge session + participants à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      fetchSession();
      fetchParticipants();
    }, [sessionId, user])
  );

  // Fetch participants
  const fetchParticipants = async () => {
    if (!session) return;
    setParticipantsLoading(true);

    const { data: participantRows } = await supabase
      .from('session_participants')
      .select('user_id')
      .eq('session_id', session.id);

    const userIds = (participantRows || []).map(p => p.user_id);

    let usersRows = [];
    if (userIds.length > 0) {
      const { data: uRows } = await supabase
        .from('users')
        .select('id, username, profile_photo')
        .in('id', userIds);
      usersRows = uRows || [];
    }

    let creator = null;
    if (session.creator_id && !userIds.includes(session.creator_id)) {
      const { data: creatorRow } = await supabase
        .from('users')
        .select('id, username, profile_photo')
        .eq('id', session.creator_id)
        .single();
      creator = creatorRow;
    }

    let participantsList = usersRows.map(u => ({
      id: u.id,
      username: u.username || 'Utilisateur',
      avatar: u.profile_photo || DEFAULT_AVATAR,
    }));

    if (creator) {
      participantsList = [
        {
          id: creator.id,
          username: creator.username || 'Créateur',
          avatar: creator.profile_photo || DEFAULT_AVATAR,
        },
        ...participantsList,
      ];
    }

    setParticipants(participantsList);

    if (user && (userIds.includes(user.id) || user.id === session.creator_id)) {
      setIsParticipant(true);
    } else {
      setIsParticipant(false);
    }

    setParticipantsLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, [session, user]);

  if (loading || !session) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color="#e8764d" />
      </View>
    );
  }

  const getStaticMapUrl = () => {
    if (!session.lat || !session.lng) return null;
    return (
      `https://maps.googleapis.com/maps/api/staticmap?center=${session.lat},${session.lng}` +
      `&zoom=15&size=720x380&scale=2&markers=color:red%7C${session.lat},${session.lng}` +
      `&key=${STATIC_MAP_KEY}`
    );
  };


// Fonction pour rejoindre la session
const handleJoin = async () => {
  setLoadingJoin(true);

  // 1. Auth check
  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData.user) {
    setLoadingJoin(false);
    return Alert.alert('Erreur', 'Tu dois être connecté.');
  }
  const userId = userData.user.id;

  // 2. Check si déjà participant
  const { data: ex, error: exErr } = await supabase
    .from('session_participants')
    .select()
    .eq('session_id', session.id)
    .eq('user_id', userId);
  if (exErr) {
    setLoadingJoin(false);
    return Alert.alert('Erreur', exErr.message);
  }
  if (ex && ex.length) {
    setLoadingJoin(false);
    return Alert.alert('Info', 'Tu participes déjà.');
  }

  // *** PATCH FEMME UNIQUEMENT ***
  if (session.girls_only) {
    const { data: userProfile, error: genderErr } = await supabase
      .from('users')
      .select('gender')
      .eq('id', userId)
      .single();
    if (genderErr) {
      setLoadingJoin(false);
      return Alert.alert('Erreur', "Impossible de vérifier ton profil.");
    }
    if (!userProfile || userProfile.gender !== "Femme") {
      setLoadingJoin(false);
      return Alert.alert(
        "Session réservée aux femmes",
        "Désolé, tu ne peux pas rejoindre cette session car elle est réservée aux filles uniquement."
      );
    }
  }

  // 3. Ajoute comme participant
  const { error: insErr } = await supabase
    .from('session_participants')
    .insert({ session_id: session.id, user_id: userId });
  setLoadingJoin(false);
  if (insErr) return Alert.alert('Erreur', insErr.message);

  // 4. Toast visuel
  Toast.show({
    type: 'success',
    text1: 'Session rejointe !',
    text2: `Tu as bien rejoint la session "${session.title}".`,
    position: 'top',
    topOffset: 48,
    visibilityTime: 2600,
  });

  // 5. Infos user pour notif
  const { data: userProfile } = await supabase
    .from('users')
    .select('username, email')
    .eq('id', userId)
    .single();

  const pseudoAffiche =
    userProfile?.username?.trim() ||
    userProfile?.email?.split('@')[0] ||
    'Un utilisateur';

  if (session.creator_id && userId !== session.creator_id) {
    await notifyParticipantJoinedCreator({
      creatorId: session.creator_id,
      joinerId: userId,
      joinerName: pseudoAffiche,
      sessionTitle: session.title,
      sessionId: session.id,
    });
  }

  // (notif au participant lui-même)
  await notifyYouJoinedSession({
    userId,
    sessionTitle: session.title,
    sessionId: session.id,
  });

  await notifyParticipantJoinedOthers({
    participantIds: participants.map(p => p.id).filter(pid => pid !== userId && pid !== session.creator_id),
    joinerId: userId,
    joinerName: pseudoAffiche,
    sessionTitle: session.title,
    sessionId: session.id,
  });

  await scheduleSessionReminder(session);

  fetchParticipants();
  navigation.navigate('MainTabs', {
  screen: 'Activités',
  params: { tab: 'joined' }, // ✅ forcer l’onglet "Rejointes"
});
};


const handleLeave = async () => {
  Alert.alert(
    'Quitter la session',
    'Es-tu sûr de vouloir quitter cette session ?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui, quitter',
        style: 'destructive',
        onPress: async () => {
          setLoadingJoin(true);

          const { error } = await supabase
            .from('session_participants')
            .delete()
            .eq('session_id', session.id)
            .eq('user_id', user.id);

          setLoadingJoin(false);
          if (error) {
            Alert.alert('Erreur', "Impossible de quitter la session.");
            return;
          }

          setIsParticipant(false);

          if (session.creator_id && user.id !== session.creator_id) {
            let userProfile;
            try {
              const { data } = await supabase
                .from('users')
                .select('username, email')
                .eq('id', user.id)
                .single();
              userProfile = data;
            } catch (err) {
              userProfile = null;
            }

            const pseudoAffiche =
              userProfile?.username?.trim() ||
              userProfile?.email?.split('@')[0] ||
              'Un utilisateur';

            await notifyParticipantLeft({
              creatorId: session.creator_id,
              leaverId: user.id,
              leaverName: pseudoAffiche,
              sessionTitle: session.title,
              sessionId: session.id,
              otherParticipantIds: participants.map(p => p.id).filter(pid => pid !== user.id && pid !== session.creator_id),
            });
          }

          Toast.show({
            type: 'success',
            text1: 'Session quittée',
            text2: `Tu as quitté la session "${session.title}".`,
            position: 'top',
            topOffset: 48,
            visibilityTime: 2600,
          });

          navigation.navigate('MainTabs', { screen: 'Activités' });
        }
      }
    ]
  );
};

// ----------- BOUTONS D'ACTION -----------
let actionButtons = null;
const finished = isSessionFinished(session);

// 1️⃣ Cas : session terminée -> laisser un avis
if ((user && (session.creator_id === user.id || isParticipant)) && finished) {
  actionButtons = (
    <TouchableOpacity
      style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: 18, marginTop: 4, marginBottom: 44 }}
      onPress={() => navigation.navigate('RateSession', {
        sessionId: session.id,
        participants: participants.filter(u => u.id !== user.id),
        currentUserId: user.id
      })}
      activeOpacity={0.92}
    >
      <LinearGradient
        colors={['#7D78F8', '#6D6AFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.joinButton}
      >
        <Text style={styles.joinButtonText}>Laisser un avis</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// 2️⃣ Cas : créateur (session pas terminée)
else if (user && session.creator_id === user.id) {
  actionButtons = (
    <View style={{ marginHorizontal: 18, marginTop: 4, marginBottom: 44 }}>
      {/* Bouton Groupe/Messages */}
      <TouchableOpacity
        style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}
        onPress={() => navigation.navigate('SessionMessages', { sessionId: session.id })}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#6dd5ed', '#2193b0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.joinButton}
        >
          <Text style={styles.joinButtonText}>Groupe / Messages</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Bouton Modifier session */}
      <TouchableOpacity
        style={{ borderRadius: 16, overflow: 'hidden' }}
        onPress={() => navigation.navigate('EditSession', { sessionId: session.id })}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#FF9A6C', '#FF5E62']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.joinButton}
        >
          <Text style={[styles.joinButtonText, { color: '#fff' }]}>Modifier la session</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// 3️⃣ Cas : participant (session pas terminée)
else if (isParticipant) {
  actionButtons = (
    <View style={{ marginHorizontal: 18, marginTop: 4, marginBottom: 44 }}>
      {/* Bouton Groupe/Messages */}
      <TouchableOpacity
        style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}
        onPress={() => navigation.navigate('SessionMessages', { sessionId: session.id })}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#6dd5ed', '#2193b0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.joinButton}
        >
          <Text style={styles.joinButtonText}>Groupe / Messages</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Bouton Quitter */}
      {user && user.id !== session.creator_id && (
        <TouchableOpacity
          style={[styles.leaveButton, { marginTop: 0 }]}
          onPress={handleLeave}
          disabled={loadingJoin}
          activeOpacity={0.88}
        >
          <Text style={styles.leaveButtonText}>
            {loadingJoin ? '...' : 'Quitter la session'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 4️⃣ Cas : invité mais pas encore participant
else if (invitation && !isParticipant && user && user.id !== session.creator_id) {
  actionButtons = (
    <TouchableOpacity
      style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: 18, marginTop: 4, marginBottom: 44 }}
      onPress={handleJoin}
      activeOpacity={0.92}
      disabled={loadingJoin}
    >
      <LinearGradient
        colors={['#FF9A6C', '#FF5E62']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.joinButton}
      >
        <Text style={styles.joinButtonText}>
          {loadingJoin ? '...' : 'Rejoindre la session'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// 5️⃣ Cas : utilisateur lambda (pas créateur, pas participant, pas invité)
else if (!isParticipant && user && user.id !== session.creator_id) {
  actionButtons = (
    <TouchableOpacity
      style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: 18, marginTop: 4, marginBottom: 44 }}
      onPress={handleJoin}
      activeOpacity={0.92}
      disabled={loadingJoin}
    >
      <LinearGradient
        colors={['#FF9A6C', '#FF5E62']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.joinButton}
      >
        <Text style={styles.joinButtonText}>
          {loadingJoin ? '...' : 'Rejoindre la session'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}


  // ----------- RENDER -----------
  return (
<ScrollView contentContainerStyle={styles.container}>
{invitation && (
  <View style={styles.inviteBanner}>
    <Text style={styles.inviteText}>
      📩 Tu as été invité à cette session
      {invitation.inviter_username ? ` par ${invitation.inviter_username}` : ''}.
    </Text>
  </View>
)}
  <Text style={styles.title}>{session.title}</Text>
  <View style={{ height: 16 }} />
  <Text style={styles.address}>{session.location}</Text>
  <View style={{ height: 26 }} />
{session.lat && session.lng && (
  <View style={{ height: 220, borderRadius: 12, overflow: "hidden", marginHorizontal: 18 }}>
    <MapboxGL.MapView
      style={{ flex: 1 }}
      styleURL="mapbox://styles/mapbox/streets-v12"
      zoomEnabled={true}
      scrollEnabled={true}
      pitchEnabled={true}
      rotateEnabled={true}
    >
      {/* Caméra centrée sur la session */}
      <MapboxGL.Camera
        zoomLevel={15}
        centerCoordinate={[Number(session.lng), Number(session.lat)]}
        animationDuration={1200}
      />

      {/* Marker de la session */}
      <MapboxGL.PointAnnotation
        id="session-location"
        coordinate={[Number(session.lng), Number(session.lat)]}
      >
        <View
          style={{
            backgroundColor: "#FF5E62",
            borderRadius: 16,
            padding: 6,
            borderWidth: 2,
            borderColor: "#fff",
          }}
        >
          <Ionicons name="location" size={22} color="#fff" />
        </View>
      </MapboxGL.PointAnnotation>
    </MapboxGL.MapView>
  </View>
)}
  <View style={{ height: 22 }} />

  <View style={styles.row}>
    <View style={styles.infoBox}>
      <Ionicons name="calendar-outline" size={18} color="#e17055" style={{ marginRight: 6 }} />
      <Text style={styles.infoText}>
        {formatDateTime(session.date, session.time)}
      </Text>
    </View>
    <LinearGradient
colors={['#6A11CB', '#2575FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.levelBox}
    >
      <Text style={styles.levelText}>{session.level}</Text>
    </LinearGradient>
  </View>

  {/* Participants */}
  <Text style={styles.sectionTitle}>Participants</Text>
  <View style={styles.avatarsRow}>
    {participants.length === 0 && <Text style={styles.noPart}>Aucun participant</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {participants.map(p => (
        <View key={p.id} style={{ alignItems: "center", marginRight: 10 }}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() =>
              navigation.navigate('UserProfile', { userId: p.id })
            }
          >
            <Image source={{ uri: p.avatar }} style={styles.avatar} />
            <Text style={styles.avatarName} numberOfLines={1}>
              {p.username}
            </Text>
          </TouchableOpacity>
          {/* Bouton Exclure : visible uniquement pour le créateur sur tous sauf lui-même */}
          {user && session.creator_id === user.id && p.id !== user.id && (
<TouchableOpacity
  style={{
    marginLeft: -15,
    marginTop: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#d92e3f',
    borderRadius: 7
  }}
  onPress={() => {
    Alert.alert(
      "Exclure ce participant ?",
      `Tu vas retirer ${p.username} de cette session.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Exclure",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Ajoute à la table des bannis
              await supabase
                .from('sessions_kicked')
                .insert([{ session_id: session.id, user_id: p.id }]);

              // 2. Supprime le participant
              await supabase
                .from('session_participants')
                .delete()
                .eq('session_id', session.id)
                .eq('user_id', p.id);

await notifyExclusion({
  creatorId: session.creator_id,
  excludedId: p.id,
  excludedName: p.username,
  sessionTitle: session.title,
  sessionId: session.id,
  otherParticipantIds: participants.map(x => x.id).filter(id => id !== p.id && id !== session.creator_id),
});


              // 4. Feedback visuel
              Toast.show({
                type: 'success',
                text1: 'Participant exclu',
                text2: `${p.username} a été exclu de la session.`,
                position: 'top',
                topOffset: 48,
                visibilityTime: 2600,
              });

              fetchParticipants();
            } catch (e) {
              Alert.alert('Erreur', e.message);
            }
          }
        }
      ]
    );
  }}
>
  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>Exclure</Text>
</TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  </View>

  {/* ✅ Bouton Inviter un coéquipier juste sous la liste des participants */}
{(user && (session.creator_id === user.id || isParticipant)) && (
  <TouchableOpacity
    onPress={() => navigation.navigate('InviteFriendsToSession', { sessionId: session.id })}
    activeOpacity={0.88}
    style={{ alignSelf: 'center', marginTop: 3, marginBottom: 10 }}
  >
<LinearGradient
    colors={['#7D78F8', '#6D6AFF']}  // 🔥 même dégradé que "Laisser un avis"
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.inviteButton}
  >
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
        Inviter un coéquipier
      </Text>
    </LinearGradient>
  </TouchableOpacity>
)}

  {/* Description */}
  <Text style={styles.sectionTitle}>Description</Text>
  <View style={styles.descriptionBox}>
    <Text style={styles.descriptionText}>{session.description || "Aucune description."}</Text>
  </View>

{/* BLOC KICK/JOINTURE */}
{checkingKick || participantsLoading ? (
  <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator color="#e17055" />
  </View>
) : isKicked ? (
  <View style={{ marginTop: 18, padding: 14, backgroundColor: "#ffefee", borderRadius: 10 }}>
    <Text style={{ color: "#d92e3f", fontWeight: "bold", fontSize: 15, textAlign: "center" }}>
      Tu as été exclu de cette session par l'organisateur.{"\n"}Tu ne peux plus la rejoindre.
    </Text>
  </View>
) : (
  actionButtons
)}
</ScrollView>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  container: {
    padding: 0,
    backgroundColor: '#fff',
    paddingBottom: hp('1.3%'),
  },
  appBar: {
    height: hp('6.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.2%'),
    paddingTop: Platform.OS === 'android' ? hp('3.6%') : hp('1.2%'),
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f1f3',
    backgroundColor: '#fff',
  },
  leftButton: {
    position: 'absolute',
    left: wp('4.3%'),
    top: Platform.OS === 'android' ? hp('3.7%') : hp('1.2%'),
    padding: 2,
  },
  appBarTitle: {
    fontSize: wp('5.1%'),
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.1,
  },
  title: {
    fontSize: wp('6.1%'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 0,
    marginTop: hp('1.9%'),
    color: '#181818',
    letterSpacing: 0.1,
  },
  address: {
    fontSize: wp('4.1%'),
    color: '#666',
    textAlign: 'center',
    marginBottom: 0,
  },
  map: {
    width: '100%',
    alignSelf: 'center',
    height: hp('28%'),
    borderRadius: wp('5.8%'),
    marginBottom: 0,
    marginTop: 0,
    backgroundColor: '#f3f3f3',
    shadowColor: "#c0b6ae",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.17,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2.3%'),
    paddingHorizontal: wp('5.3%'),
    gap: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf6f1',
    borderRadius: wp('2.7%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.1%'),
    flex: 1,
    minWidth: 0,
  },
  levelBox: {
    borderRadius: wp('3.8%'),
    paddingHorizontal: wp('3.2%'),
    paddingVertical: hp('0.95%'),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp('18.7%'),
    marginLeft: wp('2.7%'),
    elevation: 3,
    shadowColor: "#e8764d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    alignSelf: 'flex-end',
  },
  levelText: {
    fontWeight: '700',
    fontSize: wp('3.4%'),
    color: '#fff',
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: wp('4.3%'),
    fontWeight: 'bold',
    marginLeft: wp('5.3%'),
    marginTop: hp('0.8%'),
    marginBottom: hp('1%'),
    letterSpacing: 0.15,
    color: '#242424',
  },
  avatarsRow: {
    marginBottom: hp('1%'),
    minHeight: hp('9%'),
    paddingLeft: wp('4.3%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPart: {
    color: '#aaa',
    fontSize: wp('3.4%'),
    fontStyle: 'italic',
    marginLeft: wp('2.1%'),
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: wp('4.8%'),
    width: wp('15.5%'),
  },
  avatar: {
    width: wp('12.8%'),
    height: wp('12.8%'),
    borderRadius: wp('6.4%'),
    borderWidth: 1,
    borderColor: '#ececec',
    marginBottom: 3,
    backgroundColor: '#f4f4f4',
  },
  avatarName: {
    fontSize: wp('3.2%'),
    color: '#444',
    textAlign: 'center',
    maxWidth: wp('14.4%'),
  },
  descriptionBox: {
    borderWidth: 1.1,
    borderColor: '#e0e0e0',
    backgroundColor: '#FCFCFC',
    borderRadius: wp('3.7%'),
    padding: wp('3.7%'),
    marginHorizontal: wp('4.8%'),
    marginBottom: hp('3.7%'),
    minHeight: hp('10.4%'),
    shadowColor: "#ccc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontSize: wp('4%'),
    lineHeight: hp('2.7%'),
    color: '#353535',
    fontWeight: '400',
    letterSpacing: 0.07,
  },
  joinButton: {
    paddingVertical: hp('1.6%'),
    borderRadius: wp('4.3%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginBottom: 0,
    shadowColor: "#e8764d",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.17,
    shadowRadius: 7,
    elevation: 5,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.7%'),
    letterSpacing: 0.2,
  },
  leaveButton: {
    backgroundColor: '#ff4343',
    borderRadius: wp('4.3%'),
    paddingVertical: hp('1.6%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginBottom: 0,
    shadowColor: "#ff4343",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.7%'),
    letterSpacing: 0.2,
  },
inviteButton: {
  paddingVertical: hp('1.2%'),
  paddingHorizontal: wp('6%'),
  borderRadius: wp('5%'),
  alignSelf: 'center',
  shadowColor: "#7D78F8",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.15,
  shadowRadius: 5,
  elevation: 3,
},
inviteButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: wp('3.6%'),
  letterSpacing: 0.2,
},

inviteBanner: {
  marginHorizontal: 18,
  marginBottom: 12,
  padding: 12,
  backgroundColor: '#f0f3ff',
  borderRadius: 10,
  borderLeftWidth: 4,
  borderLeftColor: '#6D6AFF',
},
inviteText: {
  color: '#333',
  fontSize: 14,
  fontWeight: '500',
},

});

export default SessionDetailScreen;
