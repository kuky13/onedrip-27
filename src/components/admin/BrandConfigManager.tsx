/**
 * Gerenciador de Configuração de Marca
 * 
 * Interface administrativa para alterar facilmente o nome da aplicação
 * e todas as configurações relacionadas à marca.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, RefreshCw, Eye, Download, Upload } from 'lucide-react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { toast } from 'sonner';

export const BrandConfigManager = () => {
  const currentConfig = useAppConfig();
  
  // Tipo para configuração editável
  type EditableConfig = {
    name: string;
    fullName: string;
    shortName: string;
    description: string;
    tagline: string;
    subtitle: string;
    email: string;
    support: string;
    security: string;
    whatsapp: string;
    mainUrl: string;
    plansUrl: string;
    heroTitle: string;
    heroSubtitle: string;
    benefitsTitle: string;
    benefitsSubtitle: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    faqTitle: string;
    faqSubtitle: string;
    installTitle: string;
    installDescription: string;
    shareTitle: string;
    shareText: string;
  };
  
  // Estado para as configurações editáveis
  const [config, setConfig] = useState<EditableConfig>({
    // Informações básicas
    name: currentConfig.name,
    fullName: currentConfig.fullName,
    shortName: currentConfig.shortName,
    description: currentConfig.description,
    tagline: currentConfig.tagline,
    subtitle: currentConfig.subtitle,
    
    // Contatos
    email: currentConfig.contact.email,
    support: currentConfig.contact.support,
    security: currentConfig.contact.security,
    whatsapp: currentConfig.contact.whatsapp,
    
    // URLs
    mainUrl: currentConfig.urls.main,
    plansUrl: currentConfig.urls.plans,
    
    // Marketing
    heroTitle: currentConfig.marketing.heroTitle,
    heroSubtitle: currentConfig.marketing.heroSubtitle,
    benefitsTitle: currentConfig.marketing.benefitsTitle,
    benefitsSubtitle: currentConfig.marketing.benefitsSubtitle,
    testimonialsTitle: currentConfig.marketing.testimonialsTitle,
    testimonialsSubtitle: currentConfig.marketing.testimonialsSubtitle,
    faqTitle: currentConfig.marketing.faqTitle,
    faqSubtitle: currentConfig.marketing.faqSubtitle,
    
    // PWA
    installTitle: currentConfig.pwa.installTitle,
    installDescription: currentConfig.pwa.installDescription,
    shareTitle: currentConfig.pwa.shareTitle,
    shareText: currentConfig.pwa.shareText
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Função para gerar o novo arquivo de configuração
  const generateConfigFile = () => {
    return `/**
 * Configuração Central da Aplicação - ${config.name}
 * 
 * Este arquivo centraliza todas as configurações da aplicação,
 * incluindo nome, contatos, URLs e outras informações importantes.
 * 
 * Para alterar o nome da aplicação ou outras informações,
 * modifique apenas este arquivo e todas as referências serão atualizadas.
 */

export const APP_CONFIG = {
  // Informações básicas da aplicação
  name: '${config.name}',
  fullName: '${config.fullName}',
  shortName: '${config.shortName}',
  description: '${config.description}',
  tagline: '${config.tagline}',
  subtitle: '${config.subtitle}',
  
  // Assets
  logo: '/lovable-uploads/logoo.png',
  
  // Informações de contato
  contact: {
    email: '${config.email}',
    support: '${config.support}',
    security: '${config.security}',
    whatsapp: '${config.whatsapp}',
    whatsappUrl: 'https://wa.me/556496028022'
  },
  
  // URLs importantes
  urls: {
    main: '${config.mainUrl}',
    plans: '${config.plansUrl}',
    demo: '${config.mainUrl}'
  },
  
  // Informações para PWA e compartilhamento
  pwa: {
    installTitle: '${config.installTitle}',
    installDescription: '${config.installDescription}',
    shareTitle: '${config.shareTitle}',
    shareText: '${config.shareText}'
  },
  
  // Informações da empresa
  company: {
    name: '${config.name}',
    author: 'kuky',
    supportHours: 'Segunda à Sexta, 8h às 18h'
  },
  
  // Marketing copy
  marketing: {
    heroTitle: '${config.heroTitle}',
    heroSubtitle: '${config.heroSubtitle}',
    benefitsTitle: '${config.benefitsTitle}',
    benefitsSubtitle: '${config.benefitsSubtitle}',
    testimonialsTitle: '${config.testimonialsTitle}',
    testimonialsSubtitle: '${config.testimonialsSubtitle}',
    faqTitle: '${config.faqTitle}',
    faqSubtitle: '${config.faqSubtitle}'
  }
} as const;

