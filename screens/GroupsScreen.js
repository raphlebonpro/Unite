// screens/GroupsScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import GroupCard from "../components/GroupCard";
import Shimmer from "../components/Shimmer";
import * as Location from "expo-location";

const PAGE_SIZE = 12;

export default function GroupsScreen() {
  const nav = useNavigation();
  const [tab, setTab] = useState("explore"); // 'mine' | 'explore'
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

const fetchPage = useCallback(
  async (reset = false) => {
    const currentFetchId = Date.now();
    fetchPage.lastFetchId = currentFetchId;

    if (reset) {
      setPage(0);
      setHasMore(true);
      setItems([]); // ✅ on vide immédiatement les anciens résultats
    }

    if (!hasMore && !reset) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("groups")
      .select("id, name, sport, city, cover_url, created_at")
      .order("created_at", { ascending: false })
      .range(
        (reset ? 0 : page) * PAGE_SIZE,
        (reset ? 0 : page) * PAGE_SIZE + (PAGE_SIZE - 1)
      );

    if (q.trim()) query = query.ilike("name", `%${q}%`);

    if (tab === "mine") {
      // ✅ Récupère les IDs des groupes auxquels l’utilisateur appartient
      const { data: myGroups, error: myError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (myError) {
        console.warn("Erreur récupération myGroups:", myError);
        return;
      }

      const ids = myGroups?.map((g) => g.group_id) || [];

      if (ids.length === 0) {
        // ✅ Aucun groupe : on vide la liste et stoppe
        setItems([]);
        setHasMore(false);
        return;
      }

      query = query.in("id", ids);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Erreur fetchPage:", error);
      return;
    }

    if (fetchPage.lastFetchId !== currentFetchId) return;

    // ✅ Évite doublons
    const unique = [
      ...(reset ? [] : items),
      ...(data || []),
    ].filter((v, i, self) => i === self.findIndex((t) => t.id === v.id));

    let sorted = unique;

if (userLocation) {
  sorted = unique.sort((a, b) => {
    const distA = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      a.latitude,
      a.longitude
    );

    const distB = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      b.latitude,
      b.longitude
    );

    return distA - distB;
  });
}

setItems(sorted);

    setItems(unique);
    setHasMore((data || []).length === PAGE_SIZE);
    setPage((prev) => (reset ? 1 : prev + 1));
  },
  [q, tab, page, hasMore, items]
);

useEffect(() => {
  setItems([]); // reset instantané
  setLoading(true);
  fetchPage(true).then(() => setLoading(false));
}, [tab]);

useEffect(() => {
  const delay = setTimeout(() => {
    setItems([]);
    setLoading(true);
    fetchPage(true).then(() => setLoading(false));
  }, 300); // petit debounce

  return () => clearTimeout(delay);
}, [q]);

useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);
  })();
}, []);

  // --- Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPage(true);
    setRefreshing(false);
  };

  // --- Rendu des items
  const renderItem = ({ item }) => (
    <GroupCard
      name={item.name}
      sport={item.sport}
      city={item.city}
      coverUrl={item.cover_url}
      onPress={() => nav.navigate("GroupDetail", { groupId: item.id })}
    />
  );

  const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

  // --- Liste vide ou en chargement
  const ListEmpty = () =>
    loading ? (
      <View style={{ padding: 16 }}>
        <Shimmer />
        <Shimmer style={{ marginTop: 12 }} />
        <Shimmer style={{ marginTop: 12 }} />
      </View>
    ) : (
      <View style={styles.empty}>
        <Feather name="users" size={28} color="#999" />
        <Text style={styles.emptyTitle}>Aucun groupe trouvé</Text>
        <Text style={styles.emptyDesc}>
          Crée ton premier groupe et lance l’énergie du collectif.
        </Text>
      </View>
    );

  // --- Rendu principal
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#0E1B2A", "#182B44"]} style={styles.header}>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color="#fff" />
          <TextInput
            placeholder="Rechercher un groupe…"
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={styles.search}
            value={q}
            onChangeText={setQ}
          />
        </View>

        <View style={styles.tabs}>
          {[
            { key: "explore", label: "Explorer" },
            { key: "mine", label: "Mes groupes" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={styles.tabBtn}
              activeOpacity={0.8}
            >
<View
  style={[
    styles.tabGrad,
    {
      backgroundColor: tab === t.key ? '#FE5D02' : '#22324a',
      opacity: tab === t.key ? 1 : 0.5,
    },
  ]}
>
  <Text style={styles.tabText}>{t.label}</Text>
</View>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Liste */}
      <FlatList
        data={items}
        keyExtractor={(it, index) => `${it.id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 120
       }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF5361"
          />
        }
        onEndReached={() => fetchPage(false)}
        onEndReachedThreshold={0.2}
        ListEmptyComponent={<ListEmpty />}
        ListFooterComponent={
          hasMore && !loading ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />

      {/* Bouton flottant */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => nav.navigate("CreateGroup")}
        style={styles.fab}
      >
        <View
         style={[styles.fabGrad,{
          backgroundColor: '#FE5D02'
         }]}
        >
          <Feather name="plus" size={25} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: "#F4F6FA",
},
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  Title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  search: { color: "#fff", marginLeft: 8, flex: 1 },
  tabs: { flexDirection: "row", gap: 10, marginTop: 12 },
  tabBtn: { flex: 1 },
  tabGrad: { borderRadius: 20, paddingVertical: 10, alignItems: "center" },
  tabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  empty: { alignItems: "center", marginTop: 48, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 10, fontWeight: "700", color: "#333" },
  emptyDesc: { color: "#777", textAlign: "center", marginTop: 4 },
  fab: { position: "absolute", bottom: 26, right: 20 },
  fabGrad: {
    width: 50,
    height: 50,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
