import React from 'react';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import MainApp from './MainApp';

export default function App() {
  return (
      <UserProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </UserProvider>
  );
}