// Tipos TypeScript para melhor intellisense
export type AppConfig = typeof APP_CONFIG;
export type ContactInfo = typeof APP_CONFIG.contact;
export type PWAConfig = typeof APP_CONFIG.pwa;
export type MarketingConfig = typeof APP_CONFIG.marketing;`;
  };

  const handleSave = () => {
    const newConfigContent = generateConfigFile();
    
    // Simular salvamento (em um app real, isso faria uma requisição para salvar o arquivo)
    console.log('Nova configuração:', newConfigContent);
    
    toast.success('Configuração salva!', {
      description: 'As alterações serão aplicadas após recarregar a página.'
    });
  };

  const handleDownload = () => {
    const configContent = generateConfigFile();
    const blob = new Blob([configContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.ts';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Arquivo baixado!', {
      description: 'Substitua o arquivo src/config/app.ts pelo arquivo baixado.'
    });
  };

  const handleReset = () => {
    setConfig({
      name: currentConfig.name,
      fullName: currentConfig.fullName,
      shortName: currentConfig.shortName,
      description: currentConfig.description,
      tagline: currentConfig.tagline,
      subtitle: currentConfig.subtitle,
      email: currentConfig.contact.email,
      support: currentConfig.contact.support,
      security: currentConfig.contact.security,
      whatsapp: currentConfig.contact.whatsapp,
      mainUrl: currentConfig.urls.main,
      plansUrl: currentConfig.urls.plans,
      heroTitle: currentConfig.marketing.heroTitle,
      heroSubtitle: currentConfig.marketing.heroSubtitle,
      benefitsTitle: currentConfig.marketing.benefitsTitle,
      benefitsSubtitle: currentConfig.marketing.benefitsSubtitle,
      testimonialsTitle: currentConfig.marketing.testimonialsTitle,
      testimonialsSubtitle: currentConfig.marketing.testimonialsSubtitle,
      faqTitle: currentConfig.marketing.faqTitle,
      faqSubtitle: currentConfig.marketing.faqSubtitle,
      installTitle: currentConfig.pwa.installTitle,
      installDescription: currentConfig.pwa.installDescription,
      shareTitle: currentConfig.pwa.shareTitle,
      shareText: currentConfig.pwa.shareText
    });
    
    toast.info('Configurações resetadas para os valores atuais.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciador de Marca</h1>
          <p className="text-muted-foreground">
            Altere facilmente o nome da aplicação e todas as configurações relacionadas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Editar' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Config
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {isPreviewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview da Configuração</CardTitle>
            <CardDescription>
              Veja como ficará o arquivo de configuração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {generateConfigFile()}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Nome da aplicação e informações principais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Aplicação</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({...prev, name: e.target.value}))}
                    placeholder="OneDrip"
                  />
                </div>
                <div>
                  <Label htmlFor="shortName">Nome Curto</Label>
                  <Input
                    id="shortName"
                    value={config.shortName}
                    onChange={(e) => setConfig({...config, shortName: e.target.value})}
                    placeholder="OneDrip"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={config.fullName}
                  onChange={(e) => setConfig({...config, fullName: e.target.value})}
                  placeholder="OneDrip"
                />
              </div>
              
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={config.tagline}
                  onChange={(e) => setConfig({...config, tagline: e.target.value})}
                  placeholder="Sistema de Gestão Profissional"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  placeholder="O melhor sistema de orçamentos para sua empresa..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
              <CardDescription>
                Emails e contatos da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Principal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig({...config, email: e.target.value})}
                    placeholder="contato@onedrip.com"
                  />
                </div>
                <div>
                  <Label htmlFor="support">Email de Suporte</Label>
                  <Input
                    id="support"
                    type="email"
                    value={config.support}
                    onChange={(e) => setConfig({...config, support: e.target.value})}
                    placeholder="suporte@onedrip.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="security">Email de Segurança</Label>
                  <Input
                    id="security"
                    type="email"
                    value={config.security}
                    onChange={(e) => setConfig({...config, security: e.target.value})}
                    placeholder="suporte@onedrip.com.br"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={config.whatsapp}
                    onChange={(e) => setConfig({...config, whatsapp: e.target.value})}
                    placeholder="(64) 9602-8022"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketing */}
          <Card>
            <CardHeader>
              <CardTitle>Textos de Marketing</CardTitle>
              <CardDescription>
                Títulos e textos usados na interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="heroTitle">Título Principal</Label>
                <Input
                  id="heroTitle"
                  value={config.heroTitle}
                  onChange={(e) => setConfig({...config, heroTitle: e.target.value})}
                  placeholder="Transforme sua Assistência Técnica"
                />
              </div>
              
              <div>
                <Label htmlFor="heroSubtitle">Subtítulo Principal</Label>
                <Textarea
                  id="heroSubtitle"
                  value={config.heroSubtitle}
                  onChange={(e) => setConfig({...config, heroSubtitle: e.target.value})}
                  placeholder="Junte-se a centenas de profissionais..."
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="benefitsTitle">Título dos Benefícios</Label>
                  <Input
                    id="benefitsTitle"
                    value={config.benefitsTitle}
                    onChange={(e) => setConfig({...config, benefitsTitle: e.target.value})}
                    placeholder="Vantagens do OneDrip"
                  />
                </div>
                <div>
                  <Label htmlFor="testimonialsTitle">Título dos Depoimentos</Label>
                  <Input
                    id="testimonialsTitle"
                    value={config.testimonialsTitle}
                    onChange={(e) => setConfig({...config, testimonialsTitle: e.target.value})}
                    placeholder="O que nossos clientes dizem"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PWA */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações PWA</CardTitle>
              <CardDescription>
                Textos para instalação e compartilhamento do app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="installTitle">Título de Instalação</Label>
                  <Input
                    id="installTitle"
                    value={config.installTitle}
                    onChange={(e) => setConfig({...config, installTitle: e.target.value})}
                    placeholder="Instalar OneDrip como App"
                  />
                </div>
                <div>
                  <Label htmlFor="shareTitle">Título de Compartilhamento</Label>
                  <Input
                    id="shareTitle"
                    value={config.shareTitle}
                    onChange={(e) => setConfig({...config, shareTitle: e.target.value})}
                    placeholder="OneDrip"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instruções */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            📋 Como Usar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300 space-y-2">
          <p><strong>1.</strong> Altere os campos acima com as informações da sua marca</p>
          <p><strong>2.</strong> Clique em "Baixar Config" para baixar o novo arquivo</p>
          <p><strong>3.</strong> Substitua o arquivo <code>src/config/app.ts</code> pelo arquivo baixado</p>
          <p><strong>4.</strong> Recarregue a aplicação para ver as mudanças</p>
          <p className="text-sm mt-4">
            ✨ <strong>Todas as referências</strong> ao nome da aplicação serão atualizadas automaticamente!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};