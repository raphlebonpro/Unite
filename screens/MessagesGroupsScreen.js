import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Sport meta ───────────────────────────────────────────────────────────────
const sportMeta = {
  Football:          { bg: '#EBF2FF', color: '#3888FF', icon: 'futbol',            lib: 'fa5' },
  Basketball:        { bg: '#FFF5E5', color: '#FFA726', icon: 'basketball',         lib: 'mci' },
  Tennis:            { bg: '#EDFBF3', color: '#2ECC71', icon: 'tennis',             lib: 'mci' },
  Padel:             { bg: '#FFFDE5', color: '#C8A800', icon: 'tennis',             lib: 'mci' },
  Running:           { bg: '#FFF0F4', color: '#E9436D', icon: 'run-fast',           lib: 'mci' },
  Cyclisme:          { bg: '#E5FAFA', color: '#3CD6E6', icon: 'bike',               lib: 'mci' },
  Natation:          { bg: '#E5F0FB', color: '#1469B9', icon: 'swim',               lib: 'mci' },
  Musculation:       { bg: '#F3F1FF', color: '#7367F0', icon: 'dumbbell',           lib: 'mci' },
  Fitness:           { bg: '#F3F0FF', color: '#7C4DFF', icon: 'weight-lifter',      lib: 'mci' },
  'Randonnée/Trail': { bg: '#EDFBF3', color: '#43A047', icon: 'hiking',             lib: 'mci' },
  Yoga:              { bg: '#F4EFFE', color: '#A259F7', icon: 'yoga',               lib: 'mci' },
  Danse:             { bg: '#FFF0F6', color: '#F48FB1', icon: 'human-female-dance', lib: 'mci' },
  CrossFit:          { bg: '#ECEDFF', color: '#536DFE', icon: 'dumbbell',           lib: 'mci' },
  Surf:              { bg: '#E5FAFA', color: '#26C6DA', icon: 'surfing',            lib: 'mci' },
  Escalade:          { bg: '#EDFBF3', color: '#689F38', icon: 'terrain',            lib: 'mci' },
  'Arts Martiaux':   { bg: '#FFF0EC', color: '#FF3D00', icon: 'boxing-glove',       lib: 'mci' },
};

const getSportMeta = (sport) =>
  sportMeta[sport] || { bg: '#F2F2F2', color: '#999', icon: 'dots-horizontal', lib: 'mci' };

const SportIcon = ({ sport, size = 20 }) => {
  const meta = getSportMeta(sport);
  if (meta.lib === 'fa5') return <FontAwesome5 name={meta.icon} size={size} color={meta.color} />;
  return <MaterialCommunityIcons name={meta.icon} size={size} color={meta.color} />;
};

