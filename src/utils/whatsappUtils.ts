// WhatsApp utility functions
export const generateWhatsAppMessage = (budgetOrTitle: any, description?: string, price?: number): string => {
  if (typeof budgetOrTitle === 'string') {
    // Legacy usage with title, description, price
    let message = `*${budgetOrTitle}*`;
    
    if (description) {
      message += `\n\n${description}`;
    }
    
    if (price) {
      message += `\n\n*Valor:* R$ ${price.toFixed(2)}`;
    }
    
    return encodeURIComponent(message);
  }

  // New usage with budget object
  const budget = budgetOrTitle;
  let message = `● *Criado em:* ${new Date(budget.created_at).toLocaleDateString('pt-BR')}\n`;
  
  if (budget.valid_until) {
    message += `● *Válido até:* ${new Date(budget.valid_until).toLocaleDateString('pt-BR')}\n`;
  }
  
  message += `\n*Aparelho:* ${budget.device_model || 'Não informado'}\n`;
  message += `*Qualidade da peça:* ${budget.part_quality || 'Original'}\n`;
  
  message += `\n💰 *VALORES*\n`;
  
  if (budget.cash_price) {
    message += `• *Total:* R$ ${(budget.cash_price / 100).toFixed(2).replace('.', ',')}\n`;
  }
  
  if (budget.installment_price && budget.installments > 1) {
    message += `• *Parcelado:* R$ ${(budget.installment_price / 100).toFixed(2).replace('.', ',')} em até ${budget.installments}x no cartão\n`;
  }
  
  message += `\n✅️ *Garantia:* ${budget.warranty_months || 3} meses\n`;
  message += `🚫 *Não cobre danos por água ou quedas*\n`;
  
  message += `\n📦 *Serviços inclusos:*\n`;
  message += `▪︎ Busca e entrega\n`;
  message += `▪︎ Película 3D de brinde`;
  
  return message;
};

export const shareViaWhatsApp = (url: string, text?: string): void => {
  const message = text ? `${text}\n\n${url}` : url;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

export const openWhatsApp = (phone?: string, message?: string): void => {
  let whatsappUrl = 'https://wa.me/';
  
  if (phone) {
    // Remove any non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    whatsappUrl += cleanPhone;
  }
  
  if (message) {
    whatsappUrl += `?text=${encodeURIComponent(message)}`;
  }
  
  window.open(whatsappUrl, '_blank');
};