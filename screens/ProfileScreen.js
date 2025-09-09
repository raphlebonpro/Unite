import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  Image,
  View,
  StatusBar,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import GradientTitle from '../components/GradientTitle';
import GradientIcon from '../components/GradientIcon';
import { BADGES, BADGE_ICONS } from '../constants/badges';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const randomPastel = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;

const Chip = ({ label }) => (
  <View style={styles.chip}>
    <Feather name="activity" size={15} color="#43b97f" style={{ marginRight: 6 }} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

function getAgeFromBirthdate(birthdate) {
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// === BADGES LOGIC ===
function getUserBadges(stats) {
  return BADGES.filter(badge => badge.check(stats));
}

const BadgeCard = ({ badge }) => {
  const iconData = BADGE_ICONS[badge.code];

  return (
    <View style={styles.premiumBadgeCard}>
      <LinearGradient
        colors={["#f6fafd", "#e6edfa"]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.premiumBadgeCircle}
      >
        {iconData ? (
          <FontAwesome5
            name={iconData.icon}
            size={26}
            color={iconData.color}
            solid
          />
        ) : (
          <Text style={styles.premiumBadgeEmoji}>{badge.emoji}</Text>
        )}
      </LinearGradient>
      <Text style={styles.premiumBadgeLabel} numberOfLines={2}>
        {badge.label}
      </Text>
    </View>
  );
};
// === FIN BADGES LOGIC ===

const StarDisplay = ({ value = 0, size = 22 }) => {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 1 }}>
      {[0,1,2,3,4].map(i => {
        const diff = value - i;
        if (diff >= 1) {
          return (
            <FontAwesome
              key={i}
              name="star"
              size={size}
              color="#FFD700"
              style={{ marginRight: 2 }}
            />
          );
        }
        if (diff >= 0.5) {
          return (
            <FontAwesome
              key={i}
              name="star-half-full"
              size={size}
              color="#FFD700"
              style={{ marginRight: 2 }}
            />
          );
        }
        return (
          <FontAwesome
            key={i}
            name="star-o"
            size={size}
            color="#C7C7C7"
            style={{ marginRight: 2 }}
          />
        );
      })}
    </View>
  );
};

const TouchableItem = ({ onPress, children, style }) => {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ borderless: true }}
        style={style}
        hitSlop={6}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={style}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      {children}
    </TouchableOpacity>
  );
};