// ─────────────────────────────────────────────────────────────────────────────
const MessagesGroupsScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();

  const [sessions, setSessions]           = useState([]);
  const [groups, setGroups]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState('sessions');

  // ── Tab indicator animé ────────────────────────────────────────────────────
  const tabAnim = useRef(new Animated.Value(0)).current;
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    Animated.spring(tabAnim, {
      toValue: tab === 'sessions' ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  // ── Filtres ────────────────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? sessions.filter(s => s.title.toLowerCase().includes(q)) : sessions;
  }, [sessions, search]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? groups.filter(g => g.name.toLowerCase().includes(q)) : groups;
  }, [groups, search]);

  // ── Fetch sessions ─────────────────────────────────────────────────────────
  const fetchSessions = async () => {
    try {
      setLoading(true);

      const { data: sessionsData, error } = await supabase
        .from('session_participants')
        .select('session_id, sessions(id, title, sport, date, time)')
        .eq('user_id', user.id);
      if (error) throw error;

      const sessionIds = (sessionsData || [])
  .filter(i => i.sessions)
  .map(i => i.sessions.id);

const { data: lastMessages } = await supabase
  .from('messages')
  .select('session_id, created_at, sender_id, content')
  .in('session_id', sessionIds)
  .order('created_at', { ascending: false });

      // Dernier message par session
      const lastMessageMap = {};
      lastMessages?.forEach(msg => {
        if (!lastMessageMap[msg.session_id]) lastMessageMap[msg.session_id] = msg;
      });

      // last_seen par session (AsyncStorage)
      const keys = (sessionsData || [])
        .filter(i => i.sessions)
        .map(i => `last_seen_${i.sessions.id}`);
      const seenPairs = await AsyncStorage.multiGet(keys);
      const lastSeenMap = {};
      seenPairs.forEach(([key, value]) => {
        if (value) lastSeenMap[key.replace('last_seen_', '')] = value;
      });

      const now = new Date();
      const cleanSessions = (sessionsData || [])
        .filter(i => i.sessions)
        .map(item => {
          const startDate = new Date(`${item.sessions.date}T${item.sessions.time}`);
          const lastMsg   = lastMessageMap[item.sessions.id];
          const lastSeen  = lastSeenMap[item.sessions.id];

          // ── Logique non-lus simplifiée (booléen) — à affiner selon tes besoins
          const hasUnread =
            lastMsg &&
            lastMsg.sender_id !== user.id &&
            (!lastSeen || new Date(lastMsg.created_at) > new Date(lastSeen));

          return {
            id:            item.sessions.id,
            title:         item.sessions.title,
            sport:         item.sessions.sport,
            date:          item.sessions.date,
            time:          item.sessions.time,
            startDate,
            status:        startDate < now ? 'terminated' : 'active',
            lastMessage:   lastMsg?.content  || null,
            lastMessageAt: lastMsg?.created_at || null,
            hasUnread:     !!hasUnread,
          };
        });

      cleanSessions.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        return a.status === 'active'
          ? a.startDate - b.startDate
          : b.startDate - a.startDate;
      });

      setSessions(cleanSessions);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { if (user?.id) fetchSessions(); }, [user?.id]));

  // ── Fetch groups ───────────────────────────────────────────────────────────
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name, sport, city, cover_url)')
        .eq('user_id', user.id);
      if (error) { setGroups([]); setLoadingGroups(false); return; }
      setGroups((data || []).filter(i => i.groups).map(i => ({ ...i.groups })));
      setLoadingGroups(false);
    } catch { setLoadingGroups(false); }
  };

  useEffect(() => { if (user?.id) fetchGroups(); }, [user?.id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const onRefresh = async () => { setRefreshing(true); await fetchSessions(); setRefreshing(false); };

const handleGroupPress = async (sessionId) => {
  const session = sessions.find(s => s.id === sessionId);
  const lastSeenTime = session?.lastMessageAt
    ? new Date(new Date(session.lastMessageAt).getTime() + 1000).toISOString()
    : new Date().toISOString();
  await AsyncStorage.setItem(`last_seen_${sessionId}`, lastSeenTime);
  setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, hasUnread: false } : s));
  navigation.navigate('SessionMessages', { sessionId });
};

  const handleDeleteGroup = (sessionId, title) => {
    Alert.alert(
      'Quitter le groupe',
      `Quitter "${title}" ? Tu n'auras plus accès aux messages.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('session_participants').delete()
              .eq('user_id', user.id).eq('session_id', sessionId);
            if (!error) setSessions(prev => prev.filter(s => s.id !== sessionId));
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Tout effacer',
      'Supprimer tous tes groupes de messages ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('session_participants').delete().eq('user_id', user.id);
            if (!error) setSessions([]);
          },
        },
      ]
    );
  };

  // ── Helper horodatage ──────────────────────────────────────────────────────
  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'maintenant';
    if (m < 60) return `${m}m`;
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h`;
    const d = Math.floor(diff / 86400000);
    if (d < 7)  return `${d}j`;
    return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  // ── Search bar ─────────────────────────────────────────────────────────────
  const SearchBar = ({ placeholder }) => (
    <View style={styles.searchWrap}>
      <Ionicons name="search-outline" size={17} color="#C0C0C0" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#C0C0C0"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity
          onPress={() => setSearch('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={17} color="#CCC" />
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Session row ────────────────────────────────────────────────────────────
  const SessionItem = ({ item }) => {
    const meta     = getSportMeta(item.sport);
    const isActive = item.status === 'active';

    return (
      <View style={[styles.row, item.hasUnread && styles.rowUnread]}>
        <TouchableOpacity
          style={styles.rowTouchable}
          activeOpacity={0.72}
          onPress={() => handleGroupPress(item.id)}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: meta.bg }]}>
            <SportIcon sport={item.sport} size={22} />
            <View style={[
              styles.statusBadge,
              { backgroundColor: isActive ? '#2ECC71' : '#C0C0C0' },
            ]} />
          </View>

          {/* Textes */}
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text
                style={[styles.rowTitle, item.hasUnread && styles.rowTitleBold]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.rowTime, item.hasUnread && styles.rowTimeOrange]}>
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>

            <View style={styles.rowBottom}>
              <Text
                style={[styles.rowPreview, item.hasUnread && styles.rowPreviewBold]}
                numberOfLines={1}
              >
                {item.lastMessage || (isActive ? item.sport : 'Session terminée')}
              </Text>

              {/* ── Badge non-lus ── simple point orange */}
              {item.hasUnread && <View style={styles.unreadDot} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* Poubelle — toujours visible, gris discret */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteGroup(item.id, item.title)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={18} color="#D0D0D0" />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Group row ──────────────────────────────────────────────────────────────
  const GroupItem = ({ item }) => {
    const meta = getSportMeta(item.sport);
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.72}
        onPress={() => navigation.navigate('GroupChat', { groupId: item.id })}
      >
        <View style={[styles.avatar, { backgroundColor: meta.bg }]}>
          {item.cover_url
            ? <Image source={{ uri: item.cover_url }} style={styles.avatarImg} />
            : <SportIcon sport={item.sport} size={22} />
          }
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.sportTag, { backgroundColor: meta.bg }]}>
              <Text style={[styles.sportTagText, { color: meta.color }]}>{item.sport}</Text>
            </View>
          </View>
          <View style={styles.rowBottom}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={12}
              color="#C0C0C0"
              style={{ marginRight: 3 }}
            />
            <Text style={styles.rowPreview} numberOfLines={1}>{item.city || 'Groupe'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const EmptyState = ({ icon, title, subtitle }) => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <MaterialCommunityIcons name={icon} size={34} color="#D8D8D8" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );

  // ── Tab indicator ──────────────────────────────────────────────────────────
  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '52%'],
  });
  const unreadCount = sessions.filter(s => s.hasUnread).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar translucent={false} backgroundColor="#fff" barStyle="dark-content" />

      <MiniAppBar
        title="Messages"
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
        showLeaderboard={false}
      />

      <View style={{ flex: 1 }}>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <View style={styles.tabContainer}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />

          {[
            { key: 'sessions', label: 'Sessions', badge: unreadCount },
            { key: 'groups',   label: 'Groupes',  badge: 0 },
          ].map(({ key, label, badge }) => {
            const isActive = activeTab === key;
            return (
              <Pressable key={key} onPress={() => switchTab(key)} style={styles.tabBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                  </Text>
                  {badge > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{badge}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <SearchBar
          placeholder={
            activeTab === 'sessions' ? 'Rechercher une session…' : 'Rechercher un groupe…'
          }
        />

        {/* ── Contenu sessions ──────────────────────────────────────────── */}
        {activeTab === 'sessions' ? (
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color="#FE5D02" />
            </View>
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon="message-text-outline"
              title={search ? 'Aucune session trouvée' : 'Aucun groupe de session'}
              subtitle={!search ? 'Rejoins une session pour tchatter avec tes coéquipiers' : undefined}
            />
          ) : (
            <FlatList
              data={filteredSessions}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => <SessionItem item={item} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#FE5D02']}
                  tintColor="#FE5D02"
                />
              }
              contentContainerStyle={{ paddingBottom: 24 }}
              ListFooterComponent={
                sessions.length > 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 14 }}>
                    <TouchableOpacity
                      style={styles.deleteAllBtn}
                      onPress={handleDeleteAll}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={13} color="#D83C3C" style={{ marginRight: 5 }} />
                      <Text style={styles.deleteAllText}>Tout effacer</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              }
            />
          )
        ) : (
          /* ── Contenu groupes ────────────────────────────────────────── */
          loadingGroups ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color="#FE5D02" />
            </View>
          ) : filteredGroups.length === 0 ? (
            <EmptyState
              icon="account-group-outline"
              title={search ? 'Aucun groupe trouvé' : 'Aucun groupe rejoint'}
              subtitle={!search ? 'Rejoins un groupe pour retrouver tes coéquipiers réguliers' : undefined}
            />
          ) : (
            <FlatList
              data={filteredGroups}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => <GroupItem item={item} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={async () => {
                    setRefreshing(true);
                    await fetchGroups();
                    setRefreshing(false);
                  }}
                  colors={['#FE5D02']}
                  tintColor="#FE5D02"
                />
              }
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )
        )}
      </View>
    </View>
  );
};

