
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Users, CreditCard, Settings, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileQuickAccessProps {
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export const MobileQuickAccess = ({ onTabChange, activeTab }: MobileQuickAccessProps) => {
  const { hasPermission } = useAuth();
  const { currentBreakpoint, isLandscape, isCompactHeight } = useResponsive();
  const screenSize = currentBreakpoint;
  const orientation = isLandscape ? 'landscape' : 'portrait';
  const density = isCompactHeight ? 'compact' : 'comfortable';
  const [isVisible, setIsVisible] = useState(true);

  const quickActions = [
    { 
      id: 'new-budget', 
      label: 'Novo Orçamento', 
      icon: Plus, 
      color: 'bg-primary text-primary-foreground',
      permission: null,
      priority: 1
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      color: 'bg-blue-500 text-white',
      permission: 'analytics',
      priority: 2
    },
    { 
      id: 'customers', 
      label: 'Clientes', 
      icon: Users, 
      color: 'bg-green-500 text-white',
      permission: 'customers',
      priority: 3
    },
    { 
      id: 'billing', 
      label: 'Cobrança', 
      icon: CreditCard, 
      color: 'bg-orange-500 text-white',
      permission: 'billing',
      priority: 4
    },
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: Settings, 
      color: 'bg-gray-500 text-white',
      permission: null,
      priority: 5
    },
    { 
      id: 'help', 
      label: 'Ajuda', 
      icon: HelpCircle, 
      color: 'bg-purple-500 text-white',
      permission: null,
      priority: 6
    }
  ];

  const visibleActions = quickActions
    .filter(action => !action.permission || hasPermission(action.permission))
    .sort((a, b) => a.priority - b.priority);

  // Adaptive grid columns based on screen size and orientation
  const getGridCols = () => {
    if (screenSize === 'xs') return 'grid-cols-2';
    if (screenSize === 'sm') return orientation === 'landscape' ? 'grid-cols-4' : 'grid-cols-3';
    if (density === 'compact') return 'grid-cols-4';
    if (density === 'comfortable') return 'grid-cols-3';
    return 'grid-cols-3';
  };

  // Adaptive button size based on density and screen size
  const getButtonSize = () => {
    if (screenSize === 'xs') return 'h-16';
    if (density === 'compact') return 'h-16';
    if (density === 'comfortable') return 'h-20';
    return 'h-18';
  };

  // Adaptive text size
  const getTextSize = () => {
    if (screenSize === 'xs') return 'text-xs';
    if (density === 'compact') return 'text-xs';
    return 'text-sm';
  };

  // Adaptive icon size
  const getIconSize = () => {
    if (screenSize === 'xs') return 'h-4 w-4';
    if (density === 'compact') return 'h-5 w-5';
    return 'h-6 w-6';
  };

  // Handle scroll to show/hide on mobile
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (isScrollingDown && currentScrollY > 100) {
        setIsVisible(false);
      } else if (!isScrollingDown) {
        setIsVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={cn(
            "p-3 sm:p-4 space-y-3 sm:space-y-4 bg-background/95 backdrop-blur-sm",
            "border-b border-border/50"
          )}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h2 
            className={cn(
              "font-semibold text-foreground",
              screenSize === 'xs' ? 'text-base' : 'text-lg'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Acesso Rápido
          </motion.h2>
          
          <motion.div 
            className={cn(
              "grid gap-2 sm:gap-3",
              getGridCols()
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {visibleActions.map((action, index) => {
              const Icon = action.icon;
              const isActive = activeTab === action.id;
              
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => onTabChange(action.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4",
                      "transition-all duration-300 hover:shadow-lg active:scale-95",
                      getButtonSize(),
                      isActive 
                        ? cn(action.color, "shadow-lg scale-105 border-transparent") 
                        : "hover:bg-accent hover:border-primary/50 border-border",
                      "border-2 rounded-xl"
                    )}
                  >
                    <Icon className={cn(
                      "transition-all duration-300",
                      getIconSize(),
                      isActive && "drop-shadow-sm"
                    )} />
                    <span className={cn(
                      "text-center font-medium leading-tight transition-all duration-300",
                      getTextSize(),
                      isActive && "drop-shadow-sm"
                    )}>
                      {action.label}
                    </span>
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
