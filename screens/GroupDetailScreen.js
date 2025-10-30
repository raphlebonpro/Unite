import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  notifyGroupJoinedSelf,
  notifyGroupMemberJoined,
  notifyGroupLeftSelf,
  notifyGroupMemberLeft,
  notifyGroupExclusion,
} from "../helpers/notifications";
import Toast from "react-native-toast-message";

export default function GroupDetailScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { groupId } = route.params;

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [groupSessions, setGroupSessions] = useState([]);

useEffect(() => {
  // --- Fonction pour charger les sessions actives du groupe ---
  const fetchSessions = async () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const nowHM = `${hh}:${mm}`;

    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, date, time, sport, location")
      .eq("group_id", groupId)
      .or(`date.gt.${today},and(date.eq.${today},time.gte.${nowHM})`)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (!error) setGroupSessions(data || []);
    else console.error("fetchSessions error:", error);
  };

  // --- 1️⃣ Fetch initial ---
  fetchSessions();

  // --- 2️⃣ Canal Realtime ---
  const channel = supabase
    .channel("sessions-group-realtime")
    .on(
      "postgres_changes",
      {
        event: "*", // insert / update / delete
        schema: "public",
        table: "sessions",
        filter: `group_id=eq.${groupId}`,
      },
      () => {
        // Recharge la liste à chaque changement
        fetchSessions();
      }
    )
    .subscribe();

  // --- 3️⃣ Cleanup du canal quand on quitte la page ---
  return () => {
    supabase.removeChannel(channel);
  };
}, [groupId]);

  // --- Fetch group & members ---
const fetchData = async () => {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);

    // === 1. Récupère les infos du groupe ===
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("id, name, description, sport, city, cover_url, creator_id, created_at")
      .eq("id", groupId)
      .maybeSingle();

if (groupError || !groupData) {
  console.warn("⚠️ Groupe introuvable ou supprimé", groupError);
  setLoading(false);
  return;
}

    setIsCreator(groupData.creator_id === user?.id);

    // === 2. Récupère les infos du créateur ===
    const { data: creatorData, error: creatorError } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", groupData.creator_id)
      .single();

    if (creatorError) console.warn("Erreur récupération créateur:", creatorError);

    // === 3. Ajoute le pseudo du créateur dans l'objet groupe ===
    setGroup({
      ...groupData,
      creator_username: creatorData?.username || "Créateur inconnu",
    });

    // === 4. Récupère les membres ===
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select(`
        user_id,
        role,
        users!group_members_user_id_fkey (
          id,
          username,
          profile_photo
        )
      `)
      .eq("group_id", groupId);

    if (memberError) console.error(memberError);

    const membersList = (memberData || []).map((m) => ({
      id: m.user_id,
      username: m.users?.username || "Utilisateur",
      avatar: m.users?.profile_photo || null,
      role: m.role,
    }));

    // === 5. Ajoute le créateur si manquant ===
    if (!membersList.find((m) => m.id === groupData.creator_id) && creatorData) {
      membersList.unshift({
        id: creatorData.id,
        username: creatorData.username || "Créateur",
        avatar: null,
        role: "admin",
      });
    }

    setMembers(membersList);
    setIsMember(membersList.some((m) => m.id === user?.id));
  } catch (err) {
    console.error("Erreur fetchData:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchData(); }, [groupId]);

  // --- Actions ---
// === HANDLE JOIN AVEC ANTI-SPAM ===
const handleJoin = async () => {
  Alert.alert(
    "Rejoindre le groupe",
    `Souhaites-tu rejoindre le groupe "${group.name}" ?`,
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Rejoindre",
        onPress: async () => {
          // 🔹 Vérifie s’il a été exclu
          const { data: kicked } = await supabase
            .from("group_kicked")
            .select("id")
            .eq("group_id", groupId)
            .eq("user_id", userId)
            .maybeSingle();

          if (kicked) {
            return Alert.alert(
              "Accès refusé",
              "Tu as été exclu de ce groupe. Tu ne peux plus le rejoindre."
            );
          }

          // 🔹 Anti-spam : empêche de rejoindre trop vite après avoir quitté
          const { data: lastLeave } = await supabase
            .from("group_leaves")
            .select("created_at")
            .eq("group_id", groupId)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastLeave) {
            const diffMinutes = (Date.now() - new Date(lastLeave.created_at).getTime()) / 60000;
            if (diffMinutes < 30) {
              return Alert.alert(
                "Trop tôt",
                "Tu viens de quitter ce groupe. Tu pourras le rejoindre dans environ 30 minutes."
              );
            }
          }

          // 🔹 Ajoute le membre
          const { error } = await supabase
            .from("group_members")
            .insert([{ group_id: groupId, user_id: userId, role: "member" }]);

          if (error) {
            Alert.alert("Erreur", "Impossible de rejoindre le groupe.");
            return;
          }

          // 🔹 Notifications
          await notifyGroupJoinedSelf({ userId, groupName: group.name, groupId });

          const { data: userData } = await supabase
            .from("users")
            .select("username")
            .eq("id", userId)
            .single();

          const otherIds = members.map((m) => m.id).filter((id) => id !== userId);
          if (otherIds.length > 0) {
            await notifyGroupMemberJoined({
              memberName: userData?.username || "Un membre",
              groupName: group.name,
              groupId,
              otherMemberIds: otherIds,
            });
          }

          fetchData();

          Toast.show({
            type: "success",
            text1: "Bienvenue 👋",
            text2: `Tu as rejoint le groupe "${group.name}".`,
            position: "top",
            topOffset: 48,
            visibilityTime: 2500,
          });
        },
      },
    ]
  );
};

