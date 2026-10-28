import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabaseClient';
import { notifyReviewReceived } from '../helpers/notifications';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const LETTER_COLORS = [
  ['#4A90E2','#5AA0FF'], ['#F62DAE','#FF6BD6'], ['#22C55E','#4ADE80'],
  ['#FE5D02','#FF8438'], ['#8B5CF6','#A78BFA'], ['#F5A623','#FFBF5E'],
  ['#E9436D','#FF7096'], ['#00BCD4','#4DD8ED'],
];
const getAvatarColors = (name = '') => {
  const i = ((name.charCodeAt(0) || 65) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[Math.max(0, i)];
};

const STAR_LABELS = {
  1: { text: 'Peut mieux faire', color: '#E53935' },
  2: { text: 'Pas terrible',     color: '#FFA726' },
  3: { text: 'Bien',             color: '#FFA726' },
  4: { text: 'Très bien',        color: '#2ECC71' },
  5: { text: 'Excellent !',      color: '#FE5D02' },
};

// ─── STAR RATING ──────────────────────────────────────────────────────────────

const StarRating = ({ rating, onChange, readonly = false }) => (
  <View style={S.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <TouchableOpacity
        key={i}
        onPress={() => !readonly && onChange(i)}
        activeOpacity={readonly ? 1 : 0.7}
        disabled={readonly}
        style={S.starBtn}
      >
        <Text style={[S.star, i <= rating ? S.starFilled : S.starEmpty]}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── AVATAR ───────────────────────────────────────────────────────────────────

const Avatar = ({ photo, username, size = 46 }) => {
  const colors = getAvatarColors(username);
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <LinearGradient
      colors={colors}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>
        {username?.charAt(0)?.toUpperCase() ?? 'U'}
      </Text>
    </LinearGradient>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function RateSessionScreen({
  sessionId: initialSessionId,
  currentUserId: initialCurrentUserId,
  navigation,
  onFinished,
  route,
}) {
  const insets = useSafeAreaInsets();

  const [sessionId,     setSessionId]     = useState(initialSessionId);
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [sessionTitle,  setSessionTitle]  = useState('');
  const [participants,  setParticipants]  = useState([]);
  const [ratings,       setRatings]       = useState({});
  const [comments,      setComments]      = useState({});
  const [submitted,     setSubmitted]     = useState({});  // ids déjà envoyés
  const [loading,       setLoading]       = useState(false);

  // ── Init ──
  useEffect(() => {
    (async () => {
      if (!sessionId && route?.params?.sessionId) setSessionId(route.params.sessionId);
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
      }
    })();
  }, [route, sessionId, currentUserId]);

  // ── Titre session ──
  useEffect(() => {
    if (!sessionId) return;
    supabase.from('sessions').select('title').eq('id', sessionId).single()
      .then(({ data }) => { if (data?.title) setSessionTitle(data.title); });
  }, [sessionId]);

  // ── Participants ──
  useEffect(() => {
    const fetch = async () => {
      if (!sessionId || !currentUserId) return;
      const { data, error } = await supabase
        .from('session_participants')
        .select('user_id, users!session_participants_user_id_fkey(username, profile_photo)')
        .eq('session_id', sessionId)
        .neq('user_id', currentUserId);
      if (error) { Alert.alert('Erreur', 'Impossible de charger les participants'); return; }
      setParticipants(
        (data ?? []).map(p => ({
          id: p.user_id,
          username: p.users?.username ?? 'Utilisateur',
          photo: p.users?.profile_photo ?? null,
        }))
      );
    };
    fetch();
  }, [sessionId, currentUserId]);

  // ── Dérivé ──
  const ratedCount   = Object.keys(ratings).length;
  const totalCount   = participants.length;
  const allRated     = ratedCount === totalCount && totalCount > 0;
  const progressPct  = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0;

  const handleRate    = (id, val) => setRatings(r => ({ ...r, [id]: val }));
  const handleComment = (id, val) => setComments(c => ({ ...c, [id]: val }));

  // ── Submit ──
  const handleSubmit = async () => {
    setLoading(true);
    let ok = true;

    for (const ratedId of Object.keys(ratings)) {
      const { error } = await supabase.from('user_ratings').insert([{
        session_id: sessionId,
        rater_id:   currentUserId,
        rated_id:   ratedId,
        rating:     ratings[ratedId],
        comment:    comments[ratedId] ?? null,
      }]);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Attention', 'Tu as déjà laissé un avis pour cette session.');
        } else {
          ok = false;
        }
      } else {
        try {
          const { data: me } = await supabase.from('users').select('username').eq('id', currentUserId).single();
          await notifyReviewReceived({ recipientId: ratedId, reviewerName: me?.username ?? 'Un utilisateur', sessionId });
        } catch {}
      }
    }

    setLoading(false);
    if (ok) {
      Alert.alert('Merci !', 'Tes notes ont été envoyées.', [
        { text: 'OK', onPress: () => navigation?.navigate('MainTabs') },
      ]);
      if (onFinished) onFinished();
    }
  };

  // ── Render item ──
  const renderItem = ({ item }) => {
    const note     = ratings[item.id] ?? 0;
    const isRated  = note > 0;
    const label    = STAR_LABELS[note];

    return (
      <View style={[S.card, isRated && S.cardRated]}>
        {/* Header */}
        <View style={S.cardHeader}>
          <Avatar photo={item.photo} username={item.username} size={46} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={S.cardName}>{item.username}</Text>
            {isRated && label && (
              <Text style={[S.cardRatedLabel, { color: label.color }]}>{label.text}</Text>
            )}
            {!isRated && (
              <Text style={S.cardPending}>Touche une étoile</Text>
            )}
          </View>
          {isRated && (
            <View style={S.doneBadge}>
              <Ionicons name="checkmark" size={11} color="#16A34A" />
              <Text style={S.doneBadgeText}>Noté</Text>
            </View>
          )}
        </View>

        {/* Étoiles */}
        <StarRating rating={note} onChange={val => handleRate(item.id, val)} />

        {/* Commentaire — visible seulement si une étoile est sélectionnée */}
        {isRated && (
          <TextInput
            style={S.commentInput}
            placeholder="Commentaire (optionnel)…"
            placeholderTextColor="#C8C8D0"
            value={comments[item.id] ?? ''}
            onChangeText={val => handleComment(item.id, val)}
            multiline
            maxLength={300}
          />
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={S.safe}>

      {/* ── HERO ── */}
      <View style={S.hero}>
        <LinearGradient
          colors={['#001242', '#0A1F6B', '#162260']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={[S.orb, { top: -20, right: -20, width: 100, height: 100, backgroundColor: 'rgba(254,93,2,0.18)' }]} />
        <View style={[S.orb, { bottom: -15, left: -15, width: 80, height: 80, backgroundColor: 'rgba(246,45,174,0.13)' }]} />

        <View style={[S.heroInner, { paddingTop: insets.top + 14 }]}>
          <Text style={S.heroLabel}>Session terminée</Text>
          <Text style={S.heroTitle}>Note tes coéquipiers</Text>
          {sessionTitle ? (
            <Text style={S.heroSub} numberOfLines={1}>{sessionTitle}</Text>
          ) : null}

          {/* Barre de progression */}
          {totalCount > 0 && (
            <View style={S.progressWrap}>
              <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <View style={S.progressMeta}>
                <Text style={S.progressText}>
                  {ratedCount} noté{ratedCount > 1 ? 's' : ''} sur {totalCount}
                </Text>
                <Text style={S.progressText}>
                  {totalCount - ratedCount} restant{totalCount - ratedCount > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── LISTE ── */}
      <FlatList
        data={participants}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={S.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={S.emptyIcon}>
              <Ionicons name="people-outline" size={30} color="#FE5D02" />
            </View>
            <Text style={S.emptyTitle}>Aucun coéquipier à noter</Text>
            <Text style={S.emptyDesc}>Tu étais seul sur cette session.</Text>
          </View>
        }
      />

      {/* ── STICKY BAR ── */}
      <View style={[S.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!allRated || loading}
          activeOpacity={0.88}
          style={[S.ctaBtn, (!allRated || loading) && S.ctaBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="star-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
                <Text style={S.ctaBtnText}>Envoyer les notes</Text>
              </>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F3F7' },

  // Hero
  hero: { overflow: 'hidden' },
  orb:  { position: 'absolute', borderRadius: 999 },
  heroInner: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 14,
  },

  // Progress
  progressWrap: { marginTop: 4 },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE5D02',
    borderRadius: 10,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },

  // Liste
  listContent: { padding: 14, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRated: {
    borderColor: 'rgba(34,197,94,0.25)',
    backgroundColor: '#FAFFFC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  cardRatedLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardPending: {
    fontSize: 12,
    color: '#C8C8D0',
    marginTop: 2,
    fontWeight: '500',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Étoiles
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  starBtn: { padding: 2 },
  star: { fontSize: 30 },
  starFilled: { color: '#FFD600' },
  starEmpty:  { color: '#E5E5E5' },

  // Commentaire
  commentInput: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },

  // Sticky bar
  stickyBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EBEBF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  ctaBtn: {
    height: 48,
    marginHorizontal: 10,
    backgroundColor: '#FE5D02',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: '#FDB490',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});