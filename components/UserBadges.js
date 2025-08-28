import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function UserBadges({ badges }) {
  if (!badges || badges.length === 0) return null;
  return (
    <View style={styles.container}>
      {badges.map(badge => (
        <View key={badge.code} style={styles.badgeBox}>
          <Text style={styles.emoji}>{badge.emoji}</Text>
          <Text style={styles.label}>{badge.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: hp('1.6%'),
    marginTop: hp('1%'),
    gap: wp('2%'),
  },
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbea',
    paddingHorizontal: wp('3.2%'),
    paddingVertical: hp('0.9%'),
    borderRadius: wp('4.3%'),
    borderWidth: 1,
    borderColor: '#ffe096',
    marginRight: wp('1.5%'),
    marginBottom: hp('0.8%'),
    shadowColor: '#ffc21a',
    shadowOpacity: 0.06,
    shadowRadius: wp('1.2%'),
  },
  emoji: {
    fontSize: wp('5.2%'),
    marginRight: wp('1.7%'),
  },
  label: {
    color: '#d99d00',
    fontWeight: '600',
    fontSize: wp('3.7%'),
  },
});
