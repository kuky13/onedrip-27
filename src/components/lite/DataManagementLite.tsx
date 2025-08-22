import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2, Search, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DataManagementLiteProps {
  userId: string;
  onBack: () => void;
}

export const DataManagementLite = ({ userId, onBack }: DataManagementLiteProps) => {
  const [stats, setStats] = useState({
    totalBudgets: 0,
    deletedBudgets: 0
  });
  const [loading, setLoading] = useState(true);
  const [deletedBudgets, setDeletedBudgets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filteredBudgets, setFilteredBudgets] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar estatísticas - ativas
        const activePromise = supabase
          .from('budgets')
          .select('id', { count: 'exact' })
          .eq('owner_id', userId)
          .is('deleted_at', null);
          
        // Buscar orçamentos deletados
        const trashedPromise = supabase
          .from('budget_deletion_audit')
          .select('*')
          .eq('deleted_by', userId)
          .eq('can_restore', true)
          .order('created_at', { ascending: false });

        const [activeResult, trashedResult] = await Promise.all([
          activePromise,
          trashedPromise
        ]);

        const activeBudgets = activeResult.data || [];
        const trashedBudgets = trashedResult.data || [];
        
        // Converter dados da audit para formato compatível
        const formattedTrashedBudgets = trashedBudgets.map(audit => ({
          ...(typeof audit.budget_data === 'object' && audit.budget_data !== null ? audit.budget_data : {}),
          deletion_reason: audit.deletion_reason,
          deleted_at: audit.created_at,
          audit_id: audit.id
        }));

        setStats({
          totalBudgets: activeBudgets.length,
          deletedBudgets: formattedTrashedBudgets.length
        });
        
        setDeletedBudgets(formattedTrashedBudgets);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    let filtered = deletedBudgets;
    
    if (searchTerm) {
      filtered = filtered.filter(budget => 
        budget.device_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(budget => budget.device_type === filterType);
    }
    
    setFilteredBudgets(filtered);
  }, [deletedBudgets, searchTerm, filterType]);

  const handleRestore = async (budget: any) => {
    try {
      const { data, error } = await supabase.rpc('restore_deleted_budget', {
        p_budget_id: budget.id
      });
        
      if (error) throw error;
      
      setDeletedBudgets(prev => prev.filter(b => b.id !== budget.id));
      setStats(prev => ({
        ...prev,
        totalBudgets: prev.totalBudgets + 1,
        deletedBudgets: prev.deletedBudgets - 1
      }));
      
      alert('Orçamento restaurado com sucesso!');
    } catch (error) {
      console.error('Error restoring budget:', error);
      alert('Erro ao restaurar orçamento');
    }
  };
  
  const handlePermanentDelete = async (budget: any) => {
    if (!confirm('Deseja excluir permanentemente este orçamento? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;
      
      if (!userId) {
        alert('Usuário não autenticado');
        return;
      }

      const { error: auditError } = await supabase
        .from('budget_deletion_audit')
        .update({ can_restore: false })
        .eq('budget_id', budget.id)
        .eq('deleted_by', userId);

      if (auditError) {
        console.error('Erro ao atualizar auditoria:', auditError);
      }
      
      setDeletedBudgets(prev => prev.filter(b => b.id !== budget.id));
      setStats(prev => ({
        ...prev,
        deletedBudgets: prev.deletedBudgets - 1
      }));
      
      alert('Orçamento excluído permanentemente!');
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Erro ao excluir orçamento');
    }
  };

  const handleEmptyTrash = async () => {
    if (!deletedBudgets || deletedBudgets.length === 0) {
      alert('Não há orçamentos na lixeira para excluir.');
      return;
    }
    
    if (!confirm('Deseja realmente esvaziar a lixeira? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setLoading(true);
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;
      
      if (!userId) {
        alert('Usuário não autenticado');
        return;
      }

      for (const budget of deletedBudgets) {
        await supabase
          .from('budget_deletion_audit')
          .update({ can_restore: false })
          .eq('budget_id', budget.id)
          .eq('deleted_by', userId);
      }

      setDeletedBudgets([]);
      setStats(prev => ({
        ...prev,
        deletedBudgets: 0
      }));

      alert('Lixeira esvaziada com sucesso!');
    } catch (error) {
      console.error('Erro ao esvaziar lixeira:', error);
      alert('Erro ao esvaziar a lixeira');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      
      const [activeResult, trashedResult] = await Promise.all([
        supabase
          .from('budgets')
          .select('id', { count: 'exact' })
          .eq('owner_id', userId)
          .is('deleted_at', null),
        supabase
          .from('budget_deletion_audit')
          .select('*')
          .eq('deleted_by', userId)
          .eq('can_restore', true)
          .order('created_at', { ascending: false })
      ]);

      const activeBudgets = activeResult.data || [];
      const trashedBudgets = trashedResult.data || [];
      
      const formattedTrashedBudgets = trashedBudgets.map(audit => ({
        ...(typeof audit.budget_data === 'object' && audit.budget_data !== null ? audit.budget_data : {}),
        deletion_reason: audit.deletion_reason,
        deleted_at: audit.created_at,
        audit_id: audit.id
      }));

      setStats({
        totalBudgets: activeBudgets.length,
        deletedBudgets: formattedTrashedBudgets.length
      });
      
      setDeletedBudgets(formattedTrashedBudgets);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Lixeira</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalBudgets}</div>
                  <div className="text-xs text-muted-foreground">Orçamentos Ativos</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.deletedBudgets}</div>
                  <div className="text-xs text-muted-foreground">Na Lixeira</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Lixeira de Orçamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar orçamentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Smartphone">Smartphones</SelectItem>
                      <SelectItem value="Tablet">Tablets</SelectItem>
                      <SelectItem value="Notebook">Notebooks</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {deletedBudgets.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleEmptyTrash}
                      disabled={loading}
                    >
                      Esvaziar
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando lixeira...</p>
                  </div>
                ) : filteredBudgets.length === 0 ? (
                  <div className="text-center py-8">
                    <Trash2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {deletedBudgets.length === 0 
                        ? 'A lixeira está vazia' 
                        : 'Nenhum orçamento encontrado com os filtros atuais'
                      }
                    </p>
                  </div>
                ) : (
                  filteredBudgets.map((budget, index) => (
                    <div key={budget.audit_id || index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{budget.device_type} - {budget.device_model}</h4>
                          <p className="text-sm text-muted-foreground">
                            Cliente: {budget.client_name || 'Não informado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Excluído em: {new Date(budget.deleted_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {budget.total_price ? 
                              (budget.total_price / 100).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }) : 'R$ 0,00'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(budget)}
                          disabled={loading}
                          className="flex-1"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePermanentDelete(budget)}
                          disabled={loading}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};