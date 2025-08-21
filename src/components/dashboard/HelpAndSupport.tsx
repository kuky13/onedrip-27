import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpSystem } from '@/components/help/HelpSystem';
import { LifeBuoy, MessageCircle, Sparkles } from 'lucide-react';
import { openWhatsApp } from '@/utils/whatsappUtils';

export const HelpAndSupport = () => {
  const [isHelpSystemOpen, setHelpSystemOpen] = useState(false);

  return (
    <>
      <Card className="glass-card border-0 shadow-lg animate-slide-up bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <CardHeader className="p-4 lg:p-6 pb-3">
          <CardTitle className="text-lg lg:text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Central de Ajuda
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4 lg:p-6 pt-0">
          <Button 
            onClick={() => setHelpSystemOpen(true)} 
            className="w-full sm:w-auto gap-2"
          >
            <LifeBuoy className="h-4 w-4" />
           Ajuda
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => openWhatsApp('https://wa.me/556496028022')} 
            className="relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
          >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Icon and text */}
            <MessageCircle className="h-4 w-4 mr-2 relative z-10" />
            <span className="relative z-10 font-semibold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-emerald-700 dark:group-hover:from-green-300 dark:group-hover:to-emerald-300 transition-all duration-300">
              WhatsApp
            </span>
            
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 skew-x-12" />
          </Button>
        </CardContent>
      </Card>
      
      <HelpSystem />
    </>
  );
};