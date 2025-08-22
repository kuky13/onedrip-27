import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Smartphone, User, DollarSign, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface BudgetFormLiteProps {
  onBack: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

interface FormData {
  deviceType: string;
  deviceModel: string;
  issue: string;
  partType: string;
  brand: string;
  warrantyMonths: number;
  cashPrice: string;
  installmentPrice: string;
  installments: number;
  enableInstallmentPrice: boolean;
  paymentCondition: string;
  validityDays: string;
  clientName: string;
  clientPhone: string;
  includesDelivery: boolean;
  includesScreenProtector: boolean;
  observations: string;
}

export const BudgetFormLite = ({
  onBack,
  initialData,
  mode = 'create'
}: BudgetFormLiteProps) => {
  const {
    user
  } = useAuth();
  const {
    showSuccess,
    showError
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [warrantyPeriods, setWarrantyPeriods] = useState<any[]>([]);
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    deviceType: 'Celular',
    deviceModel: '',
    issue: '',
    partType: '',
    brand: '',
    warrantyMonths: 3,
    cashPrice: '',
    installmentPrice: '',
    installments: 1,
    enableInstallmentPrice: false,
    paymentCondition: 'Cartão de Crédito',
    validityDays: '15',
    clientName: '',
    clientPhone: '',
    includesDelivery: false,
    includesScreenProtector: false,
    observations: ''
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
        enableInstallmentPrice: !!initialData.installment_price,
        paymentCondition: initialData.payment_condition || 'Cartão de Crédito',
        validityDays: '15',
        clientName: initialData.client_name || '',
        clientPhone: initialData.client_phone || '',
        includesDelivery: initialData.includes_delivery || false,
        includesScreenProtector: initialData.includes_screen_protector || false,
        observations: initialData.notes || ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        // Buscar tipos de dispositivo, períodos de garantia e clientes em paralelo
        const [typesResult, warrantiesResult, clientsResult] = await Promise.all([supabase.from('device_types').select('*').order('name').abortSignal(controller.signal), supabase.from('warranty_periods').select('*').order('months').abortSignal(controller.signal), supabase.from('clients').select('id, name, phone, email').order('created_at', {
          ascending: false
        }).abortSignal(controller.signal)]);
        if (typesResult.data) setDeviceTypes(typesResult.data);
        if (warrantiesResult.data) setWarrantyPeriods(warrantiesResult.data);
        if (clientsResult.data) setExistingClients(clientsResult.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading data:', error);
        }
      }
    };
    loadData();
    return () => {
      controller.abort();
    };
  }, []);

  // Função para selecionar cliente existente
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'new') {
      // Limpar campos para novo cliente
      setFormData({
        ...formData,
        clientName: '',
        clientPhone: ''
      });
    } else if (clientId) {
      // Preencher com dados do cliente selecionado
      const selectedClient = existingClients.find(c => c.id === clientId);
      if (selectedClient) {
        setFormData({
          ...formData,
          clientName: selectedClient.name || '',
          clientPhone: selectedClient.phone || ''
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showError({
        title: 'Erro de autenticação',
        description: 'Usuário não encontrado. Faça login novamente.'
      });
      return;
    }
    if (!formData.deviceModel.trim() || !formData.partType.trim()) {
      showError({
        title: 'Campos obrigatórios',
        description: 'Modelo do aparelho e tipo de serviço são obrigatórios.'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const validityDays = parseInt(formData.validityDays) || 15;
      const cashPriceValue = parseFloat(formData.cashPrice) || 0;
      const installmentPriceValue = parseFloat(formData.installmentPrice) || 0;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);
      const budgetData = {
        owner_id: user.id,
        device_type: formData.deviceType,
        device_model: formData.deviceModel,
        issue: formData.issue,
        part_quality: formData.issue,
        part_type: formData.partType,
        warranty_months: formData.warrantyMonths,
        cash_price: Math.round(cashPriceValue * 100),
        installment_price: formData.enableInstallmentPrice ? Math.round(installmentPriceValue * 100) : null,
        installments: formData.enableInstallmentPrice ? formData.installments : 1,
        total_price: Math.round(cashPriceValue * 100),
        includes_delivery: formData.includesDelivery,
        includes_screen_protector: formData.includesScreenProtector,
        notes: formData.observations,
        status: 'pending',
        valid_until: validUntil.toISOString(),
        payment_condition: formData.paymentCondition,
        client_name: formData.clientName.trim() || null,
        client_phone: formData.clientPhone.trim() || null,
        client_id: selectedClientId && selectedClientId !== 'new' ? selectedClientId : null,
        workflow_status: 'pending',
        expires_at: validUntil.toISOString().split('T')[0]
      };
      let result;
      if (mode === 'edit' && initialData?.id) {
        const {
          data,
          error
        } = await supabase.from('budgets').update(budgetData).eq('id', initialData.id).select('id').single();
        result = {
          data,
          error
        };
      } else {
        const {
          data,
          error
        } = await supabase.from('budgets').insert(budgetData).select('id').single();
        result = {
          data,
          error
        };
      }
      if (result.error) throw result.error;
      if (mode === 'create') {
        // Criar item do orçamento para novo orçamento
        const {
          error: partError
        } = await supabase.from('budget_parts').insert({
          budget_id: result.data.id,
          name: `${formData.partType} - ${formData.deviceModel}`,
          part_type: formData.partType,
          brand_id: null,
          quantity: 1,
          price: Math.round(cashPriceValue * 100),
          cash_price: Math.round(cashPriceValue * 100),
          installment_price: formData.enableInstallmentPrice ? Math.round(installmentPriceValue * 100) : null,
          warranty_months: formData.warrantyMonths
        });
        if (partError) throw partError;
      }
      showSuccess({
        title: mode === 'edit' ? 'Orçamento atualizado!' : 'Orçamento criado!',
        description: mode === 'edit' ? 'As alterações foram salvas com sucesso.' : `Orçamento criado e válido por ${validityDays} dias.`
      });
      onBack();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      showError({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o orçamento.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="h-[100dvh] bg-background flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">
          {mode === 'edit' ? 'Editar Orçamento' : 'Novo Orçamento'}
        </h1>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Dispositivo */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Smartphone className="h-5 w-5 text-primary" />
                Informações do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Tipo de Dispositivo</Label>
                <Select value={formData.deviceType} onValueChange={value => setFormData({
                ...formData,
                deviceType: value
              })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Celular">Celular</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Notebook">Notebook</SelectItem>
                    <SelectItem value="Smartwatch">Smartwatch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Modelo do Aparelho*</Label>
                <Input type="text" inputMode="text" value={formData.deviceModel} onChange={e => setFormData({
                ...formData,
                deviceModel: e.target.value
              })} placeholder="Ex: iPhone 12, Redmi Note 8" className="mt-1" required />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Defeito do Dispositivo</Label>
                <Textarea value={formData.issue} onChange={e => setFormData({
                ...formData,
                issue: e.target.value
              })} placeholder="Descreva o problema do aparelho..." className="mt-1 min-h-[80px] resize-none" />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Qualidade da peça</Label>
                <Input type="text" inputMode="text" value={formData.partType} onChange={e => setFormData({
                ...formData,
                partType: e.target.value
              })} placeholder="Ex: Original importada, Gold, Incel..." className="mt-1" required />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Garantia</Label>
                <Select value={formData.warrantyMonths.toString()} onValueChange={value => setFormData({
                ...formData,
                warrantyMonths: parseInt(value)
              })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="1">1 mês</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Selecionar Cliente</Label>
                <Select value={selectedClientId} onValueChange={handleSelectClient}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha um cliente ou crie novo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="new">+ Novo Cliente</SelectItem>
                    {existingClients.map(client => <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          {client.phone && <span className="text-xs text-muted-foreground">{client.phone}</span>}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione um cliente existente ou escolha "Novo Cliente" para criar
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Nome do Cliente</Label>
                <Input type="text" inputMode="text" value={formData.clientName} onChange={e => {
                setFormData({
                  ...formData,
                  clientName: e.target.value
                });
                // Se está editando manualmente, limpar seleção
                if (selectedClientId && selectedClientId !== 'new') {
                  setSelectedClientId('new');
                }
              }} placeholder="Nome completo do cliente" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Telefone do Cliente</Label>
                <Input type="search" inputMode="search" value={formData.clientPhone} onChange={e => {
                setFormData({
                  ...formData,
                  clientPhone: e.target.value
                });
                // Se está editando manualmente, limpar seleção
                if (selectedClientId && selectedClientId !== 'new') {
                  setSelectedClientId('new');
                }
              }} placeholder="(00) 00000-0000" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedClientId && selectedClientId !== 'new' ? 'Cliente selecionado. Você pode editar os dados se necessário.' : 'Insira os dados do novo cliente ou selecione um existente acima.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preços e Condições */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <DollarSign className="h-5 w-5 text-primary" />
                Preços e Condições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Valor à Vista (R$)*</Label>
                <Input type="number" step="0.01" inputMode="decimal" value={formData.cashPrice} onChange={e => setFormData({
                ...formData,
                cashPrice: e.target.value
              })} placeholder="0,00" className="mt-1" required />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="enableInstallmentPrice" checked={formData.enableInstallmentPrice} onCheckedChange={checked => setFormData({
                ...formData,
                enableInstallmentPrice: checked
              })} />
                <Label htmlFor="enableInstallmentPrice" className="text-sm font-medium text-foreground">
                  Ativar valor parcelado
                </Label>
              </div>

              {formData.enableInstallmentPrice && <>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Valor Parcelado (R$)</Label>
                    <Input type="number" step="0.01" inputMode="decimal" value={formData.installmentPrice} onChange={e => setFormData({
                  ...formData,
                  installmentPrice: e.target.value
                })} placeholder="0,00" className="mt-1" />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Número de Parcelas</Label>
                    <Select value={formData.installments.toString()} onValueChange={value => setFormData({
                  ...formData,
                  installments: parseInt(value)
                })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {Array.from({
                      length: 12
                    }, (_, i) => i + 1).map(num => <SelectItem key={num} value={num.toString()}>
                            {num}x
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>}

              <div>
                <Label className="text-sm font-medium text-foreground">Método de Pagamento</Label>
                <Select value={formData.paymentCondition} onValueChange={value => setFormData({
                ...formData,
                paymentCondition: value
              })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="À Vista">À Vista</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Orçamento */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5 text-primary" />
                Configurações do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Validade do Orçamento (dias)</Label>
                <Select value={formData.validityDays} onValueChange={value => setFormData({
                ...formData,
                validityDays: value
              })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  O orçamento será válido por 15 dias a partir da criação.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="includesDelivery" checked={formData.includesDelivery} onCheckedChange={checked => setFormData({
                  ...formData,
                  includesDelivery: !!checked
                })} />
                  <Label htmlFor="includesDelivery" className="text-sm font-medium text-foreground">
                    Incluir entrega e busca
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="includesScreenProtector" checked={formData.includesScreenProtector} onCheckedChange={checked => setFormData({
                  ...formData,
                  includesScreenProtector: !!checked
                })} />
                  <Label htmlFor="includesScreenProtector" className="text-sm font-medium text-foreground">
                    Incluir película de brinde
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Observações</Label>
                <Textarea value={formData.observations} onChange={e => setFormData({
                ...formData,
                observations: e.target.value
              })} placeholder="Observações adicionais sobre o orçamento..." className="mt-1 min-h-[80px] resize-none" />
              </div>
            </CardContent>
          </Card>

          <div className="pb-6 space-y-3">
            <Button type="button" variant="outline" className="w-full" size="lg" onClick={onBack}>
              Cancelar
            </Button>
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : null}
              {isSubmitting ? mode === 'edit' ? 'Salvando...' : 'Criando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Orçamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>;
};
