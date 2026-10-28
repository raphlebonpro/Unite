import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, View, StyleSheet, Text } from 'react-native';
import { useUser } from '../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarLabel: route.name,
tabBarLabelStyle: {
  fontSize: wp('3.25%'),
  fontWeight: '600',
  marginTop: -2,
  marginBottom: insets.bottom > 0 ? insets.bottom * 0.05 : 0,
},
      tabBarStyle: {
        height: 56 + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#EDEDED',
      },
      tabBarActiveTintColor: '#FE5D02',
      tabBarInactiveTintColor: '#A0A4A8',
      tabBarIcon: ({ focused, color }) => {
        const size = wp('5.5%');

        const isCreate = route.name === 'Créer';
        const iconSize = isCreate ? wp('6%') : wp('5.2%');

          switch (route.name) {
case 'Explorer':
  const explorerSize = wp('6.3%');
  return focused
    ? <GradientTabIcon IconComponent={Ionicons} name="compass-outline" size={explorerSize} />
    : <Ionicons name="compass-outline" size={explorerSize} color={color} />;

            case 'Sessions':
              return focused
                ? <GradientTabIcon IconComponent={MaterialCommunityIcons} name="calendar-outline" size={size} />
                : <MaterialCommunityIcons name="calendar-month-outline" size={size} color={color} />;

case 'Créer':
  return focused ? (
    <GradientTabIcon
      IconComponent={MaterialCommunityIcons}
      name="plus-circle-outline"
      size={iconSize}
    />
  ) : (
    <MaterialCommunityIcons
      name="plus-circle-outline"
      size={iconSize}
      color={color}
    />
  );

            case 'Messages':
              return focused
                ? <GradientTabIcon IconComponent={Ionicons} name="chatbubble-ellipses-outline" size={size} />
                : <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />;

case 'Profil':
if (focused) {
  return (
    <View
      style={{
        padding: focused ? 2 : 0,
        borderRadius: wp('3.8%'),
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? '#F62DAE' : 'transparent',
      }}
    >
      <Image
        key={user?.profile_photo || 'default_avatar'}
        source={
          user?.profile_photo
            ? { uri: user.profile_photo }
            : require('../assets/avatar-default.png')
        }
        style={{
          width: wp('5.5%'),
          height: wp('5.5%'),
          borderRadius: wp('3.35%'),
        }}
        resizeMode="cover"
      />
    </View>
  );
  } else {
  return (
      <Image
        key={user?.profile_photo || 'default_avatar'}
        source={
         user?.profile_photo
           ? { uri: user.profile_photo }
           : require('../assets/avatar-default.png')
        }
        style={{
        height: wp('5.5%'),
        width: wp('5.5%'),
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
      <Tab.Screen name="Explorer" component={HomeScreen} />
      <Tab.Screen name="Sessions" component={ActivitiesScreen} />
      <Tab.Screen name="Créer" component={CreateSessionScreen} />
      <Tab.Screen name="Messages" component={MessagesGroupsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
