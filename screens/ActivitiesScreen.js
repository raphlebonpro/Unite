import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, Platform, Alert, Pressable,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import SessionCard from '../components/SessionCard';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import MiniAppBar from '../components/MiniAppBar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAppForeground } from '../context/AppForegroundContext';

const { width } = Dimensions.get('window');
const MINI_APP_BAR_HEIGHT = Platform.OS === 'android' ? 55 : 40;

// ─────────────────────────────────────────────────────────────────────────────
const ActivitiesScreen = () => {
  const [sessionsCreated,      setSessionsCreated]      = useState([]);
  const [sessionsUpcoming,     setSessionsUpcoming]     = useState([]);
  const [sessionsPastJoined,   setSessionsPastJoined]   = useState([]);
  const [sessionsPastCreated,  setSessionsPastCreated]  = useState([]);
  const [refreshing,           setRefreshing]           = useState(false);
  const [activeSection,        setActiveSection]        = useState('upcoming');
  const [historyTab,           setHistoryTab]           = useState('joined');
  const { user }    = useUser();
  const navigation  = useNavigation();
  const route       = useRoute();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function buildDateTime(session) {
    if (!session.date) return null;
    const dt = new Date(session.date);
    if (session.time && typeof session.time === 'string') {
      const [hh, mm] = session.time.replace('h', ':').split(':').map(Number);
      if (!isNaN(hh)) dt.setHours(hh, mm || 0, 0, 0);
    }
    return dt;
  }

  function formatDateTime(date, time) {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (time && typeof time === 'string' && time.length === 5) {
        const [hh, mm] = time.split(':');
        d.setHours(Number(hh)); d.setMinutes(Number(mm));
      }
      return d.toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  function formatDateShort(date) {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: created } = await supabase
        .from('sessions').select('*, group:groups(id, name)')
        .eq('creator_id', user.id).eq('is_cancelled', false);

      const { data: joinedIds } = await supabase
        .from('session_participants').select('session_id').eq('user_id', user.id);

      const sessionIds = joinedIds?.map(s => s.session_id) || [];
      let joined = [];
      if (sessionIds.length > 0) {
        const { data } = await supabase
          .from('sessions').select('*, group:groups(id, name)')
          .in('id', sessionIds).eq('is_cancelled', false);
        joined = data || [];
      }

      const joinedFiltered = joined.filter(s => s.creator_id !== user.id);
      const now = new Date();

      const createdUpcoming = (created || []).filter(s => { const dt = buildDateTime(s); return dt && dt >= now; });
      const joinedUpcoming  = joinedFiltered.filter(s => { const dt = buildDateTime(s); return dt && dt >= now; });

      setSessionsCreated((created || []).sort((a, b) => buildDateTime(a) - buildDateTime(b)));

      const upcomingMap = {};
      [...createdUpcoming, ...joinedUpcoming].forEach(s => { upcomingMap[s.id] = s; });
      setSessionsUpcoming(Object.values(upcomingMap).sort((a, b) => buildDateTime(a) - buildDateTime(b)));

      setSessionsPastJoined(
        joinedFiltered.filter(s => { const dt = buildDateTime(s); return dt && dt < now; })
          .sort((a, b) => buildDateTime(b) - buildDateTime(a))
      );
      setSessionsPastCreated(
        (created || []).filter(s => { const dt = buildDateTime(s); return dt && dt < now; })
          .sort((a, b) => buildDateTime(b) - buildDateTime(a))
      );
    } catch (err) { console.error(err); }
    finally { setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => {
    if (route.params?.section) setActiveSection(route.params.section);
    fetchSessions();
    if (route.params?.showCreatedAlert) {
      Alert.alert('Session créée !', 'Ta session a bien été enregistrée.');
      navigation.setParams({ showCreatedAlert: false });
    }
  }, [fetchSessions, route.params?.section, route.params?.showCreatedAlert]));

  useAppForeground(fetchSessions);

  const onRefresh = async () => { setRefreshing(true); await fetchSessions(); };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const now             = new Date();
  const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek     = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const allPast             = [...sessionsPastJoined, ...sessionsPastCreated];
  const sessionsThisMonth   = allPast.filter(s => { const dt = buildDateTime(s); return dt && dt >= startOfMonth; });
  const sessionsThisWeek    = allPast.filter(s => { const dt = buildDateTime(s); return dt && dt >= startOfWeek; });
  const totalCreated        = sessionsPastCreated.length;
  const totalJoined         = sessionsPastJoined.length;
  const totalAll            = totalCreated + totalJoined;
  const creationRatio       = totalAll > 0 ? Math.round((totalCreated / totalAll) * 100) : 0;
  const averagePerWeek      = sessionsThisMonth.length > 0 ? (sessionsThisMonth.length / 4).toFixed(1) : '0';
  const sportCount          = {};
  allPast.forEach(s => { if (s.sport) sportCount[s.sport] = (sportCount[s.sport] || 0) + 1; });
  const favoriteSport       = Object.keys(sportCount).length > 0
    ? Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0][0] : null;
  const nextSession         = sessionsUpcoming[0];
  const daysUntilNext       = nextSession
    ? Math.ceil((buildDateTime(nextSession) - now) / (1000 * 60 * 60 * 24)) : null;

  // ── Composants internes ────────────────────────────────────────────────────

  const EmptyState = ({ icon, title, subtitle, onAction, actionLabel }) => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Ionicons name={icon} size={28} color="#CCCCCC" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {onAction && actionLabel && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.82}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Tab "À venir" ──────────────────────────────────────────────────────────
  const UpcomingView = () => (
    <FlatList
      data={sessionsUpcoming}
      keyExtractor={item => item.id.toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE5D02']} tintColor="#FE5D02" />}
      ListHeaderComponent={
        sessionsUpcoming.length > 0 ? (
          <Text style={styles.sectionCount}>
            {sessionsUpcoming.length} session{sessionsUpcoming.length > 1 ? 's' : ''} planifiée{sessionsUpcoming.length > 1 ? 's' : ''}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title="Aucune session à venir"
          subtitle="Rejoins ou crée une session depuis l'Explorer pour commencer."
          onAction={() => navigation.navigate('Explorer')}
          actionLabel="Explorer les sessions"
        />
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: 10 }}>
          <SessionCard
            session={item}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
          />
        </View>
      )}
    />
  );

  // ── Tab "Rythme" ──────────────────────────────────────────────────────────
  const RhythmView = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.rhythmScroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE5D02']} tintColor="#FE5D02" />}
    >
      {/* Hero */}
      <View style={styles.rhythmHero}>
        <Text style={styles.rhythmHeroSup}>Ce mois-ci</Text>
        <Text style={styles.rhythmHeroBig}>{sessionsThisMonth.length}</Text>
        <Text style={styles.rhythmHeroSub}>session{sessionsThisMonth.length !== 1 ? 's' : ''}</Text>
        {sessionsThisWeek.length > 0 && (
          <View style={styles.streakPill}>
            <MaterialCommunityIcons name="fire" size={13} color="#FE5D02" style={{ marginRight: 4 }} />
            <Text style={styles.streakText}>{sessionsThisWeek.length} cette semaine</Text>
          </View>
        )}
      </View>

      {/* Stats 2×2 */}
      <View style={styles.statsGrid}>
        {[
          { value: String(totalAll),       label: 'Total',         icon: 'trophy-outline',      color: '#FE5D02', bg: '#FFF3EE' },
          { value: averagePerWeek,          label: 'moy. / sem.',   icon: 'trending-up-outline', color: '#2ECC71', bg: '#EDFBF3' },
          { value: `${creationRatio}%`,     label: 'créées',        icon: 'add-circle-outline',  color: '#7367F0', bg: '#F3F1FF' },
          { value: favoriteSport || '—',    label: 'sport favori',  icon: 'heart-outline',       color: '#E9436D', bg: '#FFF0F4' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={15} color={s.color} />
            </View>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Prochaine session */}
      {nextSession && daysUntilNext !== null && (
        <TouchableOpacity
          style={styles.nextCard}
          activeOpacity={0.82}
          onPress={() => navigation.navigate('SessionDetail', { sessionId: nextSession.id })}
        >
          <View style={styles.nextCardTop}>
            <Text style={styles.nextCardEyebrow}>Prochaine session</Text>
            <View style={styles.nextCardBadge}>
              <Text style={styles.nextCardBadgeText}>
                {daysUntilNext === 0 ? "Aujourd'hui" : daysUntilNext === 1 ? 'Demain' : `J-${daysUntilNext}`}
              </Text>
            </View>
          </View>
          <Text style={styles.nextCardTitle} numberOfLines={1}>{nextSession.title || nextSession.sport}</Text>
          <View style={styles.nextCardRow}>
            <Ionicons name="calendar-outline" size={13} color="#ABABAB" style={{ marginRight: 5 }} />
            <Text style={styles.nextCardDate}>{formatDateTime(nextSession.date, nextSession.time)}</Text>
          </View>
          <View style={styles.nextCardArrow}>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </View>
        </TouchableOpacity>
      )}

      {totalAll === 0 && (
        <EmptyState
          icon="bar-chart-outline"
          title="Aucune donnée pour l'instant"
          subtitle="Tes statistiques apparaîtront après ta première session."
        />
      )}
    </ScrollView>
  );

  // ── Tab "Historique" ──────────────────────────────────────────────────────
  const historyData = historyTab === 'joined' ? sessionsPastJoined : sessionsPastCreated;

  const HistoryView = () => (
    <FlatList
      data={historyData}
      keyExtractor={item => item.id.toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE5D02']} tintColor="#FE5D02" />}
      ListHeaderComponent={
        <View style={styles.subTabRow}>
          {[
            { key: 'joined',  label: 'Rejointes', count: sessionsPastJoined.length },
            { key: 'created', label: 'Créées',    count: sessionsPastCreated.length },
          ].map(({ key, label, count }) => {
            const active = historyTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.subTab, active && styles.subTabActive]}
                onPress={() => setHistoryTab(key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.subTabText, active && styles.subTabTextActive]}>{label}</Text>
                <View style={[styles.subTabBadge, active && styles.subTabBadgeActive]}>
                  <Text style={[styles.subTabBadgeText, active && styles.subTabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="time-outline"
          title="Aucune session ici"
          subtitle={historyTab === 'joined'
            ? "Les sessions que tu rejoins apparaîtront ici une fois terminées."
            : "Les sessions que tu crées apparaîtront ici une fois terminées."}
        />
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: 10 }}>
          <SessionCard
            session={item}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
          />
        </View>
      )}
    />
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FA' }}>

      {/* AppBar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: '#fff' }}>
        <MiniAppBar
          title="Sessions"
          hasNotifications={false}
          onProfilePress={() => navigation.navigate('Profile')}
          onNotificationsPress={() => navigation.navigate('Notifications')}
          onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
        />
      </View>

      <View style={{ flex: 1, paddingTop: MINI_APP_BAR_HEIGHT }}>

        {/* ── Tabs principaux ─────────────────────────────────────── */}
        <View style={styles.tabBarWrap}>
          {[
            { key: 'upcoming', label: 'À venir',    badge: sessionsUpcoming.length },
            { key: 'rhythm',   label: 'Rythme',     badge: 0 },
            { key: 'history',  label: 'Historique', badge: 0 },
          ].map(({ key, label, badge }) => {
            const active = activeSection === key;
            return (
              <Pressable
                key={key}
                onPress={() => setActiveSection(key)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
                {badge > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Vues ────────────────────────────────────────────────── */}
        {activeSection === 'upcoming' && <UpcomingView />}
        {activeSection === 'rhythm'   && <RhythmView />}
        {activeSection === 'history'  && <HistoryView />}

      </View>
    </View>
  );
};

export default ActivitiesScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabBarWrap: {
    flexDirection: 'row',
    backgroundColor: '#EDEDF0',
    borderRadius: 16,
    marginHorizontal: wp('4.5%'),
    marginTop: 12,
    marginBottom: 4,
    padding: 3,
  },
  tabBtn: {
    flex: 1, height: 36, borderRadius: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  tabBtnText: { fontSize: wp('3.3%'), color: '#AAAAAA', fontWeight: '600' },
  tabBtnTextActive: { color: '#FE5D02', fontWeight: '700' },
  tabBadge: {
    marginLeft: 5, backgroundColor: '#E0E0E0',
    borderRadius: 8, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: '#FFD6C0' },
  tabBadgeText: { color: '#888', fontSize: 10, fontWeight: '800', includeFontPadding: false },
  tabBadgeTextActive: { color: '#FE5D02' },

  // ── Listes ────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: wp('4.5%'), paddingTop: 12, paddingBottom: 120 },
  sectionCount: {
    fontSize: wp('3.2%'), color: '#BBBBBB',
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10,
  },

  // ── Sub-tabs historique ───────────────────────────────────────────────────
  subTabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  subTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: hp('1%'), paddingHorizontal: wp('3.5%'),
    borderRadius: 22, backgroundColor: '#F0F0F2',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  subTabActive: { backgroundColor: '#FFF3EE', borderColor: '#FE5D02' },
  subTabText: { fontSize: wp('3.5%'), fontWeight: '600', color: '#888' },
  subTabTextActive: { color: '#FE5D02', fontWeight: '700' },
  subTabBadge: {
    backgroundColor: '#E0E0E0', borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  subTabBadgeActive: { backgroundColor: '#FFD6C0' },
  subTabBadgeText: { fontSize: 11, fontWeight: '700', color: '#888', includeFontPadding: false },
  subTabBadgeTextActive: { color: '#FE5D02' },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingTop: hp('9%'), paddingHorizontal: wp('10%') },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F0F0F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: wp('4.3%'), fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  emptySub: { fontSize: wp('3.4%'), color: '#BBBBBB', textAlign: 'center', lineHeight: hp('2.5%'), marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#FE5D02', borderRadius: 14,
    paddingVertical: hp('1.3%'), paddingHorizontal: wp('6%'),
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('3.6%') },

  // ── Rythme ────────────────────────────────────────────────────────────────
  rhythmScroll: { paddingHorizontal: wp('4.5%'), paddingBottom: 120, paddingTop: 12 },

  rhythmHero: {
    backgroundColor: '#FFF3EE',
    borderRadius: 22, paddingVertical: hp('3%'),
    alignItems: 'center', marginBottom: hp('2%'),
    borderWidth: 1.5, borderColor: '#FFE0CC',
  },
  rhythmHeroSup: { fontSize: wp('3.2%'), color: '#FFA07A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  rhythmHeroBig: { fontSize: 58, fontWeight: '900', color: '#FE5D02', lineHeight: 62 },
  rhythmHeroSub: { fontSize: wp('4%'), color: '#FFA07A', fontWeight: '600', marginBottom: 8 },
  streakPill: {
    marginTop: 6, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FFD6C0',
  },
  streakText: { fontSize: wp('3.3%'), fontWeight: '700', color: '#FE5D02' },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: wp('3%'), marginBottom: hp('2%'),
  },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 18,
    paddingVertical: hp('1.8%'), paddingHorizontal: wp('3.5%'),
    alignItems: 'flex-start',
    borderWidth: 1.5, borderColor: '#F0F0F2',
  },
  statIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: hp('0.7%'),
  },
  statValue: { fontSize: wp('5%'), fontWeight: '800', color: '#111', marginBottom: 2 },
  statLabel: { fontSize: wp('3%'), color: '#ABABAB', fontWeight: '500' },

  // ── Prochaine session card ─────────────────────────────────────────────────
  nextCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: wp('4.5%'),
    borderWidth: 1.5, borderColor: '#F0F0F2',
    marginBottom: hp('2%'), position: 'relative',
  },
  nextCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nextCardEyebrow: { fontSize: wp('3%'), fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextCardBadge: {
    backgroundColor: '#FFF3EE', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FFD6C0',
  },
  nextCardBadgeText: { color: '#FE5D02', fontWeight: '800', fontSize: wp('3.1%') },
  nextCardTitle: { fontSize: wp('4.5%'), fontWeight: '800', color: '#111', marginBottom: 6 },
  nextCardRow: { flexDirection: 'row', alignItems: 'center' },
  nextCardDate: { fontSize: wp('3.3%'), color: '#ABABAB', fontWeight: '500' },
  nextCardArrow: { position: 'absolute', right: wp('4%'), top: '50%', marginTop: -8 },
});
