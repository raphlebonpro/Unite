import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView, StyleSheet, TouchableOpacity, ScrollView,
  Text, Image, View, StatusBar, Platform, Pressable, AppState,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import GradientTitle from '../components/GradientTitle';
import GradientIcon from '../components/GradientIcon';
import { BADGES, BADGE_ICONS } from '../constants/badges';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useSafeTop } from '../components/SafeTop';
import { Ionicons } from '@expo/vector-icons';

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

const Avatar = ({ photo, username, size = 84 }) => {
  if (photo) return (
    <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: getColorFromUsername(username), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>
        {username?.charAt(0)?.toUpperCase() || 'U'}
      </Text>
    </View>
  );
};

const StarDisplay = ({ value = 0, size = 18 }) => (
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

// ─── APP BAR ─────────────────────────────────────────────────────────────────

const AppBar = () => {
  const navigation = useNavigation();
  const safeTop    = useSafeTop();
  const STATUSBAR_H = Platform.OS === 'android' ? safeTop : 0;
  const BAR_H       = Platform.OS === 'ios' ? 45 : 52;

 return (
    <View style={[styles.appBar, { paddingTop: STATUSBAR_H, height: BAR_H + STATUSBAR_H }]}>
      <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.navigate('SearchFriends')} activeOpacity={0.7}>
        <GradientIcon name="search" size={20} />
      </TouchableOpacity>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ height: STATUSBAR_H }} />
        <View style={{ height: BAR_H, justifyContent: 'center', alignItems: 'center' }}>
          <GradientTitle style={{ fontWeight: 'bold', fontSize: 18 }}>Mon Profil</GradientTitle>
        </View>
      </View>

      <TouchableOpacity style={[styles.appBarBtn, { marginLeft: 'auto' }]} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
        <GradientIcon name="settings" size={20} />
      </TouchableOpacity>
    </View>
  );
};

// ─── SCREEN ──────────────────────────────────────────────────────────────────

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [user,            setUser]            = useState(null);
  const [currentUserId,   setCurrentUserId]   = useState(null);
  const [friendsCount,    setFriendsCount]    = useState(0);
  const [createdCount,    setCreatedCount]    = useState(0);
  const [joinedCount,     setJoinedCount]     = useState(0);
  const [avgRating,       setAvgRating]       = useState(0);
  const [nbRatings,       setNbRatings]       = useState(0);

  // ── Fetch user ──
  const fetchUserData = async () => {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) return;
    const userId = auth.user.id;
    setCurrentUserId(userId);
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!error && data) setUser(data);
  };

  // ── Fetch sessions ──
  const fetchSessionCounters = async (userId) => {
    if (!userId) return;
    const { data: createdRows, error: createdErr } = await supabase
      .from('sessions').select('id').eq('creator_id', userId).eq('is_cancelled', false);
    const createdIds = new Set((createdRows ?? []).map(r => r.id));
    setCreatedCount(createdErr ? 0 : (createdRows?.length ?? 0));
    const { data: joinedRows, error: joinedErr } = await supabase
      .from('session_participants')
      .select('session_id, sessions!inner(is_cancelled)')
      .eq('user_id', userId).eq('sessions.is_cancelled', false);
    if (joinedErr || !joinedRows?.length) { setJoinedCount(0); return; }
    const unique = new Set(joinedRows.map(r => r.session_id));
    let count = 0;
    for (const sid of unique) { if (!createdIds.has(sid)) count++; }
    setJoinedCount(count);
  };

  // ── Fetch ratings ──
  const fetchUserRating = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase.from('user_ratings').select('rating').eq('rated_id', userId);
    if (!error && data?.length) {
      setAvgRating(data.reduce((a, c) => a + c.rating, 0) / data.length);
      setNbRatings(data.length);
    } else { setAvgRating(0); setNbRatings(0); }
  };

  // ── Fetch friends ──
  const fetchFriendsCount = useCallback(async () => {
    if (!currentUserId) return;
    const rpc = await supabase.rpc('user_friends_count', { p_user: currentUserId });
    if (!rpc.error && typeof rpc.data === 'number') { setFriendsCount(rpc.data); return; }
    const { data: out } = await supabase.from('friends').select('following_id').eq('follower_id', currentUserId);
    const { data: inc } = await supabase.from('friends').select('follower_id').eq('following_id', currentUserId);
    const outSet = new Set((out || []).map(r => r.following_id));
    const incSet = new Set((inc || []).map(r => r.follower_id));
    let mutual = 0; outSet.forEach(id => { if (incSet.has(id)) mutual++; });
    setFriendsCount(mutual);
  }, [currentUserId]);

  useFocusEffect(React.useCallback(() => { fetchUserData(); }, []));

