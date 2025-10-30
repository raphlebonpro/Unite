import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import { uploadPublicImage } from "../utils/storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlaceCitySearchField from "../components/PlaceCitySearchField";
import { notifyGroupCreated } from "../helpers/notifications";
import { KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from "react-native";

// --- Liste complète des sports ---
const sportData = [
  { label: "Football", icon: <FontAwesome5 name="futbol" size={17} color="#3888FF" /> },
  { label: "Basketball", icon: <MaterialCommunityIcons name="basketball" size={17} color="#FFA726" /> },
  { label: "Tennis", icon: <MaterialCommunityIcons name="tennis" size={17} color="#2ECC71" /> },
  { label: "Running", icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" /> },
  { label: "Cyclisme", icon: <MaterialCommunityIcons name="bike" size={17} color="#3CD6E6" /> },
  { label: "Natation", icon: <MaterialCommunityIcons name="swim" size={17} color="#1469B9" /> },
  { label: "Musculation", icon: <MaterialCommunityIcons name="dumbbell" size={20} color="#7367F0" /> },
  { label: "Autres", icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" /> },
  { label: "+ de sports", icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" /> },
];

const otherSports = [
  "Yoga", "Padel", "Handball", "Rugby", "Volleyball", "Badminton", "Triathlon",
  "Randonnée/Trail", "VTT", "Marche", "Kayak", "Ski", "Snow", "Skate", "Surf",
  "Escalade", "Parapente", "CrossFit", "Callisthénie", "Golf", "Arts Martiaux",
  "Boxe", "Football américain", "Baseball", "Tennis de table", "Danse", "Pilate",
  "Échecs", "Pétanque",
];

const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" /> },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" /> },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" /> },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" /> },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" /> },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" /> },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" /> },
  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={20} color="#A259F7" /> },
  Padel: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" /> },
  Handball: { icon: <MaterialCommunityIcons name="handball" size={18} color="#F57C00" /> },
  Rugby: { icon: <MaterialCommunityIcons name="rugby" size={18} color="#8E44AD" /> },
  Volleyball: { icon: <MaterialCommunityIcons name="volleyball" size={18} color="#E57373" /> },
  Badminton: { icon: <MaterialCommunityIcons name="badminton" size={18} color="#49beb7" /> },
  Triathlon: { icon: <MaterialCommunityIcons name="medal" size={18} color="#FF9800" /> },
  "Randonnée/Trail": { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" /> },
  VTT: { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" /> },
  Marche: { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" /> },
  Kayak: { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" /> },
  Ski: { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" /> },
  Snow: { icon: <MaterialCommunityIcons name="snowboard" size={18} color="#5f95de" /> },
  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" /> },
  Surf: { icon: <MaterialCommunityIcons name="wave" size={18} color="#26C6DA" /> },
  Escalade: { icon: <MaterialCommunityIcons name="hiking" size={18} color="#689F38" /> },
  Parapente: { icon: <MaterialCommunityIcons name="parachute" size={18} color="#1976D2" /> },
  CrossFit: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" /> },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" /> },
  Golf: { icon: <MaterialCommunityIcons name="golf" size={18} color="#43A047" /> },
  "Arts Martiaux": { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" /> },
  Boxe: { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#C62828" /> },
  "Football américain": { icon: <MaterialCommunityIcons name="football" size={18} color="#FF7043" /> },
  Baseball: { icon: <MaterialCommunityIcons name="baseball" size={18} color="#FFD600" /> },
  "Tennis de table": { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" /> },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" /> },
  Pilate: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" /> },
  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" /> },
  Pétanque: { icon: <MaterialCommunityIcons name="bowling" size={18} color="#757575" /> },
};

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sportPickerVisible, setSportPickerVisible] = useState(false);
  const [showOtherSports, setShowOtherSports] = useState(false);
  const insets = useSafeAreaInsets();
const [addressModalVisible, setAddressModalVisible] = useState(false);
// === Localisation (ville uniquement) ===
const [location, setLocation] = useState("");
const [latitude, setLatitude] = useState(null);
const [longitude, setLongitude] = useState(null);
const [tempLat, setTempLat] = useState(null);
const [tempLng, setTempLng] = useState(null);
const [tempLocation, setTempLocation] = useState("");
const [kbOpen, setKbOpen] = useState(false);

useEffect(() => {
  const s = Keyboard.addListener("keyboardDidShow", () => setKbOpen(true));
  const h = Keyboard.addListener("keyboardDidHide", () => setKbOpen(false));
  return () => {
    s.remove();
    h.remove();
  };
}, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission", "Autorise l’accès à ta galerie.");
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) setCover(res.assets[0]);
  };

const handleCreate = async () => {
  if (!name.trim()) return Alert.alert("Nom requis", "Le groupe doit avoir un nom.");
  if (!sport) return Alert.alert("Sport requis", "Choisis un sport principal.");
  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    console.log("👤 Utilisateur connecté:", user.id);

    let coverUrl = null;
    if (cover?.uri) {
      console.log("🖼️ Upload de l'image...");
      coverUrl = await uploadPublicImage("groups", cover.uri, `${name}.jpg`);
      console.log("✅ Image uploadée:", coverUrl);
    }

    console.log("➡️ Insertion groupe...");
    const { data, error } = await supabase
      .from("groups")
      .insert([{
        name,
        description,
        sport,
        city: location,
        cover_url: coverUrl,
        creator_id: user.id, // ✅ attention ici
      }])
      .select("id")
      .single();

    if (error) {
      console.error("❌ ERREUR INSERT GROUPS:", error);
      Alert.alert("Erreur (groups)", error.message);
      setLoading(false);
      return;
    }

    console.log("✅ Groupe inséré avec ID:", data.id);

    console.log("➡️ Insertion membre admin...");
    const { error: memberError } = await supabase
      .from("group_members")
      .insert([{
        group_id: data.id,
        user_id: user.id,
        role: "admin",
      }]);

    if (memberError) {
      console.error("❌ ERREUR INSERT MEMBER:", memberError);
      Alert.alert("Erreur (group_members)", memberError.message);
      setLoading(false);
      return;
    }

console.log("✅ Membre admin inséré !");

// 🔔 Notification de création de groupe
await notifyGroupCreated({
creatorId: user.id,
groupId: data.id,
groupName: name,
});

Alert.alert("✅ Groupe créé", "Ton groupe est en ligne !");
navigation.replace("GroupDetail", { groupId: data.id });


  } catch (e) {
    console.error("🔥 ERREUR handleCreate:", e);
    Alert.alert("Erreur", e.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* === ESPACE SUPÉRIEUR entre mini app bar et contenu === */}
        <View style={{ height: 20 }} />

        {/* === Nom du groupe avant image === */}
        <TextInput
          placeholder="Nom du groupe"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        {/* === Image de couverture === */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.coverPicker}>
          {cover?.uri ? (
            <Image source={{ uri: cover.uri }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Feather name="image" size={34} color="#999" />
              <Text style={styles.coverTxt}>Ajouter une image de couverture</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* === Sélecteur de sport === */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setSportPickerVisible(true)}
          activeOpacity={0.8}
        >
          {sport ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ marginRight: 10 }}>
                {sportIcons[sport]?.icon || null}
              </View>
              <Text style={styles.inputText}>{sport}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Sport principal...</Text>
          )}
        </TouchableOpacity>

{/* Lieu */}
{/* === Ville du groupe === */}
<View style={{ marginTop: 5 }}>
  <TouchableOpacity
    style={styles.input}
    activeOpacity={0.85}
    onPress={() => {
      // Pré-remplit le modal avec la valeur actuelle
      setTempLocation(location || '');
      setTempLat(latitude);
      setTempLng(longitude);
      setAddressModalVisible(true);
    }}
  >
    <Text style={location ? styles.inputText : styles.dropdownText}>
      {location || "Ville, village ou arrondissement…"}
    </Text>
  </TouchableOpacity>

  {location && (latitude === null || longitude === null) && (
    <Text style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
      Sélectionne une suggestion puis valide pour confirmer la ville.
    </Text>
  )}
</View>

{/* === Modal Choix de ville === */}
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
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={insets.top}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.addressModalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.addressModalContainer, { width: '92%', maxHeight: kbOpen ? '65%' : '80%' }]}>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingHorizontal: 12,
              marginTop: 8,
            }}
          >
            {/* Croix */}
            <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            {/* Titre */}
            <Text style={[styles.addressModalTitle, { marginRight: 10, marginTop: 6 }]}>
              Choisir une ville
            </Text>

            {/* Bouton Valider */}
