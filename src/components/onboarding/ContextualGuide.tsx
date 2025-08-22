import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  Lightbulb,
  MousePointer,
  Hand,
  Zap,
  Star,
  CheckCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualGuideProps {
  isOpen: boolean;
  onClose: () => void;
  guideType: 'first-use' | 'feature-discovery' | 'workflow-tips';
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export const ContextualGuide = ({
  isOpen,
  onClose,
  guideType,
  currentStep = 0,
  onStepChange
}: ContextualGuideProps) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [hasInteracted, setHasInteracted] = useState(false);

  const guides: Record<string, GuideStep[]> = {
    'first-use': [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Budget Manager!',
        description: 'Vamos te mostrar como criar e gerenciar orçamentos de forma rápida e eficiente.',
        position: 'center',
        icon: <Star className="h-6 w-6 text-primary" />
      },
      {
        id: 'create-budget',
        title: 'Criar Novo Orçamento',
        description: 'Clique no botão "+" para criar seu primeiro orçamento. É rápido e fácil!',
        target: '[data-guide="create-button"]',
        position: 'bottom',
        icon: <Zap className="h-5 w-5 text-blue-500" />,
        action: {
          label: 'Criar Orçamento',
          onClick: () => {
            // Trigger create action
            setHasInteracted(true);
          }
        }
      },
      {
        id: 'budget-cards',
        title: 'Seus Orçamentos',
        description: 'Aqui você verá todos os seus orçamentos. Clique em qualquer card para ver mais detalhes.',
        target: '[data-guide="budget-card"]',
        position: 'top',
        icon: <Eye className="h-5 w-5 text-green-500" />
      },
      {
        id: 'quick-actions',
        title: 'Ações Rápidas',
        description: 'Use os botões para enviar via WhatsApp, gerar PDF ou editar rapidamente.',
        target: '[data-guide="quick-actions"]',
        position: 'top',
        icon: <MousePointer className="h-5 w-5 text-purple-500" />
      }
    ],
    'feature-discovery': [
      {
        id: 'search-filters',
        title: 'Busca Avançada',
        description: 'Use filtros avançados para encontrar orçamentos específicos rapidamente.',
        target: '[data-guide="search-bar"]',
        position: 'bottom',
        icon: <Lightbulb className="h-5 w-5 text-yellow-500" />
      },
      {
        id: 'bulk-operations',
        title: 'Operações em Lote',
        description: 'Selecione múltiplos orçamentos para ações em massa como exportar ou arquivar.',
        target: '[data-guide="bulk-select"]',
        position: 'bottom',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      },
        {
          id: 'swipe-gestures',
          title: 'Gestos de Deslizar',
          description: 'No mobile, deslize os cards para acessar ações rápidas.',
          target: '[data-guide="swipe-card"]',
          position: 'center',
          icon: <Hand className="h-5 w-5 text-blue-500" />
        }
    ],
    'workflow-tips': [
      {
        id: 'status-workflow',
        title: 'Fluxo de Status',
        description: 'Acompanhe o progresso: Pendente → Aprovado → Pago → Entregue',
        position: 'center',
        icon: <ArrowRight className="h-5 w-5 text-primary" />
      },
      {
        id: 'notifications',
        title: 'Notificações Inteligentes',
        description: 'Receba alertas sobre orçamentos próximos do vencimento.',
        position: 'center',
        icon: <Zap className="h-5 w-5 text-orange-500" />
      },
      {
        id: 'export-options',
        title: 'Opções de Exportação',
        description: 'Exporte para PDF individual ou CSV em lote para relatórios.',
        position: 'center',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      }
    ]
  };

  const currentGuide = guides[guideType] || [];
  const step = currentGuide[activeStep];

  useEffect(() => {
    if (onStepChange) {
      onStepChange(activeStep);
    }
  }, [activeStep, onStepChange]);

  const nextStep = () => {
    if (activeStep < currentGuide.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const skipGuide = () => {
    onClose();
  };

  if (!isOpen || !step) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={skipGuide} />

      {/* Spotlight Effect */}
      {step.target && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bg-primary/20 rounded-2xl w-32 h-32 top-20 right-8" />
        </div>
      )}

      {/* Guide Card */}
      <div className={cn(
        "absolute pointer-events-auto animate-fade-in",
        step.position === 'center' && "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        step.position === 'top' && "top-4 left-1/2 transform -translate-x-1/2",
        step.position === 'bottom' && "bottom-4 left-1/2 transform -translate-x-1/2",
        step.position === 'left' && "left-4 top-1/2 transform -translate-y-1/2",
        step.position === 'right' && "right-4 top-1/2 transform -translate-y-1/2"
      )}>
        <Card className="card-premium w-80 max-w-[90vw] shadow-xl border-primary/20">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Passo {activeStep + 1} de {currentGuide.length}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipGuide}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Action Button */}
            {step.action && (
              <div className="mb-4">
                <Button
                  onClick={step.action.onClick}
                  className="w-full gap-2"
                  variant={hasInteracted ? "outline" : "default"}
                >
                  {hasInteracted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <MousePointer className="h-4 w-4" />
                  )}
                  {hasInteracted ? 'Concluído!' : step.action.label}
                </Button>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="mb-4">
              <div className="flex items-center gap-1">
                {currentGuide.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200",
                      index === activeStep ? "bg-primary flex-1" : "bg-muted w-2"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={activeStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipGuide}
                  className="text-muted-foreground"
                >
                  Pular
                </Button>
                
                <Button
                  onClick={nextStep}
                  className="gap-2"
                >
                  {activeStep === currentGuide.length - 1 ? 'Concluir' : 'Próximo'}
                  {activeStep !== currentGuide.length - 1 && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Guide Type Badge */}
            <div className="absolute -top-2 -right-2">
              <Badge variant="secondary" className="text-xs">
                {guideType === 'first-use' && '🚀 Início'}
                {guideType === 'feature-discovery' && '✨ Descobrir'}
                {guideType === 'workflow-tips' && '💡 Dicas'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Touch Hint for Mobile */}
      {step.target && (
        <div className="absolute pointer-events-none animate-pulse bottom-20 right-8">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-full animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
};