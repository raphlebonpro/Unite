import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function UnitePlusScreen() {
  const [loading, setLoading] = React.useState(false);

  // 🔗 Redirection vers ta page Framer
  const handleOpenUnitePlusPage = async () => {
    try {
      setLoading(true);
      const url = "https://www.uniteapp.fr/uniteplus";
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Erreur", "Impossible d’ouvrir la page Unite+.");
      }
    } catch (err) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* === HEADER GRADIENT === */}
      <LinearGradient
        colors={["#6A11CB", "#2575FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <FontAwesome5 name="bolt" size={30} color="#fff" style={{ marginBottom: 6 }} />
        <Text style={styles.headerTitle}>Unite+</Text>
        <Text style={styles.headerSubtitle}>
          Le meilleur du collectif, sans limites.
        </Text>
      </LinearGradient>

      {/* === AVANTAGES === */}
      <View style={styles.benefitsContainer}>
        <BenefitCard
          iconSet="Feather"
          icon="activity"
          title="Sessions illimitées"
          desc="Crée et organise autant de sessions que tu veux, sans limite. Deviens une référence dans ton sport."
        />
        <BenefitCard
          iconSet="Feather"
          icon="users"
          title="Groupes illimités"
          desc="Anime plusieurs collectifs sportifs et développe ta communauté sans contrainte."
        />
        <BenefitCard
          iconSet="MaterialCommunityIcons"
          icon="trophy-outline"
          title="Classements mensuels"
          desc="Accède au classement des créateurs et participants les plus actifs."
        />
        <BenefitCard
          iconSet="Feather"
          icon="award"
          title="Badges premium"
          desc="Obtiens des badges exclusifs selon ton activité et affiche ton statut de leader."
        />
        <BenefitCard
          iconSet="Feather"
          icon="heart"
          title="Soutenir le collectif"
          desc="En rejoignant Unite+, tu participes directement au développement du mouvement."
        />
      </View>

      {/* === PRIX === */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>3,99 € / mois</Text>
        <Text style={styles.priceSubText}>Sans engagement — annule à tout moment</Text>
      </View>

      {/* === CTA === */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.subscribeBtn}
        onPress={handleOpenUnitePlusPage}
        disabled={loading}
      >
        <LinearGradient
          colors={["#6A11CB", "#2575FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.subscribeGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeText}>Obtenir Unite+</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

function BenefitCard({ iconSet = "Feather", icon, title, desc }) {
  const IconComponent =
    iconSet === "MaterialCommunityIcons" ? MaterialCommunityIcons : Feather;

  return (
    <View style={styles.benefitCard}>
      <LinearGradient
        colors={["#fff7f5", "#ffe9e3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.benefitGradient}
      >
        <IconComponent name={icon} size={22} color="#000" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingBottom: 60,
  },
  header: {
    width: "100%",
    paddingVertical: 65,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 17,
    color: "#fdfdfd",
    marginTop: 8,
    opacity: 0.9,
  },
  benefitsContainer: {
    width: "88%",
    marginTop: 10,
    marginBottom: 40,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  benefitGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  benefitTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111",
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  priceText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
  },
  priceSubText: {
    fontSize: 13,
    color: "#777",
    marginTop: 6,
  },
  subscribeBtn: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  subscribeGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
