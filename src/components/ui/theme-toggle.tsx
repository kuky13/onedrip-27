
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useDeviceType } from "@/hooks/useDeviceType";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { type: deviceType } = useDeviceType();
  
  // Responsive sizing based on device
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  
  const containerClasses = isMobile 
    ? "relative inline-flex items-center rounded-3xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-2 border border-slate-200/60 dark:border-slate-700/60 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl"
    : isTablet
    ? "relative inline-flex items-center rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl"
    : "relative inline-flex items-center rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-1 border border-slate-200/60 dark:border-slate-700/60 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl";

  const sliderClasses = isMobile 
    ? `absolute top-2 h-12 w-12 bg-white dark:bg-slate-700 rounded-2xl shadow-md transform transition-all duration-300 ease-out ${
        theme === 'light' ? 'translate-x-0' : 'translate-x-14'
      }`
    : isTablet
    ? `absolute top-1.5 h-10 w-10 bg-white dark:bg-slate-700 rounded-xl shadow-md transform transition-all duration-300 ease-out ${
        theme === 'light' ? 'translate-x-0' : 'translate-x-12'
      }`
    : `absolute top-1 h-9 w-9 bg-white dark:bg-slate-700 rounded-xl shadow-md transform transition-all duration-300 ease-out ${
        theme === 'light' ? 'translate-x-0' : 'translate-x-10'
      }`;

  const buttonClasses = isMobile 
    ? "relative z-10 h-12 w-12 p-0 rounded-2xl transition-all duration-300 hover:scale-110 mobile-touch"
    : isTablet
    ? "relative z-10 h-10 w-10 p-0 rounded-xl transition-all duration-300 hover:scale-110"
    : "relative z-10 h-9 w-9 p-0 rounded-xl transition-all duration-300 hover:scale-110";

  const iconSize = isMobile ? 20 : isTablet ? 18 : 16;
  const gapClasses = isMobile ? "gap-2" : isTablet ? "gap-1.5" : "gap-1";

  return (
    <div className={containerClasses}>
      {/* Background slider with smooth animation */}
      <div className={sliderClasses} />
      
      <div className={`relative flex items-center ${gapClasses}`}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setTheme("light")} 
          className={`${buttonClasses} ${
            theme === 'light' 
              ? 'text-amber-600 hover:text-amber-700' 
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <Sun className={`h-${iconSize/4} w-${iconSize/4} transition-all duration-500 ease-out ${
            theme === 'light' ? 'rotate-0 scale-110' : 'rotate-90 scale-90'
          }`} style={{ width: iconSize, height: iconSize }} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setTheme("dark")} 
          className={`${buttonClasses} ${
            theme === 'dark' 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <Moon className={`h-${iconSize/4} w-${iconSize/4} transition-all duration-500 ease-out ${
            theme === 'dark' ? 'rotate-0 scale-110' : '-rotate-90 scale-90'
          }`} style={{ width: iconSize, height: iconSize }} />
        </Button>
      </div>
    </div>
  );
}
