import React from 'react';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import MainApp from './MainApp';
import { ChatActivityProvider } from './context/ChatActivityContext';

export default function App() {
  return (
      <UserProvider>
        <NotificationProvider>
          <ChatActivityProvider>
          <MainApp />
          </ChatActivityProvider>
        </NotificationProvider>
      </UserProvider>
  );
}
