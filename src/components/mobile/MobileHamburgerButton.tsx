import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileHamburgerButton = ({ 
  isOpen, 
  onClick, 
  className 
}: MobileHamburgerButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-11 w-11 relative flex md:hidden",
        "touch-manipulation select-none ios-tap-highlight-none ios-touch-callout-none",
        "transition-all duration-200 ease-out",
        "hover:bg-accent/50 active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
      aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      aria-expanded={isOpen}
    >
      {/* Hamburger Icon with Animation */}
      <div className="relative w-5 h-5 flex flex-col justify-center items-center">
        <span 
          className={cn(
            "block w-5 h-0.5 bg-current rounded-full",
            "transition-all duration-300 ease-out",
            "transform origin-center",
            isOpen ? "rotate-45 translate-y-0.5" : "translate-y-[-2px]"
          )}
        />
        <span 
          className={cn(
            "block w-5 h-0.5 bg-current rounded-full mt-1",
            "transition-all duration-300 ease-out",
            isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
          )}
        />
        <span 
          className={cn(
            "block w-5 h-0.5 bg-current rounded-full mt-1",
            "transition-all duration-300 ease-out",
            "transform origin-center",
            isOpen ? "-rotate-45 translate-y-[-2px]" : "translate-y-0"
          )}
        />
      </div>
    </Button>
  );
};