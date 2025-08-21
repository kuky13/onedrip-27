import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MobileFormLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;
}

export function MobileFormLayout({
  children,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = 'Próximo',
  backLabel = 'Voltar',
  showProgress = false,
  currentStep = 1,
  totalSteps = 1,
  className,
  isNextDisabled = false,
  isBackDisabled = false,
}: MobileFormLayoutProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('min-h-screen bg-gray-50 md:bg-background', className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b md:hidden">
        <div className="flex items-center justify-between p-4">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isBackDisabled}
              className="p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          
          {onNext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={isNextDisabled}
              className="p-2"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        {showProgress && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Passo {currentStep} de {totalSteps}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isBackDisabled}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
              )}
            </div>
            
            {showProgress && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">
                  Passo {currentStep} de {totalSteps}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 pb-20 md:pb-6">
          <div className="md:hidden">
            {/* Mobile: Full width content */}
            <div className="space-y-4">
              {children}
            </div>
          </div>
          
          <div className="hidden md:block">
            {/* Desktop: Card layout */}
            <Card>
              <CardContent className="p-6">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
        <div className="flex gap-3">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isBackDisabled}
              className="flex-1"
            >
              {backLabel}
            </Button>
          )}
          
          {onNext && (
            <Button
              onClick={onNext}
              disabled={isNextDisabled}
              className="flex-1"
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Bottom Navigation */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between">
            {onBack ? (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isBackDisabled}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            ) : (
              <div />
            )}
            
            {onNext && (
              <Button
                onClick={onNext}
                disabled={isNextDisabled}
                className="flex items-center gap-2"
              >
                {nextLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized form section component
interface MobileFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function MobileFormSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultExpanded = true,
}: MobileFormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mobile: Simple section */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div
            className={cn(
              'flex items-center justify-between',
              collapsible && 'cursor-pointer'
            )}
            onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div>
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {collapsible && (
              <ChevronRight
                className={cn(
                  'h-5 w-5 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </div>
          
          {(!collapsible || isExpanded) && (
            <div className="space-y-4">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Card layout */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Mobile-optimized input wrapper
interface MobileInputWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileInputWrapper({ children, className }: MobileInputWrapperProps) {
  return (
    <div className={cn('space-y-4 md:space-y-6', className)}>
      {children}
    </div>
  );
}

// Hook for mobile detection
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Hook for mobile keyboard handling
export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      // Detect if virtual keyboard is open on mobile
      const heightDifference = window.screen.height - window.innerHeight;
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isKeyboardOpen;
}