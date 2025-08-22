import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ClientSection } from './ios/ClientSection';
import { DeviceSection } from './ios/DeviceSection';
import { PricingSection } from './ios/PricingSection';
import { SettingsSection } from './ios/SettingsSection';

interface Budget {
  id: string;
  client_name?: string;
  device_model?: string;
  device_type?: string;
  part_type?: string;
  part_quality?: string;
  warranty_months?: number;
  cash_price?: number;
  installment_price?: number;
  total_price?: number;
  payment_condition?: string;
  includes_delivery?: boolean;
  includes_screen_protector?: boolean;
  notes?: string;
  workflow_status?: string;
  is_paid?: boolean;
  is_delivered?: boolean;
  expires_at?: string;
  approved_at?: string;
  payment_confirmed_at?: string;
  delivery_confirmed_at?: string;
  created_at: string;
  installments?: number;
  client_phone?: string;
}

interface BudgetEditFormIOSProps {
  budget: Budget;
  isOpen: boolean;
  onClose: () => void;
  onBudgetUpdate?: (updates: Partial<Budget>) => void;
}

export const BudgetEditFormIOS = ({
  budget,
  isOpen,
  onClose,
  onBudgetUpdate
}: BudgetEditFormIOSProps) => {
  const [formData, setFormData] = useState({
    client_name: budget.client_name || '',
    device_model: budget.device_model || '',
    device_type: budget.device_type || 'Celular',
    part_type: budget.part_type || budget.part_quality || '',
    warranty_months: budget.warranty_months || 3,
    cash_price: budget.cash_price ? budget.cash_price / 100 : 0,
    installment_price: budget.installment_price ? budget.installment_price / 100 : 0,
    installments: budget.installments || 1,
    enableInstallmentPrice: !!budget.installment_price,
    payment_condition: budget.payment_condition || 'Cartão de Crédito',
    includes_delivery: budget.includes_delivery || false,
    includes_screen_protector: budget.includes_screen_protector || false,
    observations: budget.notes || '',
    client_phone: budget.client_phone || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [existingClients, setExistingClients] = useState<Array<{name: string, phone: string}>>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Carregar dados completos do orçamento quando abrir
  useEffect(() => {
    if (isOpen && budget.id) {
      loadBudgetData();
    }
  }, [isOpen, budget.id]);

  const loadBudgetData = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budget.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          client_name: data.client_name || '',
          device_model: data.device_model || '',
          device_type: data.device_type || 'Celular',
          part_type: data.part_type || data.part_quality || '',
          warranty_months: data.warranty_months || 3,
          cash_price: data.cash_price ? data.cash_price / 100 : 0,
          installment_price: data.installment_price ? data.installment_price / 100 : 0,
          installments: data.installments || 1,
          enableInstallmentPrice: !!data.installment_price,
          payment_condition: data.payment_condition || 'Cartão de Crédito',
          includes_delivery: data.includes_delivery || false,
          includes_screen_protector: data.includes_screen_protector || false,
          observations: data.notes || '',
          client_phone: data.client_phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadExistingClients = async () => {
    setIsLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('client_name, client_phone')
        .not('client_name', 'is', null)
        .not('client_name', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Remover duplicatas e filtrar clientes válidos
      const uniqueClients = data
        .filter((budget, index, self) => 
          budget.client_name && 
          index === self.findIndex(b => b.client_name === budget.client_name)
        )
        .map(budget => ({
          name: budget.client_name || '',
          phone: budget.client_phone || ''
        }));

      setExistingClients(uniqueClients);
    } catch (error) {
      console.error('Error loading existing clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleClientSelect = (client: {name: string, phone: string}) => {
    setFormData(prev => ({
      ...prev,
      client_name: client.name,
      client_phone: client.phone
    }));
    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        client_name: formData.client_name,
        device_model: formData.device_model,
        device_type: formData.device_type,
        part_quality: formData.part_type,
        part_type: formData.part_type,
        warranty_months: formData.warranty_months,
        cash_price: Math.round(formData.cash_price * 100),
        installment_price: formData.enableInstallmentPrice ? Math.round(formData.installment_price * 100) : null,
        total_price: Math.round(formData.cash_price * 100),
        installments: formData.installments,
        payment_condition: formData.payment_condition,
        includes_delivery: formData.includes_delivery,
        includes_screen_protector: formData.includes_screen_protector,
        notes: formData.observations,
        client_phone: formData.client_phone,
      };

      const { error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', budget.id);

      if (error) throw error;

      // Callback para atualizar a UI
      if (onBudgetUpdate) {
        onBudgetUpdate({
          ...budget,
          ...updateData,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Erro ao atualizar orçamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="[&>button[data-radix-dialog-close]]:hidden w-[95vw] max-w-md p-0 bg-background border-border flex flex-col rounded-xl shadow-2xl"
        style={{
          height: '90dvh',
          maxHeight: '90dvh',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          WebkitBackfaceVisibility: 'hidden',
          overscrollBehavior: 'none'
        }}
      >
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg text-foreground">
              Editar Orçamento
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para editar informações do orçamento incluindo cliente, dispositivo, preços e configurações.
            </DialogDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando dados...</span>
            </div>
          ) : (
            <>
              <DeviceSection 
                formData={formData}
                onInputChange={handleInputChange}
              />

              <ClientSection
                formData={formData}
                existingClients={existingClients}
                showClientSearch={showClientSearch}
                clientSearchTerm={clientSearchTerm}
                isLoadingClients={isLoadingClients}
                onInputChange={handleInputChange}
                onToggleClientSearch={() => {
                  setShowClientSearch(!showClientSearch);
                  if (!showClientSearch && existingClients.length === 0) {
                    loadExistingClients();
                  }
                }}
                onSearchTermChange={setClientSearchTerm}
                onClientSelect={handleClientSelect}
              />

              <PricingSection
                formData={{
                  ...formData,
                  total_price: formData.cash_price || 0
                }}
                onInputChange={handleInputChange}
              />

              <SettingsSection
                formData={formData}
                onInputChange={handleInputChange}
              />
            </>
          )}
        </div>

        {/* Footer com botões */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isLoadingData}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};