import React, { useEffect } from 'react';
import { X, LogOut, Search, User } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm",
          "transition-opacity duration-300 ease-out",
          "md:hidden"
        )}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-50 w-80 max-w-[85vw]",
          "h-[100dvh] bg-background border-r border-border",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col shadow-xl",
          "ios-momentum-scroll ios-tap-highlight-none",
          "md:hidden",
          isOpen ? "translate-x-0" : "translate-x-[-100%]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 hover:bg-accent/50 touch-manipulation ios-tap-highlight-none"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Profile Section */}
        {menuData.userInfo && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {menuData.userInfo.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {menuData.userInfo.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Role: {menuData.userInfo.role}
                </p>
              </div>
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
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background border-border ios-tap-highlight-none"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-2">
            {filteredItems.map((item) => {
              const IconComponent = getIconComponent(item.icon);
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 px-4 mb-1",
                    "hover:bg-accent/50 active:bg-accent/30",
                    "transition-colors duration-200",
                    "touch-manipulation ios-tap-highlight-none"
                  )}
                  onClick={() => handleTabChange(item.id)}
                >
                  <IconComponent className="h-5 w-5 mr-3 shrink-0" />
                  <span className="text-left truncate">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-12 px-4",
              "text-destructive hover:text-destructive",
              "hover:bg-destructive/5 active:bg-destructive/10",
              "transition-colors duration-200",
              "touch-manipulation ios-tap-highlight-none"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
};