import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";

export default function PremiumBadge({ small = false }) {
  return (
    <LinearGradient
      colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, small && styles.badgeSmall]}
    >
      <FontAwesome5
        name="bolt"
        size={small ? 14 : 18} // ⚡️ icône plus grande
        color="#fff"
        style={{ marginRight: small ? 5 : 7 }}
      />
      <Text style={[styles.text, small && styles.textSmall]}>Unite+</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14, // 🟢 plus large
    paddingVertical: 6, // 🟢 plus haut
    borderRadius: 999,
    gap: 5,
    shadowColor: "#FF6C4A",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  text: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14, // 🟢 texte plus grand
    letterSpacing: 0.4,
  },
  badgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  textSmall: {
    fontSize: 12,
    fontWeight: "700",
  },
});
