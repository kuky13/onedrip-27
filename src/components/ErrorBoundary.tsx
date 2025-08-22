import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };
  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined
    });
  };
  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">Oops! Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato conosco se o problema persistir.
              </p>
              
              <div className="space-y-2">
                <Button onClick={this.handleRetry} className="w-full" size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full" size="lg">
                  Ir para Início
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/auth'} 
                  className="w-full text-sm"
                >
                  Voltar ao Login
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && <details className="mt-4 p-4 rounded-lg text-left bg-muted">
                  <summary className="cursor-pointer font-medium text-sm text-foreground">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs text-destructive whitespace-pre-wrap font-mono">
                    {this.state.error.stack}
                  </pre>
                </details>}
            </CardContent>
          </Card>
        </div>;
    }
    return this.props.children;
  }
}