<TouchableOpacity
  style={styles.addressValidateBtn}
  activeOpacity={0.9}
  onPress={() => {
    const latN = Number(tempLat);
    const lngN = Number(tempLng);

    console.log('✅ Validation →', tempLocation, latN, lngN);

    if (!isNaN(latN) && !isNaN(lngN)) {
      setLocation((tempLocation || '').trim());
      setLatitude(latN);
      setLongitude(lngN);
      setAddressModalVisible(false);
    } else {
      Alert.alert('Ville introuvable', "Choisis une suggestion valide.");
    }
  }}
>
  <Text style={styles.addressValidateText}>Valider</Text>
</TouchableOpacity>

          </View>

          {/* Champ de recherche */}
<PlaceCitySearchField
  autoFocus
  value={tempLocation}
  onChange={(txt) => {
    setTempLocation(txt);
    setTempLat(null);
    setTempLng(null);
  }}
  onPick={({ description, lat, lng }) => {
    const latN = Number(lat);
    const lngN = Number(lng);
    console.log('📍 Ville sélectionnée →', description, latN, lngN);
    setTempLocation(description);
    setTempLat(latN);
    setTempLng(lngN);
  }}
  placeholder="Ex : Lyon, Bordeaux, 16e arrondissement"
  boxStyle={styles.addressPickerBox}
  suggestionContainerStyle={[styles.addressSuggestBox, { maxHeight: 360, flexGrow: 0 }]}
  keyboardShouldPersistTaps="handled"
