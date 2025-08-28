import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const BAR_H     = hp('6.2%');   // même hauteur visuelle que MiniAppBar
const BTN_BOX   = wp('10%');
const ICON_SIZE = wp('6.1%');
const TITLE_FS  = wp('4.8%');

const CustomAppBar = ({
  title,
  showBack = true,
  onBack,
  rightIcon,
  onRightPress,
}) => {
  const navigation = useNavigation();
  const androidTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View style={[styles.appBar, Platform.OS === 'android' && { paddingTop: androidTop * 0.55 }]}>
      <View style={{ height: BAR_H, flexDirection: 'row', alignItems: 'center' }}>
        {showBack ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={onBack || (() => navigation.goBack())}
            hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
            accessibilityRole="button"
            accessibilityLabel="Revenir en arrière"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={ICON_SIZE} color="#FF8269" />
          </TouchableOpacity>
        ) : (
          <View style={styles.btn} />
        )}

        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>

        {rightIcon ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={onRightPress}
            hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
            accessibilityRole="button"
            accessibilityLabel="Action"
            activeOpacity={0.7}
          >
            <Feather name={rightIcon} size={ICON_SIZE} color="#FF8269" />
          </TouchableOpacity>
        ) : (
          <View style={styles.btn} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: '#fff',
    paddingHorizontal: wp('2.1%'), // idem MiniAppBar
    borderBottomColor: '#EEE',
    borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.055 : 0,
    shadowRadius: Platform.OS === 'ios' ? 5.5 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2.5 } : undefined,
    elevation: Platform.OS === 'android' ? 3.5 : 0,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: TITLE_FS,
    lineHeight: TITLE_FS * 1.1,
    color: '#111',
    letterSpacing: 0.15,
    marginHorizontal: wp('1.2%'),
    includeFontPadding: false, // Android: centre mieux verticalement
  },
  btn: {
    width: BTN_BOX,
    height: BTN_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(CustomAppBar);
