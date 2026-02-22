import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useUser } from '../context/UserContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

if (typeof global !== "undefined") global.Buffer = Buffer;

const BAD_WORDS = [
 'pd', 'pédé', 'fdp', 'enculé', 'ntm', 'nique ta mère', 'sale negre', 'negro', 'batard', 'tg', 'connard', 'sale noir',
 'pute', 'salope', 'bougnoule', 'youpin', 'encule', 'encu', 'nègre', 'negro', 'juif', 'negre', 'arabe',
 'nique', 'sale', 'n3gre', 'negr3', 'nik', 'negr0', 'nazi', 'bz', 'race', 'noirs', 'tana', 'pute', 'baise', 'foudroyeur', 'renoi', 'bougnoul',
];

function containsBadWord(text) {
  const lower = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

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

  Surf: { icon: <MaterialCommunityIcons name="wave" size={18} color="#26C6DA" />, color: '#26C6DA' },
  Kitesurf: { icon: <MaterialCommunityIcons name="kitesurfing" size={18} color="#29B6F6" />, color: '#29B6F6' },
  Windsurf: { icon: <MaterialCommunityIcons name="wind" size={18} color="#42A5F5" />, color: '#42A5F5' },
  SUP: { icon: <MaterialCommunityIcons name="surfing" size={18} color="#26A69A" />, color: '#26A69A' },

  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: '#EB984E' },
  Roller: { icon: <MaterialCommunityIcons name="roller-skate" size={18} color="#FF8A65" />, color: '#FF8A65' },

  Escalade: { icon: <MaterialCommunityIcons name="hiking" size={18} color="#689F38" />, color: '#689F38' },
  Parapente: { icon: <MaterialCommunityIcons name="parachute" size={18} color="#1976D2" />, color: '#1976D2' },

  CrossFit: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" />, color: '#536DFE' },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: '#26A69A' },

  'Arts Martiaux': { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: '#FF3D00' },

  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },
};

const SPORTS_OPTIONS = Object.keys(sportIcons).filter(s => s !== '+ de sports');

