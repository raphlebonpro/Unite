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
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- Liste complète des sports ---
const sportData = [
  { label: 'Football', icon: <FontAwesome5 name="futbol" size={hp('2.1%')} color="#3888FF" /> },
  { label: 'Basketball', icon: <MaterialCommunityIcons name="basketball" size={hp('2.1%')} color="#FFA726" /> },
  { label: 'Tennis', icon: <MaterialCommunityIcons name="tennis" size={hp('2.1%')} color="#2ECC71" /> },
  { label: 'Padel', icon: <MaterialCommunityIcons name="tennis" size={hp('2.1%')} color="#FFD600" /> },
  { label: 'Running', icon: <MaterialCommunityIcons name="run-fast" size={hp('2.3%')} color="#E9436D" /> },
  { label: 'Cyclisme', icon: <MaterialCommunityIcons name="bike" size={hp('2.1%')} color="#3CD6E6" /> },
  { label: 'Natation', icon: <MaterialCommunityIcons name="swim" size={hp('2.1%')} color="#1469B9" /> },
  { label: 'Musculation', icon: <MaterialCommunityIcons name="dumbbell" size={hp('2.4%')} color="#7367F0" /> },
  { label: 'Fitness', icon: <MaterialCommunityIcons name="weight-lifter" size={hp('2.3%')} color="#7C4DFF" /> },
  { label: 'Randonnée/Trail', icon: <MaterialCommunityIcons name="hiking" size={hp('2.1%')} color="#43A047" /> },
  { label: '+ de sports', icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
];

const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />, color: '#3888FF' },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />, color: '#FFA726' },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />, color: '#2ECC71' },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />, color: '#3CD6E6' },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />, color: '#1469B9' },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />, color: '#7367F0' },
  Fitness: { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#7C4DFF" />, color: '#7C4DFF' },
  Autres: { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />,color: '#999',},

  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={18} color="#A259F7" />, color: '#A259F7' },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
  Pilates: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: '#BA68C8' },

  Padel: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />, color: '#FFD600' },
  'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: '#00B8D4' },

  'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: '#43A047' },
  'Ski de randonnée': { icon: <MaterialCommunityIcons name="ski-cross-country" size={18} color="#4FC3F7" />, color: '#4FC3F7' },
  'Ski/Snow': { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />, color: '#32C5FF' },

  VTT: { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: '#009688' },
  Marche: { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" />, color: '#00A676' },
  Kayak: { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" />, color: '#0277BD' },

  Surf: { icon: <MaterialCommunityIcons name="surfing" size={18} color="#26C6DA" />, color: '#26C6DA' },
  Kitesurf: { icon: <MaterialCommunityIcons name="kitesurfing" size={18} color="#29B6F6" />, color: '#29B6F6' },
  Windsurf: { icon: <MaterialCommunityIcons name="windsock" size={18} color="#42A5F5" />, color: '#42A5F5' },
  'Stand Up Paddle': { icon: <MaterialCommunityIcons name="wave" size={18} color="#26A69A" />, color: '#26A69A' },

  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: '#EB984E' },
  Roller: { icon: <MaterialCommunityIcons name="roller-skate" size={18} color="#FF8A65" />, color: '#FF8A65' },

  Escalade: { icon: <MaterialCommunityIcons name="terrain" size={18} color="#689F38" />, color: '#689F38' },
  Parapente: { icon: <MaterialCommunityIcons name="paragliding" size={18} color="#1976D2" />, color: '#1976D2' },

  CrossFit: { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#536DFE" />, color: '#536DFE' },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: '#26A69A' },

  'Arts Martiaux': { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: '#FF3D00' },

  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },

  '+ de sports': { icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
};

const otherSports = [
  'CrossFit',
  'Yoga',
  'Pilates',
  'Danse',
  'Marche',
  'VTT',
  'Kayak',
  'Surf',
  'Kitesurf',
  'Stand Up Paddle',
  'Ski/Snow',
  'Ski de randonnée',
  'Skate',
  'Roller',
  'Escalade',
  'Parapente',
  'Callisthénie',
  'Arts Martiaux',
  'Tennis de table',
  'Échecs',
  'Autres'
];

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

  const confirmCreateGroup = () => {
  Alert.alert(
    "Créer ce groupe ?",
    "Tu pourras modifier les informations du groupe à tout moment.",
    [
      { text: "Annuler", style: "cancel" },
      { text: "Créer", onPress: handleCreate },
    ]
  );
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
<SafeAreaView style={{ flex: 1 }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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
            <Text style={styles.placeholderText}>Sport principal</Text>
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
</View>

{/* === Modal Choix de ville === */}
<Modal
  visible={addressModalVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setAddressModalVisible(false)}
>
  <View style={styles.addressOverlay}>

    <SafeAreaView style={styles.addressFullscreenContainer}>

      {/* HEADER */}
      <View style={styles.addressHeader}>
        <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
          <Ionicons name="close" size={26} color="#444" />
        </TouchableOpacity>

        <Text style={styles.addressTitle}>Choisir un lieu</Text>

<TouchableOpacity
  disabled={!tempLocation.trim()}
  onPress={() => {
    setLocation(tempLocation.trim());
    setAddressModalVisible(false);
  }}
  style={[
    styles.addressValidateBtn,
    { opacity: tempLocation.trim() ? 1 : 0.4 },
  ]}
>
  <Text style={styles.addressValidateText}>Valider</Text>
</TouchableOpacity>
</View>

      {/* SEARCH + LIST */}
      <View style={{ flex: 1 }}>
        <PlaceCitySearchField
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
          boxStyle={styles.addressSearchBox}
          suggestionContainerStyle={styles.addressSuggestions}
          keyboardShouldPersistTaps="handled"
        />
      </View>

    </SafeAreaView>
  </View>
</Modal>

        {/* === Description === */}
        <TextInput
          placeholder="Présente ton groupe, club ou association (facultatif)"
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

      <Text style={{ 
         textAlign: 'center', 
         fontSize: 11, 
         color: '#666', 
         marginBottom: 6 
        }}>
         Un groupe permet d’échanger, organiser et inviter des membres
       </Text>

        {/* === Bouton Créer (rétréci) === */}
        <TouchableOpacity
          onPress={confirmCreateGroup}
          disabled={loading}
          activeOpacity={0.9}
          style={{ alignSelf: "center", marginTop: 8, marginBottom: 30 }}
        >
<View
  style={[
    styles.btn,
    {
      backgroundColor: '#FE5D02',
    },
  ]}
  disabled={loading}
>
  <Text style={styles.btnTxt}>
    {loading ? 'Création…' : 'Créer le groupe'}
  </Text>
</View>
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
  </KeyboardAvoidingView>
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
    marginTop: 10,
    width: 300,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
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
addressOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
},
addressFullscreenContainer: {
  flex: 1,
  backgroundColor: '#fff',
  paddingTop: 8,
},
addressHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
addressTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#111',
},
addressValidateBtn: {
  backgroundColor: '#5B5FFF',
  paddingHorizontal: 18,
  paddingVertical: 8,
  borderRadius: 8,
},
addressValidateText: {
  color: '#fff',
  fontWeight: '600',
},
addressSearchBox: {
  marginTop: 12,
  marginHorizontal: 16,
},
addressSuggestions: {
  flex: 1,
  marginTop: 8,
  paddingHorizontal: 16,
},
});
