import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { AdaptiveLayout } from '@/components/adaptive/AdaptiveLayout';
import { DashboardLiteContent } from '@/components/lite/DashboardLiteContent';
import { DashboardLiteStatsEnhanced } from '@/components/lite/enhanced/DashboardLiteStatsEnhanced';
import { DashboardLiteQuickAccessEnhanced } from '@/components/lite/enhanced/DashboardLiteQuickAccessEnhanced';
import { DashboardLiteLicenseStatus } from '@/components/lite/DashboardLiteLicenseStatus';
import { DashboardLiteHelpSupport } from '@/components/lite/DashboardLiteHelpSupport';
import { useResponsive } from '@/hooks/useResponsive';

import { BudgetErrorBoundary, AuthErrorBoundary } from '@/components/ErrorBoundaries';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { useBudgetData } from '@/hooks/useBudgetData';
import { PageTransition } from '@/components/ui/animations/page-transitions';
import { IOSSpinner } from '@/components/ui/animations/loading-states';

export const DashboardLite = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { profile, user, hasPermission } = useAuth();
  const { isDesktop } = useResponsive();
  
  // Memoização da verificação de iOS para evitar recálculos
  const isiOSDevice = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }, []);

  // Aguardar user e profile estarem disponíveis
  const isReady = useMemo(() => Boolean(user?.id && profile), [user?.id, profile]);

  // Hook para gerenciar dados dos orçamentos
  const { budgets, loading, error, refreshing, handleRefresh } = useBudgetData(user?.id || '');

  // Real-time subscription otimizada
  useEffect(() => {
    if (!isReady || !user?.id) return;

    // Subscription para atualizações em tempo real
    let subscription: any = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const setupSubscription = () => {
      subscription = supabase.channel('budget_changes_lite').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'budgets',
        filter: `owner_id=eq.${user.id}`
      }, payload => {
        console.log('Budget change detected:', payload);
        
        // Clear previous timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        // Debounce para evitar múltiplas chamadas
        debounceTimer = setTimeout(() => {
          handleRefresh();
          debounceTimer = null;
        }, 500);
      }).subscribe();
    };
    setupSubscription();
    
    return () => {
      // Clear debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Remove subscription properly
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isReady, user?.id, handleRefresh]);

  // Otimização para iOS: não renderizar nada até dados estarem prontos
  if (!isReady) {
    return (
      <div 
        className="h-[100dvh] bg-background flex items-center justify-center" 
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none'
        }}
      >
        <div className="text-center space-y-4">
          <IOSSpinner size="lg" />
          <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Memoização do conteúdo principal para evitar re-renders desnecessários
  const dashboardContent = useMemo(() => (
    <PageTransition type="fadeScale">
      <div className={`${isDesktop ? 'desktop-dashboard-layout' : 'p-4 space-y-6'}`}>
        <div className={`${isDesktop ? 'desktop-dashboard-main' : ''}`}>
          <DashboardLiteStatsEnhanced profile={profile} userId={user?.id} />
          <DashboardLiteQuickAccessEnhanced onTabChange={setActiveTab} hasPermission={hasPermission} />
        </div>
        {isDesktop && (
          <div className="desktop-dashboard-sidebar">
            <DashboardLiteLicenseStatus profile={profile} />
            <DashboardLiteHelpSupport />
          </div>
        )}
        {!isDesktop && (
          <>
            <DashboardLiteLicenseStatus profile={profile} />
            <DashboardLiteHelpSupport />
          </>
        )}
      </div>
    </PageTransition>
  ), [profile, user?.id, hasPermission, isDesktop])

  const renderContent = useCallback(() => {
    
    if (activeTab !== 'dashboard') {
      return (
        <PageTransition type="slideLeft" key={activeTab}>
          <DashboardLiteContent 
            budgets={budgets} 
            loading={loading} 
            error={error} 
            onRefresh={handleRefresh} 
            profile={profile} 
            activeView={activeTab} 
            userId={user.id} 
            hasPermission={hasPermission} 
            onNavigateBack={() => setActiveTab('dashboard')} 
            onNavigateTo={(view, budgetId) => {
              if (budgetId) {
                console.log('Navigate to budget detail:', budgetId);
              } else {
                setActiveTab(view);
              }
            }} 
            isiOSDevice={isiOSDevice} 
          />
        </PageTransition>
      );
    }
    return dashboardContent;
  }, [activeTab, budgets, loading, error, handleRefresh, profile, user.id, hasPermission, isiOSDevice, dashboardContent]);

  return (
    <AuthErrorBoundary>
      <AuthGuard>
        <BudgetErrorBoundary>
          <LayoutProvider>
            <AdaptiveLayout 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
            >
              {renderContent()}
            </AdaptiveLayout>
          </LayoutProvider>
        </BudgetErrorBoundary>
      </AuthGuard>
    </AuthErrorBoundary>
  );
};
