import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  SectionList,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppForeground } from '../context/AppForegroundContext';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { value: null,          label: "Tous",        icon: "apps-outline",      color: "#FE5D02" },
  { value: "Communauté",  label: "Communauté",  icon: "people-outline",    color: "#3888FF" },
  { value: "Club",        label: "Club",        icon: "shield-outline",    color: "#7367F0" },
  { value: "BDE",         label: "BDE",         icon: "school-outline",    color: "#F5A623" },
  { value: "Événement",   label: "Événement",   icon: "calendar-outline",  color: "#E9436D" },
  { value: "Association", label: "Association", icon: "ribbon-outline",    color: "#2ECC71" },
  { value: "Amis",        label: "Amis",        icon: "heart-outline",     color: "#FF6B9D" },
];

const PRIVACY_META = {
  open:    { icon: "earth-outline",            color: "#2ECC71", label: "Ouvert" },
  request: { icon: "checkmark-circle-outline", color: "#F5A623", label: "Sur demande" },
  private: { icon: "lock-closed-outline",      color: "#E53935", label: "Privé" },
};

const LETTER_COLORS = [
  "#4A90E2","#50E3C2","#F5A623","#9013FE","#D0021B",
  "#7ED321","#BD10E0","#FF3366","#00BCD4","#FF9800",
];
const getColor = (name = "") => {
  const i = (name.charCodeAt(0) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[Math.max(0, i)];
};

// ─── CARTE GROUPE ─────────────────────────────────────────────────────────────

const GroupCard = ({ item, onPress }) => {
  const typeMeta    = TYPE_FILTERS.find(t => t.value === item.group_type);
  const privacyMeta = PRIVACY_META[item.privacy ?? "open"];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={S.card}>
      {/* Cover */}
      <View style={S.cardCover}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={S.cardCoverImg} resizeMode="cover" />
        ) : (
          <View style={[S.cardCoverFallback, { backgroundColor: getColor(item.name) + "28" }]}>
            <Text style={[S.cardCoverLetter, { color: getColor(item.name) }]}>
              {item.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Badge privacy (uniquement si non-open) */}
        {item.privacy && item.privacy !== "open" && (
          <View style={[S.privacyDot, { backgroundColor: privacyMeta.color }]}>
            <Ionicons name={privacyMeta.icon} size={9} color="#fff" />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={S.cardBody}>
        <Text style={S.cardName} numberOfLines={1}>{item.name}</Text>

        <View style={S.cardMeta}>
          {item.city && (
            <View style={S.cardMetaItem}>
              <Ionicons name="location-outline" size={12} color="#999" />
              <Text style={S.cardMetaText} numberOfLines={1}>{item.city}</Text>
            </View>
          )}
          {item.sport && (
            <View style={S.cardMetaItem}>
              <Ionicons name="fitness-outline" size={12} color="#999" />
              <Text style={S.cardMetaText} numberOfLines={1}>{item.sport}</Text>
            </View>
          )}
        </View>

        {typeMeta?.value && (
          <View style={[S.cardTypeBadge, {
            backgroundColor: typeMeta.color + "14",
            borderColor: typeMeta.color + "30",
          }]}>
            <Ionicons name={typeMeta.icon} size={11} color={typeMeta.color} />
            <Text style={[S.cardTypeBadgeText, { color: typeMeta.color }]}>
              {typeMeta.label}
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color="#D5D5D5" style={{ marginRight: 14 }} />
    </TouchableOpacity>
  );
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function GroupsScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [tab,        setTab]        = useState("explore");
  const [q,          setQ]          = useState("");
  const [typeFilter, setTypeFilter] = useState(null);
  const [allGroups,  setAllGroups]  = useState([]);
  const [myGroupIds, setMyGroupIds] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: groups } = await supabase
      .from("groups")
      .select("id, name, sport, city, cover_url, created_at, group_type, privacy")
      .order("created_at", { ascending: false })
      .limit(200);

    setAllGroups(groups ?? []);

    if (user) {
      const { data: mine } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      setMyGroupIds((mine ?? []).map(m => m.group_id));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]));

  useAppForeground(fetchAll);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ── Filtrage ───────────────────────────────────────────────────
  const baseGroups = tab === "mine"
    ? allGroups.filter(g => myGroupIds.includes(g.id))
    : allGroups;

  const filtered = baseGroups.filter(g => {
    const matchQ    = !q.trim() || g.name.toLowerCase().includes(q.toLowerCase());
    const matchType = !typeFilter || g.group_type === typeFilter;
    return matchQ && matchType;
  });

  // ── Sections ───────────────────────────────────────────────────
  const buildSections = () => {
    const order = ["Communauté", "Club", "BDE", "Événement", "Association", "Amis"];
    const sections = [];
    const uncategorized = filtered.filter(g => !g.group_type || !order.includes(g.group_type));

    order.forEach(type => {
      const data = filtered.filter(g => g.group_type === type);
      if (data.length > 0) {
        const meta = TYPE_FILTERS.find(t => t.value === type);
        sections.push({ title: type, icon: meta?.icon, color: meta?.color, data });
      }
    });

    if (uncategorized.length > 0)
      sections.push({ title: "Autres", icon: "apps-outline", color: "#999", data: uncategorized });

    return sections;
  };

  const showSections = tab === "explore" && !typeFilter && !q.trim();
  const sections     = showSections ? buildSections() : [];

  // ── Search animation ───────────────────────────────────────────
  const onSearchFocus = () => Animated.spring(searchAnim, { toValue: 1, useNativeDriver: false }).start();
  const onSearchBlur  = () => Animated.spring(searchAnim, { toValue: 0, useNativeDriver: false }).start();
  const searchBorder  = searchAnim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(255,255,255,0.15)", "rgba(254,93,2,0.85)"] });

  // ── Section header ─────────────────────────────────────────────
  const renderSectionHeader = ({ section }) => (
    <View style={S.sectionHeader}>
      <View style={[S.sectionIconWrap, { backgroundColor: section.color + "20" }]}>
        <Ionicons name={section.icon} size={14} color={section.color} />
      </View>
      <Text style={[S.sectionTitle, { color: section.color }]}>{section.title}</Text>
      <View style={S.sectionCountBadge}>
        <Text style={S.sectionCountText}>{section.data.length}</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <GroupCard item={item} onPress={() => nav.navigate("GroupDetail", { groupId: item.id })} />
  );

  // ── Empty state ────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={S.empty}>
      <View style={S.emptyIcon}>
        <Ionicons name="people-outline" size={32} color="#FE5D02" />
      </View>
      <Text style={S.emptyTitle}>
        {tab === "mine" ? "Pas encore de groupe" : "Aucun groupe trouvé"}
      </Text>
      <Text style={S.emptyDesc}>
        {tab === "mine"
          ? "Rejoins un groupe ou crée le tien pour commencer."
          : "Essaie un autre filtre ou sois le premier à créer ce groupe."}
      </Text>
      {tab === "mine" && (
        <TouchableOpacity style={S.emptyBtn} onPress={() => setTab("explore")} activeOpacity={0.85}>
          <Text style={S.emptyBtnText}>Explorer les groupes</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={S.safe}>

      {/* ══ HEADER ══ */}
      <LinearGradient colors={["#0E1B2A", "#172640"]} style={S.header}>

        {/* Tabs */}
        <View style={S.tabs}>
          {[
            { key: "explore", label: "Explorer" },
            { key: "mine",    label: "Mes groupes" },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={S.tabBtn} activeOpacity={0.8}>
              <View style={[S.tabInner, tab === t.key && S.tabActive]}>
                <Text style={[S.tabText, tab === t.key && S.tabTextActive]}>{t.label}</Text>
                {t.key === "mine" && myGroupIds.length > 0 && (
                  <View style={S.tabBadge}>
                    <Text style={S.tabBadgeText}>{myGroupIds.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <Animated.View style={[S.searchWrap, { borderColor: searchBorder }]}>
          <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.55)" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Rechercher un groupe…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={S.searchInput}
            value={q}
            onChangeText={setQ}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filtres type */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
        >
          {TYPE_FILTERS.map(f => {
            const active = typeFilter === f.value;
            const count  = f.value === null
              ? (tab === "mine" ? myGroupIds.length : allGroups.length)
              : (tab === "mine"
                  ? allGroups.filter(g => myGroupIds.includes(g.id) && g.group_type === f.value).length
                  : allGroups.filter(g => g.group_type === f.value).length);
            return (
              <TouchableOpacity
                key={f.label}
                onPress={() => setTypeFilter(f.value)}
                activeOpacity={0.8}
                style={[S.filterChip, active && { backgroundColor: f.color, borderColor: f.color }]}
              >
                <Ionicons name={f.icon} size={13} color={active ? "#fff" : "rgba(255,255,255,0.7)"} />
                <Text style={[S.filterChipText, active && { color: "#fff" }]}>{f.label}</Text>
                {count > 0 && (
                  <View style={[S.filterCount, active && { backgroundColor: "rgba(255,255,255,0.28)" }]}>
                    <Text style={[S.filterCountText, active && { color: "#fff" }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* ══ CONTENU ══ */}
      {loading ? (
        <View style={S.loadingWrap}>
          <ActivityIndicator color="#FE5D02" size="large" />
        </View>
      ) : showSections ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[S.listContent, sections.length === 0 && { flex: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE5D02" />}
          ListEmptyComponent={<EmptyState />}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          SectionSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderItem}
          contentContainerStyle={[S.listContent, filtered.length === 0 && { flex: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE5D02" />}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ══ BOUTON CRÉER — pill discret ══ */}
      <TouchableOpacity
        onPress={() => nav.navigate("CreateGroup")}
        activeOpacity={0.82}
        style={[S.createPill, { bottom: insets.bottom + 18 }]}
      >
        <Ionicons name="add" size={17} color="#fff" />
        <Text style={S.createPillText}>Créer</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F3F7" },

  // ── Header
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16 },

  // ── Tabs
  tabs:         { flexDirection: "row", gap: 8, marginBottom: 14 },
  tabBtn:       { flex: 1 },
  tabInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 9, borderRadius: 12, gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tabActive:     { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  tabText:       { color: "rgba(255,255,255,0.45)", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  tabBadge:      { backgroundColor: "#FE5D02", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText:  { color: "#fff", fontSize: 10, fontWeight: "700" },

  // ── Search
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "500" },

  // ── Filter chips
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  filterChipText:  { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  filterCount:     { marginLeft: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)" },
  filterCountText: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)" },

  // ── List
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 100 },

  // ── Section header
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 10, marginTop: 6, paddingHorizontal: 2,
  },
  sectionIconWrap:  { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionTitle:     { fontSize: 15, fontWeight: "800", flex: 1, letterSpacing: 0.1 },
  sectionCountBadge:{ backgroundColor: "#EBEBF0", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionCountText: { fontSize: 11, fontWeight: "700", color: "#AAA" },

  // ── Carte groupe
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#EBEBF0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    overflow: "hidden",
  },
  cardCover:         { width: 76, height: 76, position: "relative" },
  cardCoverImg:      { width: 76, height: 76 },
  cardCoverFallback: { width: 76, height: 76, alignItems: "center", justifyContent: "center" },
  cardCoverLetter:   { fontSize: 28, fontWeight: "800" },
  privacyDot: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  cardBody:      { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  cardName:      { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  cardMeta:      { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  cardMetaItem:  { flexDirection: "row", alignItems: "center", gap: 3 },
  cardMetaText:  { fontSize: 12, color: "#888", maxWidth: 110 },
  cardTypeBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  cardTypeBadgeText: { fontSize: 11, fontWeight: "700" },

  // ── Loading
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ── Empty
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyIcon:    { width: 64, height: 64, borderRadius: 20, backgroundColor: "#FFF0E8", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle:   { fontSize: 17, fontWeight: "700", color: "#1A1A2E", textAlign: "center", marginBottom: 8 },
  emptyDesc:    { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  emptyBtn:     { backgroundColor: "#FE5D02", paddingHorizontal: 24, paddingVertical: 11, borderRadius: 14 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ══ PILL CRÉER ══
  createPill: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F62DAE",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 6,
  },
  createPillText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
