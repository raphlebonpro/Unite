import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabaseClient';
import { notifyReviewUpdated } from '../helpers/notifications';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STAR_LABELS = {
  1: { text: 'Pas terrible',     color: '#E53935' },
  2: { text: 'Peut mieux faire', color: '#FFA726' },
  3: { text: 'Bien',             color: '#FFA726' },
  4: { text: 'Très bien',        color: '#2ECC71' },
  5: { text: 'Excellent !',      color: '#FE5D02' },
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function EditReviewScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { reviewId } = route.params;

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Charger l'avis existant ──
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('id, rating, comment')
        .eq('id', reviewId)
        .single();
      if (!error && data) {
        setRating(data.rating ?? 0);
        setComment(data.comment ?? '');
      }
    })();
  }, [reviewId]);

  // ── Enregistrer ──
  const handleUpdate = async () => {
    if (!rating) {
      Alert.alert('Note requise', 'Merci de sélectionner une note.');
      return;
    }
    setLoading(true);

    const { data: oldReview, error: fetchErr } = await supabase
      .from('user_ratings')
      .select('rated_id')
      .eq('id', reviewId)
      .single();

    if (fetchErr || !oldReview) {
      setLoading(false);
      return Alert.alert('Erreur', "Impossible de retrouver l'avis.");
    }

    const { error } = await supabase
      .from('user_ratings')
      .update({ rating, comment: comment.trim() || null })
      .eq('id', reviewId);

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', "Impossible de mettre à jour ton avis.");
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: me } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();
        await notifyReviewUpdated({
          recipientId:  oldReview.rated_id,
          reviewerName: me?.username ?? 'Un utilisateur',
        });
      } catch {}

      Alert.alert('Avis modifié', 'Ton avis a bien été enregistré.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const label = STAR_LABELS[rating];

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
        <View style={[S.orb, { bottom: -15, left: -15, width: 80, height: 80, backgroundColor: 'rgba(246,45,174,0.12)' }]} />

        <View style={[S.heroInner, { paddingTop: insets.top + 16 }]}>
          <Text style={S.heroLabel}>Modifier l'avis</Text>
          <Text style={S.heroTitle}>Mets à jour ta note</Text>
        </View>
      </View>

      {/* ── SCROLL ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Stars */}
          <Text style={S.sectionLabel}>Ta note</Text>
          <View style={S.starsCard}>
            <View style={S.starsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  activeOpacity={0.75}
                  style={S.starBtn}
                >
                  <Text style={[S.star, i <= rating ? S.starOn : S.starOff]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[S.starLabel, { color: label?.color ?? '#C8C8D0' }]}>
              {label?.text ?? 'Touche une étoile'}
            </Text>
          </View>

          {/* Commentaire */}
          <Text style={S.sectionLabel}>
            Commentaire{' '}
            <Text style={S.sectionOptional}>(optionnel)</Text>
          </Text>
          <View style={S.commentCard}>
            <View style={S.commentInner}>
              <View style={S.commentIcon}>
                <Ionicons name="pencil-outline" size={15} color="#FE5D02" />
              </View>
              <TextInput
                style={S.commentInput}
                placeholder="Ajoute un commentaire…"
                placeholderTextColor="#C8C8D0"
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
                maxLength={300}
              />
            </View>
            <Text style={S.commentCount}>{comment.length} / 300</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── STICKY BAR ── */}
      <View style={[S.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={!rating || loading}
          activeOpacity={0.88}
          style={[S.ctaBtn, (!rating || loading) && S.ctaBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                <Text style={S.ctaBtnText}>Enregistrer l'avis</Text>
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
  hero:      { overflow: 'hidden' },
  orb:       { position: 'absolute', borderRadius: 999 },
  heroInner: { paddingHorizontal: 18, paddingBottom: 22 },
  heroLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    letterSpacing: -0.3, lineHeight: 28,
  },

  // Scroll
  scrollContent: { padding: 18, paddingBottom: 30 },

  // Section label
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#ABABAB',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, marginTop: 4,
  },
  sectionOptional: {
    fontSize: 11, fontWeight: '400',
    color: '#C8C8D0', textTransform: 'none',
  },

  // Stars card
  starsCard: {
    backgroundColor: '#F7F7F8',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    alignItems: 'center',
    marginBottom: 20,
  },
  starsRow:  { flexDirection: 'row', gap: 8, marginBottom: 10 },
  starBtn:   { padding: 2 },
  star:      { fontSize: 42 },
  starOn:    { color: '#FFD600' },
  starOff:   { color: '#E5E5E5' },
  starLabel: { fontSize: 14, fontWeight: '700', minHeight: 20 },

  // Comment card
  commentCard: {
    backgroundColor: '#F7F7F8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  commentInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  commentIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  commentInput: {
    flex: 1, fontSize: 14, color: '#333',
    minHeight: 70, padding: 0,
  },
  commentCount: {
    fontSize: 11, color: '#C8C8D0',
    textAlign: 'right',
    paddingHorizontal: 14, paddingBottom: 10,
    fontWeight: '500',
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
    gap: 8,
  },
  ctaBtnDisabled: {
    backgroundColor: '#FDB490',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: {
    color: '#fff', fontSize: 15,
    fontWeight: '800', letterSpacing: 0.1,
  },
});
