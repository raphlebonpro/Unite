import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { FontAwesome } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const StarDisplay = ({ value = 0, size = 20 }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <FontAwesome
        key={i}
        name={i <= value ? "star" : "star-o"}
        size={size}
        color={i <= value ? "#FFD700" : "#C7C7C7"}
        style={{ marginRight: 2 }}
      />
    ))}
  </View>
);

export default function UserReviewsScreen({ route }) {
  const { userId } = route.params;
  const [reviews, setReviews] = useState([]);

  // Clean userId for any accidental space or weird char
  const cleanedUserId = (userId || '').replace(/[^\w\-]/g, '').trim();

  useEffect(() => {
    const fetch = async () => {
      // Essaye avec jointure users
      let { data, error } = await supabase
        .from('user_ratings')
        .select(`
          rating,
          comment,
          rater_id,
          created_at,
          users:users!user_ratings_rater_id_fkey (
            username,
            profile_photo
          )
        `)
        .eq('rated_id', cleanedUserId)
        .order('created_at', { ascending: false });

      // Si ça ne remonte rien, refais un SELECT basique
      if ((!data || data.length === 0) && !error) {
        const res = await supabase
          .from('user_ratings')
          .select('rating, comment, rater_id, created_at')
          .eq('rated_id', cleanedUserId)
          .order('created_at', { ascending: false });
        if (res.data) data = res.data;
      }

      console.log('Avis reçus pour', cleanedUserId, ':', data, error);
      setReviews(data || []);
    };
    fetch();
  }, [cleanedUserId]);

  // Calcul de la moyenne des notes reçues
  const average =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <View style={styles.container}>
      {average && (
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <StarDisplay value={Math.round(average)} size={24} />
          <Text style={{ color: "#222", marginTop: 3 }}>
            {average} / 5 ({reviews.length} avis)
          </Text>
        </View>
      )}
      <FlatList
        data={reviews}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Image
                source={
                  item.users?.profile_photo
                    ? { uri: item.users.profile_photo }
                    : require('../assets/avatar-default.png')
                }
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.users?.username || "Utilisateur"}</Text>
              <StarDisplay value={item.rating} size={18} />
            </View>
            {item.comment ? (
              <Text style={styles.comment}>{item.comment}</Text>
            ) : null}
            <Text style={styles.date}>
              {item.created_at && new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#999", alignSelf: "center", marginTop: 80 }}>
            Aucun avis pour le moment.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafbff", paddingTop: hp('2.6%') },
  title: {
    fontWeight: 'bold',
    fontSize: wp('5.2%'),
    alignSelf: 'center',
    marginBottom: hp('2%')
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: wp('3.7%'),
    marginHorizontal: wp('4%'),
    marginVertical: hp('1.1%'),
    padding: wp('4%'),
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: wp('1.9%'),
    shadowOffset: { width: 0, height: hp('0.4%') },
    elevation: 2,
  },
  avatar: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    marginRight: wp('2.5%'),
    backgroundColor: "#E5E8EF"
  },
  username: {
    fontWeight: '600',
    fontSize: wp('4.3%'),
    marginRight: wp('2.5%'),
    color: "#222"
  },
  comment: {
    color: "#555",
    fontSize: wp('4%'),
    marginTop: hp('0.4%'),
    marginBottom: hp('0.4%')
  },
  date: {
    color: "#bbb",
    fontSize: wp('3.3%'),
    marginTop: hp('0.6%'),
    alignSelf: "flex-end"
  }
});