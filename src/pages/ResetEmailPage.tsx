import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
export const ResetEmailPage = () => {
  const {
    updateEmail,
    user
  } = useAuth();
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isConfirmation, setIsConfirmation] = useState(false);
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=email_change')) {
      setIsConfirmation(true);
      setMessage({
        type: 'success',
        text: 'Seu endereço de e-mail foi alterado com sucesso! Redirecionando...'
      });

      // Limpa o hash da URL para evitar que a mensagem apareça novamente
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      setTimeout(() => {
        navigate('/dashboard/settings');
      }, 4000);
    }
  }, [navigate]);
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !user) return;
    if (newEmail === user.email) {
      setMessage({
        type: 'error',
        text: 'O novo email não pode ser igual ao atual.'
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    const {
      error
    } = await updateEmail(newEmail);
    setLoading(false);
    if (error) {
      setMessage({
        type: 'error',
        text: `Erro: ${error.message}`
      });
    } else {
      setMessage({
        type: 'success',
        text: 'Um email de confirmação foi enviado para o seu novo endereço. Verifique sua caixa de entrada.'
      });
      setNewEmail('');
    }
  };
  const renderMessage = () => {
    if (!message) return null;
    return <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
        {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        {message.text}
      </div>;
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/lovable-uploads/logoo.png" alt="OneDrip Logo" className="w-20 h-20 mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {isConfirmation ? 'E-mail Alterado!' : 'Alterar Email'}
          </h1>
        </div>

        <Card className="glass-card border-0 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardDescription className="text-center">
              {isConfirmation ? 'Seu novo endereço de e-mail foi confirmado e atualizado.' : <>Seu email atual é <strong>{user?.email}</strong>.<br />Digite o novo endereço e enviaremos um link de confirmação.</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderMessage()}
            {!isConfirmation && <>
                <form onSubmit={handleEmailChange} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email">Novo Endereço de Email</Label>
                    <Input id="email" type="email" placeholder="novo@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 text-base rounded-xl input-focus" />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Enviar Link de Confirmação'}
                  </Button>
                </form>
                <div className="text-center text-sm">
                  
                </div>
              </>}
             {isConfirmation && <div className="text-center text-sm">
                  <Link to="/dashboard/settings" className="underline text-muted-foreground hover:text-primary">
                    Voltar para Configurações
                  </Link>
                </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};