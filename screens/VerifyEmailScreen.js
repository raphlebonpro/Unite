import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

// ─── Étapes ───────────────────────────────────────────────────────────────────

const STEPS = [
  { key: "send",   label: "Envoyer le code" },
  { key: "verify", label: "Valider" },
];

export default function VerifyEmailScreen({ navigation }) {
  const [step,      setStep]      = useState(0); // 0 = send, 1 = verify
  const [sending,   setSending]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent,  setCodeSent]  = useState(false);
  const [code,      setCode]      = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleSendCode = async () => {
    try {
      setSending(true);
      const { data, error } = await supabase.functions.invoke("request_email_verification", { body: {} });
      if (error || !data?.ok) throw error || new Error("Erreur envoi code");
      setCodeSent(true);
      setStep(1);
      Alert.alert("Code envoyé", "Regarde ta boîte mail — le code est valable 15 min.");
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le code. Réessaie plus tard.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { shake(); return; }
    try {
      setVerifying(true);
      const { data, error } = await supabase.functions.invoke("verify_email_code", { body: { code } });
      if (error || !data?.ok) throw error || new Error("Erreur vérification");
      Alert.alert("Compte vérifié", "Ton profil affiche désormais le badge vérifié.", [
        { text: "Super !", onPress: () => navigation.goBack() },
      ]);
    } catch {
      shake();
      Alert.alert("Code invalide", "Le code est incorrect ou expiré. Renvoie-en un nouveau.");
    } finally {
      setVerifying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.root}>

            {/* ── Hero ── */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={["#FFF3EE", "#FFE0CC"]}
                style={styles.heroBadge}
              >
                <Ionicons name="shield-checkmark" size={36} color="#FE5D02" />
              </LinearGradient>

              <Text style={styles.heroTitle}>Vérifier mon compte</Text>
              <Text style={styles.heroSub}>
                Un code à 6 chiffres sera envoyé à l'adresse associée à ton compte.
              </Text>
            </View>

            {/* ── Stepper ── */}
            <View style={styles.stepper}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                  <View style={styles.stepItem}>
                    <View style={[
                      styles.stepDot,
                      step >= i && styles.stepDotActive,
                      step > i && styles.stepDotDone,
                    ]}>
                      {step > i
                        ? <Ionicons name="checkmark" size={13} color="#fff" />
                        : <Text style={[styles.stepNum, step >= i && styles.stepNumActive]}>{i + 1}</Text>
                      }
                    </View>
                    <Text style={[styles.stepLabel, step >= i && styles.stepLabelActive]}>
                      {s.label}
                    </Text>
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepLine, step > i && styles.stepLineActive]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* ── Étape 1 : Envoyer le code ── */}
            {step === 0 && (
              <View style={styles.section}>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#FE5D02" style={{ marginRight: 8, flexShrink: 0 }} />
                  <Text style={styles.infoText}>
                    Le code est envoyé à l'adresse email de ton compte. Vérifie aussi tes spams.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.ctaBtn, sending && styles.ctaBtnDisabled]}
                  onPress={handleSendCode}
                  disabled={sending}
                  activeOpacity={0.88}
                >
                  {sending
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="mail-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.ctaBtnText}>Recevoir mon code</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}

            {/* ── Étape 2 : Saisir le code ── */}
            {step === 1 && (
              <View style={styles.section}>
                <Text style={styles.codeLabel}>Saisis les 6 chiffres reçus</Text>

                <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                  <TextInput
                    style={[styles.codeInput, code.length === 6 && styles.codeInputFull]}
                    value={code}
                    placeholder="• • • • • •"
                    placeholderTextColor="#CCCCCC"
                    keyboardType="numeric"
                    maxLength={6}
                    onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
                    autoFocus
                    textAlign="center"
                    letterSpacing={8}
                  />
                </Animated.View>

                <TouchableOpacity
                  style={[styles.ctaBtn, (verifying || code.length !== 6) && styles.ctaBtnDisabled]}
                  onPress={handleVerify}
                  disabled={verifying || code.length !== 6}
                  activeOpacity={0.88}
                >
                  {verifying
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.ctaBtnText}>Valider le code</Text>
                      </>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn} onPress={() => { setStep(0); setCode(""); }} activeOpacity={0.7}>
                  <Ionicons name="refresh-outline" size={15} color="#FE5D02" style={{ marginRight: 5 }} />
                  <Text style={styles.resendText}>Renvoyer un nouveau code</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  root: {
    flex: 1,
    paddingHorizontal: wp("6%"),
    paddingTop: hp("1%"),
  },

  // Back
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
    alignSelf: "flex-start",
  },

  // Hero
  heroSection: { alignItems: "center", marginTop: hp("4%"), marginBottom: hp("4%") },
  heroBadge: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#FE5D02", shadowOpacity: 0.25, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  heroTitle: {
    fontSize: wp("6%"), fontWeight: "800", color: "#1A1A2E",
    letterSpacing: -0.3, marginBottom: 10, textAlign: "center",
  },
  heroSub: {
    fontSize: wp("3.8%"), color: "#888", lineHeight: 22,
    textAlign: "center", paddingHorizontal: wp("4%"),
  },

  // Stepper
  stepper: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", marginBottom: hp("4%"),
    paddingHorizontal: wp("8%"),
  },
  stepItem:  { alignItems: "center", flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#F3F4F6", borderWidth: 2, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  stepDotActive: { backgroundColor: "#FFF3EE", borderColor: "#FE5D02" },
  stepDotDone:   { backgroundColor: "#FE5D02", borderColor: "#FE5D02" },
  stepNum:       { fontSize: 12, fontWeight: "700", color: "#AAAAAA" },
  stepNumActive: { color: "#FE5D02" },
  stepLabel:     { fontSize: wp("2.9%"), fontWeight: "600", color: "#BBBBBB", textAlign: "center" },
  stepLabelActive: { color: "#1A1A2E" },
  stepLine: {
    flex: 0.6, height: 2, backgroundColor: "#F3F4F6",
    marginTop: -18, marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: "#FE5D02" },

  // Section
  section: { width: "100%" },

  // Info box
  infoBox: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#FFF8F5", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#FFD6C0", marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: wp("3.5%"), color: "#666", lineHeight: 20 },

  // Code input
  codeLabel: {
    fontSize: wp("3.8%"), fontWeight: "600", color: "#666",
    textAlign: "center", marginBottom: 16,
  },
  codeInput: {
    height: 64, borderRadius: 16, borderWidth: 2,
    borderColor: "#E5E7EB", backgroundColor: "#FAFAFA",
    fontSize: 28, fontWeight: "800", color: "#1A1A2E",
    textAlign: "center", letterSpacing: 10,
    marginBottom: 24,
  },
  codeInputFull: { borderColor: "#FE5D02", backgroundColor: "#FFF8F5" },

  // CTA
  ctaBtn: {
    height: 48, backgroundColor: "#FE5D02", borderRadius: 18, marginHorizontal: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  ctaBtnDisabled: { backgroundColor: "#FDB490", shadowOpacity: 0 },
  ctaBtnText: { color: "#fff", fontWeight: "700", fontSize: wp("4%") },

  // Resend
  resendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 16,
  },
  resendText: { fontSize: wp("3.5%"), color: "#FE5D02", fontWeight: "600" },
});
