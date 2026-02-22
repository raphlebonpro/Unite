import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, Platform, Alert, Pressable
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import SessionCard from '../components/SessionCard';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';

const { width } = Dimensions.get('window');
const MINI_APP_BAR_HEIGHT = Platform.OS === 'android' ? 55 : 40;

const TAB_COLOR = '#5B4EFF';

const ActivitiesScreen = () => {
  const [sessionsCreated, setSessionsCreated] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionsUpcoming, setSessionsUpcoming] = useState([]);
  const [sessionsPastJoined, setSessionsPastJoined] = useState([]);
  const [sessionsPastCreated, setSessionsPastCreated] = useState([]);
  const [activeSection, setActiveSection] = useState('upcoming');
  const [historyTab, setHistoryTab] = useState('joined');
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();

  function formatDateTime(date, time) {
  if (!date) return '';

  try {
    const d = new Date(date);

    if (time && typeof time === 'string' && time.length === 5) {
      const [hh, mm] = time.split(':');
      d.setHours(Number(hh));
      d.setMinutes(Number(mm));
    }

    return d.toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  } catch {
    return '';
  }
}

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
  .select(`
    *,
    group:groups (
      id,
      name
    )
  `)
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
  .select(`
    *,
    group:groups (
      id,
      name
    )
  `)
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

      const joinedUpcoming = (joinedFiltered || []).filter(s => {
        const dt = buildDateTime(s);
        return dt && dt >= now;
      });

      const createdAll = (created || []).sort(
  (a, b) => buildDateTime(a) - buildDateTime(b)
);

setSessionsCreated(createdAll);
    
      const upcomingMap = {};
[...createdUpcoming, ...joinedUpcoming].forEach(s => {
  upcomingMap[s.id] = s;
});

const upcoming = Object.values(upcomingMap).sort(
  (a, b) => buildDateTime(a) - buildDateTime(b)
);

setSessionsUpcoming(upcoming);

const joinedPast = (joinedFiltered || []).filter(s => {
  const dt = buildDateTime(s);
  return dt && dt < now;
});

const createdPast = (created || []).filter(s => {
  const dt = buildDateTime(s);
  return dt && dt < now;
});

setSessionsPastJoined(
  joinedPast.sort((a, b) => buildDateTime(b) - buildDateTime(a))
);

setSessionsPastCreated(
  createdPast.sort((a, b) => buildDateTime(b) - buildDateTime(a))
);

    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

useFocusEffect(
  useCallback(() => {
    // 1️⃣ Met à jour l’onglet si on vient d’une navigation
    if (route.params?.section) {
      setActiveSection(route.params.section);
    }

    // 2️⃣ Recharge les données
    fetchSessions();

    // 3️⃣ Affiche alert si session créée
    if (route.params?.showCreatedAlert) {
      Alert.alert(
        'Session créée !',
        'Ta session a bien été enregistrée.'
      );

      navigation.setParams({ showCreatedAlert: false });
    }
  }, [fetchSessions, route.params?.section, route.params?.showCreatedAlert])
);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
  };

const historyData = [
  ...sessionsPastJoined
    .sort((a, b) => buildDateTime(b) - buildDateTime(a))
    .map(item => ({
      ...item,
      type: 'joined',
    })),

  ...sessionsPastCreated
    .sort((a, b) => buildDateTime(b) - buildDateTime(a))
    .map(item => ({
      ...item,
      type: 'created',
    })),
];

const now = new Date();

const allPast = [
  ...sessionsPastJoined,
  ...sessionsPastCreated,
];

const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);

const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

const sessionsThisWeek = allPast.filter(s => {
  const dt = buildDateTime(s);
  return dt && dt >= startOfWeek;
});

const sessionsThisMonth = allPast.filter(s => {
  const dt = buildDateTime(s);
  return dt && dt >= startOfMonth;
});

// TOTAL HISTORIQUE
const totalCreated = sessionsPastCreated.length;
const totalJoined = sessionsPastJoined.length;
const totalAll = totalCreated + totalJoined;

// STREAK SEMAINE (simplifié)
const streakThisWeek = sessionsThisWeek.length;

// PROCHAINE SESSION
const nextSession = sessionsUpcoming[0];
const daysUntilNext = nextSession
  ? Math.ceil(
      (buildDateTime(nextSession) - new Date()) /
      (1000 * 60 * 60 * 24)
    )
  : null;

// RATIO CRÉATION
const creationRatio =
  totalAll > 0
    ? Math.round((totalCreated / totalAll) * 100)
    : 0;

// Moyenne sessions / semaine (basique)
const averagePerWeek =
  sessionsThisMonth.length > 0
    ? (sessionsThisMonth.length / 4).toFixed(1)
    : 0;

// Sport le plus pratiqué
const sportCount = {};
allPast.forEach(s => {
  if (!s.sport) return;
  sportCount[s.sport] = (sportCount[s.sport] || 0) + 1;
});

const favoriteSport =
  Object.keys(sportCount).length > 0
    ? Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0][0]
    : null;

// Total cumulé global
const totalSessionsAllTime = totalAll;

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
        backgroundColor: '#fff'
      }}
    >
      <MiniAppBar
        title="Sessions"
        hasNotifications={false}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
      />
    </View>

    {/* CONTENU PRINCIPAL */}
    <View style={{ flex: 1, paddingTop: MINI_APP_BAR_HEIGHT }}>

          {/* ===== SWITCH ===== */}
<View style={styles.tabContainer}>
{['upcoming', 'rhythm', 'history'].map((tab) => {
  const isActive = activeSection === tab;

  return (
    <Pressable
      key={tab}
      onPress={() => setActiveSection(tab)}
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
        {tab === 'upcoming'
          ? 'À venir'
          : tab === 'history'
          ? 'Historique'
          : 'Rythme'}
      </Text>
    </Pressable>
  );
})}
</View>

