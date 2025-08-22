import React, { createContext, useContext, ReactNode } from 'react';
import { usePWA } from '@/hooks/usePWA';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAUpdateNotification from './PWAUpdateNotification';
import PWAOfflineIndicator from './PWAOfflineIndicator';
import PWAStatusIndicator from './PWAStatusIndicator';

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  platform: 'web' | 'ios' | 'android' | 'standalone';
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  shareApp: () => Promise<boolean>;
  refreshApp: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const pwaData = usePWA();

  return (
    <PWAContext.Provider value={pwaData}>
      {children}
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <PWAOfflineIndicator />
      <PWAStatusIndicator />
    </PWAContext.Provider>
  );
};

export default PWAProvider;