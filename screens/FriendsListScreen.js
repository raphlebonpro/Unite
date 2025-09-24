// screens/FriendsListScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';
import {
  notifyFriendRemovedSender,
  notifyFriendRemovedReceiver,
} from '../helpers/notifications';

const FriendsListScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user } = useUser();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // On reçoit soit l'ID passé via route, soit on prend l'utilisateur connecté
  const { userId } = route?.params || {};
  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!targetUserId) {
        setFriends([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1) Ceux que targetUserId SUIT (sortants)
      const { data: out, error: outErr } = await supabase
        .from('friends')
        .select('following_id')
        .eq('follower_id', targetUserId);

      // 2) Ceux qui SUIVENT targetUserId (entrants)
      const { data: inc, error: incErr } = await supabase
        .from('friends')
        .select('follower_id')
        .eq('following_id', targetUserId);

      if (outErr || incErr) {
        console.error(outErr || incErr);
        setFriends([]);
        setLoading(false);
        return;
      }

      // 3) Amis = intersection (relation mutuelle)
      const outSet = new Set((out || []).map((r) => r.following_id));
      const incSet = new Set((inc || []).map((r) => r.follower_id));
      const mutualIds = [...outSet].filter((id) => incSet.has(id));

      if (mutualIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // 4) Récupération des profils
      const { data: usersRows, error: usersErr } = await supabase
        .from('users')
        .select('id, username, profile_photo')
        .in('id', mutualIds);

      if (usersErr) {
        console.error(usersErr);
        setFriends([]);
      } else {
        const list = (usersRows || []).sort((a, b) =>
          (a.username || '').localeCompare(b.username || '')
        );
        setFriends(list);
      }

      setLoading(false);
    };

    fetchFriends();
  }, [targetUserId]);

  const handleRemoveFriend = async (item) => {
    Alert.alert(
      'Supprimer cet ami ?',
      `Es-tu sûr de vouloir retirer ${item.username} de tes coéquipiers ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer la relation dans les deux sens
              await supabase
                .from('friends')
                .delete()
                .or(
                  `and(follower_id.eq.${user.id},following_id.eq.${item.id}),and(follower_id.eq.${item.id},following_id.eq.${user.id})`
                );

              // 🔎 Récupère mon pseudo et celui du pote supprimé
              const { data: me } = await supabase
                .from('users')
                .select('username')
                .eq('id', user.id)
                .maybeSingle();

              const { data: friend } = await supabase
                .from('users')
                .select('username')
                .eq('id', item.id)
                .maybeSingle();

              // 🔔 Notifs
              await notifyFriendRemovedSender({
                senderId: user.id,
                removedName: friend?.username || 'Cet utilisateur',
              });

              await notifyFriendRemovedReceiver({
                receiverId: item.id,
                removerName: me?.username || 'Un utilisateur',
              });

              // Mettre à jour la liste localement
              setFriends((prev) => prev.filter((f) => f.id !== item.id));
            } catch (e) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.profile_photo || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{item.username}</Text>
      </TouchableOpacity>

      {/* Bouton Supprimer : visible seulement si je consulte MA liste */}
      {targetUserId === user?.id && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFriend(item)}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : friends.length === 0 ? (
        <Text style={styles.noFriends}>Aucun coéquipier trouvé</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          contentContainerStyle={{ paddingVertical: 6 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  friendItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  username: { fontSize: 16, fontWeight: '600' },
  noFriends: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888' },
  removeBtn: {
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 10,
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default FriendsListScreen;
