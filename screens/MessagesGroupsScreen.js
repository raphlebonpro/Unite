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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessagesGroupsScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('sessions');

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchSessions();           // re-fetch list
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
    fetchGroups();
  }, [user?.id]);

const fetchSessions = async () => {
  try {
    setLoading(true);

    // 1️⃣ sessions de l’utilisateur
    const { data: sessionsData, error } = await supabase
      .from('session_participants')
      .select('session_id, sessions(id, title, sport, date, time)')
      .eq('user_id', user.id);

    if (error) throw error;

// ✅ 1️⃣ Récupère TOUS les derniers messages (1 requête)
const { data: lastMessages } = await supabase
  .from('messages')
  .select('session_id, created_at, sender_id')
  .order('created_at', { ascending: false });

// Map : session_id → dernier message
const lastMessageMap = {};
lastMessages?.forEach(msg => {
  if (!lastMessageMap[msg.session_id]) {
    lastMessageMap[msg.session_id] = msg;
  }
});

    const now = new Date();

    // ✅ 2️⃣ Récupère tous les last_seen en une fois
const keys = (sessionsData || [])
  .filter(item => item.sessions)
  .map(item => `last_seen_${item.sessions.id}`);

const seenPairs = await AsyncStorage.multiGet(keys);

// Map : session_id → lastSeen
const lastSeenMap = {};
seenPairs.forEach(([key, value]) => {
  if (value) {
    const sessionId = key.replace('last_seen_', '');
    lastSeenMap[sessionId] = value;
  }
});

const cleanSessions = (sessionsData || [])
    .filter(item => item.sessions)
.map(item => {
  const startDate = new Date(
    `${item.sessions.date}T${item.sessions.time}`
  );

  const isPast = startDate < now;

  const lastMsg = lastMessageMap[item.sessions.id];
  const lastSeen = lastSeenMap[item.sessions.id];

  const hasUnread =
    lastMsg &&
    lastMsg.sender_id !== user.id &&
    (!lastSeen || new Date(lastMsg.created_at) > new Date(lastSeen));

  return {
    id: item.sessions.id,
    title: item.sessions.title,
    sport: item.sessions.sport,
    date: item.sessions.date,
    time: item.sessions.time,
    startDate,
    status: isPast ? 'terminated' : 'active',
    hasUnread,
  };
});

    // 3️⃣ TRI
    cleanSessions.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      if (a.status === 'active') {
        return a.startDate - b.startDate;
      }
      return b.startDate - a.startDate;
    });

    setSessions(cleanSessions);

    setLoading(false);
  } catch (e) {
    console.error(e);
    setLoading(false);
  }
};

useFocusEffect(
  useCallback(() => {
    if (user?.id) {
      fetchSessions();
    }
  }, [user?.id])
);

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

const handleGroupPress = async (sessionId) => {
  const now = new Date().toISOString();

  // ✅ on enregistre la lecture
  await AsyncStorage.setItem(
    `last_seen_${sessionId}`,
    now
  );

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
<Pressable
  key={tab}
  onPress={() => setActiveTab(tab)}
  style={({ pressed }) => [
    styles.tabButton,
    isActive && styles.tabWrapperActive,
    pressed && { opacity: 0.85 },
  ]}
>
  <Text
    style={[
      styles.tabText,
      isActive && styles.tabTextActive,
    ]}
  >
    {tab === 'sessions' ? 'Sessions' : 'Groupes'}
  </Text>
</Pressable>
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
                data={filteredSessions}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const hasUnread = item.hasUnread;
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

    {hasUnread && <View style={styles.unreadDot} />}
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
  backgroundColor: '#F2F2F0',
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
},
tabWrapperActive: {
  backgroundColor: '#FFF4F2',
},
tabText: {
  fontSize: 15,
  color: '#5F5F5F',
  fontWeight: '600',
  textAlign: 'center',
  includeFontPadding: false,
},
tabTextActive: {
  color: '#FE5D02',
  fontWeight: '700',
},
titleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  position: 'relative',
},
unreadDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#FF375E',
  marginLeft: 8,
  marginTop: Platform.OS === 'android' ? 2 : 0,
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
