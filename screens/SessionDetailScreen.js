import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  Linking,
  Animated,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import {
  notifyYouJoinedSession,
  notifyParticipantJoinedCreator,
  notifyParticipantJoinedOthers,
  notifyParticipantLeft,
  notifyExclusion,
} from '../helpers/notifications';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppForeground } from '../context/AppForegroundContext';

// ─────────────────────────────────────────────
// SPORT ICONS (inchangé)
// ─────────────────────────────────────────────
const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={16} color="#fff" />, color: '#3888FF', bg: ['#1A5FFF', '#3888FF'] },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={16} color="#fff" />, color: '#FFA726', bg: ['#F57C00', '#FFA726'] },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={16} color="#fff" />, color: '#2ECC71', bg: ['#16A34A', '#2ECC71'] },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={16} color="#fff" />, color: '#E9436D', bg: ['#C2185B', '#E9436D'] },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={16} color="#fff" />, color: '#3CD6E6', bg: ['#0097A7', '#3CD6E6'] },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={16} color="#fff" />, color: '#1469B9', bg: ['#0D47A1', '#1469B9'] },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={16} color="#fff" />, color: '#7367F0', bg: ['#5E35B1', '#7367F0'] },
  Fitness: { icon: <MaterialCommunityIcons name="weight-lifter" size={16} color="#fff" />, color: '#7C4DFF', bg: ['#6200EA', '#7C4DFF'] },
  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={16} color="#fff" />, color: '#A259F7', bg: ['#7B1FA2', '#A259F7'] },
  Padel: { icon: <MaterialCommunityIcons name="tennis" size={16} color="#fff" />, color: '#FFD600', bg: ['#F9A825', '#FFD600'] },
  'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={16} color="#fff" />, color: '#00B8D4', bg: ['#006064', '#00B8D4'] },
  'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={16} color="#fff" />, color: '#43A047', bg: ['#2E7D32', '#43A047'] },
  VTT: { icon: <MaterialCommunityIcons name="bike" size={16} color="#fff" />, color: '#009688', bg: ['#00695C', '#009688'] },
  Surf: { icon: <MaterialCommunityIcons name="surfing" size={16} color="#fff" />, color: '#26C6DA', bg: ['#00838F', '#26C6DA'] },
  Escalade: { icon: <MaterialCommunityIcons name="terrain" size={16} color="#fff" />, color: '#689F38', bg: ['#33691E', '#689F38'] },
  CrossFit: { icon: <MaterialCommunityIcons name="weight-lifter" size={16} color="#fff" />, color: '#536DFE', bg: ['#304FFE', '#536DFE'] },
  'Arts Martiaux': { icon: <MaterialCommunityIcons name="boxing-glove" size={16} color="#fff" />, color: '#FF3D00', bg: ['#BF360C', '#FF3D00'] },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={16} color="#fff" />, color: '#F48FB1', bg: ['#C2185B', '#F48FB1'] },
  Marche: { icon: <MaterialCommunityIcons name="walk" size={16} color="#fff" />, color: '#00A676', bg: ['#00695C', '#00A676'] },
  Autres: { icon: <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />, color: '#9E9E9E', bg: ['#616161', '#9E9E9E'] },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const LETTER_COLORS = [
  '#4A90E2','#50E3C2','#F5A623','#9013FE','#D0021B',
  '#7ED321','#F8E71C','#B8E986','#417505','#BD10E0',
  '#FF3366','#00BCD4','#FF9800',
];

function getColorFromUsername(username = '') {
  if (!username) return '#4A90E2';
  const idx = (username.charCodeAt(0) - 65 + 26) % LETTER_COLORS.length;
  return LETTER_COLORS[idx];
}

