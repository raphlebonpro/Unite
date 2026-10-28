import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Platform, Pressable, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🔹 Même logique que MiniAppBar (paddingTop + minHeight)
const CustomAppBar = ({
  title,
  showBack = true,
  onBack,
  rightIcon,
  onRightPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const BASE_H = Platform.OS === 'ios' ? 45 : 52;
const topOffset = Platform.OS === 'android' ? insets.top : 0;

  // ✅ Touchable unifié (comme dans MiniAppBar)
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

  return (
    <View style={{ backgroundColor: '#fff' }}>
      <View
        style={{
          minHeight: BASE_H + topOffset,
          paddingTop: topOffset,
          backgroundColor: '#fff',
          borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
          borderBottomColor: '#EEE',
          justifyContent: 'center',
          paddingHorizontal: 12,
          shadowColor: '#000',
          shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
          shadowRadius: Platform.OS === 'ios' ? 5 : 0,
          shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
          elevation: Platform.OS === 'android' ? 4 : 0,
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
          {/* 🔙 Bouton retour */}
          {showBack ? (
            <TouchableItem
              onPress={onBack || (() => navigation.goBack())}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 4,
              }}
            >
              <Feather name="arrow-left" size={22} color="#FF8269" />
            </TouchableItem>
          ) : (
            <View style={{ width: 40 }} />
          )}

          {/* 🏷️ Titre centré */}
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: Platform.OS === 'ios' ? 18 : 20,
              color: '#111',
              letterSpacing: 0.15,
              marginHorizontal: 8,
              includeFontPadding: false,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>

          {/* ⚙️ Bouton droit */}
          {rightIcon ? (
            <TouchableItem
              onPress={onRightPress}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <Feather name={rightIcon} size={22} color="#FF8269" />
            </TouchableItem>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>
    </View>
  );
};

export default memo(CustomAppBar);
