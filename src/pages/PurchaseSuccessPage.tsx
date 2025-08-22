import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppInfo, useContactInfo } from '@/hooks/useAppConfig';

export const PurchaseSuccessPage = () => {
  const { name, logo } = useAppInfo();
  const { whatsapp, whatsappUrl } = useContactInfo();
  
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>

      {/* Theme toggle */}

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <img src={logo} alt={`${name} Logo`} className="h-12 w-12" />
            <h1 className="text-4xl font-bold text-foreground">{name}</h1>
          </div>
        </div>

        {/* Success Card */}
        <div className="max-w-md mx-auto">
          <Card className="glass-card animate-scale-in border-0 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-foreground mb-2">Pagamento Confirmado!</CardTitle>
              <CardDescription className="text-base">
                Obrigado por escolher o {name} para sua assistência técnica
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-center">Próximos Passos:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Envie o comprovante de pagamento via WhatsApp</li>
                  <li>Aguarde nossa confirmação (geralmente em minutos)</li>
                  <li>Receba suas credenciais de acesso</li>
                  <li>Comece a usar o {name} imediatamente!</li>
                </ol>
              </div>

              {/* WhatsApp Contact Button */}
              <Button onClick={() => window.open(whatsappUrl, '_blank')} className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl" size="lg">
                <MessageCircle className="h-5 w-5 mr-2" />
                Enviar Comprovante via WhatsApp
              </Button>

              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>WhatsApp:</strong> {whatsapp}
                </p>
                <p className="text-xs text-muted-foreground">Suporte disponível de segunda a sábado, das 8h às 18h</p>
              </div>

              {/* Back to login */}
              <div className="text-center">
                <Link to="/auth" className="text-primary hover:underline text-sm font-medium">
                  Ir para o Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            ✓ Ativação rápida • ✓ Suporte incluído • ✓ Sem taxa de setup
          </p>
        </div>
      </div>
    </div>;
};