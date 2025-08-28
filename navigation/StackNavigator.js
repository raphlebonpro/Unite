import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs.js';

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
import GradientTitle from '../components/GradientTitle';
import RateSessionScreen from '../screens/RateSessionScreen';
import UserReviewScreen from '../screens/UserReviewScreen';
import LeaderBoardScreen from '../screens/LeaderBoardScreen';
import CollectiveChallengesScreen from '../screens/CollectiveChallengesScreen';
import FeedbackAndReportScreen from '../screens/FeedbackAndReportScreen';
import SearchFriendsScreen from '../screens/SearchFriendsScreen.js';
import FriendsListScreen from '../screens/FriendsListScreen';

// Fonction pour le header dégradé
const gradientHeader = (title) => ({
  headerTitle: () => <GradientTitle>{title}</GradientTitle>,
  headerTitleAlign: 'center',
  headerRight: () => <></>,
});

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: true,
      headerBackTitle: 'Retour',
      headerBackTitleVisible: true,
    }}>
      {/* Bottom Tabs avec toutes les sections principales */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Profil et édition */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={gradientHeader('Mon Profil')}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={gradientHeader('Modifier le profil')}
      />

      {/* Paramètres & autres */}
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
      {/* Nouvelle page Messages */}
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
      <Stack.Screen
       name="UserProfile"
       component={UserProfileScreen}
       options={{ headerShown: false }}
      />
      <Stack.Screen name="RateSession" 
      component={RateSessionScreen} 
      options={{ title: "Laisser un avis" }}
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
     <Stack.Screen name="FriendsList"
     component={FriendsListScreen}
     options={gradientHeader('Coéquipiers')}
     />
    </Stack.Navigator>
  );
}