function getSportMeta(sport) {
  if (!sport) return sportIcons.Autres;
  const norm = sport.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const key = Object.keys(sportIcons).find(k =>
    k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm
  );
  return sportIcons[key] || sportIcons.Autres;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(time) {
  return time?.slice(0, 5) ?? '';
}

function isSessionFinished(session) {
  if (!session?.date || !session?.time) return false;
  return new Date(`${session.date}T${session.time.slice(0, 5)}`).getTime() < Date.now();
}

async function scheduleSessionReminder(session) {
  const t = new Date(`${session.date}T${session.time.slice(0, 5)}`);
  const reminder = new Date(t.getTime() - 2 * 3600 * 1000);
  if (reminder < new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Session à venir', body: `"${session.title}" commence dans 2h !`, data: { sessionId: session.id } },
    trigger: reminder,
  });
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Avatar avec initiale colorée en fallback */
const Avatar = ({ avatar, username, size = 46, isCreator = false }) => {
  const bg = getColorFromUsername(username);
  return (
    <View style={{ position: 'relative' }}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: '#fff' }} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{username?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
        </View>
      )}
      {isCreator && (
        <View style={S.creatorBadge}>
          <Ionicons name="star" size={7} color="#fff" />
        </View>
      )}
    </View>
  );
};

