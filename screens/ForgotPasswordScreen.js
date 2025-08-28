import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Saisis ton adresse mail pour recevoir un lien de réinitialisation.
        </Text>
        {!sent ? (
          <>
            <Text style={styles.label}>Adresse mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
              <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ marginTop: 30, color: '#2ecc40', textAlign: 'center', fontWeight: 'bold' }}>
            Un email de réinitialisation vient d'être envoyé.
          </Text>
        )}
        <TouchableOpacity style={{ marginTop: 25 }} onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 38,
    width: '92%',
    maxWidth: 460,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 6,
    marginVertical: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    color: '#333',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF7355',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 17,
  },
  link: {
    color: '#A8957E',
    fontWeight: '700',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 15,
  },
  error: {
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
  },
});
