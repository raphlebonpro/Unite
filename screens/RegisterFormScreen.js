import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Modal, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback, StatusBar
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import Toast from 'react-native-toast-message';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

if (typeof global !== "undefined") global.Buffer = Buffer;

const GENDER_OPTIONS = ['Homme', 'Femme', 'Ne pas se prononcer'];

async function uploadAvatar(uri, userId) {
  try {
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const fileBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName);
    if (urlError) throw urlError;

    return urlData.publicUrl;
  } catch (e) {
    throw new Error("Erreur upload avatar : " + e.message);
  }
}

export default function SignUpScreen({ navigation }) {
  const [avatar, setAvatar] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [birthdate, setBirthdate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [tempBirthdate, setTempBirthdate] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l’accès à la galerie pour importer une photo.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.cancelled && result.assets && result.assets[0].uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !pseudo || !birthdate || !gender || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData?.user?.id;
      if (!userId) throw new Error("Impossible de récupérer l'ID utilisateur après inscription.");

      let avatarUrl = '';
      if (avatar) avatarUrl = await uploadAvatar(avatar, userId);

      const { error: upsertError } = await supabase
        .from('users')
        .upsert([{
          id: userId,
          email,
          username: pseudo,
          birthdate: birthdate ? birthdate.split('T')[0] : null,
          gender,
          bio: description,
          profile_photo: avatarUrl,
          first_login: true,
        }]);
      if (upsertError) throw new Error(upsertError.message);

      await supabase.from('notifications').insert([{
        user_id: userId,
        type: 'welcome',
        title: 'Bienvenue sur Unite 🎉',
        body: 'Ton compte a bien été créé ! Tu peux maintenant te connecter pour découvrir les sessions autour de toi.',
        is_read: false,
        created_at: new Date().toISOString()
      }]);

      await supabase.auth.signOut();

      Toast.show({
        type: 'success',
        text1: 'Inscription réussie ✅',
        text2: 'Tu peux maintenant te connecter !',
        position: 'top',
      });

    } catch (err) {
      Alert.alert("Erreur", err?.message || "Erreur inattendue à l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {/* Spacer status bar Android uniquement */}
          {Platform.OS === 'android' ? (
            <View style={{ height: StatusBar.currentHeight ?? 0 }} />
          ) : null}

          {/* AppBar */}
          <View style={[styles.appBar, Platform.OS === 'android' && stylesA.appBar]}>
            <View style={styles.appBarSide}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Ionicons name="arrow-back" size={26} color="#222" />
              </TouchableOpacity>
            </View>
            <View style={styles.appBarCenter}>
              <Text style={[styles.appBarTitle, Platform.OS === 'android' && stylesA.appBarTitle]} numberOfLines={1}>
                Créer un compte
              </Text>
            </View>
            <View style={styles.appBarSide} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.container, Platform.OS === 'android' && stylesA.container]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Avatar */}
            <TouchableOpacity style={[styles.avatarContainer, Platform.OS === 'android' && stylesA.avatarContainer]} onPress={pickImage} activeOpacity={0.9}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={[styles.avatar, Platform.OS === 'android' && stylesA.avatar]} />
              ) : (
                <View style={[styles.avatarPlaceholder, Platform.OS === 'android' && stylesA.avatarPlaceholder]}>
                  <Ionicons name="person" size={60} color="#bbb" />
                </View>
              )}
              <Text style={[styles.importText, Platform.OS === 'android' && stylesA.importText]}>Importer une photo</Text>
            </TouchableOpacity>

            {/* Inputs */}
            <TextInput
              style={[styles.input, Platform.OS === 'android' && stylesA.input]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              maxFontSizeMultiplier={1.1}
            />

            <View style={[styles.passwordContainer, Platform.OS === 'android' && stylesA.passwordContainer]}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }, Platform.OS === 'android' && stylesA.input]}
                placeholder="Mot de passe"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                maxFontSizeMultiplier={1.1}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword((prev) => !prev)}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={21} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={[styles.passwordContainer, Platform.OS === 'android' && stylesA.passwordContainer]}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }, Platform.OS === 'android' && stylesA.input]}
                placeholder="Confirmer le mot de passe"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                maxFontSizeMultiplier={1.1}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={21} color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, Platform.OS === 'android' && stylesA.input]}
              placeholder="Pseudo"
              value={pseudo}
              onChangeText={setPseudo}
              maxFontSizeMultiplier={1.1}
            />

            {/* Date de naissance */}
            <TouchableOpacity
              style={[styles.input, Platform.OS === 'android' && stylesA.input]}
              onPress={() => {
                setTempBirthdate(birthdate ? new Date(birthdate) : new Date(2000, 0, 1));
                setShowDatePicker(true);
              }}
              activeOpacity={0.9}
            >
              <Text style={[{ color: birthdate ? '#222' : '#aaa', fontSize: 16, paddingVertical: 2 }, Platform.OS === 'android' && stylesA.valueText]}>
                {birthdate ? new Date(birthdate).toLocaleDateString('fr-FR') : 'Date de naissance'}
              </Text>
            </TouchableOpacity>

            {/* Genre */}
            <TouchableOpacity
              style={[styles.input, Platform.OS === 'android' && stylesA.input]}
              onPress={() => setShowGenderModal(true)}
              activeOpacity={0.9}
            >
              <Text style={[{ color: gender ? '#222' : '#aaa', fontSize: 16, paddingVertical: 2 }, Platform.OS === 'android' && stylesA.valueText]}>
                {gender ? gender : 'Genre'}
              </Text>
            </TouchableOpacity>

            {/* Description */}
            <TextInput
              style={[styles.input, styles.descriptionInput, Platform.OS === 'android' && stylesA.descriptionInput]}
              placeholder="Parle un peu de toi !"
              value={description}
              onChangeText={setDescription}
              multiline
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
              maxFontSizeMultiplier={1.1}
            />

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.signUpButtonContainer, Platform.OS === 'android' && stylesA.signUpButtonContainer]}
            >
              <LinearGradient
                colors={['#ff9966', '#ff5e62']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.signUpButtonGradient, Platform.OS === 'android' && stylesA.signUpButtonGradient]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.signUpButtonText, Platform.OS === 'android' && stylesA.signUpButtonText]}>S'inscrire</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>

          {/* MODALE DATE */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={[styles.pickerModalOverlay, Platform.OS === 'android' && stylesA.modalOverlay]}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={[styles.pickerModalBox, { paddingBottom: 18 }, Platform.OS === 'android' && stylesA.modalBox]}>
                <Text style={[styles.pickerModalTitle, Platform.OS === 'android' && stylesA.modalTitle]}>Date de naissance</Text>

                <DateTimePicker
                  value={tempBirthdate ? new Date(tempBirthdate) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setTempBirthdate(selectedDate);
                  }}
                  style={{ width: 270, alignSelf: 'center' }}
                />

                <TouchableOpacity
                  onPress={() => {
                    setBirthdate(tempBirthdate ? tempBirthdate.toISOString() : null);
                    setShowDatePicker(false);
                  }}
                  style={stylesA?.primaryModalBtn || { marginTop: 18, backgroundColor: '#3f4fff', borderRadius: 9, paddingVertical: 9, paddingHorizontal: 34, alignItems: 'center' }}
                  activeOpacity={0.87}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Valider</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* MODALE GENRE */}
          <Modal
            visible={showGenderModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <TouchableOpacity
              style={[styles.pickerModalOverlay, Platform.OS === 'android' && stylesA.modalOverlay]}
              activeOpacity={1}
              onPress={() => setShowGenderModal(false)}
            >
              <View style={[styles.pickerModalBox, Platform.OS === 'android' && stylesA.modalBox]}>
                <Text style={[styles.pickerModalTitle, Platform.OS === 'android' && stylesA.modalTitle]}>Genre</Text>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.pickerModalOption,
                      Platform.OS === 'android' && stylesA.modalOption,
                      gender === option && (styles.pickerModalOptionSelected)
                    ]}
                    onPress={() => {
                      setGender(option);
                      setShowGenderModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerModalOptionText,
                        Platform.OS === 'android' && stylesA.modalOptionText,
                        gender === option && styles.pickerModalOptionTextSelected
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* ==== TES STYLES ORIGINAUX (iOS conserve) ==== */
const styles = StyleSheet.create({
  appBar: {
    height: hp('7%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: hp('0.8%'),
    paddingHorizontal: 0,
  },
  appBarSide: { width: wp('13%'), alignItems: 'flex-start', justifyContent: 'center' },
  backButton: { paddingLeft: wp('4%'), paddingVertical: hp('1.2%') },
  appBarCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: {
    fontSize: hp('2.4%'),
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: 'center'
  },
  container: {
    alignItems: 'center',
    padding: wp('5%'),
    paddingTop: hp('2%'),
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: hp('2.3%'),
  },
  avatar: {
    width: wp('21%'),
    height: wp('21%'),
    borderRadius: wp('10.5%'),
    marginBottom: hp('0.8%'),
  },
  avatarPlaceholder: {
    width: wp('21%'),
    height: wp('21%'),
    borderRadius: wp('10.5%'),
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('0.8%'),
  },
  importText: {
    color: '#1b72e8',
    fontSize: hp('1.7%'),
    marginBottom: hp('0.8%'),
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('3.2%'),
    padding: hp('1.4%'),
    marginBottom: hp('1.6%'),
    fontSize: hp('1.9%'),
    backgroundColor: '#fafbff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: hp('1.6%'),
  },
  eyeIcon: { position: 'absolute', right: wp('4%'), padding: 6, zIndex: 10 },
  descriptionInput: { minHeight: hp('13%'), textAlignVertical: 'top' },
  signUpButtonContainer: {
    width: '100%',
    alignSelf: 'center',
    marginTop: hp('2.2%'),
    marginBottom: hp('2.8%'),
    borderRadius: wp('7.2%'),
    overflow: 'hidden',
  },
  signUpButtonGradient: {
    width: '100%',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff5e62',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 9,
    elevation: 2,
  },
  signUpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: hp('2.1%'),
    letterSpacing: 0.18,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,32,56,0.17)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerModalBox: {
    width: '83%',
    backgroundColor: '#fff',
    borderRadius: wp('5%'),
    paddingTop: hp('2.2%'),
    paddingBottom: hp('1.6%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 19,
    elevation: 8,
  },
  pickerModalTitle: {
    fontSize: hp('2.15%'),
    fontWeight: '600',
    color: '#2A297A',
    marginBottom: hp('1.4%'),
  },
  pickerModalOption: {
    width: '100%',
    paddingVertical: hp('1.6%'),
    borderRadius: wp('2.4%'),
    alignItems: 'center',
    marginBottom: hp('0.3%'),
  },
  pickerModalOptionSelected: { backgroundColor: '#eef1ff' },
  pickerModalOptionText: {
    fontSize: hp('1.95%'),
    color: '#222',
    fontWeight: '500',
    letterSpacing: 0.08,
  },
  pickerModalOptionTextSelected: { color: '#3f4fff', fontWeight: 'bold' },
  congratsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,32,56,0.17)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  congratsModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: wp('7%'),
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
  },
  congratsTitle: {
    fontSize: hp('2.7%'),
    fontWeight: 'bold',
    color: '#3f4fff',
    marginBottom: hp('0.8%'),
  },
  congratsSubtitle: {
    fontSize: hp('1.9%'),
    color: '#222',
    marginBottom: hp('2.1%'),
    textAlign: 'center',
  },
  congratsBtn: {
    backgroundColor: '#3f4fff',
    borderRadius: wp('2.6%'),
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('9%'),
    marginBottom: hp('0.6%'),
  },
  congratsBtnText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: 'bold',
  },
  congratsCloseBtn: {
    marginTop: hp('0.5%'),
    paddingVertical: hp('0.7%'),
    paddingHorizontal: wp('3%'),
  },
});

