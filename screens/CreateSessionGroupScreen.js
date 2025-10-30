// ✅ CreateSessionGroupScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from "react-native";
import { AntDesign, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabaseClient";
import MiniAppBar from "../components/MiniAppBar";
import { useNavigation, useRoute } from "@react-navigation/native";
import PlaceSearchField from "../components/PlaceSearchField";
import {
  notifyNearbyUsersOnSessionCreated,
  notifyGroupSessionCreatedForMembers,
} from "../helpers/notifications";
import Toast from "react-native-toast-message";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { GOOGLE_MAPS_API_KEY } from "../components/PlaceSearchField";


// ---------- Utils ----------
function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatDateYYYYMMDD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function formatTimeHHMM(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function combineLocalDateAndTime(dateOnly, timeOnly) {
  const combined = new Date(dateOnly);
  combined.setHours(timeOnly.getHours(), timeOnly.getMinutes(), 0, 0);
  return combined;
}
function isAllowedStartTime(localDate) {
  const h = localDate.getHours();
  const m = localDate.getMinutes();
  if (h < 6) return false;
  if (h > 21) return false;
  if (h === 21 && m > 0) return false;
  return true;
}

// ---------- Component ----------
export default function CreateSessionGroupScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();

  const [sport, setSport] = useState("");
  const [groupName, setGroupName] = useState("");
  const [title, setTitle] = useState("");
  const [comments, setComments] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [levelPickerVisible, setLevelPickerVisible] = useState(false);
  const levels = ["Pour s'amuser", "Débutant", "Intermédiaire", "Avancé"];
  const [selectedLevel, setSelectedLevel] = useState("");


  // Lieu
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempLocation, setTempLocation] = useState("");
  const [tempLat, setTempLat] = useState(null);
  const [tempLng, setTempLng] = useState(null);
  const [kbOpen, setKbOpen] = useState(false);

  // ---------- Lifecycle ----------
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("sport, name")
        .eq("id", groupId)
        .single();
      if (!error && data) {
        setSport(data.sport);
        setGroupName(data.name);
      }
      setLoadingInit(false);
    };
    fetchGroup();
  }, [groupId]);

  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);

  const handleConfirmTime = (pickedTime) => {
    if (!(pickedTime instanceof Date) || isNaN(pickedTime)) {
      hideTimePicker();
      return;
    }
    const combined = new Date(selectedDate);
    combined.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
    if (!isAllowedStartTime(combined)) {
      Alert.alert(
        "Heure non autorisée",
        "Choisis une heure entre 6h00 et 21h00."
      );
      return;
    }
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (isToday && combined <= now) {
      Alert.alert("Heure invalide", "Choisis une heure future.");
      return;
    }
    setSelectedHour(combined);
    hideTimePicker();
  };

  // ---------- CREATE ----------
  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert("Nom requis", "Ajoute un titre à la session.");
    if (!location || !Number.isFinite(latitude) || !Number.isFinite(longitude))
      return Alert.alert("Lieu manquant", "Choisis un lieu valide.");
    if (!sport) return Alert.alert("Sport manquant", "Erreur : sport du groupe introuvable.");

    const now = new Date();
    const sessionDate = new Date(selectedDate);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      return Alert.alert("Date invalide", "Impossible de créer une session dans le passé.");

    if (sessionDate.getTime() === now.setHours(0, 0, 0, 0)) {
      const start = combineLocalDateAndTime(sessionDate, selectedHour);
      if (start < new Date()) return Alert.alert("Heure invalide", "L'heure sélectionnée est passée.");
    }

    if (!isAllowedStartTime(combineLocalDateAndTime(sessionDate, selectedHour))) {
      return Alert.alert("Heure non autorisée", "Entre 6h00 et 21h00 uniquement.");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Session expirée", "Reconnecte-toi pour créer une session.");
      nav.navigate("Login");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert([
          {
            title,
            description: comments,
            sport,
            location,
            lat: latitude,
            lng: longitude,
            date: formatDateYYYYMMDD(selectedDate),
            time: formatTimeHHMM(selectedHour),
            creator_id: user.id,
            group_id: groupId,
            level: selectedLevel,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const sessionId = data.id;

// ✅ Notification spécifique à une session de groupe
await notifyGroupSessionCreatedForMembers({
  groupId,
  creatorId: user.id,
  sessionTitle: title,
  sessionId,
});

      await notifyNearbyUsersOnSessionCreated({
        sessionId,
        sport,
        lat: latitude,
        lng: longitude,
        creatorId: user.id,
      });

      Toast.show({
        type: "success",
        text1: "Session de groupe créée ✅",
        text2: `Ta session “${title}” est en ligne.`,
        position: "top",
        topOffset: 48,
        visibilityTime: 2500,
      });

      nav.goBack();
    } catch (e) {
      console.error("🔥 handleCreate error:", e);
      Alert.alert("Erreur", e.message || "Impossible de créer la session.");
    }
  };

  if (loadingInit) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator
          size={Platform.OS === "ios" ? "large" : 50}
          color="#5B4EFF"
        />
        <Text style={{ fontSize: 16, color: "#666", marginTop: 12 }}>
          Chargement...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
<ScrollView
  contentContainerStyle={styles.container}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
>

            {/* === Sport (non modifiable) === */}
            <View style={[styles.input, { backgroundColor: "#f7f7f7" }]}>
              <Text style={{ color: "#555", fontWeight: "600", }}>{sport}</Text>
            </View>

{/* === Niveau === */}
<TouchableOpacity
  style={styles.input}
  onPress={() => setLevelPickerVisible(true)}
>
  <Text style={selectedLevel ? styles.inputText : styles.dropdownText}>
    {selectedLevel || "Niveau..."}
  </Text>
</TouchableOpacity>

{/* === Modal Niveau === */}
<Modal
  transparent={true}
  visible={levelPickerVisible}
  animationType="fade"
  onRequestClose={() => setLevelPickerVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Choisir un niveau</Text>

      <ScrollView style={{ maxHeight: 250, width: '100%' }}>
        {levels.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={styles.dropdownItem}
            onPress={() => {
              setSelectedLevel(lvl);
              setLevelPickerVisible(false);
            }}
          >
            <Text style={styles.dropdownItemText}>{lvl}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setLevelPickerVisible(false)}
      >
        <Text style={styles.validateText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

            {/* === Date === */}
            <TouchableOpacity
              style={styles.input}
              activeOpacity={0.85}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.inputText}>
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </TouchableOpacity>

            {/* === Heure === */}
            <TouchableOpacity style={styles.input} onPress={showTimePicker}>
              <Text style={styles.inputText}>
                {selectedHour
                  ? `${selectedHour.getHours().toString().padStart(2, "0")}:${selectedHour
                      .getMinutes()
                      .toString()
                      .padStart(2, "0")}`
                  : "Heure de la session..."}
              </Text>
            </TouchableOpacity>

            {/* === Lieu === */}
            <TouchableOpacity
              style={styles.input}
              activeOpacity={0.85}
              onPress={() => {
                setTempLocation(location || "");
                setTempLat(latitude);
                setTempLng(longitude);
                setAddressModalVisible(true);
              }}
            >
              <Text style={location ? styles.inputText : styles.dropdownText}>
                {location || "Point de rencontre…"}
              </Text>
            </TouchableOpacity>

            {/* === Titre === */}
            <TextInput
              style={[styles.input, styles.inputText]}
              placeholder="Titre de la session..."
              placeholderTextColor="#bababa"
              value={title}
              onChangeText={setTitle}
            />

            {/* === Description === */}
            <TextInput
              style={[styles.input, styles.inputText, { height: 110, textAlignVertical: "top", paddingTop: 12 }]}
              placeholder="Décris rapidement la session..."
              placeholderTextColor="#bababa"
              value={comments}
              onChangeText={setComments}
              multiline
            />

            {/* === Bouton Créer === */}
            <TouchableOpacity
              style={{
                borderRadius: 16,
                overflow: "hidden",
                marginTop: 12,
                marginBottom: 30,
                alignSelf: "center",
              }}
              onPress={handleCreate}
            >
              <LinearGradient
                colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonGradient, { width: "90%" }]}
              >
                <Text style={styles.buttonText}>Créer la session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* === Modal Date === */}
      <Modal transparent animationType="fade" visible={showCalendar}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choisir une date</Text>
            <Calendar
              onDayPress={(day) => {
                const [y, m, d] = day.dateString.split("-").map(Number);
                setSelectedDate(new Date(y, m - 1, d));
                setShowCalendar(false);
              }}
              markedDates={{
                [formatDateYYYYMMDD(selectedDate)]: {
                  selected: true,
                  selectedColor: "#5B4EFF",
                },
              }}
              minDate={formatDateYYYYMMDD(new Date())}
              theme={{
                selectedDayBackgroundColor: "#5B4EFF",
                todayTextColor: "#5B4EFF",
                arrowColor: "#5B4EFF",
              }}
            />
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.validateText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === Modal Heure === */}
      {timePickerVisible && (
        <Modal transparent visible animationType="fade">
          {Platform.OS === "ios" ? (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Heure de la session</Text>
                <DateTimePicker
                  value={selectedHour || new Date()}
                  mode="time"
                  is24Hour
                  display="spinner"
                  onChange={(e, d) => d && setSelectedHour(d)}
                />
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={hideTimePicker}
                >
                  <Text style={styles.validateText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <DateTimePicker
              value={selectedHour || new Date()}
              mode="time"
              is24Hour
              display="spinner"
              onChange={(e, d) => {
                if (e.type === "set" && d) handleConfirmTime(d);
                else hideTimePicker();
              }}
            />
          )}
        </Modal>
      )}

      {/* === Modal Adresse === */}
      <Modal
        transparent
        animationType="fade"
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={[
                styles.addressModalOverlay,
                { justifyContent: "center", alignItems: "center" },
              ]}
            >
              <View
                style={[
                  styles.addressModalContainer,
                  { width: "92%", maxHeight: kbOpen ? "65%" : "80%" },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    paddingHorizontal: 12,
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setAddressModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.addressModalTitle,
                      { marginRight: 10, marginTop: 6 },
                    ]}
                  >
                    Choisir un lieu
                  </Text>

                  <TouchableOpacity
                    style={styles.addressValidateBtn}
                    activeOpacity={0.9}
onPress={async () => {
  if (Number.isFinite(tempLat) && Number.isFinite(tempLng)) {
    // ✅ Cas 1 : l’utilisateur a choisi une suggestion
    setLocation(tempLocation);
    setLatitude(tempLat);
    setLongitude(tempLng);
    setAddressModalVisible(false);
    return;
  }

  // ✅ Cas 2 : tentative de validation manuelle (sans suggestion cliquée)
  const addr = (tempLocation || "").trim();
  if (!addr) {
    Alert.alert("Adresse vide", "Saisis une adresse ou choisis une suggestion.");
    return;
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${GOOGLE_MAPS_API_KEY}&language=fr&components=country:FR`
    );
    const json = await res.json();

    if (json.status === "OK" && json.results?.length > 0) {
      const result = json.results[0];
      const lat = result.geometry.location.lat;
      const lng = result.geometry.location.lng;
      const label = result.formatted_address;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setLocation(label);
        setLatitude(lat);
        setLongitude(lng);
        setAddressModalVisible(false);
        return;
      }
    }

    Alert.alert(
      "Adresse introuvable",
      "Choisis une suggestion ou précise mieux ton adresse."
    );
  } catch (e) {
    Alert.alert("Erreur", "Impossible de valider l’adresse pour le moment.");
  }
}}
                  >
                    <Text style={styles.addressValidateText}>Valider</Text>
                  </TouchableOpacity>
                </View>

<PlaceSearchField
  autoFocus
  value={tempLocation}
  onChange={(txt) => {
    setTempLocation(txt);
    setTempLat(null);
    setTempLng(null);
  }}
  onPick={({ description, lat, lng }) => {
    setTempLocation(description);
    setTempLat(lat);
    setTempLng(lng);
  }}
  placeholder="Ex : Parc Monceau, Paris"
  boxStyle={styles.addressPickerBox}
  suggestionContainerStyle={[styles.addressSuggestBox, { maxHeight: 360, flexGrow: 0 }]}
  keyboardShouldPersistTaps="handled"
/>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 40, paddingBottom: 10 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E7E7ED",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    marginBottom: 25,
  },
  inputText: { fontSize: 15, color: "#333" },
  dropdownText: { fontSize: 15, color: "#bababa" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10, color: "#000" },
  validateButton: {
    marginTop: 10,
    backgroundColor: "#3A6BFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  validateText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonGradient: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 70,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  addressModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  addressModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 8,
  },
  addressModalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  addressPickerBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressValidateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#5B4EFF",
  },
  addressValidateText: { fontWeight: "700", color: "#fff" },
  levelContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 12,
},
dropdownItem: {
  paddingVertical: 12,
  justifyContent: 'center',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
dropdownItemText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
  textAlign: 'center',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '85%',
  backgroundColor: '#fff',
  borderRadius: 16,
  paddingVertical: 20,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 5,
},
validateButton: {
  marginTop: 10,
  backgroundColor: '#3A6BFF',
  paddingVertical: 10,
  paddingHorizontal: 30,
  borderRadius: 10,
},
validateText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
});
