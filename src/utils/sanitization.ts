/**
 * Utilitários de Sanitização para Prevenção de XSS
 * Sistema OneDrip Blueberry - Segurança 2025
 */

// Função para sanitizar HTML e prevenir XSS
export const sanitizeHTML = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove tags script, iframe, object, embed e outros elementos perigosos
  const dangerousTags = /<(script|iframe|object|embed|form|input|textarea|select|button|link|meta|style)[^>]*>.*?<\/\1>|<(script|iframe|object|embed|form|input|textarea|select|button|link|meta|style)[^>]*\/?>/gi;
  let sanitized = input.replace(dangerousTags, '');

  // Remove atributos de evento (onclick, onload, etc.)
  const eventAttributes = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
  sanitized = sanitized.replace(eventAttributes, '');

  // Remove javascript: e vbscript: URLs
  const scriptUrls = /(javascript|vbscript|data):\s*[^\s"']+/gi;
  sanitized = sanitized.replace(scriptUrls, '');

  // Remove expressões CSS perigosas
  const cssExpressions = /expression\s*\([^)]*\)/gi;
  sanitized = sanitized.replace(cssExpressions, '');

  return sanitized;
};

// Função para sanitizar CSS e prevenir CSS injection
export const sanitizeCSS = (css: string): string => {
  if (!css || typeof css !== 'string') {
    return '';
  }

  // Remove expressões CSS perigosas
  let sanitized = css.replace(/expression\s*\([^)]*\)/gi, '');
  
  // Remove imports e URLs suspeitas
  sanitized = sanitized.replace(/@import\s+[^;]+;/gi, '');
  sanitized = sanitized.replace(/url\s*\(\s*["']?javascript:[^)]*\)/gi, '');
  sanitized = sanitized.replace(/url\s*\(\s*["']?data:[^)]*\)/gi, '');
  
  // Remove comportamentos CSS perigosos
  sanitized = sanitized.replace(/behavior\s*:[^;]+;/gi, '');
  sanitized = sanitized.replace(/-moz-binding\s*:[^;]+;/gi, '');
  
  return sanitized;
};

// Função para escapar caracteres HTML
export const escapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
};

// Função para validar e sanitizar cores CSS
export const sanitizeColor = (color: string): string => {
  if (!color || typeof color !== 'string') {
    return '#000000';
  }

  // Permitir apenas cores hexadecimais, rgb, rgba, hsl, hsla e nomes de cores CSS válidos
  const colorPattern = /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[0-9.]+\s*\)|transparent|inherit|initial|unset|[a-zA-Z]+)$/;
  
  if (colorPattern.test(color.trim())) {
    return color.trim();
  }
  
  return '#000000'; // Cor padrão segura
};

// Função para sanitizar IDs CSS
export const sanitizeId = (id: string): string => {
  if (!id || typeof id !== 'string') {
    return 'safe-id';
  }

  // Permitir apenas caracteres alfanuméricos, hífens e underscores
  return id.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50) || 'safe-id';
};

// Função para sanitizar texto que será usado em templates
export const sanitizeTemplateText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Escapar caracteres HTML e remover quebras de linha perigosas
  let sanitized = escapeHTML(text);
  
  // Limitar tamanho para prevenir ataques de DoS
  sanitized = sanitized.substring(0, 1000);
  
  return sanitized;
};

// Função para validar URLs
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Permitir apenas URLs HTTP/HTTPS
  const urlPattern = /^https?:\/\/[^\s<>"'{}|\\^`\[\]]+$/i;
  
  if (urlPattern.test(url)) {
    return url;
  }
  
  return ''; // URL inválida
};