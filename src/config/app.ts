/**
 * Configuração Central da Aplicação - OneDrip
 * 
 * Este arquivo centraliza todas as configurações da aplicação,
 * incluindo nome, contatos, URLs e outras informações importantes.
 * 
 * Para alterar o nome da aplicação ou outras informações,
 * modifique apenas este arquivo e todas as referências serão atualizadas.
 */

export const APP_CONFIG = {
  // Informações básicas da aplicação
  name: 'OneDrip',
  fullName: 'OneDrip',
  shortName: 'OneDrip',
  description: 'O melhor sistema de orçamentos para sua empresa. Gerencie orçamentos de forma profissional e eficiente.',
  tagline: 'Sistema de Gestão Profissional',
  subtitle: 'Plataforma completa para assistências técnicas modernas',
  
  // Assets
  logo: '/lovable-uploads/logoo.png',
  
  // Informações de contato
  contact: {
    email: 'contato@onedrip.com.br',
    support: 'suporte@onedrip.com.br',
    security: 'suporte@onedrip.com.br',
    whatsapp: '(64) 9602-8022',
    whatsappUrl: 'https://wa.me/556496028022'
  },
  
  // URLs importantes
  urls: {
    main: 'https://kuky.pro',
    plans: 'https://kuky.pro/plans',
    demo: 'https://kuky.pro'
  },
  
  // Informações para PWA e compartilhamento
  pwa: {
    installTitle: 'Instalar OneDrip como App',
    installDescription: 'Acesse rapidamente o sistema direto da sua tela inicial',
    shareTitle: 'OneDrip',

    shareText: 'O melhor sistema de orçamentos para sua empresa'
  },
  
  // Informações da empresa
  company: {
    name: 'OneDrip',
    author: 'kuky',
    supportHours: 'Segunda à Sexta, 8h às 18h'
  },
  
  // Marketing copy
  marketing: {
    heroTitle: 'Transforme sua Assistência Técnica',
    heroSubtitle: 'Junte-se a centenas de profissionais que já utilizam o OneDrip para gerenciar seus negócios de forma mais eficiente.',
    benefitsTitle: 'Vantagens do OneDrip',
    benefitsSubtitle: 'Descubra os benefícios de usar nosso sistema',
    testimonialsTitle: 'O que nossos clientes dizem',
    testimonialsSubtitle: 'Depoimentos reais de quem já usa o OneDrip',
    faqTitle: 'Perguntas Frequentes',
    faqSubtitle: 'Tire suas dúvidas sobre o OneDrip'
  }
} as const;

// Tipos TypeScript para melhor intellisense
export type AppConfig = typeof APP_CONFIG;
export type ContactInfo = typeof APP_CONFIG.contact;
export type PWAConfig = typeof APP_CONFIG.pwa;
export type MarketingConfig = typeof APP_CONFIG.marketing;