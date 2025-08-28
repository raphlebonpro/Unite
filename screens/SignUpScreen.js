import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SignUpScreen = () => {
  const navigation = useNavigation();

  const handleSignUp = () => {
    navigation.navigate('RegisterForm');
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

        <TouchableOpacity
          style={[styles.button, Platform.OS === 'android' && stylesA.button]}
          onPress={handleSignUp}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, Platform.OS === 'android' && stylesA.buttonText]}>
            Créer un compte
          </Text>
        </TouchableOpacity>

        <View style={[styles.separatorContainer, Platform.OS === 'android' && stylesA.separatorContainer]}>
          <View style={styles.line} />
          <Text style={[styles.separatorText, Platform.OS === 'android' && stylesA.separatorText]}>or</Text>
          <View style={styles.line} />
        </View>

        <View style={[{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
          Platform.OS === 'android' && stylesA.bottomRow
        ]}>
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
    fontSize: hp('2.4%'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp('0.54%'),
  },
  subtitle: {
    fontSize: hp('1.6%'),
    textAlign: 'center',
    marginTop: hp('0.96%'),
    marginBottom: hp('2%'),
    color: '#333',
  },
  button: {
    backgroundColor: '#FF7355',
    paddingVertical: hp('1.4%'),
    borderRadius: wp('3%'),
    marginTop: hp('1.2%'),
    width: '100%',
    minWidth: 180,
    maxWidth: 340,
    alignSelf: 'center',
    shadowColor: '#FF7355',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: hp('1.85%'),
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
    fontSize: hp('1.65%'),
  },
  link: {
    color: '#A8957E',
    fontWeight: 'bold',
    fontSize: hp('1.65%'),
    textDecorationLine: 'underline',
  },
});

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
  title: { fontSize: 22, marginBottom: 8 },
  subtitle: { fontSize: 14, marginTop: 8, marginBottom: 16 },
  button: {
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 12,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  separatorContainer: { marginVertical: 14 },
  separatorText: { fontSize: 13 },
  bottomRow: { marginTop: 10 },
  bottomText: { fontSize: 13 },
  link: { fontSize: 13 },
});
