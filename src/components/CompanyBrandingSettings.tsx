import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Upload, 
  Save, 
  Eye, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Phone,
  Globe,
  Palette,
  Settings,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanyBranding, CompanyInfo, CompanyShareSettings } from '@/hooks/useCompanyBranding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CompanyFormData {
  name: string;
  logo_url: string;
  whatsapp_phone: string;
  description: string;
}

interface ShareSettingsFormData {
  show_logo: boolean;
  show_company_name: boolean;
  show_whatsapp_button: boolean;
  custom_message: string;
  theme_color: string;
}

const initialCompanyData: CompanyFormData = {
  name: '',
  logo_url: '',
  whatsapp_phone: '',
  description: ''
};

const initialShareSettings: ShareSettingsFormData = {
  show_logo: true,
  show_company_name: true,
  show_whatsapp_button: true,
  custom_message: '',
  theme_color: '#3B82F6'
};

const predefinedColors = [
  { color: '#3B82F6', name: 'Azul' },
  { color: '#10B981', name: 'Verde' },
  { color: '#F59E0B', name: 'Amarelo' },
  { color: '#EF4444', name: 'Vermelho' },
  { color: '#8B5CF6', name: 'Roxo' },
  { color: '#EC4899', name: 'Rosa' },
  { color: '#6B7280', name: 'Cinza' },
  { color: '#1F2937', name: 'Preto' }
];

