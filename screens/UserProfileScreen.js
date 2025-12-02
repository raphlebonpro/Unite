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
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import GradientTitle from '../components/GradientTitle';
import { ReportUserButton } from '../components/ReportUserButton';
import { BADGES, BADGE_ICONS } from '../constants/badges';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { notifyUser } from '../helpers/notifications';

// === PREMIUM EN VEILLE ===
const premiumDisabled = true;

const LETTER_COLORS = [
  '#4A90E2', // A-B
  '#50E3C2', // C-D
  '#F5A623', // E-F
  '#9013FE', // G-H
  '#D0021B', // I-J
  '#7ED321', // K-L
  '#F8E71C', // M-N
  '#B8E986', // O-P
  '#417505', // Q-R
  '#BD10E0', // S-T
  '#FF3366', // U-V
  '#00BCD4', // W-X
  '#FF9800', // Y-Z
];

function getColorFromUsername(username = '') {
  if (!username) return '#4A90E2'; // couleur fallback
  const firstLetter = username.charAt(0).toUpperCase();
  const index = (firstLetter.charCodeAt(0) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[index];
}

const Chip = ({ label }) => (
  <View style={styles.chip}>
    <Feather name="activity" size={15} color="#43b97f" style={{ marginRight: 6 }} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

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

function getUserBadges(stats) {
  return BADGES.filter((badge) => badge.check(stats));
}

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

const StarDisplay = ({ value = 0, size = 22 }) => (
  <View style={{ flexDirection: 'row', marginBottom: 1 }}>
    {[0,1,2,3,4].map(i => {
      const diff = value - i;
      if (diff >= 1) return <FontAwesome key={i} name="star" size={size} color="#FFD700" />;
      if (diff >= 0.5) return <FontAwesome key={i} name="star-half-full" size={size} color="#FFD700" />;
      return <FontAwesome key={i} name="star-o" size={size} color="#C7C7C7" />;
    })}
  </View>
);

// 🔶 Badge de vérification Unite
const VerifiedBadge = () => (
  <LinearGradient
    colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.verifiedBadge}
  >
    <Text style={styles.verifiedText}>Profil Vérifié</Text>
  </LinearGradient>
);

function getUnlockedBadges(stats) {
  return BADGES.filter((badge) => badge.check(stats));
}

const UserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

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

const refreshFriendState = useCallback(async () => {
  if (!currentUserId || !userId || currentUserId === userId) return;

  // Vérifie si une relation existe dans les deux sens
  const { data: relAB } = await supabase
    .from('friends')
    .select('follower_id')
    .eq('follower_id', currentUserId)
    .eq('following_id', userId)
    .maybeSingle();

  const { data: relBA } = await supabase
    .from('friends')
    .select('follower_id')
    .eq('follower_id', userId)
    .eq('following_id', currentUserId)
    .maybeSingle();

  if (relAB && relBA) {
    setIsFriend(true);
    setFriendRequestStatus('accepted');
    setPendingRequestId(null);
    return;
  }

  // Sinon → regarde s’il existe une demande d’ami
  const { data: request } = await supabase
    .from('friend_requests')
    .select('id, status, sender_id')
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),` +
      `and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (request?.status === 'pending') {
    if (request.sender_id === currentUserId) {
      setFriendRequestStatus('pending'); // j'ai envoyé une demande
      setPendingRequestId(null);
    } else {
      setFriendRequestStatus(null); // l'autre m'a envoyé une demande
      setPendingRequestId(request.id);
    }
    setIsFriend(false);
    return;
  }

  // Sinon → pas d’amis ni demande
  setIsFriend(false);
  setFriendRequestStatus(null);
  setPendingRequestId(null);
}, [currentUserId, userId]);

  // ─────────────────────────────────────────────────────
  // HOOKS (toujours avant tout return conditionnel)
  // ─────────────────────────────────────────────────────

useEffect(() => {
  const checkBlockStatus = async () => {
    if (!currentUserId || !userId) return;

    const { data } = await supabase
      .from("blocked_users")
      .select("id")
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", userId)
      .maybeSingle();

    setIsBlocked(!!data);
  };

  checkBlockStatus();
}, [currentUserId, userId]);

 useEffect(() => {
  if (!currentUserId) return;
  const ch = supabase
    .channel(`friends_realtime_${currentUserId}`)
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friends' }, 
        () => {
          fetchFriendsCount();   // compteur
          refreshFriendState();  // état ami / pas ami
        })
    .subscribe();

  return () => supabase.removeChannel(ch);
}, [currentUserId, fetchFriendsCount, refreshFriendState]);

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

    // 🔹 Sessions créées (non annulées)
    const { data: createdRows, error: createdErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('creator_id', userId)
      .eq('is_cancelled', false); // ✅ exclut les sessions annulées

    const createdIds = new Set((createdRows ?? []).map(r => r.id));
    setCreatedCount(createdErr ? 0 : (createdRows?.length ?? 0));

    // 🔹 Participations (sessions non annulées)
    const { data: joinedRows, error: joinedErr } = await supabase
      .from('session_participants')
      .select(`
        session_id,
        sessions!inner(is_cancelled)
      `)
      .eq('user_id', userId)
      .eq('sessions.is_cancelled', false); // ✅ exclut les sessions annulées

    if (joinedErr || !joinedRows?.length) {
      setJoinedCount(0);
      return;
    }

    // 🔹 Exclut les sessions que ce user a créées
    const uniqueJoined = new Set(joinedRows.map(r => r.session_id));
    let count = 0;
    for (const sid of uniqueJoined) {
      if (!createdIds.has(sid)) count++;
    }
    setJoinedCount(count);
  };

  fetchSessionCounters();
}, [userId]);

