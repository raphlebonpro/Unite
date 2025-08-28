import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { notifyUser } from '../helpers/notifications';

const SearchFriendsScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    })();
  }, []);

// SearchFriendsScreen.jsx (extraits)
// ...

const handleSearch = async (text) => {
  setQuery(text);
  if (text.length < 2) {
    setResults([]);
    return;
  }
  setLoading(true);

  const { data, error } = await supabase
    .from('users')
    .select('id, username, profile_photo')
    .ilike('username', `%${text}%`)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .limit(20);

  if (!error) {
    // demandes envoyées par le currentUser
    const { data: requests } = await supabase
      .from('friend_requests')
      .select('receiver_id, status')
      .eq('sender_id', currentUserId);

    // amitiés existantes (optionnel)
    const { data: friendsRows } = await supabase
      .from('friends')
      .select('follower_id, following_id')
      .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`);

    const isFriendWith = (uid) =>
      (friendsRows || []).some(r =>
        (r.follower_id === currentUserId && r.following_id === uid) ||
        (r.following_id === currentUserId && r.follower_id === uid)
      );

    const resultsWithStatus = (data || []).map(u => {
      const req = (requests || []).find(r => r.receiver_id === u.id);
      return {
        ...u,
        requestStatus: req?.status || null,
        isFriend: isFriendWith(u.id),
      };
    });

    setResults(resultsWithStatus);
  }
  setLoading(false);
};

const handleSendFriendRequest = async (friendId) => {
  if (!currentUserId) return;

  // MAJ optimiste → "En attente"
  setResults(prev => prev.map(u =>
    u.id === friendId ? { ...u, requestStatus: 'pending' } : u
  ));

  const { error } = await supabase.from('friend_requests').insert({
    sender_id: currentUserId,
    receiver_id: friendId,
    status: 'pending',
  });

  if (error) {
    console.error("Erreur demande d'ami:", error);
    // rollback si besoin
    setResults(prev => prev.map(u =>
      u.id === friendId ? { ...u, requestStatus: null } : u
    ));
    return;
  }

  // Notifier le destinataire (avec sender_id)
  await notifyUser({
    user_id: friendId,
    title: "Nouvelle demande d’ami",
    body: "Tu as reçu une demande d’ami",
    type: "friend_request",
    sender_id: currentUserId,
    push: true,
  });

  // Notifier l’expéditeur (confirmation visible dans sa page notif)
  await notifyUser({
    user_id: currentUserId,
    title: "Demande envoyée",
    body: "Ta demande d’ami a bien été envoyée.",
    type: "friend_request_sent",
    sender_id: currentUserId,
  });
};

  const navigation = useNavigation();

const renderItem = ({ item }) => (
  <TouchableOpacity 
    style={styles.userRow} 
    activeOpacity={0.85}
    onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
  >
    {item.profile_photo ? (
      <Image source={{ uri: item.profile_photo }} style={styles.avatar} />
    ) : (
      <View style={[styles.avatar, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontWeight: 'bold', fontSize: wp('4.5%'), color: '#1877F2' }}>
          {item.username?.charAt(0).toUpperCase()}
        </Text>
      </View>
    )}
    <Text style={styles.username}>{item.username}</Text>

{item.id !== currentUserId && (
  !item.isFriend ? (
    item.requestStatus === 'pending' ? (
      <View style={[styles.friendGradientBtn, { backgroundColor: '#e0e0e0' }]}>
        <Text style={[styles.friendGradientText, { color: '#666' }]}>En attente</Text>
      </View>
    ) : (
      <TouchableOpacity 
        onPress={() => handleSendFriendRequest(item.id)} 
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#6A11CB', '#2575FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.friendGradientBtn}
        >
          <Text style={styles.friendGradientText}>Ajouter</Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  ) : (
    <View style={[styles.friendGradientBtn, { backgroundColor: '#e0e0e0' }]}>
      <Text style={[styles.friendGradientText, { color: '#666' }]}>Déjà amis</Text>
    </View>
  )
)}
  </TouchableOpacity>
);

  return (
    <SafeAreaView style={styles.container}>
{!loading && results.length === 0 && query.length === 0 && (
  <View style={styles.emptyStateContainer}>
    <Text style={styles.emptyStateTitle}>⚡ Construis ton équipe</Text>
    <Text style={styles.emptyStateText}>
« Entoure-toi de partenaires qui t’inspirent. Ensemble, allez plus loin, plus vite, et faites vibrer Unite. »
    </Text>
  </View>
)}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Rechercher un pseudo..."
        value={query}
        onChangeText={handleSearch}
      />
    
      {loading && <ActivityIndicator size="small" style={{ marginTop: 12 }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbff',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    fontSize: wp('4%'),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: wp('8%'),
    marginTop: hp('3%'),
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 6,
    padding: 12,
    borderRadius: wp('5%'),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginRight: wp('4%'),
  },
  username: {
    flex: 1,
    fontSize: wp('4.2%'),
    fontWeight: '600',
    color: '#222',
  },
  friendGradientBtn: {
    borderRadius: wp('6%'),
    paddingVertical: hp('0.9%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendGradientText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.9%'),
  },
emptyStateContainer: {
  marginTop: hp('4%'),
  marginBottom: hp('3%'),
  paddingHorizontal: wp('8%'),
  alignItems: 'center',
},
emptyStateTitle: {
  fontSize: wp('5%'),
  fontWeight: '700',
  color: '#111',
  marginBottom: hp('1.2%'),
  textAlign: 'center',
},
emptyStateText: {
  fontSize: wp('3.9%'),
  color: '#555',
  textAlign: 'center',
  lineHeight: wp('6%'),
  marginBottom: hp('1%'),
},
});

export default SearchFriendsScreen;
