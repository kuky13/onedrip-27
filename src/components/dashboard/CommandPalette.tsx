import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  PlusCircle, 
  List, 
  Settings, 
  Shield, 
  Database, 
  User, 
  FileText, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'recent' | 'budgets' | 'clients';
  keywords: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentBudgets, setRecentBudgets] = useState<Array<{
    id: string;
    client_name: string;
    total_price: number;
    created_at: string;
  }>>([]);
  const [recentClients, setRecentClients] = useState<Array<{
    client_name: string;
  }>>([]);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Comandos de navegação padrão
  const navigationCommands: CommandItem[] = [
    {
      id: 'new-budget',
      title: 'Novo Orçamento',
      description: 'Criar um novo orçamento via dashboard',
      icon: <PlusCircle className="h-4 w-4 text-green-500" />,
      action: () => {
        navigate('/painel', { state: { activeTab: 'new-budget' } });
        onClose();
      },
      category: 'navigation',
      keywords: ['novo', 'orçamento', 'criar', 'budget']
    },
    {
      id: 'admin-panel',
      title: 'Painel Administrativo',
      description: 'Acessar painel de administração',
      icon: <Shield className="h-4 w-4 text-red-500" />,
      action: () => {
        navigate('/?tab=admin');
        onClose();
      },
      category: 'navigation',
      keywords: ['admin', 'administrativo', 'painel', 'gestão']
    },
    {
      id: 'data-management',
      title: 'Gestão de Dados',
      description: 'Gerenciar dados do sistema',
      icon: <Database className="h-4 w-4 text-purple-500" />,
      action: () => {
        navigate('/?tab=data-management');
        onClose();
      },
      category: 'navigation',
      keywords: ['dados', 'gestão', 'data', 'management']
    }
  ];

  // Buscar orçamentos e clientes recentes
  useEffect(() => {
    const fetchRecentData = async () => {
      if (!profile?.id) return;

      try {
        // Buscar orçamentos recentes
        const { data: budgets } = await supabase
          .from('budgets')
          .select('id, client_name, total_price, created_at')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (budgets) {
          setRecentBudgets(budgets);
        }

        // Buscar clientes únicos dos orçamentos
        const { data: clientsData } = await supabase
          .from('budgets')
          .select('client_name')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (clientsData) {
          const uniqueClients = Array.from(
            new Set(clientsData.map(item => item.client_name))
          ).slice(0, 5);
          setRecentClients(uniqueClients.map(name => ({ client_name: name })));
        }
      } catch (error) {
        console.error('Erro ao buscar dados recentes:', error);
      }
    };

    if (isOpen) {
      fetchRecentData();
    }
  }, [isOpen, profile?.id]);

  // Gerar itens dinâmicos baseados nos dados
  const generateDynamicItems = (): CommandItem[] => {
    const items: CommandItem[] = [];

    // Adicionar orçamentos recentes
    recentBudgets.forEach(budget => {
      items.push({
        id: `budget-${budget.id}`,
        title: `Orçamento: ${budget.client_name}`,
        description: `R$ ${budget.total_price} - ${new Date(budget.created_at).toLocaleDateString()}`,
        icon: <FileText className="h-4 w-4 text-blue-500" />,
        action: () => {
          navigate('/painel', { state: { activeTab: 'budgets', viewBudget: budget.id } });
          onClose();
        },
        category: 'budgets',
        keywords: ['orçamento', budget.client_name, budget.total_price.toString()]
      });
    });

    // Adicionar clientes recentes
    recentClients.forEach(client => {
      items.push({
        id: `client-${client.client_name}`,
        title: `Cliente: ${client.client_name}`,
        description: 'Ver orçamentos deste cliente',
        icon: <User className="h-4 w-4 text-green-500" />,
        action: () => {
          navigate('/painel', { state: { activeTab: 'budgets', filterClient: client.client_name } });
          onClose();
        },
        category: 'clients',
        keywords: ['cliente', client.client_name]
      });
    });

    return items;
  };

  // Filtrar itens baseado na query
  useEffect(() => {
    const dynamicItems = generateDynamicItems();
    const allItems = [...navigationCommands, ...dynamicItems];
    
    if (!query.trim()) {
      setFilteredItems(allItems);
    } else {
      const filtered = allItems.filter(item => {
        const searchText = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(searchText) ||
          item.description?.toLowerCase().includes(searchText) ||
          item.keywords.some(keyword => keyword.toLowerCase().includes(searchText))
        );
      });
      setFilteredItems(filtered);
    }
    setSelectedIndex(0);
  }, [query, recentBudgets, recentClients, navigationCommands]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  const groupedItems = {
    navigation: filteredItems.filter(item => item.category === 'navigation'),
    recent: filteredItems.filter(item => item.category === 'budgets' || item.category === 'clients'),
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start justify-center pt-[10vh] px-4">
        <Card className="w-full max-w-2xl glass-card shadow-strong animate-slide-up">
          <CardContent className="p-0">
            {/* Header com input de busca */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Digite para buscar... (Ctrl+K)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                Esc
              </Button>
            </div>

            {/* Lista de comandos */}
            <div className="max-h-96 overflow-y-auto">
              {/* Navegação */}
              {groupedItems.navigation.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Navegação
                  </div>
                  {groupedItems.navigation.map((item, index) => {
                    const globalIndex = filteredItems.indexOf(item);
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-auto p-3 text-left ${
                          selectedIndex === globalIndex
                            ? 'bg-accent/50 text-accent-foreground'
                            : 'hover:bg-accent/30'
                        }`}
                        onClick={item.action}
                      >
                        {item.icon}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Recentes */}
              {groupedItems.recent.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recentes
                  </div>
                  {groupedItems.recent.map((item, index) => {
                    const globalIndex = filteredItems.indexOf(item);
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-auto p-3 text-left ${
                          selectedIndex === globalIndex
                            ? 'bg-accent/50 text-accent-foreground'
                            : 'hover:bg-accent/30'
                        }`}
                        onClick={item.action}
                      >
                        {item.icon}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Nenhum resultado */}
              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="font-medium">Nenhum resultado encontrado</div>
                  <div className="text-sm">Tente buscar por outro termo</div>
                </div>
              )}
            </div>

            {/* Footer com dicas */}
            <div className="border-t border-border/50 p-3 bg-muted/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>↑↓ Navegar</span>
                  <span>↵ Selecionar</span>
                  <span>Esc Fechar</span>
                </div>
                <div>Ctrl+K para abrir</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandPalette;