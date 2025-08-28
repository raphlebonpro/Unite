import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const UniteOrangeButton = ({ title, onPress, style, textStyle }) => (
  <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.85}>
    <LinearGradient
      colors={['#ff8552', '#ff6f3c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientButton}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  gradientButton: {
    width: '100%',
    paddingVertical: hp('1.7%'),
    borderRadius: wp('7%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff8552',
    shadowOpacity: 0.14,
    shadowRadius: wp('2.5%'),
    elevation: 3,
    marginTop: hp('1.5%'),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp('4.2%'),
    letterSpacing: 0.1,
  },
});

export default UniteOrangeButton;
