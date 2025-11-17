import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function UnitePlusCompareScreen() {
  const nav = useNavigation();

  const features = [
    {
      title: "Création de sessions",
      free: "Jusqu’à 10 / mois",
      plus: "Illimitée",
      icon: "activity",
    },
    {
      title: "Participation aux sessions",
      free: "Illimitée",
      plus: "Illimitée",
      icon: "users",
    },
    {
      title: "Création de groupes",
      free: "1 groupe",
      plus: "Illimitée",
      icon: "users",
    },
    {
      title: "Participation aux groupes",
      free: "Illimitée",
      plus: "Illimitée",
      icon: "users",
    },
    {
      title: "Classement & défis",
      free: "Non disponible",
      plus: "Accès complet + lots à gagner",
      icon: "award",
    },
    {
      title: "Badges exclusifs",
      free: "Non disponible",
      plus: "Attribués selon ton activité",
      icon: "star",
    },
    {
      title: "Soutenir le collectif",
      free: "—",
      plus: "Tu soutiens le dev. de Unite",
      icon: "heart",
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ===== HERO ===== */}
      <LinearGradient
        colors={["#6A11CB", "#2575FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Passe à Unite+</Text>
        <Text style={styles.heroSubtitle}>
          Le meilleur du collectif, sans limites.
        </Text>
      </LinearGradient>

      {/* ===== TABLEAU COMPARATIF ===== */}
      <View style={styles.tableWrapper}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 1.4 }]}>Fonctionnalité</Text>
          <Text style={[styles.headerCell, { color: "#888" }]}>Sans Unite+</Text>
          <Text style={[styles.headerCell, { color: "#2575FC" }]}>Avec Unite+</Text>
        </View>

        {features.map((f, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              i % 2 === 0 && { backgroundColor: "#fafbff" },
            ]}
          >
            <View
              style={{
                flex: 1.4,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Feather name={f.icon} size={18} color="#444" />
              <Text style={styles.featureTitle}>{f.title}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.freeText}>{f.free}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.plusText}>{f.plus}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ===== SECTION LEADERS ===== */}
      <View style={styles.leaderSection}>
        <Text style={styles.leaderTitle}>Les membres Unite+</Text>
        <Text style={styles.leaderText}>
          Ce sont ceux qui organisent, motivent et inspirent.{"\n"}
          Rejoindre Unite+, c’est passer du côté de ceux qui font bouger le collectif.
        </Text>
      </View>

      {/* ===== CTA ===== */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.ctaWrapper}
        onPress={() => nav.navigate("UnitePlusScreen")}
      >
        <LinearGradient
          colors={["#6A11CB", "#2575FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>Rejoindre Unite+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingBottom: 20,
  },
  hero: {
    paddingVertical: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: "#e9e9e9",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: width * 0.85,
  },
  tableWrapper: {
    marginTop: 40,
    marginHorizontal: 18,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e4ef",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f6fc",
    borderBottomWidth: 1,
    borderColor: "#e0e3ed",
    paddingVertical: 18,
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14.5,
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 22, // ⬆️ plus d’espace vertical
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(230,230,240,0.7)",
  },
  featureTitle: {
    fontSize: 15,
    color: "#111",
    fontWeight: "500",
    flexShrink: 1,
  },
  freeText: {
    color: "#555",
    fontSize: 14.5,
    textAlign: "center",
    lineHeight: 20, // ⬆️ meilleur espacement vertical
    flexShrink: 1,
  },
  plusText: {
    color: "#2575FC",
    fontSize: 14.5,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    flexShrink: 1,
  },
  leaderSection: {
    marginTop: 60,
    marginHorizontal: 28,
    alignItems: "center",
  },
  leaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  leaderText: {
    fontSize: 15.5,
    color: "#444",
    textAlign: "center",
    lineHeight: 23,
    maxWidth: width * 0.85,
  },
  ctaWrapper: {
    marginTop: 60,
    marginHorizontal: 24,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
