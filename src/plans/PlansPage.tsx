// ============================================
// PÁGINA DE PLANOS - VERSÃO SIMPLIFICADA
// ============================================
// Para editar textos e dados, vá para: src/plans/data/content.ts
// Este arquivo só contém a estrutura da página

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


// Importando os dados editáveis
import { PLANS_CONTENT } from './data/content';

// Importando os componentes
import { PlansHero } from './components/PlansHero';
import { BenefitsSection } from './components/BenefitsSection';
import { PlanCard } from './components/PlanCard';
import { PlanSelector } from './components/PlanSelector';
import TestimonialsSection from './components/testimonialssection';
import { FAQSection } from './components/FAQSection';
import { FinalCTA } from './components/FinalCTA';

// Importando utilitários do WhatsApp
// TODO: Implementar WhatsApp integration
import { toast } from 'sonner';

type BillingCycle = 'monthly' | 'yearly';

export const PlansPage = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isVipSelected, setIsVipSelected] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();



  // Obter dados do plano atual baseado no ciclo selecionado
  const getCurrentPlanData = () => {
    return billingCycle === 'yearly' 
      ? PLANS_CONTENT.planos.anual 
      : PLANS_CONTENT.planos.mensal;
  };

  // Funções de ação
  const aoSelecionarPlano = async () => {
    try {
      setIsProcessingPayment(true);
      
      // TODO: Implementar integração com WhatsApp
      console.log('🚀 Iniciando processo de venda via WhatsApp:', { billingCycle, isVipSelected });
      
      // Placeholder para integração WhatsApp
      toast.success('Redirecionando para WhatsApp...');
      
      // Simular redirecionamento para WhatsApp
      setTimeout(() => {
        window.open('https://wa.me/5511999999999?text=Olá, tenho interesse no plano!', '_blank');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao processar:', error);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsProcessingPayment(false);
    }
  };


  const aoVoltar = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 space-y-20">
        {/* Botão Voltar */}
        <div className="flex justify-start mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={aoVoltar} 
            className="interactive-scale text-foreground hover:text-primary hover:bg-primary/10 border border-border/20 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Seção Principal */}
        <PlansHero 
          logo={PLANS_CONTENT.logo}
          tituloPrincipal={PLANS_CONTENT.titulo_principal}
          subtituloPrincipal={PLANS_CONTENT.subtitulo_principal}
        />

        {/* Seção de Vantagens */}
        <BenefitsSection 
          mostrar={PLANS_CONTENT.vantagens.mostrar_secao}
          titulo={PLANS_CONTENT.vantagens.titulo}
          subtitulo={PLANS_CONTENT.vantagens.subtitulo}
          vantagens={PLANS_CONTENT.vantagens.lista}
        />

        {/* Seletor de Planos */}
        <div className="text-center">
          <PlanSelector 
            selectedCycle={billingCycle}
            onCycleChange={setBillingCycle}
          />
        </div>

        {/* Card do Plano */}
        <PlanCard 
          plano={getCurrentPlanData()}
          aoSelecionarPlano={aoSelecionarPlano}
          isVip={isVipSelected}
          onVipToggle={setIsVipSelected}
          isProcessing={isProcessingPayment}
        />

        {/* Seção de Depoimentos */}
        <TestimonialsSection 
          mostrar={PLANS_CONTENT.depoimentos.mostrar_secao}
          titulo={PLANS_CONTENT.depoimentos.titulo}
          subtitulo={PLANS_CONTENT.depoimentos.subtitulo}
          depoimentos={PLANS_CONTENT.depoimentos.lista}
        />

        {/* Seção de FAQ */}
        <FAQSection 
          mostrar={PLANS_CONTENT.perguntas_frequentes.mostrar_secao}
          titulo={PLANS_CONTENT.perguntas_frequentes.titulo}
          subtitulo={PLANS_CONTENT.perguntas_frequentes.subtitulo}
          perguntas={PLANS_CONTENT.perguntas_frequentes.lista}
        />

        {/* Seção Final */}
        <FinalCTA 
          titulo={PLANS_CONTENT.secao_final.titulo}
          informacoesExtras={getCurrentPlanData().informacoes_extras}
          botaoTexto={PLANS_CONTENT.secao_final.botao_texto}
          aoSelecionarPlano={aoSelecionarPlano}
          isProcessing={isProcessingPayment}
        />
      </div>

      {/* TODO: Implementar modal/componente WhatsApp quando necessário */}
    </div>
  );
};