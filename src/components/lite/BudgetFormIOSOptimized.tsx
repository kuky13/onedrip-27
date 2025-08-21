import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Smartphone, User, DollarSign, Settings, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BudgetFormIOSOptimizedProps {
  onBack: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

interface FormData {
  deviceType: string;
  deviceModel: string;
  issue: string;
  partType: string;
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

export const BudgetFormIOSOptimized = ({
  onBack,
  initialData,
  mode = 'create'
}: BudgetFormIOSOptimizedProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [searchClient, setSearchClient] = useState('');
  const [showClientList, setShowClientList] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    deviceType: 'Celular',
    deviceModel: '',
    issue: '',
    partType: '',
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

  // Carregar dados iniciais se for edição
  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceType: initialData.device_type || 'Celular',
        deviceModel: initialData.device_model || '',
        issue: initialData.issue || '',
        partType: initialData.part_type || '',
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

  // Carregar clientes existentes com fetch simples
  useEffect(() => {
    const loadClients = async () => {
      if (!user?.id) return;
      
      setIsLoadingClients(true);
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('client_name, client_phone, id')
          .eq('owner_id', user.id)
          .not('client_name', 'is', null)
          .not('client_name', 'eq', '')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Remover duplicatas baseado no nome do cliente
        const uniqueClients = data.filter((budget, index, self) => 
          budget.client_name && 
          index === self.findIndex(b => b.client_name === budget.client_name)
        );

        setExistingClients(uniqueClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, [user?.id]);

  // Filtrar clientes baseado na busca
  useEffect(() => {
    if (!searchClient.trim()) {
      setFilteredClients(existingClients);
      return;
    }
    
    const filtered = existingClients.filter(client => 
      client.client_name?.toLowerCase().includes(searchClient.toLowerCase()) ||
      client.client_phone?.includes(searchClient)
    );
    setFilteredClients(filtered);
  }, [existingClients, searchClient]);

  // Função para selecionar cliente existente
  const handleSelectClient = (client: any) => {
    setSelectedClientId(client.id);
    setFormData({
      ...formData,
      clientName: client.client_name || '',
      clientPhone: client.client_phone || ''
    });
    setSearchClient('');
    setShowClientList(false);
  };

  // Função para criar novo cliente
  const handleNewClient = () => {
    setSelectedClientId('new');
    setFormData({
      ...formData,
      clientName: '',
      clientPhone: ''
    });
    setSearchClient('');
    setShowClientList(false);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSubmitSuccess(message);
      setSubmitError('');
      setTimeout(() => setSubmitSuccess(''), 3000);
    } else {
      setSubmitError(message);
      setSubmitSuccess('');
      setTimeout(() => setSubmitError(''), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showToast('Usuário não encontrado. Faça login novamente.', 'error');
      return;
    }

    if (!formData.deviceModel.trim() || !formData.partType.trim()) {
      showToast('Modelo do aparelho e tipo de serviço são obrigatórios.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

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
        client_id: null,
        workflow_status: 'pending',
        expires_at: validUntil.toISOString().split('T')[0]
      };

      let result;
      if (mode === 'edit' && initialData?.id) {
        const { data, error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', initialData.id)
          .select('id')
          .single();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('budgets')
          .insert(budgetData)
          .select('id')
          .single();
        result = { data, error };
      }

      if (result.error) throw result.error;

      if (mode === 'create') {
        // Criar item do orçamento para novo orçamento
        const { error: partError } = await supabase
          .from('budget_parts')
          .insert({
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

      showToast(
        mode === 'edit' 
          ? 'Orçamento atualizado com sucesso!' 
          : `Orçamento criado e válido por ${validityDays} dias!`,
        'success'
      );

      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error: any) {
      console.error('Error saving budget:', error);
      showToast(error.message || 'Ocorreu um erro ao salvar o orçamento.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      {/* Header fixo */}
      <div className="flex items-center p-4 border-b bg-background">
        <Button variant="ghost" onClick={onBack} className="mr-2" disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">
          {mode === 'edit' ? 'Editar Orçamento' : 'Novo Orçamento'}
        </h1>
      </div>

      {/* Mensagens de feedback */}
      {submitSuccess && (
        <div className="mx-4 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">{submitSuccess}</p>
        </div>
      )}

      {submitError && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
        </div>
      )}

      {/* Conteúdo scrollável */}
      <div className="flex-1" style={{ 
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}>
        <div className="p-4">
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
                  <Select 
                    value={formData.deviceType} 
                    onValueChange={value => setFormData({ ...formData, deviceType: value })}
                  >
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
                  <Input 
                    type="text" 
                    inputMode="text"
                    value={formData.deviceModel}
                    onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                    placeholder="Ex: iPhone 12, Redmi Note 8"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Defeito do Dispositivo</Label>
                  <Textarea 
                    value={formData.issue}
                    onChange={e => setFormData({ ...formData, issue: e.target.value })}
                    placeholder="Descreva o problema do aparelho..."
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Qualidade da peça*</Label>
                  <Input 
                    type="text" 
                    inputMode="text"
                    value={formData.partType}
                    onChange={e => setFormData({ ...formData, partType: e.target.value })}
                    placeholder="Ex: Original importada, Gold, Incel..."
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Garantia</Label>
                  <Select 
                    value={formData.warrantyMonths.toString()}
                    onValueChange={value => setFormData({ ...formData, warrantyMonths: parseInt(value) })}
                  >
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
                {/* Opção Cliente Padrão */}
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClientId('default');
                      setFormData({
                        ...formData,
                        clientName: 'Cliente Padrão',
                        clientPhone: '(00) 00000-0000'
                      });
                      setSearchClient('');
                      setShowClientList(false);
                    }}
                    className="w-full text-left justify-start"
                  >
                    👤 Selecionar Cliente Padrão
                  </Button>
                </div>

                {/* Campo de busca de clientes - otimizado para iOS */}
                {!isLoadingClients && existingClients.length > 0 && (
                  <div className="relative">
                    <Label className="text-sm font-medium text-foreground">
                      Buscar Cliente Existente
                    </Label>
                    <Input 
                      type="search"
                      inputMode="search"
                      value={searchClient}
                      onChange={e => {
                        setSearchClient(e.target.value);
                        setShowClientList(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowClientList(searchClient.length > 0)}
                      placeholder="Digite nome ou telefone..."
                      className="mt-1"
                    />
                    
                    {/* Lista de clientes filtrados - posicionamento seguro para iOS */}
                    {showClientList && filteredClients.length > 0 && (
                      <div className="mt-2 border border-border rounded-lg bg-popover shadow-lg">
                        <div className="p-2 border-b border-border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleNewClient}
                            className="w-full text-left justify-start text-primary"
                          >
                            + Novo Cliente
                          </Button>
                        </div>
                        <div className="max-h-[200px]" style={{ 
                          overflowY: 'auto',
                          WebkitOverflowScrolling: 'touch'
                        }}>
                          {filteredClients.map(client => (
                            <Button
                              key={client.id}
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectClient(client)}
                              className="w-full text-left justify-start p-3 h-auto"
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium text-foreground">
                                  {client.client_name}
                                </span>
                                {client.client_phone && (
                                  <span className="text-xs text-muted-foreground">
                                    {client.client_phone}
                                  </span>
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Mensagem quando não há resultados */}
                    {showClientList && searchClient.length > 0 && filteredClients.length === 0 && (
                      <div className="mt-2 p-3 border border-border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhum cliente encontrado
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleNewClient}
                          className="w-full mt-2"
                        >
                          + Criar Novo Cliente
                        </Button>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite para buscar clientes existentes ou criar novo
                    </p>
                  </div>
                )}

                {/* Cliente selecionado - indicador visual */}
                {selectedClientId && selectedClientId !== 'new' && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary">
                      ✓ Cliente selecionado: {formData.clientName}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleNewClient}
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      Limpar seleção
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-foreground">Nome do Cliente</Label>
                  <Input 
                    type="text" 
                    inputMode="text"
                    value={formData.clientName}
                    onChange={e => {
                      setFormData({ ...formData, clientName: e.target.value });
                      // Se está editando manualmente, limpar seleção
                      if (selectedClientId && selectedClientId !== 'new') {
                        setSelectedClientId('new');
                      }
                    }}
                    placeholder="Nome completo do cliente"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Telefone do Cliente</Label>
                  <Input 
                    type="search"
                    inputMode="search"
                    value={formData.clientPhone}
                    onChange={e => {
                      setFormData({ ...formData, clientPhone: e.target.value });
                      // Se está editando manualmente, limpar seleção
                      if (selectedClientId && selectedClientId !== 'new') {
                        setSelectedClientId('new');
                      }
                    }}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>

                {/* Loading de clientes */}
                {isLoadingClients && (
                  <div className="p-3 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Carregando clientes...
                    </p>
                  </div>
                )}
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
                  <Input 
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.cashPrice}
                    onChange={e => setFormData({ ...formData, cashPrice: e.target.value })}
                    placeholder="0,00"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableInstallmentPrice"
                    checked={formData.enableInstallmentPrice}
                    onCheckedChange={checked => setFormData({ ...formData, enableInstallmentPrice: checked })}
                  />
                  <Label htmlFor="enableInstallmentPrice" className="text-sm font-medium text-foreground">
                    Ativar valor parcelado
                  </Label>
                </div>

                {formData.enableInstallmentPrice && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-foreground">Valor Parcelado (R$)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={formData.installmentPrice}
                        onChange={e => setFormData({ ...formData, installmentPrice: e.target.value })}
                        placeholder="0,00"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-foreground">Número de Parcelas</Label>
                      <Select 
                        value={formData.installments.toString()}
                        onValueChange={value => setFormData({ ...formData, installments: parseInt(value) })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-sm font-medium text-foreground">Método de Pagamento</Label>
                  <Select 
                    value={formData.paymentCondition}
                    onValueChange={value => setFormData({ ...formData, paymentCondition: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Validade do Orçamento</Label>
                  <Select 
                    value={formData.validityDays}
                    onValueChange={value => setFormData({ ...formData, validityDays: value })}
                  >
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
                </div>
              </CardContent>
            </Card>

            {/* Opções Adicionais */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Settings className="h-5 w-5 text-primary" />
                  Opções Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="includesDelivery"
                    checked={formData.includesDelivery}
                    onCheckedChange={checked => setFormData({ ...formData, includesDelivery: checked })}
                  />
                  <Label htmlFor="includesDelivery" className="text-sm font-medium text-foreground">
                    Inclui entrega
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="includesScreenProtector"
                    checked={formData.includesScreenProtector}
                    onCheckedChange={checked => setFormData({ ...formData, includesScreenProtector: checked })}
                  />
                  <Label htmlFor="includesScreenProtector" className="text-sm font-medium text-foreground">
                    Inclui película protetora
                  </Label>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground">Observações</Label>
                  <Textarea 
                    value={formData.observations}
                    onChange={e => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Observações adicionais sobre o orçamento..."
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      {/* Footer fixo com botão de submit */}
      <div className="p-4 border-t bg-background">
        <Button 
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 text-lg font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {mode === 'edit' ? 'Salvando...' : 'Criando...'}
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              {mode === 'edit' ? 'Salvar Alterações' : 'Criar Orçamento'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
