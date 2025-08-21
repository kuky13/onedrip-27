-- Atualizar o valor padrão da URL de pagamento na tabela site_settings
UPDATE public.site_settings 
SET payment_url = 'https://mpago.la/246f2WV'
WHERE payment_url = 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c9380849763dae0019775d20c5b05d3' 
   OR payment_url IS NULL;

-- Se não existe nenhum registro, criar um com valores padrão
INSERT INTO public.site_settings (
  payment_url,
  plan_name,
  plan_description,
  plan_price,
  plan_currency,
  plan_period,
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
  'https://mpago.la/246f2WV',
  'Plano Profissional',
  'Para assistências técnicas que querem crescer',
  15,
  'R$',
  '/mês',
  '556496028022',
  'Escolha seu Plano',
  'Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.',
  'Mais Popular',
  'Assinar Agora',
  'Suporte via WhatsApp incluso',
  '✓ Sem taxa de setup • ✓ Cancele quando quiser • ✓ Suporte brasileiro',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);