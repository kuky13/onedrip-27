import React, { useEffect } from 'react';
import { X, LogOut, Search, User, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  permission?: string;
  action?: () => void;
}

interface MenuData {
  items: MenuItem[];
  userInfo: {
    name: string;
    email: string;
    role: string;
  } | null;
}

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  menuData: MenuData;
  onLogout: () => void;
}

export const MobileHamburgerMenu = ({ 
  isOpen, 
  onClose, 
  onTabChange, 
  menuData,
  onLogout 
}: MobileHamburgerMenuProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // iOS-style swipe to close gesture
  useSwipeGesture({
    onSwipeLeft: () => {
      if (isOpen) {
        onClose();
      }
    },
    threshold: 50,
    preventScrollOnSwipe: true
  });

  // Handle body scroll lock when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
  };

  // Dynamic icon component resolver
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Circle;
  };

  // Filter items based on search
  const filteredItems = menuData.items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              "fixed inset-0 z-40 bg-black/60 backdrop-blur-md",
              "md:hidden"
            )}
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div 
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              opacity: { duration: 0.2 }
            }}
            className={cn(
              "fixed top-0 left-0 z-50 w-80 max-w-[85vw]",
              "h-[100dvh] bg-gradient-to-br from-white via-gray-50 to-gray-100",
              "dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
              "border-r border-gray-200/50 dark:border-gray-700/50",
              "flex flex-col shadow-2xl backdrop-blur-xl",
              "ios-momentum-scroll ios-tap-highlight-none",
              "md:hidden"
            )}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Menu</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105 touch-manipulation ios-tap-highlight-none"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>

            {/* User Profile Section */}
            {menuData.userInfo && (
              <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60">
                <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100/50 dark:border-blue-800/30">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-lg">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {menuData.userInfo.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {menuData.userInfo.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <Input
                  type="search"
                  inputMode="search"
                  placeholder="Buscar menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 ios-tap-highlight-none"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-6">
              <nav className="space-y-3">
                {filteredItems.map((item, index) => {
                  const IconComponent = getIconComponent(item.icon);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-14 px-5 text-left font-medium transition-all duration-200 group",
                          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
                          "hover:border-blue-200/50 dark:hover:border-blue-700/50 rounded-xl border border-transparent",
                          "focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50 dark:focus:from-blue-900/20 dark:focus:to-purple-900/20",
                          "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                          "touch-manipulation ios-tap-highlight-none"
                        )}
                        onClick={() => handleTabChange(item.id)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mr-4 group-hover:from-blue-100 group-hover:to-purple-100 dark:group-hover:from-blue-800 dark:group-hover:to-purple-800 transition-all duration-200">
                          <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 shrink-0" />
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white font-medium transition-colors duration-200 truncate">{item.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-200 group-hover:translate-x-1" />
                      </Button>
                    </motion.div>
                  );
                })}
              </nav>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-14 px-5 text-red-600 border-red-200/60 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-300/60 dark:text-red-400 dark:border-red-800/60 dark:hover:from-red-900/20 dark:hover:to-red-800/20 rounded-xl transition-all duration-200 hover:shadow-md group border border-transparent",
                  "touch-manipulation ios-tap-highlight-none"
                )}
                onClick={handleLogout}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 mr-4 group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-all duration-200">
                  <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-medium">Sair da conta</span>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};