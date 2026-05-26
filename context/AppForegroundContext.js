import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const AppForegroundContext = createContext(0);

export function AppForegroundProvider({ children }) {
  const [count, setCount] = useState(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        setCount(c => c + 1);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return (
    <AppForegroundContext.Provider value={count}>
      {children}
    </AppForegroundContext.Provider>
  );
}

export function useAppForeground(callback) {
  const count = useContext(AppForegroundContext);
  const isFirst = useRef(true);
  const callbackRef = useRef(callback);
  callbackRef.current = callback; // toujours la version la plus récente

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    callbackRef.current?.();
  }, [count]);
}
