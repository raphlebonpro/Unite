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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { notifyReviewUpdated } from '../helpers/notifications';

const StarRating = ({ rating, onChange }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: hp('1.5%') }}>
    {[1, 2, 3, 4, 5].map(i => (
      <TouchableOpacity key={i} onPress={() => onChange(i)} style={{ marginHorizontal: 4 }}>
        <FontAwesome
          name={i <= rating ? 'star' : 'star-o'}
          size={30}
          color={i <= rating ? '#FFD700' : '#D3D3D3'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default function EditReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { reviewId } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger l’avis existant
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('id, rating, comment')
        .eq('id', reviewId)
        .single();

      if (!error && data) {
        setRating(data.rating);
        setComment(data.comment || '');
      }
    })();
  }, [reviewId]);

  const handleUpdate = async () => {
    if (!rating) {
      Alert.alert('Erreur', 'Merci de sélectionner une note.');
      return;
    }
    setLoading(true);

    // Récupérer l'avis avant modification pour connaître le destinataire
    const { data: oldReview, error: fetchErr } = await supabase
      .from('user_ratings')
      .select('rated_id')
      .eq('id', reviewId)
      .single();

    if (fetchErr || !oldReview) {
      setLoading(false);
      return Alert.alert("Erreur", "Impossible de retrouver l'avis.");
    }

    const { error } = await supabase
      .from('user_ratings')
      .update({ rating, comment })
      .eq('id', reviewId);

    setLoading(false);

    if (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de mettre à jour ton avis.");
    } else {
      try {
        // Récupère le nom de l’auteur de l’avis
        const { data: me } = await supabase
          .from('users')
          .select('username, pseudo')
          .eq('id', (await supabase.auth.getUser()).data.user.id)
          .single();

        const reviewerName = me?.pseudo || me?.username || "Un utilisateur";

        // ✅ Notifie l’utilisateur noté (avis modifié)
        await notifyReviewUpdated({
          recipientId: oldReview.rated_id,
          reviewerName,
        });
      } catch (e) {
        console.error("Erreur notif update review:", e);
      }

      Alert.alert('Succès', 'Ton avis a bien été modifié.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fafbff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Modifier ton avis</Text>

        <StarRating rating={rating} onChange={setRating} />

        <TextInput
          style={styles.input}
          placeholder="Ajoute un commentaire (optionnel)"
          placeholderTextColor="#aaa"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={300}
        />

        <TouchableOpacity activeOpacity={0.87} onPress={handleUpdate} disabled={loading}>
          <LinearGradient
            colors={['#ff9966', '#ff5e62']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Enregistrer'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp('7%'),
    paddingTop: hp('8%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp('3%'),
    color: '#222',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    fontSize: wp('4%'),
    color: '#222',
    minHeight: hp('12%'),
    marginBottom: hp('4%'),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    shadowColor: '#ff5e62',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
