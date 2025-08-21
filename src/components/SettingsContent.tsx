import React from 'react';
import { ProfileSettings } from '@/components/ProfileSettings';
import { CompanySettings } from '@/components/CompanySettings';
import { SecuritySettings } from '@/components/SecuritySettings';
import { BudgetWarningSettings } from './BudgetWarningSettings';
import { AdvancedFeaturesSettings } from './AdvancedFeaturesSettings';
import { BetaFeaturesSettings } from './BetaFeaturesSettings';
import { CacheClearSettings } from './CacheClearSettings';
import { BudgetImportExport } from './BudgetImportExport';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText, Shield, Cookie } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export const SettingsContent = () => {
  const { signOut } = useAuth();
  
  return <div className="p-4 lg:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Gerencie seu perfil, empresa e preferências da aplicação.
        </p>
      </header>

      <div className="space-y-12">
        <section id="account-settings">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">
            Conta e Segurança
          </h2>
          <Separator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
            <ProfileSettings />
            <SecuritySettings />
          </div>
        </section>
        
        <section id="app-settings">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">
            Preferências da Aplicação
          </h2>
          <Separator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
            <CompanySettings />
            <BudgetWarningSettings />
          </div>
        </section>
        
        <section id="advanced-features">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">Recursos Avançados [BETA]</h2>
          <Separator />
          <div className="pt-6">
            <AdvancedFeaturesSettings />
          </div>
        </section>
        
        <section id="beta-features">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">Funcionalidades Beta</h2>
          <Separator />
          <div className="pt-6">
            <BetaFeaturesSettings />
          </div>
        </section>
        
        <section id="data-management">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">Gerenciamento de Dados</h2>
          <Separator />
          <div className="pt-6">
            <BudgetImportExport />
          </div>
        </section>
        
        <section id="policies-terms">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">Políticas e Termos</h2>
          <Separator />
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open('/terms', '_blank')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Termos de Uso
                </CardTitle>
                <CardDescription>
                  Consulte os termos e condições de uso da plataforma
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open('/privacy', '_blank')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Política de Privacidade
                </CardTitle>
                <CardDescription>
                  Saiba como protegemos e utilizamos seus dados
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open('/cookies', '_blank')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cookie className="h-5 w-5" />
                  Política de Cookies
                </CardTitle>
                <CardDescription>
                  Entenda como utilizamos cookies em nosso site
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
        
        <section id="account-actions">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground pb-4">Ações da Conta</h2>
          <Separator />
          <div className="pt-6 space-y-6">
            <CacheClearSettings />
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Sair da Conta</CardTitle>
                <CardDescription>
                  Desconecte-se da sua conta. Você precisará fazer login novamente para acessar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <LogOut className="h-4 w-4" />
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
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>;
};