/* ==== ANDROID OVERRIDES UNIQUEMENT ==== */
const stylesA = StyleSheet.create({
  appBar: {
    height: undefined,
    paddingVertical: 8,
    marginBottom: 8,
  },
  appBarTitle: { fontSize: 20 },
  container: {
    padding: 16,
    paddingTop: 12,
  },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 120, height: 120, borderRadius: 60, marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60, marginBottom: 10,
  },
  importText: { fontSize: 14 },
  input: {
    minHeight: 48,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    includeFontPadding: false,
  },
  valueText: { includeFontPadding: false },
  passwordContainer: { minHeight: 48 },
  descriptionInput: { minHeight: 120, textAlignVertical: 'top' },
  signUpButtonContainer: { marginTop: 18, marginBottom: 22, borderRadius: 18 },
  signUpButtonGradient: { paddingVertical: 14, borderRadius: 18, elevation: 2 },
  signUpButtonText: { fontSize: 16, fontWeight: '700' },

  // Modales (date, genre, congrats)
  modalOverlay: { backgroundColor: 'rgba(30,32,56,0.20)' },
  modalBox: {
    width: '86%',
    borderRadius: 18,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalOption: { paddingVertical: 12, borderRadius: 12 },
  modalOptionText: { fontSize: 15 },
  primaryModalBtn: {
    marginTop: 18,
    backgroundColor: '#3f4fff',
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 34,
    alignItems: 'center'
  },
  congratsModalContent: {
    width: '86%',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
  },
});
