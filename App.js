import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import MainApp from './MainApp';

export default function App() {
  return (
    <StripeProvider
      publishableKey={Constants.expoConfig.extra.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.collectif.uniteapp" // iOS → Apple Pay
      urlScheme="unite" // 👈 Obligatoire pour redirection après paiement (iOS + Android)
    >
      <UserProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </UserProvider>
    </StripeProvider>
  );
}
