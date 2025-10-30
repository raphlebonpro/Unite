// components/GroupCard.js
import React from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AvatarStack from "./AvatarStack";
import { Feather } from "@expo/vector-icons";

export default function GroupCard({
  name,
  sport,
  city,
  coverUrl,
  membersAvatars = [],
  onPress,
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} />
        ) : (
          <LinearGradient
            colors={["#FFAD75", "#FF5361"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.45)"]}
          style={styles.overlay}
        />
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.tag}>
            <Feather name="map-pin" size={12} color="#fff" />
            <Text style={styles.tagText} numberOfLines={1}> {city}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="activity" size={14} color="#FF5361" />
          <Text style={styles.sport}> {sport}</Text>
        </View>
        <AvatarStack urls={membersAvatars} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  coverWrap: { width: "100%", height: 160, position: "relative" },
  cover: { width: "100%", height: "100%" },
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" },
  titleRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, marginRight: 8 },
  tag: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  bottomRow: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sport: { color: "#333", fontSize: 13, fontWeight: "600" },
});
