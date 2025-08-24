import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PlansHero } from '@/components/plans/PlansHero';
import { BenefitsSection } from '@/components/plans/BenefitsSection';
import { PlanCard } from '@/components/plans/PlanCard';
import { TestimonialsSection } from '@/components/plans/TestimonialsSection';
import { FAQSection } from '@/components/plans/FAQSection';
import { FinalCTA } from '@/components/plans/FinalCTA';
import { startPixPayment, type PixPreferenceResponse } from '@/services/paymentService';
import PixPaymentModal from '@/components/PixPaymentModal';

interface SiteSettings {
  plan_name: string;
  plan_description: string;
  plan_price: number;
  plan_currency: string;
  plan_period: string;
  plan_features: string[];
  whatsapp_number: string;
  page_title: string;
  page_subtitle: string;
  popular_badge_text: string;
  cta_button_text: string;
  support_text: string;
  show_popular_badge: boolean;
  show_support_info: boolean;
  additional_info: string;
  
  // New fields for expanded editing
  benefits_section_title?: string;
  benefits_section_subtitle?: string;
  benefits_data?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  show_benefits_section?: boolean;
  
  testimonials_section_title?: string;
  testimonials_section_subtitle?: string;
  testimonials_data?: Array<{
    name: string;
    role: string;
    content: string;
    rating: number;
  }>;
  show_testimonials_section?: boolean;
  
  faq_section_title?: string;
  faq_section_subtitle?: string;
  faq_data?: Array<{
    question: string;
    answer: string;
  }>;
  show_faq_section?: boolean;
}

