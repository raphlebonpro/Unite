import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, Platform,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import SessionCard from '../components/SessionCard';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MiniAppBar from '../components/MiniAppBar';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'created', label: 'Créées', icon: <AntDesign name="pluscircleo" size={16} color="#FF914D" /> },
  { key: 'joined', label: 'Rejointes', icon: <Ionicons name="people-outline" size={16} color="#38d7b6" /> },
  { key: 'past', label: 'Passées', icon: <MaterialCommunityIcons name="clock-time-eight-outline" size={16} color="#B1B1C4" /> }
];

const ActivitiesScreen = () => {
  const [sessionsCreated, setSessionsCreated] = useState([]);
  const [sessionsJoined, setSessionsJoined] = useState([]);
  const [sessionsPast, setSessionsPast] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('created');
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    if (route.params?.tab && ['created', 'joined', 'past'].includes(route.params.tab)) {
      setSelectedTab(route.params.tab);
    } else if (!route.params?.tab) {
      setSelectedTab('created');
    }
  }, [route.params?.tab]);

  function buildDateTime(session) {
    if (!session.date) return null;
    const dt = new Date(session.date);
    if (session.time && typeof session.time === "string") {
      let clean = session.time.replace("h", ":");
      const [hh, mm] = clean.split(":").map(Number);
      if (!isNaN(hh)) dt.setHours(hh, mm || 0, 0, 0);
    }
    return dt;
  }

  const fetchSessions = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const { data: created } = await supabase
        .from('sessions')
        .select('*')
        .eq('creator_id', user.id)
        .eq('is_cancelled', false);

      const { data: joinedIds } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

      const sessionIds = joinedIds?.map((s) => s.session_id) || [];

      let joined = [];
      if (sessionIds.length > 0) {
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .in('id', sessionIds)
          .eq('is_cancelled', false);
        joined = data;
      }

      const joinedFiltered = (joined || []).filter(s => s.creator_id !== user.id);

      const now = new Date();

      const createdUpcoming = (created || []).filter(s => {
        const dt = buildDateTime(s);
        return dt && dt >= now;
      });
      const createdPast = (created || []).filter(s => {
        const dt = buildDateTime(s);
        return dt && dt < now;
      });

      const joinedUpcoming = (joinedFiltered || []).filter(s => {
        const dt = buildDateTime(s);
        return dt && dt >= now;
      });
      const joinedPast = (joinedFiltered || []).filter(s => {
        const dt = buildDateTime(s);
        return dt && dt < now;
      });

      const pastMap = {};
      [...createdPast, ...joinedPast].forEach(s => { pastMap[s.id] = s; });
      const allPast = Object.values(pastMap);

      const sortAsc = (list) => list.sort((a, b) => buildDateTime(a) - buildDateTime(b));
      const sortDesc = (list) => list.sort((a, b) => buildDateTime(b) - buildDateTime(a));

      setSessionsCreated(sortAsc(createdUpcoming));
      setSessionsJoined(sortAsc(joinedUpcoming));
      setSessionsPast(sortDesc(allPast));

    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
      const interval = setInterval(() => fetchSessions(), 15000);
      return () => clearInterval(interval);
    }, [fetchSessions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
  };

  const getSessions = () => {
    if (selectedTab === 'created') return sessionsCreated;
    if (selectedTab === 'joined') return sessionsJoined;
    return sessionsPast;
  };

return (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>

    {/* MINI APP BAR FIXE */}
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        elevation: 10,
        backgroundColor: '#fff'
      }}
    >
      <MiniAppBar
        title="Activités"
        hasNotifications={false}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
      />
    </View>

    {/* CONTENU PRINCIPAL */}
    <View style={{ flex: 1, paddingTop: 40 }}>

      <FlatList
        data={getSessions()}
        keyExtractor={(item) => item.id}

        ListHeaderComponent={
          <View>

<View
  style={{
    width: '94%',              // ← largeur uniforme iOS + Android
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 26,          // ← arrondi identique sur les deux OS
    paddingVertical: 12,       // ← hauteur réduite = moins grossier
    paddingHorizontal: 16,
    
    // Ombre optimisée cross-platform
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  }}
>
  <Text
    style={{
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      color: '#000',
      lineHeight: 22,
    }}
  >
    <Text style={{ color: "#5B4EFF" }}>Vos sessions </Text>
    créées, rejointes et{"\n"}
    <Text style={{ color: "#5B4EFF", fontWeight: '700' }}>passées</Text>
  </Text>
</View>

            {/* ONGLETES */}
            <View style={styles.tabsRow}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, selectedTab === tab.key && styles.tabBtnActive]}
                  onPress={() => setSelectedTab(tab.key)}
                  activeOpacity={0.88}
                >
                  <View style={styles.tabIconWrap}>{tab.icon}</View>
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab.key && styles.tabTextActive
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        }

        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onPress={() =>
              navigation.navigate('SessionDetail', { sessionId: item.id })
            }
          />
        )}

        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
        }}

        showsVerticalScrollIndicator={false}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6F3C']}
            tintColor="#FF6F3C"
          />
        }
      />
    </View>
  </View>
)};

const styles = StyleSheet.create({
headerCompact: {
  width: '90%',
  alignSelf: 'center',
  marginTop: 14,
  marginBottom: 14,
  borderRadius: 20,
  paddingVertical: 14,
  paddingHorizontal: 18,

  backgroundColor: 'rgba(255,255,255,0.75)', // effet diffus très léger
  shadowColor: '#5B4EFF',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
},
headerText: {
  fontSize: 16,      // plus petit
  fontWeight: '700',
  textAlign: 'center',
  lineHeight: 20,    // réduit pour un rendu compact
},
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f2f2f8",
    borderWidth: 1,
    borderColor: "#ece9fd",
  },
  tabBtnActive: {
    backgroundColor: "#5B4EFF",
    borderColor: "#5B4EFF",
  },
  tabIconWrap: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: "#5B4EFF",
  },
  tabTextActive: {
    color: "#fff",
  },
  headerBlurWrapper: {
  marginHorizontal: 16,
  marginTop: 10,
  marginBottom: 8,
  borderRadius: 14,
  overflow: 'hidden', // essentiel pour que le flou ne dépasse pas
},
headerBlur: {
  width: '100%',
  borderRadius: 14,
  overflow: 'hidden',
},

});

export default ActivitiesScreen;
