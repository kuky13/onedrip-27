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
              damping: 25, 
              stiffness: 300,
              duration: 0.3
            }}
            className={cn(
              "fixed top-0 left-0 z-50 w-80 max-w-[85vw]",
              "h-[100dvh] bg-background",
              "border-r border-border",
              "flex flex-col shadow-strong",
              "ios-momentum-scroll ios-tap-highlight-none",
              "md:hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <div className="w-4 h-4 bg-primary-foreground rounded-sm" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Menu</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-lg hover:bg-secondary transition-colors touch-manipulation ios-tap-highlight-none"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Profile Section */}
            {menuData.userInfo && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {menuData.userInfo.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {menuData.userInfo.email}
                    </p>
                    <div className="flex items-center mt-0.5">
                      <div className="w-1.5 h-1.5 bg-success rounded-full mr-1.5" />
                      <span className="text-xs text-success font-medium">Online</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  inputMode="search"
                  placeholder="Buscar menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 bg-input border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors ios-tap-highlight-none"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-1">
                {filteredItems.map((item, index) => {
                  const IconComponent = getIconComponent(item.icon);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-12 px-3 text-left font-medium transition-colors group",
                          "hover:bg-secondary rounded-lg",
                          "touch-manipulation ios-tap-highlight-none"
                        )}
                        onClick={() => handleTabChange(item.id)}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary mr-3 group-hover:bg-primary transition-colors">
                          <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground transition-colors shrink-0" />
                        </div>
                        <span className="text-foreground group-hover:text-foreground font-medium truncate">{item.label}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-60" />
                      </Button>
                    </motion.div>
                  );
                })}
              </nav>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-card/50">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 px-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors group",
                  "touch-manipulation ios-tap-highlight-none"
                )}
                onClick={handleLogout}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10 mr-3 group-hover:bg-destructive/20 transition-colors">
                  <LogOut className="h-4 w-4 text-destructive" />
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