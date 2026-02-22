import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleResetPassword = async () => {
    setError('');
    if (!email) {
      setError('Merci de renseigner votre email.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://reset-password-unite.netlify.app',
    });

    if (error) {
      setError(error.message || "Une erreur est survenue.");
    } else {
      setSent(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>
              Entre ton adresse email pour recevoir un lien de réinitialisation.
            </Text>

            {!sent ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse mail"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity onPress={handleResetPassword} activeOpacity={0.85}>
                  <View
                    style={[styles.button, {backgroundColor: '#FE5D02'}]}
                  >
                    <Text style={styles.buttonText}>Réinitialiser</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.success}>
                  Un email de réinitialisation vient d'être envoyé.
                </Text>

                <Text style={styles.delayInfo}>
                  Le mail peut mettre entre 5 et 10 minutes à arriver selon votre fournisseur.
                </Text>
              </>
            )}

            <TouchableOpacity
              style={{ marginTop: 18 }}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.link}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    color: '#5c5c5c',
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  link: {
    color: '#F62DAE',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  success: {
    marginTop: 16,
    color: '#2ecc71',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  delayInfo: {
    marginTop: 10,
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
  },
});
