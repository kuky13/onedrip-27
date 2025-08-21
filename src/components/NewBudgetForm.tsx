import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdvancedBudgets } from '@/hooks/useAdvancedBudgets';
import { useSecureClients } from '@/hooks/useSecureClients';
import { ClientSection } from '@/components/lite/ios/ClientSection';

interface BudgetFormData {
  deviceType: string;
  deviceModel: string;
  issue: string;
  partType: string;
  brand: string;
  warrantyMonths: number;
  cashPrice: string;
  installmentPrice: string;
  installments: number;
  includesDelivery: boolean;
  includesScreenProtector: boolean;
  enableInstallmentPrice: boolean;
  notes: string;
  validityDays: string;
  paymentCondition: string;
  // Advanced fields
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
}

interface NewBudgetFormProps {
  onBack: () => void;
  initialData?: any;
}

export const NewBudgetForm = ({
  onBack,
  initialData
}: NewBudgetFormProps) => {
  const {
    showSuccess,
    showError
  } = useToast();
  const {
    user,
    profile
  } = useAuth();
  const {
    clients,
    isAdvancedMode
  } = useAdvancedBudgets();
  const {
    clients: secureClients,
    isLoading: isLoadingClients
  } = useSecureClients();
  const queryClient = useQueryClient();

  // Estados para busca de clientes
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const [formData, setFormData] = useState<BudgetFormData>(() => {
    // Verificar se há dados copiados no localStorage
    const copiedData = localStorage.getItem('budgetCopyData');
    if (copiedData) {
      localStorage.removeItem('budgetCopyData'); // Limpar após uso
      try {
        return JSON.parse(copiedData);
      } catch (error) {
        console.error('Erro ao carregar dados copiados:', error);
      }
    }
    
    // Retornar dados padrão ou iniciais
    return initialData || {
      deviceType: 'Celular',
      deviceModel: '',
      issue: '',
      partType: '',
      brand: '',
      warrantyMonths: 3,
      cashPrice: '',
      installmentPrice: '',
      installments: 1,
      includesDelivery: false,
      includesScreenProtector: false,
      enableInstallmentPrice: true,
      notes: '',
      validityDays: '15',
      paymentCondition: 'Cartão de Crédito',
      clientId: '',
      clientName: '',
      clientPhone: ''
    };
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceType: initialData.device_type || 'Celular',
        deviceModel: initialData.device_model || '',
        issue: initialData.issue || '',
        partType: initialData.part_type || '',
        brand: initialData.brand || '',
        warrantyMonths: initialData.warranty_months || 3,
        cashPrice: initialData.cash_price ? (initialData.cash_price / 100).toString() : '',
        installmentPrice: initialData.installment_price ? (initialData.installment_price / 100).toString() : '',
        installments: initialData.installments || 1,
        includesDelivery: initialData.includes_delivery || false,
        includesScreenProtector: initialData.includes_screen_protector || false,
        enableInstallmentPrice: !!initialData.installment_price,
        notes: initialData.notes || '',
        validityDays: '15',
        paymentCondition: initialData.payment_condition || 'Cartão de Crédito',
        clientId: initialData.client_id || '',
        clientName: initialData.client_name || '',
        clientPhone: initialData.client_phone || ''
      });
      showSuccess({
        title: "Orçamento copiado!",
        description: "Ajuste os detalhes e crie um novo orçamento."
      });
    }
  }, [initialData, showSuccess]);

  // Buscar tipos de dispositivo
  const {
    data: deviceTypes
  } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('device_types').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Buscar períodos de garantia
  const {
    data: warrantyPeriods
  } = useQuery({
    queryKey: ['warranty-periods'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('warranty_periods').select('*').order('months');
      if (error) throw error;
      return data;
    }
  });

  // Handlers para busca de clientes
  const handleToggleClientSearch = () => {
    setShowClientSearch(!showClientSearch);
    if (!showClientSearch) {
      setClientSearchTerm('');
    }
  };

  const handleSearchTermChange = (term: string) => {
    setClientSearchTerm(term);
  };

  const handleClientSelect = (client: any) => {
    setFormData({
      ...formData,
      clientId: client.id || '',
      clientName: client.name || '',
      clientPhone: client.phone || ''
    });
    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!user) {
        throw new Error('Usuário não está logado');
      }
      console.log('Creating budget for user:', user.id);
      const validityDays = parseInt(data.validityDays) || 15;
      const cashPriceValue = parseFloat(data.cashPrice) || 0;
      const installmentPriceValue = parseFloat(data.installmentPrice) || 0;

      // Calcular data de validade baseada nos dias especificados
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      // Criar orçamento com owner_id explícito
      const {
        data: budget,
        error: budgetError
      } = await supabase.from('budgets').insert({
        owner_id: user.id,
        device_type: data.deviceType,
        device_model: data.deviceModel,
        issue: data.issue,
        part_quality: data.issue, // Usar issue como part_quality
        part_type: data.partType,
        warranty_months: data.warrantyMonths,
        cash_price: Math.round(cashPriceValue * 100),
        installment_price: data.enableInstallmentPrice ? Math.round(installmentPriceValue * 100) : null,
        installments: data.enableInstallmentPrice ? data.installments : 1,
        total_price: Math.round(cashPriceValue * 100),
        includes_delivery: data.includesDelivery,
        includes_screen_protector: data.includesScreenProtector,
        notes: data.notes,
        status: 'pending',
        valid_until: validUntil.toISOString(),
        payment_condition: data.paymentCondition,
        // Advanced fields
        client_id: data.clientId || null,
        client_name: data.clientName || null,
        client_phone: data.clientPhone || null,
        workflow_status: 'pending',
        expires_at: validUntil.toISOString().split('T')[0] // Date only
      }).select('id').single();
      if (budgetError) {
        console.error('Budget creation error:', budgetError);
        throw budgetError;
      }
      console.log('Budget created:', budget.id);

      // Criar item do orçamento
      const {
        error: partError
      } = await supabase.from('budget_parts').insert({
        budget_id: budget.id,
        name: `${data.partType} - ${data.deviceModel}`,
        part_type: data.partType,
        brand_id: null,
        quantity: 1,
        price: Math.round(cashPriceValue * 100),
        cash_price: Math.round(cashPriceValue * 100),
        installment_price: data.enableInstallmentPrice ? Math.round(installmentPriceValue * 100) : null,
        warranty_months: data.warrantyMonths
      });
      if (partError) {
        console.error('Budget part creation error:', partError);
        throw partError;
      }
      console.log('Budget part created successfully');
      return budget;
    },
    onSuccess: () => {
      const validityDays = parseInt(formData.validityDays) || 15;
      showSuccess({
        title: "Orçamento criado com sucesso!",
        description: `O orçamento foi criado e está válido por ${validityDays} dias.`
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-stats']
      });
      queryClient.invalidateQueries({
        queryKey: ['budgets']
      });
      onBack();
    },
    onError: (error: any) => {
      console.error('Erro ao criar orçamento:', error);
      showError({
        title: "Erro ao criar orçamento",
        description: error.message || "Ocorreu um erro ao salvar o orçamento. Tente novamente."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError({
        title: "Usuário não autenticado",
        description: "Você precisa estar logado para criar orçamentos."
      });
      return;
    }
    if (!formData.deviceModel || !formData.partType) {
      showError({
        title: "Preencha os campos obrigatórios",
        description: "Modelo do aparelho e tipo de serviço são obrigatórios."
      });
      return;
    }
    createBudgetMutation.mutate(formData);
  };

  if (!user) {
    return <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
        <p className="text-gray-600">Você precisa estar logado para criar orçamentos.</p>
      </div>;
  }

  return <div className="p-4 sm:p-8">
      <div className="flex items-center mb-6 sm:mb-8">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#fec832]">Novo Orçamento</h1>
          <p className="mt-2 text-muted-foreground">Crie um novo orçamento personalizado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deviceType">Tipo de Dispositivo</Label>
              <Select value={formData.deviceType} onValueChange={value => setFormData({
              ...formData,
              deviceType: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes?.map(type => <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deviceModel">Modelo do Aparelho*</Label>
              <Input id="deviceModel" value={formData.deviceModel} onChange={e => setFormData({
              ...formData,
              deviceModel: e.target.value
            })} placeholder="Ex: iPhone 12, Redmi Note 8" required />
            </div>

            <div>
              <Label htmlFor="issue">Defeito do Dispositivo</Label>
              <Textarea id="issue" value={formData.issue} onChange={e => setFormData({
              ...formData,
              issue: e.target.value
            })} placeholder="Descreva o problema ou defeito do aparelho..." className="min-h-[80px]" />
            </div>

            <div>
              <Label htmlFor="partType">Qual serviço será realizado?*</Label>
              <Input id="partType" value={formData.partType} onChange={e => setFormData({
              ...formData,
              partType: e.target.value
            })} placeholder="Ex: Troca de tela, Troca de bateria, Limpeza..." required />
            </div>

            <div>
              <Label htmlFor="brand">Qualidade da peça</Label>
              <Input id="brand" value={formData.brand} onChange={e => setFormData({
              ...formData,
              brand: e.target.value
            })} placeholder="Ex: Peça original, Incell, OLED, Compatível..." />
            </div>

            <div>
              <Label htmlFor="warranty">Garantia</Label>
              <Select value={formData.warrantyMonths.toString()} onValueChange={value => setFormData({
              ...formData,
              warrantyMonths: parseInt(value)
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {warrantyPeriods?.map(period => <SelectItem key={period.id} value={period.months.toString()}>
                      {period.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Client Section - usando o mesmo componente do formulário de edição */}
        <ClientSection
          formData={{
            client_name: formData.clientName || '',
            client_phone: formData.clientPhone || ''
          }}
          existingClients={secureClients}
          showClientSearch={showClientSearch}
          clientSearchTerm={clientSearchTerm}
          isLoadingClients={isLoadingClients}
          onInputChange={(field, value) => {
            if (field === 'client_name') {
              handleInputChange('clientName', value);
            } else if (field === 'client_phone') {
              handleInputChange('clientPhone', value);
            }
          }}
          onToggleClientSearch={handleToggleClientSearch}
          onSearchTermChange={handleSearchTermChange}
          onClientSelect={handleClientSelect}
        />

        <Card>
          <CardHeader>
            <CardTitle>Preços e Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cashPrice">Valor à Vista (R$)*</Label>
              <Input id="cashPrice" type="number" step="0.01" value={formData.cashPrice} onChange={e => setFormData({
              ...formData,
              cashPrice: e.target.value
            })} placeholder="0,00" required />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="enableInstallmentPrice" checked={formData.enableInstallmentPrice} onCheckedChange={checked => setFormData({
              ...formData,
              enableInstallmentPrice: checked
            })} />
              <Label htmlFor="enableInstallmentPrice">Ativar valor parcelado</Label>
            </div>

            {formData.enableInstallmentPrice && <>
                <div>
                  <Label htmlFor="installmentPrice">Valor Parcelado (R$)</Label>
                  <Input id="installmentPrice" type="number" step="0.01" value={formData.installmentPrice} onChange={e => setFormData({
                ...formData,
                installmentPrice: e.target.value
              })} placeholder="0,00" />
                </div>

                <div>
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Select value={formData.installments.toString()} onValueChange={value => setFormData({
                ...formData,
                installments: parseInt(value)
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({
                    length: 12
                  }, (_, i) => i + 1).map(installment => <SelectItem key={installment} value={installment.toString()}>
                          {`${installment}x`}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>}

            <div>
              <Label htmlFor="paymentCondition">Método de Pagamento</Label>
              <Select value={formData.paymentCondition} onValueChange={value => setFormData({
              ...formData,
              paymentCondition: value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À Vista">À Vista</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="validityDays">Validade do Orçamento (dias)</Label>
              <Input id="validityDays" type="number" min="1" max="365" value={formData.validityDays} onChange={e => setFormData({
              ...formData,
              validityDays: e.target.value
            })} placeholder="15" />
              <p className="text-sm mt-1 text-[#b3b2b2]">
                O orçamento será válido por {formData.validityDays || '15'} dias a partir da criação
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="delivery" checked={formData.includesDelivery} onCheckedChange={checked => setFormData({
              ...formData,
              includesDelivery: checked as boolean
            })} />
              <Label htmlFor="delivery">Incluir entrega e busca</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="screenProtector" checked={formData.includesScreenProtector} onCheckedChange={checked => setFormData({
              ...formData,
              includesScreenProtector: checked as boolean
            })} />
              <Label htmlFor="screenProtector">Incluir película de brinde</Label>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
              ...formData,
              notes: e.target.value
            })} placeholder="Observações adicionais sobre o orçamento..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={createBudgetMutation.isPending}>
            {createBudgetMutation.isPending ? 'Criando...' : 'Criar Orçamento'}
          </Button>
        </div>
      </form>
    </div>;
};
