import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { notifyUser } from '../helpers/notifications';
import { Feather, Ionicons } from '@expo/vector-icons';

// ─── Couleurs d'avatar par initiale ──────────────────────────────────────────
const AVATAR_COLORS = [
  '#F62DAE', '#3888FF', '#FFA726', '#2ECC71',
  '#7367F0', '#E9436D', '#3CD6E6', '#FE5D02',
];
const getAvatarColor = (str = '') => {
  const i = str.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
};

// ─────────────────────────────────────────────────────────────────────────────
const SearchFriendsScreen = () => {
  const navigation = useNavigation();

  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const inputRef  = useRef(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    })();

    // Entrée animée de l'empty state
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Recherche ──────────────────────────────────────────────────────────────
  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length < 1) { setResults([]); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select('id, username, profile_photo')
      .ilike('username', `${text}%`)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .limit(20);

    if (!error) {
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('receiver_id, status')
        .eq('sender_id', currentUserId);

      const { data: friendsRows } = await supabase
        .from('friends')
        .select('follower_id, following_id')
        .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`);

      const isFriendWith = (uid) =>
        (friendsRows || []).some(r =>
          (r.follower_id === currentUserId && r.following_id === uid) ||
          (r.following_id === currentUserId && r.follower_id === uid)
        );

      setResults(
        (data || []).map(u => {
          const req = (requests || []).find(r => r.receiver_id === u.id);
          return { ...u, requestStatus: req?.status || null, isFriend: isFriendWith(u.id) };
        })
      );
    }
    setLoading(false);
  };

  const handleClear = () => { setQuery(''); setResults([]); inputRef.current?.focus(); };

  // ── Demande d'ami ──────────────────────────────────────────────────────────
  const handleSendFriendRequest = async (friendId) => {
    if (!currentUserId) return;

    setResults(prev => prev.map(u =>
      u.id === friendId ? { ...u, requestStatus: 'pending' } : u
    ));

    const { error } = await supabase.from('friend_requests').insert({
      sender_id:   currentUserId,
      receiver_id: friendId,
      status:      'pending',
    });

    if (error) {
      console.error("Erreur demande d'ami:", error);
      setResults(prev => prev.map(u =>
        u.id === friendId ? { ...u, requestStatus: null } : u
      ));
      return;
    }

    await notifyUser({
      user_id: friendId,
      title: "Nouvelle demande d'ami",
      body: "Tu as reçu une demande d'ami",
      type: 'friend_request',
      sender_id: currentUserId,
      push: true,
    });

    await notifyUser({
      user_id: currentUserId,
      title: 'Demande envoyée',
      body: "Ta demande d'ami a bien été envoyée.",
      type: 'friend_request_sent',
      sender_id: currentUserId,
    });
  };

  // ── Bouton d'action ────────────────────────────────────────────────────────
  const ActionButton = ({ item }) => {
    if (item.id === currentUserId) return null;

    if (item.isFriend) {
      return (
        <View style={styles.btnGhost}>
          <Ionicons name="checkmark" size={13} color="#2ECC71" style={{ marginRight: 4 }} />
          <Text style={[styles.btnText, { color: '#2ECC71' }]}>Amis</Text>
        </View>
      );
    }

    if (item.requestStatus === 'pending') {
      return (
        <View style={styles.btnGhost}>
          <Ionicons name="time-outline" size={13} color="#999" style={{ marginRight: 4 }} />
          <Text style={[styles.btnText, { color: '#999' }]}>En attente</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.btnAdd}
        onPress={() => handleSendFriendRequest(item.id)}
        activeOpacity={0.82}
      >
        <Ionicons name="person-add-outline" size={13} color="#fff" style={{ marginRight: 4 }} />
        <Text style={[styles.btnText, { color: '#fff' }]}>Ajouter</Text>
      </TouchableOpacity>
    );
  };

  // ── User row ───────────────────────────────────────────────────────────────
  const UserRow = ({ item }) => {
    const avatarColor = getAvatarColor(item.username || '');
    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.78}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        {/* Avatar */}
        {item.profile_photo ? (
          <Image source={{ uri: item.profile_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor + '22' }]}>
            <Text style={[styles.avatarLetter, { color: avatarColor }]}>
              {item.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Nom */}
        <View style={{ flex: 1 }}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
          {item.isFriend && (
            <Text style={styles.friendLabel}>Coéquipier</Text>
          )}
        </View>

        {/* Bouton action */}
        <ActionButton item={item} />
      </TouchableOpacity>
    );
  };

  // ── Séparateur ─────────────────────────────────────────────────────────────
  const Separator = () => <View style={styles.separator} />;

  // ── Empty state ────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <Animated.View
      style={[
        styles.emptyWrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Icône centrale */}
      <View style={styles.emptyIconWrap}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="people-outline" size={32} color="#F62DAE" />
        </View>
      </View>

      <Text style={styles.emptyTitle}>Construis ton équipe</Text>
      <Text style={styles.emptySub}>
        Entoure-toi de coéquipiers qui t'inspirent.{'\n'}
        Ensemble, allez plus loin et faites vibrer Unite.
      </Text>

      {/* Pills de suggestion visuelles */}
      <View style={styles.suggestionRow}>
        {['⚽ Footballeur', '🏃 Runner', '🎾 Tennisman'].map(label => (
          <View key={label} style={styles.suggestionPill}>
            <Text style={styles.suggestionText}>{label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  // ── No result ──────────────────────────────────────────────────────────────
  const NoResult = () => (
    <View style={styles.noResultWrap}>
      <Ionicons name="search-outline" size={32} color="#DDD" style={{ marginBottom: 10 }} />
      <Text style={styles.noResultTitle}>Aucun coéquipier trouvé</Text>
      <Text style={styles.noResultSub}>Essaie un autre pseudo</Text>
    </View>
  );

  const showEmpty    = !loading && results.length === 0 && query.length === 0;
  const showNoResult = !loading && results.length === 0 && query.length > 0;

  // ── Header de la liste ─────────────────────────────────────────────────────
  const ListHeader = () =>
    results.length > 0 ? (
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {results.length} résultat{results.length > 1 ? 's' : ''}
        </Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Barre de recherche ─────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={17} color={query.length > 0 ? '#F62DAE' : '#BBB'} style={{ marginRight: 10 }} />

          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Rechercher un coéquipier…"
            placeholderTextColor="#C0C0C0"
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {/* Loader inline */}
          {loading && (
            <ActivityIndicator size="small" color="#F62DAE" style={{ marginLeft: 8 }} />
          )}

          {/* Croix effacer */}
          {query.length > 0 && !loading && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.clearBtn}>
                <Ionicons name="close" size={13} color="#999" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Contenu ────────────────────────────────────────────────────── */}
      {showEmpty ? (
        <EmptyState />
      ) : showNoResult ? (
        <NoResult />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <UserRow item={item} />}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default SearchFriendsScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('0.5%'),
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    borderRadius: 14,
    height: hp('6%'),
    paddingHorizontal: wp('4%'),
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    fontSize: wp('4%'),
    color: '#111',
    paddingVertical: 0,
    fontWeight: '500',
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('0.5%'),
    paddingBottom: hp('4%'),
  },
  resultHeader: {
    paddingVertical: hp('1%'),
    paddingHorizontal: 2,
  },
  resultCount: {
    fontSize: hp('1.7%'),
    color: '#B0B0B0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F7',
    marginLeft: wp('17%'),
  },

  // ── User row ──────────────────────────────────────────────────────────────
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.55%'),
    backgroundColor: '#fff',
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),    // carré arrondi cohérent avec MessagesScreen
    marginRight: wp('3.5%'),
    flexShrink: 0,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: wp('5%'),
    fontWeight: '800',
  },

  // ── Textes ────────────────────────────────────────────────────────────────
  username: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  friendLabel: {
    fontSize: wp('3.2%'),
    color: '#2ECC71',
    fontWeight: '600',
  },

  // ── Boutons action ────────────────────────────────────────────────────────
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F62DAE',
    borderRadius: 20,
    paddingVertical: hp('0.85%'),
    paddingHorizontal: wp('3.8%'),
    flexShrink: 0,
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: hp('0.85%'),
    paddingHorizontal: wp('3.5%'),
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    flexShrink: 0,
  },
  btnText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('8%'),
    paddingBottom: hp('10%'),
  },
  emptyIconWrap: {
    marginBottom: hp('2.5%'),
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFF0F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: '#111',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  emptySub: {
    fontSize: wp('3.8%'),
    color: '#AAA',
    textAlign: 'center',
    lineHeight: wp('5.8%'),
    marginBottom: hp('3%'),
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionPill: {
    backgroundColor: '#FFF0F8',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FFD6EE',
  },
  suggestionText: {
    fontSize: wp('3.3%'),
    color: '#F62DAE',
    fontWeight: '600',
  },

  // ── No result ─────────────────────────────────────────────────────────────
  noResultWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp('12%'),
  },
  noResultTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  noResultSub: {
    fontSize: wp('3.6%'),
    color: '#C0C0C0',
    fontWeight: '500',
  },
});
