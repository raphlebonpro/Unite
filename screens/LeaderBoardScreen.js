import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, StyleSheet, Platform, Dimensions, ScrollView} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';

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
  if (!username) return '#4A90E2';
  const firstLetter = username.charAt(0).toUpperCase();
  const index = (firstLetter.charCodeAt(0) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[index];
}

const TABS = [
  { key: 'created', label: 'Créateurs', title: "Les Constructeurs de Unite" },
  { key: 'joined', label: 'Participants', title: "Les Aventuriers de Unite" }
];

const COLORS = {
  accent: '#FF914D',
  lightBg: '#FFF9F4',
  gray: '#F6F6F8',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  text: '#232323',
};

function GeneralCollectiveBanner() {
  return (
    <View
      style={[
        styles.heroBannerCompactWrap,
        { opacity: 0.9 } // effet visuel "désactivé"
      ]}
    >
      <LinearGradient
        colors={['#5371ff', '#a259f7']}
        style={styles.heroBannerCompact}
        start={{ x: 0.08, y: 0.13 }}
        end={{ x: 1, y: 0.9 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
          <MaterialCommunityIcons
            name="trophy"
            size={18}
            color="#fff"
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text style={styles.heroTitleCompact}>Les Défis Collectifs</Text>
        </View>

        {/* Texte principal en blanc */}
        <Text style={[styles.heroDescCompact, { color: '#fff' }]}>
          Rejoins les grands challenges Unite et gagne des lots chaque mois !
        </Text>

        {/* Message Bientôt dispo en gras et blanc */}
        <Text style={[styles.heroDescCompact, { marginTop: 4, fontWeight: 'bold', color: '#fff', fontSize: 13 }]}>
          🚧 Bientôt disponible !
        </Text>
      </LinearGradient>
    </View>
  );
}

  const Avatar = ({ photo, username, size = 48, style }) => {
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getColorFromUsername(username),
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#fff',
          fontWeight: '700',
          fontSize: size * 0.45,
        }}
      >
        {username?.charAt(0)?.toUpperCase() || 'U'}
      </Text>
    </View>
  );
};

function getMonthStartDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function getPodiumColor(rank) {
  if (rank === 1) return COLORS.gold;
  if (rank === 2) return COLORS.silver;
  if (rank === 3) return COLORS.bronze;
  return COLORS.gray;
}

function PodiumUser({ user, userId, rank, count, onPress }) {
  if (!user) {
    return (
      <View style={[styles.podiumUser, { opacity: 0.5 }]}>
        <View style={[styles.podiumAvatar, rank === 1 && styles.podiumGoldAvatar, { backgroundColor: "#eee", borderColor: getPodiumColor(rank) }]} />
        <Text style={[styles.podiumName, { fontWeight: '700', fontSize: rank === 1 ? 13 : 11, marginTop: 1 }]}>—</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(userId)}
      style={styles.podiumUser}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={[
        styles.podiumAvatar,
        rank === 1 && styles.podiumGoldAvatar,
        {
          borderColor: getPodiumColor(rank),
          shadowColor: getPodiumColor(rank),
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 9,
          width: rank === 1 ? 66 : 48,
          height: rank === 1 ? 66 : 48,
        }
      ]}>
<Avatar
  photo={user.profile_photo}
  username={user.username}
  size={rank === 1 ? 66 : 48}
/>
</View>

<View style={{ marginTop: 3, alignItems: 'center' }}>

  {/* Badge de rang PRO */}
  <View
    style={[
      styles.rankBadge,
      { backgroundColor: getPodiumColor(rank) }
    ]}
  >
    <Text style={styles.rankBadgeText}>{rank}</Text>
  </View>

  {/* Pseudo (1 ligne max, stable) */}
  <Text
    style={styles.podiumName}
    numberOfLines={1}
    ellipsizeMode="tail"
  >
    {user.username}
  </Text>

</View>
    </TouchableOpacity>
  );
}

