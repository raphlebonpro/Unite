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
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

if (typeof global !== "undefined") global.Buffer = Buffer;

const BAD_WORDS = [
 'pd', 'pédé', 'fdp', 'enculé', 'ntm', 'nique ta mère', 'sale negre', 'negro', 'batard', 'tg', 'connard', 'sale noir',
 'pute', 'salope', 'bougnoule', 'youpin', 'encule', 'encu', 'nègre', 'negro', 'juif', 'negre', 'arabe',
 'nique', 'sale', 'n3gre', 'negr3', 'nik', 'negr0', 'nazi', 'bz', 'race', 'noirs', 'tana', 'pute', 'baise', 'foudroyeur', 'renoi'
];

function containsBadWord(text) {
  const lower = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

const SPORTS_OPTIONS = ['Football', 'Basket', 'Tennis', 'Running', 'Cyclisme', 'Natation','Musculation'];

const Chip = ({ label, selected, onPress, gradient, disabled }) => {
  if (gradient && selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.78}>
        <LinearGradient
          colors={['#ff9966', '#ff5e62']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.chip, styles.chipSelectedGradient]}
        >
          <Text style={[styles.chipText, { color: '#fff' }]}>{label}</Text>
        </LinearGradient>
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
      setFavoriteSports(Array.isArray(data.favorite_sports) ? data.favorite_sports : []);
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

  const toggleSport = (sport) => {
    if (favoriteSports.includes(sport)) setFavoriteSports(favoriteSports.filter(s => s !== sport));
    else setFavoriteSports([...favoriteSports, sport]);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafe' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
              <Image
                source={
                  avatar
                    ? { uri: avatar }
                    : require('../assets/avatar-placeholder.png')
                }
                style={styles.avatar}
              />
              <View style={styles.avatarCamera}>
                <Feather name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Pseudo</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre pseudo"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />

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

            <Text style={styles.label}>Âge</Text>
            <View style={styles.ageChipWrap}>
              <View style={styles.ageChip}>
                <Text style={styles.ageChipText}>
                  {birthdate ? `${getAgeFromBirthdate(birthdate)} ans` : 'Non renseigné'}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Genre</Text>
            <View style={styles.rowWrap}>
              <Chip
                label={gender}
                selected
                disabled
              />
            </View>

            <Text style={styles.label}>Sports favoris</Text>
            <View style={styles.rowWrap}>
              {SPORTS_OPTIONS.map((sport) => (
                <Chip
                  key={sport}
                  label={sport}
                  selected={favoriteSports.includes(sport)}
                  onPress={() => toggleSport(sport)}
                  gradient
                  disabled={false}
                />
              ))}
            </View>

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 86, textAlignVertical: 'top', paddingTop: 14 }]}
              placeholder="Parle un peu de toi !"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={160}
              placeholderTextColor="#aaa"
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

<View style={styles.buttonContainer}>
  <LinearGradient
    colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.buttonGradient}
  >
    <TouchableOpacity
      style={styles.buttonTouchable}
      onPress={handleSave}
      activeOpacity={0.85}
      disabled={saving}
    >
      <Text style={styles.buttonText}>
        {saving ? "Enregistrement..." : "Valider profil"}
      </Text>
    </TouchableOpacity>
  </LinearGradient>
</View>

<View style={{ height: 10 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    marginBottom: hp('0.8%'),
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
    color: '#191a20',
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
    width: '80%',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('4%'),
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
    fontSize: wp('4.3%'),
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
    backgroundColor: '#ffe2d2',
    borderRadius: wp('4%'),
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('4.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('0.7%'),
  },
  ageChipText: {
    color: '#fa6f3b',
    fontWeight: '600',
    fontSize: wp('3.9%'),
  },
  helperText: {
  fontSize: wp('3.3%'),
  color: '#888',
  fontStyle: 'italic',
  marginBottom: hp('0.6%'),
},
});

export default EditProfileScreen;
