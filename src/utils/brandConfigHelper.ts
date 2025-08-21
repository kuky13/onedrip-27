/**
 * Utilitários para Configuração de Marca
 * 
 * Funções auxiliares para facilitar a alteração de configurações
 * da marca em toda a aplicação.
 */

import { APP_CONFIG } from '@/config/app';

/**
 * Busca todas as referências ao nome da aplicação no código
 */
export const findBrandReferences = () => {
  const references = [
    // Arquivos de configuração
    'index.html - Meta tags e títulos',
    'public/manifest.json - Nome do PWA',
    'capacitor.config.ts - Nome do app mobile',
    
    // Documentação
    'README.md - Documentação principal',
    'LICENSE - Arquivo de licença',
    'SECURITY.md - Documentação de segurança',
    
    // Componentes React
    'src/components/adaptive/TabletHeaderNav.tsx - Header principal',
    'src/components/PWAInstallPrompt.tsx - Prompt de instalação',
    'src/pages/Index.tsx - Página inicial',
    'src/pages/ResetPasswordPage.tsx - Página de reset',
    'src/pages/PurchaseSuccessPage.tsx - Página de sucesso',
    
    // Hooks e utilitários
    'src/hooks/usePWA.ts - Hook de PWA',
    'src/utils/localStorageManager.ts - Chaves de storage',
    
    // Banco de dados
    'supabase/migrations/*.sql - Dados padrão',
    
    // Estilos e design
    'src/index.css - Design system',
    'src/lib/design-tokens.ts - Tokens de design'
  ];
  
  return references;
};

/**
 * Gera um relatório de onde o nome da marca aparece
 */
export const generateBrandReport = () => {
  const config = APP_CONFIG;
  
  return {
    currentBrand: {
      name: config.name,
      fullName: config.fullName,
      shortName: config.shortName
    },
    locations: {
      userInterface: [
        'Headers e navegação',
        'Títulos de páginas',
        'Textos de marketing',
        'Prompts de instalação PWA',
        'Mensagens de sucesso/erro'
      ],
      technical: [
        'Metadados HTML',
        'Configurações PWA',
        'Chaves de localStorage',
        'Nomes de arquivos de backup',
        'Comentários de código'
      ],
      database: [
        'Dados padrão em migrações',
        'Títulos de seções',
        'Textos de exemplo',
        'Depoimentos padrão'
      ],
      documentation: [
        'README principal',
        'Documentação de segurança',
        'Arquivo de licença',
        'Comentários de código'
      ]
    },
    totalReferences: 50 // Estimativa baseada no rebrand realizado
  };
};

/**
 * Valida se uma configuração de marca está completa
 */
export const validateBrandConfig = (config: any) => {
  const required = [
    'name',
    'fullName', 
    'shortName',
    'description'
  ];
  
  const missing = required.filter(field => !config[field] || config[field].trim() === '');
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    warnings: []
  };
};

/**
 * Gera sugestões automáticas baseadas no nome principal
 */
export const generateBrandSuggestions = (mainName: string) => {
  return {
    fullName: `${mainName} - Sistema de Orçamentos`,
    shortName: mainName,
    description: `O melhor sistema de orçamentos para sua empresa. Gerencie orçamentos de forma profissional e eficiente com ${mainName}.`,
    tagline: 'Sistema de Gestão Profissional',
    
    // Marketing
    heroTitle: 'Transforme sua Assistência Técnica',
    heroSubtitle: `Junte-se a centenas de profissionais que já utilizam o ${mainName} para gerenciar seus negócios de forma mais eficiente.`,
    benefitsTitle: `Vantagens do ${mainName}`,
    benefitsSubtitle: 'Descubra os benefícios de usar nosso sistema',
    testimonialsTitle: 'O que nossos clientes dizem',
    testimonialsSubtitle: `Depoimentos reais de quem já usa o ${mainName}`,
    faqTitle: 'Perguntas Frequentes',
    faqSubtitle: `Tire suas dúvidas sobre o ${mainName}`,
    
    // PWA
    installTitle: `Instalar ${mainName} como App`,
    installDescription: 'Acesse rapidamente o sistema direto da sua tela inicial',
    shareTitle: `${mainName} - Sistema de Orçamentos`,
    shareText: 'O melhor sistema de orçamentos para sua empresa'
  };
};

/**
 * Exporta a configuração atual em formato JSON
 */
export const exportBrandConfig = () => {
  const config = APP_CONFIG;
  
  const exportData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    brand: {
      name: config.name,
      fullName: config.fullName,
      shortName: config.shortName,
      description: config.description,
      tagline: config.tagline,
      subtitle: config.subtitle
    },
    contact: config.contact,
    urls: config.urls,
    marketing: config.marketing,
    pwa: config.pwa,
    company: config.company
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Lista de todos os arquivos que contêm referências à marca
 */
export const getBrandFiles = () => {
  return [
    // Configuração
    'src/config/app.ts',
    
    // HTML e PWA
    'index.html',
    'public/manifest.json',
    'capacitor.config.ts',
    
    // Documentação
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'DESIGN_IMPROVEMENTS_SUMMARY.md',
    
    
    // Componentes principais
    'src/components/adaptive/TabletHeaderNav.tsx',
    'src/components/PWAInstallPrompt.tsx',
    'src/plans/components/PlansHero.tsx',
    'src/pages/Index.tsx',
    'src/pages/ResetPasswordPage.tsx',
    'src/pages/PurchaseSuccessPage.tsx',
    'src/pages/AuthPage.tsx',
    'src/pages/LicensePage.tsx',
    
    // Hooks e utilitários
    'src/hooks/usePWA.ts',
    'src/utils/localStorageManager.ts',
    
    
    // Componentes de planos
    'src/components/plans/BenefitsSection.tsx',
    'src/components/plans/TestimonialsSection.tsx',
    'src/components/plans/FAQSection.tsx',
    'src/plans/data/content.ts',
    
    // Banco de dados
    'supabase/migrations/20250704132159-12b536fd-8b0d-41a0-85ef-b3cb40c825dd.sql',
    
    // Estilos
    'src/index.css',
    'src/lib/design-tokens.ts',
    
    // Componentes diversos
    'src/components/SiteSettingsContent.tsx',
    'src/components/lite/DashboardLiteHeader.tsx',
    'src/components/adaptive/AdaptiveLayout.tsx'
  ];
};