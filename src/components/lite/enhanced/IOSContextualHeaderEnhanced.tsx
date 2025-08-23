import React, { useState, useRef } from 'react';
import { ArrowLeft, RefreshCw, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RippleButton } from '@/components/ui/animations/micro-interactions';
interface IOSContextualHeaderEnhancedProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightAction?: React.ReactNode;
  showSearch?: boolean;
  onSearchToggle?: () => void;
  searchActive?: boolean;
  safeAreaTop?: number;
  blur?: boolean;
  // Search functionality
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
  isSearching?: boolean;
}
export const IOSContextualHeaderEnhanced = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  onRefresh,
  isRefreshing = false,
  rightAction,
  showSearch = false,
  onSearchToggle,
  searchActive = false,
  safeAreaTop = 0,
  blur = true,
  // Search props
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  searchPlaceholder = 'Buscar...',
  isSearching = false
}: IOSContextualHeaderEnhancedProps) => {
  const [internalSearchValue, setInternalSearchValue] = useState(searchValue);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle internal search state
  const currentSearchValue = onSearchChange ? searchValue : internalSearchValue;
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchValue(value);
    }
  };
  const handleSearchSubmit = () => {
    const value = currentSearchValue.trim();
    if (value && onSearchSubmit) {
      onSearchSubmit(value);
    }
  };
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };
  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    } else {
      setInternalSearchValue('');
    }
    if (onSearchClear) {
      onSearchClear();
    }
    searchInputRef.current?.focus();
  };

  // Focus input when search becomes active
  React.useEffect(() => {
    if (searchActive && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [searchActive]);
  return <motion.div className={cn("sticky top-0 z-30 border-b border-border/30 transition-all duration-300", blur ? "bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60" : "bg-background")} style={{
    paddingTop: `max(${safeAreaTop}px, 12px)`
  }} initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3
  }}>
      {/* Main header content */}
      <div className="px-6 py-5 bg-gradient-to-r from-background/95 via-background/98 to-background/95">
        <div className="flex items-center justify-between gap-4 relative">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl" />
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {showBackButton && onBack && <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} transition={{
              duration: 0.2
            }}>
                  <RippleButton onClick={onBack} className="w-10 h-10 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/50 flex items-center justify-center" variant="ghost">
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                  </RippleButton>
                </motion.div>}
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              {!searchActive ? <motion.div className="flex-1 min-w-0" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} transition={{
              duration: 0.2
            }}>
                  <motion.h1 className="text-xl font-bold text-foreground truncate" layoutId="header-title">
                    {title}
                  </motion.h1>
                  {subtitle && <motion.p className="text-sm text-muted-foreground truncate" initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.1
              }}>
                      {subtitle}
                    </motion.p>}
                </motion.div> : <motion.div className="flex-1" initial={{
              opacity: 0,
              scale: 0.9
            }} animate={{
              opacity: 1,
              scale: 1
            }} exit={{
              opacity: 0,
              scale: 0.9
            }} transition={{
              duration: 0.2
            }}>
                  <div className="relative">
                    <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors", isSearching ? "text-primary animate-pulse" : "text-muted-foreground")} />
                    <input ref={searchInputRef} type="search" inputMode="search" placeholder={searchPlaceholder} value={currentSearchValue} onChange={handleSearchInputChange} onKeyPress={handleSearchKeyPress} className={cn("w-full pl-10 py-2 bg-muted/30 border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all", currentSearchValue.trim() ? "pr-20" : "pr-12")} disabled={isSearching} />
                    
                    {/* Clear button - shows when there's text */}
                    <AnimatePresence>
                      {currentSearchValue.trim()}
                    </AnimatePresence>
                    
                    {/* Search button */}
                    
                  </div>
                </motion.div>}
            </AnimatePresence>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showSearch && <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
                <RippleButton onClick={onSearchToggle} className={cn("w-10 h-10 rounded-full border border-border/50 flex items-center justify-center transition-all duration-200", searchActive ? "bg-primary/20 border-primary/30" : "bg-muted/30 hover:bg-muted/50")} variant="ghost">
                  <Search className={cn("h-5 w-5 transition-colors", searchActive ? "text-primary" : "text-foreground")} />
                </RippleButton>
              </motion.div>}
            
            {onRefresh && <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
                <RippleButton onClick={onRefresh} disabled={isRefreshing} className={cn("w-10 h-10 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/50 flex items-center justify-center transition-all duration-200", isRefreshing && "opacity-75 cursor-not-allowed")} variant="ghost">
                  <RefreshCw className={cn("h-5 w-5 text-foreground transition-transform duration-200", isRefreshing && "animate-spin")} />
                </RippleButton>
              </motion.div>}
            
            {rightAction}
          </div>
        </div>
      </div>
      
      {/* Progress bar for loading states */}
      <AnimatePresence>
        {isRefreshing && <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20" initial={{
        scaleX: 0
      }} animate={{
        scaleX: 1
      }} exit={{
        scaleX: 0
      }} transition={{
        duration: 0.3
      }}>
            <motion.div className="h-full bg-primary rounded-full" animate={{
          x: ['-100%', '100%']
        }} transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }} />
          </motion.div>}
      </AnimatePresence>
    </motion.div>;
};