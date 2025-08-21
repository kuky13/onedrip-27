import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { Home, FileText, Settings, Plus, LogOut, User, Star, Users, Database, UserCheck } from 'lucide-react';
interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export const AppSidebar = ({
  activeTab,
  onTabChange
}: AppSidebarProps) => {
  const {
    signOut,
    user,
    profile,
    hasRole
  } = useAuth();
  const {
    state
  } = useSidebar();
  const {
    isDesktop
  } = useResponsive();
  const navigationItems = [{
    id: 'dashboard',
    label: 'Menu',
    icon: Home,
    permission: true
  }, {
    id: 'new-budget',
    label: 'Novo Orçamento',
    icon: Plus,
    permission: true
  }, {
    id: 'clients',
    label: 'Clientes',
    icon: UserCheck,
    permission: true
  }, {
    id: 'data-management',
    label: 'Gestão de Dados',
    icon: Database,
    permission: true
  }, {
    id: 'admin',
    label: 'Administração',
    icon: Users,
    permission: hasRole('admin')
  }];
  return <Sidebar className={cn("border-r border-border dark:border-white/5", "transition-all duration-300 ease-in-out", "h-screen flex flex-col", isDesktop && "desktop-sidebar")} collapsible="icon">
      
      
      <AnimatePresence>
        {state === "expanded" && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: "auto"
      }} exit={{
        opacity: 0,
        height: 0
      }} transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}>
            <SidebarHeader className={cn("p-4 h-20 flex items-center", isDesktop && "desktop-sidebar-header")}>
              <div className={cn("flex items-center space-x-4 w-full", isDesktop && "desktop-flex-row")}>
                
                <motion.div className="flex-1 min-w-0" initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.1,
              duration: 0.2
            }}>
                  <p className={cn("text-base font-semibold text-foreground truncate", isDesktop && "desktop-user-name")}>
                    {profile?.name || 'Usuário'}
                  </p>
                  <p className={cn("text-xs text-muted-foreground truncate", isDesktop && "desktop-user-email")}>
                    {user?.email}
                  </p>
                </motion.div>
              </div>
            </SidebarHeader>
          </motion.div>}
      </AnimatePresence>
      
      {state === "expanded" && <SidebarSeparator />}
      
      <SidebarContent className={cn("p-3", isDesktop && "px-4 pt-4 overflow-x-hidden")}>
        <SidebarMenu className={cn(
      // mobile: coluna; desktop: linha com wrap
      "flex flex-col gap-2", isDesktop && "flex-row flex-wrap gap-3")}>
          {navigationItems.map(item => {
          if (!item.permission) return null;
          const Icon = item.icon;
          return <SidebarMenuItem key={item.id} className={cn("p-1", isDesktop && "p-0")}>
                <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={activeTab === item.id} className={cn(
            // mobile ocupa largura total, desktop vira "chip" horizontal
            "h-12 text-base font-medium rounded-lg transition-all duration-200 ease-in-out", !isDesktop && "w-full", isDesktop && "w-auto px-3 justify-start gap-3")} tooltip={item.label}>
                  <Icon className="h-5 w-5" />
                  <span className={cn("transition-opacity duration-200", state === "collapsed" && "opacity-0")}>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>;
        })}
        </SidebarMenu>
      </SidebarContent>

      
    </Sidebar>;
};