/>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
</Modal>

        {/* === Description === */}
        <TextInput
          placeholder="Description du groupe..."
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* === Bouton Créer (rétréci) === */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.9}
          style={{ alignSelf: "center", marginTop: 8, marginBottom: 30 }}
        >
          <LinearGradient
            colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <Text style={styles.btnTxt}>
              {loading ? "Création…" : "Créer le groupe"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* === Modal sports === */}
        <Modal
          transparent
          animationType="fade"
          visible={sportPickerVisible}
          onRequestClose={() => setSportPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { maxHeight: "80%" }]}>
              <Text style={styles.modalTitle}>
                {showOtherSports ? "Autres sports" : "Choisir un sport"}
              </Text>

              <ScrollView
                style={{ width: "100%" }}
                contentContainerStyle={{ alignItems: "center", paddingBottom: 10 }}
              >
                {!showOtherSports
                  ? sportData.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        style={[styles.dropdownItem, { width: "85%", alignSelf: "center" }]}
                        onPress={() => {
                          if (item.label === "+ de sports") {
                            setShowOtherSports(true);
                          } else {
                            setSport(item.label);
                            setSportPickerVisible(false);
                          }
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <View style={{ marginRight: 10 }}>{item.icon}</View>
                          <Text style={styles.dropdownItemText}>{item.label}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  : otherSports.map((label) => (
                      <TouchableOpacity
                        key={label}
                        style={[styles.dropdownItem, { width: "85%", alignSelf: "center" }]}
                        onPress={() => {
                          setSport(label);
                          setShowOtherSports(false);
                          setSportPickerVisible(false);
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <View style={{ marginRight: 10 }}>{sportIcons[label]?.icon}</View>
                          <Text style={styles.dropdownItemText}>{label}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.validateButton}
                onPress={() =>
                  showOtherSports ? setShowOtherSports(false) : setSportPickerVisible(false)
                }
              >
                <Text style={styles.validateText}>
                  {showOtherSports ? "Retour" : "Fermer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F7FB" }, // ✅ même fond que création de session
  container: { paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#F6F7FB" },
  coverPicker: { marginBottom: 14, borderRadius: 16, overflow: "hidden" },
  cover: { height: 180, width: "100%" },
  coverPlaceholder: {
    height: 180,
    borderWidth: 1,
    borderColor: "#E7E7ED",
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  coverTxt: { color: "#666", fontWeight: "600", marginTop: 6 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E7E7ED",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    marginBottom: 14,
  },
  inputText: { fontSize: 15, color: "#333" },
  placeholderText: { fontSize: 15, color: "#bababa" },
  textarea: { minHeight: 160, textAlignVertical: "top", paddingTop: 14 },
  btn: {
    width: 300, // ✅ bouton plus étroit
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: "#F0F0F3",
    borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 15, color: "#222" },
  validateButton: {
    marginTop: 10,
    backgroundColor: "#3A6BFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  validateText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  addressModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
},
addressModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
},
addressModalContainer: {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 14,
  elevation: 8,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  width: "92%",
  maxHeight: "80%",
},
addressModalTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 8,
  color: "#000",
},
addressPickerBox: {
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#eee",
  paddingHorizontal: 12,
  paddingVertical: 10,
  backgroundColor: "#fff",
},
addressValidateBtn: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 10,
  backgroundColor: "#5B4EFF",
  alignItems: "center",
  justifyContent: "center",
},
addressValidateText: {
  fontWeight: "700",
  color: "#fff",
  fontSize: 16,
},
});
