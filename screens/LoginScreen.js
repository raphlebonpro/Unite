import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // ← ajouté

  const handleLogin = async () => {
    // reset message
    setErrorMessage('');

    // validations simples
    if (!email.trim() || !password) {
      setErrorMessage('Veuillez saisir votre email et votre mot de passe.');
      return;
    }

const { error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});

if (error) {
  setErrorMessage('Email ou mot de passe incorrect.');
  return;
}

// 🔍 Vérifie si c'est la première connexion
const { data: userData, error: userError } = await supabase.auth.getUser();
const userId = userData?.user?.id;

if (!userId || userError) {
  setErrorMessage("Erreur lors de la récupération de l'utilisateur.");
  return;
}

const { data: userProfile, error: profileError } = await supabase
  .from('users')
  .select('first_login')
  .eq('id', userId)
  .single();

if (profileError) {
  console.warn('Erreur récupération profil utilisateur:', profileError.message);
}

// ✅ Affiche le message si c’est la première fois
if (userProfile?.first_login) {
  await supabase
    .from('users')
    .update({ first_login: false })
    .eq('id', userId);
}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo centré */}
            <Image source={require('../assets/logo.jpg')} style={styles.logo} />

            {/* Card */}
            <View style={[styles.card, { marginTop: 20 }]}>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>
                Remplissez les informations ci-dessous afin{'\n'}d'accéder à votre compte
              </Text>

              {/* Email */}
              <Text style={styles.label}>Adresse mail</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#cfcfcf"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errorMessage) setErrorMessage('');
                }}
                returnKeyType="next"
              />

              {/* Mot de passe */}
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
  <TextInput
    style={styles.inputPassword}
    placeholder="Mot de passe"
    placeholderTextColor="#cfcfcf"
    secureTextEntry={!showPassword}   // masqué quand showPassword = false
    autoCapitalize="none"
    autoCorrect={false}
    value={password}
    onChangeText={(t) => {
      setPassword(t);
      if (errorMessage) setErrorMessage('');
    }}
    returnKeyType="done"
  />
  <TouchableOpacity
    onPress={() => setShowPassword(s => !s)}
    style={styles.eyeBtn}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    accessibilityRole="button"
    accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
  >
    <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color="#8b8b8b" />
  </TouchableOpacity>
</View>


              {/* Message d'erreur inline */}
              {errorMessage ? (
                <Text style={styles.errorText} accessibilityLiveRegion="polite">
                  {errorMessage}
                </Text>
              ) : null}

{/* Bouton connexion */}
<TouchableOpacity onPress={handleLogin} activeOpacity={0.85}>
  <LinearGradient
    colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.loginButton}
  >
    <Text style={styles.loginButtonText}>Connexion</Text>
  </LinearGradient>
</TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.separatorContainer}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.line} />
              </View>

              {/* Liens */}
              <Text style={styles.bottomText}>
                Vous n'avez pas de compte ?{' '}
                <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                  Inscrivez-vous ici
                </Text>
              </Text>

              <Text style={[styles.bottomText, { marginTop: 6 }]}>
                Mot de passe oublié ?{' '}
                <Text style={styles.link} onPress={() => navigation.navigate('ForgotPassword')}>
                  Cliquez ici
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    paddingTop: Platform.select({ ios: hp('4.6%'), android: hp('4%') }),
    paddingBottom: Platform.select({ ios: hp('3.2%'), android: hp('2.8%') }),
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: 9999,
    resizeMode: 'cover',
    marginBottom: Platform.select({ ios: 6, android: 4 }),
  },
  card: {
    backgroundColor: '#fff',
    width: wp('90%'),
    maxWidth: 400,
    borderRadius: 20,
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
    marginTop: Platform.select({ ios: 10, android: 8 }),
    shadowColor: '#000',
    shadowOpacity: Platform.select({ ios: 0.10, android: 0 }),
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: Platform.select({ ios: 5, android: 6 }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    includeFontPadding: false,
  },
  label: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 6,
    includeFontPadding: false,
  },
  input: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111',
    marginBottom: 5,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  passwordContainer: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f3f3',
    paddingLeft: 12,
    paddingRight: 42,
    justifyContent: 'center',
    marginBottom: 12,
  },
  inputPassword: {
    fontSize: 15,
    color: '#111',
    includeFontPadding: false,
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    height: 44,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#FF5E62',
    shadowOpacity: Platform.select({ ios: 0.08, android: 0 }),
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: Platform.select({ ios: 2, android: 3 }),
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e6e6e6',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#777',
    fontSize: 14,
    includeFontPadding: false,
  },
  bottomText: {
    textAlign: 'center',
    color: '#222',
    fontSize: 14,
    includeFontPadding: false,
  },
  link: {
    color: '#A8957E',
    fontWeight: '700',
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },
});