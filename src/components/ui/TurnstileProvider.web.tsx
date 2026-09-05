import React, { createContext, useContext, useRef, ReactNode, useState, useCallback } from 'react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

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
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const queueRef = useRef<Array<(token: string) => void>>([]);
  const isProcessingRef = useRef(false);
  const [isActive, setIsActive] = useState(false);

  const siteKey = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

  const processQueue = useCallback(() => {
    if (!turnstileRef.current) return;
    if (queueRef.current.length === 0) {
      setIsActive(false);
      isProcessingRef.current = false;
      return;
    }
    
    setIsActive(true);
    isProcessingRef.current = true;
    turnstileRef.current.reset();
    turnstileRef.current.execute();
  }, []);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!siteKey) {
      console.warn('EXPO_PUBLIC_TURNSTILE_SITE_KEY is not set. Using dummy token.');
      return 'dummy-token';
    }

    if (!turnstileRef.current) {
      console.error('Turnstile widget is not ready.');
      return undefined;
    }

    return new Promise<string>((resolve) => {
      queueRef.current.push(resolve);
      if (!isProcessingRef.current) {
        processQueue();
      }
    });
  }, [siteKey, processQueue]);

  return (
    <TurnstileContext.Provider value={{ getToken }}>
      {children}
      {siteKey && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            display: isActive ? 'flex' : 'none', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99999 
          }}
        >
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            options={{ 
              action: 'submit',
              execution: 'execute'
            }}
            onSuccess={(token) => {
              const resolve = queueRef.current.shift();
              if (resolve) resolve(token);
              // Process next in queue after a tiny delay
              setTimeout(processQueue, 100);
            }}
            onError={(err) => {
              console.error('Turnstile widget error:', err);
              const resolve = queueRef.current.shift();
              if (resolve) resolve(''); // return empty to fail validation
              // Process next in queue after a tiny delay
              setTimeout(processQueue, 100);
            }}
          />
        </div>
      )}
    </TurnstileContext.Provider>
  );
};
