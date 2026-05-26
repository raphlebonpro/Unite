import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Animated,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  notifyGroupJoinedSelf,
  notifyGroupMemberJoined,
  notifyGroupLeftSelf,
  notifyGroupMemberLeft,
  notifyGroupJoinRequestReceived,
  notifyGroupExclusion,
  notifyGroupJoinRequestAccepted,
  notifyGroupJoinRequestRejected,
} from "../helpers/notifications";
import { useAppForeground } from '../context/AppForegroundContext';


// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const COVER_HEIGHT = 210;
const HEADER_HEIGHT = 56;

const LETTER_COLORS = [
  "#4A90E2","#50E3C2","#F5A623","#9013FE","#D0021B",
  "#7ED321","#BD10E0","#FF3366","#00BCD4","#FF9800",
];

const GROUP_TYPES = [
  { value: "Communauté",  icon: "people-outline",   color: "#3888FF" },
  { value: "Club",        icon: "shield-outline",   color: "#7367F0" },
  { value: "BDE",         icon: "school-outline",   color: "#F5A623" },
  { value: "Événement",   icon: "calendar-outline", color: "#E9436D" },
  { value: "Association", icon: "ribbon-outline",   color: "#2ECC71" },
  { value: "Amis",        icon: "heart-outline",    color: "#FF6B9D" },
];

const PRIVACY_META = {
  open:    { label: "Ouvert",      icon: "earth-outline",            color: "#2ECC71" },
  request: { label: "Sur demande", icon: "checkmark-circle-outline", color: "#F5A623" },
  private: { label: "Fermé",       icon: "lock-closed-outline",      color: "#E53935" },
};

const TABS = [
  { key: "info",     label: "Infos",    icon: "information-circle-outline" },
  { key: "sessions", label: "Sessions", icon: "calendar-outline" },
  { key: "membres",  label: "Membres",  icon: "people-outline" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getColorFromUsername(username = "") {
  if (!username) return "#4A90E2";
  return LETTER_COLORS[(username.charCodeAt(0) - 65) % LETTER_COLORS.length];
}

const Avatar = ({ uri, username, size = 44 }) => {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: getColorFromUsername(username), alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.42 }}>{username?.charAt(0)?.toUpperCase() || "?"}</Text>
    </View>
  );
};

const getGroupRecurrenceLabel = (sessions) => {
  if (!sessions || sessions.length < 2) return null;
  const sorted = [...sessions].slice(0, 3);
  const days  = sorted.map(s => new Date(`${s.date}T${s.time}`).getDay());
  const times = sorted.map(s => s.time?.slice(0, 5));
  if (!days.every(d => d === days[0]) || !times.every(t => t === times[0])) return null;
  const dayName = new Date(`${sorted[0].date}T00:00`).toLocaleDateString("fr-FR", { weekday: "long" });
  return `Tous les ${dayName}s à ${times[0]}`;
};

const SectionLabel = ({ icon, title, action, onAction }) => (
  <View style={sl.row}>
    <Ionicons name={icon} size={16} color="#FE5D02" style={{ marginRight: 7 }} />
    <Text style={sl.title}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={sl.action}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);
const sl = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title:  { flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  action: { fontSize: 13, fontWeight: "600", color: "#FE5D02" },
});

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const nav    = useNavigation();
  const route  = useRoute();
  const insets = useSafeAreaInsets();
  const { groupId } = route.params;

  const scrollY   = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState("info");

  const [group,         setGroup]         = useState(null);
  const [members,       setMembers]       = useState([]);
  const [userId,        setUserId]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [isCreator,     setIsCreator]     = useState(false);
  const [isMember,      setIsMember]      = useState(false);
  const [groupSessions, setGroupSessions] = useState([]);

  const [joinRequests,      setJoinRequests]      = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const nextSession     = groupSessions[0] || null;
  const otherSessions   = groupSessions.slice(1);
  const recurrenceLabel = getGroupRecurrenceLabel(groupSessions);

  const [routines, setRoutines] = useState([]);

  // ── Cover parallax ──
  const coverTranslate = scrollY.interpolate({ inputRange: [-100, 0, COVER_HEIGHT], outputRange: [-30, 0, 60], extrapolate: "clamp" });
  const coverOpacity   = scrollY.interpolate({ inputRange: [0, COVER_HEIGHT * 0.6], outputRange: [1, 0], extrapolate: "clamp" });
  const headerOpacity  = scrollY.interpolate({ inputRange: [COVER_HEIGHT - 80, COVER_HEIGHT - 20], outputRange: [0, 1], extrapolate: "clamp" });

  // ── Sessions realtime ──
  useEffect(() => {
    const fetchSessions = async () => {
      const now   = new Date();
      const today = now.toISOString().slice(0, 10);
      const nowHM = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const { data } = await supabase
        .from("sessions")
        .select("id, title, date, time, sport, location, level")
        .eq("group_id", groupId)
        .or(`date.gt.${today},and(date.eq.${today},time.gte.${nowHM})`)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      setGroupSessions(data || []);
    };
    fetchSessions();
    const channel = supabase.channel(`sessions-group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `group_id=eq.${groupId}` }, fetchSessions)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [groupId]);

  useEffect(() => {
  if (!isCreator || group?.privacy !== "request") return;
 
  const channel = supabase
    .channel(`join-requests-${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "group_join_requests",
        filter: `group_id=eq.${groupId}`,
      },
      () => fetchRequests()
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "group_join_requests",
        filter: `group_id=eq.${groupId}`,
      },
      () => fetchRequests()
    )
    .subscribe();
 
  return () => supabase.removeChannel(channel);
}, [isCreator, group?.privacy, groupId]);