export default function LeaderBoardScreen({ navigation, userId }) {
  const [selectedTab, setSelectedTab] = useState('created');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

const goToProfile = (uid) => {
  if (!uid) return;
  navigation.navigate('UserProfile', { userId: uid });
};

const fetchLeaderboard = async () => {
  setLoading(true);
  const monthStart = getMonthStartDate();

  // 1️⃣ TOP 30 – affichage du classement
  const { data, error } = await supabase
    .from('monthly_leaderboard')
    .select(`
      count,
      user_id,
      users:user_id (
        username,
        profile_photo
      )
    `)
    .eq('type', selectedTab)
    .eq('month', monthStart)
    .order('count', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Erreur leaderboard:', error);
  }

  // 2️⃣ Calcul du rang personnel (tous les utilisateurs)
  let myData = null;

  if (userId) {
    const { data: all, error: allError } = await supabase
      .from('monthly_leaderboard')
      .select('user_id, count')
      .eq('type', selectedTab)
      .eq('month', monthStart)
      .order('count', { ascending: false });

    if (allError) {
      console.error('Erreur rang perso:', allError);
    }

    if (all && all.length > 0) {
      const foundIndex = all.findIndex(x => x.user_id === userId);
      if (foundIndex > -1) {
        myData = {
          rank: foundIndex + 1,
          count: all[foundIndex].count,
        };
      }
    }
  }

  setLeaderboard(data || []);
  setMyRank(myData);
  setLoading(false);
};

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedTab, userId]);

useFocusEffect(
  React.useCallback(() => {
    fetchLeaderboard();
  }, [selectedTab])
);

  // ==== Podium extraction (places 1 à 3) ====
  const podium = [
    leaderboard[1] ? { ...leaderboard[1], rank: 2 } : null,
    leaderboard[0] ? { ...leaderboard[0], rank: 1 } : null,
    leaderboard[2] ? { ...leaderboard[2], rank: 3 } : null
  ];
  // ==== Liste hors podium (places 4 à 30) ====
  const rest = leaderboard.slice(3);

  // ** Étendre à 10 places **
  const nbPlaceholders = Math.max(0, 10 - (rest.length + 3));
  const tableRange = Array.from({ length: Math.min(rest.length, 27) }, (_, i) => i);
  const placeholdersRange = Array.from({ length: nbPlaceholders }, (_, i) => i);

  const currentTab = TABS.find(t => t.key === selectedTab);

const LeaderboardRow = ({ user, userId, rank, count }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => goToProfile(userId)}
    style={styles.listRow}
  >
    <View style={styles.rankBox}>
      <Text style={[styles.rankNum, rank < 3 && { color: getPodiumColor(rank + 1) }]}>{rank + 1}</Text>
    </View>
<Avatar
  photo={user?.profile_photo}
  username={user?.username || user?.prenom}
  size={36}
  style={styles.listAvatar}
/>
    <Text style={styles.listName} numberOfLines={1}>{user?.prenom || user?.username || '—'}</Text>
<View style={styles.sessionBadge}>
  <MaterialCommunityIcons
    name={selectedTab === 'created' ? 'plus-circle-outline' : 'account-group-outline'}
    size={14}
    color={COLORS.accent}
  />
  <Text style={styles.sessionBadgeText}>
    {count}
  </Text>
</View>
  </TouchableOpacity>
);

  const LeaderboardPlaceholderRow = ({ rank }) => (
    <View style={styles.listRow}>
      <View style={styles.rankBox}><Text style={styles.rankNum}>{rank + 4}</Text></View>
      <View style={[styles.listAvatar, { backgroundColor: "#f2f2f2" }]} />
      <Text style={[styles.listName, { color: "#bbb" }]}>—</Text>
      <View style={styles.listScoreBox}><Text style={styles.listScore}>—</Text></View>
    </View>
  );

const windowHeight = Dimensions.get('window').height;
const maxContainerHeight = windowHeight * 0.82;

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
    <GeneralCollectiveBanner onPress={() => navigation.navigate('CollectiveChallenges')} />
<LinearGradient
  colors={['#fffefa', '#fff6e7', '#f7f3ff']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[
    styles.floatContainer,
    {
      maxHeight: maxContainerHeight,
      flexShrink: 1,
      marginTop: 10,
      marginBottom: 4,
    }
  ]}
