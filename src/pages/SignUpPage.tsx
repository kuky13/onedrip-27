import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, User, Shield, Calendar, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  licenseDays: number;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  description: string;
}

const AdminUserCreationForm = () => {
  const navigate = useNavigate();
  
  const [userForm, setUserForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    licenseDays: 30
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'success',
    title: '',
    description: ''
  });

  // Verificar autenticação e permissões
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          navigate('/auth');
          return;
        }

        // Verificar se é admin
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          navigate('/dashboard');
          return;
        }

        setCurrentUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const showToast = (type: 'success' | 'error', title: string, description: string) => {
    setToast({ show: true, type, title, description });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const isFormValid = 
    userForm.name.trim() && 
    userForm.email.trim() && 
    userForm.password.length >= 6 && 
    userForm.password === userForm.confirmPassword &&
    userForm.licenseDays > 0;

  const calculateExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + userForm.licenseDays);
    return date.toLocaleDateString('pt-BR');
  };

  const handleCreateUser = async () => {
    if (!isFormValid) return;

    setIsCreating(true);

    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          data: {
            name: userForm.name,
            role: userForm.role
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: authData.user.id,
              name: userForm.name,
              email: userForm.email,
              role: userForm.role,
              license_expires_at: new Date(Date.now() + userForm.licenseDays * 24 * 60 * 60 * 1000).toISOString()
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      showToast(
        'success',
        'Usuário criado com sucesso!',
        `${userForm.name} foi adicionado ao sistema com licença válida até ${calculateExpirationDate()}.`
      );

      // Reset form
      setUserForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        licenseDays: 30
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast(
        'error',
        'Erro ao criar usuário',
        error.message || 'Ocorreu um erro inesperado. Tente novamente.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'weak', color: 'red', text: 'Fraca' };
    if (password.length < 8) return { strength: 'medium', color: 'orange', text: 'Média' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 'strong', color: 'green', text: 'Forte' };
    }
    return { strength: 'medium', color: 'orange', text: 'Média' };
  };

  const passwordStrength = getPasswordStrength(userForm.password);

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-background via-primary/5 to-primary/10 relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-fade-in">
          <div className={`p-4 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                <p className="text-xs mt-1 opacity-90">{toast.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-60"></div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Criar Usuário</h1>
            <p className="text-xs text-muted-foreground">Painel Administrativo</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 h-[calc(100dvh-80px)] overflow-auto">
        <div className="max-w-md mx-auto">
          {/* Header Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Novo Usuário</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo</p>
          </div>

          <Card className="border-0 shadow-lg backdrop-blur-sm bg-background/95">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Nome Completo */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nome completo do usuário"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="email@exemplo.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha do usuário"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="h-11 text-base pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {userForm.password && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        passwordStrength.color === 'red' ? 'bg-red-500' :
                        passwordStrength.color === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                      }`}></div>
                      <span>Força da senha: {passwordStrength.text}</span>
                    </div>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme a senha"
                      value={userForm.confirmPassword}
                      onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                      className="h-11 text-base pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {userForm.confirmPassword && userForm.password !== userForm.confirmPassword && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">Nível de Acesso</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o nível de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dias de Licença */}
                <div className="space-y-2">
                  <Label htmlFor="licenseDays" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Validade da Licença (dias)
                  </Label>
                  <Input
                    id="licenseDays"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="3650"
                    placeholder="30"
                    value={userForm.licenseDays}
                    onChange={(e) => setUserForm({ ...userForm, licenseDays: parseInt(e.target.value) || 30 })}
                    className="h-11 text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Licença válida até: <span className="font-medium">{calculateExpirationDate()}</span>
                  </p>
                </div>



                {/* Botão de Criar */}
                <Button
                  onClick={handleCreateUser}
                  disabled={!isFormValid || isCreating}
                  className="w-full h-11 text-base mt-6"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Criar Usuário
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            <Link to="/dashboard" className="font-medium text-primary hover:underline">
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SignUpPage = () => {
  return <AdminUserCreationForm />;
};