const fetchData = useCallback(async (silent = false) => {
  try {
    if (!silent) setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);
 
    const { data: groupData, error } = await supabase
      .from("groups")
      .select("id, name, description, sport, city, cover_url, creator_id, created_at, privacy, group_type, external_link")
      .eq("id", groupId)
      .maybeSingle();
 
    if (error || !groupData) { setLoading(false); return; }
 
    const isCreatorNow = groupData.creator_id === user?.id;
    setIsCreator(isCreatorNow);
 
    const { data: creatorData } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", groupData.creator_id)
      .single();
 
    setGroup({ ...groupData, creator_username: creatorData?.username || "Créateur inconnu" });
 
    const { data: memberData } = await supabase
      .from("group_members")
      .select(`user_id, role, users!group_members_user_id_fkey(id, username, profile_photo)`)
      .eq("group_id", groupId);
 
    const list = (memberData || []).map(m => ({
      id: m.user_id,
      username: m.users?.username || "Utilisateur",
      avatar: m.users?.profile_photo || null,
      role: m.role,
    }));
    if (!list.find(m => m.id === groupData.creator_id) && creatorData) {
      list.unshift({ id: creatorData.id, username: creatorData.username || "Créateur", avatar: null, role: "admin" });
    }
    setMembers(list);
    setIsMember(list.some(m => m.id === user?.id));

    const { data: routinesData } = await supabase
  .from('group_routines')
  .select('*')
  .eq('group_id', groupId)
  .eq('active', true)
  .order('created_at', { ascending: false });
setRoutines(routinesData || []);
 
    // ── Demandes en attente (hasPendingRequest pour le demandeur) ──
    if (user && groupData.privacy === "request") {
      const { data: req } = await supabase
        .from("group_join_requests")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      setHasPendingRequest(!!req);
    }
 
    // ── Charger les demandes d'adhésion si créateur ──
    if (isCreatorNow && groupData.privacy === "request") {
 
      // ÉTAPE 1 : récupérer les demandes sans join
      const { data: requests, error: reqError } = await supabase
        .from("group_join_requests")
        .select("id, created_at, user_id")
        .eq("group_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
 
      console.log("joinRequests:", requests, "| error:", reqError);
 
      if (requests && requests.length > 0) {
        // ÉTAPE 2 : récupérer les profils des demandeurs séparément
        const userIds = requests.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("users")
          .select("id, username, profile_photo")
          .in("id", userIds);
 
        const profileMap = Object.fromEntries(
          (profiles || []).map(p => [p.id, p])
        );
 
        // ÉTAPE 3 : fusionner et stocker
        setJoinRequests(
          requests.map(r => ({
            ...r,
            user: profileMap[r.user_id] || null,
          }))
        );
      } else {
        setJoinRequests([]);
      }
    }
 
  } catch (e) {
    console.error("fetchData error:", e);
  } finally {
    setLoading(false);
  }
}, [groupId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  useAppForeground(() => fetchData(true));

  // ── Demandes d'adhésion ──
const fetchRequests = useCallback(async () => {
  const { data, error } = await supabase
    .from("group_join_requests")
    .select("id, created_at, user_id, users(id, username, profile_photo)")
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Reformater pour garder la même shape qu'avant (req.user.xxx)
  const formatted = (data || []).map(r => ({
    ...r,
    user: r.users,
  }));

  setJoinRequests(formatted);
}, [groupId]);

  useEffect(() => {
    if (isCreator && group?.privacy === "request") fetchRequests();
  }, [isCreator, group?.privacy]);

const handleRequest = async (requestId, uid, action) => {
  // Mise à jour du statut de la demande
  await supabase
    .from("group_join_requests")
    .update({ status: action })
    .eq("id", requestId);
 
  if (action === "approved") {
    // Ajouter le membre
    await supabase
      .from("group_members")
      .insert([{ group_id: groupId, user_id: uid, role: "member" }]);
 
    // Récupérer le nom du demandeur
    const { data: requesterData } = await supabase
      .from("users")
      .select("username")
      .eq("id", uid)
      .single();
 
    // Notifier : accepté
    await notifyGroupJoinRequestAccepted({
      requesterId:     uid,
      requesterName:   requesterData?.username || "Nouveau membre",
      groupId,
      groupName:       group.name,
      creatorId:       userId,
      otherMemberIds:  members.map((m) => m.id).filter((id) => id !== userId && id !== uid),
    });
 
    fetchData();
  } else {
    // action === "rejected"
    // Notifier : refusé
    await notifyGroupJoinRequestRejected({
      requesterId: uid,
      groupId,
      groupName:   group.name,
      creatorId:   userId,
    });
  }
 
  // Retirer la demande de la liste locale
  setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
};

  // ── Join ──
  const handleJoin = async () => {
    const privacy = group?.privacy || "open";
    if (privacy === "private") return Alert.alert("Groupe fermé", "Ce groupe est sur invitation uniquement.");

if (privacy === "request") {
  Alert.alert(
    "Demander à rejoindre",
    `Envoyer une demande au créateur de "${group.name}" ?`,
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Envoyer",
        onPress: async () => {
          // Vérif exclusion
          const { data: kicked } = await supabase
            .from("group_kicked")
            .select("id")
            .eq("group_id", groupId)
            .eq("user_id", userId)
            .maybeSingle();
          if (kicked) return Alert.alert("Accès refusé", "Tu as été exclu de ce groupe.");
 
          // Insertion de la demande
          const { error } = await supabase
            .from("group_join_requests")
            .insert([{ group_id: groupId, user_id: userId, status: "pending" }]);
          if (error && error.code !== "23505") {
            return Alert.alert("Erreur", "Impossible d'envoyer la demande.");
          }
 
          // Récupérer le nom du demandeur pour la notif
          const { data: uData } = await supabase
            .from("users")
            .select("username")
            .eq("id", userId)
            .single();
 
          // Notifier le créateur
          await notifyGroupJoinRequestReceived({
            creatorId:     group.creator_id,
            requesterId:   userId,
            requesterName: uData?.username || "Un utilisateur",
            groupId,
            groupName:     group.name,
          });
 
          setHasPendingRequest(true);
          Alert.alert("✅ Demande envoyée", "Le créateur va examiner ta demande.");
        },
      },
    ]
  );
  return;
}

    Alert.alert("Rejoindre le groupe", `Rejoindre "${group.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Rejoindre", onPress: async () => {
        const { data: kicked } = await supabase.from("group_kicked").select("id").eq("group_id", groupId).eq("user_id", userId).maybeSingle();
        if (kicked) return Alert.alert("Accès refusé", "Tu as été exclu de ce groupe.");
        const { data: lastLeave } = await supabase.from("group_leaves").select("created_at").eq("group_id", groupId).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (lastLeave && (Date.now() - new Date(lastLeave.created_at).getTime()) / 60000 < 30) {
          return Alert.alert("Trop tôt", "Tu pourras rejoindre ce groupe dans 30 minutes.");
        }
        const { error } = await supabase.from("group_members").insert([{ group_id: groupId, user_id: userId, role: "member" }]);
        if (error) return Alert.alert("Erreur", "Impossible de rejoindre le groupe.");
        await notifyGroupJoinedSelf({ userId, groupName: group.name, groupId });
        const { data: uData } = await supabase.from("users").select("username").eq("id", userId).single();
        const others = members.map(m => m.id).filter(id => id !== userId);
        if (others.length > 0) await notifyGroupMemberJoined({ memberName: uData?.username || "Un membre", groupName: group.name, groupId, otherMemberIds: others });
        fetchData();
      }},
    ]);
  };

  // ── Leave ──
  const handleLeave = () => {
    Alert.alert("Quitter le groupe", `Quitter "${group.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Quitter", style: "destructive", onPress: async () => {
        await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
        await supabase.from("group_leaves").insert([{ group_id: groupId, user_id: userId }]);
        await notifyGroupLeftSelf({ userId, groupName: group.name, groupId });
        fetchData();
      }},
    ]);
  };
