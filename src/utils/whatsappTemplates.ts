import {
  WhatsAppMessageTemplate,
  MessageVariables,
  WhatsAppPlan
} from '../../shared/types/whatsappSales';

// Predefined message templates
export const messageTemplates: WhatsAppMessageTemplate[] = [
  {
    id: 'plan_info',
    name: 'Informações do Plano',
    template: `{{discountBanner}}Olá{{customerName}}! 👋

Obrigado pelo interesse no *{{planName}}*!

📋 *Detalhes do Plano:*
{{planFeatures}}

💰 *Investimento:*
{{priceInfo}}

{{planDescription}}

🚀 Pronto para começar? Vou te ajudar com todos os detalhes!

Qual é a melhor forma de te atender?`,
    variables: ['customerName', 'planName', 'planFeatures', 'priceInfo', 'planDescription', 'discountBanner'],
    category: 'plan_info',
    isActive: true
  },
  {
    id: 'welcome',
    name: 'Mensagem de Boas-vindas',
    template: `Olá{{customerName}}! 👋

Seja bem-vindo(a) à *{{businessName}}*!

Estou aqui para te ajudar a escolher o melhor plano para o seu negócio.

🎯 Nossos planos incluem:
✅ Automação completa
✅ Suporte especializado
✅ Resultados garantidos

Como posso te ajudar hoje?`,
    variables: ['customerName', 'businessName'],
    category: 'welcome',
    isActive: true
  },
  {
    id: 'follow_up',
    name: 'Follow-up',
    template: `Oi{{customerName}}! 😊

Vi que você demonstrou interesse no *{{planName}}*.

Tem alguma dúvida que posso esclarecer?

💡 Lembre-se que temos:
{{planFeatures}}

📞 Posso te ligar para conversar melhor sobre como podemos ajudar seu negócio?

Estou aqui para te ajudar! 🚀`,
    variables: ['customerName', 'planName', 'planFeatures'],
    category: 'follow_up',
    isActive: true
  },
  {
    id: 'confirmation',
    name: 'Confirmação de Interesse',
    template: `Perfeito{{customerName}}! 🎉

Fico feliz em saber do seu interesse no *{{planName}}*!

✅ *Próximos passos:*
1️⃣ Vou preparar uma proposta personalizada
2️⃣ Agendaremos uma conversa rápida
3️⃣ Te ajudo com a implementação

💰 *Investimento:* {{priceInfo}}

🎁 *Bônus especial:* Consultoria gratuita de 30 dias!

Vamos começar? Qual o melhor horário para conversarmos?`,
    variables: ['customerName', 'planName', 'priceInfo'],
    category: 'confirmation',
    isActive: true
  },
  {
    id: 'discount_offer',
    name: 'Oferta com Desconto',
    template: `🎉 *OFERTA ESPECIAL PARA VOCÊ{{customerName}}!*

*{{planName}}* com {{discount}}% de desconto!

💰 De: ~R$ {{originalPrice}}~
💰 Por: *R$ {{finalPrice}}*

⏰ *Oferta válida apenas hoje!*

📋 *O que está incluso:*
{{planFeatures}}

🚀 Não perca essa oportunidade!

Vamos fechar agora?`,
    variables: ['customerName', 'planName', 'discount', 'originalPrice', 'finalPrice', 'planFeatures'],
    category: 'plan_info',
    isActive: true
  },
  {
    id: 'urgency',
    name: 'Urgência/Escassez',
    template: `⚡ *ÚLTIMAS VAGAS{{customerName}}!*

Restam apenas *3 vagas* para o *{{planName}}* este mês!

🔥 *Por que escolher agora:*
{{planFeatures}}

💰 *Investimento:* {{priceInfo}}

⏰ *Garante sua vaga até:* Hoje às 23:59h

🎯 Não deixe essa oportunidade passar!

Vamos garantir sua vaga?`,
    variables: ['customerName', 'planName', 'planFeatures', 'priceInfo'],
    category: 'plan_info',
    isActive: true
  }
];

