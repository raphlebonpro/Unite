import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RefreshControl, Platform } from 'react-native';
import { SafeAreaView as SafeAreaViewCtx, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';


const MessagesGroupsScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadMap, setUnreadMap] = useState({}); // { [sessionId]: true/false }

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0); // forces a tiny re-layout after refresh

const onRefresh = async () => {
  setRefreshing(true);
  await fetchSessions();           // re-fetch list
  setLayoutKey(k => k + 1);        // nudge layout (fixes occasional Android status area paint)
  setRefreshing(false);
};

useFocusEffect(
  React.useCallback(() => {
    // keep it simple: paint white and use dark icons
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#fff');
      StatusBar.setTranslucent(false);
    }
  }, [])
);

  // sessions visibles après filtre
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(s => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  useEffect(() => {
    if (!user?.id) return;
    fetchSessions();
  }, [user?.id]);

  // Abonnement realtime: dès qu’un message arrive, on met à jour la pastille du groupe concerné
  useEffect(() => {
    if (!sessions.length || !user?.id) return;

    const channel = supabase
      .channel('public:messages_unread_badges')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const sid = payload?.new?.session_id;
          if (!sid) return;
          // Recalcule uniquement pour ce groupe
          await computeUnreadForSession(sid);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessions, user?.id]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_participants')
        .select('session_id, sessions(id, title, sport)')
        .eq('user_id', user.id);

      if (error) {
        setSessions([]);
        setUnreadMap({});
        setLoading(false);
        return;
      }

      const cleanSessions = (data || [])
        .filter(item => item.sessions)
        .map(item => ({
          id: item.sessions.id,
          title: item.sessions.title,
          sport: item.sessions.sport,
        }));

      // calcule les non-lus + trie les sessions + setSessions
      await computeUnreadForSessions(cleanSessions);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  // Récupère le dernier message pour CHAQUE session et compare à last_seen
  const computeUnreadForSessions = async (list) => {
    if (!list || !list.length) {
      setUnreadMap({});
      return;
    }
    const ids = list.map(s => s.id);

    // Tente un agrégat en un seul appel
    const { data: lastList, error: aggErr } = await supabase
      .from('messages')
      .select('session_id, last_message_at:max(created_at)')
      .in('session_id', ids);

    let lastMap = {};
    if (!aggErr && Array.isArray(lastList)) {
      lastList.forEach(r => {
        if (r.session_id) lastMap[r.session_id] = r.last_message_at;
      });
    } else {
      // fallback: un appel par session (plus verbeux, mais fiable)
      const perSession = await Promise.all(ids.map(async (sid) => {
        const { data } = await supabase
          .from('messages')
          .select('created_at')
          .eq('session_id', sid)
          .order('created_at', { ascending: false })
          .limit(1);
        return { sid, last: data && data[0]?.created_at ? data[0].created_at : null };
      }));
      perSession.forEach(({ sid, last }) => { lastMap[sid] = last; });
    }

    // Récupère les last_seen depuis AsyncStorage
    const keys = ids.map(sid => `last_seen_${sid}_${user.id}`);
    const seenPairs = await AsyncStorage.multiGet(keys);
    const seenMap = {};
    for (const [k, v] of seenPairs) {
      // k = last_seen_{sid}_{uid}
      const sid = k.split('_')[2];
      seenMap[sid] = v || null;
    }

    const nextUnread = {};
    const sessionDates = {};

    for (const sid of ids) {
      const lastMsg = lastMap[sid] ? new Date(lastMap[sid]).getTime() : 0;
      const lastSeen = seenMap[sid] ? new Date(seenMap[sid]).getTime() : 0;
      nextUnread[sid] = lastMsg > lastSeen;
      sessionDates[sid] = lastMsg;
    }

    setUnreadMap(nextUnread);

    // Trie la liste du plus récent au plus ancien (basé sur dernière activité)
    const sorted = [...list].sort((a, b) => {
      const aTime = sessionDates[a.id] || 0;
      const bTime = sessionDates[b.id] || 0;
      return bTime - aTime;
    });

    setSessions(sorted);
  };

  // Recalcule la pastille pour UNE session (utilisé par le realtime)
  const computeUnreadForSession = async (sessionId) => {
    // dernier message
    const { data } = await supabase
      .from('messages')
      .select('created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    const last = data && data[0]?.created_at ? new Date(data[0].created_at).getTime() : 0;
    const seenStr = await AsyncStorage.getItem(`last_seen_${sessionId}_${user.id}`);
    const lastSeen = seenStr ? new Date(seenStr).getTime() : 0;
    const hasUnread = last > lastSeen;

    setUnreadMap(prev => ({ ...prev, [sessionId]: hasUnread }));
  };

  const handleGroupPress = (sessionId) => {
    // Optimiste: on enlève la pastille tout de suite (le vrai last_seen sera écrit dans l’écran messages)
    setUnreadMap(prev => ({ ...prev, [sessionId]: false }));
    navigation.navigate('SessionMessages', { sessionId });
  };

  const handleDeleteGroup = (sessionId, sessionTitle) => {
    Alert.alert(
      'Supprimer le groupe',
      `Tu es sur le point de supprimer le groupe "${sessionTitle}". Cette action est irréversible. Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteGroup(sessionId),
        },
      ]
    );
  };

  const deleteGroup = async (sessionId) => {
    setLoading(true);
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    if (error) {
      Alert.alert('Erreur', 'Impossible de supprimer ce groupe.');
    } else {
      // retire du state + pastille
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setUnreadMap(prev => {
        const copy = { ...prev };
        delete copy[sessionId];
        return copy;
      });
    }
    setLoading(false);
  };

return (
  <SafeAreaViewCtx style={{ flex: 1, backgroundColor: '#fff' }}>
    {/* StatusBar explicit (first paint) */}
    <StatusBar barStyle="dark-content" backgroundColor="#fff" />

    {/* Mini app bar already handles insets internally */}
    <MiniAppBar
      title="Messages"
      hasNotifications={false}
      onNotificationsPress={() => navigation.navigate('Notifications')}
      onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
    />

    {/* Search bar */}
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={22} color="#B8B8B8" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search group chats"
        placeholderTextColor="#B8B8B8"
        value={search}
        onChangeText={setSearch}
      />
    </View>

    {/* List */}
    {loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2EB47B" />
      </View>
    ) : filteredSessions.length === 0 ? (
      <FlatList
        data={[]}
        keyExtractor={() => 'empty'}
        ListEmptyComponent={
          <View style={styles.loadingContainer}>
            <Text style={{ color: '#aaa', fontSize: 17, fontWeight: '500' }}>
              Aucun groupe trouvé
            </Text>
          </View>
        }
        // allow pull to refresh even on empty state
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5B4EFF']}
            tintColor="#5B4EFF"
            progressBackgroundColor="#fff"
          />
        }
      />
    ) : (
      <FlatList
        key={layoutKey}                    // small kick for Android layout after refresh
        data={filteredSessions}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const hasUnread = !!unreadMap[item.id];
          return (
            <View style={styles.groupRow}>
              <TouchableOpacity
                style={styles.groupTouchable}
                activeOpacity={0.7}
                onPress={() => handleGroupPress(item.id)}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {item.title.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.infoContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.groupTitle} numberOfLines={1}>{item.title}</Text>
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Ionicons name="mail-unread-outline" size={16} color="#ff6b6b" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.groupSport} numberOfLines={1}>{item.sport}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteGroup(item.id, item.title)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={22} color="#D83C3C" />
              </TouchableOpacity>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5B4EFF']}           // Android spinner color
            tintColor="#5B4EFF"            // iOS spinner color
            progressBackgroundColor="#fff"
          />
        }
        contentContainerStyle={{
          // make sure background shows under status area during pull
          paddingBottom: 8,
          backgroundColor: '#fff',
        }}
      />
    )}
  </SafeAreaViewCtx>
);
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F7',
    marginHorizontal: wp('4.5%'),
    borderRadius: wp('3.2%'),
    paddingHorizontal: wp('3.7%'),
    height: hp('5.3%'),
    marginTop: hp('1.3%'),
    marginBottom: hp('0.7%'),
  },
  searchInput: {
    flex: 1,
    fontSize: hp('2%'),
    marginLeft: wp('2%'),
    color: '#222',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    backgroundColor: '#fff',
  },
  groupTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('4%'),
  },
  avatarLetter: {
    fontSize: hp('2.7%'),
    color: '#2EB47B',
    fontWeight: '700',
    letterSpacing: 1,
  },

  infoContainer: { flex: 1, flexDirection: 'column', justifyContent: 'center' },

  titleRow: { flexDirection: 'row', alignItems: 'center' },
  groupTitle: {
    fontSize: hp('2.1%'),
    fontWeight: '700',
    color: '#232323',
    letterSpacing: 0,
    flexShrink: 1,
    maxWidth: '92%',
  },
  unreadBadge: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupSport: {
    fontSize: hp('1.6%'),
    color: '#A0A4A8',
    fontWeight: '500',
    marginTop: hp('0.13%'),
  },

  deleteButton: {
    marginLeft: wp('2.7%'),
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('1%'),
  },
});

export default MessagesGroupsScreen;
