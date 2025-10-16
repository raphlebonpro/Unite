import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Image, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { FontAwesome } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { notifyReviewReceived } from '../helpers/notifications';

const StarRating = ({ rating, onChange }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1,2,3,4,5].map(i => (
      <TouchableOpacity
        key={i}
        activeOpacity={0.7}
        onPress={() => onChange(i)}
        style={{ marginHorizontal: 2 }}
      >
        <FontAwesome
          name={i <= rating ? "star" : "star-o"}
          size={28}
          color={i <= rating ? "#FFD700" : "#E6E6E6"}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default function RateSessionScreen({ sessionId: initialSessionId, currentUserId: initialCurrentUserId, navigation, onFinished, route }) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [participants, setParticipants] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);

  // Init params si route/props
  useEffect(() => {
    (async () => {
      if (!sessionId && route?.params?.sessionId) setSessionId(route.params.sessionId);
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
      }
    })();
  }, [route, sessionId, currentUserId]);

  // Fetch participants sauf soi-même
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!sessionId || !currentUserId) return;
      let { data, error } = await supabase
        .from('session_participants')
        .select('user_id, users!session_participants_user_id_fkey (username, profile_photo)')
        .eq('session_id', sessionId)
        .neq('user_id', currentUserId);
      if (error) {
        Alert.alert('Erreur', "Impossible de charger les participants");
        return;
      }
      setParticipants(
        (data || []).map(p => ({
          id: p.user_id,
          username: p.users?.username ?? 'Utilisateur inconnu',
          profile_photo: p.users?.profile_photo ?? null,
        }))
      );
    };
    fetchParticipants();
  }, [sessionId, currentUserId]);

  const handleRate = (userId, value) => setRatings({ ...ratings, [userId]: value });
  const handleComment = (userId, value) => setComments({ ...comments, [userId]: value });

const handleSubmit = async () => {
  setLoading(true);
  let ok = true;

  for (let ratedId of Object.keys(ratings)) {
    const value = ratings[ratedId];
    const comment = comments[ratedId] || null;

    const { error } = await supabase
      .from('user_ratings')
      .insert([{
        session_id: sessionId,
        rater_id: currentUserId,
        rated_id: ratedId,
        rating: value,
        comment
      }]);

    if (error) {
      if (error.code === '23505') {
        Alert.alert("Attention", "Tu as déjà laissé un avis pour cette session.");
      } else {
        ok = false;
      }
    } else {
      // ✅ Notif à l'utilisateur noté
      let reviewerName = "Un utilisateur";
      try {
        const { data: me } = await supabase
          .from('users')
          .select('username, pseudo')
          .eq('id', currentUserId)
          .single();
        reviewerName = me?.pseudo || me?.username || "Un utilisateur";
      } catch {}

      await notifyReviewReceived({
        recipientId: ratedId,
        reviewerName,
        sessionId
      });
    }
  }

  setLoading(false);

  if (ok) {
    Alert.alert("Merci !", "Notes envoyées.", [
      { text: "OK", onPress: () => navigation?.navigate('MainTabs') }
    ]);
    if (onFinished) onFinished();
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Note les autres participants</Text>
      <FlatList
        data={participants}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Image
                source={item.profile_photo ? { uri: item.profile_photo } : require('../assets/avatar-default.png')}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.username}</Text>
                <StarRating
                  rating={ratings[item.id] || 0}
                  onChange={v => handleRate(item.id, v)}
                />
                <TextInput
                  style={styles.commentInput}
                  placeholder="Ajouter un commentaire (facultatif)"
                  placeholderTextColor="#bbb"
                  value={comments[item.id] || ''}
                  onChangeText={t => handleComment(item.id, t)}
                  multiline
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ color: "#999", fontSize: 17 }}>Aucun autre participant à noter</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={handleSubmit}
        disabled={
          Object.keys(ratings).length !== participants.length ||
          participants.length === 0 || loading
        }
        activeOpacity={0.87}
      >
        <LinearGradient
          colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={[
            styles.buttonGradient,
            { opacity: Object.keys(ratings).length === participants.length && participants.length > 0 ? 1 : 0.45 }
          ]}
        >
          <Text style={styles.buttonText}>{loading ? "Envoi..." : "Envoyer"}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA", paddingTop: hp('2.5%') },
  title: {
    fontWeight: '700',
    fontSize: wp('5.7%'),
    marginBottom: hp('2%'),
    alignSelf: "center",
    color: "#222"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: wp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    marginVertical: hp('1%'),
    marginHorizontal: wp('1.5%'),
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#1E3246",
    shadowOpacity: 0.08,
    shadowRadius: wp('2.4%'),
    shadowOffset: { width: 0, height: hp('0.6%') },
    elevation: 2,
    justifyContent: "flex-start",
    minHeight: hp('12%'),
  },
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginRight: wp('4%'),
    backgroundColor: "#E5E8EF",
    marginTop: hp('0.4%')
  },
  name: {
    fontSize: wp('4.3%'),
    fontWeight: '600',
    color: "#222",
    marginBottom: hp('0.4%')
  },
  commentInput: {
    fontSize: wp('4%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2.4%'),
    backgroundColor: "#F4F4F7",
    borderRadius: wp('2.1%'),
    marginTop: hp('1%'),
    marginBottom: 0,
    color: "#222",
    minHeight: hp('4.5%')
  },
  buttonWrapper: {
    position: 'absolute',
    left: wp('7%'),
    right: wp('7%'),
    bottom: hp('4.2%'),
    borderRadius: wp('3.2%'),
    overflow: 'hidden',
    shadowColor: "#ff9966",
    shadowOpacity: 0.11,
    shadowRadius: wp('2.2%'),
    shadowOffset: { width: 0, height: hp('0.4%') }
  },
  buttonGradient: {
    borderRadius: wp('3.2%'),
    paddingVertical: hp('1.4%'),
    alignItems: 'center',
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: '700',
    fontSize: wp('4.1%'),
    letterSpacing: 0.5
  }
});
