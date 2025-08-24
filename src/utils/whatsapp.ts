// ============================================
// UTILITÁRIOS PARA WHATSAPP
// ============================================
// Funções auxiliares para integração com WhatsApp

export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres que não são números
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Adiciona código do país se não tiver
  if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    return '55' + cleanPhone.substring(1);
  }
  
  if (cleanPhone.length === 11) {
    return '55' + cleanPhone;
  }
  
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    return cleanPhone;
  }
  
  return cleanPhone;
};

export const createWhatsAppUrl = (phone: string, message?: string): string => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  return `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
};

export const openWhatsApp = (phone: string, message?: string): void => {
  const url = createWhatsAppUrl(phone, message);
  window.open(url, '_blank');
};

export default {
  formatPhoneNumber,
  createWhatsAppUrl,
  openWhatsApp
};