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
  centerComponent,
  onNotificationsPress,
}) => {
  const navigation = useNavigation();
  const { notifUnseen } = useNotificationRefresh();

  const BASE_H = Platform.OS === 'ios' ? 45 : 52;

  // 🔥 Nouveau calibrage
  const iconSizeGroup = Platform.OS === 'ios' ? 28 : 26;
  const iconSizeBell = Platform.OS === 'ios' ? 22 : 21;
  const iconScale = Platform.OS === 'android' ? 0.98 : 1;
  const containerSize = Platform.OS === 'ios' ? 40 : 38;

  const notifLabel =
    notifUnseen > 99 ? '99+' :
    notifUnseen > 9 ? '9+' :
    String(notifUnseen);

  return (
    <View style={{ backgroundColor: '#fff', zIndex: 20 }}>
      <View
        style={{
          height: BASE_H,
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: BASE_H,
          }}
        >
          {/* Groupe */}
          <TouchableItem
            onPress={() => navigation.navigate('Groups')}
            style={{
              width: containerSize,
              height: containerSize,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <GradientIcon
              name="people-outline"
              size={iconSizeGroup}
              type="Ionicons"
              style={{ transform: [{ scale: iconScale }] }}
            />
          </TouchableItem>

          {/* Notifications */}
          <TouchableItem
            onPress={onNotificationsPress}
            style={{
              width: containerSize,
              height: containerSize,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <View style={{ position: 'relative' }}>
              <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                <GradientIcon
                  name="bell"
                  size={iconSizeBell}
                  style={{ transform: [{ scale: iconScale }] }}
                />
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

        {/* Centre */}
        <View
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            top: 0,
            height: BASE_H,
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerComponent ? (
            centerComponent
          ) : (
            <GradientTitle
              style={{ fontWeight: 'bold', fontSize: 19 }}
              numberOfLines={1}
            >
              {title}
            </GradientTitle>
          )}
        </View>
      </View>
    </View>
  );
};

export default MiniAppBar;
