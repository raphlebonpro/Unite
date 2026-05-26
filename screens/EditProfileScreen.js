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
import { Feather, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useUser } from '../context/UserContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

if (typeof global !== 'undefined') global.Buffer = Buffer;

// ─── Modération ───────────────────────────────────────────────────────────────
const BAD_WORDS = [
  'pd', 'pédé', 'fdp', 'enculé', 'ntm', 'nique ta mère', 'sale negre', 'negro',
  'batard', 'tg', 'connard', 'sale noir', 'pute', 'salope', 'bougnoule', 'youpin',
  'encule', 'encu', 'nègre', 'negro', 'juif', 'negre', 'arabe', 'nique', 'sale',
  'n3gre', 'negr3', 'nik', 'negr0', 'nazi', 'bz', 'race', 'noirs', 'tana', 'baise',
  'foudroyeur', 'renoi', 'bougnoul',
];
function containsBadWord(text) {
  const lower = text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

// ─── Sport meta ───────────────────────────────────────────────────────────────
const sportMeta = {
  Football:          { bg: '#EBF2FF', color: '#3888FF', icon: 'futbol',            lib: 'fa5' },
  Basketball:        { bg: '#FFF5E5', color: '#FFA726', icon: 'basketball',         lib: 'mci' },
  Tennis:            { bg: '#EDFBF3', color: '#2ECC71', icon: 'tennis',             lib: 'mci' },
  Padel:             { bg: '#FFFDE5', color: '#C8A800', icon: 'tennis',             lib: 'mci' },
  Running:           { bg: '#FFF0F4', color: '#E9436D', icon: 'run-fast',           lib: 'mci' },
  Cyclisme:          { bg: '#E5FAFA', color: '#3CD6E6', icon: 'bike',               lib: 'mci' },
  Natation:          { bg: '#E5F0FB', color: '#1469B9', icon: 'swim',               lib: 'mci' },
  Musculation:       { bg: '#F3F1FF', color: '#7367F0', icon: 'dumbbell',           lib: 'mci' },
  Fitness:           { bg: '#F3F0FF', color: '#7C4DFF', icon: 'weight-lifter',      lib: 'mci' },
  'Randonnée/Trail': { bg: '#EDFBF3', color: '#43A047', icon: 'hiking',             lib: 'mci' },
  Yoga:              { bg: '#F4EFFE', color: '#A259F7', icon: 'yoga',               lib: 'mci' },
  Danse:             { bg: '#FFF0F6', color: '#F48FB1', icon: 'human-female-dance', lib: 'mci' },
  Pilates:           { bg: '#F4EFFE', color: '#BA68C8', icon: 'meditation',         lib: 'mci' },
  CrossFit:          { bg: '#ECEDFF', color: '#536DFE', icon: 'dumbbell',           lib: 'mci' },
  Surf:              { bg: '#E5FAFA', color: '#26C6DA', icon: 'surfing',            lib: 'mci' },
  Escalade:          { bg: '#EDFBF3', color: '#689F38', icon: 'terrain',            lib: 'mci' },
  'Arts Martiaux':   { bg: '#FFF0EC', color: '#FF3D00', icon: 'boxing-glove',       lib: 'mci' },
  Skate:             { bg: '#FFF5E5', color: '#EB984E', icon: 'skateboard',         lib: 'mci' },
  VTT:               { bg: '#EDFBF3', color: '#009688', icon: 'bike',               lib: 'mci' },
  Marche:            { bg: '#EDFBF3', color: '#00A676', icon: 'walk',               lib: 'mci' },
  Kayak:             { bg: '#E5F0FB', color: '#0277BD', icon: 'kayaking',           lib: 'mci' },
  Callisthénie:      { bg: '#E5FAFA', color: '#26A69A', icon: 'arm-flex',           lib: 'mci' },
  'Tennis de table': { bg: '#E5FAFA', color: '#00B8D4', icon: 'table-tennis',       lib: 'mci' },
  'Ski/Snow':        { bg: '#E5F6FF', color: '#32C5FF', icon: 'ski',               lib: 'mci' },
  Roller:            { bg: '#FFF5E5', color: '#FF8A65', icon: 'roller-skate',       lib: 'mci' },
  Autres:            { bg: '#F2F2F2', color: '#999',    icon: 'dots-horizontal',    lib: 'mci' },
};

const SPORTS_OPTIONS = Object.keys(sportMeta).filter(s => s !== 'Autres');

const SportChipIcon = ({ sport, size = 15 }) => {
  const meta = sportMeta[sport] || sportMeta['Autres'];
  if (meta.lib === 'fa5') return <FontAwesome5 name={meta.icon} size={size} color={meta.color} />;
  return <MaterialCommunityIcons name={meta.icon} size={size} color={meta.color} />;
};

function getAgeFromBirthdate(birthdate) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─────────────────────────────────────────────────────────────────────────────
const EditProfileScreen = ({ navigation }) => {
  const { refreshUser } = useUser();
  const [avatar, setAvatar]               = useState(null);
  const [username, setUsername]           = useState('');
  const [birthdate, setBirthdate]         = useState('');
  const [gender, setGender]               = useState('');
  const [email, setEmail]                 = useState('');
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [bio, setBio]                     = useState('');
  const [saving, setSaving]               = useState(false);
  const [initialProfile, setInitialProfile] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [bioError, setBioError]           = useState('');

  const BIO_MAX = 160;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (error || !data) return;

      setUsername(data.username || '');
      setEmail(data.email || user.email || '');
      setAvatar(data.profile_photo || null);
      setBirthdate(data.birthdate || '');
      setGender(data.gender || '');
      setBio(data.bio || '');

      const clean = Array.isArray(data.favorite_sports)
        ? data.favorite_sports.filter(s => SPORTS_OPTIONS.includes(s)).slice(0, 3)
        : [];
      setFavoriteSports(clean);
      setInitialProfile({
        username: data.username || '', birthdate: data.birthdate || '',
        gender: data.gender || '', bio: data.bio || '',
        avatar: data.profile_photo || null, favoriteSports: clean,
      });
    };
    fetchUser();
  }, []);

  // ── Photo ────────────────────────────────────────────────────────────────
  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour changer votre photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0].uri) {
      const uri = result.assets[0].uri;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non trouvé.');
        const fileExt = uri.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt || 'jpg'}`;
        const fileBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const fileBuffer = Buffer.from(fileBase64, 'base64');
        const { error: uploadError } = await supabase.storage
          .from('avatars').upload(fileName, fileBuffer, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setAvatar(publicUrlData.publicUrl);
        const { error: updateError } = await supabase.from('users')
          .update({ profile_photo: publicUrlData.publicUrl }).eq('id', user.id);
        if (updateError) Alert.alert('Erreur', updateError.message);
        else { await refreshUser(); }
      } catch (e) { Alert.alert('Erreur upload', e.message); }
    }
  };

  // ── Sports ───────────────────────────────────────────────────────────────
  const toggleSport = (sport) => {
    if (favoriteSports.includes(sport)) {
      setFavoriteSports(favoriteSports.filter(s => s !== sport));
    } else {
      if (favoriteSports.length >= 3) {
        Alert.alert('Limite atteinte', 'Tu peux choisir au maximum 3 sports favoris.');
        return;
      }
      setFavoriteSports([...favoriteSports, sport]);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
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

  const handleSave = async () => {
    if (containsBadWord(username)) {
      Alert.alert('Pseudo refusé', 'Ton pseudo contient des mots inappropriés.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: allUsers } = await supabase.from('users').select('id, username');
    const pseudoExists = allUsers?.some(
      u => u.id !== user.id && u.username?.trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (pseudoExists) {
      Alert.alert('Pseudo déjà pris', 'Choisissez un autre pseudo.');
      setSaving(false); return;
    }

    const { error } = await supabase.from('users').update({
      username: username.trim(), birthdate, gender, bio,
      favorite_sports: favoriteSports, profile_photo: avatar || '',
    }).eq('id', user.id);

    setSaving(false);
    if (error) { Alert.alert('Erreur', error.message); return; }
    await refreshUser();
    Alert.alert('Profil mis à jour !');
    navigation.goBack();
  };

  const canSave = hasChanges() && !usernameError && !bioError;
  const age = getAgeFromBirthdate(birthdate);

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FA' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Avatar ──────────────────────────────────────────────────── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarTouch}>
              <Image
                source={avatar ? { uri: avatar } : require('../assets/avatar-default.png')}
                style={styles.avatar}
              />
              <View style={styles.avatarOverlay}>
                <Feather name="camera" size={18} color="#fff" />
                <Text style={styles.avatarOverlayText}>Modifier</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Section : Identité ──────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Identité</Text>
          <View style={styles.card}>

            {/* Pseudo */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#EBF2FF' }]}>
                <Ionicons name="person-outline" size={17} color="#3888FF" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Pseudo</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Votre pseudo"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (text.length < 3) setUsernameError('Minimum 3 caractères');
                    else if (containsBadWord(text)) setUsernameError('Pseudo inapproprié');
                    else setUsernameError('');
                  }}
                  autoCapitalize="none"
                  placeholderTextColor="#CCC"
                />
                {usernameError ? (
                  <Text style={styles.errorText}>{usernameError}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.cardSep} />

            {/* Email — readonly */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#F2F2F2' }]}>
                <Ionicons name="mail-outline" size={17} color="#AAA" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldReadonly}>{email || '—'}</Text>
              </View>
            </View>

            <View style={styles.cardSep} />

            {/* Âge — readonly */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#FFF5E5' }]}>
                <Ionicons name="calendar-outline" size={17} color="#FFA726" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Âge</Text>
                <Text style={styles.fieldReadonly}>
                  {age ? `${age} ans` : 'Non renseigné'}
                </Text>
              </View>
            </View>

            <View style={styles.cardSep} />

            {/* Genre — readonly */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#F4EFFE' }]}>
                <Ionicons name="people-outline" size={17} color="#A259F7" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Genre</Text>
                <Text style={styles.fieldReadonly}>{gender || 'Non renseigné'}</Text>
              </View>
            </View>

          </View>

          {/* ── Section : Sports favoris ─────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Sports favoris</Text>
            <Text style={styles.sectionCounter}>
              {favoriteSports.length}/3
            </Text>
          </View>

          {/* Sports sélectionnés (recap) */}
          {favoriteSports.length > 0 && (
            <View style={styles.selectedSportsRow}>
              {favoriteSports.map(sport => {
                const meta = sportMeta[sport] || sportMeta['Autres'];
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.selectedSportPill, { backgroundColor: meta.bg, borderColor: meta.color + '55' }]}
                    onPress={() => toggleSport(sport)}
                    activeOpacity={0.8}
                  >
                    <SportChipIcon sport={sport} size={14} />
                    <Text style={[styles.selectedSportText, { color: meta.color }]}>{sport}</Text>
                    <Ionicons name="close-circle" size={14} color={meta.color} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Grille de sélection */}
          <View style={styles.card}>
            <View style={styles.sportsGrid}>
              {SPORTS_OPTIONS.map(sport => {
                const meta     = sportMeta[sport] || sportMeta['Autres'];
                const selected = favoriteSports.includes(sport);
                const disabled = !selected && favoriteSports.length >= 3;
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportChip,
                      selected && { backgroundColor: meta.bg, borderColor: meta.color },
                      disabled && styles.sportChipDisabled,
                    ]}
                    onPress={() => toggleSport(sport)}
                    activeOpacity={0.75}
                    disabled={disabled}
                  >
                    <SportChipIcon sport={sport} size={14} />
                    <Text style={[
                      styles.sportChipText,
                      selected && { color: meta.color, fontWeight: '700' },
                      disabled && { color: '#CCC' },
                    ]}>
                      {sport}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={13} color={meta.color} style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Section : Bio ─────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>À propos</Text>
          <View style={styles.card}>
            <View style={styles.bioWrap}>
              <TextInput
                style={styles.bioInput}
                placeholder="Raconte-toi en quelques mots — sport, ambitions, vibe…"
                value={bio}
                onChangeText={(text) => {
                  setBio(text);
                  setBioError(containsBadWord(text) ? 'Description inappropriée.' : '');
                }}
                multiline
                maxLength={BIO_MAX}
                placeholderTextColor="#CCC"
                textAlignVertical="top"
              />
              <View style={styles.bioFooter}>
                {bioError ? (
                  <Text style={styles.errorText}>{bioError}</Text>
                ) : <View />}
                <Text style={[styles.charCount, bio.length > BIO_MAX * 0.9 && { color: '#FE5D02' }]}>
                  {bio.length}/{BIO_MAX}
                </Text>
              </View>
            </View>
          </View>

<View style={styles.stickyBar}>
  <TouchableOpacity
    style={[styles.ctaBtn, !canSave && styles.ctaBtnDisabled]}
    onPress={handleSave}
    activeOpacity={0.85}
    disabled={saving || !canSave}
  >
    {saving ? (
      <Text style={styles.ctaBtnText}>Enregistrement…</Text>
    ) : (
      <>
        <Ionicons name="checkmark-circle-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.ctaBtnText}>Enregistrer les modifications</Text>
      </>
    )}
  </TouchableOpacity>
</View>
<View style={{ height: 10 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditProfileScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('4%'),
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  avatarTouch: {
    position: 'relative',
  },
  avatar: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('6%'),      // carré arrondi cohérent avec le reste de l'app
    backgroundColor: '#E8EAF6',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  avatarOverlayText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  // ── Section labels ────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#ABABAB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: wp('1.5%'),
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: wp('1.5%'),
    marginRight: wp('1.5%'),
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  sectionCounter: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#FE5D02',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Field row (dans la card identité) ─────────────────────────────────────
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    minHeight: hp('7%'),
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3.5%'),
    flexShrink: 0,
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#ABABAB',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldInput: {
    fontSize: wp('4%'),
    color: '#1A1A1A',
    fontWeight: '500',
    padding: 0,
  },
  fieldReadonly: {
    fontSize: wp('4%'),
    color: '#BBBBBB',
    fontWeight: '500',
  },
  cardSep: {
    height: 1,
    backgroundColor: '#F5F5F7',
    marginLeft: wp('4%') + 36 + wp('3.5%'),
  },

  // ── Erreur ────────────────────────────────────────────────────────────────
  errorText: {
    fontSize: wp('3.1%'),
    color: '#FF3B30',
    fontWeight: '500',
    marginTop: 3,
  },

  // ── Sports sélectionnés recap ─────────────────────────────────────────────
  selectedSportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: hp('1%'),
  },
  selectedSportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  selectedSportText: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
  },

  // ── Sports grid ───────────────────────────────────────────────────────────
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: wp('3%'),
    gap: 7,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sportChipDisabled: {
    opacity: 0.35,
  },
  sportChipText: {
    fontSize: wp('3.2%'),
    color: '#555',
    fontWeight: '500',
  },

  // ── Bio ───────────────────────────────────────────────────────────────────
  bioWrap: {
    padding: wp('4%'),
  },
  bioInput: {
    fontSize: wp('3.9%'),
    color: '#1A1A1A',
    lineHeight: wp('6%'),
    minHeight: hp('10%'),
    padding: 0,
  },
  bioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: wp('3.2%'),
    color: '#CCC',
    fontWeight: '500',
  },

  // ── Save button ───────────────────────────────────────────────────────────
stickyBar: {
  paddingHorizontal: wp('4%'),
  borderRadius: 20,
  marginTop: 10,
  paddingTop: hp('1%'),
  paddingBottom: hp('2%'),
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#F0F0F2',
},
ctaBtn: {
  marginTop: 5,
  height: hp('5%'),
  backgroundColor: '#FE5D02',
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 20,
  flexDirection: 'row',
},
ctaBtnDisabled: {
  backgroundColor: '#E0E0E0',
},
ctaBtnText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: wp('4.2%'),
},
});
