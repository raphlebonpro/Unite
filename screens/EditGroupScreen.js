// screens/EditGroupScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabaseClient";
import { uploadPublicImage } from "../utils/storage";
import PlaceCitySearchField from "../components/PlaceCitySearchField";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  notifyGroupUpdated,
  notifyGroupDeleted
} from "../helpers/notifications";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

export default function EditGroupScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Champs modifiables
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [cover, setCover] = useState(null);
  const [sportPickerVisible, setSportPickerVisible] = useState(false);
const [tempLocation, setTempLocation] = useState("");
const [tempLat, setTempLat] = useState(null);
const [tempLng, setTempLng] = useState(null);

const sportData = [
  { label: 'Football', icon: <FontAwesome5 name="futbol" size={17} color="#3888FF" /> },
  { label: 'Basketball', icon: <MaterialCommunityIcons name="basketball" size={17} color="#FFA726" /> },
  { label: 'Tennis', icon: <MaterialCommunityIcons name="tennis" size={17} color="#2ECC71" /> },
  { label: 'Running', icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  { label: 'Cyclisme', icon: <MaterialCommunityIcons name="bike" size={17} color="#3CD6E6" /> },
  { label: 'Natation', icon: <MaterialCommunityIcons name="swim" size={17} color="#1469B9" /> },
  { label: 'Musculation', icon: <MaterialCommunityIcons name="dumbbell" size={20} color="#7367F0" /> },
  { label: 'Autres', icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" /> },
  { label: '+ de sports', icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" /> },
];

const otherSports = [
  'Yoga',
  'Padel',
  'Handball',
  'Rugby',
  'Volleyball',
  'Badminton',
  'Triathlon',
  'Randonnée/Trail',
  'VTT',
  'Marche',
  'Kayak',
  'Ski',
  'Snow',
  'Skate',
  'Surf',
  'Escalade',
  'Parapente',
  'CrossFit',
  'Callisthénie',
  'Golf',
  'Arts Martiaux',
  'Boxe',
  'Football américain',
  'Baseball',
  'Tennis de table',
  'Danse',
  'Pilate',
  'Échecs',
  'Pétanque',
];

const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />, color: '#3888FF' },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />, color: '#FFA726' },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />, color: '#2ECC71' },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />, color: '#3CD6E6' },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />, color: '#1469B9' },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />, color: '#7367F0' },
  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={20} color="#A259F7" />, color: '#A259F7' },
  Padel: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />, color: '#FFD600' },
  Handball: { icon: <MaterialCommunityIcons name="handball" size={18} color="#F57C00" />, color: '#F57C00' },
  Autres: { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />, color: '#999' },
  Rugby: { icon: <MaterialCommunityIcons name="rugby" size={18} color="#8E44AD" />, color: '#8E44AD' },
  Volleyball: { icon: <MaterialCommunityIcons name="volleyball" size={18} color="#E57373" />, color: '#E57373' },
  Badminton: { icon: <MaterialCommunityIcons name="badminton" size={18} color="#49beb7" />, color: '#49beb7' },
  Triathlon: { icon: <MaterialCommunityIcons name="medal" size={18} color="#FF9800" />, color: '#FF9800' },
  'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: '#43A047' },
  VTT: { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: '#009688' },
  Marche: { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" />, color: '#00A676' },
  Kayak: { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" />, color: '#0277BD' },
  Ski: { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />, color: '#32C5FF' },
  Snow: { icon: <MaterialCommunityIcons name="snowboard" size={18} color="#5f95de" />, color: '#5f95de' },
  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: '#EB984E' },
  Surf: { icon: <MaterialCommunityIcons name="wave" size={18} color="#26C6DA" />, color: '#26C6DA' },
  Escalade: { icon: <MaterialCommunityIcons name="hiking" size={18} color="#689F38" />, color: '#689F38' },
  Parapente: { icon: <MaterialCommunityIcons name="parachute" size={18} color="#1976D2" />, color: '#1976D2' },
  CrossFit: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" />, color: '#536DFE' },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: '#26A69A' },
  Golf: { icon: <MaterialCommunityIcons name="golf" size={18} color="#43A047" />, color: '#43A047' },
  'Arts Martiaux': { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: '#FF3D00' },
  Boxe: { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#C62828" />, color: '#C62828' },
  'Football américain': { icon: <MaterialCommunityIcons name="football" size={18} color="#FF7043" />, color: '#FF7043' },
  Baseball: { icon: <MaterialCommunityIcons name="baseball" size={18} color="#FFD600" />, color: '#FFD600' },
  'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: '#00B8D4' },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
  Pilate: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: '#BA68C8' },
  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },
  Pétanque: { icon: <MaterialCommunityIcons name="bowling" size={18} color="#757575" />, color: '#757575' },
  '+ de sports': { icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
};

  // Charger les données du groupe existant
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (error) {
        console.error(error);
        Alert.alert("Erreur", "Impossible de charger le groupe.");
        navigation.goBack();
        return;
      }
      setGroup(data);
      setName(data.name);
      setDescription(data.description || "");
      setSport(data.sport);
      setLocation(data.city);
      setCover({ uri: data.cover_url });
      setLoading(false);
    })();
  }, [groupId]);

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

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Nom requis", "Le groupe doit avoir un nom.");
    setSaving(true);
    try {
      let coverUrl = group.cover_url;
      if (cover?.uri && cover.uri !== group.cover_url) {
        coverUrl = await uploadPublicImage("groups", cover.uri, `${name}.jpg`);
      }

      const { error } = await supabase
        .from("groups")
        .update({
          name,
          description,
          sport,
          city: location,
          cover_url: coverUrl,
        })
        .eq("id", groupId);

      if (error) throw error;

// 🔔 Notification "groupe modifié"
const { data: { user } } = await supabase.auth.getUser();
if (user) {
await notifyGroupUpdated({
groupId,
groupName: name,
userId: user.id,
});
}
      Alert.alert("✅ Modifications enregistrées !");
      navigation.goBack();
    } catch (e) {
      console.error("🔥 handleSave error:", e);
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FF5361" />
      </View>
    );
  }

  const handleDeleteGroup = async () => {
  Alert.alert(
    "Supprimer le groupe",
    "Es-tu sûr de vouloir supprimer ce groupe ? Cette action est irréversible.",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("groups")
              .delete()
              .eq("id", groupId);

            if (error) throw error;

// 🔔 Notification "groupe supprimé"
const { data: { user } } = await supabase.auth.getUser();
if (user) {
await notifyGroupDeleted({
groupId,
groupName: group.name,
userId: user.id,
});
}
            Alert.alert("Groupe supprimé", "Le groupe a bien été supprimé.");
            nav.goBack(); // ou navigation.navigate('GroupsList') selon ta logique
          } catch (err) {
            console.error("❌ Erreur suppression groupe :", err);
            Alert.alert("Erreur", "Impossible de supprimer le groupe.");
          }
        },
      },
    ]
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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

        {/* === Nom === */}
        <TextInput
          placeholder="Nom du groupe"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

