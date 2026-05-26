import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Modal, ActivityIndicator,
  Alert, Keyboard, StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabaseClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useUser } from '../context/UserContext';
import * as Linking from 'expo-linking';
import { AppEventsLogger } from 'react-native-fbsdk-next';

if (typeof global !== 'undefined') global.Buffer = Buffer;

// ─── Modération ───────────────────────────────────────────────────────────────
const BAD_WORDS = [
  'pd','pédé','fdp','enculé','ntm','nique ta mère','sale negre','negro',
  'batard','tg','connard','sale noir','pute','salope','bougnoule','youpin',
  'encule','encu','nègre','juif','arabe','nique','sale','n3gre','negr3',
  'nik','negr0','nazi','bz','race','noirs','tana','baise','renoi',
];
function containsBadWord(text) {
  const lower = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return BAD_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lower));
}

const PERSPECTIVE_API_KEY = 'AIzaSyBLwtXh-7pCvosyYAj02e0C8saAOr_-GlI';
async function analyzePseudoWithPerspective(text) {
  try {
    const res = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: { text }, languages: ['fr'],
          requestedAttributes: { TOXICITY: {} },
        }),
      }
    );
    const data = await res.json();
    return data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
  } catch { return 0; }
}

async function uploadAvatar(uri, userId) {
  const fileExt = uri.split('.').pop() || 'jpg';
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const fileBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const fileBuffer = Buffer.from(fileBase64, 'base64');
  const { error } = await supabase.storage
    .from('avatars').upload(fileName, fileBuffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}

const GENDER_OPTIONS = ['Homme', 'Femme', 'Ne pas se prononcer'];

// ─────────────────────────────────────────────────────────────────────────────
export default function SignUpScreen({ navigation }) {
  const { refreshUser, bumpAvatarVersion } = useUser();

  const [avatar, setAvatar]                           = useState(null);
  const [email, setEmail]                             = useState('');
  const [password, setPassword]                       = useState('');
  const [confirmPassword, setConfirmPassword]         = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pseudo, setPseudo]                           = useState('');
  const [birthdate, setBirthdate]                     = useState(null);
  const [showDatePicker, setShowDatePicker]           = useState(false);
  const [tempBirthdate, setTempBirthdate]             = useState(null);
  const [gender, setGender]                           = useState('');
  const [showGenderModal, setShowGenderModal]         = useState(false);
  const [description, setDescription]                 = useState('');
  const [loading, setLoading]                         = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour importer une photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.cancelled && result.assets?.[0].uri) setAvatar(result.assets[0].uri);
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !pseudo || !birthdate || !gender) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (containsBadWord(pseudo)) {
      Alert.alert('Pseudo refusé', 'Ton pseudo contient des mots interdits.');
      return;
    }
    const toxicity = await analyzePseudoWithPerspective(pseudo);
    if (toxicity > 0.8) {
      Alert.alert('Pseudo refusé', 'Ton pseudo semble inapproprié.');
      return;
    }
    setLoading(true);
    try {
      const { data: existingUsers, error: existingUserError } = await supabase
        .from('users').select('id, username');
      if (existingUserError) throw existingUserError;
      const pseudoExists = existingUsers?.some(
        u => u.username?.trim().toLowerCase() === pseudo.trim().toLowerCase()
      );
      if (pseudoExists) {
        Alert.alert('Pseudo déjà pris', 'Ce pseudo est déjà utilisé. Choisissez-en un autre.');
        setLoading(false); return;
      }
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      const userId = signUpData?.user?.id;
      if (!userId) throw new Error("Impossible de récupérer l'ID utilisateur.");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Impossible de récupérer le token.');
      const createRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create_user_profile`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: userId, email }) }
      );
      if (!createRes.ok) throw new Error('Erreur création profil');
      let avatarUrl = '';
      if (avatar) avatarUrl = await uploadAvatar(avatar, userId);
      const updateRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update_user_profile`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: userId, email, username: pseudo, profile_photo: avatarUrl,
            bio: description, gender, birthdate, favorite_sports: null, availabilities: null }) }
      );
      if (!updateRes.ok) {
        const r = await updateRes.json();
        throw new Error(r.error?.message || 'Erreur mise à jour profil');
      }
      try { AppEventsLogger.logEvent('CompleteRegistration'); } catch {}
      await refreshUser();
      bumpAvatarVersion();

