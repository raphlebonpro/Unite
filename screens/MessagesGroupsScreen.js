import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  StatusBar,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';

const MessagesGroupsScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadMap, setUnreadMap] = useState({}); // { [sessionId]: number }

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0); // forces a tiny re-layout after refresh

  const [activeTab, setActiveTab] = useState('sessions');

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchSessions();           // re-fetch list
  setLayoutKey(k => k + 1);        // nudge layout (fixes occasional Android status area paint)
  setRefreshing(false);
};

const handleDeleteAllGroups = () => {
  Alert.alert(
    'Tout effacer',
    'Es-tu sûr de vouloir supprimer tous tes groupes de messages ?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('session_participants')
            .delete()
            .eq('user_id', user.id);

          if (error) {
            Alert.alert('Erreur', 'Impossible de supprimer tous les groupes.');
          } else {
            setSessions([]);
            setUnreadMap({});
          }
        },
      },
    ]
  );
};

  // sessions visibles après filtre
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(s => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  useEffect(() => {
    if (!user?.id) return;
    fetchSessions();
    fetchGroups();
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
        .select('session_id, sessions(id, title, sport, date, time)')
        .eq('user_id', user.id);

      if (error) {
        setSessions([]);
        setUnreadMap({});
        setLoading(false);
        return;
      }

      const cleanSessions = (data || [])
        .filter(item => item.sessions)
.map(item => {
  const sessionDate = new Date(
    `${item.sessions.date}T${item.sessions.time}`
  );
  const isPast = sessionDate < new Date();

  return {
    id: item.sessions.id,
    title: item.sessions.title,
    sport: item.sessions.sport,
    date: item.sessions.date,
    time: item.sessions.time,
    status: isPast ? 'terminated' : 'active',
  };
});

      // calcule les non-lus + trie les sessions + setSessions
      await computeUnreadForSessions(cleanSessions);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
  try {
    setLoadingGroups(true);
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        group_id,
        groups (
          id,
          name,
          sport,
          city,
          cover_url
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur fetchGroups:", error);
      setGroups([]);
      setLoadingGroups(false);
      return;
    }

    // Nettoyage des données
    const cleanGroups = (data || [])
      .filter(item => item.groups)
      .map(item => ({
        id: item.groups.id,
        name: item.groups.name,
        sport: item.groups.sport,
        city: item.groups.city,
        cover_url: item.groups.cover_url,
      }));

    setGroups(cleanGroups);
    setLoadingGroups(false);
  } catch (err) {
    console.error("Erreur globale fetchGroups:", err);
    setLoadingGroups(false);
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
      let q = supabase
  .from('messages')
  .select('id', { count: 'exact', head: true })
  .eq('session_id', sid)
  .neq('user_id', user.id);

if (seenMap[sid]) {
  q = q.gt('created_at', seenMap[sid]);
}

const { count } = await q;

nextUnread[sid] = count || 0;
      sessionDates[sid] = lastMsg;
    }

    setUnreadMap(nextUnread);

    // Trie la liste du plus récent au plus ancien (basé sur dernière activité)
    const sorted = [...list].sort((a, b) => {
      const aTime = sessionDates[a.id] || 0;
      const bTime = sessionDates[b.id] || 0;
      const sorted = [...list].sort((a, b) => {
  const aLast = sessionDates[a.id] || 0;
  const bLast = sessionDates[b.id] || 0;

  if (aLast && bLast) return bLast - aLast;
  if (aLast) return -1;
  if (bLast) return 1;

  const aDate = new Date(`${a.date}T${a.time}`).getTime();
  const bDate = new Date(`${b.date}T${b.time}`).getTime();

  return bDate - aDate;
});
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
const computeUnreadForSession = async (sessionId) => {
  const seenStr = await AsyncStorage.getItem(
    `last_seen_${sessionId}_${user.id}`
  );
  const lastSeen = seenStr ? new Date(seenStr).toISOString() : null;

  let query = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .neq('user_id', user.id);

  if (lastSeen) {
    query = query.gt('created_at', lastSeen);
  }

  const { count } = await query;

  setUnreadMap(prev => ({
    ...prev,
    [sessionId]: count || 0,
  }));
};
  };

const handleGroupPress = async (sessionId) => {
  // On récupère le dernier message de la session
  const { data } = await supabase
    .from('messages')
    .select('created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastMsg = data[0];
    await AsyncStorage.setItem(
      `last_seen_${sessionId}_${user.id}`,
      lastMsg.created_at
    );
  }

  // Optimiste: enlever la pastille
  setUnreadMap(prev => ({ ...prev, [sessionId]: false }));

  // Navigation
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
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    {/* ✅ Supprime les doubles SafeArea + StatusBar fixe */}
<StatusBar
  translucent={false}
  backgroundColor="#fff"
  barStyle="dark-content"
/>

    {/* ✅ MiniAppBar stabilisée */}
    <MiniAppBar
      title="Messages"
      onNotificationsPress={() => navigation.navigate('Notifications')}
      onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
      showLeaderboard={false}
    />

    {/* ✅ Espace compensateur pour ne pas que le contenu passe sous la barre */}
    <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 0 : 0 }}>
      {/* 🔹 Toggle Sessions / Groupes */}
      <View style={styles.tabContainer}>
        {['sessions', 'groups'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.9}
            >
              <View style={styles.gradientWrapper}>
                {isActive && (
                  <LinearGradient
                    colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBackground}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {tab === 'sessions' ? 'Sessions' : 'Groupes'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

        {/* 🔹 Bouton “Effacer tous les groupes” */}
        {sessions.length > 0 && (
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
              onPress={handleDeleteAllGroups}
              activeOpacity={0.84}
            >
              <Feather name="trash-2" size={17} color="#D83C3C" style={{ marginRight: 7 }} />
              <Text style={{ color: '#D83C3C', fontWeight: '600' }}>
                Effacer tous les groupes
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 🔹 Contenu principal */}
        {activeTab === 'sessions' ? (
          <>
            {/* Barre de recherche */}
            {sessions.length > 0 && (
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={22} color="#B8B8B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Chercher un groupe de session"
                  placeholderTextColor="#B8B8B8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            )}

            {/* Liste des sessions */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size={Platform.OS === 'ios' ? 'large' : 50}
                  color="#FF6B3C"
                />
              </View>
            ) : filteredSessions.length === 0 ? (
              <FlatList
                data={[]}
                keyExtractor={() => 'empty'}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <MaterialCommunityIcons
                      name="message-text-outline"
                      size={68}
                      color="#bbb"
                    />
                    <Text style={styles.emptyText}>Aucun groupe trouvé</Text>
                  </View>
                }
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
                key={layoutKey}
                data={filteredSessions}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const unreadCount = unreadMap[item.id] || 0;
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
                            <Text style={styles.groupTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
{unreadCount > 0 && (
  <View style={styles.unreadBubble}>
    <Text style={styles.unreadText}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </Text>
  </View>
)}
                          </View>
                          <Text style={styles.groupSport} numberOfLines={1}>
                            {item.sport}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.statusRow}>
    <View
      style={[
        styles.statusDot,
        { backgroundColor: item.status === 'active' ? '#2ECC71' : '#B0B0B0' },
      ]}
    />
    <Text style={styles.statusText}>
      {item.status === 'active' ? 'En cours' : 'Terminée'}
    </Text>
  </View>

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
                    colors={['#5B4EFF']}
                    tintColor="#5B4EFF"
                    progressBackgroundColor="#fff"
                  />
                }
                contentContainerStyle={{
                  paddingBottom: 8,
                  backgroundColor: '#fff',
                }}
              />
            )}
          </>
        ) : (
          // 🔹 Liste des groupes
          loadingGroups ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size={Platform.OS === 'ios' ? 'large' : 50}
                color="#FF6B3C"
              />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={68}
                color="#bbb"
              />
              <Text style={styles.emptyText}>Aucun groupe rejoint pour le moment</Text>
            </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.groupRow}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("GroupChat", { groupId: item.id })}
                >
                  <View style={styles.avatarCircle}>
                    {item.cover_url ? (
                      <Image
                        source={{ uri: item.cover_url }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                      />
                    ) : (
                      <Text style={styles.avatarLetter}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoContainer}>
                    <Text style={styles.groupTitle}>{item.name}</Text>
                    <Text style={styles.groupSport}>
                      {item.sport} • {item.city}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={async () => {
                    setRefreshing(true);
                    await fetchGroups();
                    setRefreshing(false);
                  }}
                  colors={['#FF6C4A']}
                  tintColor="#FF6C4A"
                />
              }
              contentContainerStyle={{
                paddingBottom: 8,
                backgroundColor: "#fff",
              }}
            />
          )
        )}
      </View>
  </View>
)};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F7',
    marginHorizontal: wp('4.5%'),
    borderRadius: wp('3.2%'),
    paddingHorizontal: wp('3.7%'),
    height: hp('5.3%'),
    marginTop: hp('0.7%'),
    marginBottom: hp('0.4%'),
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
  emptyBox: {
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 30, // ajuste si besoin pour bien centrer
},
emptyText: {
  marginTop: 12,
  fontSize: 17,
  fontWeight: '500',
  color: '#aaa',
},
tabContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#F6F6F7',
  borderRadius: 30,
  marginHorizontal: wp('5%'),
  marginTop: 12,
  marginBottom: 8,
  padding: 4,
},
tabButton: {
  flex: 1,
  height: hp('4.6%'),
  borderRadius: 25,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
},
gradientWrapper: {
  flex: 1,
  width: '100%',
  height: '100%',
  borderRadius: 25,
  alignItems: 'center',
  justifyContent: 'center',
},
gradientBackground: {
  ...StyleSheet.absoluteFillObject,
  borderRadius: 25,
},
tabText: {
  fontSize: hp('1.9%'),
  color: '#777',
  fontWeight: '600',
  textAlign: 'center',
},
tabTextActive: {
  color: '#fff',
  fontWeight: '700',
},
unreadBubble: {
  backgroundColor: '#FF375E',
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  paddingHorizontal: 6,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 8,
},
unreadText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '700',
},
statusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},
statusDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  marginRight: 6,
},
statusText: {
  fontSize: hp('1.5%'),
  color: '#777',
  fontWeight: '500',
},
});

export default MessagesGroupsScreen;