const fetchAvgRating = useCallback(async () => {
  if (!userId) return;
  const { data, error } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('rated_id', userId);

  if (!error && data && data.length > 0) {
    const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
    setAvgRating(sum / data.length);
    setNbRatings(data.length);
  } else {
    setAvgRating(0);
    setNbRatings(0);
  }
}, [userId]);

const handleUnblockUser = async () => {
  if (!currentUserId || !userId) return;

  Alert.alert(
    "Débloquer cet utilisateur",
    "Il pourra réapparaître dans tes sessions et interactions. Continuer ?",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Débloquer",
        style: "default",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("blocked_users")
              .delete()
              .match({ blocker_id: currentUserId, blocked_id: userId });

            if (error) {
              Alert.alert("Erreur", "Impossible de débloquer cet utilisateur.");
              return;
            }

            setIsBlocked(false);
            Alert.alert("Utilisateur débloqué", "Cet utilisateur n’est plus bloqué.");
          } catch (e) {
            Alert.alert("Erreur", "Une erreur est survenue.");
          }
        },
      },
    ]
  );
};

const handleBlockUser = async () => {
  if (!currentUserId || !userId) return;

  Alert.alert(
    "Bloquer cet utilisateur",
    "Tu ne verras plus ses sessions, messages ou interactions. Es-tu sûr ?",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Bloquer",
        style: "destructive",
        onPress: async () => {
          try {
            // 1) Ajoute le blocage
            const { error } = await supabase
              .from('blocked_users')
              .insert([{ blocker_id: currentUserId, blocked_id: userId }]);

            if (error) {
              Alert.alert("Erreur", "Impossible de bloquer cet utilisateur.");
              return;
            }

            // 2) Supprime la relation d’amis si existante
            await supabase
              .from('friends')
              .delete()
              .or(
                `and(follower_id.eq.${currentUserId},following_id.eq.${userId}),` +
                `and(follower_id.eq.${userId},following_id.eq.${currentUserId})`
              );

            // 3) Supprime une demande d’ami si existante
            await supabase
              .from('friend_requests')
              .delete()
              .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),` +
                `and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
              );

            Alert.alert("Utilisateur bloqué", "Cet utilisateur est désormais bloqué.");

            setIsBlocked(true);

            // Option : retourne en arrière
            navigation.goBack();

          } catch (e) {
            Alert.alert("Erreur", "Une erreur est survenue.");
          }
        },
      },
    ]
  );
};

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

  // Rafraîchit à chaque focus de l’écran
useFocusEffect(
  useCallback(() => {
    refreshFriendState();
  }, [refreshFriendState])
);

// Rafraîchit quand l’ID change (nouvel utilisateur ouvert)
useEffect(() => {
  refreshFriendState();
}, [refreshFriendState]);

useEffect(() => {
  fetchAvgRating();
}, [fetchAvgRating]);

useFocusEffect(
  useCallback(() => {
    fetchAvgRating();
  }, [fetchAvgRating])
);

  // ─────────────────────────────────────────────────────
  // Fonctions (pas des hooks)
  // ─────────────────────────────────────────────────────

const handleAddFriend = async () => {
  if (!currentUserId || !userId || currentUserId === userId) return;

  try {
    // Supprime toute demande existante
    await supabase
      .from('friend_requests')
      .delete()
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),` +
        `and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
      );

    // Nouvelle demande
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: currentUserId,
      receiver_id: userId,
      status: 'pending',
    });

    if (error) {
      console.error("Erreur insert demande d'ami:", error);
      return;
    }

    // 🔎 Récupère le pseudo de l’utilisateur courant
    const { data: me } = await supabase
      .from('users')
      .select('username')
      .eq('id', currentUserId)
      .maybeSingle();

    const senderName = me?.username || 'Un utilisateur';

    // Notif enrichie
    await notifyUser({
      user_id: userId,
      title: 'Nouvelle demande d’ami',
      body: `${senderName} t’a envoyé une demande d’ami`,  // ✅ pseudo ajouté
      type: 'friend_request',
      sender_id: currentUserId,
      push: true,
    });

    setFriendRequestStatus('pending');
    setPendingRequestId(null);

  } catch (e) {
    console.error("Erreur handleAddFriend:", e);
  }
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
    await refreshFriendState(); // 🔄 met à jour l'état (isFriend, status…)
    fetchFriendsCount(); // 🔄 met aussi à jour le compteur
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
    await refreshFriendState(); // 🔄 on rafraîchit l'état après rejet
  } catch (e) {
    console.error(e);
  } finally {
    setLoadingFR(false);
  }
};

  // ✅ Early return APRÈS tous les hooks, AVANT d’accéder à user.*
