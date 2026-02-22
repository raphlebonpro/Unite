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
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');

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
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Logo */}
            <Image
              source={require('../assets/logo.jpg')}
              style={styles.logo}
            />

            <View style={styles.card}>

            {/* Titre */}
            <Text style={styles.title}>Connexion</Text>

            {/* Email */}
<TextInput
  style={styles.input}
  placeholder="E-mail"
  placeholderTextColor="#bdbdbd"
  keyboardType="email-address"
  autoCapitalize="none"
  autoCorrect={false}
  autoComplete="off"
  textContentType="none"
  importantForAutofill="no"
  value={email}
  onChangeText={setEmail}
/>

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Mot de passe"
                placeholderTextColor="#bdbdbd"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eye}
              >
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={18}
                  color="#9a9a9a"
                />
              </TouchableOpacity>
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgot}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Erreur */}
            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            {/* Bouton Connexion */}
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.9}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Connexion</Text>
              </View>
            </TouchableOpacity>

            {/* Inscription */}
<View style={{ marginTop: 28, alignItems: 'center' }}>
  <Text style={styles.registerText}>
    Pas encore de compte ?
  </Text>

  <TouchableOpacity
    onPress={() => navigation.replace('Onboarding')}
  >
    <Text style={styles.registerLink}>
      Créer un compte
    </Text>
  </TouchableOpacity>
</View>
</View>
        </KeyboardAvoidingView>
        </View>
        </Pressable>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  wrapper: {
  flex: 1,
  paddingHorizontal: 28,
  paddingTop: 100,
},
scroll: {
  flexGrow: 1,
  paddingHorizontal: 28,
  paddingTop: 80,
  paddingBottom: 40,
},
  logo: {
    width: wp('32%'),
    height: wp('32%'),
    alignSelf: 'center',
    borderRadius: 60,
    marginBottom: 20,
  },
title: {
  fontSize: 25,
  fontWeight: '800',
  color: '#111',
  marginBottom: 25,
},
input: {
  height: 48,
  borderRadius: 18,
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 18,
  fontSize: 16,
  marginBottom: 18,
  borderWidth: 0,
  borderColor: '#ECECEC',
},
passwordContainer: {
  height: 48,
  borderRadius: 16,
  backgroundColor: '#f2f2f2',
  paddingHorizontal: 16,
  justifyContent: 'center',
  marginBottom: 8,
  borderWidth: 0,
  borderColor: '#ECECEC',
},
  inputPassword: {
    fontSize: 16,
  },
  eye: {
    position: 'absolute',
    right: 16,
  },
  forgot: {
    alignSelf: 'center',
    color: '#6f6f6f',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 10,
    fontWeight: '600',
  },
  error: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
button: {
  height: 42,
  borderRadius: 32,
  backgroundColor: '#FE5D02',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 10,
  marginHorizontal: 10,
},
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    color: '#6f6f6f',
    marginBottom: 12,
    fontSize: 15,
  },
registerLink: {
  color: '#FE5D02',
  fontWeight: '800',
  fontSize: 16,
  letterSpacing: 0.3,
},
  card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 28,
  padding: 24,
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 25,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
},
});
