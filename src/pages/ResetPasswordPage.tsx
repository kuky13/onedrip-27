import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppInfo } from '@/hooks/useAppConfig';
export const ResetPasswordPage = () => {
  const {
    requestPasswordReset,
    updatePassword,
    user
  } = useAuth();
  const {
    name,
    logo
  } = useAppInfo();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTokenFlow, setIsTokenFlow] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  useEffect(() => {
    // A lógica foi simplificada. A página /verify já garante que apenas
    // tokens de recuperação de senha cheguem aqui.
    // Apenas verificamos se o usuário está logado ou se há um token na URL.
    const hash = window.location.hash;
    if (hash.includes('access_token') || user) {
      setIsTokenFlow(true);
      // Limpa o hash da URL para não ficar visível para o usuário
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    await requestPasswordReset(email);
    setLoading(false);
    // User feedback is handled by the toast in useAuth
  };
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'As senhas não coincidem.'
      });
      return;
    }
    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'A senha deve ter pelo menos 6 caracteres.'
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    const {
      error
    } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setMessage({
        type: 'error',
        text: `Erro ao atualizar a senha: ${error.message}`
      });
    } else {
      setMessage({
        type: 'success',
        text: 'Senha atualizada com sucesso! Você será redirecionado.'
      });
      setTimeout(() => {
        if (user) {
          navigate('/dashboard/settings');
        } else {
          navigate('/auth');
        }
      }, 3000);
    }
  };
  const renderMessage = () => {
    if (!message) return null;
    return <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
        {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        {message.text}
      </div>;
  };
  const getTitle = () => {
    if (isTokenFlow) {
      return user ? 'Alterar Senha' : 'Definir Nova Senha';
    }
    return 'Redefinir Senha';
  };
  const backLink = user ? <Link to="/dashboard/settings" className="underline text-muted-foreground hover:text-primary">
      Voltar para Configurações
    </Link> : <Link to="/auth" className="underline text-muted-foreground hover:text-primary">
      Voltar para o Login
    </Link>;
  return <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
            <div className="text-center mb-8">
                <Link to="/">
                    <img src={logo} alt={`${name} Logo`} className="w-24 h-24 mx-auto mb-4" />
                </Link>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                    {getTitle()}
                </h1>
            </div>

            <Card className="glass-card shadow-strong">
                <CardHeader>
                    <CardDescription className="text-center text-base">
                        {isTokenFlow ? 'Digite sua nova senha abaixo.' : 'Digite seu email para receber o link de redefinição.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderMessage()}
                    {isTokenFlow ? <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-2 relative">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 text-base rounded-xl input-focus pr-12" />
                                <Button type="button" variant="ghost" size="icon" className="absolute bottom-1 right-1 h-10 w-10 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                <Input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-12 text-base rounded-xl input-focus" />
                            </div>
                            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Atualizar Senha'}
                            </Button>
                        </form> : <form onSubmit={handleRequestReset} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 text-base rounded-xl input-focus" />
                            </div>
                            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Enviar Link'}
                            </Button>
                        </form>}
                     
                </CardContent>
            </Card>
        </div>
    </div>;
};