import React, { memo } from 'react';
import { View, Text, Platform, TouchableOpacity, Pressable } from 'react-native';
import GradientTitle from './GradientTitle';
import GradientIcon from './GradientIcon';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationRefresh } from '../context/NotificationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      {children}
    </TouchableOpacity>
  );
};

const MiniAppBar = ({ title, onNotificationsPress, onLeaderboardPress }) => {
  const { notifUnseen } = useNotificationRefresh();
  const insets = useSafeAreaInsets();

  const notifLabel =
    notifUnseen > 99 ? '99+' : notifUnseen > 9 ? '9+' : String(notifUnseen);

  const BASE_H = 48;

  return (
    <View
      style={{
        minHeight: BASE_H + insets.top, // ✅ auto en fonction du modèle
        paddingTop: insets.top,
        backgroundColor: '#fff',
        borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
        borderBottomColor: '#EEE',
        justifyContent: 'center',
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
        shadowRadius: Platform.OS === 'ios' ? 5 : 0,
        shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
        elevation: Platform.OS === 'android' ? 3 : 0,
      }}
    >
      {/* Ligne gauche/droite */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: BASE_H,
        }}
      >
        {/* 🏆 Classement mensuel */}
        <TouchableItem
          onPress={onLeaderboardPress}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}
        >
          <Ionicons name="podium-outline" size={22} color="#FF914D" />
        </TouchableItem>

        {/* 🔔 Notifications */}
        <TouchableItem
          onPress={onNotificationsPress}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <View style={{ position: 'relative' }}>
            <GradientIcon name="bell" size={20} />
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
          top: insets.top,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <GradientTitle
          style={{
            fontWeight: 'bold',
            fontSize: 18,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {title}
        </GradientTitle>
      </View>
    </View>
  );
};

export default memo(MiniAppBar);
