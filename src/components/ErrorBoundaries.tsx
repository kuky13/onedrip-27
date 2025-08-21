import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { safeRedirect } from '@/utils/secureNavigation';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
  context?: string;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Enhanced Error Boundary with context awareness
export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.context || 'component'}:`, error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const context = this.props.context || 'componente';
      
      return (
        <div className="min-h-[300px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">
                Erro no {context}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado no {context}. Tente recarregar ou entre em contato se o problema persistir.
              </p>
              
              <div className="space-y-2">
                <Button onClick={this.handleRetry} className="w-full" size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => safeRedirect('/')} 
                  className="w-full" 
                  size="lg"
                >
                  Ir para Início
                </Button>
              </div>

              {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
                <details className="mt-4 p-4 rounded-lg text-left bg-muted">
                  <summary className="cursor-pointer font-medium text-sm text-foreground">
                    Detalhes do erro
                  </summary>
                  <pre className="mt-2 text-xs text-destructive whitespace-pre-wrap font-mono">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized Error Boundaries for different contexts
export const BudgetErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    context="sistema de orçamentos"
    onError={(error) => {
      // Log specific budget errors for analytics
      console.error('Budget system error:', error);
    }}
  >
    {children}
  </EnhancedErrorBoundary>
);

export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    context="sistema de autenticação"
    fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Erro de Autenticação</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Ocorreu um problema com o sistema de login.
            </p>
            <Button 
              onClick={() => safeRedirect('/auth')} 
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    }
  >
    {children}
  </EnhancedErrorBoundary>
);

export const AdminErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    context="painel administrativo"
    showDetails={true}
    onError={(error, errorInfo) => {
      // Report admin errors with higher priority
      console.error('Admin panel error:', error, errorInfo);
    }}
  >
    {children}
  </EnhancedErrorBoundary>
);

export const PDFErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    context="geração de PDF"
    fallback={
      <div className="p-4 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive">
          Erro ao gerar PDF. Tente novamente.
        </p>
      </div>
    }
  >
    {children}
  </EnhancedErrorBoundary>
);

// Hook for programmatic error boundary usage
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'application'}:`, error);
    
    // In a real app, you might want to send this to an error reporting service
    // like Sentry, LogRocket, etc.
  };

  return { handleError };
};