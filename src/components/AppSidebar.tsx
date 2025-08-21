import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { Home, FileText, Settings, Plus, LogOut, User, Star, Users, Database, UserCheck, Sparkles, Activity } from 'lucide-react';
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
  // Desktop horizontal navigation - render different layout for desktop
  if (isDesktop) {
    return (
      <div className="w-full border-b border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
        {/* Desktop Header */}
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: User Info + Navigation */}
            <div className="flex items-center gap-8">
              {/* User Profile Section */}
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-base font-semibold text-foreground leading-none">
                    {profile?.name || 'Usuário'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-none truncate max-w-[200px]">
                    {user?.email}
                  </p>
                </div>
              </motion.div>

              {/* Vertical Separator */}
              <div className="w-px h-8 bg-border/50" />

              {/* Navigation Menu - Horizontal Chips */}
              <motion.nav 
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {navigationItems.map((item, index) => {
                  if (!item.permission) return null;
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        // Base styles
                        "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ease-out",
                        "hover:scale-[1.02] hover:-translate-y-0.5",
                        // Active state
                        isActive ? [
                          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25",
                          "border border-primary/20"
                        ] : [
                          "bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground",
                          "border border-border/30 hover:border-border/60 hover:shadow-md hover:shadow-black/5"
                        ]
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Background Effect */}
                      <div className={cn(
                        "absolute inset-0 rounded-xl transition-opacity duration-300",
                        isActive 
                          ? "bg-gradient-to-r from-white/20 to-white/5 opacity-100" 
                          : "bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100"
                      )} />
                      
                      {/* Icon */}
                      <Icon className={cn(
                        "h-5 w-5 transition-all duration-300 relative z-10",
                        isActive 
                          ? "text-primary-foreground drop-shadow-sm" 
                          : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                      )} />
                      
                      {/* Label */}
                      <span className={cn(
                        "text-sm font-medium whitespace-nowrap relative z-10 transition-all duration-300",
                        isActive 
                          ? "text-primary-foreground drop-shadow-sm" 
                          : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {item.label}
                      </span>

                      {/* Active Indicator Dot */}
                      {isActive && (
                        <motion.div 
                          className="absolute -top-1 left-1/2 w-2 h-2 bg-primary-foreground rounded-full transform -translate-x-1/2"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}

                      {/* Hover Effect Ring */}
                      <div className={cn(
                        "absolute inset-0 rounded-xl ring-2 ring-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        !isActive && "group-hover:ring-primary/30"
                      )} />
                    </motion.button>
                  );
                })}
              </motion.nav>
            </div>

            {/* Right: Status & Actions */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 rounded-full border border-green-200/50 dark:border-green-800/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Online</span>
              </div>

              {/* Desktop Mode Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Desktop Mode</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile sidebar - keep original implementation
  return <Sidebar className={cn("border-r border-border dark:border-white/5", "transition-all duration-300 ease-in-out", "h-screen flex flex-col")} collapsible="icon">      
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
            <SidebarHeader className="p-4 h-20 flex items-center">
              <div className="flex items-center space-x-4 w-full">
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
                  <p className="text-base font-semibold text-foreground truncate">
                    {profile?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </motion.div>
              </div>
            </SidebarHeader>
          </motion.div>}
      </AnimatePresence>
      
      {state === "expanded" && <SidebarSeparator />}
      
      <SidebarContent className="p-3">
        <SidebarMenu className="flex flex-col gap-2">
          {navigationItems.map(item => {
          if (!item.permission) return null;
          const Icon = item.icon;
          return <SidebarMenuItem key={item.id} className="p-1">
                <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={activeTab === item.id} className="h-12 text-base font-medium rounded-lg transition-all duration-200 ease-in-out w-full" tooltip={item.label}>
                  <Icon className="h-5 w-5" />
                  <span className={cn("transition-opacity duration-200", state === "collapsed" && "opacity-0")}>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>;
        })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>;
};