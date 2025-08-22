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
  return <Sidebar className={cn(
    "border-r border-border dark:border-white/5",
    "transition-all duration-200 ease-in-out",
    "h-screen flex flex-col",
    isDesktop && "desktop-sidebar w-[280px] data-[state=collapsed]:w-[60px] shadow-lg data-[state=collapsed]:shadow-md",
    "bg-card/50"
  )} collapsible="icon">
      
      
      <AnimatePresence>
        {state === "expanded" && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.15
      }}>
            <SidebarHeader className={cn(
              "p-4 h-20 flex items-center border-b border-border/50",
              "transition-all duration-300 ease-in-out",
              "data-[state=collapsed]:justify-center",
              isDesktop && "desktop-sidebar-header px-4 py-4 bg-card/30 min-h-[80px] flex items-center"
            )}>
              <motion.div
                  className={cn(
                    "flex items-center gap-3 w-full",
                    "transition-all duration-200 ease-in-out",
                    isDesktop && "desktop-sidebar-user-info",
                    state === "collapsed" && "justify-center"
                  )}
                  initial={false}
                  animate={{
                    opacity: state === "collapsed" ? 0.7 : 1
                  }}
                  transition={{ 
                    duration: 0.2
                  }}
                >
                
                <motion.div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0",
                  "bg-gradient-to-br from-primary to-primary/80 shadow-lg",
                  "hover:shadow-xl transition-all duration-200 ease-in-out",
                  isDesktop && "desktop-avatar w-10 h-10",
                  state === "collapsed" && "w-8 h-8 text-sm"
                )} initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} transition={{
                  duration: 0.2
                }}>
                  {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </motion.div>
                <motion.div className={cn(
                  "flex flex-col min-w-0 flex-1 overflow-hidden",
                  "transition-all duration-200 ease-in-out",
                  isDesktop && "desktop-sidebar-user-text"
                )} initial={{
                  opacity: 0
                }} animate={{
                  opacity: state === "collapsed" ? 0 : 1
                }} transition={{
                  duration: 0.2
                }}>
                  <motion.p className={cn(
                    "text-sm font-semibold text-foreground truncate leading-tight",
                    "transition-all duration-200",
                    isDesktop && "desktop-sidebar-username text-sm font-600",
                    state === "collapsed" && "opacity-0 pointer-events-none"
                  )} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ 
                    duration: 0.2
                  }}>
                    {profile?.name || 'Usuário'}
                  </motion.p>
                  <motion.p className={cn(
                    "text-xs text-muted-foreground truncate leading-tight mt-0.5",
                    "transition-all duration-200",
                    isDesktop && "desktop-sidebar-email text-xs opacity-80",
                    state === "collapsed" && "opacity-0 pointer-events-none"
                  )} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ 
                    duration: 0.2
                  }}>
                    {user?.email}
                  </motion.p>
                </motion.div>
                </motion.div>
            </SidebarHeader>
          </motion.div>}
      </AnimatePresence>
      
      {state === "expanded" && <SidebarSeparator />}
      
      <SidebarContent className={cn(
        "p-3 flex-1 overflow-y-auto",
        isDesktop && "px-4 pt-6 overflow-x-hidden desktop-sidebar-content"
      )}>
        <SidebarMenu className={cn(
          "flex flex-col gap-2",
          isDesktop && "desktop-sidebar-menu flex-col gap-2"
        )}>
          {navigationItems.map(item => {
          if (!item.permission) return null;
          const Icon = item.icon;
          return <SidebarMenuItem key={item.id} className={cn(
            "p-1",
            isDesktop && "desktop-sidebar-item p-0 mb-1"
          )}>
                <SidebarMenuButton 
                  onClick={() => onTabChange(item.id)} 
                  isActive={activeTab === item.id} 
                  className={cn(
                    "h-12 text-base font-medium rounded-lg transition-all duration-200 ease-in-out",
                    "hover:bg-accent/50 hover:text-accent-foreground",
                    "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                    "data-[active=true]:shadow-md",
                    !isDesktop && "w-full",
                    isDesktop && "desktop-sidebar-button w-full px-3 py-2 justify-start gap-3 h-11 hover:shadow-md",
                    activeTab === item.id && "shadow-md"
                  )} 
                  tooltip={item.label}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isDesktop && "desktop-sidebar-icon h-4 w-4"
                  )} />
                  <span className={cn(
                    "transition-all duration-200 font-medium",
                    state === "collapsed" && "opacity-0",
                    isDesktop && "desktop-sidebar-text text-sm font-500"
                  )}>
                    {item.label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>;
        })}
        </SidebarMenu>
      </SidebarContent>

      
    </Sidebar>;
};