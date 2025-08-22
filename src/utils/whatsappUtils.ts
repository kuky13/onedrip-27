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
  let message = `🔧 *Orçamento de Reparo*\n\n`;
  message += `📱 *Aparelho:* ${budget.device_model || 'Não informado'}\n`;
  message += `🔧 *Serviço:* ${budget.part_type || 'Reparo'}\n`;
  message += `⭐ *Qualidade:* ${budget.part_quality || 'Original'}\n\n`;
  
  if (budget.cash_price) {
    message += `💰 *Valor à vista:* R$ ${(budget.cash_price / 100).toFixed(2)}\n`;
  }
  
  if (budget.installment_price && budget.installments > 1) {
    message += `💳 *Parcelado:* ${budget.installments}x de R$ ${(budget.installment_price / 100).toFixed(2)}\n`;
  }
  
  if (budget.warranty_months) {
    message += `🛡️ *Garantia:* ${budget.warranty_months} meses\n`;
  }
  
  message += `\n📅 *Criado em:* ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`;
  
  if (budget.valid_until) {
    message += `\n⏰ *Válido até:* ${new Date(budget.valid_until).toLocaleDateString('pt-BR')}`;
  }
  
  return encodeURIComponent(message);
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