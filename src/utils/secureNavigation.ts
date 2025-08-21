/**
 * Utilitários de Navegação Segura
 * Sistema OneDrip Blueberry - Segurança 2025
 */

// Lista de URLs permitidas para redirecionamento
const ALLOWED_INTERNAL_PATHS = [
  '/',
  '/auth',
  '/dashboard',
  '/painel',
  '/settings',
  '/admin',
  '/license',
  '/cookies'
];

// Domínios externos permitidos
const ALLOWED_EXTERNAL_DOMAINS = [
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'mercadopago.com.br',
  'mercadopago.com',
  'mp.com.br'
];

/**
 * Valida se uma URL é segura para redirecionamento
 * @param url - URL a ser validada
 * @returns true se a URL é segura, false caso contrário
 */
export const isUrlSafe = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Verificar se é um caminho interno (relativo)
    if (url.startsWith('/')) {
      // Verificar se o caminho está na lista de permitidos
      const basePath = url.split('?')[0].split('#')[0]; // Remove query params e hash
      return ALLOWED_INTERNAL_PATHS.includes(basePath) || 
             ALLOWED_INTERNAL_PATHS.some(path => basePath.startsWith(path + '/'));
    }

    // Verificar URLs absolutas
    const urlObj = new URL(url);
    
    // Permitir apenas HTTP, HTTPS e WhatsApp protocol
    if (!['http:', 'https:', 'whatsapp:'].includes(urlObj.protocol)) {
      return false;
    }

    // Para protocolo whatsapp://, sempre permitir
    if (urlObj.protocol === 'whatsapp:') {
      return true;
    }

    // Verificar se é o mesmo domínio (origem) - apenas se window estiver disponível
    if (typeof window !== 'undefined' && window.location && urlObj.origin === window.location.origin) {
      const pathname = urlObj.pathname;
      return ALLOWED_INTERNAL_PATHS.includes(pathname) || 
             ALLOWED_INTERNAL_PATHS.some(path => pathname.startsWith(path + '/'));
    }

    // Verificar domínios externos permitidos
    const hostname = urlObj.hostname.toLowerCase();
    return ALLOWED_EXTERNAL_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );

  } catch (error) {
    // URL inválida
    console.warn('URL inválida detectada:', url, error);
    return false;
  }
};

/**
 * Sanitiza uma URL removendo caracteres perigosos
 * @param url - URL a ser sanitizada
 * @returns URL sanitizada
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '/';
  }

  // Remove caracteres de controle e espaços
  let sanitized = url.replace(/[\x00-\x1F\x7F]/g, '').trim();
  
  // Remove javascript: e data: URLs
  if (/^(javascript|data|vbscript):/i.test(sanitized)) {
    return '/';
  }

  return sanitized;
};

/**
 * Realiza redirecionamento seguro
 * @param url - URL de destino
 * @param fallbackUrl - URL de fallback se a URL principal não for segura
 */
export const safeRedirect = (url: string, fallbackUrl: string = '/'): void => {
  const sanitizedUrl = sanitizeUrl(url);
  
  if (isUrlSafe(sanitizedUrl)) {
    try {
      window.location.href = sanitizedUrl;
    } catch (error) {
      console.error('Erro ao redirecionar:', error);
      window.location.href = fallbackUrl;
    }
  } else {
    console.warn('Tentativa de redirecionamento para URL não segura bloqueada:', url);
    window.location.href = fallbackUrl;
  }
};

/**
 * Abre URL em nova aba de forma segura
 * @param url - URL a ser aberta
 * @param fallbackUrl - URL de fallback
 */
export const safeOpenInNewTab = (url: string, fallbackUrl?: string): void => {
  const sanitizedUrl = sanitizeUrl(url);
  
  if (isUrlSafe(sanitizedUrl)) {
    try {
      const newWindow = window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // Popup bloqueado, tentar redirecionamento normal
        if (fallbackUrl) {
          safeRedirect(fallbackUrl);
        }
      }
    } catch (error) {
      console.error('Erro ao abrir nova aba:', error);
      if (fallbackUrl) {
        safeRedirect(fallbackUrl);
      }
    }
  } else {
    console.warn('Tentativa de abrir URL não segura em nova aba bloqueada:', url);
    if (fallbackUrl) {
      safeRedirect(fallbackUrl);
    }
  }
};

/**
 * Valida e constrói URLs de WhatsApp de forma segura
 * @param phoneNumber - Número de telefone
 * @param message - Mensagem (opcional)
 * @returns URL segura do WhatsApp ou null se inválida
 */
export const buildSafeWhatsAppUrl = (phoneNumber: string, message?: string): string | null => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  // Sanitizar número de telefone (apenas dígitos)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return null;
  }

  let url = `https://wa.me/${cleanPhone}`;
  
  if (message && typeof message === 'string') {
    // Sanitizar mensagem
    const cleanMessage = encodeURIComponent(message.substring(0, 1000));
    url += `?text=${cleanMessage}`;
  }

  return isUrlSafe(url) ? url : null;
};

/**
 * Hook para navegação segura em componentes React
 */
export const useSecureNavigation = () => {
  const navigate = (url: string, fallbackUrl?: string) => {
    safeRedirect(url, fallbackUrl);
  };

  const openInNewTab = (url: string, fallbackUrl?: string) => {
    safeOpenInNewTab(url, fallbackUrl);
  };

  return { navigate, openInNewTab, isUrlSafe, sanitizeUrl };
};