import React from 'react';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import MainApp from './MainApp';
import { ChatActivityProvider } from './context/ChatActivityContext';
import { AppForegroundProvider } from './context/AppForegroundContext';

export default function App() {
  return (
      <UserProvider>
        <NotificationProvider>
          <ChatActivityProvider>
            <AppForegroundProvider>
          <MainApp />
            </AppForegroundProvider>
          </ChatActivityProvider>
        </NotificationProvider>
      </UserProvider>
  );
}
