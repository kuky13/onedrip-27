-- Inserir configurações padrão se não existir nenhum registro
INSERT INTO public.site_settings (
  plan_name,
  plan_description, 
  plan_price,
  plan_currency,
  plan_period,
  plan_features,
  payment_url,
  whatsapp_number,
  page_title,
  page_subtitle,
  popular_badge_text,
  cta_button_text,
  support_text,
  additional_info,
  show_popular_badge,
  show_support_info
) 
SELECT 
  'Plano Profissional',
  'Para assistências técnicas que querem crescer',
  15,
  'R$',
  '/mês',
  '["✓ Orçamentos ilimitados", "✓ Gestão de clientes", "✓ Relatórios detalhados", "✓ Suporte via WhatsApp", "✓ Backup automático dos dados"]'::jsonb,
  'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=bbb0d6d04e3440f395e562d80f870761',
  '556496028022',
  'Escolha seu Plano',
  'Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.',
  'Mais Popular',
  'Assinar Agora',
  'Suporte via WhatsApp incluso',
  '✓ Sem taxa de setup • ✓ Cancele quando quiser • ✓ Suporte brasileiro',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);