import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Target,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpContent } from '@/hooks/useHelpSystem';

interface TutorialOverlayProps {
  isVisible: boolean;
  content: HelpContent | null;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onComplete: () => void;
}

export const TutorialOverlay = ({
  isVisible,
  content,
  currentStep,
  onNext,
  onPrev,
  onClose,
  onComplete
}: TutorialOverlayProps) => {
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] = useState<NodeJS.Timeout | null>(null);

  const steps = content?.steps || [];
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Destacar elemento alvo
  useEffect(() => {
    if (!isVisible || !currentStepData?.target) return;

    const element = document.querySelector(currentStepData.target);
    setHighlightedElement(element);

    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }

    return () => setHighlightedElement(null);
  }, [isVisible, currentStepData?.target]);

  // Auto-avançar tutorial
  useEffect(() => {
    if (!isPlaying || !isVisible) return;

    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
    }

    const timeout = setTimeout(() => {
      if (!isLastStep) {
        onNext();
      } else {
        setIsPlaying(false);
      }
    }, 8000); // 8 segundos por step

    setAutoAdvanceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentStep, isPlaying, isVisible, isLastStep, onNext]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
    };
  }, [autoAdvanceTimeout]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  const getTooltipPosition = (): string => {
    if (!currentStepData?.position) return 'bottom';
    
    switch (currentStepData.position) {
      case 'top': return 'bottom-full mb-2';
      case 'bottom': return 'top-full mt-2';
      case 'left': return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right': return 'left-full ml-2 top-1/2 -translate-y-1/2';
      default: return 'top-full mt-2';
    }
  };

  if (!isVisible || !content || !currentStepData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" />

      {/* Spotlight do elemento destacado */}
      {highlightedElement && (
        <div className="absolute pointer-events-none">
          <div 
            className="absolute bg-primary/20 rounded-lg animate-pulse"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 8,
              left: highlightedElement.getBoundingClientRect().left - 8,
              width: highlightedElement.getBoundingClientRect().width + 16,
              height: highlightedElement.getBoundingClientRect().height + 16,
            }}
          />
        </div>
      )}

      {/* Tooltip/Card do tutorial */}
      <div className={cn(
        "absolute pointer-events-auto animate-fade-in z-10",
        highlightedElement ? "fixed" : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      )} style={highlightedElement ? {
        top: highlightedElement.getBoundingClientRect().top,
        left: highlightedElement.getBoundingClientRect().left,
      } : {}}>
        
        <div className={cn(
          "relative",
          highlightedElement && getTooltipPosition()
        )}>
          <Card className="w-80 max-w-[90vw] shadow-xl border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">
                      {currentStepData.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Passo {currentStep + 1} de {steps.length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Conteúdo */}
              <div className="mb-6">
                <p className="text-foreground leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* Indicador de progresso */}
              <div className="mb-4">
                <div className="flex items-center gap-1 mb-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-2 rounded-full transition-all duration-200",
                        index === currentStep ? "bg-primary flex-1" : 
                        index < currentStep ? "bg-primary/60 w-2" : "bg-muted w-2"
                      )}
                    />
                  ))}
                </div>
                
                {/* Auto-play indicator */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tutorial {isPlaying ? 'automático' : 'pausado'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="h-6 w-6 p-0"
                  >
                    {isPlaying ? 
                      <Pause className="h-3 w-3" /> : 
                      <Play className="h-3 w-3" />
                    }
                  </Button>
                </div>
              </div>

              {/* Navegação */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrev}
                    disabled={isFirstStep}
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
                    onClick={onClose}
                    className="text-muted-foreground"
                  >
                    Pular Tutorial
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    className="gap-2"
                  >
                    {isLastStep ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Concluir
                      </>
                    ) : (
                      <>
                        Próximo
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Badge do tipo de tutorial */}
              <div className="absolute -top-2 -right-2">
                <Badge variant="secondary" className="text-xs">
                  📚 Tutorial
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};