// Analytics
(async () => { try { await supabase.from('analytics_events').insert({
  user_id: userId,
  event_name: 'signup',
  properties: { gender, has_avatar: !!avatar },
  platform: Platform.OS,
}); } catch {} })();

      Alert.alert('Bienvenue dans le collectif Unite !', 'Ton compte est prêt.');
    } catch (err) {
      Alert.alert('Erreur', err?.message || "Erreur inattendue à l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const formatBirthdate = (iso) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <>
      {/* ── AppBar — en dehors du KeyboardAvoidingView pour qu'il reste fixe */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="close" size={18} color="#555" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Créer un compte</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/*
          ── CLÉ DU SCROLL FLUIDE ────────────────────────────────────────────
          • Pas de TouchableWithoutFeedback → rien n'intercepte les gestes
          • keyboardDismissMode="on-drag" → le clavier se ferme au scroll
          • keyboardShouldPersistTaps="handled" → les taps fonctionnent même
            clavier ouvert (boutons, TouchableOpacity etc.)
          ────────────────────────────────────────────────────────────────────
        */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
        >

          {/* ── Avatar ────────────────────────────────────────────────── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarEmpty}>
                  <Ionicons name="person-outline" size={28} color="#C8C8C8" />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Feather name="camera" size={13} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>
              {avatar ? 'Modifier la photo' : 'Ajouter une photo'}
            </Text>
          </View>

          {/* Email */}
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="votre@email.com"
            placeholderTextColor="#C8C8C8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          {/* Mot de passe */}
          <Text style={styles.label}>Mot de passe <Text style={styles.required}>*</Text></Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Minimum 6 caractères"
              placeholderTextColor="#C8C8C8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(p => !p)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color="#C0C0C0" />
            </TouchableOpacity>
          </View>

          {/* Confirmer */}
          <Text style={styles.label}>Confirmer le mot de passe <Text style={styles.required}>*</Text></Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Répète ton mot de passe"
              placeholderTextColor="#C8C8C8"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword(p => !p)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color="#C0C0C0" />
            </TouchableOpacity>
          </View>

          {/* Pseudo */}
          <Text style={styles.label}>Pseudo <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Choisis un pseudo unique"
            placeholderTextColor="#C8C8C8"
            value={pseudo}
            onChangeText={setPseudo}
            autoCapitalize="none"
            returnKeyType="next"
          />

          {/* Date de naissance */}
          <Text style={styles.label}>Date de naissance <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => {
              Keyboard.dismiss();
              setTempBirthdate(birthdate ? new Date(birthdate) : new Date(2000, 0, 1));
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={birthdate ? styles.selectValue : styles.selectPlaceholder}>
              {birthdate ? formatBirthdate(birthdate) : 'JJ / MM / AAAA'}
            </Text>
            <Feather name="chevron-down" size={16} color="#C8C8C8" />
          </TouchableOpacity>

          {/* Genre */}
          <Text style={styles.label}>Genre <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => { Keyboard.dismiss(); setShowGenderModal(true); }}
            activeOpacity={0.7}
          >
            <Text style={gender ? styles.selectValue : styles.selectPlaceholder}>
              {gender || 'Sélectionner'}
            </Text>
            <Feather name="chevron-down" size={16} color="#C8C8C8" />
          </TouchableOpacity>

          {/* Bio */}
          <Text style={styles.label}>
            Bio <Text style={styles.optional}>(optionnel)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Toujours chaud pour une session peu importe le niveau…"
            placeholderTextColor="#C8C8C8"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={160}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
          <Text style={styles.charCount}>{description.length}/160</Text>

          {/* Légal */}
          <Text style={styles.legalText}>
            En vous inscrivant, vous acceptez notre{' '}
            <Text style={styles.legalLink}
              onPress={() => Linking.openURL('https://www.uniteapp.fr/politique-de-confidentialité')}>
              Politique de Confidentialité
            </Text>{' '}
            et nos{' '}
            <Text style={styles.legalLink}
              onPress={() => Linking.openURL('https://www.uniteapp.fr/politique-de-confidentialité')}>
              Conditions Générales
            </Text>.
          </Text>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaBtnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal date — centré ────────────────────────────────────────── */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.centeredOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.centeredBox}>
                <Text style={styles.modalTitle}>Date de naissance</Text>
                <DateTimePicker
                  value={tempBirthdate || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1950, 0, 1)}
                  locale="fr-FR"
                  onChange={(_, d) => { if (d) setTempBirthdate(d); }}
                  style={{ width: '100%' }}
                />
                <TouchableOpacity
                  style={styles.modalValidateBtn}
                  onPress={() => {
                    if (tempBirthdate) setBirthdate(tempBirthdate.toISOString());
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.modalValidateBtnText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={tempBirthdate || new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            locale="fr-FR"
            onChange={(event, selectedDate) => {
              if (event.type === 'set' && selectedDate) setBirthdate(selectedDate.toISOString());
              setShowDatePicker(false);
            }}
          />
        )
      )}

      {/* ── Modal genre — centré ───────────────────────────────────────── */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.centeredOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.centeredBox}>
              <Text style={styles.modalTitle}>Genre</Text>
              {GENDER_OPTIONS.map((option, idx) => (
                <React.Fragment key={option}>
                  <TouchableOpacity
                    style={styles.genderOption}
                    onPress={() => { setGender(option); setShowGenderModal(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      gender === option && styles.genderOptionTextActive,
                    ]}>
                      {option}
                    </Text>
                    {gender === option && (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                  {idx < GENDER_OPTIONS.length - 1 && <View style={styles.optionSep} />}
                </React.Fragment>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── AppBar ────────────────────────────────────────────────────────────────
  appBar: {
    height: Platform.OS === 'android'
      ? 56 + (StatusBar.currentHeight ?? 0)
      : hp('6.5%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4.5%'),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: wp('4.3%'),
    fontWeight: '700',
    color: '#111',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  avatar: {
    width: wp('20%'), height: wp('20%'),
    borderRadius: wp('5%'),
    backgroundColor: '#F0F0F0',
  },
  avatarEmpty: {
    width: wp('20%'), height: wp('20%'),
    borderRadius: wp('5%'),
    backgroundColor: '#F5F5F7',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FE5D02',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarLabel: {
    marginTop: 10,
    fontSize: wp('3.3%'),
    color: '#FE5D02',
    fontWeight: '600',
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  label: {
    fontSize: wp('3.6%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.8%'),
    marginTop: hp('1.8%'),
  },
  required: { color: '#FF3B30', fontWeight: '700' },
  optional: { fontSize: wp('3.2%'), color: '#C0C0C0', fontWeight: '400' },

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    height: hp('6%'),
    backgroundColor: '#F7F7F9',
    borderRadius: 12,
    paddingHorizontal: wp('4%'),
    fontSize: wp('4%'),
    color: '#111',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  inputFlex: { flex: 1 },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: wp('4%'),
  },
  bioInput: {
    height: hp('11%'),
    paddingTop: hp('1.5%'),
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: wp('3%'),
    color: '#C8C8C8',
    marginTop: 5,
  },

  // ── Selects ───────────────────────────────────────────────────────────────
  selectInput: {
    height: hp('6%'),
    backgroundColor: '#F7F7F9',
    borderRadius: 12,
    paddingHorizontal: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  selectPlaceholder: { fontSize: wp('4%'), color: '#C8C8C8' },
  selectValue:       { fontSize: wp('4%'), color: '#111' },

  // ── Légal ─────────────────────────────────────────────────────────────────
  legalText: {
    textAlign: 'center',
    color: '#BBBBBB',
    fontSize: wp('3%'),
    lineHeight: wp('4.5%'),
    marginTop: hp('2.5%'),
    marginBottom: hp('0.5%'),
  },
  legalLink: { color: '#888', textDecorationLine: 'underline' },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaBtn: {
    height: hp('5.8%'),
    backgroundColor: '#FE5D02',
    borderRadius: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('2.5%'),
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('4%') },

  // ── Modals centrés ────────────────────────────────────────────────────────
  centeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
  },
  centeredBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: hp('2.5%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('5%'),
    width: wp('88%'),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: hp('1.5%'),
  },
  modalValidateBtn: {
    height: hp('5.8%'),
    backgroundColor: '#FE5D02',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('1.5%'),
  },
  modalValidateBtnText: {
    color: '#fff', fontWeight: '700', fontSize: wp('4%'),
  },

  // ── Options genre ─────────────────────────────────────────────────────────
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1.8%'),
  },
  genderOptionText: {
    fontSize: wp('4%'),
    color: '#333',
    fontWeight: '500',
  },
  genderOptionTextActive: {
    color: '#FE5D02',
    fontWeight: '700',
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FE5D02',
    alignItems: 'center', justifyContent: 'center',
  },
  optionSep: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
});
