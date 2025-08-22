
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, parseISO } from 'date-fns';
import { CreditCard, MessageCircle, HeartCrack, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LicenseStatus = () => {
  // Component removed - license status now handled by license system only
  return null;
};