{/* === Sport principal === */}
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

{/* === Modal de sélection du sport === */}
<Modal
  transparent
  animationType="fade"
  visible={sportPickerVisible}
  onRequestClose={() => setSportPickerVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { maxHeight: "80%" }]}>
      <Text style={styles.modalTitle}>Choisir un sport</Text>

      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 10 }}
      >
        {sportData.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.dropdownItem, { width: "85%", alignSelf: "center" }]}
            onPress={() => {
              setSport(item.label);
              setSportPickerVisible(false);
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <View style={{ marginRight: 10 }}>{item.icon}</View>
              <Text style={styles.dropdownItemText}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setSportPickerVisible(false)}
      >
        <Text style={styles.validateText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* === Ville du groupe === */}
<View style={{ marginTop: 5 }}>
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
      {location || "Ville, village ou arrondissement…"}
    </Text>
  </TouchableOpacity>
</View>

{/* === Modal de sélection de ville === */}
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
      <View style={[styles.addressModalOverlay, { justifyContent: "center", alignItems: "center" }]}>
        <View style={[styles.addressModalContainer, { width: "92%", maxHeight: "80%" }]}>
          {/* Header */}
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
            <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={[styles.addressModalTitle, { marginRight: 10, marginTop: 6 }]}>
              Choisir une ville
            </Text>
            <TouchableOpacity
              style={styles.addressValidateBtn}
              activeOpacity={0.9}
              onPress={() => {
                if (tempLat && tempLng) {
                  setLocation(tempLocation.trim());
                  setLatitude(tempLat);
                  setLongitude(tempLng);
                  setAddressModalVisible(false);
                } else {
                  Alert.alert("Ville introuvable", "Choisis une suggestion valide.");
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
              setTempLocation(description);
              setTempLat(lat);
              setTempLng(lng);
            }}
            placeholder="Ex : Lyon, Bordeaux, 16e arrondissement"
            boxStyle={styles.addressPickerBox}
            suggestionContainerStyle={[styles.addressSuggestBox, { maxHeight: 360 }]}
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

{/* === Bouton Modifier le groupe === */}
<TouchableOpacity
  onPress={handleSave}
  disabled={saving}
  activeOpacity={0.9}
  style={{ alignSelf: "center", marginTop: 16, marginBottom: 12 }}
>
  <LinearGradient
    colors={["#FF9D3C", "#FF6C4A", "#FF375E"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.btn}
  >
    <Text style={styles.btnTxt}>
      {saving ? "Enregistrement…" : "Modifier le groupe"}
    </Text>
  </LinearGradient>
</TouchableOpacity>

{/* === Bouton Supprimer le groupe === */}
<TouchableOpacity
  style={[styles.buttonDanger, { alignSelf: "center", marginTop: 4, marginBottom: 40 }]}
  activeOpacity={0.9}
  onPress={() => {
    Alert.alert(
      "Supprimer le groupe",
      "Es-tu sûr de vouloir supprimer ce groupe ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("groups")
                .delete()
                .eq("id", groupId);
              if (error) throw error;

              Alert.alert("Groupe supprimé", "Le groupe a bien été supprimé.");
              navigation.navigate("Groups");
            } catch (err) {
              console.error("Erreur suppression groupe:", err);
              Alert.alert("Erreur", "Impossible de supprimer le groupe.");
            }
          },
        },
      ]
    );
  }}
