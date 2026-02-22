import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&name=U';

export default function InviteFriendsToSession() {
  const route = useRoute();
  const { sessionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSession();
      fetchFriends();
    }
  }, [user]);

  async function fetchUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUser(data.user);
  }

  async function fetchSession() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!error) setSession(data);
  }

  async function fetchFriends() {
    if (!user) return;

    // 🔹 Récupérer la liste d'amis
    const { data: rows, error } = await supabase
      .from('friends')
      .select(`
        follower_id,
        following_id,
        users:following_id(id, username, profile_photo)
      `)
      .eq('follower_id', user.id);

    if (error) {
      console.error(error);
      return;
    }

    const friendsList = rows.map(r => ({
      id: r.users.id,
      username: r.users.username,
      avatar: r.users.profile_photo || DEFAULT_AVATAR,
    }));

    // 🔹 Exclure déjà participants
    const { data: participants } = await supabase
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId);

    const currentIds = (participants || []).map(p => p.user_id);
    const filtered = friendsList.filter(f => !currentIds.includes(f.id));

    setFriends(filtered);
    setLoading(false);
  }

async function sendInvite(friend) {
  try {
    if (!user) return;

    // 1️⃣ Vérifier si déjà invité
    const { data: existing } = await supabase
      .from('session_invitations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('invited_id', friend.id)
      .maybeSingle();

    if (existing) {
      Alert.alert('Info', `${friend.username} est déjà invité à cette session.`);
      return;
    }

    // 2️⃣ Enregistrement de l’invitation
    const { error: insertErr } = await supabase
      .from('session_invitations')
      .insert({
        session_id: sessionId,
        inviter_id: user.id,
        invited_id: friend.id,
      });

    if (insertErr) {
      Alert.alert('Erreur', insertErr.message);
      return;
    }

    // 3️⃣ Token
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token;
    if (!token) {
      Alert.alert("Erreur", "Impossible de récupérer le token utilisateur.");
      return;
    }

    // 4️⃣ Notification
    await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send_notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: friend.id,
          sender_id: user.id,
          session_id: sessionId,
          type: 'friend_invited_session',
          title: 'Invitation à une session',
          message: `${user.user_metadata?.username || 'Un coéquipier'} t’a invité à rejoindre la session "${session?.title}"`,
          push: true,
        }),
      }
    );

    // 5️⃣ Retirer l’ami de la liste
    setFriends(prev => prev.filter(f => f.id !== friend.id));

    // 6️⃣ Feedback clair
    Alert.alert(
      'Invitation envoyée',
      `${friend.username} a reçu une invitation.`
    );

  } catch (e) {
    Alert.alert('Erreur', e.message);
  }
}

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e17055" />
      </View>
    );
  }

  function inviteFriend(friend) {
  Alert.alert(
    'Inviter un coéquipier',
    `Es-tu sûr de vouloir inviter ${friend.username} à rejoindre cette session ?`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Inviter',
        style: 'default',
        onPress: () => sendInvite(friend),
      },
    ],
    { cancelable: true }
  );
}


  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
  <Ionicons name="information-circle-outline" size={18} color="#FF6C4A" />
  <Text style={styles.infoText}>
    Invite des coéquipiers pour remplir la session plus vite et partager l’expérience avec des personnes que tu connais.
  </Text>
</View>
      {friends.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={60} color="#aaa" />
          <Text style={styles.emptyText}>Aucun coéquipier à inviter</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => `${sessionId}-${item.id}`}
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <Text style={styles.username}>{item.username}</Text>
              <TouchableOpacity onPress={() => inviteFriend(item)} activeOpacity={0.85}>
                <View
                  style={[styles.inviteBtn]} >
                  <Text style={styles.inviteTxt}>Inviter</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 16, color: '#888' },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.7,
    borderBottomColor: '#eee',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  username: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
  inviteBtn: {
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#FE5D02'
  },
  inviteTxt: { color: '#fff', fontWeight: 'bold' },
  infoBox: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#FFF3EE',
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
},
infoText: {
  flex: 1,
  marginLeft: 8,
  fontSize: 14,
  color: '#444',
  lineHeight: 20,
},
});