export const PlansPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isVip, setIsVip] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixPaymentData, setPixPaymentData] = useState<PixPreferenceResponse | null>(null);
  const navigate = useNavigate();

  // Fetch site settings from database
  const {
    data: settings,
    isLoading
  } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('site_settings').select('*').single();
      
      if (error) {
        console.error('Error fetching site settings:', error);
        return null;
      }
      
      return data;
    }
  });

  useEffect(() => { document.title = "Planos | OneDrip"; }, []);
  
  const handlePixPayment = async () => {
    try {
      console.log('Iniciando pagamento PIX:', { billingCycle, isVip });
      
      // Email temporário para desenvolvimento - em produção, pegar do usuário logado
      const userEmail = 'usuario@exemplo.com';
      
      const paymentData = await startPixPayment(billingCycle, isVip, userEmail);
      
      if (paymentData) {
        setPixPaymentData(paymentData);
        setIsPixModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao iniciar pagamento PIX:', error);
    }
  };
  
  const handlePixModalClose = () => {
    setIsPixModalOpen(false);
    setPixPaymentData(null);
  };
  
  const handlePaymentSuccess = () => {
    console.log('Pagamento realizado com sucesso!');
    // Aqui você pode redirecionar para uma página de sucesso ou atualizar o estado do usuário
    navigate('/dashboard'); // ou outra página apropriada
  };

  const handleGoBack = () => {
    navigate('/');
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center">
        <div className="loading-shimmer w-16 h-16 rounded-full"></div>
      </div>;
  }

      // Use settings or fallback values with proper type conversion
      const config = {
        // Ensure we have all the new fields with fallbacks and proper type casting
        benefits_section_title: settings?.benefits_section_title || 'Vantagens do Oliver',
        benefits_section_subtitle: settings?.benefits_section_subtitle || 'Descubra os benefícios de usar nosso sistema',
        benefits_data: (settings?.benefits_data as any) || [
          { icon: "Zap", title: "Rápido e Eficiente", description: "Crie orçamentos profissionais em menos de 2 minutos" },
          { icon: "Shield", title: "Seguro e Confiável", description: "Seus dados protegidos com tecnologia de ponta" },
          { icon: "Users", title: "Suporte Dedicado", description: "Atendimento brasileiro via WhatsApp quando precisar" },
          { icon: "Award", title: "Resultados Comprovados", description: "Mais de 500+ assistências técnicas já confiam no Oliver" }
        ],
        show_benefits_section: settings?.show_benefits_section ?? true,
        
        testimonials_section_title: settings?.testimonials_section_title || 'O que nossos clientes dizem',
        testimonials_section_subtitle: settings?.testimonials_section_subtitle || 'Depoimentos reais de quem já usa o Oliver',
        testimonials_data: (settings?.testimonials_data as any) || [
          { name: "Carlos Silva", role: "Proprietário - TechRepair", content: "O Oliver transformou minha assistência. Agora consigo fazer orçamentos profissionais em minutos!", rating: 5 },
          { name: "Ana Maria", role: "Gerente - CelFix", content: "Sistema incrível! Organização total dos clientes e orçamentos. Recomendo muito!", rating: 5 },
          { name: "João Santos", role: "Técnico - MobileTech", content: "Interface simples e funcional. Perfeito para quem quer profissionalizar o negócio.", rating: 5 }
        ],
        show_testimonials_section: settings?.show_testimonials_section ?? true,
        
        faq_section_title: settings?.faq_section_title || 'Perguntas Frequentes',
        faq_section_subtitle: settings?.faq_section_subtitle || 'Tire suas dúvidas sobre o Oliver',
        faq_data: (settings?.faq_data as any) || [
          { question: "Como funciona o período de teste?", answer: "Você tem 2 dias para testar todas as funcionalidades gratuitamente." },
          { question: "Posso cancelar a qualquer momento?", answer: "Sim! Não há fidelidade. Cancele quando quiser pelo WhatsApp." },
          { question: "O suporte está incluso?", answer: "Sim! Suporte completo via WhatsApp está incluído em todos os planos." },
          { question: "Funciona no celular?", answer: "Perfeitamente! O sistema é responsivo e funciona em qualquer dispositivo." }
        ],
        show_faq_section: settings?.show_faq_section ?? true,
        
        // Existing fields with fallbacks
        plan_name: settings?.plan_name || 'Plano Profissional',
        plan_description: settings?.plan_description || 'Para assistências técnicas que querem crescer',
        plan_price: settings?.plan_price || 45,
        plan_currency: settings?.plan_currency || 'R$',
        plan_period: settings?.plan_period || '/mês',
        plan_features: (settings?.plan_features as string[]) || ["Sistema completo de orçamentos", "Gestão de clientes ilimitada", "Cálculos automáticos", "Controle de dispositivos", "Suporte técnico incluso", "Atualizações gratuitas", "Backup automático"],
        whatsapp_number: settings?.whatsapp_number || '556496028022',
        page_title: settings?.page_title || 'Escolha seu Plano',
        page_subtitle: settings?.page_subtitle || 'Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.',
        popular_badge_text: settings?.popular_badge_text || 'Mais Popular',
        cta_button_text: settings?.cta_button_text || 'Assinar Agora',
        support_text: settings?.support_text || 'Suporte via WhatsApp incluso',
        show_popular_badge: settings?.show_popular_badge ?? true,
        show_support_info: settings?.show_support_info ?? true,
        additional_info: settings?.additional_info || '✓ Sem taxa de setup • ✓ Cancele quando quiser • ✓ Suporte brasileiro'
      };
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background decoration com as novas cores */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-primary/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
      </div>


      <div className="relative z-10 container mx-auto px-4 py-12 space-y-20">
        {/* Back Button */}
        <div className="flex justify-start mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGoBack} 
            className="interactive-scale text-foreground hover:text-primary hover:bg-primary/10 border border-border/20 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <PlansHero pageTitle={config.page_title} pageSubtitle={config.page_subtitle} />
        <BenefitsSection 
          title={config.benefits_section_title}
          subtitle={config.benefits_section_subtitle}
          benefits={config.benefits_data}
          show={config.show_benefits_section}
        />
        {/* Billing cycle toggle */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="flex items-center justify-center gap-2">
            <Button variant={billingCycle === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('monthly')}>
              Mensal
            </Button>
            <Button variant={billingCycle === 'yearly' ? 'default' : 'outline'} size="sm" onClick={() => setBillingCycle('yearly')}>
              Anual <span className="ml-2 text-xs text-muted-foreground">(2 meses grátis)</span>
            </Button>
          </div>
          
          {/* VIP toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button variant={!isVip ? 'default' : 'outline'} size="sm" onClick={() => setIsVip(false)}>
              Plano Normal
            </Button>
            <Button variant={isVip ? 'default' : 'outline'} size="sm" onClick={() => setIsVip(true)}>
              Plano VIP <span className="ml-2 text-xs text-muted-foreground">(Recursos extras)</span>
            </Button>
          </div>
        </div>
        <PlanCard 
          config={{
            ...config,
            plan_name: isVip ? `${config.plan_name} VIP` : config.plan_name,
            plan_description: isVip ? `${config.plan_description} + Recursos VIP` : config.plan_description,
            plan_price: billingCycle === 'yearly' ? Math.round(config.plan_price * 12 * 0.83) : config.plan_price,
            plan_period: billingCycle === 'yearly' ? '/ano' : config.plan_period,
            plan_features: isVip ? [...config.plan_features, "Recursos VIP exclusivos", "Suporte prioritário", "Funcionalidades avançadas"] : config.plan_features,
          }} 
          onPlanSelection={handlePixPayment} 
        />
        <TestimonialsSection 
          title={config.testimonials_section_title}
          subtitle={config.testimonials_section_subtitle}
          testimonials={config.testimonials_data}
          show={config.show_testimonials_section}
        />
        <FAQSection 
          title={config.faq_section_title}
          subtitle={config.faq_section_subtitle}
          faqs={config.faq_data}
          show={config.show_faq_section}
        />
        <FinalCTA 
          additionalInfo={config.additional_info} 
          ctaButtonText={config.cta_button_text}
          onPlanSelection={handlePixPayment}
        />
        
        {/* Footer com links para políticas */}
        <div className="text-center py-8 border-t border-border/20">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link 
              to="/terms" 
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Termos de Uso
            </Link>
            <span>•</span>
            <Link 
              to="/privacy" 
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link 
              to="/cookies" 
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/80 backdrop-blur-md p-3 md:hidden">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <Button onClick={handlePixPayment} className="flex-1">
            {config.cta_button_text}
          </Button>
          <a
            href={`https://wa.me/${config.whatsapp_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Dúvidas?
          </a>
        </div>
      </div>
      
      {/* Modal PIX */}
      {isPixModalOpen && pixPaymentData && (
        <PixPaymentModal
          isOpen={isPixModalOpen}
          onClose={handlePixModalClose}
          paymentData={pixPaymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}


    </div>;
};