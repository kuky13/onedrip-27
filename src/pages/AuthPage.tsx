
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLicenseValidation } from '@/hooks/useLicenseValidation';
import { Separator } from '@/components/ui/separator';
import { LicenseActivationSection } from '@/components/auth/LicenseActivationSection';
import { LicenseActivationIOS } from '@/components/auth/LicenseActivationIOS';
import { useIOSDetection } from '@/hooks/useIOSDetection';


export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, requestPasswordReset, loading, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const { data: isLicenseValid } = useLicenseValidation();
  const isIOS = useIOSDetection();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError({
        title: 'Erro no login',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }
    await signIn(email, password);
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
    await signUp(email, password, { name });
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
    await requestPasswordReset(email);
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

  const handleLicenseActivated = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">OneDrip</h1>
          </div>
          <p className="text-muted-foreground">Sistema de gestão inteligente</p>
        </div>
        
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors" 
                disabled={loading}
              >
                {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>
            <div className="text-center text-sm">
              {isSignUp ? (
                <>
                  <span className="text-muted-foreground">Já tem uma conta? </span>
                  <button 
                    type="button"
                    className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium transition-colors" 
                    onClick={() => setIsSignUp(false)}
                  >
                    Entrar
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">Não tem uma conta? </span>
                  <button 
                    type="button"
                    className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium transition-colors" 
                    onClick={() => setIsSignUp(true)}
                  >
                    Criar Conta
                  </button>
                </>
              )}
            </div>
            {isSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => openWhatsApp('https://wa.me/556496028022')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Precisa de ajuda? Fale conosco
                </button>
              </div>
            )}
            {!isSignUp && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={() => openWhatsApp('https://wa.me/64996028022')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Suporte
                  </button>
                </div>
              </div>
            )}
            
            {/* Links para políticas */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <Link 
                  to="/terms" 
                  className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Termos de Uso
                </Link>
                <span>•</span>
                <Link 
                  to="/privacy" 
                  className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Privacidade
                </Link>
                <span>•</span>
                <Link 
                  to="/cookies" 
                  className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Activation Section - Only show if user is logged in but license is invalid */}
        {user && isLicenseValid === false && (
          isIOS ? (
            <LicenseActivationIOS 
              user={user} 
              onLicenseActivated={handleLicenseActivated}
            />
          ) : (
            <LicenseActivationSection 
              user={user} 
              onLicenseActivated={handleLicenseActivated}
            />
          )
        )}
      </div>
    </div>
  );
};