>
  <Text style={styles.buttonDangerText}>Supprimer le groupe</Text>
</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // — Layout & surface (identiques à la création)
  safeArea: { flex: 1, backgroundColor: "#F6F7FB" },
  container: { paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#F6F7FB" },

  // — Cover
  coverPicker: { marginBottom: 14, borderRadius: 16, overflow: "hidden" },
  cover: { height: 180, width: "100%", marginTop: 20, },
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

  // — Inputs
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E7E7ED",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    marginBottom: 10,
  },
  inputText: { fontSize: 15, color: "#333" },
  placeholderText: { fontSize: 15, color: "#bababa" },
  dropdownText: { fontSize: 15, color: "#bababa" }, // alias si tu l’utilises déjà
  textarea: { minHeight: 160, textAlignVertical: "top", paddingTop: 14 },

  // — CTA
  btn: {
    width: 300,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // — Modal générique (sélecteur de sport)
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

  // — Modal d’adresse (ville) : même langage visuel
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
  },
  addressModalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  addressValidateBtn: {
    backgroundColor: "#3A6BFF",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addressValidateText: { color: "#fff", fontWeight: "700" },

  // — PlaceCitySearchField containers (cohérents avec l’app)
  addressPickerBox: {
    borderWidth: 1,
    borderColor: "#E7E7ED",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addressSuggestBox: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
buttonDanger: {
  backgroundColor: '#E53935',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
},
buttonDangerText: {
color: "#fff", fontWeight: "700", fontSize: 15 },
buttonDanger: {
  width: 300,
  height: 42,
  backgroundColor: '#E53935',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
  // — Divers
  closeIcon: { position: "absolute", top: 10, right: 10, zIndex: 10 },
});

