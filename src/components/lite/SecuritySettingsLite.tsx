import React from 'react';
import { openWhatsApp } from '@/utils/whatsappUtils';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, MessageCircle, Lock, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';


export const SecuritySettingsLite = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSupportContact = () => {
    openWhatsApp('https://wa.me/556496028022');
  };

  const handleEmailChange = () => {
    navigate('/reset-email');
  };

  const handlePasswordChange = () => {
    navigate('/reset-password');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Alterar E-mail</p>
              <p className="text-xs text-muted-foreground">
                Altere o endereço do email
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEmailChange}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Alterar
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Alterar Senha</p>
              <p className="text-xs text-muted-foreground">
                Redefinir senha da conta
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePasswordChange}
            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
          >
            Alterar
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Suporte WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Entre em contato pelo WhatsApp
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSupportContact}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            WhatsApp
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <LogOut className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Sair da Conta</p>
              <p className="text-xs text-muted-foreground">
                Fazer logout da aplicação
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Sair
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza de que deseja sair da sua conta? Você precisará fazer login novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={signOut} className="bg-destructive hover:bg-destructive/90">
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};