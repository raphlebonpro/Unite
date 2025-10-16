import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabaseClient";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

export default function VerifyEmailScreen({ navigation }) {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  const handleSendCode = async () => {
    try {
      setSending(true);
      const { data, error } = await supabase.functions.invoke("request_email_verification", { body: {} });
      if (error || !data?.ok) throw error || new Error("Erreur envoi code");
      Alert.alert("📩 Code envoyé", "Regarde ta boîte mail (valable 15 min).");
    } catch (err) {
      Alert.alert("Erreur", "Impossible d’envoyer le code. Réessaie plus tard.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Code invalide", "Entre les 6 chiffres reçus par email.");
      return;
    }
    try {
      setVerifying(true);
      const { data, error } = await supabase.functions.invoke("verify_email_code", { body: { code } });
      if (error || !data?.ok) throw error || new Error("Erreur vérification");
      Alert.alert("✅ Email confirmé", "Ton profil est maintenant vérifié !", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Erreur", "Code invalide ou expiré.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* 🔸 Titre */}
            <Text style={styles.title}>Deviens un membre vérifié ✅</Text>
            <Text style={styles.subtitle}>
              Montre que ton profil est authentique et fais partie de la communauté Unite.
            </Text>

            {/* Bouton envoyer code (noir sobre) */}
            <TouchableOpacity
              style={[styles.btnBlack, sending && { opacity: 0.6 }]}
              onPress={handleSendCode}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Envoyer le code par e-mail</Text>
              )}
            </TouchableOpacity>

            {/* Champ code */}
            <TextInput
              style={styles.input}
              value={code}
              placeholder="Code à 6 chiffres"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              maxLength={6}
              onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
            />

            {/* Bouton valider (dégradé Unite) */}
            <TouchableOpacity
              style={[styles.btnGradientContainer, (verifying || code.length !== 6)]}
              onPress={handleVerify}
              disabled={verifying || code.length !== 6}
            >
              <LinearGradient
                colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Valider</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp("8%"),
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
    marginBottom: 10,
    textAlign: "center",
    marginTop: -100, // 🔼 remonte le titre
  },
  subtitle: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 40,
  },
input: {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  height: 60,
  width: "100%",              // ✅ augmente la longueur visuelle
  alignSelf: "center",       // ✅ centre le champ
  fontSize: 17,
  textAlign: "center",
  marginTop: 20,
  color: "#111",
  backgroundColor: "#fafafa",
},
  btnBlack: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
btnGradientContainer: {
  marginTop: 20,
  borderRadius: 12,
  overflow: "hidden",
  alignSelf: "center",       // ✅ centre le bouton
  width: "75%",              // ✅ réduit la largeur (ajuste entre 60–70% selon rendu)
},
btnGradient: {
  height: 46,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
},
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
