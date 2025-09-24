import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs.js';
import { Platform } from 'react-native';


import EditProfileScreen from '../screens/EditProfileScreen';
import LocationScreen from '../screens/LocationScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AutorisationNotificationsScreen from '../screens/AutorisationNotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SessionMessagesScreen from '../screens/SessionMessagesScreen.js';
import EditSessionScreen from '../screens/EditSessionScreen.js';
import ActivitiesScreen from '../screens/ActivitiesScreen.js';
import UserProfileScreen from '../screens/UserProfileScreen.js';
import RateSessionScreen from '../screens/RateSessionScreen';
import UserReviewScreen from '../screens/UserReviewScreen';
import LeaderBoardScreen from '../screens/LeaderBoardScreen';
import CollectiveChallengesScreen from '../screens/CollectiveChallengesScreen';
import FeedbackAndReportScreen from '../screens/FeedbackAndReportScreen';
import SearchFriendsScreen from '../screens/SearchFriendsScreen.js';
import FriendsListScreen from '../screens/FriendsListScreen';
import EditReviewScreen from '../screens/EditReviewScreen';
import InviteFriendsToSession from '../screens/InviteFriendsToSession';

import GradientTitle from '../components/GradientTitle';

const Stack = createNativeStackNavigator();

const gradientHeader = (title) => ({
  headerTitle: () => (
    <GradientTitle style={{ fontWeight: 'bold', fontSize: 18 }}>
      {title}
    </GradientTitle>
  ),
  headerTitleAlign: 'center',
  headerBackTitle: 'Retour',
  headerBackVisible: true,
  // 👉 Ombre et fond repris de CustomAppBar
  headerStyle: {
    backgroundColor: '#fff',
    borderBottomColor: '#EEE',
    borderBottomWidth: Platform.OS === 'ios' ? 0.3 : 0,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: Platform.OS === 'ios' ? 6 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 3 } : undefined,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  headerShadowVisible: false, // on masque l’ombre par défaut pour n’utiliser que la nôtre
});


export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {/* Bottom Tabs */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Profil */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }} // ⚠️ a déjà son propre AppBar
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={gradientHeader('Modifier le profil')}
      />

      {/* Paramètres */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={gradientHeader('Paramètres')}
      />
      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={gradientHeader('Localisation')}
      />
      <Stack.Screen
        name="AutorisationNotifications"
        component={AutorisationNotificationsScreen}
        options={gradientHeader('Notifications')}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={gradientHeader('CGU')}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={gradientHeader('Confidentialité')}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={gradientHeader('Détail de la session')}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={gradientHeader('Notifications')}
      />

      {/* Messages */}
      <Stack.Screen
        name="SessionMessages"
        component={SessionMessagesScreen}
        options={gradientHeader('Messages')}
      />
      <Stack.Screen
        name="EditSession"
        component={EditSessionScreen}
        options={gradientHeader('Modifier la session')}
      />
      <Stack.Screen
        name="Activities"
        component={ActivitiesScreen}
        options={gradientHeader('Activités')}
      />

      {/* Autres */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RateSession"
        component={RateSessionScreen}
        options={gradientHeader('Laisser un avis')}
      />
      <Stack.Screen
        name="UserReview"
        component={UserReviewScreen}
        options={gradientHeader('Avis reçus')}
      />
      <Stack.Screen
        name="LeaderBoard"
        component={LeaderBoardScreen}
        options={gradientHeader('Classement Mensuel')}
      />
      <Stack.Screen
        name="CollectiveChallenges"
        component={CollectiveChallengesScreen}
        options={gradientHeader('Défis collectifs')}
      />
      <Stack.Screen
        name="FeedbackAndReport"
        component={FeedbackAndReportScreen}
        options={gradientHeader('Retour / Signalement')}
      />
      <Stack.Screen
        name="SearchFriends"
        component={SearchFriendsScreen}
        options={gradientHeader('Recherche coéquipier')}
      />
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
        options={gradientHeader('Coéquipiers')}
      />
      <Stack.Screen
        name="EditReviewScreen"
        component={EditReviewScreen}
        options={gradientHeader('Modifier son avis')}
      />
      <Stack.Screen
        name="InviteFriendsToSession"
        component={InviteFriendsToSession}
        options={gradientHeader('Inviter un coéquipier')}
      />
    </Stack.Navigator>
  );
}
