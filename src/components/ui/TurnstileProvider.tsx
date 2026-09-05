import React, { createContext, useContext, ReactNode, useCallback } from 'react';

interface TurnstileContextType {
  getToken: () => Promise<string | undefined>;
}

const TurnstileContext = createContext<TurnstileContextType | null>(null);

export const useTurnstile = () => {
  const ctx = useContext(TurnstileContext);
  if (!ctx) throw new Error('useTurnstile must be used within TurnstileProvider');
  return ctx;
};

export const TurnstileProvider = ({ children }: { children: ReactNode }) => {
  // On Native Android/iOS, Turnstile web widget is not supported.
  // We return undefined or a dummy token. If the backend requires it,
  // we would need a native WebView implementation of Turnstile.
  // For now, we bypass it.
  const getToken = useCallback(async (): Promise<string | undefined> => {
    return undefined; // or 'dummy-token' depending on backend strictness
  }, []);

  return (
    <TurnstileContext.Provider value={{ getToken }}>
      {children}
    </TurnstileContext.Provider>
  );
};
