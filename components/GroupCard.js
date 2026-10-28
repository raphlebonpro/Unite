import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
 
// ─── DATA ────────────────────────────────────────────────────────────────────
 
const GROUP_TYPE_META = {
  Communauté:  { icon: "people-outline",   color: "#3888FF" },
  Club:        { icon: "shield-outline",   color: "#7367F0" },
  BDE:         { icon: "school-outline",   color: "#F5A623" },
  Événement:   { icon: "calendar-outline", color: "#E9436D" },
  Association: { icon: "ribbon-outline",   color: "#2ECC71" },
  Amis:        { icon: "heart-outline",    color: "#FF6B9D" },
};
 
const PRIVACY_META = {
  open:    { icon: "earth-outline",            color: "#2ECC71", label: "Ouvert" },
  request: { icon: "checkmark-circle-outline", color: "#F5A623", label: "Sur demande" },
  private: { icon: "lock-closed-outline",      color: "#E53935", label: "Fermé" },
};
 
const LETTER_COLORS = [
  "#4A90E2","#50E3C2","#F5A623","#9013FE","#D0021B",
  "#7ED321","#BD10E0","#FF3366","#00BCD4","#FF9800",
];
 
function getColor(name = "") {
  const i = (name.charCodeAt(0) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[Math.max(0, i)];
}
 
// ─── COMPOSANT ───────────────────────────────────────────────────────────────
 
/**
 * GroupCard — carte groupe unifiée
 *
 * Props :
 *   name        string   – nom du groupe (requis)
 *   sport       string   – sport principal
 *   city        string   – ville / lieu
 *   coverUrl    string   – URL de la photo de couverture
 *   groupType   string   – valeur parmi GROUP_TYPE_META
 *   privacy     string   – "open" | "request" | "private"
 *   isVerified  bool     – groupe certifié
 *   memberCount number   – nb de membres
 *   onPress     func     – callback
 *   style       object   – styles supplémentaires sur la carte
 */
export default function GroupCard({
  name = "",
  sport,
  city,
  coverUrl,
  groupType,
  privacy = "open",
  isVerified = false,
  memberCount,
  onPress,
  style,
}) {
  const typeMeta    = GROUP_TYPE_META[groupType];
  const privacyMeta = PRIVACY_META[privacy] || PRIVACY_META.open;
  const accentColor = typeMeta?.color || getColor(name);
 
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* ── COVER ── */}
      <View style={styles.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[accentColor + "CC", accentColor + "44"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cover, styles.coverFallback]}
          >
            <Text style={styles.coverLetter}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
 
        {/* Gradient bas */}
        <LinearGradient
          colors={["transparent", "rgba(10,10,20,0.72)"]}
          style={styles.coverGradient}
        />
 
        {/* Badge type — coin haut gauche */}
        {typeMeta && (
          <View style={[styles.typeBadge, { backgroundColor: typeMeta.color }]}>
            <Ionicons name={typeMeta.icon} size={11} color="#fff" />
            <Text style={styles.typeBadgeText}>{groupType}</Text>
          </View>
        )}
 
        {/* Badge privacy — coin haut droit (seulement si non ouvert) */}
        {privacy !== "open" && (
          <View style={[styles.privacyBadge, { backgroundColor: privacyMeta.color }]}>
            <Ionicons name={privacyMeta.icon} size={11} color="#fff" />
          </View>
        )}
 
        {/* Nom + vérification sur la cover */}
        <View style={styles.coverBottom}>
          <View style={styles.nameRow}>
            <Text style={styles.coverName} numberOfLines={1}>{name}</Text>
            {isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#32C5FF"
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
        </View>
      </View>
 
      {/* ── BANDE BAS ── */}
      <View style={styles.footer}>
        {/* Ville */}
        {city ? (
          <View style={styles.footerItem}>
            <Ionicons name="location-outline" size={13} color="#999" />
            <Text style={styles.footerText} numberOfLines={1}>{city}</Text>
          </View>
        ) : null}
 
        {/* Sport */}
        {sport ? (
          <View style={styles.footerItem}>
            <Ionicons name="fitness-outline" size={13} color="#999" />
            <Text style={styles.footerText} numberOfLines={1}>{sport}</Text>
          </View>
        ) : null}
 
        {/* Membres */}
        {memberCount !== undefined && memberCount !== null ? (
          <View style={[styles.footerItem, styles.footerRight]}>
            <Ionicons name="people-outline" size={13} color={accentColor} />
            <Text style={[styles.footerText, { color: accentColor, fontWeight: "700" }]}>
              {memberCount}
            </Text>
          </View>
        ) : null}
      </View>
 
      {/* Barre colorée en bas de la carte */}
      <View style={[styles.bottomAccent, { backgroundColor: accentColor }]} />
    </TouchableOpacity>
  );
}
 
// ─── STYLES ──────────────────────────────────────────────────────────────────
 
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EBEBF0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
 
  // Cover
  coverWrap:     { width: "100%", height: 160, position: "relative" },
  cover:         { width: "100%", height: "100%" },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  coverLetter:   { fontSize: 52, fontWeight: "800", color: "rgba(255,255,255,0.85)" },
  coverGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "65%" },
 
  // Badge type
  typeBadge: {
    position: "absolute", top: 10, left: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
 
  // Badge privacy
  privacyBadge: {
    position: "absolute", top: 10, right: 10,
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
 
  // Nom cover
  coverBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  nameRow:  { flexDirection: "row", alignItems: "center" },
  coverName: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
 
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
    flexWrap: "wrap",
  },
  footerItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  footerRight: { marginLeft: "auto" },
  footerText:  { fontSize: 12, color: "#888", fontWeight: "500", maxWidth: 110 },
 
  // Accent bas
  bottomAccent: { height: 3 },
});