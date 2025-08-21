import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export const VerifyPage = () => {
  const navigate = useNavigate();
  const {
    showError,
    showSuccess
  } = useToast();
  const [timedOut, setTimedOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // A lógica principal agora está no onAuthStateChange do useAuth.tsx.
  // Esta página trata verificação de email e redefinição de senha.

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const tokenHash = window.location.hash;

    // Verificar se é uma confirmação de email bem-sucedida
    if (type === 'signup' || tokenHash.includes('access_token')) {
      const timer = setTimeout(() => {
        setIsSuccess(true);
        showSuccess({
          title: 'Email verificado!',
          description: 'Sua conta foi confirmada com sucesso.'
        });

        // Redirecionar para recovery se for reset de senha
        if (type === 'recovery' || tokenHash.includes('type=recovery')) {
          setTimeout(() => navigate('/reset-password'), 2000);
        } else {
          setTimeout(() => navigate('/dashboard'), 3000);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Timeout para links inválidos
    const timer = setTimeout(() => {
      console.error('A verificação expirou. O link pode ser inválido ou ter expirado.');
      showError({
        title: 'Falha na Verificação',
        description: 'O link de verificação é inválido ou expirou. Por favor, tente novamente.'
      });
      setTimedOut(true);
    }, 15000); // Aumentado para 15 segundos

    return () => clearTimeout(timer);
  }, [showError, showSuccess, navigate]);
  if (isSuccess) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg glass-card">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-success">
              Verificação Concluída!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Seu email foi verificado com sucesso. Você será redirecionado automaticamente.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (timedOut) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg glass-card">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-destructive">
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Não foi possível verificar seu link. Ele pode ter expirado ou já ter sido usado.</p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => navigate('/auth', {
              replace: true
            })} className="w-full">
                Voltar para o Login
              </Button>
              <Link to="/reset-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Solicitar novo link de redefinição
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg glass-card">
        <CardHeader className="text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">
            Verificando Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            Verificando seu link, por favor aguarde...
          </p>
          <p className="text-sm text-muted-foreground">Este processo pode levar alguns segundos coma um cookie enquanto isso.</p>
        </CardContent>
      </Card>
    </div>;
};