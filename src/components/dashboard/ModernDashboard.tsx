import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedDashboard } from '@/components/dashboard/EnhancedDashboard';
import { Sparkles, ShoppingBag, CreditCard, MessageCircle, HeartCrack, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LicenseStatus } from '@/components/dashboard/LicenseStatus';
import { useLicenseNotifications } from '@/hooks/useLicenseNotifications';

interface ModernDashboardProps {
  onNavigateTo?: (view: string, budgetId?: string) => void;
  activeView?: string;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = (props) => {
  return <EnhancedDashboard {...props} />;
};
