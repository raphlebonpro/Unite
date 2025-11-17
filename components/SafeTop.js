// components/SafeTop.js
import React, { createContext, useContext } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeTopContext = createContext(0);
export const useSafeTop = () => useContext(SafeTopContext);

export default function SafeTop({ children }) {
  const insets = useSafeAreaInsets();

  // iOS : applique paddingTop (notch)
  // Android : laisse 0 (géré par MiniAppBar)
  const topInset = Platform.OS === 'ios' ? insets.top : 0;

  return (
    <SafeTopContext.Provider value={topInset}>
      <View style={{ flex: 1, paddingTop: topInset, backgroundColor: '#fff' }}>
        {children}
      </View>
    </SafeTopContext.Provider>
  );
}
