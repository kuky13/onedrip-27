import React from 'react';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertTriangle } from 'lucide-react';
export const GameConfigDisplay: React.FC = () => {
  const {
    profile
  } = useAuth();
  const {
    settings,
    isLoading
  } = useGameSettings();

  // Só mostrar para admins
  if (!profile || profile.role !== 'admin' || isLoading || !settings) {
    return null;
  }
  return;
};