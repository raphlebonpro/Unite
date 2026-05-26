import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const LETTER_COLORS = [
  ['#4A90E2','#5AA0FF'], ['#F62DAE','#FF6BD6'], ['#22C55E','#4ADE80'],
  ['#FE5D02','#FF8438'], ['#8B5CF6','#A78BFA'], ['#F5A623','#FFBF5E'],
  ['#E9436D','#FF7096'], ['#00BCD4','#4DD8ED'],
];
const getAvatarColors = (name = '') => {
  const i = ((name?.charCodeAt(0) || 65) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[Math.max(0, i)];
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── SOUS-COMPOSANTS ──────────────────────────────────────────────────────────

const Avatar = ({ photo, username, size = 38 }) => {
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

const StarDisplay = ({ value = 0, size = 15 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => {
      const diff = value - (i - 1);
      const name = diff >= 1 ? 'star' : diff >= 0.5 ? 'star-half' : 'star-outline';
      return (
        <Ionicons
          key={i}
          name={name}
          size={size}
          color={diff > 0 ? '#FFD600' : '#E5E5E5'}
        />
      );
    })}
  </View>
);

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function UserReviewsScreen({ route }) {
  const navigation = useNavigation();
  const userId     = route?.params?.userId ?? null;

  if (!userId) {
    console.warn('⚠️ Aucun userId reçu dans UserReviewScreen');
    return null;
  }

  const cleanedUserId = userId.trim();

  const [reviews,       setReviews]       = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ── Fetch current user ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  // ── Fetch reviews ──
  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_ratings')
      .select(`
        id, rating, comment, rater_id, created_at,
        users:users!user_ratings_rater_id_fkey(username, profile_photo)
      `)
      .eq('rated_id', cleanedUserId)
      .order('created_at', { ascending: false });

    if (error) { console.error('❌ Erreur fetch avis :', error); return; }
    setReviews(data ?? []);
  }, [cleanedUserId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useFocusEffect(useCallback(() => { fetchReviews(); }, [fetchReviews]));

  // ── Stats dérivées ──
  const average   = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : null;
  const fiveStars = reviews.filter(r => r.rating === 5).length;

  // ── Supprimer ──
  const handleDelete = (id) =>
    Alert.alert("Supprimer l'avis", "Es-tu sûr ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('user_ratings').delete().eq('id', id);
          if (!error) setReviews(prev => prev.filter(r => r.id !== id));
          else Alert.alert('Erreur', "Impossible de supprimer l'avis.");
        },
      },
    ]);

  // ── Render item ──
  const renderItem = ({ item }) => {
    const isOwn = item.rater_id === currentUserId;

    return (
      <View style={S.card}>
        {/* Header : avatar + nom/date + étoiles */}
        <View style={S.cardHeader}>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { userId: item.rater_id })}
            activeOpacity={0.8}
          >
            <Avatar photo={item.users?.profile_photo} username={item.users?.username} size={40} />
          </TouchableOpacity>

          <View style={S.cardMeta}>
            <TouchableOpacity
              onPress={() => navigation.navigate('UserProfile', { userId: item.rater_id })}
              activeOpacity={0.8}
            >
              <Text style={S.cardName}>{item.users?.username ?? 'Utilisateur'}</Text>
            </TouchableOpacity>
            <Text style={S.cardDate}>{formatDate(item.created_at)}</Text>
          </View>

          <StarDisplay value={item.rating} size={15} />
        </View>

        {/* Commentaire */}
        {item.comment ? (
          <View style={S.commentBox}>
            <Text style={S.commentText}>{item.comment}</Text>
          </View>
        ) : null}

        {/* Actions (auteur uniquement) */}
        {isOwn && (
          <View style={S.actions}>
            <TouchableOpacity
              style={[S.actionBtn, S.actionEdit]}
              onPress={() => navigation.navigate('EditReviewScreen', { reviewId: item.id })}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={13} color="#3888FF" />
              <Text style={[S.actionText, { color: '#3888FF' }]}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.actionBtn, S.actionDelete]}
              onPress={() => handleDelete(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={13} color="#EB1E1E" />
              <Text style={[S.actionText, { color: '#EB1E1E' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={S.safe}>

      {/* ── STATS HEADER ── */}
      {reviews.length > 0 && (
        <View style={S.statsHeader}>
          <View style={S.statsRow}>

            {/* Note moyenne */}
            <View style={[S.statChip, { flex: 1.3 }]}>
              <Text style={[S.statValue, { color: '#FE5D02' }]}>{average}</Text>
              <StarDisplay value={parseFloat(average)} size={14} />
              <Text style={S.statLabel}>Note moyenne</Text>
            </View>

            {/* Nb avis */}
            <View style={S.statChip}>
              <Text style={S.statValue}>{reviews.length}</Text>
              <Text style={S.statLabel}>Avis reçus</Text>
            </View>

            {/* 5 étoiles */}
            <View style={S.statChip}>
              <Text style={[S.statValue, { color: '#FFD600' }]}>★ {fiveStars}</Text>
              <Text style={S.statLabel}>5 étoiles</Text>
            </View>

          </View>
        </View>
      )}

      {/* ── LISTE ── */}
      <FlatList
        data={reviews}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[S.listContent, reviews.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={S.emptyIcon}>
              <Ionicons name="star-outline" size={30} color="#FE5D02" />
            </View>
            <Text style={S.emptyTitle}>Aucun avis pour le moment</Text>
            <Text style={S.emptyDesc}>
              Les avis apparaissent après chaque session partagée.
            </Text>
          </View>
        }
      />

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F3F7' },

  // Stats header
  statsHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBF0',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBF0',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 2,
  },

  // Liste
  listContent: { padding: 14, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 0,
  },
  cardMeta: { flex: 1 },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  cardDate: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
    fontWeight: '500',
  },

  // Commentaire
  commentBox: {
    marginTop: 10,
    backgroundColor: '#F7F7F8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EBEBF0',
  },
  commentText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F5',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionEdit:   { backgroundColor: 'rgba(56,136,255,0.08)' },
  actionDelete: { backgroundColor: 'rgba(235,30,30,0.07)' },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 19,
  },
});
