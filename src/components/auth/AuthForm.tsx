

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { useHCaptcha } from '@/hooks/useHCaptcha';
import { isHCaptchaEnabled, getHCaptchaSiteKey, logHCaptchaStatus } from '@/utils/hcaptcha';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, resetPassword, loading, isLoginBlocked } = useSecureAuth();
  const { showSuccess, showError } = useToast();
  const {
    captchaRef,
    captchaToken,
    captchaError,
    resetCaptcha,
    onCaptchaVerify,
    onCaptchaError,
    onCaptchaExpire,
  } = useHCaptcha();

  // Check if hCaptcha is enabled
  const hCaptchaEnabled = isHCaptchaEnabled();
  const hCaptchaSiteKey = getHCaptchaSiteKey();

  // Log hCaptcha status on component mount
  React.useEffect(() => {
    logHCaptchaStatus();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError({
        title: 'Erro no login',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }
    
    // Verificar captcha apenas para login
    if (!captchaToken) {
      showError({
        title: 'Verificação necessária',
        description: 'Por favor, complete a verificação de segurança.',
      });
      return;
    }
    
    // Verificar rate limiting
    if (isLoginBlocked(email)) {
      showError({
        title: 'Limite excedido',
        description: 'Muitas tentativas de login. Aguarde antes de tentar novamente.',
      });
      return;
    }
    
    await signIn({ email, password, captchaToken: hCaptchaEnabled ? captchaToken : null });
    resetCaptcha();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      showError({
        title: 'Erro no cadastro',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }
    await signUp({ email, password, name });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showError({
        title: 'Erro na solicitação',
        description: 'Por favor, insira seu email.',
      });
      return;
    }
    await resetPassword(email);
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        showError({
          title: 'Erro no Login Social',
          description: error.message === 'Provider is not enabled' 
            ? 'Este provedor não está configurado. Entre em contato com o administrador.'
            : error.message
        });
      }
    } catch (error: any) {
      showError({
        title: 'Erro Inesperado',
        description: 'Tente novamente'
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Login Buttons - Only Google */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 h-11"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar com Google</span>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                type="text"
                id="name"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              type="password"
              id="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {/* hCaptcha - only for login and when enabled */}
          {!isSignUp && hCaptchaEnabled && hCaptchaSiteKey && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <HCaptcha
                  ref={captchaRef}
                  sitekey={hCaptchaSiteKey}
                  onVerify={onCaptchaVerify}
                  onError={onCaptchaError}
                  onExpire={onCaptchaExpire}
                  theme="light"
                  size="normal"
                />
              </div>
              {captchaError && (
                <p className="text-sm text-red-600 text-center">{captchaError}</p>
              )}
            </div>
          )}
          
          {/* Info message when hCaptcha is disabled */}
          {!isSignUp && !hCaptchaEnabled && (
            <div className="space-y-2">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  💡 hCaptcha está desabilitado. Para habilitar, configure VITE_HCAPTCHA_SITE_KEY no arquivo .env
                </p>
              </div>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading || (!isSignUp && !captchaToken)}>
            {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>
        </form>

        <div className="text-center">
          {isSignUp ? (
            <>
              Já tem uma conta?{' '}
              <button 
                type="button"
                className="text-primary underline" 
                onClick={() => setIsSignUp(false)}
              >
                Entrar
              </button>
            </>
          ) : (
            <>
              Não tem uma conta?{' '}
              <button 
                type="button"
                className="text-primary underline" 
                onClick={() => setIsSignUp(true)}
              >
                Criar Conta
              </button>
            </>
          )}
        </div>

        {!isSignUp && (
          <div className="text-center">
            <button 
              type="button"
              onClick={handleResetPassword} 
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Esqueceu a senha?
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

