import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignUpScreen = () => {
  const navigation = useNavigation();

return (
  <View style={{ flex: 1 }}>

    <StatusBar style="dark" />

    {/* 🔝 HEADER BLANC 15% */}
    <View style={{ 
      flex: 0.15, 
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 10
    }}>

      <Image
        source={require('../assets/logo.jpg')}
        style={{ width: 100, height: 35, resizeMode: 'contain' }}
      />

      <Text style={{
        marginTop: 6,
        fontSize: 12,
        letterSpacing: 1,
        color: '#888'
      }}>
        Le sport est plus fort ensemble
      </Text>

    </View>

    {/* 🔽 CONTENU PRINCIPAL */}
    <LinearGradient
      colors={['#FFFFFF', '#FFF6F2']}
      style={{ flex: 0.85 }}
    >

      <View style={styles.content}>

        <Text style={styles.title}>
          Ne fais plus de sport seul.
        </Text>

        <Text style={styles.subtitle}>
          Trouve des coéquipiers près de toi, crée des sessions et bouge ensemble.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.primaryText}>
            Commencer
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>
          Déjà membre ?
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.link}>
            Se connecter
          </Text>
        </TouchableOpacity>
      </View>

    </LinearGradient>

  </View>
);
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  content: {
    marginTop: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: '#FE5D02',
    paddingVertical: 18,
    borderRadius: 22,
    marginTop: 40,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottom: {
    alignItems: 'center',
    marginBottom: 30,
  },
  bottomText: {
    fontSize: 14,
    color: '#777',
  },
  link: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#FE5D02',
  },
});
