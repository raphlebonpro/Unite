import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STAR_LABELS = {
  1: { text: 'Pas terrible',     color: '#E53935' },
  2: { text: 'Peut mieux faire', color: '#FFA726' },
  3: { text: 'Bien',             color: '#FFA726' },
  4: { text: 'Très bien',        color: '#2ECC71' },
  5: { text: 'Excellent !',      color: '#FE5D02' },
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────

const SessionFeedbackScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();

  const [rating,              setRating]              = useState(0);
  const [comment,             setComment]             = useState('');
  const [loading,             setLoading]             = useState(false);
  const [alreadyRated,        setAlreadyRated]        = useState(false);
  const [hasRatedParticipants,setHasRatedParticipants]= useState(false);
  const [sessionTitle,        setSessionTitle]        = useState('');

  // ── Checks ──
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [feedbackRes, ratingsRes, sessionRes] = await Promise.all([
          supabase.from('session_feedback').select('id').eq('session_id', sessionId).eq('user_id', user.id).maybeSingle(),
          supabase.from('user_ratings').select('id').eq('session_id', sessionId).eq('rater_id', user.id),
          supabase.from('sessions').select('title').eq('id', sessionId).single(),
        ]);

        if (feedbackRes.data) setAlreadyRated(true);
        if (ratingsRes.data?.length > 0) setHasRatedParticipants(true);
        if (sessionRes.data?.title) setSessionTitle(sessionRes.data.title);
      } catch (e) {
        console.warn('Erreur init feedback:', e);
      }
    };
    init();
  }, [sessionId]);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Note requise', 'Merci de donner une note à la session.');
      return;
    }
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase.from('session_feedback').insert({
        session_id: sessionId,
        user_id:    user.id,
        rating,
        comment:    comment.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Déjà notée', 'Tu as déjà donné ton avis sur cette session.');
          setAlreadyRated(true);
          return;
        }
        throw error;
      }

      navigation.navigate('RateSession', { sessionId });
    } catch (err) {
      console.error('❌ Erreur SessionFeedback:', err);
      Alert.alert('Erreur', err.message || "Impossible d'enregistrer ton avis.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (alreadyRated && hasRatedParticipants) {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      navigation.navigate('RateSession', { sessionId });
    }
  };

  const label = STAR_LABELS[rating];

  // ─────────────────────────────────────────────────────────────────────────
  // STATE : déjà noté
  // ─────────────────────────────────────────────────────────────────────────
  if (alreadyRated) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={S.doneWrap}>
          <View style={S.doneIcon}>
            <Ionicons name="checkmark-circle" size={36} color="#FE5D02" />
          </View>
          <Text style={S.doneTitle}>Session déjà notée</Text>
          <Text style={S.doneSub}>
            {hasRatedParticipants
              ? "Tu as évalué la session et tes coéquipiers.\nMerci pour ton retour !"
              : "Tu peux maintenant évaluer tes coéquipiers."}
          </Text>
          <TouchableOpacity
            style={S.ctaBtn}
            onPress={handleContinue}
            activeOpacity={0.88}
          >
            <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
            <Text style={S.ctaBtnText}>
              {hasRatedParticipants ? 'Retour à l\'accueil' : 'Noter les coéquipiers'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATE : formulaire
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={S.safe}>
      <StatusBar barStyle="light-content" />

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
          <Text style={S.heroLabel}>Session terminée</Text>
          <Text style={S.heroTitle}>Comment s'est passée la session ?</Text>
          {sessionTitle ? (
            <Text style={S.heroSub} numberOfLines={1}>{sessionTitle}</Text>
          ) : null}
        </View>
      </View>

      {/* ── SCROLL ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                placeholder="Bonne ambiance, terrain en bon état…"
                placeholderTextColor="#C8C8D0"
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
            <Text style={S.commentCount}>{comment.length} / 500</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── STICKY BAR ── */}
      <View style={[S.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!rating || loading}
          activeOpacity={0.88}
          style={[S.ctaBtn, (!rating || loading) && S.ctaBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
                <Text style={S.ctaBtnText}>Continuer — noter les coéquipiers</Text>
              </>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default SessionFeedbackScreen;

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
    letterSpacing: -0.3, lineHeight: 28, marginBottom: 5,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

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
    color: '#fff', fontSize: 14,
    fontWeight: '800', letterSpacing: 0.1,
  },

  // État déjà noté
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  doneIcon: {
    width: 70, height: 70, borderRadius: 22,
    backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 22, fontWeight: '800',
    color: '#1A1A2E', marginBottom: 10, textAlign: 'center',
  },
  doneSub: {
    fontSize: 14, color: '#888',
    textAlign: 'center', lineHeight: 21,
    marginBottom: 28,
  },
});