useEffect(() => {
  const sub = AppState.addEventListener('change', s => {
    if (s === 'active') {
      fetchUserData();
      fetchFriendsCount();
    }
  });
  return () => sub.remove();
}, [fetchFriendsCount]);

  useEffect(() => {
    if (!currentUserId) return;
    const ch = supabase.channel(`user_changes_${currentUserId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${currentUserId}` }, fetchUserData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUserId]);

  useFocusEffect(React.useCallback(() => {
    if (user?.id) { fetchSessionCounters(user.id); fetchUserRating(user.id); }
  }, [user]));

  useEffect(() => { fetchFriendsCount(); }, [fetchFriendsCount]);

  useEffect(() => {
    if (!currentUserId) return;
    const ch = supabase.channel(`friends_me_${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchFriendsCount)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUserId, fetchFriendsCount]);

  // ── Données dérivées ──
  let sports = [];
  if (Array.isArray(user?.favorite_sports)) sports = user.favorite_sports;
  else if (typeof user?.favorite_sports === 'string') sports = user.favorite_sports.split(',').map(s => s.trim());

  let accountAge = 0;
  if (user?.created_at) accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const stats = {
    createdCount, joinedCount,
    isPremium:     !!user?.is_premium,
    accountAge,
    createdAt:     user?.created_at || null,
    invitedUsers:  user?.invited_users || 0,
    reportsCount:  user?.reports_count || 0,
  };

  const unlockedBadges = getUserBadges(stats);

  // ─── RENDER ───
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AppBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 10 }]}
      >

        {/* ══ HERO CARD ══ */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#0D1321', '#162032', '#1A2A40']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* Déco géométrique */}
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />
            <View style={styles.heroDeco3} />

            {/* Avatar + badges */}
            <View style={styles.heroAvatarSection}>
              <View style={styles.avatarRing}>
                <Avatar photo={user?.profile_photo} username={user?.username} size={88} />
              </View>

              {/* Badges vérif + premium */}
              <View style={styles.heroBadgesRow}>
                {user?.is_verified && (
                  <LinearGradient
                    colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.heroBadge}
                  >
                    <Ionicons name="checkmark-circle" size={12} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.heroBadgeText}>Vérifié</Text>
                  </LinearGradient>
                )}
                {!premiumDisabled && user?.is_premium && (
                  <LinearGradient
                    colors={['#6A11CB', '#2575FC']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.heroBadge}
                  >
                    <FontAwesome5 name="bolt" size={10} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.heroBadgeText}>Unite+</Text>
                  </LinearGradient>
                )}
              </View>
            </View>

            {/* Nom */}
            <Text style={styles.heroName}>{user?.username || 'Pseudo'}</Text>

            {/* Infos secondaires */}
            <View style={styles.heroMeta}>
              {user?.birthdate && (
                <View style={styles.heroMetaItem}>
                  <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
                  <Text style={styles.heroMetaText}>{getAgeFromBirthdate(user.birthdate)} ans</Text>
                </View>
              )}
              {user?.gender && (
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
              onPress={() => { if (nbRatings > 0) navigation.navigate('UserReview', { userId: user?.id }); }}
            >
              <StarDisplay value={avgRating} size={16} />
              <Text style={styles.ratingText}>
                {nbRatings > 0 ? `${nbRatings} avis` : 'Pas encore noté'}
              </Text>
              {nbRatings > 0 && <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 2 }} />}
            </TouchableOpacity>

            {/* Bouton modifier */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={16} color="#FE5D02" style={{ marginRight: 7 }} />
              <Text style={styles.editBtnText}>Modifier mon profil</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* ══ STATS ══ */}
        <View style={styles.statsCard}>
          <StatBlock
            value={friendsCount}
            label="Coéquipiers"
            onPress={() => currentUserId && navigation.navigate('FriendsList', { userId: currentUserId })}
            accent="#3888FF"
          />
          <View style={styles.statsDivider} />
          <StatBlock value={createdCount} label="Créées" accent="#FE5D02" />
          <View style={styles.statsDivider} />
          <StatBlock value={joinedCount}  label="Rejointes" accent="#2ECC71" />
        </View>

        {/* ══ ACTIONS RAPIDES ══ */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('LeaderBoard')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FFF4EE', '#FFE8D8']}
              style={styles.actionCardIcon}
            >
              <Ionicons name="trophy" size={22} color="#FE5D02" />
            </LinearGradient>
            <Text style={styles.actionCardLabel}>Classement</Text>
            <Ionicons name="chevron-forward" size={14} color="#CCC" style={{ marginTop: 2 }} />
          </TouchableOpacity>

          {!user?.is_verified && (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={() => navigation.navigate('VerifyEmail')}
    activeOpacity={0.85}
  >
    <LinearGradient colors={['#FFFBEE', '#FFF5CC']} style={styles.actionCardIcon}>
      <Ionicons name="shield-checkmark-outline" size={22} color="#F5A623" />
    </LinearGradient>
    <Text style={styles.actionCardLabel}>Vérifier</Text>
    <Ionicons name="chevron-forward" size={14} color="#CCC" style={{ marginTop: 2 }} />
  </TouchableOpacity>
)}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('UserReview', { userId: user?.id })}
            activeOpacity={0.85}
            disabled={nbRatings === 0}
          >
            <LinearGradient
              colors={['#FFFBEE', '#FFF5CC']}
              style={styles.actionCardIcon}
            >
              <Ionicons name="star" size={22} color="#FFD700" />
            </LinearGradient>
            <Text style={styles.actionCardLabel}>Mes avis</Text>
            <Ionicons name="chevron-forward" size={14} color="#CCC" style={{ marginTop: 2 }} />
          </TouchableOpacity>

          {!premiumDisabled && !user?.is_premium && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('UnitePlusCompare')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#EEF0FF', '#E0E4FF']}
                style={styles.actionCardIcon}
              >
                <FontAwesome5 name="bolt" size={20} color="#6A11CB" />
              </LinearGradient>
              <Text style={styles.actionCardLabel}>Unite+</Text>
              <Ionicons name="chevron-forward" size={14} color="#CCC" style={{ marginTop: 2 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* ══ BIO ══ */}
        {user?.bio ? (
          <View style={styles.bioCard}>
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
          <View style={styles.sportsCard}>
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
        <View style={styles.badgesCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="ribbon-outline" size={15} color="#FE5D02" />
            </View>
            <Text style={styles.cardHeaderTitle}>Badges débloqués</Text>
            {unlockedBadges.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{unlockedBadges.length}</Text>
              </View>
            )}
          </View>

          {unlockedBadges.length === 0 ? (
            <View style={styles.badgesEmpty}>
              <View style={styles.badgesEmptyIcon}>
                <Ionicons name="ribbon-outline" size={26} color="#DDD" />
              </View>
              <Text style={styles.badgesEmptyTitle}>Aucun badge pour l'instant</Text>
              <Text style={styles.badgesEmptyDesc}>Crée ou rejoins des sessions pour débloquer tes premiers badges.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesList}
            >
              {unlockedBadges.reverse().map(badge => (
                <BadgeItem badge={badge} key={badge.code} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ══ UNITE+ BANNER (si non premium) ══ */}
        {!premiumDisabled && !user?.is_premium && (
          <TouchableOpacity
            style={styles.uniteBanner}
            onPress={() => navigation.navigate('UnitePlusCompare')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#6A11CB', '#2575FC']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.uniteBannerInner}
            >
              <View style={styles.uniteBannerLeft}>
                <Text style={styles.uniteBannerTitle}>Passe à Unite+</Text>
                <Text style={styles.uniteBannerSub}>Accède à toutes les fonctionnalités avancées</Text>
              </View>
              <View style={styles.uniteBannerIcon}>
                <FontAwesome5 name="bolt" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ══ RÉSILIER (si premium) ══ */}
        {!premiumDisabled && user?.is_premium && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={async () => {
              const result = await WebBrowser.openBrowserAsync('https://www.uniteapp.fr/uniteplus');
              if (result.type === 'dismiss') fetchUserData();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={16} color="#E53935" style={{ marginRight: 8 }} />
            <Text style={styles.cancelBtnText}>Résilier Unite+</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F2F3F7' },
  scroll: { paddingTop: 12, paddingHorizontal: 16 },

  // App bar
  appBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16,
    borderBottomWidth: 0.4, borderBottomColor: '#EAEAEA',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, zIndex: 10,
  },
  appBarBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Hero card
  heroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  heroGradient: { padding: 24, alignItems: 'center', position: 'relative' },
  heroDeco1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(254,93,2,0.06)', top: -80, right: -50 },
  heroDeco2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(246,45,174,0.05)', bottom: -40, left: -40 },
  heroDeco3: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(56,136,255,0.04)', top: 20, left: 20 },

  heroAvatarSection: { alignItems: 'center', marginBottom: 14 },
  avatarRing: {
    padding: 3, borderRadius: 50,
    borderWidth: 2.5, borderColor: '#FE5D02',
    marginBottom: 12,
  },
  heroBadgesRow: { flexDirection: 'row', gap: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  heroName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 8 },
  heroMeta: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center' },
  heroMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  ratingText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(254,93,2,0.35)',
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 14,
  },
  editBtnText: { color: '#FE5D02', fontSize: 14, fontWeight: '700' },

  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#EBEBF0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statBlock:   { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statNum:     { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 3 },
  statLabel:   { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statsDivider:{ width: 1, backgroundColor: '#F0F0F5', marginVertical: 12 },

  // Actions rapides
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#EBEBF0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  actionCardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionCardLabel: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 2, textAlign: 'center' },

  // Card générique
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardHeaderIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  cardHeaderTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A2E' },

  // Bio
  bioCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#EBEBF0',
  },
  bioText: { fontSize: 14.5, color: '#555', lineHeight: 22, fontWeight: '400' },

  // Sports
  sportsCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#EBEBF0',
  },
  sportsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF4EE', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(254,93,2,0.2)',
  },
  sportChipText: { fontSize: 13, fontWeight: '600', color: '#FE5D02' },

  // Badges
  badgesCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#EBEBF0',
  },
  badgeCount: { backgroundColor: '#FFF0E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeCountText: { fontSize: 11, fontWeight: '700', color: '#FE5D02' },
  badgesList: { paddingRight: 4, gap: 12 },
  badgeItem: { alignItems: 'center', width: 72 },
  badgeItemIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  badgeItemLabel: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center', lineHeight: 14 },
  badgesEmpty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  badgesEmptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F5F5F8', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgesEmptyTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  badgesEmptyDesc: { fontSize: 12, color: '#AAA', textAlign: 'center', lineHeight: 18, maxWidth: 240 },

  // Unite+ banner
  uniteBanner: { borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
  uniteBannerInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  uniteBannerLeft:  { flex: 1 },
  uniteBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  uniteBannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  uniteBannerIcon:  { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // Cancel
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14, marginBottom: 8,
    backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFCDD2',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#E53935' },
});

export default ProfileScreen;
