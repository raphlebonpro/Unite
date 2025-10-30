import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStripe } from "@stripe/stripe-react-native";
import { supabase } from "../lib/supabaseClient";
import * as Notifications from "expo-notifications";
import { FontAwesome5, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function UnitePlusScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // 🔹 Vérifie la session utilisateur
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Erreur", "Tu dois être connecté.");
        return;
      }

      // 🔹 Appel Edge Function Stripe
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { user_id: user.id, amount: 399 }, // ✅ 3,99 €
      });

      if (error) throw new Error(error.message || "Erreur serveur");
      if (!data?.clientSecret)
        throw new Error("Impossible d’obtenir le clientSecret Stripe");

      // 🔹 Initialisation Stripe
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: "Unite+",
        defaultBillingDetails: {
          address: { country: "FR" },
        },
        appearance: {
          colors: { primary: "#2575FC" },
          shapes: { borderRadius: 10 },
        },
        style: "automatic",
        locale: "fr", // ✅ force l’interface Stripe en français
      });

      if (initError) throw new Error(initError.message);

      // 🔹 Présentation du paiement
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // Traduction des messages d’erreur
        let message = "Le paiement a été annulé.";
        if (paymentError.code === "Canceled") {
          message = "Le paiement a été annulé.";
        } else if (paymentError.code === "Failed") {
          message = "Le paiement a échoué. Vérifie ta carte ou ta connexion.";
        } else if (paymentError.localizedMessage) {
          message = paymentError.localizedMessage;
        }

        Alert.alert("Paiement annulé", message);
      } else {
        // ✅ Mise à jour du statut premium
        const { error: updateErr } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("id", user.id);

        if (updateErr) throw new Error("Erreur de mise à jour du compte.");

        // 🔔 Ajoute une notification en base
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Bienvenue dans Unite+ ⚡️",
          message:
            "Tu fais maintenant partie du collectif premium ! Profite de tous les avantages sans limites.",
          type: "unite_plus",
          is_read: false,
        });

        // 🔔 Notification locale Expo
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Bienvenue dans Unite+ ⚡️",
            body: "Tu as débloqué toutes les fonctionnalités premium. Merci de soutenir le collectif !",
          },
          trigger: null,
        });

        Alert.alert("✅ Succès", "Abonnement activé — Bienvenue dans Unite+ !");
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
          desc="Anime plusieurs collectifs sportifs, développe ta communauté et fais grandir ton réseau sans contrainte."
        />
        <BenefitCard
          iconSet="MaterialCommunityIcons"
          icon="trophy-outline"
          title="Classements mensuels"
          desc="Accède au classement des créateurs et participants les plus actifs, avec des récompenses à la clé."
        />
        <BenefitCard
          iconSet="Feather"
          icon="award"
          title="Badges premium"
          desc="Obtiens des badges exclusifs selon ton activité et affiche ton statut de leader sur ton profil."
        />
        <BenefitCard
          iconSet="Feather"
          icon="heart"
          title="Soutenir le collectif"
          desc="En rejoignant Unite+, tu participes directement au développement de l’app et du mouvement sportif local."
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
        onPress={handleSubscribe}
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
            <Text style={styles.subscribeText}>Rejoindre Unite+</Text>
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
