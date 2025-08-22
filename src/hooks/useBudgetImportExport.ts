import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BudgetExportData {
  tipoAparelho: string;
  servicoAparelho: string;
  qualidade?: string;
  observacoes?: string;
  precoVista: number;
  precoParcelado: number;
  parcelas: number;
  metodoPagamento: string;
  garantiaMeses: number;
  validadeDias: number;
  incluiEntrega: string;
  incluiPelicula: string;
}

interface ImportResults {
  success: number;
  errors: string[];
}

interface ImportPreviewData {
  tipoAparelho: string;
  servicoAparelho: string;
  qualidade?: string;
  observacoes?: string;
  precoVista: number;
  precoParcelado: number;
  parcelas: number;
  metodoPagamento: string;
  garantiaMeses: number;
  validadeDias: number;
  incluiEntrega: string;
  incluiPelicula: string;
  lineNumber: number;
  isValid: boolean;
  errors: string[];
}

export const useBudgetImportExport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const exportBudgets = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Buscar todos os orçamentos do usuário
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null);

      if (error) throw error;

      if (!budgets || budgets.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum orçamento encontrado para exportar",
          variant: "default",
        });
        return;
      }

      // Converter dados para o formato de exportação
      const exportData: BudgetExportData[] = budgets.map(budget => ({
        tipoAparelho: budget.device_type || '',
        servicoAparelho: budget.device_model || '',
        qualidade: budget.part_quality || '',
        observacoes: budget.notes || '',
        precoVista: budget.cash_price || budget.total_price,
        precoParcelado: budget.installment_price || budget.total_price,
        parcelas: budget.installments || 1,
        metodoPagamento: budget.payment_condition || '',
        garantiaMeses: budget.warranty_months || 0,
        validadeDias: budget.valid_until ? 
          Math.ceil((new Date(budget.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
        incluiEntrega: budget.includes_delivery ? 'sim' : 'não',
        incluiPelicula: budget.includes_screen_protector ? 'sim' : 'não'
      }));

      // Criar CSV
      const headers = [
        'Tipo Aparelho',
        'Serviço/Aparelho', 
        'Qualidade',
        'Observações',
        'Preço à Vista',
        'Preço Parcelado',
        'Parcelas',
        'Método de Pagamento',
        'Garantia (meses)',
        'Validade (dias)',
        'Inclui Entrega',
        'Inclui Película'
      ];

      const csvContent = [
        headers.join(';'),
        ...exportData.map(row => [
          row.tipoAparelho,
          row.servicoAparelho,
          row.qualidade || '',
          row.observacoes || '',
          row.precoVista,
          row.precoParcelado,
          row.parcelas,
          row.metodoPagamento,
          row.garantiaMeses,
          row.validadeDias,
          row.incluiEntrega,
          row.incluiPelicula
        ].join(';'))
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orcamentos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sucesso",
        description: `${budgets.length} orçamentos exportados com sucesso!`,
      });

      return true;

    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar orçamentos",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const parseImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
      }

      // Pular o cabeçalho
      const dataLines = lines.slice(1);
      const previewData: ImportPreviewData[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const columns = line.split(';');
        const lineErrors: string[] = [];
        let isValid = true;

        if (columns.length < 12) {
          lineErrors.push(`Número insuficiente de colunas (${columns.length}/12)`);
          isValid = false;
        }

        // Validar dados obrigatórios
        const tipoAparelho = columns[0]?.trim();
        const servicoAparelho = columns[1]?.trim();
        const precoVista = parseFloat(columns[4]?.replace(',', '.') || '0');
        const precoParcelado = parseFloat(columns[5]?.replace(',', '.') || '0');
        const parcelas = parseInt(columns[6] || '1');

        if (!tipoAparelho) {
          lineErrors.push('Tipo de aparelho obrigatório');
          isValid = false;
        }
        if (!servicoAparelho) {
          lineErrors.push('Serviço/Aparelho obrigatório');
          isValid = false;
        }
        if (precoVista <= 0) {
          lineErrors.push('Preço à vista deve ser maior que 0');
          isValid = false;
        }

        previewData.push({
          tipoAparelho: tipoAparelho || '',
          servicoAparelho: servicoAparelho || '',
          qualidade: columns[2]?.trim() || '',
          observacoes: columns[3]?.trim() || '',
          precoVista: precoVista,
          precoParcelado: precoParcelado,
          parcelas: parcelas,
          metodoPagamento: columns[7]?.trim() || '',
          garantiaMeses: parseInt(columns[8] || '0'),
          validadeDias: parseInt(columns[9] || '0'),
          incluiEntrega: columns[10]?.toLowerCase().trim() === 'sim' ? 'Sim' : 'Não',
          incluiPelicula: columns[11]?.toLowerCase().trim() === 'sim' ? 'Sim' : 'Não',
          lineNumber: i + 2,
          isValid,
          errors: lineErrors
        });
      }

      setImportPreview(previewData);
      setShowPreview(true);
      return previewData;

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo de importação",
        variant: "destructive",
      });
      return null;
    }
  };

  const confirmImport = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const validItems = importPreview.filter(item => item.isValid);
      const errors: string[] = [];
      let successCount = 0;

      for (const item of validItems) {
        try {
          const validUntil = item.validadeDias > 0 ? 
            new Date(Date.now() + item.validadeDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

          const { error: insertError } = await supabase
            .from('budgets')
            .insert({
              owner_id: user.id,
              device_type: item.tipoAparelho,
              device_model: item.servicoAparelho,
              part_quality: item.qualidade || null,
              notes: item.observacoes || null,
              cash_price: item.precoVista,
              installment_price: item.precoParcelado,
              total_price: item.precoVista,
              installments: item.parcelas,
              payment_condition: item.metodoPagamento || null,
              warranty_months: item.garantiaMeses,
              valid_until: validUntil,
              includes_delivery: item.incluiEntrega === 'Sim',
              includes_screen_protector: item.incluiPelicula === 'Sim',
              status: 'pending',
              workflow_status: 'pending',
              is_paid: false,
              is_delivered: false
            });

          if (insertError) {
            errors.push(`Linha ${item.lineNumber}: ${insertError.message}`);
          } else {
            successCount++;
          }

        } catch (error) {
          errors.push(`Linha ${item.lineNumber}: Erro ao processar dados - ${error}`);
        }
      }

      const results = { success: successCount, errors };
      setImportResults(results);
      setShowPreview(false);
      setImportPreview([]);

      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} orçamentos importados com sucesso!`,
        });
      }

      return results;

    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar orçamentos",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setImportPreview([]);
    setShowPreview(false);
  };

  const clearImportResults = () => {
    setImportResults(null);
  };

  return {
    exportBudgets,
    parseImportFile,
    confirmImport,
    cancelImport,
    clearImportResults,
    isExporting,
    isImporting,
    importResults,
    importPreview,
    showPreview
  };
};