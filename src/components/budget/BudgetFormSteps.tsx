import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Smartphone, DollarSign, Settings, User } from 'lucide-react';
import { BudgetBreadcrumbs } from './BudgetBreadcrumbs';
import { BudgetFormSkeleton } from './BudgetFormSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
interface BudgetFormStepsProps {
  onBack: () => void;
  initialData?: any;
}
interface FormData {
  // Step 1: Client Info
  clientName: string;
  clientPhone: string;

  // Step 2: Device Info
  deviceType: string;
  deviceModel: string;

  // Step 3: Service Info
  quality: string;

  // Step 4: Pricing
  cashPrice: string;
  installmentPrice: string;
  installments: number;
  enableInstallmentPrice: boolean;
  paymentCondition: string;
  warrantyMonths: number;
  validityDays: string;
  includesDelivery: boolean;
  includesScreenProtector: boolean;
  notes: string;
}
const steps = [{
  id: 'client',
  title: 'Cliente',
  description: 'Dados do cliente',
  icon: User
}, {
  id: 'device',
  title: 'Dispositivo',
  description: 'Informações do aparelho',
  icon: Smartphone
}, {
  id: 'service',
  title: 'Serviço',
  description: 'Tipo de serviço',
  icon: Settings
}, {
  id: 'pricing',
  title: 'Valores',
  description: 'Preços e condições',
  icon: DollarSign
}];
export const BudgetFormSteps = ({
  onBack,
  initialData
}: BudgetFormStepsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [warrantyPeriods, setWarrantyPeriods] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [defaultClient, setDefaultClient] = useState<any>(null);
  const {
    user
  } = useAuth();
  const {
    showSuccess,
    showError
  } = useToast();
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    deviceType: 'Celular',
    deviceModel: '',
    quality: '',
    cashPrice: '',
    installmentPrice: '',
    installments: 1,
    enableInstallmentPrice: true,
    paymentCondition: 'Cartão de Crédito',
    warrantyMonths: 3,
    validityDays: '15',
    includesDelivery: false,
    includesScreenProtector: false,
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    // Verificar se há dados copiados no localStorage
    const copiedData = localStorage.getItem('budgetCopyData');
    let dataToLoad = initialData;
    if (copiedData) {
      localStorage.removeItem('budgetCopyData'); // Limpar após uso
      try {
        dataToLoad = JSON.parse(copiedData);
      } catch (error) {
        console.error('Erro ao carregar dados copiados:', error);
      }
    }
    if (dataToLoad) {
      setFormData({
        clientName: dataToLoad.clientName || dataToLoad.client_name || '',
        clientPhone: dataToLoad.clientPhone || dataToLoad.client_phone || '',
        deviceType: dataToLoad.deviceType || dataToLoad.device_type || 'Celular',
        deviceModel: dataToLoad.deviceModel || dataToLoad.device_model || '',
        quality: dataToLoad.partType || dataToLoad.quality || dataToLoad.part_type || '',
        cashPrice: dataToLoad.cashPrice || (dataToLoad.cash_price ? (dataToLoad.cash_price / 100).toString() : ''),
        installmentPrice: dataToLoad.installmentPrice || (dataToLoad.installment_price ? (dataToLoad.installment_price / 100).toString() : ''),
        installments: dataToLoad.installments || 1,
        enableInstallmentPrice: dataToLoad.enableInstallmentPrice || !!dataToLoad.installment_price,
        paymentCondition: dataToLoad.paymentCondition || dataToLoad.payment_condition || 'Cartão de Crédito',
        warrantyMonths: dataToLoad.warrantyMonths || dataToLoad.warranty_months || 3,
        validityDays: dataToLoad.validityDays || '15',
        includesDelivery: dataToLoad.includesDelivery || dataToLoad.includes_delivery || false,
        includesScreenProtector: dataToLoad.includesScreenProtector || dataToLoad.includes_screen_protector || false,
        notes: dataToLoad.notes || ''
      });
    }
  }, [initialData]);

  // Load static data
  useEffect(() => {
    const loadStaticData = async () => {
      setIsLoading(true);
      try {
        // Load device types
        const {
          data: deviceTypesData
        } = await supabase.from('device_types').select('*').order('name');
        if (deviceTypesData) setDeviceTypes(deviceTypesData);

        // Load warranty periods
        const {
          data: warrantyData
        } = await supabase.from('warranty_periods').select('*').order('months');
        if (warrantyData) setWarrantyPeriods(warrantyData);

        // Load clients
        const {
          data: clientsData
        } = await supabase.from('clients').select('*').eq('user_id', user?.id).order('name');
        if (clientsData) {
          setClients(clientsData);
          // Find default client
          const defaultClient = clientsData.find(client => client.is_default);
          setDefaultClient(defaultClient);
        }
      } catch (error) {
        console.error('Error loading static data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStaticData();
  }, [user?.id]);
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        // Client Info
        return !!formData.clientName;
      case 1:
        // Device Info
        return !!formData.deviceModel;
      case 2:
        // Service Info
        return !!formData.quality;
      case 3:
        // Pricing
        return !!formData.cashPrice;
      default:
        return false;
    }
  };
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      showError({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios antes de continuar.'
      });
    }
  };
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  const handleSubmit = async () => {
    if (!user) {
      showError({
        title: 'Usuário não autenticado',
        description: 'Você precisa estar logado para criar orçamentos.'
      });
      return;
    }
    if (!validateStep(currentStep)) {
      showError({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios antes de finalizar.'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const cashPriceValue = parseFloat(formData.cashPrice) || 0;
      const installmentPriceValue = parseFloat(formData.installmentPrice) || 0;
      const validityDays = parseInt(formData.validityDays) || 15;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      // Create budget
      const {
        data: budget,
        error: budgetError
      } = await supabase.from('budgets').insert({
        owner_id: user.id,
        device_type: formData.deviceType,
        device_model: formData.deviceModel,
        part_quality: formData.quality,
        part_type: formData.quality,
        warranty_months: formData.warrantyMonths,
        cash_price: Math.round(cashPriceValue * 100),
        installment_price: formData.enableInstallmentPrice ? Math.round(installmentPriceValue * 100) : null,
        installments: formData.enableInstallmentPrice ? formData.installments : 1,
        total_price: Math.round(cashPriceValue * 100),
        includes_delivery: formData.includesDelivery,
        includes_screen_protector: formData.includesScreenProtector,
        notes: formData.notes,
        status: 'pending',
        valid_until: validUntil.toISOString(),
        payment_condition: formData.paymentCondition,
        client_name: formData.clientName || null,
        client_phone: formData.clientPhone || null,
        workflow_status: 'pending',
        expires_at: validUntil.toISOString().split('T')[0]
      }).select('id').single();
      if (budgetError) throw budgetError;

      // Create budget part
      const {
        error: partError
      } = await supabase.from('budget_parts').insert({
        budget_id: budget.id,
        name: `${formData.quality} - ${formData.deviceModel}`,
        part_type: formData.quality,
        brand_id: null,
        quantity: 1,
        price: Math.round(cashPriceValue * 100),
        cash_price: Math.round(cashPriceValue * 100),
        installment_price: formData.enableInstallmentPrice ? Math.round(installmentPriceValue * 100) : null,
        warranty_months: formData.warrantyMonths
      });
      if (partError) throw partError;
      showSuccess({
        title: 'Orçamento criado com sucesso!',
        description: `O orçamento foi criado e está válido por ${validityDays} dias.`
      });
      onBack();
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      showError({
        title: 'Erro ao criar orçamento',
        description: error.message || 'Ocorreu um erro ao salvar o orçamento. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const breadcrumbItems = [{
    label: 'Dashboard',
    onClick: onBack
  }, {
    label: 'Novo Orçamento',
    active: true
  }];
  if (isLoading) {
    return <BudgetFormSkeleton />;
  }
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Client Info
        return <div className="space-y-6">
            <Card className="border-primary/20 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input type="search" inputMode="search" placeholder="Buscar Cliente" value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <Button variant="outline" size="sm" className="px-4" onClick={() => {
                  if (defaultClient) {
                    updateFormData('clientName', defaultClient.name);
                    updateFormData('clientPhone', defaultClient.phone || '');
                    setClientSearch('');
                    showSuccess({
                      title: "Cliente selecionado",
                      description: `Cliente padrão "${defaultClient.name}" foi selecionado.`
                    });
                  }
                }} disabled={!defaultClient}>
                    Selecionar Cliente Padrão
                  </Button>
                </div>

                {/* Lista de clientes filtrados */}
                {clientSearch && <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                    {clients.filter(client => client.name.toLowerCase().includes(clientSearch.toLowerCase()) || client.phone?.toLowerCase().includes(clientSearch.toLowerCase())).map(client => <div key={client.id} className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0" onClick={() => {
                  updateFormData('clientName', client.name);
                  updateFormData('clientPhone', client.phone || '');
                  setClientSearch('');
                  showSuccess({
                    title: "Cliente selecionado",
                    description: `Cliente "${client.name}" foi selecionado.`
                  });
                }}>
                          <div className="font-medium text-foreground">{client.name}</div>
                          {client.phone && <div className="text-sm text-muted-foreground">{client.phone}</div>}
                        </div>)}
                    {clients.filter(client => client.name.toLowerCase().includes(clientSearch.toLowerCase()) || client.phone?.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && <div className="p-3 text-sm text-muted-foreground text-center">
                        Nenhum cliente encontrado
                      </div>}
                  </div>}

                <div>
                  <Label htmlFor="clientName" className="text-sm font-medium text-foreground">
                    Nome do Cliente
                  </Label>
                  <Input id="clientName" value={formData.clientName} onChange={e => updateFormData('clientName', e.target.value)} placeholder="Nome completo do cliente" className="mt-1" required />
                </div>

                <div>
                  <Label htmlFor="clientPhone" className="text-sm font-medium text-foreground">
                    Telefone do Cliente
                  </Label>
                  <Input id="clientPhone" type="tel" inputMode="tel" value={formData.clientPhone} onChange={e => updateFormData('clientPhone', e.target.value)} placeholder="(00) 00000-0000" className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>;
      case 1:
        // Device Info
        return <div className="space-y-6">
            <Card className="border-primary/20 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  Dispositivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deviceType" className="text-sm font-medium text-foreground">
                    Tipo de Dispositivo
                  </Label>
                  <Select value={formData.deviceType} onValueChange={value => updateFormData('deviceType', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map(type => <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deviceModel" className="text-sm font-medium text-foreground">Aparelho/Serviço</Label>
                  <Input id="deviceModel" value={formData.deviceModel} onChange={e => updateFormData('deviceModel', e.target.value)} placeholder="Ex: Tela iPhone 12, Troca de bateria Galaxy S23" className="mt-1" required />
                </div>
              </CardContent>
            </Card>
          </div>;
      case 2:
        // Service Info
        return <div className="space-y-6">
            <Card className="border-primary/20 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-primary" />
                  </div>
                  Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quality" className="text-sm font-medium text-foreground">Qualidade </Label>
                  <Input id="quality" value={formData.quality} onChange={e => updateFormData('quality', e.target.value)} placeholder="Ex: Nacional, Original, Importada" className="mt-1" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="warrantyMonths" className="text-sm font-medium text-foreground">
                      Garantia (meses)
                    </Label>
                    <Select value={formData.warrantyMonths.toString()} onValueChange={value => updateFormData('warrantyMonths', parseInt(value))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {warrantyPeriods.map(period => <SelectItem key={period.id} value={period.months.toString()}>
                            {period.months} {period.months === 1 ? 'mês' : 'meses'}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="validityDays" className="text-sm font-medium text-foreground">
                      Validade (dias)
                    </Label>
                    <Input id="validityDays" type="number" inputMode="numeric" value={formData.validityDays} onChange={e => updateFormData('validityDays', e.target.value)} placeholder="15" className="mt-1" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="includesDelivery" checked={formData.includesDelivery} onCheckedChange={checked => updateFormData('includesDelivery', checked)} />
                    <Label htmlFor="includesDelivery" className="text-sm font-medium text-foreground">
                      Inclui entrega
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox id="includesScreenProtector" checked={formData.includesScreenProtector} onCheckedChange={checked => updateFormData('includesScreenProtector', checked)} />
                    <Label htmlFor="includesScreenProtector" className="text-sm font-medium text-foreground">
                      Inclui película protetora
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>;
      case 3:
        // Pricing
        return <div className="space-y-6">
            <Card className="border-primary/20 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cashPrice" className="text-sm font-medium text-foreground">Valor à Vista (R$) </Label>
                  <Input id="cashPrice" type="number" inputMode="decimal" step="0.01" value={formData.cashPrice} onChange={e => updateFormData('cashPrice', e.target.value)} placeholder="0,00" className="mt-1" required />
                </div>

                <div className="flex items-center space-x-3">
                  <Switch id="enableInstallmentPrice" checked={formData.enableInstallmentPrice} onCheckedChange={checked => updateFormData('enableInstallmentPrice', checked)} />
                  <Label htmlFor="enableInstallmentPrice" className="text-sm font-medium text-foreground">
                    Ativar valor parcelado
                  </Label>
                </div>

                {formData.enableInstallmentPrice && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installmentPrice" className="text-sm font-medium text-foreground">
                        Valor Parcelado (R$)
                      </Label>
                      <Input id="installmentPrice" type="number" inputMode="decimal" step="0.01" value={formData.installmentPrice} onChange={e => updateFormData('installmentPrice', e.target.value)} placeholder="0,00" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="installments" className="text-sm font-medium text-foreground">
                        Parcelas
                      </Label>
                      <Select value={formData.installments.toString()} onValueChange={value => updateFormData('installments', parseInt(value))}>
                        <SelectTrigger className="mt-1">
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
                  </div>}

                <div>
                  <Label htmlFor="paymentCondition" className="text-sm font-medium text-foreground">
                    Método de Pagamento
                  </Label>
                  <Select value={formData.paymentCondition} onValueChange={value => updateFormData('paymentCondition', value)}>
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Observações
                  </Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => updateFormData('notes', e.target.value)} placeholder="Observações adicionais sobre o orçamento..." className="mt-1 min-h-[80px]" />
                </div>
              </CardContent>
            </Card>
          </div>;
      default:
        return null;
    }
  };
  return <div className="min-h-[100dvh] bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Breadcrumbs */}
        <BudgetBreadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Novo Orçamento</h1>
          <p className="text-muted-foreground">Preencha as informações para criar o orçamento</p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Etapa {currentStep + 1} de {steps.length}
            </span>
            <span className="text-sm font-medium text-foreground">
              {Math.round((currentStep + 1) / steps.length * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" style={{
            width: `${(currentStep + 1) / steps.length * 100}%`
          }} />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.includes(index);
          const isPast = index < currentStep;
          return <div key={step.id} className="flex flex-col items-center">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200", isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : isCompleted || isPast ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border-2 border-border")}>
                  {isCompleted || isPast ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={cn("mt-2 text-xs font-medium text-center", isActive ? "text-primary" : "text-muted-foreground")}>
                  {step.title}
                </span>
              </div>;
        })}
        </div>

        {/* Form Content */}
        <div className="animate-fade-in">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button variant="outline" onClick={currentStep === 0 ? onBack : handlePrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Voltar' : 'Anterior'}
          </Button>

          {currentStep < steps.length - 1 ? <Button onClick={handleNext} className="flex items-center gap-2" disabled={!validateStep(currentStep)}>
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button> : <Button onClick={handleSubmit} disabled={isSubmitting || !validateStep(currentStep)} className="flex items-center gap-2">
              {isSubmitting ? <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </> : <>
                  <Check className="w-4 h-4" />
                  Criar Orçamento
                </>}
            </Button>}
        </div>
      </div>
    </div>;
};