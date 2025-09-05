import React, { createContext, useContext, useEffect } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';

const PresenceContext = createContext({});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const presence = usePresence();
  
  // The usePresence hook handles all the presence logic internally
  // This provider just ensures it's always active when user is authenticated
  
  return (
    <PresenceContext.Provider value={{}}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresenceContext = () => useContext(PresenceContext);