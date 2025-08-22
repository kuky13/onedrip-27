/**
 * Bottom Navigation - OneDrip Mobile
 * Navegação inferior otimizada para mobile
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  Search
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Painel',
    icon: Home,
    path: '/painel'
  },
  {
    id: 'add',
    label: 'Novo',
    icon: Plus,
    path: '/painel'
  },
  {
    id: 'service-orders',
    label: 'O.S.',
    icon: FileText,
    path: '/service-orders'
  },
  {
    id: 'notifications',
    label: 'Msgs',
    icon: BarChart3,
    path: '/msg'
  }
];

interface BottomNavigationProps {
  className?: string;
  onNewBudget?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  className,
  onNewBudget
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = React.useState('dashboard');

  React.useEffect(() => {
    const currentPath = location.pathname;
    const activeNav = navItems.find(item => 
      currentPath === item.path || 
      (item.path !== '/painel' && currentPath.startsWith(item.path))
    );
    
    if (activeNav) {
      setActiveItem(activeNav.id);
    }
  }, [location.pathname]);

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'add') {
      onNewBudget?.();
      return;
    }
    
    setActiveItem(item.id);
    navigate(item.path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-xl border-t border-border/50',
        'safe-area-pb', // Para dispositivos com notch
        className
      )}
    >
      {/* Indicador de conexão */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-1 bg-border rounded-full" />
      </div>

      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const isCenter = item.id === 'add';

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[60px] py-2 px-3 rounded-2xl',
                'transition-all duration-300',
                isCenter && 'bg-primary text-primary-foreground shadow-lg scale-110',
                !isCenter && isActive && 'bg-primary/10 text-primary',
                !isCenter && !isActive && 'text-muted-foreground hover:text-foreground'
              )}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: isCenter ? 1.15 : 1.05 }}
            >
              {/* Badge de notificação */}
              {item.badge && item.badge > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </motion.div>
              )}

              {/* Ícone */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  rotate: isCenter && isActive ? 45 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Icon 
                  className={cn(
                    'w-6 h-6 mb-1',
                    isCenter && 'w-7 h-7'
                  )} 
                />
              </motion.div>

              {/* Label */}
              <span 
                className={cn(
                  'text-xs font-medium leading-none',
                  isCenter && 'text-xs'
                )}
              >
                {item.label}
              </span>

              {/* Indicador ativo */}
              <AnimatePresence>
                {isActive && !isCenter && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Área segura para dispositivos com home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </motion.nav>
  );
};

// Hook para detectar se deve mostrar bottom navigation
export const useBottomNavigation = () => {
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      const isTouch = 'ontouchstart' in window;
      setShouldShow(isMobile && isTouch);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return shouldShow;
};

// Componente de espaçamento para compensar a bottom navigation
export const BottomNavigationSpacer: React.FC = () => (
  <div className="h-20 md:h-0" /> // 80px de altura para compensar a nav
);