{activeSection === 'rhythm' ? (

<View style={{ paddingHorizontal: 16, paddingTop: 20 }}>

  {/* ACTIVITÉ PRINCIPALE */}
  <View style={styles.rhythmCardMain}>
    <Text style={styles.rhythmBigNumber}>
      {sessionsThisMonth.length}
    </Text>
    <Text style={styles.rhythmBigLabel}>
      sessions ce mois-ci
    </Text>

    {streakThisWeek > 0 && (
      <Text style={styles.rhythmBadge}>
        🔥 {streakThisWeek} cette semaine
      </Text>
    )}
  </View>

  {/* STATS GRID */}
  <View style={styles.statsGrid}>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{totalSessionsAllTime}</Text>
      <Text style={styles.statLabel}>Total sessions</Text>
    </View>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{averagePerWeek}</Text>
      <Text style={styles.statLabel}>/ semaine</Text>
    </View>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{creationRatio}%</Text>
      <Text style={styles.statLabel}>créées</Text>
    </View>

    <View style={styles.statCard}>
      <Text style={styles.statNumber}>
        {favoriteSport || '-'}
      </Text>
      <Text style={styles.statLabel}>sport favori</Text>
    </View>

  </View>

  {/* PROCHAINE SESSION */}
{daysUntilNext !== null && nextSession && (
  <View style={styles.nextSessionCard}>

    <View style={styles.nextSessionHeader}>
      <Text style={styles.nextSessionTitle}>
        Prochaine session
      </Text>

      <View style={styles.nextBadge}>
        <Text style={styles.nextBadgeText}>
          J-{daysUntilNext}
        </Text>
      </View>
    </View>

    <Text style={styles.nextSessionName} numberOfLines={1}>
      {nextSession.title || nextSession.sport}
    </Text>

    <Text style={styles.nextSessionDate}>
      {formatDateTime(nextSession.date, nextSession.time)}
    </Text>

  </View>
)}
</View>

) : (

  <FlatList
    data={
      activeSection === 'upcoming'
        ? sessionsUpcoming
        : historyTab === 'joined'
        ? sessionsPastJoined
        : sessionsPastCreated
    }
    keyExtractor={(item) => item.id.toString()}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
      paddingHorizontal: 16,
      paddingBottom: 120,
    }}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#FF6F3C']}
      />
    }
    ListHeaderComponent={
      <>
        {activeSection === 'upcoming' && (
          <Text style={styles.sectionTitle}>
            Prochaines sessions :
          </Text>
        )}

        {activeSection === 'history' && (
          <View style={styles.tabContainerHistory}>
{['created', 'joined'].map((tab) => {
  const isActive = historyTab === tab;

  return (
    <Pressable
      key={tab}
      onPress={() => setHistoryTab(tab)}
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
        {tab === 'joined'
          ? 'Sessions rejointes'
          : 'Sessions créées'}
      </Text>
    </Pressable>
  );
})}
          </View>
        )}
      </>
    }
    renderItem={({ item }) => (
      <View style={{ marginBottom: 5 }}>
        <SessionCard
          session={item}
          onPress={() =>
            navigation.navigate('SessionDetail', {
              sessionId: item.id,
            })
          }
        />
      </View>
    )}
  />

)}

    </View>
  </View>
)};

const PRIMARY = '#5B4EFF';

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F0',
    borderRadius: 30,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    padding: 4,
  },
tabButton: {
  flex: 1,
  height: 40,
  borderRadius: 25,
  alignItems: 'center',
  justifyContent: 'center',
},
  tabWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
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
  },
  tabTextActive: {
    color: '#FE5D02',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111',
    marginLeft: 14,
    marginTop: 10,
  },
  rhythmContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  rhythmCardMain: {
    backgroundColor: '#F6F7FF',
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  rhythmBigNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#F62DAE',
  },
  rhythmBigLabel: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
  },
  rhythmBadge: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6F3C',
  },
  rhythmRowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rhythmSmallCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 3,
  },
  rhythmSmallNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  rhythmSmallLabel: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  rhythmNextCard: {
    backgroundColor: '#5B4EFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rhythmNextText: {
    color: '#fff',
    fontWeight: '700',
  },
  tabContainerHistory: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#F2F2F0',
  borderRadius: 30,
  marginHorizontal: 20,
  marginTop: 4,
  marginBottom: 15,
  padding: 4,
},
statsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: 20,
},
statCard: {
  width: '48%',
  backgroundColor: '#FAFAFA',
  borderRadius: 18,
  paddingVertical: 18,
  alignItems: 'center',
  marginBottom: 14,
  borderWidth: 1,
  borderColor: '#EFEFEF',
},
statNumber: {
  fontSize: 20,
  fontWeight: '800',
  color: '#111',
},
statLabel: {
  fontSize: 12,
  color: '#777',
  marginTop: 4,
},
nextSessionCard: {
  backgroundColor: '#FAFAFA',
  borderRadius: 20,
  padding: 18,
  borderWidth: 1,
  borderColor: '#EFEFEF',
},
nextSessionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
nextSessionTitle: {
  fontSize: 14,
  fontWeight: '700',
  color: '#888',
},
nextBadge: {
  backgroundColor: '#FE5D02',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
},
nextBadgeText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 12,
},
nextSessionName: {
  fontSize: 16,
  fontWeight: '800',
  color: '#111',
  marginBottom: 4,
},
nextSessionDate: {
  fontSize: 13,
  color: '#666',
  fontWeight: '600',
},
});

export default ActivitiesScreen;
