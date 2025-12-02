import React from 'react';
import { View, Text, Platform, TouchableOpacity, Pressable } from 'react-native';
import GradientTitle from './GradientTitle';
import GradientIcon from './GradientIcon';
import { useNotificationRefresh } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';

const TouchableItem = ({ onPress, children, style }) => {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ borderless: true }}
        style={style}
        hitSlop={6}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={style}
      activeOpacity={0.7}
      hitSlop={6}
    >
      {children}
    </TouchableOpacity>
  );
};

const MiniAppBar = ({
  title,
  onNotificationsPress,
  onLeaderboardPress,
  showLeaderboard = false,
}) => {
  const navigation = useNavigation();
  const { notifUnseen } = useNotificationRefresh();

  // Hauteurs fixes
  const BASE_H = Platform.OS === 'ios' ? 45 : 52;

  // Correction : NE PAS appliquer le safe area ici (SafeTop le fait déjà)
  const topInset = 0;

  const notifLabel =
    notifUnseen > 99 ? '99+' :
    notifUnseen > 9 ? '9+' :
    String(notifUnseen);

  return (
    <View style={{ backgroundColor: '#fff', zIndex: 20 }}>
      <View
        style={{
          height: BASE_H,          // Hauteur fixe, stable
          paddingTop: topInset,    // Ne doit jamais bouger
          backgroundColor: '#fff',
          borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
          borderBottomColor: '#EEE',
          justifyContent: 'center',
          paddingHorizontal: 12,
          shadowColor: '#000',
          shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.08,
          shadowRadius: Platform.OS === 'ios' ? 5 : 3,
          shadowOffset: { width: 0, height: 2 },
          elevation: Platform.OS === 'android' ? 3 : 0,
        }}
      >
        {/* Ligne principale */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: BASE_H,
          }}
        >
          {/* Groups */}
          <TouchableItem
            onPress={() => navigation.navigate('Groups')}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <GradientIcon name="people-outline" size={26} type="Ionicons" />
          </TouchableItem>

          {/* Leaderboard */}
          {showLeaderboard && (
            <TouchableItem
              onPress={
                onLeaderboardPress || (() => navigation.navigate('Leaderboard'))
              }
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 6,
              }}
            >
              <GradientIcon name="trophy" size={22} type="Ionicons" />
            </TouchableItem>
          )}

          {/* Notifications */}
          <TouchableItem
            onPress={onNotificationsPress}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <View style={{ position: 'relative' }}>
              <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                <GradientIcon name="bell" size={20} />
              </View>

              {notifUnseen > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#F34E4E',
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#fff',
                    paddingHorizontal: 2,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: 10,
                      lineHeight: 12,
                    }}
                  >
                    {notifLabel}
                  </Text>
                </View>
              )}
            </View>
          </TouchableItem>
        </View>

        {/* Titre centré */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,            // plus de safe area
            height: BASE_H,
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <GradientTitle style={{ fontWeight: 'bold', fontSize: 19 }} numberOfLines={1}>
            {title}
          </GradientTitle>
        </View>
      </View>
    </View>
  );
};

export default MiniAppBar;