/** Chip info (date / heure / niveau / places) */
const InfoChip = ({ iconName, iconLib = 'Ionicons', label, value, gradColors }) => {
  const IconComp = iconLib === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={S.infoChip}>
      <LinearGradient colors={gradColors} style={S.infoChipIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <IconComp name={iconName} size={14} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={S.infoChipLabel}>{label}</Text>
        <Text style={S.infoChipValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const SessionDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sessionId = route?.params?.sessionId ?? null;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [user, setUser] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [hasGivenSessionFeedback, setHasGivenSessionFeedback] = useState(false);
  const [hasRatedParticipants, setHasRatedParticipants] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [isGroupMember, setIsGroupMember] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  if (!sessionId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>Session introuvable.</Text>
      </View>
    );
  }

  const sportMeta = useMemo(() => getSportMeta(session?.sport), [session?.sport]);

  // ── Data loading ──
const loadSessionData = useCallback(async (silent = false) => {
  if (!sessionId) return;
  if (!silent) setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user ?? null;
      setUser(currentUser);

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*, group:groups(id, name)')
        .eq('id', sessionId)
        .maybeSingle();

      if (!sessionData) { setLoading(false); return; }
      setSession(sessionData);

      const [participantsRes, kickedRes, groupRes, feedbackRes, ratingRes, invitationRes] = await Promise.all([
        supabase.from('session_participants')
          .select('user:users!session_participants_user_id_fkey(id,username,profile_photo)')
          .eq('session_id', sessionId),
        currentUser
          ? supabase.from('sessions_kicked').select('id').eq('session_id', sessionId).eq('user_id', currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
        sessionData.group_id && currentUser
          ? supabase.from('group_members').select('id').eq('group_id', sessionData.group_id).eq('user_id', currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
        currentUser
          ? supabase.from('session_feedback').select('id').eq('session_id', sessionId).eq('user_id', currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
        currentUser
          ? supabase.from('user_ratings').select('id').eq('session_id', sessionId).eq('rater_id', currentUser.id)
          : Promise.resolve({ data: null }),
        currentUser
          ? supabase.from('session_invitations').select('id').eq('session_id', sessionId).eq('invited_id', currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const list = participantsRes.data?.map(r => ({ id: r.user.id, username: r.user.username, avatar: r.user.profile_photo })) ?? [];
      setParticipants(list);
      setIsParticipant(!!currentUser && list.some(p => p.id === currentUser.id));
      setIsKicked(!!kickedRes.data);
      setIsGroupMember(!!groupRes.data);
      setHasGivenSessionFeedback(!!feedbackRes.data);
      setHasRatedParticipants(!!ratingRes.data?.length);
      setInvitation(invitationRes.data ?? null);
    } catch (err) {
      console.log('loadSessionData error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(useCallback(() => { loadSessionData(); }, [loadSessionData]));

  useAppForeground(() => loadSessionData(true));

  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase.channel(`session-participants-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${session.id}` }, loadSessionData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.id, loadSessionData]);

  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  // ── Derived ──
  const isGroupSession = !!session?.group_id;
  const finished = isSessionFinished(session);
  const mapRegion = useMemo(() => {
    if (!session?.lat || !session?.lng) return null;
    return { latitude: +session.lat, longitude: +session.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }, [session?.lat, session?.lng]);

  const totalSlots = session?.max_participants ?? 0;
  const usedSlots = participants.length;
  const slotsText = totalSlots > 0 ? `${usedSlots} / ${totalSlots}` : `${usedSlots}`;
  const fillRatio = totalSlots > 0 ? Math.min(usedSlots / totalSlots, 1) : 0;

  // ── Share ──
  const shareSession = async () => {
    try {
      const url = `https://uniteapp.fr/session?id=${session.id}`;
      await Share.share({
        message: `${session.title} — ${session.sport}\n📅 ${formatDate(session.date)} à ${formatTime(session.time)}\n📍 ${session.location}\n\nRejoins la session sur UNITE 👇\n${url}`,
      });
    } catch {}
  };

  // ── Join ──
  const confirmJoin = () =>
    Alert.alert('Rejoindre la session ?', 'Tu vas être ajouté et visible des autres participants.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Rejoindre', onPress: handleJoin },
    ]);

  const handleJoin = async () => {
    if (isGroupSession && !isGroupMember && !invitation) {
      return Alert.alert('Session réservée au groupe', 'Tu dois être membre du groupe pour rejoindre cette session.');
    }
    setLoadingJoin(true);

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData.user) { setLoadingJoin(false); return Alert.alert('Erreur', 'Tu dois être connecté.'); }
    const userId = userData.user.id;

    const { data: recentLeave } = await supabase.from('session_leaves').select('created_at')
      .eq('session_id', session.id).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
    if (recentLeave && (Date.now() - new Date(recentLeave.created_at).getTime()) / 60000 < 30) {
      setLoadingJoin(false);
      return Alert.alert('Rejoins plus tard', 'Tu pourras rejoindre cette session dans environ 30 minutes.');
    }

    const { data: ex } = await supabase.from('session_participants').select().eq('session_id', session.id).eq('user_id', userId);
    if (ex?.length) { setLoadingJoin(false); return Alert.alert('Info', 'Tu participes déjà.'); }

    if (session.girls_only) {
      const { data: prof } = await supabase.from('users').select('gender').eq('id', userId).single();
      if (prof?.gender !== 'Femme') {
        setLoadingJoin(false);
        return Alert.alert('Session réservée aux femmes', 'Désolé, cette session est réservée aux filles uniquement.');
      }
    }

    try {
      const { data: pRows } = await supabase.from('session_participants').select('user_id').eq('session_id', session.id);
      let ids = pRows?.map(p => p.user_id) ?? [];
      if (session.creator_id && !ids.includes(session.creator_id)) ids.push(session.creator_id);
      if (ids.length) {
        const { data: blocks } = await supabase.from('blocked_users').select('*')
          .or(`and(blocker_id.in.(${ids.join(',')}),blocked_id.eq.${userId}),and(blocked_id.in.(${ids.join(',')}),blocker_id.eq.${userId})`);
        if (blocks?.length) { setLoadingJoin(false); return Alert.alert('Impossible de rejoindre', 'Un blocage existe entre toi et l\'organisateur.'); }
      }
    } catch {}

    if (session.max_participants > 0) {
      const { data: cur } = await supabase.from('session_participants').select('id').eq('session_id', session.id);
      if ((cur?.length ?? 0) >= session.max_participants) { setLoadingJoin(false); return Alert.alert('Session complète', 'La capacité maximale est atteinte.'); }
    }

    const { data: fresh } = await supabase.from('session_participants').select('id').eq('session_id', session.id);
    if (session.max_participants > 0 && (fresh?.length ?? 0) >= session.max_participants) {
      setLoadingJoin(false);
      return Alert.alert('Session complète', 'Quelqu\'un vient de prendre la dernière place.');
    }

    const { error: insErr } = await supabase.from('session_participants').insert({ session_id: session.id, user_id: userId });
    setLoadingJoin(false);
    if (insErr) return Alert.alert('Erreur', insErr.message);
    setIsParticipant(true);

    // Analytics
(async () => { try { await supabase.from('analytics_events').insert({
  user_id: userId,
  event_name: 'session_joined',
  properties: { sport: session.sport, level: session.level, is_group: isGroupSession },
  platform: Platform.OS,
  app_version: Constants.expoConfig?.version,
}); } catch {} })();

    const { data: userProfile } = await supabase.from('users').select('username, email').eq('id', userId).single();
    const pseudo = userProfile?.username?.trim() || userProfile?.email?.split('@')[0] || 'Un utilisateur';

    navigation.navigate('MainTabs', { screen: 'Sessions', params: { section: 'upcoming' } });

    setTimeout(async () => {
      try {
        if (session.creator_id && userId !== session.creator_id)
          await notifyParticipantJoinedCreator({ creatorId: session.creator_id, joinerId: userId, joinerName: pseudo, sessionTitle: session.title, sessionId: session.id });
        await notifyYouJoinedSession({ userId, sessionTitle: session.title, sessionId: session.id });
        await notifyParticipantJoinedOthers({ participantIds: participants.map(p => p.id).filter(pid => pid !== userId && pid !== session.creator_id), joinerId: userId, joinerName: pseudo, sessionTitle: session.title, sessionId: session.id });
        await scheduleSessionReminder(session);
      } catch {}
    }, 0);
  };

  const handleLeave = () =>
    Alert.alert('Quitter la session', 'Es-tu sûr de vouloir quitter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive',
        onPress: async () => {
          setLoadingJoin(true);
          const { error } = await supabase.from('session_participants').delete().eq('session_id', session.id).eq('user_id', user.id);
          await supabase.from('session_leaves').insert([{ session_id: session.id, user_id: user.id }]);
          setLoadingJoin(false);
          if (error) { Alert.alert('Erreur', 'Impossible de quitter la session.'); return; }
          setIsParticipant(false);

          // Analytics
(async () => { try { await supabase.from('analytics_events').insert({
  user_id: user.id,
  event_name: 'session_left',
  properties: { sport: session.sport },
  platform: Platform.OS,
}); } catch {} })();

          if (session.creator_id && user.id !== session.creator_id) {
            const { data: prof } = await supabase.from('users').select('username, email').eq('id', user.id).single();
            const pseudo = prof?.username?.trim() || prof?.email?.split('@')[0] || 'Un utilisateur';
            await notifyParticipantLeft({ creatorId: session.creator_id, leaverId: user.id, leaverName: pseudo, sessionTitle: session.title, sessionId: session.id, otherParticipantIds: participants.map(p => p.id).filter(pid => pid !== user.id && pid !== session.creator_id) });
          }
          navigation.navigate('MainTabs', { screen: 'Sessions' });
        },
      },
    ]);

  // ── Loading ──
  if (loading || !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FE5D02" />
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // ACTION BUTTONS LOGIC (sticky bar)
  // ─────────────────────────────────────────────
  const isCreator = user && session.creator_id === user.id;
  const canJoin = !isParticipant && user && !isCreator && (!isGroupSession || isGroupMember || invitation);

  const renderStickyBar = () => {
    if (isKicked) return null;

    // Session terminée
    if ((isCreator || isParticipant) && finished && !session.is_cancelled) {
      if (hasGivenSessionFeedback && hasRatedParticipants) {
        return (
          <View style={[S.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
            <View style={S.feedbackDone}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={S.feedbackDoneText}>Avis déjà envoyé — merci ! 🙌</Text>
            </View>
          </View>
        );
      }
      return (
        <View style={[S.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={[S.ctaPrimary, { backgroundColor: '#7367F0' }]} onPress={() => navigation.navigate('SessionFeedback', { sessionId: session.id })} activeOpacity={0.88}>
            <Ionicons name="star-outline" size={18} color="#fff" />
            <Text style={S.ctaPrimaryText}>Laisser un avis</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Créateur
    if (isCreator) {
      return (
        <View style={[S.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={S.ctaSecondarySquare} onPress={shareSession} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={[S.ctaPrimary, { backgroundColor: '#001242', flex: 0.9 }]} onPress={() => navigation.navigate('SessionMessages', { sessionId: session.id })} activeOpacity={0.88}>
            <Ionicons name="chatbubble-outline" size={17} color="#fff" />
            <Text style={S.ctaPrimaryText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.ctaPrimary, { backgroundColor: '#FE5D02', flex: 0.8 }]} onPress={() => navigation.navigate('EditSession', { sessionId: session.id })} activeOpacity={0.88}>
            <Ionicons name="pencil-outline" size={17} color="#fff" />
            <Text style={S.ctaPrimaryText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Participant
    if (isParticipant) {
      return (
        <View style={[S.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={S.ctaSecondarySquare} onPress={shareSession} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={[S.ctaPrimary, { backgroundColor: '#001242' }]} onPress={() => navigation.navigate('SessionMessages', { sessionId: session.id })} activeOpacity={0.88}>
            <Ionicons name="chatbubble-outline" size={17} color="#fff" />
            <Text style={S.ctaPrimaryText}>Groupe / Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.ctaSecondarySquare, { backgroundColor: '#FFF1F1', borderColor: '#FFD5D5' }]} onPress={handleLeave} disabled={loadingJoin} activeOpacity={0.8}>
            <Ionicons name="exit-outline" size={20} color="#EB1E1E" />
          </TouchableOpacity>
        </View>
      );
    }

    // Session de groupe — non-membre sans invitation
    if (isGroupSession && !isGroupMember && !invitation && user) {
      return (
        <View style={[S.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={S.ctaSecondarySquare} onPress={shareSession} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color="#555" />
          </TouchableOpacity>
          <LinearGradient colors={['#3F4FFF', '#7A5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.ctaGradientWrap}>
            <TouchableOpacity style={S.ctaGradientInner} onPress={() => navigation.navigate('GroupDetail', { groupId: session.group_id, fromSessionId: session.id })} activeOpacity={0.88}>
              <Ionicons name="people-outline" size={17} color="#fff" />
              <Text style={S.ctaPrimaryText}>Voir le groupe</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }

    // Rejoindre (lambda / invité)
    if (canJoin) {
      return (
        <View style={[S.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={S.ctaSecondarySquare} onPress={shareSession} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={[S.ctaPrimary, { backgroundColor: '#FE5D02' }]} onPress={confirmJoin} disabled={loadingJoin} activeOpacity={0.88}>
            {loadingJoin ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="flash-outline" size={18} color="#fff" />
                <Text style={S.ctaPrimaryText}>Rejoindre la session</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

      {/* ── SCROLLABLE BODY ── */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >

        {/* ── HERO ── */}
        <View style={S.hero}>
          <LinearGradient colors={['#0A1230', '#0E1A45', '#162260']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          {/* Orbes discrets */}
          <View style={[S.orb, { top: -15, right: -15, backgroundColor: 'rgba(254,93,2,0.18)', width: 90, height: 90 }]} />
          <View style={[S.orb, { bottom: -20, left: -20, backgroundColor: 'rgba(246,45,174,0.12)', width: 80, height: 80 }]} />

          {/* Contenu hero — pas de nav custom, la mini app bar native s'en charge */}
          <View style={S.heroContent}>
            {/* Bannières */}
            {invitation && (
              <View style={S.heroBanner}>
                <Ionicons name="mail-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={S.heroBannerText}>Tu as été invité à cette session</Text>
              </View>
            )}
            {isGroupSession && !isGroupMember && !invitation && (
              <View style={[S.heroBanner, { borderColor: 'rgba(255,80,80,0.5)', backgroundColor: 'rgba(255,50,50,0.2)' }]}>
                <Ionicons name="lock-closed-outline" size={12} color="#FF8080" />
                <Text style={[S.heroBannerText, { color: '#FF8080' }]}>Session réservée aux membres du groupe</Text>
              </View>
            )}

            {/* Groupe badge */}
            {session.group?.name && (
              <TouchableOpacity style={S.groupBadge} onPress={() => navigation.navigate('GroupDetail', { groupId: session.group.id })} activeOpacity={0.8}>
                <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={S.groupBadgeText}>Groupe · {session.group.name}</Text>
              </TouchableOpacity>
            )}

            {/* Titre */}
            <Text style={S.heroTitle}>{session.title}</Text>

            {/* Sport pill + adresse */}
            <View style={S.heroMeta}>
              <LinearGradient colors={sportMeta.bg ?? ['#666', '#999']} style={S.sportPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {sportMeta.icon}
                <Text style={S.sportPillText}>{session.sport}</Text>
              </LinearGradient>
              {session.girls_only && (
                <View style={[S.sportPill, { backgroundColor: 'rgba(246,45,174,0.25)', borderWidth: 1, borderColor: 'rgba(246,45,174,0.5)' }]}>
                  <Text style={{ fontSize: 12 }}>♀️</Text>
                  <Text style={[S.sportPillText, { color: '#F62DAE' }]}>Filles uniquement</Text>
                </View>
              )}
            </View>

            {/* Adresse */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={S.heroAddress} numberOfLines={1}>{session.location}</Text>
            </View>
          </View>
        </View>

        {/* ── INFO GRID ── */}
        <View style={S.infoGrid}>
          <InfoChip iconName="calendar-outline" label="Date" value={formatDate(session.date)} gradColors={['#FE5D02', '#FF8438']} />
          <InfoChip iconName="time-outline" label="Heure" value={formatTime(session.time)} gradColors={['#3888FF', '#5AA0FF']} />
          <InfoChip iconName="stats-chart-outline" label="Niveau" value={session.level ?? '—'} gradColors={['#22C55E', '#4ADE80']} />
          <InfoChip
            iconName="people-outline"
            label="Participants"
            value={
              totalSlots > 0
                ? `${usedSlots} / ${totalSlots}`
                : usedSlots === 0
                  ? 'Aucun encore'
                  : `${usedSlots} inscrit${usedSlots > 1 ? 's' : ''}`
            }
            gradColors={['#8B5CF6', '#A78BFA']}
          />
        </View>

        {/* ── MAP ── */}
        {mapReady && mapRegion && (
          <View style={S.mapCard}>
            <MapView
              style={StyleSheet.absoluteFill}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={mapRegion}
              showsUserLocation
              showsMyLocationButton={false}
              loadingEnabled
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker coordinate={{ latitude: +session.lat, longitude: +session.lng }} />
            </MapView>
            {/* Overlay pill adresse */}
            <TouchableOpacity
              style={S.mapPill}
              onPress={() => Linking.openURL(`https://maps.google.com?q=${session.lat},${session.lng}`)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate-outline" size={12} color="#FE5D02" />
              <Text style={S.mapPillText} numberOfLines={1}>{session.location}</Text>
              <Ionicons name="open-outline" size={12} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── PARTICIPANTS ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Coéquipiers ({participants.length})</Text>
            {(isCreator || isParticipant) && (
              <TouchableOpacity style={S.sectionBtn} onPress={() => navigation.navigate('InviteFriendsToSession', { sessionId: session.id })} activeOpacity={0.8}>
                <Ionicons name="person-add-outline" size={13} color="#F62DAE" />
                <Text style={S.sectionBtnText}>Inviter</Text>
              </TouchableOpacity>
            )}
          </View>

          {participants.length === 0 ? (
            <Text style={S.emptyText}>Aucun participant pour l'instant.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
              {participants.map(p => (
                <View key={p.id} style={{ alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: p.id })} activeOpacity={0.8}>
                    <Avatar avatar={p.avatar} username={p.username} size={48} isCreator={p.id === session.creator_id} />
                  </TouchableOpacity>
                  <Text style={S.avatarName} numberOfLines={1}>{p.username}</Text>
                  {/* Bouton exclure (créateur uniquement) */}
                  {isCreator && p.id !== user.id && (
                    <TouchableOpacity
                      style={S.kickBtn}
                      onPress={() =>
                        Alert.alert('Exclure ce participant ?', `Retirer ${p.username} de la session ?`, [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Exclure', style: 'destructive', onPress: async () => {
                              try {
                                await supabase.from('sessions_kicked').insert([{ session_id: session.id, user_id: p.id }]);
                                await supabase.from('session_participants').delete().eq('session_id', session.id).eq('user_id', p.id);
                                notifyExclusion({ creatorId: session.creator_id, excludedId: p.id, excludedName: p.username, sessionTitle: session.title, sessionId: session.id, otherParticipantIds: participants.map(x => x.id).filter(id => id !== p.id && id !== session.creator_id) });
                              } catch (e) { Alert.alert('Erreur', e.message); }
                            },
                          },
                        ])
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={S.kickBtnText}>Exclure</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {/* Slots libres visuels */}
              {totalSlots > 0 && usedSlots < totalSlots && (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <View style={S.emptySlot}>
                    <Ionicons name="add" size={22} color="#ccc" />
                  </View>
                  <Text style={[S.avatarName, { color: '#bbb' }]}>{totalSlots - usedSlots} libre{totalSlots - usedSlots > 1 ? 's' : ''}</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Barre de progression des places */}
          {totalSlots > 0 && (
            <View style={S.progressBar}>
              <Text style={S.progressLabel}>Remplissage</Text>
              <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${fillRatio * 100}%` }]} />
              </View>
              <Text style={[S.progressLabel, { color: fillRatio >= 1 ? '#EB1E1E' : '#FE5D02', fontWeight: '700' }]}>
                {usedSlots}/{totalSlots}
              </Text>
            </View>
          )}
        </View>

        {/* ── DESCRIPTION ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Description</Text>
          </View>
          <View style={S.descBox}>
            <Text style={S.descText}>{session.description || 'Aucune description pour l\'instant.'}</Text>
          </View>
        </View>

        {/* ── LIEN EXTERNE ── */}
        {session.link && (
          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>Lien</Text>
            </View>
            <TouchableOpacity
              style={S.linkBox}
              onPress={() => Linking.openURL(session.link.startsWith('http') ? session.link : `https://${session.link}`).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien.'))}
              activeOpacity={0.75}
            >
              <View style={[S.infoChipIconWrap, { backgroundColor: '#3F4FFF' }]}>
                <Ionicons name="link-outline" size={14} color="#fff" />
              </View>
              <Text style={S.linkText} numberOfLines={1}>{session.link}</Text>
              <Ionicons name="open-outline" size={16} color="#3F4FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── KICKED MESSAGE ── */}
        {isKicked && (
          <View style={[S.section, { marginBottom: 0 }]}>
            <View style={S.kickedBox}>
              <Ionicons name="ban-outline" size={20} color="#EB1E1E" />
              <Text style={S.kickedText}>Tu as été exclu de cette session par l'organisateur.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 16 }} />
      </Animated.ScrollView>

      {/* ── STICKY BOTTOM CTA ── */}
      {renderStickyBar()}
    </View>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = StyleSheet.create({
  // HERO
  hero: {
    paddingTop: 22,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(109,106,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(109,106,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  heroBannerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  groupBadgeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 14,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sportPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroAddress: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },

  // INFO GRID
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  infoChip: {
    width: '47%',
    backgroundColor: '#F7F7F8',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  infoChipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoChipLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  infoChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F0F0F',
  },

  // MAP
  mapCard: {
    marginHorizontal: 16,
    marginTop: 14,
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#F0F4FB',
  },
  mapPill: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -90 }],
    width: 180,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  mapPillText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },

  // SECTIONS
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F0F0F',
    letterSpacing: -0.2,
  },
  sectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(246,45,174,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F62DAE',
  },

  // PARTICIPANTS
  emptyText: {
    color: '#aaa',
    fontSize: 13,
    fontStyle: 'italic',
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    maxWidth: 52,
  },
  creatorBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FE5D02',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7F7F8',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickBtn: {
    backgroundColor: 'rgba(235,30,30,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kickBtnText: {
    color: '#EB1E1E',
    fontSize: 10,
    fontWeight: '700',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE5D02',
    borderRadius: 10,
  },

  // DESCRIPTION
  descBox: {
    backgroundColor: '#F7F7F8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  descText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#444',
    fontWeight: '400',
  },

  // LIEN
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F4FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D0DAFF',
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3F4FFF',
    textDecorationLine: 'underline',
  },

  // KICKED
  kickedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF1F1',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EB1E1E',
  },
  kickedText: {
    flex: 1,
    color: '#EB1E1E',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },

  // STICKY BAR
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  ctaSecondarySquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  ctaPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  ctaGradientWrap: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradientInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  feedbackDone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  feedbackDoneText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default SessionDetailScreen;
