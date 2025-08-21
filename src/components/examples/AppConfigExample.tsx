/**
 * Componente de Exemplo - Sistema de Configuração Centralizada
 * 
 * Este componente demonstra como usar o sistema de configuração
 * centralizada da aplicação. Pode ser removido após a migração
 * de todos os componentes.
 */

import { useAppConfig, useAppInfo, useContactInfo, usePWAConfig } from '@/hooks/useAppConfig';

export const AppConfigExample = () => {
  // Usando o hook completo
  const fullConfig = useAppConfig();
  
  // Usando hooks específicos
  const appInfo = useAppInfo();
  const contactInfo = useContactInfo();
  const pwaConfig = usePWAConfig();

  return (
    <div className="p-6 space-y-6 bg-card rounded-lg border">
      <h2 className="text-2xl font-bold">Exemplo de Configuração Centralizada</h2>
      
      {/* Informações básicas da aplicação */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Informações da Aplicação</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Nome:</strong> {appInfo.name}
          </div>
          <div>
            <strong>Nome Completo:</strong> {appInfo.fullName}
          </div>
          <div>
            <strong>Nome Curto:</strong> {appInfo.shortName}
          </div>
          <div>
            <strong>Tagline:</strong> {appInfo.tagline}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Descrição:</strong> {appInfo.description}
        </p>
      </div>

      {/* Informações de contato */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Contatos</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Email:</strong> {contactInfo.email}
          </div>
          <div>
            <strong>Suporte:</strong> {contactInfo.support}
          </div>
          <div>
            <strong>Segurança:</strong> {contactInfo.security}
          </div>
          <div>
            <strong>WhatsApp:</strong> {contactInfo.whatsapp}
          </div>
        </div>
      </div>

      {/* Configurações PWA */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">PWA</h3>
        <div className="text-sm space-y-1">
          <div>
            <strong>Título de Instalação:</strong> {pwaConfig.installTitle}
          </div>
          <div>
            <strong>Título de Compartilhamento:</strong> {pwaConfig.shareTitle}
          </div>
        </div>
      </div>

      {/* Marketing */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Marketing</h3>
        <div className="text-sm space-y-1">
          <div>
            <strong>Título Hero:</strong> {fullConfig.marketing.heroTitle}
          </div>
          <div>
            <strong>Benefícios:</strong> {fullConfig.marketing.benefitsTitle}
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-800 dark:text-green-200">
          ✅ <strong>Sistema funcionando!</strong> Para alterar qualquer informação, 
          modifique apenas o arquivo <code>src/config/app.ts</code>
        </p>
      </div>
    </div>
  );
};