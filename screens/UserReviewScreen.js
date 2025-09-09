import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const StarDisplay = ({ value = 0, size = 20 }) => (
  <View style={{ flexDirection: 'row' }}>
    {[0, 1, 2, 3, 4].map(i => {
      const diff = value - i;
      if (diff >= 1) return <FontAwesome key={i} name="star" size={size} color="#FFD700" />;
      if (diff >= 0.5) return <FontAwesome key={i} name="star-half-full" size={size} color="#FFD700" />;
      return <FontAwesome key={i} name="star-o" size={size} color="#C7C7C7" />;
    })}
  </View>
);

export default function UserReviewsScreen({ route }) {
  const navigation = useNavigation();
  const { userId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ⚠️ Ne pas nettoyer trop fort → sinon ton UUID est invalide
  const cleanedUserId = (userId || '').trim();

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    console.log("🔄 Chargement avis pour rated_id =", cleanedUserId);

    let { data, error } = await supabase
      .from('user_ratings')
      .select(`
        id,
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

    if (error) {
      console.error("❌ Erreur fetch avis :", error);
      return;
    }

    setReviews(data || []);
  }, [cleanedUserId]);

  // Charger l'utilisateur courant
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // Premier chargement
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Refresh auto quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [fetchReviews])
  );

  // Moyenne des notes
  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <View style={styles.container}>
      {average && (
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <StarDisplay value={parseFloat(average)} size={24} />
          <Text style={{ color: "#222", marginTop: 3 }}>
            {average} / 5 ({reviews.length} avis)
          </Text>
        </View>
      )}
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
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

            {/* Actions visibles uniquement pour l'auteur de l'avis */}
            {item.rater_id === currentUserId && (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {/* Modifier */}
                <TouchableOpacity
                  style={{ marginRight: 12 }}
                  onPress={() => {
                    navigation.navigate('EditReviewScreen', { reviewId: item.id });
                  }}
                >
                  <Feather name="edit" size={18} color="#1976d2" />
                </TouchableOpacity>

                {/* Supprimer */}
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Supprimer l'avis",
                      "Es-tu sûr de vouloir supprimer cet avis ?",
                      [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Supprimer",
                          style: "destructive",
                          onPress: async () => {
                            const { error } = await supabase
                              .from('user_ratings')
                              .delete()
                              .eq('id', item.id);

                            if (!error) {
                              setReviews(reviews.filter(r => r.id !== item.id));
                            } else {
                              Alert.alert("Erreur", "Impossible de supprimer l'avis.");
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Feather name="trash-2" size={18} color="#e53935" />
                </TouchableOpacity>
              </View>
            )}
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
