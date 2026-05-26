import React, { useState } from "react";
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
  KeyboardAvoidingView,
  ActivityIndicator,
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
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// ─── DATA ────────────────────────────────────────────────────────────────────

const GROUP_TYPES = [
  { value: "Communauté",  icon: "people-outline",   color: "#3888FF" },
  { value: "Club",        icon: "shield-outline",   color: "#7367F0" },
  { value: "BDE",         icon: "school-outline",   color: "#F5A623" },
  { value: "Événement",   icon: "calendar-outline", color: "#E9436D" },
  { value: "Association", icon: "ribbon-outline",   color: "#2ECC71" },
  { value: "Amis",        icon: "heart-outline",    color: "#FF6B9D" },
];

const PRIVACY_OPTIONS = [
  { value: "open",    label: "Ouvert",      desc: "Tout le monde peut rejoindre", icon: "earth-outline",            color: "#2ECC71" },
  { value: "request", label: "Sur demande", desc: "Tu valides chaque membre",     icon: "checkmark-circle-outline", color: "#F5A623" },
  { value: "private", label: "Fermé",       desc: "Invitation uniquement",        icon: "lock-closed-outline",      color: "#E53935" },
];

const sportData = [
  { label: "Football",        icon: <FontAwesome5 name="futbol" size={hp("2.1%")} color="#3888FF" /> },
  { label: "Basketball",      icon: <MaterialCommunityIcons name="basketball" size={hp("2.1%")} color="#FFA726" /> },
  { label: "Tennis",          icon: <MaterialCommunityIcons name="tennis" size={hp("2.1%")} color="#2ECC71" /> },
  { label: "Padel",           icon: <MaterialCommunityIcons name="tennis" size={hp("2.1%")} color="#FFD600" /> },
  { label: "Running",         icon: <MaterialCommunityIcons name="run-fast" size={hp("2.3%")} color="#E9436D" /> },
  { label: "Cyclisme",        icon: <MaterialCommunityIcons name="bike" size={hp("2.1%")} color="#3CD6E6" /> },
  { label: "Natation",        icon: <MaterialCommunityIcons name="swim" size={hp("2.1%")} color="#1469B9" /> },
  { label: "Musculation",     icon: <MaterialCommunityIcons name="dumbbell" size={hp("2.4%")} color="#7367F0" /> },
  { label: "Fitness",         icon: <MaterialCommunityIcons name="weight-lifter" size={hp("2.3%")} color="#7C4DFF" /> },
  { label: "Randonnée/Trail", icon: <MaterialCommunityIcons name="hiking" size={hp("2.1%")} color="#43A047" /> },
  { label: "+ de sports",     icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" /> },
];

const sportIcons = {
  Football:           { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />,                          color: "#3888FF" },
  Basketball:         { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />,            color: "#FFA726" },
  Tennis:             { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />,                color: "#2ECC71" },
  Running:            { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />,              color: "#E9436D" },
  Cyclisme:           { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />,                  color: "#3CD6E6" },
  Natation:           { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />,                  color: "#1469B9" },
  Musculation:        { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />,              color: "#7367F0" },
  Fitness:            { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#7C4DFF" />,         color: "#7C4DFF" },
  Autres:             { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />,                    color: "#999"    },
  Yoga:               { icon: <MaterialCommunityIcons name="yoga" size={18} color="#A259F7" />,                  color: "#A259F7" },
  Danse:              { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />,    color: "#F48FB1" },
  Pilates:            { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />,            color: "#BA68C8" },
  Padel:              { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />,                color: "#FFD600" },
  "Tennis de table":  { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />,          color: "#00B8D4" },
  "Randonnée/Trail":  { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />,                color: "#43A047" },
  "Ski de randonnée": { icon: <MaterialCommunityIcons name="ski-cross-country" size={18} color="#4FC3F7" />,     color: "#4FC3F7" },
  "Ski/Snow":         { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />,                   color: "#32C5FF" },
  VTT:                { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />,                  color: "#009688" },
  Marche:             { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" />,                  color: "#00A676" },
  Kayak:              { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" />,              color: "#0277BD" },
  Surf:               { icon: <MaterialCommunityIcons name="surfing" size={18} color="#26C6DA" />,               color: "#26C6DA" },
  Kitesurf:           { icon: <MaterialCommunityIcons name="kitesurfing" size={18} color="#29B6F6" />,           color: "#29B6F6" },
  Windsurf:           { icon: <MaterialCommunityIcons name="windsock" size={18} color="#42A5F5" />,              color: "#42A5F5" },
  "Stand Up Paddle":  { icon: <MaterialCommunityIcons name="wave" size={18} color="#26A69A" />,                  color: "#26A69A" },
  Skate:              { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />,            color: "#EB984E" },
  Roller:             { icon: <MaterialCommunityIcons name="roller-skate" size={18} color="#FF8A65" />,          color: "#FF8A65" },
  Escalade:           { icon: <MaterialCommunityIcons name="terrain" size={18} color="#689F38" />,               color: "#689F38" },
  Parapente:          { icon: <MaterialCommunityIcons name="paragliding" size={18} color="#1976D2" />,           color: "#1976D2" },
  CrossFit:           { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#536DFE" />,         color: "#536DFE" },
  Callisthénie:       { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />,              color: "#26A69A" },
  "Arts Martiaux":    { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />,          color: "#FF3D00" },
  Échecs:             { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />,           color: "#4E342E" },
};

const otherSports = [
  "CrossFit","Yoga","Pilates","Danse","Marche","VTT","Kayak",
  "Surf","Kitesurf","Stand Up Paddle","Ski/Snow","Ski de randonnée",
  "Skate","Roller","Escalade","Parapente","Callisthénie",
  "Arts Martiaux","Tennis de table","Échecs","Autres",
];

// ─── SOUS-COMPOSANTS ─────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, required }) => (
  <View style={sh.row}>
    <View style={sh.iconWrap}>
      <Ionicons name={icon} size={15} color="#FE5D02" />
    </View>
    <Text style={sh.title}>{title}</Text>
    {required && <Text style={sh.req}> *</Text>}
  </View>
);

const sh = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 4 },
  iconWrap:{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#FFF0E8", alignItems: "center", justifyContent: "center", marginRight: 8 },
  title:   { fontSize: 12, fontWeight: "700", color: "#555", letterSpacing: 0.6, textTransform: "uppercase" },
  req:     { color: "#E53935", fontSize: 13, fontWeight: "700" },
});

const Divider = () => <View style={{ height: 1, backgroundColor: "#F2F2F7" }} />;

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function CreateGroupScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [sport,       setSport]       = useState("");
  const [cover,       setCover]       = useState(null);
  const [loading,     setLoading]     = useState(false);

  const [privacy,      setPrivacy]      = useState("open");
  const [groupType,    setGroupType]    = useState("");
  const [externalLink, setExternalLink] = useState("");

  const [location,            setLocation]            = useState("");
  const [tempLocation,        setTempLocation]        = useState("");
  const [tempLat,             setTempLat]             = useState(null);
  const [tempLng,             setTempLng]             = useState(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [sportPickerVisible, setSportPickerVisible] = useState(false);
  const [showOtherSports,    setShowOtherSports]    = useState(false);

  const canCreate = !!groupType && !!name.trim() && !!sport;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission", "Autorise l'accès à ta galerie.");
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8, allowsEditing: true, aspect: [16, 9],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) setCover(res.assets[0]);
  };

  const confirmCreate = () =>
    Alert.alert("Créer ce groupe ?", "Tu pourras tout modifier ensuite.", [
      { text: "Annuler", style: "cancel" },
      { text: "Créer", onPress: handleCreate },
    ]);

  const handleCreate = async () => {
    if (!groupType)   return Alert.alert("Type requis",  "Choisis le type de ton groupe.");
    if (!name.trim()) return Alert.alert("Nom requis",   "Le groupe doit avoir un nom.");
    if (!sport)       return Alert.alert("Sport requis", "Choisis un sport principal.");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let coverUrl = null;
      if (cover?.uri) coverUrl = await uploadPublicImage("groups", cover.uri, `${name}.jpg`);

      const { data, error } = await supabase.from("groups").insert([{
        name, description, sport,
        city:          location,
        cover_url:     coverUrl,
        creator_id:    user.id,
        privacy,
        group_type:    groupType || null,
        external_link: externalLink.trim() || null,
      }]).select("id").single();

      if (error) { Alert.alert("Erreur", error.message); return; }

      await supabase.from("group_members").insert([{ group_id: data.id, user_id: user.id, role: "admin" }]);
      await notifyGroupCreated({ creatorId: user.id, groupId: data.id, groupName: name });

      // Analytics
(async () => { try { await supabase.from('analytics_events').insert({
  user_id: user.id,
  event_name: 'group_created',
  properties: { sport, group_type: groupType, privacy },
  platform: Platform.OS,
}); } catch {} })();

      Alert.alert("✅ Groupe créé !", "Ton groupe est en ligne.");
      navigation.replace("GroupDetail", { groupId: data.id });
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPrivacy = PRIVACY_OPTIONS.find(p => p.value === privacy);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ══ 1. TYPE ══ */}
          <SectionHeader icon="grid-outline" title="Type de groupe" required />
          <View style={styles.typeGrid}>
            {GROUP_TYPES.map((t) => {
              const sel = groupType === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setGroupType(t.value)}
                  activeOpacity={0.75}
                  style={[
                    styles.typeCard,
                    sel && { backgroundColor: t.color, borderColor: t.color,
                             shadowColor: t.color, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
                  ]}
                >
                  <View style={[styles.typeIconCircle, sel && { backgroundColor: "rgba(255,255,255,0.22)" }]}>
                    <Ionicons name={t.icon} size={20} color={sel ? "#fff" : t.color} />
                  </View>
                  <Text style={[styles.typeCardLabel, sel && { color: "#fff" }]}>{t.value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ══ 2. INFORMATIONS ══ */}
          <SectionHeader icon="information-circle-outline" title="Informations" required />
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="pencil-outline" size={17} color="#BBB" style={styles.rowIcon} />
              <TextInput
                placeholder="Nom du groupe"
                placeholderTextColor="#C8C8D0"
                style={styles.cardInput}
                value={name}
                onChangeText={setName}
              />
            </View>
            <Divider />
            <TouchableOpacity style={styles.cardRow} onPress={() => setSportPickerVisible(true)} activeOpacity={0.7}>
              <Ionicons name="fitness-outline" size={17} color="#BBB" style={styles.rowIcon} />
              {sport ? (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {sportIcons[sport]?.icon}
                  <Text style={styles.cardInputText}>{sport}</Text>
                </View>
              ) : (
                <Text style={[styles.cardPlaceholder, { flex: 1 }]}>Sport principal</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color="#DDD" />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.cardRow}
              onPress={() => { setTempLocation(location); setAddressModalVisible(true); }}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={17} color="#BBB" style={styles.rowIcon} />
              <Text style={[styles.cardInputText, { flex: 1 }, !location && styles.cardPlaceholder]}>
                {location || "Ville ou lieu"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#DDD" />
            </TouchableOpacity>
          </View>

          {/* ══ 3. COUVERTURE ══ */}
          <SectionHeader icon="image-outline" title="Photo de couverture" />
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.coverPicker}>
            {cover?.uri ? (
              <>
                <Image source={{ uri: cover.uri }} style={styles.coverImg} />
                <View style={styles.coverEditBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                  <Text style={styles.coverEditText}>Modifier</Text>
                </View>
              </>
            ) : (
              <View style={styles.coverEmpty}>
                <View style={styles.coverEmptyIcon}>
                  <Feather name="camera" size={24} color="#FE5D02" />
                </View>
                <Text style={styles.coverEmptyTitle}>Ajouter une photo</Text>
                <Text style={styles.coverEmptyHint}>Format 16:9 recommandé</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ══ 4. ACCÈS ══ */}
          <SectionHeader icon="shield-checkmark-outline" title="Accès au groupe" />
          <View style={styles.privacyRow}>
            {PRIVACY_OPTIONS.map((opt) => {
              const sel = privacy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPrivacy(opt.value)}
                  activeOpacity={0.8}
                  style={[styles.privacyPill, sel && { backgroundColor: opt.color, borderColor: opt.color }]}
                >
                  <Ionicons name={opt.icon} size={14} color={sel ? "#fff" : "#999"} style={{ marginRight: 4 }} />
                  <Text style={[styles.privacyPillText, sel && { color: "#fff" }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedPrivacy && (
            <View style={[styles.privacyDetail, { borderLeftColor: selectedPrivacy.color }]}>
              <Text style={[styles.privacyDetailText, { color: selectedPrivacy.color }]}>
                {selectedPrivacy.desc}
              </Text>
            </View>
          )}

          {/* ══ 5. INFOS COMPLÉMENTAIRES ══ */}
          <SectionHeader icon="document-text-outline" title="Infos complémentaires" />
          <View style={styles.card}>
            <TextInput
              placeholder="Décris ton groupe : ambiance, niveau, fréquence…"
              placeholderTextColor="#C8C8D0"
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
            <Divider />
            <View style={styles.cardRow}>
              <Ionicons name="link-outline" size={17} color="#BBB" style={styles.rowIcon} />
              <TextInput
                placeholder="Lien externe (site, Instagram…)"
                placeholderTextColor="#C8C8D0"
                style={styles.cardInput}
                value={externalLink}
                onChangeText={setExternalLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {/* ══ CTA — dans le scroll ══ */}
<View style={styles.stickyBar}>
  <TouchableOpacity
    onPress={confirmCreate}
    disabled={loading || !canCreate}
    activeOpacity={0.88}
    style={[styles.ctaBtn, (!canCreate || loading) && styles.ctaBtnDisabled]}
  >
{loading
  ? <ActivityIndicator color="#fff" />
  : <>
      <Feather name="plus-circle" size={17} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.ctaBtnText}>Créer le groupe</Text>
    </>
}
  </TouchableOpacity>
</View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══ MODAL VILLE ══ */}
      <Modal visible={addressModalVisible} animationType="slide" transparent onRequestClose={() => setAddressModalVisible(false)}>
        <View style={styles.addressOverlay}>
          <SafeAreaView style={styles.addressSheet}>
            <View style={styles.addressHeader}>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#444" />
              </TouchableOpacity>
              <Text style={styles.addressTitle}>Choisir un lieu</Text>
              <TouchableOpacity
                disabled={!tempLocation.trim()}
                onPress={() => { setLocation(tempLocation.trim()); setAddressModalVisible(false); }}
                style={[styles.addressValidateBtn, { opacity: tempLocation.trim() ? 1 : 0.35 }]}
              >
                <Text style={styles.addressValidateText}>Valider</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <PlaceCitySearchField
                autoFocus
                value={tempLocation}
                onChange={(txt) => { setTempLocation(txt); setTempLat(null); setTempLng(null); }}
                onPick={({ description, lat, lng }) => { setTempLocation(description); setTempLat(lat); setTempLng(lng); }}
                placeholder="Ex : Stade Jean-Bouin, Paris"
                boxStyle={styles.addressSearchBox}
                suggestionContainerStyle={styles.addressSuggestions}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ══ MODAL SPORT ══ */}
      <Modal transparent animationType="slide" visible={sportPickerVisible} onRequestClose={() => setSportPickerVisible(false)}>
        <View style={styles.sportSheetOverlay}>
          <View style={styles.sportSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sportSheetHeader}>
              <Text style={styles.sportSheetTitle}>
                {showOtherSports ? "Autres sports" : "Choisir un sport"}
              </Text>
              <TouchableOpacity onPress={() => { setShowOtherSports(false); setSportPickerVisible(false); }}>
                <Ionicons name="close-circle" size={26} color="#DDD" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              {(!showOtherSports ? sportData : otherSports.map(l => ({ label: l }))).map((item) => {
                const label = item.label;
                const isMore = label === "+ de sports";
                const isSelected = sport === label;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.sportItem, isSelected && styles.sportItemSelected]}
                    onPress={() => {
                      if (isMore) { setShowOtherSports(true); return; }
                      setSport(label);
                      setShowOtherSports(false);
                      setSportPickerVisible(false);
                    }}
                  >
                    <View style={styles.sportItemIcon}>
                      {sportIcons[label]?.icon || item.icon || <Ionicons name="ellipsis-horizontal" size={18} color="#999" />}
                    </View>
                    <Text style={[styles.sportItemLabel, isSelected && { color: "#FE5D02", fontWeight: "700" }]}>
                      {label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#FE5D02" />}
                    {isMore    && <Ionicons name="chevron-forward"    size={16} color="#CCC" />}
                  </TouchableOpacity>
                );
              })}
              {showOtherSports && (
                <TouchableOpacity style={styles.sportBackBtn} onPress={() => setShowOtherSports(false)}>
                  <Ionicons name="arrow-back" size={15} color="#FE5D02" style={{ marginRight: 6 }} />
                  <Text style={styles.sportBackText}>Retour aux sports principaux</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#F2F3F7" },
  scroll: { paddingHorizontal: 18, paddingTop: 10 },

  // Type de groupe
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 26, },
  typeCard: {
    width: "30.5%", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, borderWidth: 1.5,
    borderColor: "#E8E8EF", backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  typeIconCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F5F5FB", alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  typeCardLabel: { fontSize: 11.5, fontWeight: "700", color: "#555", textAlign: "center" },

  // Card générique
  card: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 26,
    borderWidth: 1, borderColor: "#EBEBF0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1, overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 15, minHeight: 52,
  },
  rowIcon:         { marginRight: 10 },
  cardInput:       { flex: 1, fontSize: 15, color: "#1A1A2E" },
  cardInputText:   { fontSize: 15, color: "#1A1A2E" },
  cardPlaceholder: { fontSize: 15, color: "#C8C8D0" },

  // Textarea
  textarea: {
    minHeight: 110, fontSize: 15, color: "#1A1A2E",
    paddingHorizontal: 16, paddingTop: 15, paddingBottom: 12, lineHeight: 22,
  },

  // Cover
  coverPicker: { borderRadius: 16, overflow: "hidden", marginBottom: 26 },
  coverImg:    { width: "100%", height: 175 },
  coverEditBadge: {
    position: "absolute", bottom: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  coverEditText:   { color: "#fff", fontSize: 12, fontWeight: "600" },
  coverEmpty: {
    height: 150, backgroundColor: "#fff",
    borderRadius: 16, borderWidth: 1.5, borderColor: "#E8E8EF", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  coverEmptyIcon: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "#FFF0E8", alignItems: "center", justifyContent: "center",
  },
  coverEmptyTitle: { fontSize: 14, fontWeight: "700", color: "#333" },
  coverEmptyHint:  { fontSize: 12, color: "#BBB" },

  // Privacy pills
  privacyRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  privacyPill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 11, borderRadius: 12, borderWidth: 1.5,
    borderColor: "#E8E8EF", backgroundColor: "#fff",
  },
  privacyPillText: { fontSize: 12.5, fontWeight: "700", color: "#777" },
  privacyDetail: {
    borderLeftWidth: 3, paddingLeft: 10, marginBottom: 26, marginTop: 4,
  },
  privacyDetailText: { fontSize: 13, fontWeight: "500" },

  // CTA dans le scroll
  ctaBlock: { marginTop: 8 },
  ctaSummary: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    marginBottom: 12, alignItems: "center",
  },
  ctaBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: "#E8E8EF", backgroundColor: "#F8F8FB",
  },
  ctaBadgeText: { fontSize: 12, fontWeight: "700", color: "#444" },

stickyBar: {
  paddingHorizontal: wp('4%'),
  borderRadius: 20,
  marginTop: 10,
  paddingTop: hp('1%'),
  paddingBottom: hp('2%'),
  marginBottom: 25,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#F0F0F2',
},
ctaBtn: {
  height: hp('5%'),
  backgroundColor: '#FE5D02',
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: hp('1.3%'),
  marginHorizontal: 20,
  flexDirection: 'row',
},
ctaBtnDisabled: { backgroundColor: '#FDB490' },
ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('4.2%') },

  // Modal ville
  addressOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  addressSheet: {
    flex: 1, backgroundColor: "#fff",
    marginTop: 60, borderTopLeftRadius: 22, borderTopRightRadius: 22,
  },
  addressHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F5",
  },
  addressTitle:        { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  addressValidateBtn:  { backgroundColor: "#FE5D02", paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  addressValidateText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  addressSearchBox:    { marginTop: 12, marginHorizontal: 16 },
  addressSuggestions:  { flex: 1, marginTop: 8, paddingHorizontal: 16 },

  // Modal sport
  sportSheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sportSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "75%", paddingBottom: Platform.OS === "ios" ? 30 : 14,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: "#DDD", borderRadius: 2,
    alignSelf: "center", marginTop: 10, marginBottom: 2,
  },
  sportSheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F5",
  },
  sportSheetTitle:  { fontSize: 17, fontWeight: "700", color: "#1A1A2E" },
  sportItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F6F6FB",
  },
  sportItemSelected: { backgroundColor: "#FFF6F2" },
  sportItemIcon:     { width: 32, alignItems: "center", marginRight: 12 },
  sportItemLabel:    { flex: 1, fontSize: 15, color: "#222", fontWeight: "500" },
  sportBackBtn: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 20, marginTop: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "#F0F0F5",
  },
  sportBackText: { fontSize: 14, color: "#FE5D02", fontWeight: "600" },
});
