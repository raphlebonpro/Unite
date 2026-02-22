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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SessionFeedbackScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [hasRatedParticipants, setHasRatedParticipants] = useState(false);

  // Vérifie si la session et les coéquipiers ont déjà été notés
  useEffect(() => {
    const checkExistingFeedback = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: feedback } = await supabase
          .from('session_feedback')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (feedback) setAlreadyRated(true);

        const { data: ratings } = await supabase
          .from('user_ratings')
          .select('id')
          .eq('session_id', sessionId)
          .eq('rater_id', user.id);

        if (ratings && ratings.length > 0) setHasRatedParticipants(true);
      } catch (e) {
        console.warn("Erreur vérification feedback:", e);
      }
    };
    checkExistingFeedback();
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert("Note requise", "Merci de donner une note à la session.");
      return;
    }

    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase.from('session_feedback').insert({
        session_id: sessionId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Déjà notée", "Tu as déjà donné ton avis sur cette session.");
          setAlreadyRated(true);
          return;
        } else {
          throw error;
        }
      }

      navigation.navigate('RateSession', { sessionId });

    } catch (err) {
      console.error('❌ Erreur SessionFeedback:', err);
      Alert.alert("Erreur", err.message || "Impossible d’enregistrer ton avis.");
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

  // ✅ Si la session est déjà notée
  if (alreadyRated) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.feedbackCard}>
          <Text style={styles.infoTitle}>Tu as déjà noté cette session 👏</Text>
          <Text style={styles.infoSubtitle}>
            {hasRatedParticipants
              ? "Merci d’avoir évalué la session et tes coéquipiers"
              : "Tu peux maintenant évaluer les participants."}
          </Text>

          <TouchableOpacity
            onPress={handleContinue}
            style={styles.continueWrapper}
            activeOpacity={0.9}
          >
            <View
              style={[styles.continueButton, {backgroundColor: '#FE5D02'}]}
            >
              <Text style={styles.continueText}>Continuer</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Si la session n’est pas encore notée
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <StatusBar barStyle="dark-content" />

          <Text style={styles.title}>Comment s’est passée la session ?</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i)}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name={i <= rating ? 'star' : 'star-o'}
                  size={wp('10%')}
                  color={i <= rating ? '#FFD700' : '#DDD'}
                  style={{ marginHorizontal: wp('1.5%') }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.commentBox}
            placeholder="Ajoute un commentaire (facultatif)"
            placeholderTextColor="#888"
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}
            style={{ marginTop: hp('5%') }}
          >
            <View
              style={[styles.submitBtn, {backgroundColor: '#FE5D02'}]}
            >
              <Text style={styles.submitText}>
                {loading ? 'Envoi...' : 'Continuer'}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SessionFeedbackScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: wp('8%'),
    paddingTop: hp('5%'),
    paddingBottom: hp('10%'),
    backgroundColor: '#fff',
  },
  title: {
    fontSize: wp('6.2%'),
    fontWeight: '700',
    color: '#222',
    marginBottom: hp('4%'),
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp('4%'),
  },
  commentBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: wp('4%'),
    fontSize: wp('4.2%'),
    color: '#333',
    height: hp('20%'),
    backgroundColor: '#fafafa',
  },
  submitBtn: {
    borderRadius: 20,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('18%'),
    alignSelf: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('4%'),
    textAlign: 'center',
  },

  // === ÉCRAN AVIS DÉJÀ DONNÉ ===
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
    backgroundColor: '#fff',
  },
  feedbackCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    paddingVertical: hp('6%'),
    paddingHorizontal: wp('8%'),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  infoTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: wp('4.2%'),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('4%'),
    lineHeight: 22,
  },
  continueWrapper: {
    alignSelf: 'center',
    width: '100%',
  },
  continueButton: {
    borderRadius: 30,
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('11%'),
    alignSelf: 'center',
  },
  continueText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
});
