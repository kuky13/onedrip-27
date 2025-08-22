import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IOSMotion } from '@/components/ui/animations-ios';
import { useIOSOptimization } from '@/hooks/useIOSOptimization';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle,
  Circle
} from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialContent {
  id: string;
  title: string;
  steps?: TutorialStep[];
}

interface IOSTutorialOverlayProps {
  isVisible: boolean;
  content: TutorialContent | null;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onComplete: () => void;
}

export const IOSTutorialOverlay = ({
  isVisible,
  content,
  currentStep,
  onNext,
  onPrev,
  onClose,
  onComplete
}: IOSTutorialOverlayProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { isIOS, safeAreaInsets } = useIOSOptimization();

  const currentStepData = content?.steps?.[currentStep];
  const isLastStep = content && content.steps ? currentStep >= content.steps.length - 1 : false;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (!isVisible || !currentStepData?.target) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(currentStepData.target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    // Delay para permitir que elementos sejam renderizados
    const timer = setTimeout(findTarget, 100);
    
    // Atualizar posição se a tela for redimensionada
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isVisible, currentStepData?.target]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!isVisible || !content || !content.steps || !currentStepData) {
    return null;
  }

  const getOverlayPosition = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const position = currentStepData.position || 'bottom';
    const padding = 16;

    switch (position) {
      case 'top':
        return {
          top: targetRect.top - padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - padding,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)'
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
      style={{
        paddingTop: isIOS ? safeAreaInsets.top : 0,
        paddingBottom: isIOS ? safeAreaInsets.bottom : 0
      }}
    >
      {/* Highlight target element */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-lg bg-primary/10"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Tutorial card */}
      <IOSMotion animation="bounceIn">
        <Card
          className="absolute max-w-sm mx-4 shadow-xl border-2"
          style={getOverlayPosition()}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} de {content.steps?.length || 0}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 h-6 w-6 -mt-1 -mr-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <h3 className="font-semibold mb-2 text-sm">
              {currentStepData.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 mb-4">
              {content.steps?.map((_, index) => (
                <div key={index}>
                  {index <= currentStep ? (
                    <CheckCircle className="h-2 w-2 text-primary" />
                  ) : (
                    <Circle className="h-2 w-2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  className="flex-1 gap-2"
                  style={{ touchAction: 'manipulation' }}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Anterior
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={handleNext}
                className="flex-1 gap-2"
                style={{ touchAction: 'manipulation' }}
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </IOSMotion>
    </div>
  );
};