
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Globe, MessageSquare, Star, Lock, Image, Zap, Shield, Users, Award, CheckCircle, Clock, Target, Eye, EyeOff } from 'lucide-react';
import { AdminImageManager } from '@/components/admin/AdminImageManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SiteSettings {
  id: string;
  plan_name: string;
  plan_description: string;
  plan_price: number;
  plan_currency: string;
  plan_period: string;
  plan_features: string[];
  payment_url: string;
  whatsapp_number: string;
  page_title: string;
  page_subtitle: string;
  popular_badge_text: string;
  cta_button_text: string;
  support_text: string;
  show_popular_badge: boolean;
  show_support_info: boolean;
  additional_info: string;
  // Benefits section
  benefits_section_title: string;
  benefits_section_subtitle: string;
  benefits_data: any[];
  show_benefits_section: boolean;
  // Testimonials section
  testimonials_section_title: string;
  testimonials_section_subtitle: string;
  testimonials_data: any[];
  show_testimonials_section: boolean;
  // FAQ section
  faq_section_title: string;
  faq_section_subtitle: string;
  faq_data: any[];
  show_faq_section: boolean;
  // Development warning section
  show_dev_warning?: boolean;
  dev_warning_title?: string;
  dev_warning_message?: string;
}

export const SiteSettingsContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newFeature, setNewFeature] = useState('');
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_role');
        if (error) {
          console.error('Error checking user role:', error);
          setUserRole(null);
        } else {
          console.log('User role:', data);
          setUserRole(data);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkUserRole();
  }, []);

  const { data: settings, isLoading, error: queryError } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      console.log('Fetching site settings...');
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching site settings:', error);
        throw error;
      }
      
      if (!data) {
        console.log('No site settings found, will show empty form');
        return null;
      }
      
      console.log('Site settings fetched:', data);
      const settingsData = data as SiteSettings;
      setLocalSettings(settingsData);
      return settingsData;
    },
    enabled: userRole === 'admin' && !isCheckingRole // Only fetch if user is admin
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<SiteSettings>) => {
      if (!settings?.id) throw new Error('Settings ID not found');
      
      console.log('Updating settings with:', updatedSettings);
      
      const { data, error } = await supabase
        .from('site_settings')
        .update(updatedSettings)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
      
      console.log('Settings updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Update mutation success, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setLocalSettings(data as SiteSettings);
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do site foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: keyof SiteSettings, value: any) => {
    if (!settings) return;
    
    console.log(`Updating field ${field} with value:`, value);
    
    // Update local state immediately for better UX
    setLocalSettings(prev => prev ? { ...prev, [field]: value } : null);
    
    // Debounce the actual save to database
    const updatedSettings = { [field]: value };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleAddFeature = () => {
    if (!newFeature.trim() || !settings) return;
    
    const updatedFeatures = [...settings.plan_features, newFeature.trim()];
    handleInputChange('plan_features', updatedFeatures);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!settings) return;
    
    const updatedFeatures = settings.plan_features.filter((_, i) => i !== index);
    handleInputChange('plan_features', updatedFeatures);
  };

  // Helper functions for managing benefits, testimonials, and FAQ
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Zap, Shield, Users, Award, Star, CheckCircle, Clock, Target
    };
    return icons[iconName] || Zap;
  };

  const handleAddBenefit = () => {
    if (!currentSettings) return;
    const newBenefit = {
      icon: "Zap",
      title: "Novo Benefício",
      description: "Descrição do benefício"
    };
    const updatedBenefits = [...(currentSettings.benefits_data || []), newBenefit];
    handleInputChange('benefits_data', updatedBenefits);
  };

  const handleRemoveBenefit = (index: number) => {
    if (!currentSettings) return;
    const updatedBenefits = currentSettings.benefits_data.filter((_, i) => i !== index);
    handleInputChange('benefits_data', updatedBenefits);
  };

  const handleUpdateBenefit = (index: number, field: string, value: string) => {
    if (!currentSettings) return;
    const updatedBenefits = [...currentSettings.benefits_data];
    updatedBenefits[index] = { ...updatedBenefits[index], [field]: value };
    handleInputChange('benefits_data', updatedBenefits);
  };

  const handleAddTestimonial = () => {
    if (!currentSettings) return;
    const newTestimonial = {
      name: "Nome do Cliente",
      role: "Cargo - Empresa",
      content: "Depoimento do cliente...",
      rating: 5
    };
    const updatedTestimonials = [...(currentSettings.testimonials_data || []), newTestimonial];
    handleInputChange('testimonials_data', updatedTestimonials);
  };

  const handleRemoveTestimonial = (index: number) => {
    if (!currentSettings) return;
    const updatedTestimonials = currentSettings.testimonials_data.filter((_, i) => i !== index);
    handleInputChange('testimonials_data', updatedTestimonials);
  };

  const handleUpdateTestimonial = (index: number, field: string, value: string | number) => {
    if (!currentSettings) return;
    const updatedTestimonials = [...currentSettings.testimonials_data];
    updatedTestimonials[index] = { ...updatedTestimonials[index], [field]: value };
    handleInputChange('testimonials_data', updatedTestimonials);
  };

  const handleAddFaq = () => {
    if (!currentSettings) return;
    const newFaq = {
      question: "Nova pergunta?",
      answer: "Resposta da pergunta..."
    };
    const updatedFaqs = [...(currentSettings.faq_data || []), newFaq];
    handleInputChange('faq_data', updatedFaqs);
  };

  const handleRemoveFaq = (index: number) => {
    if (!currentSettings) return;
    const updatedFaqs = currentSettings.faq_data.filter((_, i) => i !== index);
    handleInputChange('faq_data', updatedFaqs);
  };

  const handleUpdateFaq = (index: number, field: string, value: string) => {
    if (!currentSettings) return;
    const updatedFaqs = [...currentSettings.faq_data];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    handleInputChange('faq_data', updatedFaqs);
  };

  // Use local settings if available, otherwise fall back to server settings
  const currentSettings = localSettings || settings;

  if (isCheckingRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="bg-destructive/10 p-3 rounded-xl w-fit mx-auto">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-destructive">Acesso Restrito</h2>
          <p className="text-muted-foreground mt-2">
            Apenas usuários com role <strong>admin</strong> podem acessar as configurações do site.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Seu role atual: <Badge variant="outline">{userRole || 'Não definido'}</Badge>
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (queryError) {
    console.error('Query error:', queryError);
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-destructive">Erro ao carregar configurações: {typeof queryError === 'string' ? queryError : queryError?.message || 'Erro desconhecido'}</p>
        <p className="text-sm text-muted-foreground">
          Verifique se você tem permissões de administrador e tente novamente.
        </p>
      </div>
    );
  }

  if (!currentSettings) {
    console.log('No settings found, showing not found message');
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">Configurações não encontradas.</p>
        <p className="text-sm text-muted-foreground">
          As configurações padrão serão criadas automaticamente. Recarregue a página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Configurações do Site</h1>
          <p className="text-muted-foreground">Gerencie o conteúdo da página de planos</p>
        </div>
      </div>

      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Informações do Plano
          </CardTitle>
          <CardDescription>Configure os detalhes principais do plano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan_name">Nome do Plano</Label>
              <Input
                id="plan_name"
                value={currentSettings.plan_name}
                onChange={(e) => handleInputChange('plan_name', e.target.value)}
                placeholder="Ex: Plano Profissional"
              />
            </div>
            <div>
              <Label htmlFor="plan_description">Descrição do Plano</Label>
              <Input
                id="plan_description"
                value={currentSettings.plan_description}
                onChange={(e) => handleInputChange('plan_description', e.target.value)}
                placeholder="Ex: Para assistências técnicas..."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="plan_currency">Moeda</Label>
              <Input
                id="plan_currency"
                value={currentSettings.plan_currency}
                onChange={(e) => handleInputChange('plan_currency', e.target.value)}
                placeholder="R$"
              />
            </div>
            <div>
              <Label htmlFor="plan_price">Preço</Label>
              <Input
                id="plan_price"
                type="number"
                value={currentSettings.plan_price}
                onChange={(e) => handleInputChange('plan_price', Number(e.target.value))}
                placeholder="15"
              />
            </div>
            <div>
              <Label htmlFor="plan_period">Período</Label>
              <Input
                id="plan_period"
                value={currentSettings.plan_period}
                onChange={(e) => handleInputChange('plan_period', e.target.value)}
                placeholder="/mês"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos do Plano</CardTitle>
          <CardDescription>Gerencie a lista de funcionalidades incluídas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Digite uma nova funcionalidade"
              onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
            />
            <Button onClick={handleAddFeature} disabled={!newFeature.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
          
          <div className="space-y-2">
            {currentSettings.plan_features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{feature}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFeature(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Content */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Página</CardTitle>
          <CardDescription>Configure textos e títulos da página</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="page_title">Título Principal</Label>
            <Input
              id="page_title"
              value={currentSettings.page_title}
              onChange={(e) => handleInputChange('page_title', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="page_subtitle">Subtítulo</Label>
            <Textarea
              id="page_subtitle"
              value={currentSettings.page_subtitle}
              onChange={(e) => handleInputChange('page_subtitle', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cta_button_text">Texto do Botão</Label>
              <Input
                id="cta_button_text"
                value={currentSettings.cta_button_text}
                onChange={(e) => handleInputChange('cta_button_text', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="popular_badge_text">Texto do Badge Popular</Label>
              <Input
                id="popular_badge_text"
                value={currentSettings.popular_badge_text}
                onChange={(e) => handleInputChange('popular_badge_text', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="additional_info">Informações Adicionais</Label>
            <Input
              id="additional_info"
              value={currentSettings.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Aviso de Desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aviso de Desenvolvimento
          </CardTitle>
          <CardDescription>Configure o aviso para funcionalidades em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show_dev_warning"
              checked={currentSettings.show_dev_warning || false}
              onCheckedChange={(checked) => handleInputChange('show_dev_warning', checked)}
            />
            <Label htmlFor="show_dev_warning">Mostrar aviso de desenvolvimento</Label>
          </div>
          
          <div>
            <Label htmlFor="dev_warning_title">Título do Aviso</Label>
            <Input
              id="dev_warning_title"
              value={currentSettings.dev_warning_title || 'Funcionalidade em Desenvolvimento'}
              onChange={(e) => handleInputChange('dev_warning_title', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dev_warning_message">Mensagem do Aviso</Label>
            <Textarea
              id="dev_warning_message"
              value={currentSettings.dev_warning_message || 'Esta funcionalidade ainda está em desenvolvimento. Em breve estará disponível com melhorias completas.'}
              onChange={(e) => handleInputChange('dev_warning_message', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contato e Suporte
          </CardTitle>
          <CardDescription>Configure informações de contato e suporte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL de Pagamento */}
          <div>
            <Label htmlFor="payment_url" className="flex items-center gap-2">
              URL de Pagamento
            </Label>
            <Input
              id="payment_url"
              value={currentSettings.payment_url || 'https://mpago.la/246f2WV'}
              onChange={(e) => handleInputChange('payment_url', e.target.value)}
              placeholder="https://mpago.la/246f2WV"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Este link será usado para redirecionamento do pagamento
            </p>
          </div>
          
          <div>
            <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
            <Input
              id="whatsapp_number"
              value={currentSettings.whatsapp_number}
              onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
              placeholder="556496028022"
            />
          </div>
          
          <div>
            <Label htmlFor="support_text">Texto de Suporte</Label>
            <Input
              id="support_text"
              value={currentSettings.support_text}
              onChange={(e) => handleInputChange('support_text', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Image Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gestão de Imagens
          </CardTitle>
          <CardDescription>Faça upload e gerencie imagens do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminImageManager />
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Seção de Benefícios
          </CardTitle>
          <CardDescription>Configure a seção de vantagens do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="benefits_section_title">Título da Seção</Label>
              <Input
                id="benefits_section_title"
                value={currentSettings.benefits_section_title || ''}
                onChange={(e) => handleInputChange('benefits_section_title', e.target.value)}
                placeholder="Vantagens do OneDrip"
              />
            </div>
            <div>
              <Label htmlFor="benefits_section_subtitle">Subtítulo da Seção</Label>
              <Input
                id="benefits_section_subtitle"
                value={currentSettings.benefits_section_subtitle || ''}
                onChange={(e) => handleInputChange('benefits_section_subtitle', e.target.value)}
                placeholder="Descubra os benefícios..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Exibir Seção de Benefícios</Label>
              <p className="text-sm text-muted-foreground">Controla se a seção aparece na página</p>
            </div>
            <Switch
              checked={currentSettings.show_benefits_section}
              onCheckedChange={(checked) => handleInputChange('show_benefits_section', checked)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Benefícios</h4>
            <Button onClick={handleAddBenefit} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Benefício
            </Button>
          </div>
          
          <div className="space-y-3">
            {(currentSettings.benefits_data || []).map((benefit, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Ícone</Label>
                        <select 
                          className="w-full p-2 border rounded"
                          value={benefit.icon}
                          onChange={(e) => handleUpdateBenefit(index, 'icon', e.target.value)}
                        >
                          <option value="Zap">⚡ Zap</option>
                          <option value="Shield">🛡️ Shield</option>
                          <option value="Users">👥 Users</option>
                          <option value="Award">🏆 Award</option>
                          <option value="Star">⭐ Star</option>
                          <option value="CheckCircle">✅ CheckCircle</option>
                          <option value="Clock">🕐 Clock</option>
                          <option value="Target">🎯 Target</option>
                        </select>
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={benefit.title}
                          onChange={(e) => handleUpdateBenefit(index, 'title', e.target.value)}
                          placeholder="Título do benefício"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={benefit.description}
                        onChange={(e) => handleUpdateBenefit(index, 'description', e.target.value)}
                        placeholder="Descrição do benefício"
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBenefit(index)}
                    className="text-destructive hover:text-destructive ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Seção de Depoimentos
          </CardTitle>
          <CardDescription>Configure os depoimentos dos clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testimonials_section_title">Título da Seção</Label>
              <Input
                id="testimonials_section_title"
                value={currentSettings.testimonials_section_title || ''}
                onChange={(e) => handleInputChange('testimonials_section_title', e.target.value)}
                placeholder="O que nossos clientes dizem"
              />
            </div>
            <div>
              <Label htmlFor="testimonials_section_subtitle">Subtítulo da Seção</Label>
              <Input
                id="testimonials_section_subtitle"
                value={currentSettings.testimonials_section_subtitle || ''}
                onChange={(e) => handleInputChange('testimonials_section_subtitle', e.target.value)}
                placeholder="Depoimentos reais..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Exibir Seção de Depoimentos</Label>
              <p className="text-sm text-muted-foreground">Controla se a seção aparece na página</p>
            </div>
            <Switch
              checked={currentSettings.show_testimonials_section}
              onCheckedChange={(checked) => handleInputChange('show_testimonials_section', checked)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Depoimentos</h4>
            <Button onClick={handleAddTestimonial} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Depoimento
            </Button>
          </div>
          
          <div className="space-y-3">
            {(currentSettings.testimonials_data || []).map((testimonial, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => handleUpdateTestimonial(index, 'name', e.target.value)}
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <Label>Cargo/Empresa</Label>
                        <Input
                          value={testimonial.role}
                          onChange={(e) => handleUpdateTestimonial(index, 'role', e.target.value)}
                          placeholder="Cargo - Empresa"
                        />
                      </div>
                      <div>
                        <Label>Avaliação (estrelas)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating}
                          onChange={(e) => handleUpdateTestimonial(index, 'rating', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Depoimento</Label>
                      <Textarea
                        value={testimonial.content}
                        onChange={(e) => handleUpdateTestimonial(index, 'content', e.target.value)}
                        placeholder="Depoimento do cliente..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTestimonial(index)}
                    className="text-destructive hover:text-destructive ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Seção de FAQ
          </CardTitle>
          <CardDescription>Configure as perguntas frequentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="faq_section_title">Título da Seção</Label>
              <Input
                id="faq_section_title"
                value={currentSettings.faq_section_title || ''}
                onChange={(e) => handleInputChange('faq_section_title', e.target.value)}
                placeholder="Perguntas Frequentes"
              />
            </div>
            <div>
              <Label htmlFor="faq_section_subtitle">Subtítulo da Seção</Label>
              <Input
                id="faq_section_subtitle"
                value={currentSettings.faq_section_subtitle || ''}
                onChange={(e) => handleInputChange('faq_section_subtitle', e.target.value)}
                placeholder="Tire suas dúvidas..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Exibir Seção de FAQ</Label>
              <p className="text-sm text-muted-foreground">Controla se a seção aparece na página</p>
            </div>
            <Switch
              checked={currentSettings.show_faq_section}
              onCheckedChange={(checked) => handleInputChange('show_faq_section', checked)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Perguntas e Respostas</h4>
            <Button onClick={handleAddFaq} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar FAQ
            </Button>
          </div>
          
          <div className="space-y-3">
            {(currentSettings.faq_data || []).map((faq, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label>Pergunta</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                        placeholder="Pergunta frequente..."
                      />
                    </div>
                    <div>
                      <Label>Resposta</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                        placeholder="Resposta da pergunta..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFaq(index)}
                    className="text-destructive hover:text-destructive ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Exibição</CardTitle>
          <CardDescription>Configure elementos visuais da página</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show_popular_badge">Mostrar Badge "Popular"</Label>
              <p className="text-sm text-muted-foreground">Exibe o badge destacando o plano como popular</p>
            </div>
            <Switch
              id="show_popular_badge"
              checked={currentSettings.show_popular_badge}
              onCheckedChange={(checked) => handleInputChange('show_popular_badge', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show_support_info">Mostrar Informações de Suporte</Label>
              <p className="text-sm text-muted-foreground">Exibe as informações de suporte na parte inferior</p>
            </div>
            <Switch
              id="show_support_info"
              checked={currentSettings.show_support_info}
              onCheckedChange={(checked) => handleInputChange('show_support_info', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Badge variant="secondary" className="text-xs">
          {updateSettingsMutation.isPending ? "Salvando..." : "Todas as alterações são salvas automaticamente"}
        </Badge>
      </div>
    </div>
  );
};
