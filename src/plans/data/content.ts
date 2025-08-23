// ============================================
// DADOS DA PÁGINA DE PLANOS - EDITÁVEL
// ============================================
// Este arquivo contém TODOS os textos e dados da página de planos
// Para alterar qualquer texto da página, edite os valores abaixo

export const PLANS_CONTENT = {
  // SEÇÃO PRINCIPAL (HERO)
  logo: "/lovable-uploads/logoo.png",
  titulo_principal: "Escolha seu Plano",
  subtitulo_principal: "Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.",

  // DADOS DOS PLANOS (MENSAL E ANUAL)
  planos: {
    mensal: {
      nome: "Plano Profissional",
      descricao: "Para assistências técnicas que querem crescer",
      preco: 68.90,
      preco_original: 80.00,
      moeda: "R$",
      periodo: "/mês",
      ciclo: "monthly",
      badge_popular: "Mais Popular",
      mostrar_badge: true,
      economia_texto: "",
      
      // Lista de benefícios do plano
      beneficios: [
        "Sistema completo de orçamentos",
        "Gestão de clientes ilimitada", 
        "Cálculos automáticos",
        "Controle de dispositivos",
        "Suporte técnico incluso",
        "Atualizações gratuitas",
        "Backup automático"
      ]
    },
    anual: {
      nome: "Plano Profissional Anual",
      descricao: "Para assistências técnicas que querem crescer com economia",
      preco: 638.55,
      preco_original: 800.00,
      moeda: "R$",
      periodo: "/ano",
      ciclo: "yearly",
      badge_popular: "Melhor Oferta",
      mostrar_badge: true,
      economia_texto: "2 meses grátis",
      
      // Lista de benefícios do plano
      beneficios: [
        "Sistema completo de orçamentos",
        "Gestão de clientes ilimitada", 
        "Cálculos automáticos",
        "Controle de dispositivos",
        "Suporte técnico incluso",
        "Atualizações gratuitas",
        "Backup automático",
        "2 meses de economia"
      ]
    }
  },

  // UPGRADE VIP
  vip: {
    nome: "Upgrade VIP",
    descricao: "Funcionalidades avançadas para sua assistência",
    preco_adicional: 10.00,
    moeda: "R$",
    icone: "Crown",
    
    beneficios: [
      "Sistema de ordem de serviço",
      "Suporte prioritário"
    ]
  },

  // CONFIGURAÇÕES GERAIS
  configuracoes_gerais: {
    botao_texto: "Assinar Agora",
    mostrar_suporte: true,
    texto_suporte: "Suporte via WhatsApp incluso",
    informacoes_extras: "✓ Sem taxa de setup • ✓ Cancele quando quiser • ✓ Suporte brasileiro"
  },

  // SEÇÃO DE VANTAGENS/BENEFÍCIOS
  vantagens: {
    mostrar_secao: true,
    titulo: "Vantagens do OneDrip",
    subtitulo: "Descubra os benefícios de usar nosso sistema",
    
    lista: [
      {
        icone: "Zap" as const,
        titulo: "Rápido e Eficiente", 
        descricao: "Crie orçamentos profissionais em menos de 2 minutos"
      },
      {
        icone: "Shield" as const,
        titulo: "Seguro e Confiável",
        descricao: "Seus dados protegidos com tecnologia de ponta"
      },
      {
        icone: "Users" as const, 
        titulo: "Suporte Dedicado",
        descricao: "Atendimento brasileiro via WhatsApp quando precisar"
      },
      {
        icone: "Award" as const,
        titulo: "Resultados Comprovados", 
        descricao: "Mais de 500+ assistências técnicas já confiam no OneDrip"
      }
    ]
  },

  // SEÇÃO DE DEPOIMENTOS
  depoimentos: {
    mostrar_secao: true,
    titulo: "O que nossos clientes dizem",
    subtitulo: "Depoimentos reais de quem já usa o OneDrip",
    
    lista: [
      {
        nome: "Carlos Silva",
        cargo: "Proprietário - TechRepair", 
        texto: "O OneDrip transformou minha assistência. Agora consigo fazer orçamentos profissionais em minutos!",
        nota: 5
      },
      {
        nome: "Ana Maria",
        cargo: "Gerente - CelFix",
        texto: "Sistema incrível! Organização total dos clientes e orçamentos. Recomendo muito!",
        nota: 5
      },
      {
        nome: "João Santos", 
        cargo: "Técnico - MobileTech",
        texto: "Interface simples e funcional. Perfeito para quem quer profissionalizar o negócio.",
        nota: 5
      }
    ]
  },

  // SEÇÃO DE PERGUNTAS FREQUENTES
  perguntas_frequentes: {
    mostrar_secao: true,
    titulo: "Perguntas Frequentes",
    subtitulo: "Tire suas dúvidas sobre o OneDrip",
    
    lista: [
      {
        pergunta: "Posso cancelar a qualquer momento?", 
        resposta: "Sim! Não há fidelidade. Cancele quando quiser pelo WhatsApp."
      },
      {
        pergunta: "O suporte está incluso?",
        resposta: "Sim! Suporte completo via WhatsApp está incluído em todos os planos."
      },
      {
        pergunta: "Funciona no celular?",
        resposta: "Perfeitamente! O sistema é responsivo e funciona em qualquer dispositivo."
      }
    ]
  },

  // SEÇÃO FINAL (CALL TO ACTION)
  secao_final: {
    titulo: "Pronto para revolucionar sua assistência técnica?",
    botao_texto: "Assinar Agora"
  },

  // CONFIGURAÇÕES TÉCNICAS
  configuracoes: {
    whatsapp_numero: "64996028022"
    // url_pagamento removido - agora usa redirecionamento específico por plano no paymentService.ts
  }
};