if (!user) {
  return (
    <ActivityIndicator
      size={Platform.OS === 'ios' ? 'large' : 50}
      style={{ flex: 1, justifyContent: 'center' }}
    />
  );
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

  const unlockedBadges = getUserBadges(stats);

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
          style={[styles.avatar,
          { backgroundColor: getColorFromUsername(user?.username), justifyContent: 'center', alignItems: 'center',},]}
         >
          <Text style={styles.avatarInitial}>
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
          )}

<View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: hp('1.5%') }}>
  <Text style={styles.username}>{user?.username || 'Pseudo'}</Text>

            {/* 🔹 Badges alignés en ligne */}
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: hp('0.3%'), gap: 6 }}>
    {user?.is_verified && <VerifiedBadge />}

    {!premiumDisabled && user?.is_premium && (
      <LinearGradient
        colors={['#6A11CB', '#2575FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingVertical: 8,
          marginTop: 10,
          marginBottom: 10,
          borderRadius: 999,
          gap: 5,
        }}
      >
        <FontAwesome5 name="bolt" size={14} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>Unite+</Text>
      </LinearGradient>
    )}
  </View>

{/* 💬 Phrase de soutien discrète et élégante */}
{!premiumDisabled && user?.is_premium && (
  <Text
    style={{
      marginTop: hp('0.7%'),
      color: '#666',
      fontSize: 13.5,
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: 0.3,
      opacity: 0.8,
      fontStyle: 'italic',
    }}
  >
    {user?.username || 'Pseudo'} soutient le collectif Unite 🫶
  </Text>
)}
</View>

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
    ? `${avgRating.toFixed(1)} / 5 (${nbRatings} avis)`
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

{/* =========== BADGES =========== */}
{unlockedBadges.length > 0 && (
  <View style={styles.badgesListContainer}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
        paddingHorizontal: 10,
      }}
    >
{[...unlockedBadges].reverse().map((badge) => (
  <BadgeCard badge={badge} key={badge.code} />
))}
    </ScrollView>
  </View>
)}
{/* =========== FIN BADGES =========== */}

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

{/* Blocage */}
{userId !== currentUserId && (
  isBlocked ? (
    <View style={{ marginTop: 12, alignItems: "center" }}>
      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 12,
          backgroundColor: "#eee",
          borderWidth: 1,
          borderColor: "#ddd",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#777",
            textAlign: "center",
          }}
        >
          Vous avez bloqué cet utilisateur
        </Text>
      </View>

      {/* Bouton débloquer */}
      <TouchableOpacity
        onPress={handleUnblockUser}
        activeOpacity={0.85}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 12,
          backgroundColor: "#e3f2fd",
          borderWidth: 1,
          borderColor: "#bbdefb",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#1565c0",
            textAlign: "center",
          }}
        >
          Débloquer cet utilisateur
        </Text>
      </TouchableOpacity>
    </View>
  ) : (
    <TouchableOpacity
      onPress={handleBlockUser}
      activeOpacity={0.85}
      style={{
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
        backgroundColor: "#ffebee",
        borderWidth: 1,
        borderColor: "#ffcdd2",
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: "#c62828",
          textAlign: "center",
        }}
      >
        Bloquer cet utilisateur
      </Text>
    </TouchableOpacity>
  )
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
    marginBottom: hp('2%'),
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
  // === NOUVEAUX STYLES PREMIUM BADGES ===
  premiumBadgeCard: {
    width: wp("22%"),
    marginHorizontal: 6,
    alignItems: "center",
  },
  premiumBadgeCircle: {
    width: wp("18%"),
    height: wp("18%"),
    borderRadius: wp("9%"),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    backgroundColor: "#fff",
  },
  premiumBadgeLabel: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  premiumBadgeEmoji: {
    fontSize: 22,
  },
  friendsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('12%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('2%'),
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
    marginBottom: hp('1%'),
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
    marginBottom: 10,
  },
  pillMutedText: {
    color: '#667085',
    fontWeight: '700',
    fontSize: wp('3.6%'),
    textAlign: 'center',
    letterSpacing: 0.2,
  },
verifiedBadge: {
  width: wp('30%'),
  height: hp('3.2%'),
  borderRadius: hp('1.8%'),
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#FF6C4A',
  shadowOpacity: 0.3,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 3,
  alignSelf: 'center',
},
verifiedText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: wp('3.2%'),
  letterSpacing: 0.3,
},
});

export default UserProfileScreen;