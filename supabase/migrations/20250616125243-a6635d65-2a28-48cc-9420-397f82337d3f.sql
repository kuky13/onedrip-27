
-- Create site_settings table to store dynamic configuration for the plans page
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Plan configuration
  plan_name text NOT NULL DEFAULT 'Plano Profissional',
  plan_description text NOT NULL DEFAULT 'Para assistências técnicas que querem crescer',
  plan_price numeric NOT NULL DEFAULT 15,
  plan_currency text NOT NULL DEFAULT 'R$',
  plan_period text NOT NULL DEFAULT '/mês',
  plan_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Payment configuration
  mercadopago_plan_id text,
  payment_url text NOT NULL DEFAULT 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c9380849763dae0019775d20c5b05d3',
  whatsapp_number text NOT NULL DEFAULT '556496028022',
  
  -- Page content
  page_title text NOT NULL DEFAULT 'Escolha seu Plano',
  page_subtitle text NOT NULL DEFAULT 'Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.',
  popular_badge_text text NOT NULL DEFAULT 'Mais Popular',
  cta_button_text text NOT NULL DEFAULT 'Assinar Agora',
  support_text text NOT NULL DEFAULT 'Suporte via WhatsApp incluso',
  
  -- Promotional settings
  show_popular_badge boolean NOT NULL DEFAULT true,
  show_support_info boolean NOT NULL DEFAULT true,
  additional_info text NOT NULL DEFAULT '✓ Sem taxa de setup • ✓ Cancele quando quiser • ✓ Suporte brasileiro'
);

-- Insert default configuration
INSERT INTO public.site_settings (
  plan_features
) VALUES (
  '[
    "Sistema completo de orçamentos",
    "Gestão de clientes ilimitada", 
    "Cálculos automáticos",
    "Controle de dispositivos",
    "Suporte técnico incluso",
    "Atualizações gratuitas",
    "Backup automático"
  ]'::jsonb
);

-- Add RLS policies for admin access only
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view site settings" 
  ON public.site_settings 
  FOR SELECT 
  USING (public.is_current_user_admin());

CREATE POLICY "Admin users can update site settings" 
  ON public.site_settings 
  FOR UPDATE 
  USING (public.is_current_user_admin());

CREATE POLICY "Admin users can insert site settings" 
  ON public.site_settings 
  FOR INSERT 
  WITH CHECK (public.is_current_user_admin());

-- Add trigger to update updated_at column
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
