-- Expandir tabela site_settings para incluir todas as seções da página de planos

-- Adicionar campos para seção de benefícios
ALTER TABLE public.site_settings 
ADD COLUMN benefits_section_title TEXT DEFAULT 'Vantagens do OneDrip',
ADD COLUMN benefits_section_subtitle TEXT DEFAULT 'Descubra os benefícios de usar nosso sistema',
ADD COLUMN benefits_data JSONB DEFAULT '[
  {
    "icon": "Zap",
    "title": "Rápido e Eficiente",
    "description": "Crie orçamentos profissionais em menos de 2 minutos"
  },
  {
    "icon": "Shield", 
    "title": "Seguro e Confiável",
    "description": "Seus dados protegidos com tecnologia de ponta"
  },
  {
    "icon": "Users",
    "title": "Suporte Dedicado", 
    "description": "Atendimento brasileiro via WhatsApp quando precisar"
  },
  {
    "icon": "Award",
    "title": "Resultados Comprovados",
    "description": "Mais de 500+ assistências técnicas já confiam no OneDrip"
  }
]'::jsonb;

-- Adicionar campos para seção de depoimentos  
ALTER TABLE public.site_settings
ADD COLUMN testimonials_section_title TEXT DEFAULT 'O que nossos clientes dizem',
ADD COLUMN testimonials_section_subtitle TEXT DEFAULT 'Depoimentos reais de quem já usa o OneDrip',
ADD COLUMN testimonials_data JSONB DEFAULT '[
  {
    "name": "Carlos Silva",
    "role": "Proprietário - TechRepair", 
    "content": "O OneDrip transformou minha assistência. Agora consigo fazer orçamentos profissionais em minutos!",
    "rating": 5
  },
  {
    "name": "Ana Maria",
    "role": "Gerente - CelFix",
    "content": "Sistema incrível! Organização total dos clientes e orçamentos. Recomendo muito!",
    "rating": 5
  },
  {
    "name": "João Santos", 
    "role": "Técnico - MobileTech",
    "content": "Interface simples e funcional. Perfeito para quem quer profissionalizar o negócio.",
    "rating": 5
  }
]'::jsonb;

-- Adicionar campos para seção de FAQ
ALTER TABLE public.site_settings
ADD COLUMN faq_section_title TEXT DEFAULT 'Perguntas Frequentes',
ADD COLUMN faq_section_subtitle TEXT DEFAULT 'Tire suas dúvidas sobre o OneDrip',
ADD COLUMN faq_data JSONB DEFAULT '[
  {
    "question": "Como funciona o período de teste?",
    "answer": "Você tem 7 dias para testar todas as funcionalidades gratuitamente."
  },
  {
    "question": "Posso cancelar a qualquer momento?", 
    "answer": "Sim! Não há fidelidade. Cancele quando quiser pelo WhatsApp."
  },
  {
    "question": "O suporte está incluso?",
    "answer": "Sim! Suporte completo via WhatsApp está incluído em todos os planos."
  },
  {
    "question": "Funciona no celular?",
    "answer": "Perfeitamente! O sistema é responsivo e funciona em qualquer dispositivo."
  }
]'::jsonb;

-- Adicionar campos para controle de visibilidade das seções
ALTER TABLE public.site_settings
ADD COLUMN show_benefits_section BOOLEAN DEFAULT true,
ADD COLUMN show_testimonials_section BOOLEAN DEFAULT true,
ADD COLUMN show_faq_section BOOLEAN DEFAULT true;