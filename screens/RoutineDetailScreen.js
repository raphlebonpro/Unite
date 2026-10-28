import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAppForeground } from '../context/AppForegroundContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ATTENDANCE_OPTIONS = [
  { value: 'going',     label: 'Présent',  icon: 'checkmark-circle-outline', color: '#2ECC71', bg: '#EDFBF3' },
  { value: 'not_going', label: 'Absent',   icon: 'close-circle-outline',     color: '#EB1E1E', bg: '#FFF0F0' },
];

const STATUS_META = {
  scheduled:  { label: 'Planifiée',  color: '#3888FF', bg: '#EBF2FF' },
  completed:  { label: 'Terminée',   color: '#2ECC71', bg: '#EDFBF3' },
  cancelled:  { label: 'Annulée',    color: '#EB1E1E', bg: '#FFF0F0' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return {
    day:   d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase(),
    num:   d.toLocaleDateString('fr-FR', { day: '2-digit' }),
    month: d.toLocaleDateString('fr-FR', { month: 'short' }),
  };
}

function isUpcoming(dateStr) {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RoutineDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { routineId, groupId } = route.params;

  const [routine,     setRoutine]     = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [attendance,  setAttendance]  = useState({}); // { sessionId: 'going' | 'not_going' }
  const [userId,      setUserId]      = useState(null);
  const [isCreator,   setIsCreator]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [updatingId,  setUpdatingId]  = useState(null);

  // ── Load data ──
  const loadData = useCallback(async (silent = false) => {
  if (!silent) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);

      // Routine
      const { data: routineData } = await supabase
        .from('group_routines')
        .select('*')
        .eq('id', routineId)
        .single();
      setRoutine(routineData);
      setIsCreator(routineData?.created_by === user?.id);

      // Séances à venir + récentes
      const { data: sessionsData } = await supabase
        .from('group_routine_sessions')
        .select('*')
        .eq('routine_id', routineId)
        .order('date', { ascending: true })
        .limit(16);
      setSessions(sessionsData || []);

      // Présences de l'utilisateur
      if (sessionsData?.length > 0) {
        const sessionIds = sessionsData.map(s => s.id);
        const { data: attData } = await supabase
          .from('group_attendance')
          .select('routine_session_id, status')
          .eq('user_id', user?.id)
          .in('routine_session_id', sessionIds);

        const attMap = {};
        (attData || []).forEach(a => { attMap[a.routine_session_id] = a.status; });
        setAttendance(attMap);
      }
    } catch (e) {
      console.error('RoutineDetail loadData error:', e);
    } finally {
      setLoading(false);
    }
  }, [routineId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useAppForeground(() => loadData(true));

  // ── Marquer présence ──
  const handleAttendance = async (sessionId, status) => {
    setUpdatingId(sessionId);
    try {
      const current = attendance[sessionId];

      if (current === status) {
        // Désélectionner
        await supabase.from('group_attendance')
          .delete()
          .eq('routine_session_id', sessionId)
          .eq('user_id', userId);
        setAttendance(prev => { const next = { ...prev }; delete next[sessionId]; return next; });
      } else if (current) {
        // Modifier
        await supabase.from('group_attendance')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('routine_session_id', sessionId)
          .eq('user_id', userId);
        setAttendance(prev => ({ ...prev, [sessionId]: status }));
      } else {
        // Créer
        await supabase.from('group_attendance')
          .insert({ routine_session_id: sessionId, user_id: userId, status });
        setAttendance(prev => ({ ...prev, [sessionId]: status }));
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la présence.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Archiver la routine (créateur) ──
  const handleArchive = () => {
    Alert.alert(
      'Archiver la routine ?',
      'La routine sera désactivée. Les séances passées sont conservées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Archiver', style: 'destructive', onPress: async () => {
          await supabase.from('group_routines').update({ active: false }).eq('id', routineId);
          Alert.alert('Routine archivée.');
          navigation.goBack();
        }},
      ]
    );
  };

  // ── Marquer séance terminée (créateur) ──
  const handleMarkCompleted = async (sessionId) => {
    await supabase.from('group_routine_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s));
  };

  if (loading || !routine) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F7FA' }}>
        <ActivityIndicator size="large" color="#FE5D02" />
      </View>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled' && isUpcoming(s.date));
  const pastSessions     = sessions.filter(s => s.status === 'completed' || !isUpcoming(s.date));

  const INT_TO_DAY = { 0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FA" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header info routine ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="repeat-outline" size={24} color="#FE5D02" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{routine.title}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.metaChip}>
                  <Ionicons name="fitness-outline" size={12} color="#FE5D02" />
                  <Text style={styles.metaChipText}>{routine.sport}</Text>
                </View>
                {routine.level && (
                  <View style={styles.metaChip}>
                    <Ionicons name="stats-chart-outline" size={12} color="#7367F0" />
                    <Text style={[styles.metaChipText, { color: '#7367F0' }]}>{routine.level}</Text>
                  </View>
                )}
                <View style={[styles.metaChip, { backgroundColor: '#EDFBF3' }]}>
                  <Ionicons name="repeat-outline" size={12} color="#2ECC71" />
                  <Text style={[styles.metaChipText, { color: '#2ECC71' }]}>
                    {routine.frequency === 'weekly' ? 'Hebdo' : 'Bi-hebdo'}
                  </Text>
                </View>
              </View>
            </View>
            {isCreator && (
              <TouchableOpacity onPress={handleArchive} style={styles.archiveBtn} activeOpacity={0.7}>
                <Ionicons name="archive-outline" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Détails */}
          <View style={styles.heroDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#999" />
              <Text style={styles.detailText}>
{(routine.days_of_week || []).map(d => INT_TO_DAY[d] ?? String(d)).join(', ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#999" />
              <Text style={styles.detailText}>{routine.time?.slice(0, 5)}</Text>
            </View>
            {routine.location && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color="#999" />
                <Text style={styles.detailText} numberOfLines={1}>{routine.location}</Text>
              </View>
            )}
            {routine.max_participants && (
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={14} color="#999" />
                <Text style={styles.detailText}>Max {routine.max_participants} participants</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Séances à venir ── */}
        <Text style={styles.sectionLabel}>Séances à venir</Text>

        {upcomingSessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={28} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucune séance planifiée.</Text>
          </View>
        ) : (
          upcomingSessions.map(s => {
            const dateInfo  = formatDateShort(s.date);
            const userAtt   = attendance[s.id];
            const isUpdating = updatingId === s.id;

            return (
              <View key={s.id} style={styles.sessionCard}>
                {/* Date block */}
                <View style={styles.dateBlock}>
                  <Text style={styles.dateDay}>{dateInfo.day}</Text>
                  <Text style={styles.dateNum}>{dateInfo.num}</Text>
                  <Text style={styles.dateMonth}>{dateInfo.month}</Text>
                </View>

                {/* Contenu */}
                <View style={styles.sessionBody}>
                  <Text style={styles.sessionTime}>{routine.time?.slice(0, 5)}</Text>
                  {routine.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <Ionicons name="location-outline" size={12} color="#BBB" />
                      <Text style={styles.sessionLoc} numberOfLines={1}>{routine.location}</Text>
                    </View>
                  )}

                  {/* Boutons présence */}
                  <View style={styles.attRow}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#FE5D02" style={{ marginTop: 8 }} />
                    ) : (
                      ATTENDANCE_OPTIONS.map(opt => {
                        const active = userAtt === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[styles.attBtn, active && { backgroundColor: opt.bg, borderColor: opt.color }]}
                            onPress={() => handleAttendance(s.id, opt.value)}
                            activeOpacity={0.75}
                          >
                            <Ionicons
                              name={opt.icon}
                              size={14}
                              color={active ? opt.color : '#BBBBBB'}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.attBtnText, active && { color: opt.color, fontWeight: '700' }]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>

                {/* Actions créateur */}
                {isCreator && s.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.markDoneBtn}
                    onPress={() => handleMarkCompleted(s.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-done-outline" size={16} color="#2ECC71" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* ── Historique ── */}
        {pastSessions.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: hp('3%') }]}>Historique</Text>
            {pastSessions.slice(0, 5).map(s => {
              const dateInfo = formatDateShort(s.date);
              const statusM  = STATUS_META[s.status] || STATUS_META.completed;
              const userAtt  = attendance[s.id];

              return (
                <View key={s.id} style={[styles.sessionCard, { opacity: 0.7 }]}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateDay}>{dateInfo.day}</Text>
                    <Text style={styles.dateNum}>{dateInfo.num}</Text>
                    <Text style={styles.dateMonth}>{dateInfo.month}</Text>
                  </View>
                  <View style={styles.sessionBody}>
                    <Text style={styles.sessionTime}>{routine.time?.slice(0, 5)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusM.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusM.color }]}>{statusM.label}</Text>
                      </View>
                      {userAtt && (
                        <View style={[styles.statusBadge, { backgroundColor: userAtt === 'going' ? '#EDFBF3' : '#FFF0F0' }]}>
                          <Ionicons
                            name={userAtt === 'going' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                            size={12}
                            color={userAtt === 'going' ? '#2ECC71' : '#EB1E1E'}
                            style={{ marginRight: 3 }}
                          />
                          <Text style={[styles.statusBadgeText, { color: userAtt === 'going' ? '#2ECC71' : '#EB1E1E' }]}>
                            {userAtt === 'going' ? 'Présent' : 'Absent'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: hp('4%') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FA' },
  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
  },

  // ── Hero ──
  heroCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: wp('4%'),
    borderWidth: 1, borderColor: '#EBEBEB',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  heroTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  heroIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroTitle: { fontSize: wp('4.4%'), fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  heroMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF3EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  metaChipText: { fontSize: wp('3%'), fontWeight: '600', color: '#FE5D02' },

  heroDetails: { gap: 8 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText:  { fontSize: wp('3.5%'), color: '#666', fontWeight: '500', flex: 1 },

  archiveBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center',
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: wp('3%'), fontWeight: '700', color: '#ABABAB',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginLeft: wp('1%'), marginTop: hp('2.5%'), marginBottom: hp('1%'),
  },

  // ── Session card ──
  sessionCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#EBEBEB', flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  dateBlock: {
    width: 56, alignItems: 'center', paddingVertical: 16,
    backgroundColor: '#F7F7F9', borderRightWidth: 1, borderRightColor: '#EBEBEB',
  },
  dateDay:   { fontSize: 10, fontWeight: '700', color: '#FE5D02', letterSpacing: 0.5 },
  dateNum:   { fontSize: 22, fontWeight: '800', color: '#1A1A2E', lineHeight: 26 },
  dateMonth: { fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'capitalize' },

  sessionBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  sessionTime: { fontSize: wp('3.8%'), fontWeight: '700', color: '#1A1A2E' },
  sessionLoc:  { fontSize: wp('3%'), color: '#BBB', flex: 1 },

  // ── Présence ──
  attRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  attBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#F7F7F9', borderWidth: 1, borderColor: '#E8E8E8',
  },
  attBtnText: { fontSize: wp('3%'), fontWeight: '600', color: '#BBBBBB' },

  // ── Mark done ──
  markDoneBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EDFBF3', alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1, borderColor: '#C3F0D8',
  },

  // ── Status badge ──
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statusBadgeText: { fontSize: wp('2.8%'), fontWeight: '600' },

  // ── Empty ──
  emptyBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#EBEBEB',
  },
  emptyText: { fontSize: wp('3.5%'), color: '#BBBBBB', fontWeight: '500' },
});
