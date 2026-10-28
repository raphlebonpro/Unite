import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView, StyleSheet, ScrollView, Text, Image,
  View, StatusBar, ActivityIndicator, TouchableOpacity,
  Platform, Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { ReportUserButton } from '../components/ReportUserButton';
import { BADGES, BADGE_ICONS } from '../constants/badges';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { notifyUser } from '../helpers/notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const premiumDisabled = true;

const LETTER_COLORS = [
  '#4A90E2','#50E3C2','#F5A623','#9013FE','#D0021B',
  '#7ED321','#F8E71C','#B8E986','#417505','#BD10E0',
  '#FF3366','#00BCD4','#FF9800',
];

function getColorFromUsername(username = '') {
  if (!username) return '#4A90E2';
  return LETTER_COLORS[(username.charCodeAt(0) - 65) % LETTER_COLORS.length];
}

function getAgeFromBirthdate(birthdate) {
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getUserBadges(stats) {
  return BADGES.filter(badge => badge.check(stats));
}

// ─── SOUS-COMPOSANTS ─────────────────────────────────────────────────────────

const Avatar = ({ photo, username, size = 88 }) => {
  if (photo) return (
    <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: getColorFromUsername(username), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>
        {username?.charAt(0)?.toUpperCase() || '?'}
      </Text>
    </View>
  );
};

const StarDisplay = ({ value = 0, size = 16 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[0,1,2,3,4].map(i => {
      const diff = value - i;
      const name = diff >= 1 ? 'star' : diff >= 0.5 ? 'star-half-full' : 'star-o';
      return <FontAwesome key={i} name={name} size={size} color={diff > 0 ? '#FFD700' : '#D8D8D8'} />;
    })}
  </View>
);

const BadgeItem = ({ badge }) => {
  const iconData = BADGE_ICONS[badge.code];
  return (
    <View style={styles.badgeItem}>
      <View style={[
        styles.badgeItemIcon,
        { backgroundColor: iconData ? iconData.color + '20' : '#F5F5F8' }
      ]}>
        {iconData
          ? <FontAwesome5 name={iconData.icon} size={20} color={iconData.color} />
          : <Ionicons name="ribbon-outline" size={20} color="#888" />
        }
      </View>
      <Text style={[styles.badgeItemLabel, iconData && { color: iconData.color }]} numberOfLines={2}>
        {badge.label}
      </Text>
    </View>
  );
};

const SportChip = ({ label }) => (
  <View style={styles.sportChip}>
    <Ionicons name="fitness-outline" size={13} color="#FE5D02" style={{ marginRight: 5 }} />
    <Text style={styles.sportChipText}>{label}</Text>
  </View>
);

const StatBlock = ({ value, label, onPress, accent }) => (
  <TouchableOpacity
    style={styles.statBlock}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
    disabled={!onPress}
  >
    <Text style={[styles.statNum, accent && { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── SCREEN ──────────────────────────────────────────────────────────────────

const UserProfileScreen = () => {
  const route      = useRoute();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { userId } = route.params;

  const [user,                setUser]                = useState(null);
  const [isBlocked,           setIsBlocked]           = useState(false);
  const [createdCount,        setCreatedCount]        = useState(0);
  const [joinedCount,         setJoinedCount]         = useState(0);
  const [avgRating,           setAvgRating]           = useState(0);
  const [nbRatings,           setNbRatings]           = useState(0);
  const [currentUserId,       setCurrentUserId]       = useState(null);
  const [friendsCount,        setFriendsCount]        = useState(0);
  const [isFriend,            setIsFriend]            = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState(null);
  const [pendingRequestId,    setPendingRequestId]    = useState(null);
  const [loadingFR,           setLoadingFR]           = useState(false);
  const [optionsVisible,      setOptionsVisible]      = useState(false);
  const [reportAutoOpen,      setReportAutoOpen]      = useState(false);

  // ── Refresh état ami ──
  const refreshFriendState = useCallback(async () => {
    if (!currentUserId || !userId || currentUserId === userId) return;
    const { data: relAB } = await supabase.from('friends').select('follower_id').eq('follower_id', currentUserId).eq('following_id', userId).maybeSingle();
    const { data: relBA } = await supabase.from('friends').select('follower_id').eq('follower_id', userId).eq('following_id', currentUserId).maybeSingle();
    if (relAB && relBA) { setIsFriend(true); setFriendRequestStatus('accepted'); setPendingRequestId(null); return; }
    const { data: request } = await supabase.from('friend_requests').select('id, status, sender_id')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .maybeSingle();
    if (request?.status === 'pending') {
      if (request.sender_id === currentUserId) { setFriendRequestStatus('pending'); setPendingRequestId(null); }
      else { setFriendRequestStatus(null); setPendingRequestId(request.id); }
      setIsFriend(false); return;
    }
    setIsFriend(false); setFriendRequestStatus(null); setPendingRequestId(null);
  }, [currentUserId, userId]);

  // ── Compteur amis ──
  const fetchFriendsCount = useCallback(async () => {
    if (!userId) return;
    const { data: out } = await supabase.from('friends').select('following_id').eq('follower_id', userId);
    const { data: inc } = await supabase.from('friends').select('follower_id').eq('following_id', userId);
    const outSet = new Set((out || []).map(r => r.following_id));
    const incSet = new Set((inc || []).map(r => r.follower_id));
    let mutual = 0; outSet.forEach(id => { if (incSet.has(id)) mutual++; });
    setFriendsCount(mutual);
  }, [userId]);

  // ── Rating ──
  const fetchAvgRating = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from('user_ratings').select('rating').eq('rated_id', userId);
    if (!error && data?.length) { setAvgRating(data.reduce((a, c) => a + c.rating, 0) / data.length); setNbRatings(data.length); }
    else { setAvgRating(0); setNbRatings(0); }
  }, [userId]);

  // ── Init ──
  useEffect(() => {
    (async () => {
      const { data: { user: current } } = await supabase.auth.getUser();
      setCurrentUserId(current?.id || null);
    })();
  }, []);

  useEffect(() => {
    supabase.from('users').select('*').eq('id', userId).single()
      .then(({ data, error }) => { if (!error) setUser(data); });
  }, [userId]);

  useEffect(() => {
    const fetch = async () => {
      if (!userId) return;
      const { data: createdRows, error: cErr } = await supabase.from('sessions').select('id').eq('creator_id', userId).eq('is_cancelled', false);
      const createdIds = new Set((createdRows ?? []).map(r => r.id));
      setCreatedCount(cErr ? 0 : (createdRows?.length ?? 0));
      const { data: joinedRows, error: jErr } = await supabase.from('session_participants')
        .select('session_id, sessions!inner(is_cancelled)').eq('user_id', userId).eq('sessions.is_cancelled', false);
      if (jErr || !joinedRows?.length) { setJoinedCount(0); return; }
      const unique = new Set(joinedRows.map(r => r.session_id));
      let count = 0; for (const sid of unique) { if (!createdIds.has(sid)) count++; }
      setJoinedCount(count);
    };
    fetch();
  }, [userId]);

  useEffect(() => {
    if (!currentUserId || !userId) return;
    supabase.from('blocked_users').select('id').eq('blocker_id', currentUserId).eq('blocked_id', userId).maybeSingle()
      .then(({ data }) => setIsBlocked(!!data));
  }, [currentUserId, userId]);

  useEffect(() => { fetchFriendsCount(); }, [fetchFriendsCount]);
  useEffect(() => { fetchAvgRating(); }, [fetchAvgRating]);
  useEffect(() => { refreshFriendState(); }, [refreshFriendState]);

  useFocusEffect(useCallback(() => { refreshFriendState(); fetchAvgRating(); }, [refreshFriendState, fetchAvgRating]));

  useEffect(() => {
    if (!currentUserId) return;
    const ch = supabase.channel(`friends_realtime_${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => { fetchFriendsCount(); refreshFriendState(); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUserId, fetchFriendsCount, refreshFriendState]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`friends_mutual_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchFriendsCount)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId, fetchFriendsCount]);

  // ── Actions amis ──
  const handleAddFriend = async () => {
    if (!currentUserId || !userId || currentUserId === userId) return;
    await supabase.from('friend_requests').delete()
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`);
    const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUserId, receiver_id: userId, status: 'pending' });
    if (error) return;
    const { data: me } = await supabase.from('users').select('username').eq('id', currentUserId).maybeSingle();
    await notifyUser({ user_id: userId, title: "Nouvelle demande d'ami", body: `${me?.username || 'Un utilisateur'} t'a envoyé une demande d'ami`, type: 'friend_request', sender_id: currentUserId, push: true });
    setFriendRequestStatus('pending'); setPendingRequestId(null);
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const onAcceptFriend = async () => {
    if (!pendingRequestId) return;
    setLoadingFR(true);
    try {
      const token = await getToken();
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/friend_request_respond`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, decision: 'accept' }),
      });
      await refreshFriendState(); fetchFriendsCount();
    } finally { setLoadingFR(false); }
  };

  const onDeclineFriend = async () => {
    if (!pendingRequestId) return;
    setLoadingFR(true);
    try {
      const token = await getToken();
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/friend_request_respond`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, decision: 'reject' }),
      });
      await refreshFriendState();
    } finally { setLoadingFR(false); }
  };

  const handleBlockUser = async () => {
    Alert.alert("Bloquer cet utilisateur", "Tu ne verras plus ses sessions, messages ou interactions.", [
      { text: "Annuler", style: "cancel" },
      { text: "Bloquer", style: "destructive", onPress: async () => {
        await supabase.from('blocked_users').insert([{ blocker_id: currentUserId, blocked_id: userId }]);
        await supabase.from('friends').delete().or(`and(follower_id.eq.${currentUserId},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${currentUserId})`);
        await supabase.from('friend_requests').delete().or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`);
        setIsBlocked(true); setIsFriend(false); setFriendRequestStatus(null); setPendingRequestId(null);
      }},
    ]);
  };

  const handleUnblockUser = async () => {
    Alert.alert("Débloquer cet utilisateur", "Il pourra réapparaître dans tes sessions et interactions.", [
      { text: "Annuler", style: "cancel" },
      { text: "Débloquer", onPress: async () => {
        await supabase.from('blocked_users').delete().match({ blocker_id: currentUserId, blocked_id: userId });
        setIsBlocked(false);
        Alert.alert("Utilisateur débloqué", "Cet utilisateur n'est plus bloqué.");
      }},
    ]);
  };

  // ── Loading ──
  if (!user) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F3F7' }}>
      <ActivityIndicator color="#FE5D02" size="large" />
    </View>
  );

  // ── Données dérivées ──
  let sports = [];
  if (Array.isArray(user.favorite_sports)) sports = user.favorite_sports;
  else if (typeof user.favorite_sports === 'string') sports = user.favorite_sports.split(',').map(s => s.trim());

  const stats = {
  createdCount,
  joinedCount,
  avgRating,
  nbRatings,
  isPremium: !!user.is_premium,
  accountAge: user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0,
  createdAt:    user.created_at || null,
  invitedUsers: user.invited_users || 0,
  reportsCount: user.reports_count || 0,
};
  const unlockedBadges = getUserBadges(stats);
  const isOwnProfile   = currentUserId === userId;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ══ APP BAR (inchangée) ══ */}
      <View style={styles.appBarOnlyBack}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.closeButton}>
          <Ionicons name="close" size={18} color="#444" />
        </TouchableOpacity>
        {currentUserId && !isOwnProfile && (
          <TouchableOpacity onPress={() => setOptionsVisible(true)} activeOpacity={0.8} style={styles.moreButton}>
            <Feather name="more-vertical" size={20} color="#444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 10 }]}
      >

        {/* ══ BANNIÈRE BLOQUÉ ══ */}
        {isBlocked && (
          <View style={styles.blockBanner}>
            <Ionicons name="ban-outline" size={15} color="#E53935" style={{ marginRight: 7 }} />
            <Text style={styles.blockBannerText}>Vous avez bloqué cet utilisateur</Text>
          </View>
        )}

        {/* ══ HERO CARD (même structure que ProfileScreen) ══ */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#0D1321', '#162032', '#1A2A40']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />
            <View style={styles.heroDeco3} />

            {/* Avatar */}
            <View style={styles.heroAvatarSection}>
              <View style={[styles.avatarRing, isBlocked && { borderColor: '#E53935' }]}>
                <Avatar photo={user.profile_photo} username={user.username} size={88} />
              </View>

              {/* Badges */}
              <View style={styles.heroBadgesRow}>
                {user.is_verified && (
                  <LinearGradient colors={['#FF9D3C', '#FF6C4A', '#FF375E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.heroBadgeText}>Vérifié</Text>
                  </LinearGradient>
                )}
                {!premiumDisabled && user.is_premium && (
                  <LinearGradient colors={['#6A11CB', '#2575FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBadge}>
                    <FontAwesome5 name="bolt" size={10} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.heroBadgeText}>Unite+</Text>
                  </LinearGradient>
                )}
              </View>
            </View>

            {/* Nom */}
            <Text style={styles.heroName}>{user.username || 'Pseudo'}</Text>

            {/* Infos secondaires */}
            <View style={styles.heroMeta}>
              {user.birthdate && (
                <View style={styles.heroMetaItem}>
                  <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
                  <Text style={styles.heroMetaText}>{getAgeFromBirthdate(user.birthdate)} ans</Text>
                </View>
              )}
              {user.gender && (
                <View style={styles.heroMetaItem}>
                  <Ionicons name="person-outline" size={13} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
                  <Text style={styles.heroMetaText}>{user.gender}</Text>
                </View>
              )}
            </View>

            {/* Rating */}
            <TouchableOpacity
              style={styles.ratingRow}
              activeOpacity={nbRatings > 0 ? 0.7 : 1}
              disabled={nbRatings === 0}
              onPress={() => { if (nbRatings > 0) navigation.navigate('UserReview', { userId }); }}
            >
              <StarDisplay value={avgRating} size={16} />
              <Text style={styles.ratingText}>
                {nbRatings > 0 ? `${avgRating.toFixed(1)} / 5 · ${nbRatings} avis` : 'Pas encore noté'}
              </Text>
              {nbRatings > 0 && <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 2 }} />}
            </TouchableOpacity>

            {/* ══ BOUTON AMI ══ */}
            {currentUserId && !isOwnProfile && !isBlocked && (
              <View style={styles.friendSection}>
                {pendingRequestId ? (
                  <View style={styles.friendRequestRow}>
                    <TouchableOpacity style={styles.friendBtnAccept} onPress={onAcceptFriend} disabled={loadingFR} activeOpacity={0.85}>
                      <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.friendBtnText}>{loadingFR ? '...' : 'Accepter'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.friendBtnDecline} onPress={onDeclineFriend} disabled={loadingFR} activeOpacity={0.85}>
                      <Ionicons name="close" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.friendBtnText}>{loadingFR ? '...' : 'Refuser'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : isFriend ? (
                  <View style={styles.friendPill}>
                    <Ionicons name="people" size={14} color="#2ECC71" style={{ marginRight: 6 }} />
                    <Text style={[styles.friendPillText, { color: '#2ECC71' }]}>Coéquipiers</Text>
                  </View>
                ) : friendRequestStatus === 'pending' ? (
                  <View style={styles.friendPill}>
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                    <Text style={styles.friendPillText}>Demande envoyée</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.friendBtnPrimary} onPress={handleAddFriend} activeOpacity={0.85}>
                    <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.friendBtnText}>Devenir coéquipiers</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Soutien Unite+ */}
            {!premiumDisabled && user.is_premium && (
              <Text style={styles.premiumSupportText}>{user.username} soutient le collectif Unite</Text>
            )}
          </LinearGradient>
        </View>

        {/* ══ STATS (identique ProfileScreen) ══ */}
        <View style={styles.statsCard}>
          <StatBlock
            value={friendsCount}
            label="Coéquipiers"
            onPress={() => navigation.navigate('FriendsList', { userId })}
            accent="#3888FF"
          />
          <View style={styles.statsDivider} />
          <StatBlock value={createdCount}  label="Créées"    accent="#FE5D02" />
          <View style={styles.statsDivider} />
          <StatBlock value={joinedCount}   label="Rejointes" accent="#2ECC71" />
        </View>

        {/* ══ BIO ══ */}
        {user.bio ? (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color="#FE5D02" />
              </View>
              <Text style={styles.cardHeaderTitle}>À propos</Text>
            </View>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        {/* ══ SPORTS ══ */}
        {sports.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="fitness-outline" size={15} color="#FE5D02" />
              </View>
              <Text style={styles.cardHeaderTitle}>Sports pratiqués</Text>
            </View>
            <View style={styles.sportsWrap}>
              {sports.map((s, i) => <SportChip key={i} label={s} />)}
            </View>
          </View>
        )}

        {/* ══ BADGES ══ */}
        {unlockedBadges.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="ribbon-outline" size={15} color="#FE5D02" />
              </View>
              <Text style={styles.cardHeaderTitle}>Badges</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{unlockedBadges.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesList}>
              {[...unlockedBadges].reverse().map(badge => (
                <BadgeItem badge={badge} key={badge.code} />
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>

      {/* ══ BOTTOM SHEET OPTIONS (inchangé logiquement, redessiné) ══ */}
      {optionsVisible && (
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOptionsVisible(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Options</Text>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setOptionsVisible(false); setReportAutoOpen(true); }}
            >
              <View style={[styles.sheetItemIcon, { backgroundColor: '#FFF4EE' }]}>
                <Ionicons name="flag-outline" size={17} color="#FE5D02" />
              </View>
              <Text style={styles.sheetItemText}>Signaler cet utilisateur</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setOptionsVisible(false); isBlocked ? handleUnblockUser() : handleBlockUser(); }}
            >
              <View style={[styles.sheetItemIcon, { backgroundColor: isBlocked ? '#F0FFF4' : '#FFF5F5' }]}>
                <Ionicons name={isBlocked ? 'lock-open-outline' : 'ban-outline'} size={17} color={isBlocked ? '#2ECC71' : '#E53935'} />
              </View>
              <Text style={[styles.sheetItemText, { color: isBlocked ? '#2ECC71' : '#E53935' }]}>
                {isBlocked ? 'Débloquer cet utilisateur' : 'Bloquer cet utilisateur'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setOptionsVisible(false)}>
              <Text style={styles.sheetCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ReportUserButton reportedUserId={userId} currentUserId={currentUserId} autoOpen={reportAutoOpen} />
    </SafeAreaView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F2F3F7' },
  scroll: { paddingTop: 8, paddingHorizontal: 16 },

  // App bar — INCHANGÉE
  appBarOnlyBack: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'transparent',
    height: hp('5.4%'), zIndex: 10,
  },
  closeButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center',
    marginLeft: 12, borderWidth: 1, borderColor: '#E4E7EC',
  },
  moreButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1, borderColor: '#E4E7EC',
    position: 'absolute', right: 0,
  },

  // Bannière bloqué
  blockBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF5F5', borderRadius: 12, padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  blockBannerText: { color: '#E53935', fontWeight: '600', fontSize: 13 },

  // Hero card — MÊME que ProfileScreen
  heroCard:     { borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  heroGradient: { padding: 24, alignItems: 'center', position: 'relative' },
  heroDeco1:    { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(254,93,2,0.06)',   top: -80, right: -50 },
  heroDeco2:    { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(246,45,174,0.05)', bottom: -40, left: -40 },
  heroDeco3:    { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(56,136,255,0.04)', top: 20, left: 20 },

  heroAvatarSection: { alignItems: 'center', marginBottom: 14 },
  avatarRing: {
    padding: 3, borderRadius: 50, borderWidth: 2.5, borderColor: '#FE5D02',
    shadowColor: '#FE5D02', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8, marginBottom: 12,
  },
  heroBadgesRow: { flexDirection: 'row', gap: 8 },
  heroBadge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  heroName:     { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 8 },
  heroMeta:     { flexDirection: 'row', gap: 14, marginBottom: 12 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center' },
  heroMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  ratingText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  premiumSupportText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },

  // Boutons ami
  friendSection:    { alignItems: 'center' },
  friendRequestRow: { flexDirection: 'row', gap: 10 },
  friendBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F62DAE', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 11 },
  friendBtnAccept:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2ECC71', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  friendBtnDecline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  friendBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  friendPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  friendPillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  // Stats — MÊME que ProfileScreen
  statsCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#EBEBF0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statBlock:    { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statNum:      { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 3 },
  statLabel:    { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statsDivider: { width: 1, backgroundColor: '#F0F0F5', marginVertical: 12 },

  // Info cards — MÊMES que ProfileScreen
  infoCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#EBEBF0',
  },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardHeaderIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  cardHeaderTitle:{ flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  bioText:        { fontSize: 14.5, color: '#555', lineHeight: 22 },

  // Badges
  badgeCount:     { backgroundColor: '#FFF0E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeCountText: { fontSize: 11, fontWeight: '700', color: '#FE5D02' },
  badgesList:     { paddingRight: 4, gap: 12 },
  badgeItem:      { alignItems: 'center', width: 72 },
  badgeItemIcon:  { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  badgeItemLabel: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center', lineHeight: 14 },

  // Sports
  sportsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF4EE', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(254,93,2,0.2)',
  },
  sportChipText: { fontSize: 13, fontWeight: '600', color: '#FE5D02' },

  // Bottom sheet options
  overlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16, textAlign: 'center' },
  sheetItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  sheetItemIcon:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sheetItemText:{ flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  sheetCancel: { marginTop: 14, paddingVertical: 13, borderRadius: 14, backgroundColor: '#F2F3F7', alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
});

export default UserProfileScreen;