// Template processing functions
export class WhatsAppTemplateProcessor {
  /**
   * Process a template with given variables
   */
  static processTemplate(template: string, variables: MessageVariables): string {
    let processedMessage = template;

    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedMessage = processedMessage.replace(regex, String(value));
    });

    // Handle special formatting
    processedMessage = this.handleSpecialFormatting(processedMessage, variables);

    return processedMessage;
  }

  /**
   * Generate a complete message for a plan using a specific template
   */
  static generatePlanMessage(
    plan: WhatsAppPlan,
    templateId: string = 'plan_info',
    customVariables: Partial<MessageVariables> = {}
  ): string {
    const template = messageTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const variables: MessageVariables = {
      planName: plan.name,
      planPrice: plan.price,
      planFeatures: plan.features,
      businessName: 'OneDrip',
      discount: plan.discount,
      originalPrice: plan.originalPrice,
      planDescription: plan.description,
      ...customVariables
    };

    return this.processTemplate(template.template, variables);
  }

  /**
   * Handle special formatting for common patterns
   */
  private static handleSpecialFormatting(message: string, variables: MessageVariables): string {
    let formatted = message;

    // Handle customer name with proper greeting
    if (variables.customerName) {
      formatted = formatted.replace(/{{customerName}}/g, ` ${variables.customerName}`);
    } else {
      formatted = formatted.replace(/{{customerName}}/g, '');
    }

    // Handle plan features formatting
    if (variables.planFeatures && Array.isArray(variables.planFeatures)) {
      const featuresText = variables.planFeatures.map(feature => `✅ ${feature}`).join('\n');
      formatted = formatted.replace(/{{planFeatures}}/g, featuresText);
    }

    // Handle price information
    if (variables.planPrice) {
      let priceInfo = `*R$ ${variables.planPrice}*`;
      if (variables.originalPrice && variables.originalPrice > variables.planPrice) {
        priceInfo = `~R$ ${variables.originalPrice}~ *R$ ${variables.planPrice}*`;
      }
      formatted = formatted.replace(/{{priceInfo}}/g, priceInfo);
    }

    // Handle discount banner
    if (variables.discount && variables.discount > 0) {
      const discountBanner = `🎉 *OFERTA ESPECIAL: ${variables.discount}% OFF!*\n\n`;
      formatted = formatted.replace(/{{discountBanner}}/g, discountBanner);
    } else {
      formatted = formatted.replace(/{{discountBanner}}/g, '');
    }

    // Handle final price calculation
    if (variables.originalPrice && variables.discount) {
      const finalPrice = variables.originalPrice * (1 - variables.discount / 100);
      formatted = formatted.replace(/{{finalPrice}}/g, finalPrice.toString());
    }

    return formatted;
  }

  /**
   * Get all available templates
   */
  static getTemplates(): WhatsAppMessageTemplate[] {
    return messageTemplates.filter(template => template.isActive);
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): WhatsAppMessageTemplate | null {
    return messageTemplates.find(template => template.id === templateId) || null;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: WhatsAppMessageTemplate['category']): WhatsAppMessageTemplate[] {
    return messageTemplates.filter(template => template.category === category && template.isActive);
  }

  /**
   * Validate template variables
   */
  static validateTemplate(template: string, variables: MessageVariables): { isValid: boolean; missingVariables: string[] } {
    const templateVariables = template.match(/{{(\w+)}}/g) || [];
    const requiredVariables = templateVariables.map(v => v.replace(/[{}]/g, ''));
    const providedVariables = Object.keys(variables);
    
    const missingVariables = requiredVariables.filter(v => !providedVariables.includes(v));
    
    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }

  /**
   * Create a custom template
   */
  static createCustomTemplate(
    id: string,
    name: string,
    template: string,
    category: WhatsAppMessageTemplate['category']
  ): WhatsAppMessageTemplate {
    const variables = template.match(/{{(\w+)}}/g)?.map(v => v.replace(/[{}]/g, '')) || [];
    
    return {
      id,
      name,
      template,
      variables,
      category,
      isActive: true
    };
  }
}

// Utility functions for quick message generation
export const generateWelcomeMessage = (customerName?: string, businessName: string = 'OneDrip'): string => {
  return WhatsAppTemplateProcessor.processTemplate(
    messageTemplates.find(t => t.id === 'welcome')!.template,
    { customerName, businessName }
  );
};

export const generatePlanInfoMessage = (plan: WhatsAppPlan, customerName?: string): string => {
  return WhatsAppTemplateProcessor.generatePlanMessage(plan, 'plan_info', { customerName });
};

export const generateFollowUpMessage = (plan: WhatsAppPlan, customerName?: string): string => {
  return WhatsAppTemplateProcessor.generatePlanMessage(plan, 'follow_up', { customerName });
};

export const generateDiscountMessage = (plan: WhatsAppPlan, customerName?: string): string => {
  return WhatsAppTemplateProcessor.generatePlanMessage(plan, 'discount_offer', { customerName });
};

export const generateUrgencyMessage = (plan: WhatsAppPlan, customerName?: string): string => {
  return WhatsAppTemplateProcessor.generatePlanMessage(plan, 'urgency', { customerName });
};

// Export the processor class and templates
export { WhatsAppTemplateProcessor, messageTemplates };
export default WhatsAppTemplateProcessor;