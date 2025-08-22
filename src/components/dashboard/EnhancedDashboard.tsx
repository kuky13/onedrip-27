import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
// Componentes de licença removidos - funcionalidade integrada ao sistema de licenças
import { useIOSDetection } from '@/hooks/useIOSDetection';
import { LicenseStatus } from '@/components/dashboard/LicenseStatus';
import { LicenseStatusCard } from '@/components/license/LicenseStatusCard';
import { 
  Sparkles, 
  ShoppingBag, 
  CreditCard, 
  MessageCircle, 
  HeartCrack, 
  AlertTriangle, 
  Shield, 
  Search,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Activity,
  ChevronRight,
  Plus,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLicenseNotifications } from '@/hooks/useLicenseNotifications';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModernDashboardProps {
  onNavigateTo?: (view: string, budgetId?: string) => void;
  activeView?: string;
}

export const EnhancedDashboard = ({ onNavigateTo, activeView }: ModernDashboardProps) => {
  const { profile } = useAuth();
  const isIOS = useIOSDetection();
  useLicenseNotifications();

  const [budgets, setBudgets] = useState<Array<{
    id: string;
    client_name: string;
    created_at: string;
    total_price: number;
  }>>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Configurar atalhos de teclado
  const { getDefaultShortcuts } = useKeyboardShortcuts({
    shortcuts: [],
    isEnabled: true
  });

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!profile?.id) return;

      setBudgetsLoading(true);
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('id, client_name, created_at, total_price')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recent budgets:', error);
          setBudgets([]);
        } else {
          setBudgets(data || []);
        }
      } catch (error) {
        console.error('Error fetching recent budgets:', error);
        setBudgets([]);
      } finally {
        setBudgetsLoading(false);
      }
    };

    fetchBudgets();
  }, [profile?.id]);

  // Animation variants for desktop
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-6 py-8">
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Modern Desktop Header */}
            <motion.div 
              className="flex items-center justify-between"
              variants={itemVariants}
            >
              <div className="space-y-2">
                <motion.h1 
                  className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Olá, {profile?.name || 'Usuário'}! 👋
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground text-xl font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Painel Executivo • Desktop Mode
                </motion.p>
              </div>
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="group relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Search className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">Busca Rápida</span>
                    <div className="ml-3 px-3 py-1 bg-muted/80 rounded-md text-xs font-mono border border-border/50">
                      Ctrl+K
                    </div>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Premium Stats Dashboard */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
              variants={itemVariants}
            >
              {/* Revenue Card */}
              <motion.div 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border border-green-200/50 dark:border-green-800/30 p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      +12.5%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Receita Total</h3>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">R$ 24.567</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Últimos 30 dias
                  </div>
                </div>
              </motion.div>

              {/* Clients Card */}
              <motion.div 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold">
                      <Users className="h-4 w-4" />
                      +8 novos
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Clientes Ativos</h3>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">147</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Este mês
                  </div>
                </div>
              </motion.div>

              {/* Orders Card */}
              <motion.div 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold">
                      <FileText className="h-4 w-4" />
                      23 pendentes
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">Orçamentos</h3>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">89</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    Últimos 7 dias
                  </div>
                </div>
              </motion.div>

              {/* Performance Card */}
              <motion.div 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-200/50 dark:border-orange-800/30 p-6 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1 font-semibold">
                      <Target className="h-4 w-4" />
                      R$ 7.433 restantes
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300">Meta Mensal</h3>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">78%</p>
                    </div>
                    <div className="w-full bg-orange-200/50 dark:bg-orange-900/30 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '78%' }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Modern Horizontal Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Main Content Area - Takes up more space */}
              <div className="xl:col-span-8 space-y-8">
                {/* Recent Budgets Section */}
                <motion.div 
                  className="relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-lg"
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Orçamentos Recentes
                        </h3>
                        <p className="text-muted-foreground">Seus últimos orçamentos criados</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => onNavigateTo?.('budgets')}
                        className="group border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                      >
                        Ver Todos
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {budgetsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                        </div>
                      ) : budgets && budgets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {budgets.map((budget, index) => (
                            <motion.div 
                              key={budget.id}
                              className="group relative overflow-hidden rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 p-5 cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                              whileHover={{ scale: 1.02, y: -2 }}
                              onClick={() => onNavigateTo?.('budget-details', budget.id)}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="relative space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <h4 className="font-semibold text-foreground truncate">{budget.client_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                                <div className="text-xl font-bold text-primary">
                                  R$ {budget.total_price?.toLocaleString('pt-BR') || '0,00'}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-foreground">Nenhum orçamento encontrado</p>
                            <p className="text-muted-foreground">Comece criando seu primeiro orçamento</p>
                          </div>
                          <Button 
                            variant="default" 
                            size="lg"
                            className="mt-4"
                            onClick={() => onNavigateTo?.('new-budget')}
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Criar Primeiro Orçamento
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Analytics Section */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={itemVariants}
                >
                  <div className="relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold">Análise de Vendas</h3>
                      </div>
                      <div className="h-40 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Gráfico de vendas em breve</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                          <PieChart className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold">Distribuição</h3>
                      </div>
                      <div className="h-40 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-2xl flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Gráfico de distribuição em breve</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Sidebar Area */}
              <div className="xl:col-span-4 space-y-6">
                {/* License Status */}
                <motion.div variants={itemVariants}>
                  <LicenseStatusCard />
                </motion.div>

                {/* Premium Quick Actions */}
                <motion.div 
                  className="relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 shadow-lg"
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold">Ações Rápidas</h3>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        variant="default" 
                        size="lg"
                        className="w-full justify-start gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => onNavigateTo?.('new-budget')}
                      >
                        <Plus className="h-5 w-5" />
                        Novo Orçamento
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full justify-start gap-3 border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-300"
                        onClick={() => onNavigateTo?.('clients')}
                      >
                        <Users className="h-5 w-5" />
                        Gerenciar Clientes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full justify-start gap-3 border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-300"
                        onClick={() => onNavigateTo?.('settings')}
                      >
                        <Shield className="h-5 w-5" />
                        Configurações
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Recent Activity */}
                <motion.div 
                  className="relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 shadow-lg"
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold">Atividade Recente</h3>
                    </div>
                    <div className="space-y-4">
                      <motion.div 
                        className="flex items-center gap-4 p-4 rounded-2xl bg-background/60 border border-border/30 hover:bg-background/80 transition-all duration-300"
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-foreground">Orçamento aprovado</p>
                          <p className="text-sm text-muted-foreground">há 2 horas</p>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-4 p-4 rounded-2xl bg-background/60 border border-border/30 hover:bg-background/80 transition-all duration-300"
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-foreground">Novo cliente cadastrado</p>
                          <p className="text-sm text-muted-foreground">há 4 horas</p>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-4 p-4 rounded-2xl bg-background/60 border border-border/30 hover:bg-background/80 transition-all duration-300"
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-foreground">Sistema atualizado</p>
                          <p className="text-sm text-muted-foreground">ontem</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};
