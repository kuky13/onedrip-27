/**
 * Hook para Configuração da Aplicação - OneDrip
 * 
 * Este hook fornece acesso fácil e tipado às configurações centralizadas
 * da aplicação. Use este hook em qualquer componente que precise
 * referenciar o nome da aplicação, contatos ou outras informações.
 * 
 * Exemplo de uso:
 * ```tsx
 * import { useAppConfig } from '@/hooks/useAppConfig';
 * 
 * const MyComponent = () => {
 *   const { name, fullName, contact } = useAppConfig();
 *   
 *   return (
 *     <div>
 *       <h1>{fullName}</h1>
 *       <p>Contato: {contact.email}</p>
 *     </div>
 *   );
 * };
 * ```
 */

import { APP_CONFIG, type AppConfig } from '@/config/app';

/**
 * Hook que retorna a configuração completa da aplicação
 */
export const useAppConfig = (): AppConfig => {
  return APP_CONFIG;
};

/**
 * Hook que retorna apenas as informações básicas da aplicação
 */
export const useAppInfo = () => {
  const { name, fullName, shortName, description, tagline, subtitle, logo } = APP_CONFIG;
  
  return {
    name,
    fullName,
    shortName,
    description,
    tagline,
    subtitle,
    logo
  };
};

/**
 * Hook que retorna apenas as informações de contato
 */
export const useContactInfo = () => {
  return APP_CONFIG.contact;
};

/**
 * Hook que retorna apenas as configurações de PWA
 */
export const usePWAConfig = () => {
  return APP_CONFIG.pwa;
};

/**
 * Hook que retorna apenas as informações de marketing
 */
export const useMarketingConfig = () => {
  return APP_CONFIG.marketing;
};