// === HANDLE LEAVE AVEC LOG + NOTIFS ===
const handleLeave = async () => {
  Alert.alert(
    "Quitter le groupe",
    `Souhaites-tu vraiment quitter le groupe "${group.name}" ?`,
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("group_members")
            .delete()
            .eq("group_id", groupId)
            .eq("user_id", userId);

          if (error) {
            Alert.alert("Erreur", "Impossible de quitter le groupe.");
            return;
          }

          // 🔹 Log du départ (anti-spam)
          await supabase
            .from("group_leaves")
            .insert([{ group_id: groupId, user_id: userId }]);

          // 🔹 Notifications
          await notifyGroupLeftSelf({ userId, groupName: group.name, groupId });

          const remaining = members.map((m) => m.id).filter((id) => id !== userId);
          if (remaining.length > 0) {
            await notifyGroupMemberLeft({
              memberName:
                members.find((m) => m.id === userId)?.username || "Un membre",
              groupName: group.name,
              groupId,
              otherMemberIds: remaining,
            });
          }

          fetchData();

          Toast.show({
            type: "info",
            text1: "Groupe quitté 👋",
            text2: `Tu as quitté le groupe "${group.name}".`,
            position: "top",
            topOffset: 48,
            visibilityTime: 2500,
          });
        },
      },
    ]
  );
};

  if (loading || !group) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color="#FF5361" />
    </View>
  );
}

 return (
  <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
    {/* === COUVERTURE === */}
    <View style={styles.coverContainer}>
      {group.cover_url ? (
        <Image
          key={group.cover_url}
          source={{ uri: group.cover_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.coverImage, { backgroundColor: "#ccc" }]} />
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={styles.coverOverlay}
      />
<View style={styles.coverContent}>
  <Text style={styles.groupName}>{group.name}</Text>
  <View style={styles.groupMeta}>
    <Text style={styles.metaSubText}>
      Créé le {new Date(group.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}
      {"  •  "}
    </Text>
    <TouchableOpacity
      onPress={() => nav.navigate("UserProfile", { userId: group.creator_id })}
      activeOpacity={0.8}
    >
      <Text style={[styles.metaSubText, { fontWeight: "700", textDecorationLine: "underline" }]}>
        {group.creator_username}
      </Text>
    </TouchableOpacity>
  </View>
</View>
    </View>

    {/* === LIEU / SPORT === */}
    <View style={styles.metaContainer}>
      <View style={styles.metaRow}>
        <View style={styles.metaTag}>
          <Feather name="map-pin" size={15} color="#fff" />
          <Text style={styles.metaText}>{group.city || "Lieu non défini"}</Text>
        </View>
        <View style={[styles.metaTag, { backgroundColor: "#FF6C4A" }]}>
          <MaterialCommunityIcons name="dumbbell" size={15} color="#fff" />
          <Text style={styles.metaText}>{group.sport || "Sport"}</Text>
        </View>
      </View>
    </View>

    {/* === DESCRIPTION === */}
    {group.description ? (
      <View style={styles.descContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descText}>{group.description}</Text>
      </View>
    ) : null}

    {/* === MEMBRES === */}
    <View style={styles.infoContainer}>
      <Text style={styles.sectionTitle}>Membres ({members.length})</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12 }}
      >
        {members.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.memberItem}
            activeOpacity={0.8}
            onPress={() => nav.navigate("UserProfile", { userId: m.id })}
          >
            <Image
              source={
                m.avatar
                  ? { uri: m.avatar }
                  : require("../assets/avatar-placeholder.png")
              }
              style={styles.memberAvatar}
            />
            <Text numberOfLines={1} style={styles.memberName}>
              {m.username}
            </Text>
            {/* --- Bouton Exclure (visible uniquement pour le créateur) --- */}
{isCreator && m.id !== userId && (
  <TouchableOpacity
    style={{
      marginTop: 3,
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: '#d92e3f',
      borderRadius: 7,
    }}
    activeOpacity={0.8}
    onPress={() => {
      Alert.alert(
        "Exclure ce membre ?",
        `Tu vas retirer ${m.username} de ce groupe.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Exclure",
            style: "destructive",
onPress: async () => {
  try {
    // 1️⃣ Ajoute le membre à la table group_kicked
    const { error: kickErr } = await supabase
      .from('group_kicked')
      .insert([{ group_id: groupId, user_id: m.id }]);

    if (kickErr && kickErr.code !== '23505') {
      console.warn('Erreur insertion group_kicked:', kickErr);
    }

    // 2️⃣ Supprime le membre du groupe
    const { error: delErr } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', m.id);

    if (delErr) {
      console.warn('Erreur suppression group_member:', delErr);
      Alert.alert('Erreur', "Impossible d'exclure ce membre.");
      return;
    }

    // 3️⃣ MAJ optimiste immédiate de la liste
    setMembers(prev => prev.filter(u => u.id !== m.id));

    // 4️⃣ Notifications
    await notifyGroupExclusion({
      excludedId: m.id,
      excludedName: m.username,
      groupName: group.name,
      groupId: groupId,
      creatorId: userId,
      otherMemberIds: members
        .map(x => x.id)
        .filter(id => id !== m.id && id !== userId),
    });

    // 5️⃣ Toast feedback
    Toast.show({
      type: 'success',
      text1: 'Membre exclu',
      text2: `${m.username} a été retiré du groupe.`,
      position: 'top',
      topOffset: 48,
      visibilityTime: 2500,
    });

    // 6️⃣ Refresh à la fin pour être synchro avec la BDD
    fetchData();
  } catch (e) {
    console.error('Erreur exclusion membre:', e);
    Alert.alert('Erreur', "Impossible d'exclure ce membre.");
  }
}
          },
        ]
      );
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
      Exclure
    </Text>
  </TouchableOpacity>
)}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

{/* === SESSIONS DU GROUPE === */}
<View style={styles.sessionsContainer}>
  <Text style={styles.sectionTitle}>Sessions du groupe</Text>

{isMember ? (
  <>
{groupSessions.length > 0 ? (
  groupSessions.map((s) => (
    <TouchableOpacity
      key={s.id}
      onPress={() => nav.navigate("GroupSessionDetail", {
  sessionId: s.id,
  groupName: group.name,
})}
      activeOpacity={0.9}
      style={styles.sessionCard}
    >
      <LinearGradient
        colors={["#FFFFFF", "#FAFAFA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sessionCardInner}
      >
        <View style={{ flex: 1 }}>
          {/* Ligne 1 : titre + sport */}
          <View style={styles.sessionHeaderRow}>
            <Text style={styles.sessionCardTitle} numberOfLines={1}>
              {s.title}
            </Text>
            {s.sport && (
              <View style={styles.sportBadge}>
                <Text style={styles.sportBadgeText}>{s.sport}</Text>
              </View>
            )}
          </View>

          {/* Ligne 2 : date + heure */}
          <View style={[styles.sessionInfoRow, { marginTop: 6 }]}>
            <Feather name="calendar" size={15} color="#FF6C4A" />
            <Text style={styles.sessionInfoText}>
              {new Date(s.date).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "2-digit",
                month: "long",
              })}{" "}
              • {s.time || "Heure à venir"}
            </Text>
          </View>

          {/* Ligne 3 : lieu */}
          {s.location && (
            <View style={[styles.sessionInfoRow, { marginTop: 4 }]}>
              <Feather name="map-pin" size={15} color="#FF9D3C" />
              <Text
                style={[styles.sessionInfoText, { color: "#666" }]}
                numberOfLines={1}
              >
                {s.location}
              </Text>
            </View>
          )}
        </View>

        <Feather name="chevron-right" size={20} color="#999" />
      </LinearGradient>
    </TouchableOpacity>
  ))
) : (
  <Text style={styles.emptyText}>Aucune session active pour l’instant</Text>
)}

    <TouchableOpacity
      style={{ marginTop: 24 }}
      onPress={() => nav.navigate("CreateSessionGroup", { groupId })}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientInner}
      >
        <Feather name="plus-circle" size={17} color="#fff" />
        <Text style={styles.gradientText}>Créer une session de groupe</Text>
      </LinearGradient>
    </TouchableOpacity>
  </>
) : (
  <Text style={[styles.emptyText, { marginTop: 8 }]}>
    Rejoins le groupe pour voir ou créer ses sessions.
  </Text>
)}
</View>

    {/* === BOUTONS ACTION === */}
<View style={styles.actionsContainer}>
  {isCreator ? (
    <>
      {/* --- Discussion du groupe --- */}
      <TouchableOpacity
        style={styles.gradientBtn}
        onPress={() => nav.navigate("GroupChat", { groupId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#1877F2", "#549BFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          <Feather name="message-square" size={17} color="#fff" />
          <Text style={styles.gradientText}>Discussion du groupe</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* --- Modifier le groupe --- */}
      <TouchableOpacity
        style={[styles.gradientBtn, { marginTop: 22 }]}
        onPress={() => nav.navigate("EditGroup", { groupId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#4E65FF", "#7C83FD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          <Feather name="edit-3" size={17} color="#fff" />
          <Text style={styles.gradientText}>Modifier le groupe</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  ) : isMember ? (
    <>
      {/* --- Discussion du groupe --- */}
      <TouchableOpacity
        style={styles.gradientBtn}
        onPress={() => nav.navigate("GroupChat", { groupId })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#1877F2", "#549BFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          <Feather name="message-square" size={17} color="#fff" />
          <Text style={styles.gradientText}>Discussion du groupe</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* --- Quitter le groupe --- */}
      <TouchableOpacity
        style={[styles.gradientBtn, { marginTop: 12 }]}
        onPress={handleLeave}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#2E3A59", "#3F4C6B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          <Feather name="log-out" size={17} color="#fff" />
          <Text style={styles.gradientText}>Quitter le groupe</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  ) : (
    <TouchableOpacity
      style={styles.gradientBtn}
      onPress={handleJoin}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientInner}
      >
        <Feather name="user-plus" size={17} color="#fff" />
        <Text style={styles.gradientText}>Rejoindre le groupe</Text>
      </LinearGradient>
    </TouchableOpacity>
  )}
</View>
  </ScrollView>
 );
 }

const styles = StyleSheet.create({
  coverContainer: { height: 230, position: "relative" },
  coverImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  coverOverlay: { ...StyleSheet.absoluteFillObject },
  coverContent: {
    position: "absolute",
    bottom: 24,
    left: 20,
  },
  groupName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metaContainer: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF375E",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13.5,
  },
  descContainer: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  descText: {
    color: "#333",
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 6,
  },
  infoContainer: { padding: 18 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  memberItem: { alignItems: "center", marginRight: 16 },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
    backgroundColor: "#eee",
  },
  memberName: {
    fontSize: 12.5,
    maxWidth: 70,
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
  },
  actionsContainer: {
    paddingHorizontal: 18,
    marginTop: 10,
  },
  gradientBtn: {
    width: "100%",
  },
  gradientInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradientText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  groupMeta: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 6,
  flexWrap: "wrap",
},
metaSubText: {
  color: "#f5f5f5",
  fontSize: 13.5,
  opacity: 0.95,
},
sessionsContainer: {
  paddingHorizontal: 18,
  paddingTop: 16,
  paddingBottom: 10,
},
sessionItem: {
  backgroundColor: "#fff",
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 10,
  borderWidth: 1,
  borderColor: "#EAEAEA",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
},
sessionTitle: {
  fontSize: 15.5,
  fontWeight: "600",
  color: "#222",
},
sessionMeta: {
  fontSize: 13,
  color: "#666",
  marginTop: 2,
},
emptyText: {
  color: "#888",
  fontSize: 14,
  marginTop: 8,
  fontStyle: "italic",
},
sessionCard: {
  borderRadius: 16,
  overflow: "hidden",
  marginTop: 14,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
  borderWidth: 1,
  borderColor: "#E9E9E9",
},
sessionCardInner: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 14,
  paddingHorizontal: 16,
  backgroundColor: "#fff",
},
sessionCardTitle: {
  fontSize: 16.5,
  fontWeight: "700",
  color: "#1E1E1E",
  marginBottom: 8,
},
sessionInfoRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},
sessionInfoText: {
  fontSize: 13.5,
  color: "#444",
  fontWeight: "500",
},
sessionArrow: {
  marginLeft: 10,
},
sessionTopLine: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
sessionHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
sportBadge: {
  backgroundColor: "#FFE9EC",
  borderRadius: 8,
  paddingHorizontal: 8,
  paddingVertical: 3,
},
sportBadgeText: {
  color: "#FF375E",
  fontSize: 12.5,
  fontWeight: "600",
},
sessionCompactText: {
  fontSize: 13.5,
  color: "#444",
  marginTop: 6,
  lineHeight: 20,
},
});