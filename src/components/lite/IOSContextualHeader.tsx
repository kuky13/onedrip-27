
import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IOSContextualHeaderEnhanced } from './enhanced/IOSContextualHeaderEnhanced';

interface IOSContextualHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightAction?: React.ReactNode;
  safeAreaTop?: number;
}

export const IOSContextualHeader = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  onRefresh,
  isRefreshing = false,
  rightAction,
  safeAreaTop = 0
}: IOSContextualHeaderProps) => {
  return (
    <IOSContextualHeaderEnhanced
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      onBack={onBack}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      rightAction={rightAction}
      safeAreaTop={safeAreaTop}
    />
  );
};
