import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const BAR_H = Platform.OS === 'ios' ? 45 : 52; // 👈 identique à MiniAppBar
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
    <View style={[styles.shadowWrapper, Platform.OS === 'android' && { paddingTop: androidTop * 0.55 }]}>
      <View style={styles.appBar}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    backgroundColor: '#fff',
    // ✅ Même style que AppBar de Profil
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: Platform.OS === 'ios' ? 5 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    elevation: Platform.OS === 'android' ? 3 : 0,
    borderBottomColor: '#EEE',
    borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
  },
  appBar: {
    backgroundColor: '#fff',
    paddingHorizontal: wp('2.1%'),
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
    includeFontPadding: false,
  },
  btn: {
    width: BTN_BOX,
    height: BTN_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(CustomAppBar);
