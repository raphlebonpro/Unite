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
import Toast from 'react-native-toast-message';

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

  async function inviteFriend(friend) {
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

      // 3️⃣ Récupérer un token utilisateur pour appeler l’edge function
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;

      if (!token) {
        Alert.alert("Erreur", "Impossible de récupérer le token utilisateur.");
        return;
      }

      // 4️⃣ Envoi d'une notif via l’edge function
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ✅ correct
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
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("❌ Erreur appel send_notifications:", txt);
      }

      Toast.show({
        type: 'success',
        text1: 'Invitation envoyée 🎉',
        text2: `${friend.username} a reçu une invitation.`,
        position: 'top',
        topOffset: 50,
      });

      // 5️⃣ Retirer l’ami de la liste locale
      setFriends(prev => prev.filter(f => f.id !== friend.id));

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

  return (
    <View style={styles.container}>
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
                <LinearGradient
                  colors={['#FF9A6C', '#FF5E62']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.inviteBtn}
                >
                  <Text style={styles.inviteTxt}>Inviter</Text>
                </LinearGradient>
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
  },
  inviteTxt: { color: '#fff', fontWeight: 'bold' },
});