const handleShare = async () => {
  try {
    const shareUrl = `https://unite-session-page.netlify.app/group?id=${groupId}`;
    await Share.share({
      message: `Rejoins "${group.name}" sur UNITE 👇\n${shareUrl}`,
      url: shareUrl,
      title: group.name,
    });
  } catch (err) {
    console.log("Erreur partage groupe :", err);
  }
};

  // ── Exclude ──
const handleExclude = (m) => {
  Alert.alert("Exclure ce membre ?", `Retirer ${m.username} du groupe.`, [
    { text: "Annuler", style: "cancel" },
    {
      text: "Exclure", style: "destructive",
      onPress: async () => {
        // 1. Ajout dans group_kicked
        const { error: kickErr } = await supabase
          .from("group_kicked")
          .insert([{ group_id: groupId, user_id: m.id }]);

        console.log("kickErr:", kickErr); // ← laisse ça pour debug

        if (kickErr && kickErr.code !== "23505") {
          return Alert.alert("Erreur kick", kickErr.message);
        }

        // 2. Suppression du membre
        const { error: deleteErr } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", m.id);

        console.log("deleteErr:", deleteErr); // ← laisse ça pour debug

        if (deleteErr) {
          return Alert.alert("Erreur suppression", deleteErr.message);
        }

        // 3. Mise à jour UI
        setMembers(prev => prev.filter(u => u.id !== m.id));

        // 4. Notifications
        await notifyGroupExclusion({
          excludedId: m.id,
          excludedName: m.username,
          groupName: group.name,
          groupId,
          creatorId: userId,
          otherMemberIds: members.map(x => x.id).filter(id => id !== m.id && id !== userId),
        });

        fetchData();
      },
    },
  ]);
};

  if (loading || !group) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2F3F7" }}><ActivityIndicator color="#FE5D02" size="large" /></View>;
  }

  const typeMeta    = GROUP_TYPES.find(t => t.value === group.group_type);
  const privacyMeta = PRIVACY_META[group.privacy || "open"];

  const INT_TO_DAY = { 0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' };

  // ─── TAB CONTENT ──────────────────────────────────────────────────────────

  const TabInfo = () => (
    <View style={styles.tabContent}>

      {/* Stat row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{members.length}</Text>
          <Text style={styles.statLabel}>Membres</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#F0F0F5" }]}>
          <Text style={styles.statNum}>{groupSessions.length}</Text>
          <Text style={styles.statLabel}>Sessions à venir</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: privacyMeta.color }]}>
            <Ionicons name={privacyMeta.icon} size={18} />
          </Text>
          <Text style={styles.statLabel}>{privacyMeta.label}</Text>
        </View>
      </View>

      {/* Créateur */}
      <View style={styles.infoCard}>
        <SectionLabel icon="person-outline" title="Créé par" />
        <TouchableOpacity
          style={styles.creatorRow}
          onPress={() => nav.navigate("UserProfile", { userId: group.creator_id })}
          activeOpacity={0.8}
        >
          <Avatar username={group.creator_username} size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.creatorName}>{group.creator_username}</Text>
            <Text style={styles.creatorDate}>
              Depuis le {new Date(group.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#DDD" />
        </TouchableOpacity>
      </View>

      {/* Description */}
      {group.description ? (
        <View style={styles.infoCard}>
          <SectionLabel icon="document-text-outline" title="Description" />
          <Text style={styles.descText}>{group.description}</Text>
        </View>
      ) : null}

      {/* Lien externe */}
      {group.external_link ? (
        <View style={styles.infoCard}>
          <SectionLabel icon="link-outline" title="Lien" />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              const url = group.external_link.startsWith("http") ? group.external_link : `https://${group.external_link}`;
              Linking.openURL(url).catch(() => Alert.alert("Erreur", "Impossible d'ouvrir ce lien."));
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={16} color="#3F4FFF" style={{ marginRight: 8 }} />
            <Text style={styles.linkText} numberOfLines={1}>{group.external_link}</Text>
            <Ionicons name="open-outline" size={14} color="#3F4FFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Demandes d'adhésion (créateur + mode request) */}
      {isCreator && group.privacy === "request" && (
        <View style={styles.infoCard}>
          <SectionLabel
            icon="people-circle-outline"
            title="Demandes d'adhésion"
            action={joinRequests.length > 0 ? `${joinRequests.length} en attente` : undefined}
          />
          {joinRequests.length === 0 ? (
            <View style={styles.requestsEmpty}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#CCC" />
              <Text style={styles.requestsEmptyText}>Aucune demande en attente</Text>
            </View>
          ) : (
            joinRequests.map((req, i) => (
              <View key={req.id}>
                <View style={styles.requestRow}>
                  <Avatar uri={req.user?.profile_photo} username={req.user?.username} size={38} />
                  <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => nav.navigate("UserProfile", { userId: req.user.id })} activeOpacity={0.8}>
                    <Text style={styles.requestName}>{req.user?.username || "Utilisateur"}</Text>
                    <Text style={styles.requestDate}>{new Date(req.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</Text>
                  </TouchableOpacity>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.requestBtnRefuse} onPress={() => handleRequest(req.id, req.user.id, "rejected")} activeOpacity={0.8}>
                      <Ionicons name="close" size={17} color="#E53935" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.requestBtnAccept} onPress={() => handleRequest(req.id, req.user.id, "approved")} activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={17} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < joinRequests.length - 1 && <View style={{ height: 1, backgroundColor: "#F2F2F7" }} />}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

const TabSessions = () => (
  <View style={styles.tabContent}>
    {!(isCreator || isMember) ? (
      <View style={styles.lockedBox}>
        <Ionicons name="lock-closed-outline" size={28} color="#CCC" style={{ marginBottom: 8 }} />
        <Text style={styles.lockedText}>
          {group.privacy === "private"
            ? "Groupe fermé — sessions visibles pour les membres uniquement."
            : "Rejoins le groupe pour voir les sessions."}
        </Text>
      </View>
    ) : (
      <>
        {/* ── Routines récurrentes ── */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="repeat-outline" size={16} color="#FE5D02" style={{ marginRight: 7 }} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A2E' }}>
              Routines récurrentes
            </Text>
            {isCreator && (
              <TouchableOpacity onPress={() => nav.navigate('CreateRoutine', { groupId })} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#FE5D02' }}>+ Créer</Text>
              </TouchableOpacity>
            )}
          </View>

          {routines.length === 0 ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#EBEBF0', gap: 6 }}>
              <Ionicons name="repeat-outline" size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: '#BBB', fontWeight: '500', textAlign: 'center' }}>
                Aucune routine pour l'instant.
              </Text>
              {isCreator && (
                <TouchableOpacity
                  style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF3EE', borderRadius: 10, borderWidth: 1, borderColor: '#FE5D02' }}
                  onPress={() => nav.navigate('CreateRoutine', { groupId })}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FE5D02' }}>Créer la première routine</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
routines.map(r => (
  <TouchableOpacity
    key={r.id}
    style={styles.routineCard}
    onPress={() => nav.navigate('RoutineDetail', { routineId: r.id, groupId })}
    activeOpacity={0.88}
  >
    <View style={styles.routineCardLeft}>
      <View style={styles.routineIconWrap}>
        <Ionicons name="repeat-outline" size={20} color="#FE5D02" />
      </View>
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={styles.routineTitle} numberOfLines={1}>{r.title}</Text>
        <View style={styles.routineFreqBadge}>
          <Text style={styles.routineFreqText}>
            {r.frequency === 'weekly' ? 'Hebdo' : 'Bi-hebdo'}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {r.time && (
          <View style={styles.routineChip}>
            <Ionicons name="time-outline" size={11} color="#FE5D02" />
            <Text style={styles.routineChipText}>{r.time?.slice(0, 5)}</Text>
          </View>
        )}
        {(r.days_of_week || []).map(d => (
          <View key={d} style={styles.routineDayChip}>
            <Text style={styles.routineDayChipText}>
              {INT_TO_DAY[d] ?? String(d)}
            </Text>
          </View>
        ))}
        {r.level && (
          <View style={styles.routineChip}>
            <Ionicons name="stats-chart-outline" size={11} color="#7367F0" />
            <Text style={[styles.routineChipText, { color: '#7367F0' }]}>{r.level}</Text>
          </View>
        )}
      </View>
      {r.location && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Ionicons name="location-outline" size={11} color="#BBB" />
          <Text style={{ fontSize: 11, color: '#BBB', fontWeight: '500' }} numberOfLines={1}>{r.location}</Text>
        </View>
      )}
    </View>
    <Ionicons name="chevron-forward" size={15} color="#D5D5D5" />
  </TouchableOpacity>
))
          )}
        </View>

        {/* ── Séparateur ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#F0F0F5' }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#BBBBBB', paddingHorizontal: 10 }}>SESSIONS PONCTUELLES</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#F0F0F5' }} />
        </View>

        {/* ── Sessions ponctuelles ── */}
        {groupSessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={28} color="#CCC" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyBoxText}>Aucun rendez-vous ponctuel prévu.</Text>
            {isCreator && (
              <TouchableOpacity style={styles.emptyBoxBtn} onPress={() => nav.navigate("CreateSession", { groupId })} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={16} color="#FE5D02" style={{ marginRight: 6 }} />
                <Text style={styles.emptyBoxBtnText}>Créer un rendez-vous</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {recurrenceLabel && (
              <View style={styles.recurrenceBanner}>
                <Ionicons name="repeat-outline" size={15} color="#5B4EFF" style={{ marginRight: 6 }} />
                <Text style={styles.recurrenceBannerText}>{recurrenceLabel}</Text>
              </View>
            )}
            {groupSessions.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sessionCard, i === 0 && styles.sessionCardNext]}
                onPress={() => nav.navigate("SessionDetail", { sessionId: s.id, groupName: group.name })}
                activeOpacity={0.88}
              >
                {i === 0 && (
                  <View style={styles.sessionNextBadge}>
                    <Text style={styles.sessionNextBadgeText}>Prochaine</Text>
                  </View>
                )}
                <View style={styles.sessionCardHeader}>
                  <View style={styles.sessionDateBlock}>
                    <Text style={styles.sessionDateDay}>
                      {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short" }).toUpperCase()}
                    </Text>
                    <Text style={styles.sessionDateNum}>
                      {new Date(s.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
                    </Text>
                    <Text style={styles.sessionDateMonth}>
                      {new Date(s.date).toLocaleDateString("fr-FR", { month: "short" })}
                    </Text>
                  </View>
                  <View style={styles.sessionCardBody}>
                    <Text style={styles.sessionCardTime}>{s.time?.slice(0, 5)}</Text>
                    <Text style={styles.sessionCardTitle} numberOfLines={1}>{s.title}</Text>
                    {s.location && (
                      <View style={styles.sessionCardLoc}>
                        <Ionicons name="location-outline" size={12} color="#999" />
                        <Text style={styles.sessionCardLocText} numberOfLines={1}>{s.location}</Text>
                      </View>
                    )}
                    <View style={styles.sessionCardPills}>
                      {s.sport && <View style={styles.sportPill}><Text style={styles.sportPillText}>{s.sport}</Text></View>}
                      {s.level && <View style={styles.levelPill}><Text style={styles.levelPillText}>{s.level}</Text></View>}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#DDD" />
                </View>
              </TouchableOpacity>
            ))}
            {isCreator && (
              <TouchableOpacity style={styles.addSessionBtn} onPress={() => nav.navigate("CreateSession", { groupId })} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={18} color="#FE5D02" style={{ marginRight: 8 }} />
                <Text style={styles.addSessionBtnText}>Ajouter un rendez-vous</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </>
    )}
  </View>
);

  const TabMembres = () => (
    <View style={styles.tabContent}>
      <View style={styles.membersGrid}>
        {members.map(m => (
<View key={m.id} style={styles.memberCard}>
  <TouchableOpacity
    style={{ alignItems: "center", width: "100%" }}
    onPress={() => nav.navigate("UserProfile", { userId: m.id })}
    activeOpacity={0.8}
  >
    <View style={styles.memberAvatarWrap}>
      <Avatar uri={m.avatar} username={m.username} size={52} />
      {m.role === "admin" && (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={10} color="#fff" />
        </View>
      )}
    </View>
    <Text style={styles.memberName} numberOfLines={1}>{m.username}</Text>
    {m.role === "admin" && <Text style={styles.memberRole}>Admin</Text>}
  </TouchableOpacity>
  {isCreator && m.id !== userId && (
    <TouchableOpacity style={styles.excludeBtn} onPress={() => handleExclude(m)} activeOpacity={0.8}>
      <Text style={styles.excludeBtnText}>Exclure</Text>
    </TouchableOpacity>
  )}
</View>
        ))}
      </View>
    </View>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F3F7" }}>

      {/* ── HEADER TRANSPARENT → OPAQUE au scroll ── */}
<Animated.View
  pointerEvents="none"
  style={[styles.topBar, { paddingTop: insets.top, opacity: headerOpacity }]}
>
  <Text style={styles.topBarTitle} numberOfLines={1}>{group.name}</Text>
</Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── COVER HERO ── */}
<View style={styles.coverContainer}>

  {/* Clip uniquement sur l'image pour le parallax */}
  <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
    <Animated.View style={{ transform: [{ translateY: coverTranslate }], height: COVER_HEIGHT + 40, marginTop: -20 }}>
      {group.cover_url ? (
        <Image source={{ uri: group.cover_url }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[typeMeta?.color || "#FE5D02", "#1A1A2E"]}
          style={styles.coverImage}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      <LinearGradient
        colors={["transparent", "rgba(10,10,20,0.85)"]}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  </View>

  {/* coverInfo — plus dans overflow:hidden, boutons tappables partout */}
  <Animated.View style={[styles.coverInfo, { opacity: coverOpacity }]}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
        {typeMeta && (
          <View style={[styles.coverBadge, { backgroundColor: typeMeta.color }]}>
            <Ionicons name={typeMeta.icon} size={11} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.coverBadgeText}>{typeMeta.value}</Text>
          </View>
        )}
        <View style={[styles.coverBadge, { backgroundColor: privacyMeta.color }]}>
          <Ionicons name={privacyMeta.icon} size={11} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.coverBadgeText}>{privacyMeta.label}</Text>
        </View>
      </View>
      {/* Boutons — ici, hors du overflow:hidden */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity style={styles.topBtn} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={18} color="#fff" />
        </TouchableOpacity>
        {isCreator && (
          <TouchableOpacity style={styles.topBtn} onPress={() => nav.navigate("EditGroup", { groupId })} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
    <Text style={styles.coverTitle}>{group.name}</Text>
            <View style={styles.coverMeta}>
              {group.city && (
                <View style={styles.coverMetaItem}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.coverMetaText}>{group.city}</Text>
                </View>
              )}
              {group.sport && (
                <View style={styles.coverMetaItem}>
                  <Ionicons name="fitness-outline" size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.coverMetaText}>{group.sport}</Text>
                </View>
              )}
              <View style={styles.coverMetaItem}>
                <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.coverMetaText}>{members.length} membres</Text>
              </View>
            </View>

            {/* Aperçu membres */}
            <View style={styles.coverAvatarRow}>
              {members.slice(0, 5).map((m, i) => (
                <View key={m.id} style={[styles.coverAvatarItem, { zIndex: 5 - i, marginLeft: i === 0 ? 0 : -10 }]}>
                  <Avatar uri={m.avatar} username={m.username} size={32} />
                </View>
              ))}
              {members.length > 5 && (
                <View style={[styles.coverAvatarMore, { marginLeft: -10 }]}>
                  <Text style={styles.coverAvatarMoreText}>+{members.length - 5}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* ── TABS ── */}
        <View style={styles.tabsBar}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            const badge = t.key === "sessions" ? groupSessions.length :
                          t.key === "membres"  ? members.length : 0;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.8}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <Ionicons name={t.icon} size={16} color={active ? "#FE5D02" : "#999"} style={{ marginBottom: 3 }} />
                <Text style={[styles.tabItemText, active && styles.tabItemTextActive]}>{t.label}</Text>
                {badge > 0 && (
                  <View style={[styles.tabItemBadge, active && { backgroundColor: "#FE5D02" }]}>
                    <Text style={styles.tabItemBadgeText}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── CONTENU DU TAB ── */}
        {activeTab === "info"     && <TabInfo />}
        {activeTab === "sessions" && <TabSessions />}
        {activeTab === "membres"  && <TabMembres />}

      </Animated.ScrollView>

      {/* ── BARRE D'ACTION FIXE EN BAS ── */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        {isCreator ? (
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => nav.navigate("GroupChat", { groupId })} activeOpacity={0.88}>
            <Ionicons name="chatbubbles-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Discussion du groupe</Text>
          </TouchableOpacity>
        ) : isMember ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => nav.navigate("GroupChat", { groupId })} activeOpacity={0.88}>
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Discussion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleLeave} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        ) : group.privacy === "private" ? (
          <View style={styles.actionInfoBox}>
            <Ionicons name="lock-closed-outline" size={15} color="#E53935" style={{ marginRight: 8 }} />
            <Text style={styles.actionInfoText}>Groupe fermé — sur invitation</Text>
          </View>
        ) : hasPendingRequest ? (
          <View style={styles.actionInfoBox}>
            <Ionicons name="time-outline" size={15} color="#F5A623" style={{ marginRight: 8 }} />
            <Text style={[styles.actionInfoText, { color: "#F5A623" }]}>Demande envoyée — en attente</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleJoin} activeOpacity={0.88}>
            <Ionicons name={group.privacy === "request" ? "send-outline" : "person-add-outline"} size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>
              {group.privacy === "request" ? "Demander à rejoindre" : "Rejoindre le groupe"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // Top bar
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: "#fff", height: 56 + 44,
    justifyContent: "flex-end", paddingBottom: 12, paddingHorizontal: 60,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F5",
  },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", textAlign: "center" },
  topButtons: {
  position: "absolute", left: 0, right: 0, zIndex: 30,
  flexDirection: "row", paddingHorizontal: 16,
  paddingTop: 8,
},
  topBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },

  // Cover
  coverContainer: { height: COVER_HEIGHT },
  coverImage:     { width: "100%", height: COVER_HEIGHT + 60 },
coverInfo: {
  position: "absolute", bottom: 0, left: 0, right: 0,
  paddingHorizontal: 20, paddingBottom: 50,
},
  coverBadges:    { flexDirection: "row", gap: 6, marginBottom: 10 },
  coverBadge:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  coverBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  coverTitle: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.3, marginBottom: 8, textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  coverMeta:      { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  coverMetaItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  coverMetaText:  { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500" },
  coverAvatarRow: { flexDirection: "row", alignItems: "center" },
  coverAvatarItem:{ borderWidth: 2, borderColor: "rgba(0,0,0,0.3)", borderRadius: 18 },
  coverAvatarMore:{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(0,0,0,0.2)" },
  coverAvatarMoreText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Tabs bar
  tabsBar: {
    flexDirection: "row", backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F0F0F5",
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: "#FE5D02" },
  tabItemText:   { fontSize: 12, fontWeight: "600", color: "#999" },
  tabItemTextActive: { color: "#FE5D02" },
  tabItemBadge: {
    position: "absolute", top: 8, right: "18%",
    backgroundColor: "#E0E0E8", borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tabItemBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  // Tab content
  tabContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Stats row
  statsRow: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 16, marginBottom: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "#EBEBF0",
  },
  statCard:  { flex: 1, alignItems: "center", paddingVertical: 16 },
  statNum:   { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 3 },
  statLabel: { fontSize: 11, color: "#999", fontWeight: "500", textAlign: "center" },

  // Info cards
  infoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#EBEBF0" },
  creatorRow:   { flexDirection: "row", alignItems: "center" },
  creatorName:  { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  creatorDate:  { fontSize: 12, color: "#999", marginTop: 2 },
  descText:     { fontSize: 14.5, color: "#444", lineHeight: 22 },
  linkRow:      { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F4FF", borderRadius: 10, padding: 12 },
  linkText:     { flex: 1, color: "#3F4FFF", fontSize: 13, fontWeight: "600", textDecorationLine: "underline", marginHorizontal: 4 },

  // Requests
  requestsEmpty:    { alignItems: "center", paddingVertical: 16, gap: 6 },
  requestsEmptyText:{ fontSize: 13, color: "#BBB", fontWeight: "500" },
  requestRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  requestName:    { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  requestDate:    { fontSize: 11, color: "#AAA", marginTop: 1 },
  requestActions: { flexDirection: "row", gap: 8 },
  requestBtnRefuse: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFF0F0", borderWidth: 1, borderColor: "#FFCDD2", alignItems: "center", justifyContent: "center" },
  requestBtnAccept: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#2ECC71", alignItems: "center", justifyContent: "center" },

  // Sessions
  recurrenceBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(91,78,255,0.08)", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "rgba(91,78,255,0.15)" },
  recurrenceBannerText: { fontSize: 13, fontWeight: "600", color: "#5B4EFF" },
  sessionCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: "#EBEBF0", overflow: "hidden" },
  sessionCardNext: { borderColor: "#FE5D02", borderWidth: 1.5 },
  sessionNextBadge: { backgroundColor: "#FE5D02", paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start", borderBottomRightRadius: 10 },
  sessionNextBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  sessionCardHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  sessionDateBlock: { width: 46, alignItems: "center", marginRight: 14 },
  sessionDateDay:   { fontSize: 11, fontWeight: "700", color: "#FE5D02", letterSpacing: 0.5 },
  sessionDateNum:   { fontSize: 22, fontWeight: "800", color: "#1A1A2E", lineHeight: 26 },
  sessionDateMonth: { fontSize: 11, fontWeight: "600", color: "#999", textTransform: "capitalize" },
  sessionCardBody:  { flex: 1 },
  sessionCardTime:  { fontSize: 13, fontWeight: "700", color: "#FE5D02", marginBottom: 2 },
  sessionCardTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  sessionCardLoc:   { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 6 },
  sessionCardLocText: { fontSize: 12, color: "#999", flex: 1 },
  sessionCardPills: { flexDirection: "row", gap: 6 },
  sportPill:  { backgroundColor: "#FFE9EC", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sportPillText: { color: "#FF375E", fontSize: 11, fontWeight: "700" },
  levelPill:  { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  levelPillText: { color: "#4E65FF", fontSize: 11, fontWeight: "700" },
  addSessionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#FE5D02", borderStyle: "dashed", marginTop: 6 },
  addSessionBtnText: { fontSize: 14, fontWeight: "700", color: "#FE5D02" },

  // Membres grid
  membersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  memberCard: { width: "30%", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#EBEBF0" },
  memberAvatarWrap: { position: "relative", marginBottom: 8 },
  adminBadge: { position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "#FE5D02", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  memberName: { fontSize: 12, fontWeight: "600", color: "#1A1A2E", textAlign: "center", maxWidth: 80 },
  memberRole: { fontSize: 10, fontWeight: "700", color: "#FE5D02", marginTop: 2 },
  excludeBtn: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#FFF0F0", borderRadius: 8, borderWidth: 1, borderColor: "#FFCDD2" },
  excludeBtnText: { fontSize: 11, fontWeight: "700", color: "#E53935" },

  // Empty / locked
  emptyBox:    { alignItems: "center", paddingVertical: 40, gap: 6 },
  emptyBoxText:{ fontSize: 14, color: "#BBB", fontWeight: "500", textAlign: "center" },
  emptyBoxBtn: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#FE5D02" },
  emptyBoxBtnText: { fontSize: 14, fontWeight: "700", color: "#FE5D02" },
  lockedBox:   { alignItems: "center", paddingVertical: 40, gap: 8, paddingHorizontal: 24 },
  lockedText:  { fontSize: 14, color: "#AAA", textAlign: "center", lineHeight: 20 },

  // Action bar
  actionBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", paddingHorizontal: 18, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#F0F0F5",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 10,
  },
  routineCard: {
  backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
  borderColor: '#EBEBF0', marginBottom: 10, padding: 14,
  flexDirection: 'row', alignItems: 'center', gap: 12,
  shadowColor: '#FE5D02', shadowOpacity: 0.06, shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 }, elevation: 2,
},
routineCardLeft: { justifyContent: 'flex-start', paddingTop: 2 },
routineIconWrap: {
  width: 40, height: 40, borderRadius: 12,
  backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center',
  borderWidth: 1, borderColor: '#FFD6C0',
},
routineTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginRight: 8 },
routineFreqBadge: {
  backgroundColor: '#FFF3EE', paddingHorizontal: 8, paddingVertical: 3,
  borderRadius: 8, borderWidth: 1, borderColor: '#FFD6C0',
},
routineFreqText: { fontSize: 10, fontWeight: '700', color: '#FE5D02' },
routineChip: {
  flexDirection: 'row', alignItems: 'center', gap: 4,
  backgroundColor: '#F5F5F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
},
routineChipText: { fontSize: 11, fontWeight: '600', color: '#FE5D02' },
routineDayChip: {
  backgroundColor: '#FE5D0215', paddingHorizontal: 7, paddingVertical: 3,
  borderRadius: 6, borderWidth: 1, borderColor: '#FE5D0230',
},
routineDayChipText: { fontSize: 11, fontWeight: '700', color: '#FE5D02' },
  actionRow:       { flexDirection: "row", gap: 10 },
  actionBtnPrimary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FE5D02", borderRadius: 14, paddingVertical: 13 },
  actionBtnSecondary: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#F2F3F7", alignItems: "center", justifyContent: "center" },
  actionBtnText:   { color: "#fff", fontSize: 15, fontWeight: "700" },
  actionInfoBox:   { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, backgroundColor: "#F8F8FB", borderRadius: 14, borderWidth: 1, borderColor: "#EBEBF0" },
  actionInfoText:  { fontSize: 14, fontWeight: "600", color: "#999" },
});