>
<View style={styles.tabBar}>
  {TABS.map(tab => {
    const isActive = selectedTab === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        onPress={() => setSelectedTab(tab.key)}
        activeOpacity={0.9}
        style={{ flex: 1, marginHorizontal: 6 }}
      >
        {isActive ? (
          <LinearGradient
            colors={['#FF914D', '#FF4D97']} // 🔥 Dégradé Unite
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabBtnGradient}
          >
            <Text style={[styles.tabLabel, { color: '#fff', fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.tabBtn}>
            <Text style={[styles.tabLabel, { color: '#555' }]}>{tab.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  })}
</View>

<View style={styles.podiumContainer}>
  <PodiumUser
    user={podium[0]?.users}
    userId={podium[0]?.user_id}
    rank={2}
    count={podium[0]?.count}
    onPress={goToProfile}
  />
  <PodiumUser
    user={podium[1]?.users}
    userId={podium[1]?.user_id}
    rank={1}
    count={podium[1]?.count}
    onPress={goToProfile}
  />
  <PodiumUser
    user={podium[2]?.users}
    userId={podium[2]?.user_id}
    rank={3}
    count={podium[2]?.count}
    onPress={goToProfile}
  />
</View>
      {/* Classement scrollable */}
      <ScrollView
        style={{ maxHeight: maxContainerHeight * 0.54 }} // Adapte si tu veux plus de place pour la liste
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderRank}>#</Text>
            <Text style={styles.tableHeaderUser}>Utilisateur</Text>
            <Text style={styles.tableHeaderScore}>Sessions</Text>
          </View>
{tableRange.map(index =>
  <LeaderboardRow
    key={rest[index]?.user_id || index}
    user={rest[index]?.users}
    userId={rest[index]?.user_id}
    rank={index + 3}
    count={rest[index]?.count}
  />
)}
          {placeholdersRange.map(i =>
            <LeaderboardPlaceholderRow key={i + rest.length} rank={rest.length + i} />
          )}
          {rest.length + 3 === 0 && (
            <Text style={styles.emptyMsg}>Aucun membre classé ce mois-ci</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
    {myRank && (
      <View style={styles.stickyMyRank}>
        <Text style={{ fontWeight: 'bold', color: COLORS.accent, fontSize: 15 }}>
          Tu es {myRank.rank}ᵉ ce mois-ci ! Continue 💪
        </Text>
        <Text style={{ color: '#555', fontSize: 13 }}>Sessions ce mois : {myRank.count}</Text>
      </View>
    )}
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  floatContainer: {
    backgroundColor: "#fff",
    borderRadius: wp('7.2%'),
    marginHorizontal: wp('2.6%'),
    marginTop: hp('1.2%'),
    paddingVertical: hp('1.7%'),
    paddingHorizontal: wp('2.1%'),
    marginBottom: hp('1.2%'),
    shadowColor: "#312783",
    shadowOpacity: 0.09,
    shadowRadius: wp('4.2%'),
    elevation: 6,
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: hp('0.3%'),
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
    marginTop: hp('1.2%'),
    gap: wp('2.7%'),
  },
  tabBtn: {
    paddingHorizontal: wp('4.5%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('3.7%'),
    backgroundColor: COLORS.gray,
    marginHorizontal: wp('0.5%'),
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabLabel: {
    color: '#555',
    fontSize: wp('4.2%'),
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '900',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: hp('1.2%'),
    marginHorizontal: wp('2.6%'),
    minHeight: hp('11.2%'),
    gap: wp('2.1%'),
  },
  podiumUser: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: wp('0.2%'),
  },
  podiumAvatar: {
    width: wp('12.3%'),
    height: wp('12.3%'),
    borderRadius: wp('8.2%'),
    borderWidth: 3,
    marginBottom: hp('0.2%'),
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: wp('2.5%'),
    elevation: 4,
  },
  podiumGoldAvatar: {
    width: wp('17%'),
    height: wp('17%'),
    borderRadius: wp('9%'),
    borderWidth: 4,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.22,
    shadowRadius: wp('3.9%'),
    marginBottom: hp('0.2%'),
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 9,
  },
  podiumMedalBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -hp('0.2%'),
    marginBottom: -hp('0.5%'),
    minHeight: hp('2.9%'),
  },
  medal: {
    textShadowColor: '#fff',
    textShadowRadius: 4,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  podiumName: {
    fontWeight: '600',
    fontSize: wp('3.8%'),
    color: COLORS.text,
    marginBottom: hp('0.13%'),
    textAlign: 'center',
    maxWidth: wp('24%'),
  },
  podiumScoreBox: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: wp('2.7%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('2.3%'),
    marginTop: hp('0.2%'),
  },
  podiumScore: {
    color: "#fff",
    fontWeight: 'bold',
    fontSize: wp('4%'),
    textAlign: 'center'
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('3.3%'),
    backgroundColor: "#fff",
    borderRadius: wp('3.1%'),
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginBottom: hp('0.3%'),
    marginTop: hp('0.3%'),
    paddingVertical: hp('1%'),
    shadowColor: "#222",
    shadowOpacity: 0.03,
    shadowRadius: wp('0.6%'),
    elevation: 1,
  },
  tableHeaderRank: {
    width: wp('11%'),
    fontWeight: 'bold',
    color: '#bbb',
    fontSize: wp('4.2%'),
    textAlign: 'center'
  },
  tableHeaderUser: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: wp('4.2%'),
    color: '#555'
  },
  tableHeaderScore: {
    width: wp('19%'),
    fontWeight: 'bold',
    fontSize: wp('4.2%'),
    color: '#555',
    textAlign: 'center',
    marginRight: wp('3.8%'),
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fff",
    marginHorizontal: wp('3.3%'),
    paddingVertical: hp('1.3%'),
    marginBottom: hp('0.9%'),
    borderRadius: wp('3.4%'),
    borderWidth: 1,
    borderColor: COLORS.gray,
    shadowColor: "#222",
    shadowOpacity: 0.04,
    shadowRadius: wp('0.6%'),
    elevation: 1,
  },
  rankBox: {
    width: wp('11%'),
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankNum: {
    fontWeight: 'bold',
    fontSize: wp('4%'),
    color: '#aaa',
    textAlign: 'center',
  },
  listAvatar: {
    width: wp('9.2%'),
    height: wp('9.2%'),
    borderRadius: wp('4.7%'),
    marginRight: wp('3.4%'),
    borderWidth: 1,
    borderColor: "#fff"
  },
  listName: {
    flex: 1,
    fontWeight: '600',
    fontSize: wp('4%'),
    color: COLORS.text
  },
  listScoreBox: {
    minWidth: wp('10%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: wp('2.3%'),
    paddingHorizontal: wp('1.8%'),
    paddingVertical: hp('0.4%'),
    marginRight: wp('3.8%'),
  },
  listScore: {
    fontWeight: 'bold',
    color: COLORS.accent,
    fontSize: wp('4%'),
    textAlign: 'center'
  },
  emptyMsg: {
    textAlign: 'center',
    color: '#bbb',
    marginTop: hp('2.3%'),
    fontSize: wp('4%'),
    fontStyle: 'italic'
  },
  stickyMyRank: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: hp('1.2%'),
    alignItems: 'center',
    backgroundColor: '#fff8f1',
    padding: hp('1.7%'),
    borderRadius: wp('4.7%'),
    marginHorizontal: wp('5.7%'),
    shadowColor: COLORS.accent,
    shadowOpacity: 0.07,
    shadowRadius: wp('1.8%'),
    borderWidth: 1,
    borderColor: '#FFE0C0',
  },
  heroBannerCompactWrap: {
    marginTop: hp('1.7%'),
    marginBottom: hp('0.1%'),
    alignItems: 'center',
    width: '100%',
  },
  heroBannerCompact: {
    width: wp('86%'),
    alignSelf: 'center',
    borderRadius: wp('4.5%'),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4.5%'),
    minHeight: hp('5%'),
    elevation: 1,
    shadowColor: '#8f50ff',
    shadowOpacity: 0.10,
    shadowRadius: wp('2.4%'),
    shadowOffset: { width: 0, height: 2 },
  },
  heroTitleCompact: {
    color: "#fff",
    fontWeight: 'bold',
    fontSize: wp('3.7%'),
    marginBottom: 0,
    marginTop: hp('0.1%'),
    textAlign: "center",
  },
  heroDescCompact: {
    color: "#eae6ff",
    fontSize: wp('2.6%'),
    fontWeight: "600",
    letterSpacing: 0.01,
    textAlign: "center",
    marginTop: 0,
    lineHeight: hp('1.7%'),
    maxWidth: wp('65%'),
  },
  tabBtn: {
  paddingVertical: 10,
  borderRadius: 20,
  backgroundColor: '#EAEAEA',
  alignItems: 'center',
  justifyContent: 'center',
},

tabBtnGradient: {
  paddingVertical: 10,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
},

tabLabel: {
  fontSize: 15,
  fontWeight: '700',
},
podiumStat: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 12,
  marginTop: 4,
},
podiumStatText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#333',
  marginLeft: 4,
},
rankBadge: {
  width: 22,
  height: 22,
  borderRadius: 11,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 4,
},
rankBadgeText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '700',
},
podiumName: {
  maxWidth: 80, // clé de la stabilité
  textAlign: 'center',
  fontWeight: '600',
  fontSize: 12,
  color: '#222',
},
sessionBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF4EB',
  borderRadius: 16,
  paddingHorizontal: 10,
  paddingVertical: 4,
  minWidth: 44,
  marginRight: wp('3.8%'),
},

sessionBadgeText: {
  marginLeft: 4,
  fontSize: wp('3.6%'),
  fontWeight: '700',
  color: COLORS.accent,
},
});