const AppBar = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const BASE_H = 48;

  return (
    <View
      style={{
        minHeight: BASE_H + insets.top,
        paddingTop: insets.top,
        backgroundColor: '#fff',
        borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
        borderBottomColor: '#EEE',
        justifyContent: 'center',
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
        shadowRadius: Platform.OS === 'ios' ? 5 : 0,
        shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
        elevation: Platform.OS === 'android' ? 3 : 0,
      }}
    >
      {/* Ligne gauche/droite (identique à MiniAppBar) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: BASE_H,
        }}
      >
        {/* 🔍 Recherche (gauche) */}
        <TouchableItem
          onPress={() => navigation.navigate('SearchFriends')}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}
        >
          <GradientIcon name="search" size={20} />
        </TouchableItem>

        {/* ⚙️ Réglages (droite) */}
        <TouchableItem
          onPress={() => navigation.navigate('Settings')}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <GradientIcon name="settings" size={20} />
        </TouchableItem>
      </View>

      {/* Titre centré en absolute (comme MiniAppBar) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: insets.top,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <GradientTitle
          style={{
            fontWeight: 'bold',
            fontSize: 18,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          Mon Profil
        </GradientTitle>
      </View>
    </View>
  );
};

const Badge = ({ icon, value }) => (
  <View style={styles.badge}>
    <Feather name={icon} size={14} color="#ff9100" style={{ marginRight: 6 }} />
    <Text style={styles.badgeText}>{value}</Text>
  </View>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  // Compteurs amis
const [currentUserId, setCurrentUserId] = useState(null);
const [friendsCount, setFriendsCount] = useState(0);

  // Compteurs sessions
  const [createdCount, setCreatedCount] = useState(0);
  const [joinedCount, setJoinedCount] = useState(0);

  // Avis / Rating
  const [avgRating, setAvgRating] = useState(0);
  const [nbRatings, setNbRatings] = useState(0);

  // 1) User par UUID (jamais par pseudo)
  const fetchUserData = async () => {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) return;

    const userId = auth.user.id; // UUID stable
    setCurrentUserId(userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) setUser(data);
  };

  // 2) Compteurs (UUID only) – exclut les sessions que tu as créées
  const fetchSessionCounters = async (userId) => {
    if (!userId) return;

    // Sessions créées → IDs pour exclusion
    const { data: createdRows, error: createdErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('creator_id', userId);

    const createdIds = new Set((createdRows ?? []).map(r => r.id));
    setCreatedCount(createdErr ? 0 : (createdRows?.length ?? 0));

    // Participations du user (par UUID)
    const { data: joinedRows, error: joinedErr } = await supabase
      .from('session_participants')   // nom de table qui fonctionnait chez toi
      .select('session_id')
      .eq('user_id', userId);

    if (joinedErr || !joinedRows || joinedRows.length === 0) {
      setJoinedCount(0);
      return;
    }

    // Déduplication + exclusion des sessions créées par l'user
    const uniqueJoined = new Set(joinedRows.map(r => r.session_id));
    let count = 0;
    for (const sid of uniqueJoined) {
      if (!createdIds.has(sid)) count++;
    }
    setJoinedCount(count);
  };

  // 3) Rating (inchangé)
  const fetchUserRating = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('user_ratings')
      .select('rating')
      .eq('rated_id', userId);

    if (!error && data?.length) {
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      setAvgRating(sum / data.length);
      setNbRatings(data.length);
    } else {
      setAvgRating(0);
      setNbRatings(0);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchSessionCounters(user.id); // passe l’UUID
        fetchUserRating(user.id);
      }
    }, [user])
  );

  useFocusEffect(
  React.useCallback(() => {
    const fetchFriendsCounters = async () => {
      if (!user?.id) return;

      // Followers = ceux qui me suivent
      const { count: followers } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // Following = ceux que je suis
      const { count: following } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    };

    fetchFriendsCounters();
  }, [user])
);

  let sports = [];
  if (Array.isArray(user?.favorite_sports)) {
    sports = user.favorite_sports;
  } else if (typeof user?.favorite_sports === 'string') {
    sports = user.favorite_sports.split(',').map(s => s.trim());
  }

  // Compte les amis mutuels (RPC si dispo, sinon fallback)
const fetchFriendsCount = useCallback(async () => {
  if (!currentUserId) return;

  // 1) RPC (recommandé)
  const rpc = await supabase.rpc('user_friends_count', { p_user: currentUserId });
  if (!rpc.error && typeof rpc.data === 'number') {
    setFriendsCount(rpc.data);
    return;
  }

  // 2) Fallback sans RPC : intersection des deux sens
  const { data: out } = await supabase
    .from('friends')
    .select('following_id')
    .eq('follower_id', currentUserId);

  const { data: inc } = await supabase
    .from('friends')
    .select('follower_id')
    .eq('following_id', currentUserId);

  const outSet = new Set((out || []).map(r => r.following_id));
  const incSet = new Set((inc || []).map(r => r.follower_id));
  let mutual = 0;
  outSet.forEach(id => { if (incSet.has(id)) mutual++; });
  setFriendsCount(mutual);
}, [currentUserId]);

// 🔄 Rafraîchit la liste d’amis (compteur + état)
const refreshFriendState = useCallback(async () => {
  if (!currentUserId) return;

  // RPC (si dispo)
  const rpc = await supabase.rpc('user_friends_count', { p_user: currentUserId });
  if (!rpc.error && typeof rpc.data === 'number') {
    setFriendsCount(rpc.data);
    return;
  }

  // Fallback sans RPC : intersection manuelle
  const { data: out } = await supabase
    .from('friends')
    .select('following_id')
    .eq('follower_id', currentUserId);

  const { data: inc } = await supabase
    .from('friends')
    .select('follower_id')
    .eq('following_id', currentUserId);

  const outSet = new Set((out || []).map(r => r.following_id));
  const incSet = new Set((inc || []).map(r => r.follower_id));

  let mutual = 0;
  outSet.forEach(id => {
    if (incSet.has(id)) mutual++;
  });

  setFriendsCount(mutual);
}, [currentUserId]);

useEffect(() => {
  if (!currentUserId) return;
  const ch = supabase
    .channel(`friends_me_${currentUserId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friends', filter: `follower_id=eq.${currentUserId}` },
      refreshFriendState
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friends', filter: `following_id=eq.${currentUserId}` },
      refreshFriendState
    )
    .subscribe();

  return () => supabase.removeChannel(ch);
}, [currentUserId, refreshFriendState]);

// charge une fois au montage
useEffect(() => {
  fetchFriendsCount();
}, [fetchFriendsCount]);

// realtime : MAJ compteur + état dès qu’une relation change
useEffect(() => {
  if (!currentUserId) return;
  const ch = supabase
    .channel(`friends_me_${currentUserId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'friends' },
      () => {
        refreshFriendState(); // 🔄 met à jour compteur & état
      }
    )
    .subscribe();

  return () => supabase.removeChannel(ch);
}, [currentUserId, refreshFriendState]);

  // ======= BADGES À AFFICHER =======
  const stats = { createdCount, joinedCount };
  const unlockedBadges = getUserBadges(stats);

const openFriendsList = () => {
  if (!currentUserId) return;
  navigation.navigate('FriendsList', { userId: currentUserId });
};
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafbff' }}>
      <StatusBar barStyle="dark-content" />
      <AppBar />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {/* Avatar */}
          {user?.profile_photo ? (
            <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: randomPastel(), justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.avatarInitial}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}

          {/* Pseudo */}
          <Text style={styles.username}>{user?.username || 'Pseudo'}</Text>

          {/* Bloc étoiles + nombre d’avis => pressable si au moins 1 avis */}
          <TouchableOpacity
            style={{
              minHeight: 26,
              alignItems: 'center',
              marginTop: 6,
              marginBottom: 0,
              flexDirection: 'column'
            }}
            activeOpacity={nbRatings > 0 ? 0.65 : 1}
            onPress={() => {
              if (nbRatings > 0) navigation.navigate('UserReview', { userId: user?.id });
            }}
            disabled={nbRatings === 0}
          >
            <StarDisplay value={avgRating} size={22} />
            <Text
              style={{
                color: "#666",
                fontSize: 13,
                marginTop: 3,
                textDecorationLine: nbRatings > 0 ? 'underline' : 'none',
                opacity: nbRatings > 0 ? 1 : 0.6,
                letterSpacing: 0.2,
              }}
            >
              {nbRatings > 0 ? `${nbRatings} avis` : "Pas encore noté"}
            </Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ height: 10 }} />