export default MessagesGroupsScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('4.5%'),
    marginTop: 14,
    marginBottom: 10,
    height: hp('5%'),
    backgroundColor: '#F4F4F6',
    borderRadius: 14,
    position: 'relative',
    padding: 3,
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    width: '46%',
    height: hp('5%') - 6,
    backgroundColor: '#fff',
    borderRadius: 11,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: hp('1.85%'),
    color: '#999',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FE5D02',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#FE5D02',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    marginHorizontal: wp('4.5%'),
    borderRadius: 12,
    paddingHorizontal: wp('3.5%'),
    height: hp('5.2%'),
    marginBottom: hp('0.6%'),
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    fontSize: hp('1.9%'),
    marginLeft: wp('2%'),
    color: '#222',
    paddingVertical: 0,
  },

  // ── Row ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.55%'),
    paddingHorizontal: wp('4.5%'),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  rowUnread: {
    backgroundColor: '#FFFAF8',
  },
  rowTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('3.8%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3.5%'),
    flexShrink: 0,
    position: 'relative',
  },
  avatarImg: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('3.8%'),
  },
  statusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#fff',
  },

  // ── Row content ───────────────────────────────────────────────────────────
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    fontSize: hp('2%'),
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  rowTitleBold: {
    fontWeight: '800',
    color: '#111',
  },
  rowTime: {
    fontSize: hp('1.55%'),
    color: '#C8C8C8',
    fontWeight: '500',
    flexShrink: 0,
  },
  rowTimeOrange: {
    color: '#FE5D02',
    fontWeight: '700',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPreview: {
    fontSize: hp('1.7%'),
    color: '#B8B8B8',
    fontWeight: '400',
    flex: 1,
    marginRight: 8,
  },
  rowPreviewBold: {
    color: '#555',
    fontWeight: '500',
  },

  // ── Non-lus — point orange simple ─────────────────────────────────────────
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FE5D02',
    flexShrink: 0,
  },

  // ── Poubelle ──────────────────────────────────────────────────────────────
  deleteBtn: {
    marginLeft: wp('2.5%'),
    padding: wp('1.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sport tag (groupes) ───────────────────────────────────────────────────
  sportTag: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  sportTagText: {
    fontSize: hp('1.5%'),
    fontWeight: '700',
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp('10%'),
    paddingHorizontal: wp('10%'),
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F7F7F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: hp('2%'),
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: hp('1.7%'),
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: hp('2.4%'),
  },

  // ── Delete all ────────────────────────────────────────────────────────────
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  deleteAllText: {
    color: '#D83C3C',
    fontWeight: '600',
    fontSize: hp('1.75%'),
  },
});
