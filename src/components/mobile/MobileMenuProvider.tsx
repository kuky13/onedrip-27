import React, { createContext, useContext } from 'react';
import { useMobileMenu } from '@/hooks/useMobileMenu';

interface MobileMenuContextType {
  isOpen: boolean;
  menuData: {
    items: Array<{
      id: string;
      label: string;
      icon: string;
      permission?: string;
      action?: () => void;
    }>;
    userInfo: {
      name: string;
      email: string;
      role: string;
    } | null;
  };
  isLoading: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  handleLogout: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const MobileMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const mobileMenuState = useMobileMenu();

  return (
    <MobileMenuContext.Provider value={mobileMenuState}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenuContext = () => {
  const context = useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error('useMobileMenuContext must be used within a MobileMenuProvider');
  }
  return context;
};