{/* Compteur amis (mutuel) */}
<View style={styles.counterContainer}>
  <View style={styles.countersRow}>
    <TouchableOpacity
      style={styles.counterBox}
      activeOpacity={0.8}
      onPress={openFriendsList}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.counterNumber}>{friendsCount}</Text>
      <Text style={[styles.counterLabel, { textDecorationLine: 'underline' }]}>
        Coéquipiers
      </Text>
    </TouchableOpacity>
  </View>
</View>

          {/* Compteurs dans un container */}
          <View style={styles.counterContainer}>
            <View style={styles.countersRow}>
              <View style={styles.counterBox}>
                <Text style={styles.counterNumber}>{createdCount}</Text>
                <Text style={styles.counterLabel}>Créées</Text>
              </View>
              <View style={styles.counterBox}>
                <Text style={styles.counterNumber}>{joinedCount}</Text>
                <Text style={styles.counterLabel}>Rejointes</Text>
              </View>
            </View>
          </View>

          {/* =========== BADGES =========== */}
          <View style={styles.badgesListContainer}>
            {unlockedBadges.length === 0 ? (
              <Text style={{
                color: "#bbb",
                fontStyle: "italic",
                fontSize: 15,
                marginVertical: 9,
                textAlign: 'center',
                width: '100%',
              }}>
                Aucun badge débloqué pour l’instant
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexGrow: 1,
                  paddingLeft: 10,
                  paddingRight: 10,
                }}
              >
                {unlockedBadges.map(badge => (
                  <BadgeCard badge={badge} key={badge.code} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.badgesRow}>
            {user?.birthdate ? <Badge icon="calendar" value={`${getAgeFromBirthdate(user.birthdate)} ans`} /> : null}
            {user?.gender ? <Badge icon="user" value={user.gender} /> : null}
          </View>

          {/* Sports favoris */}
          {sports.length > 0 && (
            <View style={styles.sportsRow}>
              {sports.map((sport, idx) => (
                <Chip key={idx} label={sport} />
              ))}
            </View>
          )}

          {/* Bouton */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={17} color="#1976d2" />
            <Text style={styles.editBtnText}>Modifier Profil</Text>
          </TouchableOpacity>

          {/* Description (en bas de la card) */}
          {user?.bio ? (
            <View style={styles.descBox}>
              <MaterialCommunityIcons name="format-quote-close" size={22} color="#e56a54" style={{ marginRight: 5 }} />
              <Text style={styles.descText}>{user.bio}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: hp('4.3%'),
    paddingBottom: hp('7%'),
  },
  profileCard: {
    width: wp('94%'),
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('7%'),
    paddingVertical: hp('4%'),
    paddingHorizontal: wp('4%'),
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: hp('0.7%') },
    shadowOpacity: 0.08,
    shadowRadius: wp('4%'),
    elevation: 4,
    marginTop: hp('1.3%'),
  },
  avatar: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    marginBottom: hp('1.3%'),
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowRadius: wp('2%'),
    elevation: 2,
  },
  avatarInitial: {
    fontSize: wp('10%'),
    color: '#43b97f',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: wp('25%'),
  },
  username: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#222',
    marginTop: hp('0.5%'),
    marginBottom: hp('1%'),
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  counterContainer: {
    backgroundColor: '#f3f7fe',
    borderRadius: wp('4.2%'),
    paddingVertical: hp('1.1%'),
    paddingHorizontal: wp('8.5%'),
    marginBottom: hp('1%'),
    marginTop: 0,
    shadowColor: '#1877f2',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowRadius: wp('2.2%'),
    elevation: 2,
    alignSelf: 'center',
    minWidth: wp('38%'),
    maxWidth: wp('56%'),
    borderWidth: 1.3,
    borderColor: '#c6d8f7',
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('7%'),
  },
  counterBox: {
    alignItems: 'center',
    marginHorizontal: wp('2.1%'),
  },
  counterNumber: {
    fontSize: wp('5.4%'),
    fontWeight: 'bold',
    color: '#1877F2',
    textAlign: 'center',
    lineHeight: hp('3%'),
  },
  counterLabel: {
    fontSize: wp('3.2%'),
    color: '#666',
    marginTop: 1,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2.3%'),
    marginBottom: hp('1.7%'),
    marginTop: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4e5',
    borderRadius: wp('4%'),
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('3.5%'),
    marginHorizontal: wp('1%'),
    borderWidth: 1,
    borderColor: '#ffcfa3',
  },
  badgeText: {
    color: '#ff9100',
    fontWeight: '600',
    fontSize: wp('4.2%'),
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: hp('1.2%'),
    marginBottom: hp('1.7%'),
    gap: wp('1.8%'),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafbf4',
    borderRadius: wp('5%'),
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('4%'),
    marginHorizontal: wp('1%'),
    marginBottom: hp('0.7%'),
    borderWidth: 1.1,
    borderColor: '#baf0d0',
    shadowColor: '#1976d2',
    shadowOpacity: 0.08,
    shadowRadius: wp('2.1%'),
    elevation: 1,
  },
  chipText: {
    color: '#2a8860',
    fontWeight: '600',
    fontSize: wp('4%'),
    letterSpacing: 0.1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1.7%'),
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('7.3%'),
    borderRadius: wp('7%'),
    backgroundColor: '#f3f9ff',
    borderColor: '#1976d2',
    borderWidth: 1,
    alignSelf: 'center',
    elevation: 1,
  },
  editBtnText: {
    marginLeft: wp('2.1%'),
    color: '#1976d2',
    fontWeight: '700',
    fontSize: wp('4.3%'),
  },
  descBox: {
    marginTop: hp('2.7%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff6f3',
    borderRadius: wp('4.5%'),
    paddingVertical: hp('1.7%'),
    paddingHorizontal: wp('4.1%'),
    borderWidth: 1,
    borderColor: '#ffe3da',
    shadowColor: '#f79489',
    shadowOpacity: 0.06,
    shadowRadius: wp('1.8%'),
    elevation: 1,
    maxWidth: '95%',
  },
  descText: {
    color: '#e56a54',
    fontSize: wp('4.2%'),
    fontStyle: 'italic',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: hp('2.6%'),
  },
  appBar: {
    height: hp('6.2%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#2223',
    shadowOffset: { width: 0, height: hp('0.3%') },
    shadowOpacity: 0.07,
    shadowRadius: hp('0.7%'),
    zIndex: 10,
    justifyContent: 'center',
    paddingHorizontal: wp('2.1%'),
    borderBottomColor: '#f2f2f3',
    borderBottomWidth: 1,
  },
  premiumBadgeCard: {
    alignItems: 'center',
    marginHorizontal: wp('2.3%'),
    width: wp('23.5%'),
    flexShrink: 0,
  },
  premiumBadgeCircle: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffef',
    shadowColor: '#1276f1',
    shadowOpacity: 0.11,
    shadowRadius: wp('2.3%'),
    elevation: 6,
    borderWidth: 1.3,
    borderColor: '#e0e7ef',
  },
  premiumBadgeEmoji: {
    fontSize: wp('7.3%'),
  },
  premiumBadgeLabel: {
    marginTop: hp('0.9%'),
    fontSize: wp('3.2%'),
    color: '#232e3b',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: hp('2%'),
    maxWidth: wp('24%'),
  },
  badgesListContainer: {
    marginTop: hp('2%'),
    marginBottom: hp('1.7%'),
    minHeight: hp('12%'),
    width: '100%',
    alignItems: 'center',
  },
  friendsRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: wp('12%'),
  marginTop: hp('0.8%'),
  marginBottom: hp('1.2%'),
},
friendBox: {
  alignItems: 'center',
},
friendNumber: {
  fontSize: wp('5.5%'),
  fontWeight: 'bold',
  color: '#1877F2',
  textAlign: 'center',
},
friendLabel: {
  fontSize: wp('3.4%'),
  color: '#555',
  fontWeight: '500',
  marginTop: hp('0.2%'),
},
});

export default ProfileScreen;
