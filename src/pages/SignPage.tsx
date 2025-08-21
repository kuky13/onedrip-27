import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  description: string;
}
export const SignPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'success',
    title: '',
    description: ''
  });
  const showToast = (type: 'success' | 'error', title: string, description: string) => {
    setToast({
      show: true,
      type,
      title,
      description
    });
    setTimeout(() => {
      setToast(prev => ({
        ...prev,
        show: false
      }));
    }, 5000);
  };
  const isFormValid = formData.name.trim() && formData.email.trim() && formData.password.length >= 6 && formData.password === formData.confirmPassword;
  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return {
      strength: 'weak',
      color: 'red',
      text: 'Fraca'
    };
    if (password.length < 8) return {
      strength: 'medium',
      color: 'orange',
      text: 'Média'
    };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return {
        strength: 'strong',
        color: 'green',
        text: 'Forte'
      };
    }
    return {
      strength: 'medium',
      color: 'orange',
      text: 'Média'
    };
  };
  const passwordStrength = getPasswordStrength(formData.password);
  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        throw error;
      }
      showToast('success', 'Redirecionando...', `Você será redirecionado para continuar com ${provider === 'google' ? 'Google' : 'Apple'}`);
    } catch (error: any) {
      console.error(`Error with ${provider} signup:`, error);
      showToast('error', 'Erro no cadastro', `Não foi possível conectar com ${provider === 'google' ? 'Google' : 'Apple'}. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name
          }
        }
      });
      if (error) {
        throw error;
      }
      showToast('success', 'Conta criada com sucesso!', 'Verifique seu email para confirmar a conta e fazer login.');

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Error creating account:', error);
      let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado. Tente fazer login.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      }
      showToast('error', 'Erro ao criar conta', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 relative">
      {/* Toast Notification */}
      {toast.show && <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className={`p-4 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'}`}>
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400" />}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                <p className="text-xs mt-1 opacity-90">{toast.description}</p>
              </div>
            </div>
          </div>
        </div>}

      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-60"></div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Criar Conta</h1>
            <p className="text-xs text-muted-foreground">Cadastre-se gratuitamente</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Header Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Bem-vindo!</h2>
            <p className="text-sm text-muted-foreground">Crie sua conta para começar</p>
          </div>

          <Card className="border-0 shadow-lg backdrop-blur-sm bg-background/95">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">Criar nova conta</CardTitle>
              <CardDescription className="text-center">
                Preencha os dados abaixo para se cadastrar
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Social Sign Up Buttons */}
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Cadastre-se rapidamente com</p>
                </div>
                
                <div className="flex justify-center">
                  <Button type="button" variant="outline" onClick={() => handleSocialSignUp('google')} disabled={isLoading} className="h-11 bg-card border-border hover:brightness-110 transition-all duration-300">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  
                  
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou continue com email</span>
                  </div>
                </div>
              </div>

              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                <Input id="name" type="text" placeholder="Seu nome completo" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} className="h-11 text-base" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input id="email" type="email" inputMode="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} className="h-11 text-base" />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Crie uma senha" value={formData.password} onChange={e => setFormData({
                  ...formData,
                  password: e.target.value
                })} className="h-11 text-base pr-11" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-9 w-9" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.password && <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordStrength.color === 'red' ? 'bg-red-500' : passwordStrength.color === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span>Força da senha: {passwordStrength.text}</span>
                  </div>}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirme sua senha" value={formData.confirmPassword} onChange={e => setFormData({
                  ...formData,
                  confirmPassword: e.target.value
                })} className="h-11 text-base pr-11" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-9 w-9" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && <p className="text-xs text-red-500">As senhas não coincidem</p>}
              </div>

              {/* Botão de Criar Conta */}
              <Button onClick={handleSignUp} disabled={!isFormValid || isLoading} className="w-full h-11 text-base mt-6" size="lg">
                {isLoading ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </> : <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Conta
                  </>}
              </Button>

              {/* Link para login */}
              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Fazer login
                </Link>
              </div>

              {/* Link de Suporte */}
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
              
              {/* Links para políticas */}
              <div className="text-center pt-4 border-t border-border/20">
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
        </div>
      </div>
    </div>;
};