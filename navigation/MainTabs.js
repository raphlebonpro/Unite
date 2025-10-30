import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, View, StyleSheet } from 'react-native';
import { useUser } from '../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import HomeScreen from '../screens/HomeScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import MessagesGroupsScreen from '../screens/MessagesGroupsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GradientTabIcon from '../components/GradientTabIcon';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const GRADIENT_COLORS = ['#FF9D3C', '#FF6C4A', '#FF375E'];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        // 🔹 on masque le label uniquement pour "Créer"
        tabBarLabel: route.name === 'Créer' ? '' : route.name,
        tabBarLabelStyle: {
          fontSize: wp('3.3%'),
          fontWeight: '500',
          marginTop: 2,
          marginBottom: insets.bottom > 0 ? insets.bottom * 0.1 : 0,
        },
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#EDEDED',
        },
        tabBarActiveTintColor: '#1877F2',
        tabBarInactiveTintColor: '#A0A4A8',

        tabBarIcon: ({ focused, color }) => {
          const size = wp('5.2%');

          switch (route.name) {
            case 'Accueil':
              return focused
                ? <GradientTabIcon IconComponent={Ionicons} name="home-outline" size={size} />
                : <Ionicons name="home-outline" size={size} color={color} />;

            case 'Activités':
              return focused
                ? <GradientTabIcon IconComponent={MaterialCommunityIcons} name="heart-pulse" size={size} />
                : <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />;

case 'Créer':
  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: wp('-5.5%'),
      }}
    >
      {focused ? (
        // === Bouton actif : rond blanc avec bordure dégradée plus fine ===
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: wp('0.25%'), // ✅ bordure plus fine
            borderRadius: wp('6%'),
          }}
        >
          <View
            style={{
              width: wp('11%'),
              height: wp('11%'),
              borderRadius: wp('5.5%'),
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
            }}
          >
            <GradientTabIcon
              IconComponent={MaterialCommunityIcons}
              name="plus"
              size={wp('5.5%')}
            />
          </View>
        </LinearGradient>
      ) : (
        // === Bouton inactif : rond gris clair ===
        <View
          style={{
            width: wp('11%'),
            height: wp('11%'),
            borderRadius: wp('5.5%'),
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f4f4f4',
          }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={wp('5.5%')}
            color={color}
          />
        </View>
      )}
    </View>
  );

            case 'Messages':
              return focused
                ? <GradientTabIcon IconComponent={Ionicons} name="chatbubble-ellipses-outline" size={size} />
                : <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />;

            case 'Profil':
              if (focused) {
                return (
                  <LinearGradient
                    colors={GRADIENT_COLORS}
                    style={{
                      padding: 2,
                      borderRadius: wp('3.8%'),
                    }}
                  >
                    <Image
                      key={user?.profile_photo || 'default_avatar'}
                      source={
                        user?.profile_photo
                          ? { uri: user.profile_photo }
                          : require('../assets/logo.jpg')
                      }
                      style={{
                        width: wp('6.7%'),
                        height: wp('6.7%'),
                        borderRadius: wp('3.3%'),
                      }}
                      resizeMode="cover"
                    />
                  </LinearGradient>
                );
              } else {
                return (
                  <Image
                    key={user?.profile_photo || 'default_avatar'}
                    source={
                      user?.profile_photo
                        ? { uri: user.profile_photo }
                        : require('../assets/logo.jpg')
                    }
                    style={{
                      width: wp('6.7%'),
                      height: wp('6.7%'),
                      borderRadius: wp('3.3%'),
                    }}
                    resizeMode="cover"
                  />
                );
              }

            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Activités" component={ActivitiesScreen} />
      <Tab.Screen name="Créer" component={CreateSessionScreen} />
      <Tab.Screen name="Messages" component={MessagesGroupsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
