import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function BienvenueScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require('../assets/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.title}>
            <Text style={{ textDecorationLine: 'underline', fontWeight: 'bold' }}>
              Bienvenue sur Unite !
            </Text>
          </Text>

          <Text style={styles.paragraph}>
            Vous venez de rejoindre la{'\n'}communauté sportive
          </Text>
          <Text style={styles.paragraph}>
            Participez à une session ou{'\n'}créez la vôtre !
          </Text>
          <Text style={styles.paragraph}>
            Connecte-toi, bouge, rencontre
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => {
              navigation.replace('Main', { showCongrats: true });
            }}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafbff' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('5.7%'),
  },
  logo: {
    width: wp('30%'),
    height: wp('30%'),
    marginBottom: hp('3%'),
    borderRadius: wp('50%'),
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: wp('3.5%'),
    elevation: 5,
  },
  card: {
    width: '95%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: wp('5.2%'),
    padding: wp('9.3%'),
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 9 },
    shadowRadius: wp('5.7%'),
    elevation: 7,
  },
  title: {
    fontSize: wp('6%'),
    marginBottom: hp('2.5%'),
    color: '#131313',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: hp('4.2%'),
    letterSpacing: 0.12,
  },
  paragraph: {
    fontSize: wp('4.5%'),
    color: '#181818',
    textAlign: 'center',
    marginBottom: hp('2.5%'),
    fontWeight: '400',
    lineHeight: hp('3.2%'),
    letterSpacing: 0.05,
  },
  button: {
    backgroundColor: '#FF7355',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.5%'),
    width: '90%',
    alignItems: 'center',
    marginTop: hp('1.5%'),
    shadowColor: '#4734E9',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: wp('1.8%'),
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4.8%'),
    fontWeight: '600',
    letterSpacing: 0.13,
  },
});
