import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, SafeAreaView, Platform,
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

  // Met à jour l'onglet selon param navigation
  useEffect(() => {
    if (route.params?.tab && ['created', 'joined', 'past'].includes(route.params.tab)) {
      setSelectedTab(route.params.tab);
    } else if (!route.params?.tab) {
      setSelectedTab('created');
    }
  }, [route.params?.tab]);

  // Helper: construit la Date JS complète
  function buildDateTime(session) {
    if (!session.date) return null;
    const dt = new Date(session.date);
    if (session.time && typeof session.time === "string") {
      let clean = session.time.replace("h", ":"); // ex: "14h30" → "14:30"
      const [hh, mm] = clean.split(":").map(Number);
      if (!isNaN(hh)) dt.setHours(hh, mm || 0, 0, 0);
    }
    return dt;
  }

  const fetchSessions = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      // --- Créées par l'user
      const { data: created } = await supabase
        .from('sessions')
        .select('*')
        .eq('creator_id', user.id);

      // --- Sessions rejointes
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
          .in('id', sessionIds);
        joined = data;
      }

      const joinedFiltered = (joined || []).filter(s => s.creator_id !== user.id);

      // --- Classement
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

      // Fusion des passées
      const pastMap = {};
      [...createdPast, ...joinedPast].forEach(s => { pastMap[s.id] = s; });
      const allPast = Object.values(pastMap);

      // Tri
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

  // Auto-refresh toutes les 15s
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <MiniAppBar
        title="Activités"
        hasNotifications={false}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
      />

      <View style={styles.bg}>
        <LinearGradient
          colors={['#f6f6ff', '#ecebfa', '#faf8ff']}
          start={{ x: 0.1, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.fancyPhraseWrap}>
            <Text style={styles.fancyPhrase}>
              <Text style={{ color: "#5B4EFF", fontWeight: '700' }}>Vos sessions </Text>
              <Text style={{ color: "#181818", fontWeight: '700' }}>
                créées, rejointes et passées
              </Text>
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, selectedTab === tab.key && styles.tabBtnActive]}
              onPress={() => setSelectedTab(tab.key)}
              activeOpacity={0.88}
            >
              <View style={styles.tabIconWrap}>{tab.icon}</View>
              <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={getSessions()}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#F8F8FD'
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? hp('3%') : hp('1.5%'),
    paddingBottom: hp('1.4%'),
    paddingHorizontal: wp('6.4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    elevation: 7,
    shadowColor: "#d9d8ff",
    shadowOpacity: 0.12,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 0,
  },
  fancyPhraseWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: hp('0.2%'),
  },
  fancyPhrase: {
    fontSize: hp('2%'),
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.63)',
    paddingHorizontal: wp('2.7%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('3.7%'),
    shadowColor: "#6B66CD",
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden'
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "transparent",
    marginTop: -hp('1.1%'),
    marginBottom: hp('0.4%'),
    gap: 0,
    paddingVertical: hp('0.3%'),
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('0.7%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3.7%'),
    borderRadius: wp('7%'),
    backgroundColor: "#f2f2f8",
    opacity: 0.95,
    minWidth: wp('25%'),
    justifyContent: "center",
    shadowColor: "#5B4EFF",
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#ece9fd",
  },
  tabBtnActive: {
    backgroundColor: "#5B4EFF",
    shadowOpacity: 0.16,
    elevation: 10,
    borderColor: "#5B4EFF",
    opacity: 1,
  },
  tabIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('1.6%'),
  },
  tabText: {
    fontSize: hp('1.9%'),
    fontWeight: '600',
    color: "#5B4EFF",
    letterSpacing: 0.08,
    marginTop: hp('0.15%'),
  },
  tabTextActive: {
    color: "#fff",
  },
  flatListContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.4%'),
    paddingBottom: hp('6%'),
  },
  sessionCard: {
    // Si tu veux modifier les cartes, adapte ici ou dans le composant
  },
  noText: {
    color: '#bbb',
    fontSize: hp('1.9%'),
    fontStyle: 'italic',
    marginTop: hp('4.2%'),
    textAlign: 'center'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActivitiesScreen;