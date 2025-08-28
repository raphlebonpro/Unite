import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Text,
  Image,
  View,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import GradientTitle from '../components/GradientTitle';
import { ReportUserButton } from '../components/ReportUserButton';
import { BADGES, BADGE_ICONS } from '../constants/badges';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { notifyUser } from '../helpers/notifications';

const randomPastel = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;

const Chip = ({ label }) => (
  <View style={styles.chip}>
    <Feather name="activity" size={15} color="#43b97f" style={{ marginRight: 6 }} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const IconBadgeCard = ({ badge }) => {
  const meta = BADGE_ICONS[badge.code] || {};
  const name = meta.icon; // ex: 'trophy', 'handshake', 'award'…
  const color = meta.color || '#ff9100';
  const size = wp('8%');

  const renderIcon = () => {
    if (!name) return null;

    // Choix rapide de la lib en fonction du nom
    if (
      [
        'trophy',
        'medal',
        'handshake',
        'user-friends',
        'running',
        'birthday-cake',
        'shield-alt',
        'users',
      ].includes(name)
    ) {
      return <FontAwesome5 name={name} size={size} color={color} />;
    }
    if (['award'].includes(name)) {
      return <Feather name={name} size={size} color={color} />;
    }
    // par défaut
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  };

  return (
    <View style={styles.proBadgeContainer}>
      <View style={styles.proBadgeCircle}>{renderIcon()}</View>
      <Text style={styles.proBadgeLabel} numberOfLines={2}>
        {badge.label}
      </Text>
    </View>
  );
};

const Badge = ({ icon, value }) => (
  <View style={styles.badge}>
    <Feather name={icon} size={14} color="#ff9100" style={{ marginRight: 6 }} />
    <Text style={styles.badgeText}>{value}</Text>
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

const StarDisplay = ({ value = 0, size = 22 }) => {
  // value peut être 0 → 5 (exemple : 3.7)
  return (
    <View style={{ flexDirection: 'row', marginBottom: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const diff = value - i;
        if (diff >= 1) {
          // Pleine
          return (
            <FontAwesome key={i} name="star" size={size} color="#FFD700" style={{ marginRight: 2 }} />
          );
        }
        if (diff >= 0.5) {
          // Demi
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
        // Vide
        return (
          <FontAwesome key={i} name="star-o" size={size} color="#C7C7C7" style={{ marginRight: 2 }} />
        );
      })}
    </View>
  );
};

function getUnlockedBadges(stats) {
  return BADGES.filter((badge) => badge.check(stats));
}

const UserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [user, setUser] = useState(null);

  // Compteurs sessions créées / rejointes
  const [createdCount, setCreatedCount] = useState(0);
  const [joinedCount, setJoinedCount] = useState(0);

  // Avis
  const [avgRating, setAvgRating] = useState(0);
  const [nbRatings, setNbRatings] = useState(0);

  // Id utilisateur courant
  const [currentUserId, setCurrentUserId] = useState(null);

  // Amis
  const [friendsCount, setFriendsCount] = useState(0);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState(null);

  // Demande reçue depuis CE profil (sender = userId, receiver = moi)
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [loadingFR, setLoadingFR] = useState(false);

  // ─────────────────────────────────────────────────────
  // HOOKS (toujours avant tout return conditionnel)
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      setCurrentUserId(current?.id || null);
    })();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error) setUser(data);
    };
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    const fetchSessionCounters = async () => {
      if (!userId) return;
      // Sessions créées
      const { count: created } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);
      // Sessions rejointes
      const { count: joined } = await supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      setCreatedCount(created || 0);
      setJoinedCount(joined || 0);
    };
    fetchSessionCounters();
  }, [userId]);

  useEffect(() => {
    async function fetchAvgRating() {
      if (!userId) return;
      const { data, error } = await supabase.from('user_ratings').select('rating').eq('rated_id', userId);

      if (!error && data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAvgRating(sum / data.length);
        setNbRatings(data.length);
      } else {
        setAvgRating(0);
        setNbRatings(0);
      }
    }
    fetchAvgRating();
  }, [userId]);

  // Vérifie relation & demandes (amis)
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!userId || !currentUserId || userId === currentUserId) return;

      // Amis mutuels (A->B et B->A)
      const { data: relAB } = await supabase
        .from('friends')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .maybeSingle();

      const { data: relBA } = await supabase
        .from('friends')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', currentUserId)
        .maybeSingle();

      if (relAB && relBA) {
        setIsFriend(true);
        setFriendRequestStatus('accepted');
        return;
      }

      // Demande envoyée par moi vers ce profil ?
      const { data: request } = await supabase
        .from('friend_requests')
        .select('status')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', userId)
        .maybeSingle();

      if (request) {
        setFriendRequestStatus(request.status); // 'pending' | 'accepted' | 'rejected'
      }
    };

    fetchFriendsData();
  }, [userId, currentUserId]);

  // Y a-t-il une demande PENDING envoyée par CE profil (userId) -> moi (currentUserId) ?
  useEffect(() => {
    const loadPendingFromProfile = async () => {
      if (!currentUserId || !userId || currentUserId === userId) return;

      const { data, error } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', userId) // CE profil est l’expéditeur
        .eq('receiver_id', currentUserId) // MOI suis le destinataire
        .eq('status', 'pending')
        .maybeSingle();

      setPendingRequestId(!error && data ? data.id : null);
    };
    loadPendingFromProfile();
  }, [currentUserId, userId]);

  // Compteur d'amis mutuels (A suit B ET B suit A)
  const fetchFriendsCount = useCallback(async () => {
    if (!userId) return;

    const { data: out } = await supabase
      .from('friends')
      .select('following_id')
      .eq('follower_id', userId);

    const { data: inc } = await supabase
      .from('friends')
      .select('follower_id')
      .eq('following_id', userId);

    const outSet = new Set((out || []).map((r) => r.following_id));
    const incSet = new Set((inc || []).map((r) => r.follower_id));

    let mutual = 0;
    outSet.forEach((id) => {
      if (incSet.has(id)) mutual++;
    });
    setFriendsCount(mutual);
  }, [userId]);

  useEffect(() => {
    fetchFriendsCount();
  }, [fetchFriendsCount]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`friends_mutual_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchFriendsCount)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, fetchFriendsCount]);

  // ─────────────────────────────────────────────────────
  // Fonctions (pas des hooks)
  // ─────────────────────────────────────────────────────

  const handleAddFriend = async () => {
    if (!currentUserId || !userId) return;

    const { data: existing } = await supabase
      .from('friend_requests')
      .select('id, status')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', userId)
      .maybeSingle();

    if (existing) {
      setFriendRequestStatus(existing.status);
      return;
    }

    const { error } = await supabase.from('friend_requests').insert({
      sender_id: currentUserId,
      receiver_id: userId,
      status: 'pending',
    });

    if (error) {
      console.error("Erreur demande d'ami:", error);
      return;
    }

    await notifyUser({
      user_id: userId,
      title: 'Nouvelle demande d’ami',
      body: 'Tu as reçu une demande d’ami',
      type: 'friend_request',
      sender_id: currentUserId,
      push: true,
    });

    // ✅ passe direct en attente dans l'UI
    setFriendRequestStatus('pending');
  };

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const onAcceptFriend = async () => {
    if (!pendingRequestId) return;
    try {
      setLoadingFR(true);
      const token = await getToken();
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/friend_request_respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, decision: 'accept' }),
      });
      setIsFriend(true);
      setFriendRequestStatus('accepted');
      setPendingRequestId(null);
      fetchFriendsCount(); // 🔄 MAJ compteur
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFR(false);
    }
  };

  const onDeclineFriend = async () => {
    if (!pendingRequestId) return;
    try {
      setLoadingFR(true);
      const token = await getToken();
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/friend_request_respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, decision: 'reject' }),
      });
      setFriendRequestStatus('rejected');
      setPendingRequestId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFR(false);
    }
  };

  // ✅ Early return APRÈS tous les hooks, AVANT d’accéder à user.*
  if (!user) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  // ─────────────────────────────────────────────────────
  // Données dérivées
  // ─────────────────────────────────────────────────────

  let sports = [];
  if (Array.isArray(user.favorite_sports)) {
    sports = user.favorite_sports;
  } else if (typeof user.favorite_sports === 'string') {
    sports = user.favorite_sports.split(',').map((s) => s.trim());
  }

  const stats = {
    createdCount,
    joinedCount,
    avgRating,
    nbRatings,
  };
  const unlockedBadges = getUnlockedBadges(stats);

  const openFriendsList = () => {
  navigation.navigate('FriendsList', { userId });
};

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#fafbff' }}>
    <StatusBar barStyle="dark-content" />
    {/* Flèche retour seule */}
    <View style={styles.appBarOnlyBack}>
      <TouchableOpacity
        style={{ paddingHorizontal: 12, paddingVertical: 5 }}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={27} color="#222" />
      </TouchableOpacity>
    </View>

    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContent}>
        {/* Titre du profil */}
        <View style={styles.profileTitleContainer}>
          <GradientTitle style={styles.profileTitle}>
            Profil de {user?.username || 'Utilisateur'}
          </GradientTitle>
        </View>

        <View style={styles.profileCard}>
          {/* Avatar */}
          {user?.profile_photo ? (
            <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: randomPastel(),
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}

          {/* Pseudo */}
          <Text style={styles.username}>{user?.username || 'Pseudo'}</Text>

          {/* Affichage de la moyenne des avis */}
          <TouchableOpacity
            style={{ alignItems: 'center', marginTop: 6, marginBottom: 0 }}
            activeOpacity={nbRatings > 0 ? 0.7 : 1}
            onPress={() => {
              if (nbRatings > 0) navigation.navigate('UserReview', { userId });
            }}
            disabled={nbRatings === 0}
          >
            <StarDisplay value={avgRating} size={22} />
            <Text
              style={{
                color: '#666',
                fontSize: 13,
                marginTop: 3,
                textDecorationLine: nbRatings > 0 ? 'underline' : 'none',
                opacity: nbRatings > 0 ? 1 : 0.7,
              }}
            >
              {nbRatings > 0
                ? `${nbRatings} avis`
                : 'Aucun avis pour le moment'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 18 }} />

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

          {/* Compteurs sessions */}
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

{/* Actions d’amitié (compact) */}
{currentUserId && userId !== currentUserId && (
  pendingRequestId ? (
    // CE PROFIL t'a envoyé une demande -> Accepter / Refuser ici
    <View style={styles.friendActionsRow}>
      <TouchableOpacity onPress={onAcceptFriend} activeOpacity={0.85} disabled={loadingFR}>
        <LinearGradient
          colors={['#27ae60', '#2ecc71']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.friendGradientBtn}
        >
          <Text style={styles.friendGradientText}>{loadingFR ? '...' : 'Accepter'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDeclineFriend} activeOpacity={0.85} disabled={loadingFR}>
        <LinearGradient
          colors={['#e53935', '#f44336']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.friendGradientBtn}
        >
          <Text style={styles.friendGradientText}>{loadingFR ? '...' : 'Refuser'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  ) : isFriend ? (
    // Déjà amis
    <View style={styles.pillMuted}>
      <Text style={styles.pillMutedText}>Vous êtes déjà amis</Text>
    </View>
  ) : friendRequestStatus === 'pending' ? (
    // Demande QUE TU AS envoyée
    <View style={styles.pillMuted}>
      <Text style={styles.pillMutedText}>En attente</Text>
    </View>
  ) : (
    // Aucune relation
    <TouchableOpacity onPress={handleAddFriend} activeOpacity={0.85}>
      <LinearGradient
        colors={['#6A11CB', '#2575FC']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.friendGradientBtn}
      >
        <Text style={styles.friendGradientText}>Ajouter en ami</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
)}

          {/* ========== BADGES ========== */}
          <View style={styles.badgesListContainer}>
            {unlockedBadges.length === 0 ? (
              <Text
                style={{
                  color: '#bbb',
                  fontStyle: 'italic',
                  fontSize: 15,
                  marginVertical: 7,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
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
                }}
              >
                {unlockedBadges.map((badge) => (
                  <IconBadgeCard badge={badge} key={badge.code} />
                ))}
              </ScrollView>
            )}
          </View>
          {/* ========== FIN BADGES ========== */}

          <View style={{ height: 16 }} />

          <View style={styles.badgesRow}>
            {user?.birthdate ? (
              <Badge
                icon="calendar"
                value={`${getAgeFromBirthdate(user.birthdate)} ans`}
              />
            ) : null}
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

          {/* Description */}
          {user?.bio ? (
            <View style={styles.descBox}>
              <MaterialCommunityIcons
                name="format-quote-close"
                size={22}
                color="#e56a54"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.descText}>{user.bio}</Text>
            </View>
          ) : null}

          {/* Bouton signalement */}
          {currentUserId && userId !== currentUserId && (
            <ReportUserButton
              reportedUserId={userId}
              currentUserId={currentUserId}
            />
          )}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: hp('1%'),
    paddingBottom: hp('5%'),
  },
  appBarOnlyBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginTop: 0,
    backgroundColor: 'transparent',
    height: hp('5.4%'),
    zIndex: 10,
  },
  centerContent: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: hp('0.25%'),
  },
  profileTitleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp('0.3%'),
    marginTop: 0,
  },
  profileTitle: {
    fontWeight: 'bold',
    fontSize: wp('6%'),
    letterSpacing: 0.1,
    textAlign: 'center',
    color: '#ff855a',
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
    marginTop: hp('1.1%'),
  },
  avatar: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    marginBottom: hp('1.4%'),
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: hp('0.4%') },
    shadowRadius: wp('2.3%'),
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
    fontSize: wp('6.2%'),
    fontWeight: '700',
    color: '#222',
    marginTop: hp('0.4%'),
    marginBottom: hp('1%'),
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  counterContainer: {
    backgroundColor: '#f3f7fe',
    borderRadius: wp('4.2%'),
    paddingVertical: hp('1.1%'),
    paddingHorizontal: wp('8.5%'),
    marginBottom: hp('1.1%'),
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
    fontSize: wp('5.3%'),
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
    gap: wp('2.2%'),
    marginBottom: hp('1.7%'),
    marginTop: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4e5',
    borderRadius: wp('4.3%'),
    paddingVertical: hp('0.85%'),
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
    marginVertical: hp('1.1%'),
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
  badgesListContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.7%'),
    marginTop: hp('1%'),
    minHeight: hp('7%'),
    width: '100%',
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: wp('6%'),
    padding: hp('1%'),
    borderRadius: wp('3.7%'),
    backgroundColor: '#fff8f1',
    borderWidth: 1,
    borderColor: '#FFE0C0',
    minWidth: wp('21%'),
    maxWidth: wp('23%'),
  },
  badgeName: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#ff9100',
    marginTop: hp('0.4%'),
    textAlign: 'center',
    maxWidth: wp('20%'),
  },
  proBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: wp('28%'),
    marginHorizontal: wp('2%'),
    marginBottom: hp('0.9%'),
  },
  proBadgeCircle: {
    width: wp('19%'),
    height: wp('19%'),
    borderRadius: wp('9.5%'),
    backgroundColor: '#fff',
    borderWidth: 1.8,
    borderColor: '#e2e7f3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e0e7ef',
    shadowOffset: { width: 0, height: hp('0.5%') },
    shadowOpacity: 0.13,
    shadowRadius: wp('3.3%'),
    elevation: 2,
  },
  proBadgeEmoji: {
    fontSize: wp('8%'),
    textAlign: 'center',
    marginBottom: 1,
  },
  proBadgeLabel: {
    marginTop: hp('0.7%'),
    fontSize: wp('3.4%'),
    fontWeight: '700',
    color: '#252626',
    textAlign: 'center',
    letterSpacing: 0.03,
    maxWidth: wp('27%'),
    minHeight: hp('2.2%'),
    opacity: 0.98,
  },
  friendsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('12%'),
    marginTop: hp('2%'),
    marginBottom: hp('1.5%'),
  },
  friendsCounterBox: {
    alignItems: 'center',
  },
friendGradientBtn: {
  borderRadius: wp('4%'),
  paddingVertical: hp('0.85%'),
  paddingHorizontal: wp('4.5%'),
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: hp('1%'),
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 1,
  alignSelf: 'center',
},
friendGradientText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: wp('3.7%'),
  textAlign: 'center',
  letterSpacing: 0.2,
},
friendActionsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: wp('2.6%'),
  marginTop: hp('1%'),
},
pillMuted: {
  borderRadius: wp('4%'),
  paddingVertical: hp('0.7%'),
  paddingHorizontal: wp('4%'),
  backgroundColor: '#eef1f6',
  borderWidth: 1,
  borderColor: '#d8deea',
  alignSelf: 'center',
  marginTop: hp('1%'),
},
pillMutedText: {
  color: '#667085',
  fontWeight: '700',
  fontSize: wp('3.6%'),
  textAlign: 'center',
  letterSpacing: 0.2,
},
});

export default UserProfileScreen;