const Chip = ({ label, selected, onPress, gradient, disabled }) => {
  if (gradient && selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.78}>
        <View
          style={[styles.chip, styles.chipSelectedGradient, {backgroundColor: '#F62DAE'}]}
        >
          <Text style={[styles.chipText, { color: '#fff' }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={disabled ? null : onPress}
      activeOpacity={0.7}
      style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
      disabled={disabled}
    >
      <Text style={[
        styles.chipText,
        selected && { color: '#fff' },
        disabled && { color: '#aaa' }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

function getAgeFromBirthdate(birthdate) {
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const EditProfileScreen = ({ navigation }) => {
  const { refreshUser } = useUser();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialProfile, setInitialProfile] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [bioError, setBioError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error || !data) return;
      setUsername(data.username || '');
      setEmail(data.email || user.email || '');
      setAvatar(data.profile_photo || null);
      setBirthdate(data.birthdate || '');
      setGender(data.gender || '');
      setBio(data.bio || '');
      const allowedSports = SPORTS_OPTIONS;
const cleanedFavorites = Array.isArray(data.favorite_sports)
  ? data.favorite_sports.filter(sport => allowedSports.includes(sport))
  : [];
setFavoriteSports(cleanedFavorites.slice(0, 3));
setInitialProfile({
  username: data.username || '',
  birthdate: data.birthdate || '',
  gender: data.gender || '',
  bio: data.bio || '',
  avatar: data.profile_photo || null,
  favoriteSports: cleanedFavorites.slice(0, 3),
});
    };
    fetchUser();
  }, []);

  const pickAvatar = async () => {
    let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l’accès à la galerie pour changer votre photo de profil.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const uri = result.assets[0].uri;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non trouvé.");

        const fileExt = uri.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt || 'jpg'}`;

        const fileBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const fileBuffer = Buffer.from(fileBase64, 'base64');

        let { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        setAvatar(publicUrl);

        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_photo: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          Alert.alert('Erreur MAJ base', updateError.message);
        } else {
          await refreshUser();
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        }
      } catch (e) {
        Alert.alert('Erreur upload avatar', e.message);
      }
    }
  };

const hasChanges = () => {
  if (!initialProfile) return false;

  return (
    username !== initialProfile.username ||
    birthdate !== initialProfile.birthdate ||
    gender !== initialProfile.gender ||
    bio !== initialProfile.bio ||
    avatar !== initialProfile.avatar ||
    JSON.stringify(favoriteSports) !== JSON.stringify(initialProfile.favoriteSports)
  );
};

const toggleSport = (sport) => {
  if (favoriteSports.includes(sport)) {
    // On retire si déjà sélectionné
    setFavoriteSports(favoriteSports.filter(s => s !== sport));
  } else {
    // On bloque si déjà 3 sports sélectionnés
    if (favoriteSports.length >= 3) {
      Alert.alert("Limite atteinte", "Tu peux choisir au maximum 3 sports favoris.");
      return;
    }
    setFavoriteSports([...favoriteSports, sport]);
  }
};

const handleSave = async () => {
  if (containsBadWord(username)) {
    Alert.alert("Pseudo refusé", "Ton pseudo contient des mots inappropriés. Merci d'en choisir un autre.");
    return;
  }

  setSaving(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setSaving(false);
    Alert.alert("Erreur", "Impossible de retrouver ton compte.");
    return;
  }

  // --- Vérification unicité du pseudo (insensible à la casse, garde la casse d'origine) ---
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, username');

  if (allUsersError) {
    console.error("Erreur vérif pseudo:", allUsersError);
    Alert.alert("Erreur", "Une erreur est survenue lors de la vérification du pseudo.");
    setSaving(false);
    return;
  }

  // Compare insensiblement à la casse, mais ignore ton propre pseudo
  const pseudoExists = allUsers?.some(
    u =>
      u.id !== user.id &&
      u.username?.trim().toLowerCase() === username.trim().toLowerCase()
  );

  if (pseudoExists) {
    Alert.alert("Pseudo déjà pris", "Impossible, ce pseudo est déjà pris. Choisissez-en un autre.");
    setSaving(false);
    return;
  }

  // --- Mise à jour du profil ---
  const updates = {
    username: username.trim(), // on garde la casse de l'utilisateur
    birthdate,
    gender,
    bio,
    favorite_sports: favoriteSports,
    profile_photo: avatar || '',
  };

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id);

  setSaving(false);

  if (error) {
    Alert.alert("Erreur", "La mise à jour a échoué : " + error.message);
    return;
  }

  await refreshUser();
  Alert.alert("Profil mis à jour !");
  navigation.goBack();
};

return (
  <View style={{ flex: 1, backgroundColor: '#f9fafe' }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* AVATAR */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
            <Image
              source={
                avatar
                  ? { uri: avatar }
                  : require('../assets/avatar-default.png')
              }
              style={styles.avatar}
            />
            <View style={styles.avatarCamera}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* PSEUDO */}
        <Text style={styles.label}>Pseudo</Text>
<TextInput
  style={[
    styles.input,
    usernameError && { borderWidth: 1, borderColor: '#FF3B30' }
  ]}
  placeholder="Votre pseudo"
  value={username}
  onChangeText={(text) => {
    setUsername(text);

    if (text.length < 3) {
      setUsernameError("Le pseudo doit contenir au moins 3 caractères.");
    } else if (containsBadWord(text)) {
      setUsernameError("Pseudo inapproprié.");
    } else {
      setUsernameError('');
    }
  }}
  autoCapitalize="none"
  placeholderTextColor="#aaa"
/>

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { color: '#bbb' }]}
          placeholder="Votre email"
          value={email}
          editable={false}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />

        {/* ÂGE */}
        <Text style={styles.label}>Âge</Text>
        <View style={styles.ageChipWrap}>
          <View style={styles.ageChip}>
            <Text style={styles.ageChipText}>
              {birthdate ? `${getAgeFromBirthdate(birthdate)} ans` : 'Non renseigné'}
            </Text>
          </View>
        </View>

        {/* GENRE */}
        <Text style={styles.label}>Genre</Text>
        <View style={styles.rowWrap}>
          <Chip label={gender} selected disabled />
        </View>

        {/* SPORTS FAVORIS */}
        <Text style={styles.label}>Sports favoris</Text>
        <View style={styles.rowWrap}>
          {SPORTS_OPTIONS.map((sport) => (
            <Chip
              key={sport}
              label={sport}
              selected={favoriteSports.includes(sport)}
              onPress={() => toggleSport(sport)}
              gradient
            />
          ))}
        </View>

        {/* BIO */}
        <Text style={styles.label}>Bio</Text>
<TextInput
  style={[
    styles.input,
    { height: 86, textAlignVertical: 'top', paddingTop: 14 },
    bioError && { borderWidth: 1, borderColor: '#FF3B30' }
  ]}
  placeholder="Parle un peu de toi !"
  value={bio}
  onChangeText={(text) => {
    setBio(text);

    if (containsBadWord(text)) {
      setBioError("Description inappropriée.");
    } else {
      setBioError('');
    }
  }}
  multiline
  maxLength={160}
  placeholderTextColor="#aaa"
/>

        {/* BOUTON SAVE */}
        <View style={styles.buttonContainer}>
          <View
           style={[styles.buttonGradient,{ backgroundColor: hasChanges() && !usernameError && !bioError ? '#FE5D02': '#ccc'}]}
          >
            <TouchableOpacity
              style={styles.buttonTouchable}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving || !hasChanges() || !!usernameError || !!bioError}
            >
              <Text style={styles.buttonText}>
                {saving ? 'Enregistrement...' : 'Valider profil'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />

      </ScrollView>
    </KeyboardAvoidingView>
  </View>
)};

const styles = StyleSheet.create({
  container: {
    padding: wp('5.5%'),
    paddingBottom: hp('5.7%'),
    backgroundColor: '#f9fafe',
  },
  avatarWrap: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  avatar: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: '#e1e7ee',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  avatarCamera: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: '#43b97f',
    borderRadius: wp('4%'),
    padding: wp('1%'),
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  label: {
    marginBottom: hp('1.5%'),
    fontWeight: '600',
    color: '#222',
    fontSize: wp('3.9%'),
    marginTop: hp('1.3%'),
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#f4f5fa',
    borderRadius: wp('3%'),
    fontSize: wp('3.8%'),
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('0.7%'),
    color: '#000',
    selectionColor: '#FE5D02',
    borderWidth: 0,
    shadowColor: 'rgba(40,50,55,0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 1,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp('0.5%'),
  },
  chip: {
    backgroundColor: '#f0f2f5',
    borderRadius: wp('6%'),
    paddingVertical: hp('0.9%'),
    paddingHorizontal: wp('4.8%'),
    marginVertical: hp('0.2%'),
    marginRight: wp('2.1%'),
  },
  chipSelected: {
    backgroundColor: '#1976d2',
  },
  chipSelectedGradient: {
    borderRadius: wp('6%'),
    paddingVertical: hp('0.9%'),
    paddingHorizontal: wp('4.8%'),
    marginVertical: hp('0.2%'),
    marginRight: wp('2.1%'),
  },
  chipDisabled: {
    backgroundColor: '#f0f0f2',
    borderColor: '#eee',
  },
  chipText: {
    color: '#444',
    fontWeight: '600',
    fontSize: wp('3.6%'),
  },
  chipTextSelected: {
    color: '#fff',
  },
  buttonContainer: {
    width: '88%',
    alignSelf: 'center',
    marginTop: hp('3.2%'),
    marginBottom: hp('0.5%'),
    borderRadius: wp('5%'),
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    paddingVertical: hp('1.5%'),
    marginVertical: 2,
    borderRadius: wp('6%'),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonTouchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp('3.8%'),
    letterSpacing: 0.2,
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#aaa',
    fontSize: wp('3.2%'),
    marginBottom: hp('0.2%'),
    marginTop: -hp('2.2%'),
    marginRight: wp('1%'),
  },
  ageChipWrap: {
    flexDirection: 'row',
    marginBottom: hp('0.5%'),
  },
ageChip: {
  backgroundColor: '#f0f0f2',
  borderRadius: wp('6%'),
  paddingVertical: hp('0.9%'),
  paddingHorizontal: wp('4.8%'),
},
ageChipText: {
  color: '#aaa',
  fontWeight: '600',
  fontSize: wp('3.6%'),
},
  helperText: {
  fontSize: wp('3.3%'),
  color: '#888',
  fontStyle: 'italic',
  marginBottom: hp('0.6%'),
},
});

export default EditProfileScreen;
