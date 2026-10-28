import React, { createContext, useContext, useState } from 'react';

const ChatActivityContext = createContext(null);

export const ChatActivityProvider = ({ children }) => {
  const [activeSessionChatId, setActiveSessionChatId] = useState(null);
  const [activeGroupChatId, setActiveGroupChatId] = useState(null);

  return (
    <ChatActivityContext.Provider
      value={{
        activeSessionChatId,
        setActiveSessionChatId,
        activeGroupChatId,
        setActiveGroupChatId,
      }}
    >
      {children}
    </ChatActivityContext.Provider>
  );
};

export const useChatActivity = () => {
  const context = useContext(ChatActivityContext);
  if (!context) {
    throw new Error('useChatActivity must be used inside ChatActivityProvider');
  }
  return context;
};
