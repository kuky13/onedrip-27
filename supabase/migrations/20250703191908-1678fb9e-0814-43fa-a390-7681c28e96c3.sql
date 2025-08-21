-- Insert default site settings data
INSERT INTO site_settings (
  id,
  plan_name,
  plan_description,
  plan_price,
  plan_currency,
  plan_period,
  plan_features,
  whatsapp_number,
  page_title,
  page_subtitle,
  popular_badge_text,
  cta_button_text,
  support_text,
  show_popular_badge,
  show_support_info,
  additional_info,
  payment_url
) VALUES (
  'default-settings',
  'Plano Profissional',
  'Para assistências técnicas que querem crescer',
  15,
  'R$',
  '/mês',
  '["Sistema completo de orçamentos", "Gestão de clientes ilimitada", "Relatórios e estatísticas", "Cálculos automáticos", "Controle de dispositivos", "Suporte técnico incluso", "Atualizações gratuitas", "Backup automático"]',
  '556496028022',
  'Escolha seu Plano',
  'Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.',
  'Mais Popular',
  'Assinar Agora',
  'Suporte via WhatsApp incluso',
  true,
  true,
  '✓ Sem taxa de setup • ✓ Cancele quando quiser • ✓ Suporte brasileiro',
  'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=bbb0d6d04e3440f395e562d80f870761'
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();