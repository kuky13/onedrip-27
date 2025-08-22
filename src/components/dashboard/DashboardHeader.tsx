
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, Command } from 'lucide-react';
import { UserProfile } from './types';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

interface DashboardHeaderProps {
  profile: UserProfile | null;
  weeklyGrowth: number;
  onOpenCommandPalette?: () => void;
}

export const DashboardHeader = ({ profile, weeklyGrowth, onOpenCommandPalette }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
      <div className="animate-slide-up">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{getGreeting()}, {profile?.name || 'usuário'}!</h1>
        <div className="flex items-center space-x-3 mt-2">
          <p className="text-base lg:text-lg text-muted-foreground">
            Seja bem-vindo(a) de volta!
          </p>
          {profile && (
            <Badge variant="secondary" className="bg-[#fec832]/20 text-[#fec832] border-none text-xs font-semibold py-1 px-3 rounded-full">
              {profile.role.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {/* Botão de busca rápida */}
        <Button
          variant="outline"
          onClick={onOpenCommandPalette}
          className="glass-card border-border/50 hover:bg-accent/50 transition-all duration-200 group"
        >
          <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Busca rápida</span>
          <div className="ml-2 px-1.5 py-0.5 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
            Ctrl+K
          </div>
        </Button>
        
        {/* Estatística semanal */}
        <div className="flex items-center space-x-3 text-sm text-muted-foreground glass-card p-3 px-4 rounded-full border-none shadow-soft animate-scale-in">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <span className="font-medium text-foreground/90">{weeklyGrowth || 0} orçamentos esta semana</span>
        </div>
      </div>
    </div>
  );
};
