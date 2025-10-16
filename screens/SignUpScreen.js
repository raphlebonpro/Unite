import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';

const SignUpScreen = () => {
  const navigation = useNavigation();

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={[styles.container, Platform.OS === 'android' && stylesA.container]}>
      <Image
        source={require('../assets/logo.jpg')}
        style={[styles.logo, Platform.OS === 'android' && stylesA.logo]}
      />

      <View style={[styles.card, Platform.OS === 'android' && stylesA.card]}>
        <Text style={[styles.title, Platform.OS === 'android' && stylesA.title]}>
          Rejoignez la communauté !
        </Text>
        <Text style={[styles.subtitle, Platform.OS === 'android' && stylesA.subtitle]}>
          Créez ou rejoignez une session sportive, et bougez avec les gens autour de vous !
        </Text>

{/* Bouton créer un compte */}
<TouchableOpacity onPress={handleSignUp} activeOpacity={0.85}>
  <LinearGradient
    colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.button, Platform.OS === 'android' && stylesA.button]}
  >
    <Text style={[styles.buttonText, Platform.OS === 'android' && stylesA.buttonText]}>
      Créer un compte
    </Text>
  </LinearGradient>
</TouchableOpacity>

        <View style={[styles.separatorContainer, Platform.OS === 'android' && stylesA.separatorContainer]}>
          <View style={styles.line} />
          <Text style={[styles.separatorText, Platform.OS === 'android' && stylesA.separatorText]}>
            ou
          </Text>
          <View style={styles.line} />
        </View>

        <View
          style={[
            { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
            Platform.OS === 'android' && stylesA.bottomRow,
          ]}
        >
          <Text style={[styles.bottomText, Platform.OS === 'android' && stylesA.bottomText]}>
            Vous avez déjà un compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={[styles.link, Platform.OS === 'android' && stylesA.link]}>
              Connectez-vous ici
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SignUpScreen;

/* ==== iOS (inchangé) ==== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  logo: {
    width: wp('30%'),
    height: wp('30%'),
    resizeMode: 'contain',
    marginBottom: hp('1.3%'),
    borderRadius: wp('20%'),
  },
  card: {
    backgroundColor: '#fff',
    paddingVertical: hp('3.5%'),
    paddingHorizontal: wp('4.6%'),
    width: wp('93%'),
    maxWidth: 395,
    borderRadius: wp('4.3%'),
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 6,
    marginVertical: hp('1.45%'),
    alignSelf: 'center',
  },
  title: {
    fontSize: hp('2.4%'), // ✅ iOS garde sa taille d’origine
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp('0.54%'),
    color: '#111',
  },
  subtitle: {
    fontSize: hp('1.6%'),
    textAlign: 'center',
    marginTop: hp('0.96%'),
    marginBottom: hp('2%'),
    color: '#333',
  },
  button: {
    paddingVertical: hp('1.4%'),
    borderRadius: wp('3%'),
    marginTop: hp('1.2%'),
    width: '100%',
    minWidth: 180,
    maxWidth: 340,
    alignSelf: 'center',
    shadowColor: '#FF5E62',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: hp('1.85%'), // ✅ iOS garde sa taille d’origine
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1.5%'),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  separatorText: {
    marginHorizontal: wp('1.4%'),
    fontSize: hp('1.5%'),
    color: '#777',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: hp('1.65%'), // ✅ iOS garde sa taille d’origine
    color: '#333',
  },
  link: {
    color: '#A8957E',
    fontWeight: 'bold',
    fontSize: hp('1.65%'), // ✅ iOS garde sa taille d’origine
    textDecorationLine: 'underline',
  },
});

/* ==== Android (override uniquement) ==== */
const stylesA = StyleSheet.create({
  container: {
    padding: 16,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  card: {
    width: '92%',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    elevation: 6,
    marginVertical: 12,
  },
  title: { fontSize: hp('2.4%'), marginBottom: 8 },
  subtitle: { fontSize: 14, marginTop: 8, marginBottom: 16 },
  button: {
    paddingVertical: hp('1.4%'),
    borderRadius: wp('3%'),
    marginTop: hp('1.2%'),
    width: '100%',
    minWidth: 180,
    maxWidth: 340,
    alignSelf: 'center',
    shadowColor: '#FF5E62',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: { 
    fontSize: hp('2%'), // même taille que iOS
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  separatorContainer: { marginVertical: 14 },
  separatorText: { fontSize: 13 },
  bottomRow: { marginTop: 10 },
  bottomText: {
    fontSize: hp('1.8%'), // ✅ Android corrigé
    color: '#333',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  link: {
    fontSize: hp('1.8%'), // ✅ Android corrigé
    color: '#A8957E',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