export function CompanyBrandingSettings() {
  const navigate = useNavigate();
  const {
    companyInfo,
    shareSettings,
    loading,
    createCompanyInfo,
    updateCompanyInfo,
    createShareSettings,
    updateShareSettings,
    uploadLogo,
    removeLogo,
    formatPhoneNumber,
    generateWhatsAppLink,
    refreshData
  } = useCompanyBranding();

  const [companyData, setCompanyData] = useState<CompanyFormData>(initialCompanyData);
  const [shareData, setShareData] = useState<ShareSettingsFormData>(initialShareSettings);
  const [companyErrors, setCompanyErrors] = useState<Partial<CompanyFormData>>({});
  const [shareErrors, setShareErrors] = useState<Partial<ShareSettingsFormData>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (companyInfo) {
      setCompanyData({
        name: companyInfo.name || '',
        logo_url: companyInfo.logo_url || '',
        whatsapp_phone: companyInfo.whatsapp_phone || '',
        description: companyInfo.description || ''
      });
    }
  }, [companyInfo]);

  useEffect(() => {
    if (shareSettings) {
      setShareData({
        show_logo: shareSettings.show_logo ?? true,
        show_company_name: shareSettings.show_company_name ?? true,
        show_whatsapp_button: shareSettings.show_whatsapp_button ?? true,
        custom_message: shareSettings.custom_message || '',
        theme_color: shareSettings.theme_color || '#3B82F6'
      });
    }
  }, [shareSettings]);

  const validateCompanyForm = (): boolean => {
    const errors: Partial<CompanyFormData> = {};

    if (!companyData.name.trim()) {
      errors.name = 'Nome da empresa é obrigatório';
    }

    if (companyData.whatsapp_phone && !companyData.whatsapp_phone.match(/^\d{10,15}$/)) {
      errors.whatsapp_phone = 'Número de WhatsApp inválido';
    }



    setCompanyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateShareForm = (): boolean => {
    const errors: Partial<ShareSettingsFormData> = {};

    if (!shareData.theme_color) {
      errors.theme_color = 'Cor do tema é obrigatória';
    }

    setShareErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompanySubmit = async () => {
    if (!validateCompanyForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const formattedData = {
        ...companyData,
        whatsapp_phone: companyData.whatsapp_phone ? formatPhoneNumber(companyData.whatsapp_phone) : null
      };

      if (companyInfo) {
        await updateCompanyInfo(formattedData);
        toast.success('Informações da empresa atualizadas!');
      } else {
        await createCompanyInfo(formattedData);
        toast.success('Informações da empresa criadas!');
      }
    } catch (error) {
      toast.error('Erro ao salvar informações da empresa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareSubmit = async () => {
    if (!validateShareForm()) {
      return;
    }

    setIsSaving(true);
    try {
      if (shareSettings) {
        await updateShareSettings(shareData);
        toast.success('Configurações de compartilhamento atualizadas!');
      } else {
        await createShareSettings(shareData);
        toast.success('Configurações de compartilhamento criadas!');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações de compartilhamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const logoUrl = await uploadLogo(file);
      setCompanyData({ ...companyData, logo_url: logoUrl });
      toast.success('Logo enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyData.logo_url) return;

    try {
      // @ts-ignore - Temporary fix for function signature mismatch
      await removeLogo(companyData.logo_url);
      setCompanyData({ ...companyData, logo_url: '' });
      toast.success('Logo removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover logo');
    }
  };

  const openWhatsApp = () => {
    if (companyData.whatsapp_phone) {
      // @ts-ignore - Temporary fix for function signature mismatch
      const link = generateWhatsAppLink(companyData.whatsapp_phone, 'Olá! Gostaria de mais informações.');
      window.open(link, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/service-orders/settings')}
              className="mr-2 hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Marca da Empresa
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure a identidade visual da sua empresa
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-lg',
                companyData.name ? 'bg-green-500/10' : 'bg-muted'
              )}>
                <Building2 className={cn(
                  'w-5 h-5',
                  companyData.name ? 'text-green-600' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nome da Empresa</p>
                <p className="text-lg font-semibold text-foreground">
                  {companyData.name ? 'Configurado' : 'Não configurado'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-lg',
                companyData.logo_url ? 'bg-green-500/10' : 'bg-muted'
              )}>
                <ImageIcon className={cn(
                  'w-5 h-5',
                  companyData.logo_url ? 'text-green-600' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logo</p>
                <p className="text-lg font-semibold text-foreground">
                  {companyData.logo_url ? 'Configurado' : 'Não configurado'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-lg',
                companyData.whatsapp_phone ? 'bg-green-500/10' : 'bg-muted'
              )}>
                <Phone className={cn(
                  'w-5 h-5',
                  companyData.whatsapp_phone ? 'text-green-600' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="text-lg font-semibold text-foreground">
                  {companyData.whatsapp_phone ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Informações da Empresa</span>
              </CardTitle>
              <CardDescription>
                Configure os dados básicos da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div>
                <Label htmlFor="company_name">Nome da Empresa *</Label>
                <Input
                  id="company_name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Minha Empresa Ltda"
                  className={companyErrors.name ? 'border-red-500' : ''}
                />
                {companyErrors.name && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {companyErrors.name}
                  </p>
                )}
              </div>
              
              {/* Logo Upload */}
              <div>
                <Label>Logo da Empresa</Label>
                <div className="mt-2">
                  {companyData.logo_url ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={companyData.logo_url}
                        alt="Logo da empresa"
                        className="w-16 h-16 object-contain border rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Logo atual</p>
                        <div className="flex space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Alterar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nenhum logo enviado</p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                      </Button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 5MB
                  </p>
                </div>
              </div>
              
              {/* WhatsApp Phone */}
              <div>
                <Label htmlFor="whatsapp_phone">WhatsApp</Label>
                <div className="flex space-x-2">
                  <Input
                    id="whatsapp_phone"
                    value={companyData.whatsapp_phone}
                    onChange={(e) => setCompanyData({ ...companyData, whatsapp_phone: e.target.value })}
                    placeholder="11999999999"
                    className={cn('flex-1', companyErrors.whatsapp_phone ? 'border-red-500' : '')}
                  />
                  {companyData.whatsapp_phone && (
                    <Button
                      variant="outline"
                      onClick={openWhatsApp}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {companyErrors.whatsapp_phone && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {companyErrors.whatsapp_phone}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Apenas números, sem espaços ou caracteres especiais
                </p>
              </div>
              

              
              {/* Description */}
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  placeholder="Breve descrição da empresa..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleCompanySubmit} disabled={isSaving || loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Informações'}
              </Button>
            </CardContent>
          </Card>

          {/* Share Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Configurações de Compartilhamento</span>
              </CardTitle>
              <CardDescription>
                Configure como sua empresa aparece nas páginas compartilhadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_logo">Mostrar Logo</Label>
                    <p className="text-sm text-gray-600">
                      Exibir logo da empresa nas páginas compartilhadas
                    </p>
                  </div>
                  <Switch
                    id="show_logo"
                    checked={shareData.show_logo}
                    onCheckedChange={(checked) => setShareData({ ...shareData, show_logo: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_company_name">Mostrar Nome</Label>
                    <p className="text-sm text-gray-600">
                      Exibir nome da empresa nas páginas compartilhadas
                    </p>
                  </div>
                  <Switch
                    id="show_company_name"
                    checked={shareData.show_company_name}
                    onCheckedChange={(checked) => setShareData({ ...shareData, show_company_name: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_whatsapp_button">Botão WhatsApp</Label>
                    <p className="text-sm text-gray-600">
                      Exibir botão de contato via WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="show_whatsapp_button"
                    checked={shareData.show_whatsapp_button}
                    onCheckedChange={(checked) => setShareData({ ...shareData, show_whatsapp_button: checked })}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Theme Color */}
              <div>
                <Label htmlFor="theme_color">Cor do Tema</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    id="theme_color"
                    type="color"
                    value={shareData.theme_color}
                    onChange={(e) => setShareData({ ...shareData, theme_color: e.target.value })}
                    className="h-10"
                  />
                  
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedColors.map((colorOption) => (
                      <button
                        key={colorOption.color}
                        type="button"
                        className={cn(
                          'w-full h-8 rounded border-2 transition-all',
                          shareData.theme_color === colorOption.color
                            ? 'border-gray-900 scale-105'
                            : 'border-gray-200 hover:border-gray-400'
                        )}
                        style={{ backgroundColor: colorOption.color }}
                        onClick={() => setShareData({ ...shareData, theme_color: colorOption.color })}
                        title={colorOption.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Custom Message */}
              <div>
                <Label htmlFor="custom_message">Mensagem Personalizada</Label>
                <Textarea
                  id="custom_message"
                  value={shareData.custom_message}
                  onChange={(e) => setShareData({ ...shareData, custom_message: e.target.value })}
                  placeholder="Mensagem adicional para páginas compartilhadas..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta mensagem aparecerá nas páginas de compartilhamento
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
                
                <Button
                  onClick={handleShareSubmit}
                  disabled={isSaving || loading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Preview da Página Compartilhada</DialogTitle>
            <DialogDescription>
              Veja como sua empresa aparecerá nas páginas compartilhadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-6" style={{ borderColor: shareData.theme_color }}>
            {/* Header Preview */}
            <div className="flex items-center space-x-4 mb-6">
              {shareData.show_logo && companyData.logo_url && (
                <img
                  src={companyData.logo_url}
                  alt="Logo"
                  className="w-12 h-12 object-contain"
                />
              )}
              
              <div className="flex-1">
                {shareData.show_company_name && companyData.name && (
                  <h2 className="text-xl font-bold" style={{ color: shareData.theme_color }}>
                    {companyData.name}
                  </h2>
                )}
                
                {shareData.custom_message && (
                  <p className="text-gray-600 text-sm mt-1">
                    {shareData.custom_message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Sample Content */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Ordem de Serviço #OS-001</h3>
              <p className="text-sm text-gray-600">Cliente: João Silva</p>
              <p className="text-sm text-gray-600">Serviço: Manutenção Preventiva</p>
              <div className="mt-3">
                <Badge style={{ backgroundColor: shareData.theme_color }}>Em Andamento</Badge>
              </div>
            </div>
            
            {/* WhatsApp Button Preview */}
            {shareData.show_whatsapp_button && companyData.whatsapp_phone && (
              <Button
                className="w-full"
                style={{ backgroundColor: shareData.theme_color }}
                disabled
              >
                <Phone className="w-4 h-4 mr-2" />
                Entrar em Contato via WhatsApp
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}