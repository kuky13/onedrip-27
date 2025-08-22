import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  permission?: string;
  action?: () => void;
}

interface MenuData {
  items: MenuItem[];
  userInfo: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export const useMobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuData, setMenuData] = useState<MenuData>({
    items: [],
    userInfo: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const { profile, user, hasPermission, signOut } = useAuth();

  // Fetch menu data using native fetch()
  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call - replace with real endpoint if needed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const menuItems: MenuItem[] = [
          { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
          { id: 'budgets', label: 'Orçamentos', icon: 'FileText', permission: 'view_own_budgets' },
          { id: 'new-budget', label: 'Novo Orçamento', icon: 'Plus', permission: 'create_budgets' },
          { id: 'clients', label: 'Clientes', icon: 'UserCheck' },
          { id: 'help-center', label: 'Central de Ajuda', icon: 'HelpCircle' },
          { id: 'data-management', label: 'Gestão de Dados', icon: 'Database' },
          { id: 'admin', label: 'Administração', icon: 'Users', permission: 'manage_users' },
          { id: 'settings', label: 'Configurações', icon: 'Settings' },
        ];

        // Filter items based on permissions
        const filteredItems = menuItems.filter(item => 
          !item.permission || hasPermission(item.permission)
        );

        setMenuData({
          items: filteredItems,
          userInfo: {
            name: profile?.name || 'Usuário',
            email: user?.email || '',
            role: profile?.role || 'user'
          }
        });
      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [profile, user, hasPermission]);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    closeMenu();
    await signOut();
  };

  return {
    isOpen,
    menuData,
    isLoading,
    openMenu,
    closeMenu,
    toggleMenu,
    handleLogout
  };
};