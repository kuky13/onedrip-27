import React from 'react';
import { PlusCircle, List, Settings, Shield, Database, Users, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, RippleButton } from '@/components/ui/animations/micro-interactions';
import { StaggerContainer } from '@/components/ui/animations/page-transitions';
import { PWAInstallButton } from '@/components/lite/PWAInstallButton';

interface DashboardLiteQuickAccessEnhancedProps {
  onTabChange: (tab: string) => void;
  hasPermission: (permission: string) => boolean;
}

interface QuickAccessAction {
  id: string;
  label: string;
  icon: typeof PlusCircle;
  tab: string;
  permission: string | null;
  gradient: string;
  iconColor: string;
}

const quickAccessActions: QuickAccessAction[] = [{
  id: 'new-budget',
  label: 'Novo Orçamento',
  icon: PlusCircle,
  tab: 'new-budget',
  permission: 'create_budgets',
  gradient: 'from-green-500 to-emerald-500',
  iconColor: 'text-green-600'
}, {
  id: 'budgets',
  label: 'Ver Orçamentos',
  icon: List,
  tab: 'budgets',
  permission: 'view_own_budgets',
  gradient: 'from-blue-500 to-cyan-500',
  iconColor: 'text-blue-600'
}, {
  id: 'service-orders',
  label: 'Ordens de Serviço VIP',
  icon: Wrench,
  tab: 'service-orders',
  permission: null,
  gradient: 'from-amber-500 to-yellow-500',
  iconColor: 'text-amber-600'
}, {
  id: 'clients',
  label: 'Clientes',
  icon: Users,
  tab: 'clients',
  permission: null,
  gradient: 'from-purple-500 to-indigo-500',
  iconColor: 'text-purple-600'
}, {
  id: 'data-management',
  label: 'Lixeira',
  icon: Database,
  tab: 'data-management',
  permission: null,
  gradient: 'from-orange-500 to-red-500',
  iconColor: 'text-orange-600'
}, {
  id: 'settings',
  label: 'Configurações',
  icon: Settings,
  tab: 'settings',
  permission: null,
  gradient: 'from-gray-500 to-slate-500',
  iconColor: 'text-gray-600'
}, {
  id: 'admin',
  label: 'Painel Admin',
  icon: Shield,
  tab: 'admin',
  permission: 'manage_users',
  gradient: 'from-red-500 to-pink-500',
  iconColor: 'text-red-600'
}];

export const DashboardLiteQuickAccessEnhanced = ({
  onTabChange,
  hasPermission
}: DashboardLiteQuickAccessEnhancedProps) => {
  const navigate = useNavigate();
  
  const handleActionClick = (action: QuickAccessAction) => {
    if (action.id === 'service-orders') {
      navigate('/service-orders');
    } else {
      onTabChange(action.tab);
    }
  };

  const availableActions = quickAccessActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <GlassCard className="p-6 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            Acesso Rápido
          </h3>
          <PWAInstallButton />
        </div>
        
        <StaggerContainer className="grid grid-cols-2 gap-4">
          {availableActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RippleButton
                  onClick={() => handleActionClick(action)}
                  className="w-full h-24 bg-gradient-to-br from-background/50 to-background/20 border border-border/50 rounded-2xl hover:border-border/80 transition-all duration-300 relative overflow-hidden group"
                  variant="ghost"
                >
                  {/* Background gradient effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
                    <div className="w-10 h-10 bg-muted/30 rounded-2xl flex items-center justify-center group-hover:bg-muted/50 transition-colors">
                      <Icon className={`h-5 w-5 ${action.iconColor} group-hover:scale-110 transition-transform duration-200`} />
                    </div>
                    
                    <span className="text-sm font-medium text-center leading-tight text-foreground group-hover:text-foreground/90">
                      {action.label}
                    </span>
                  </div>
                  
                  {/* Subtle shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </RippleButton>
              </motion.div>
            );
          })}
        </StaggerContainer>
      </motion.div>
    </GlassCard>
  );
};