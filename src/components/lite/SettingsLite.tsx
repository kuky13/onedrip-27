import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Building2, Shield, Settings, Save, Star, Database, FileText, Cookie } from 'lucide-react';
import { useIOSDetection } from '@/hooks/useIOSDetection';
import { ProfileSettingsLite } from '@/components/lite/ProfileSettingsLite';
import { SecuritySettingsLite } from '@/components/lite/SecuritySettingsLite';
import { CompanySettingsLite } from '@/components/lite/CompanySettingsLite';
import { BudgetWarningSettingsLite } from '@/components/lite/BudgetWarningSettingsLite';
import { AdvancedFeaturesSettingsLite } from '@/components/lite/AdvancedFeaturesSettingsLite';
import { CacheClearSettingsLite } from '@/components/lite/CacheClearSettingsLite';
import { BudgetImportExportLite } from '@/components/lite/BudgetImportExportLite';
interface SettingsLiteProps {
  userId: string;
  profile: any;
  onBack: () => void;
}
export const SettingsLite = ({
  userId,
  profile,
  onBack
}: SettingsLiteProps) => {
  const [activeSection, setActiveSection] = useState<string>('account');
  const { isIOS } = useIOSDetection();
  
  const sections = [{
    id: 'account',
    name: 'Conta e Segurança',
    icon: User
  }, {
    id: 'app',
    name: 'Preferências da Aplicação',
    icon: Settings
  }, {
    id: 'data',
    name: 'Gerenciamento de Dados',
    icon: Database
  }, {
    id: 'policies',
    name: 'Políticas e Termos',
    icon: FileText
  }
  // Seção "Recursos Avançados" removida da navegação mas funcionalidade mantida
  ];
  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <div className="space-y-6">
            <ProfileSettingsLite userId={userId} profile={profile} />
            <SecuritySettingsLite />
          </div>;
      case 'app':
        return <div className="space-y-6">
            <BudgetWarningSettingsLite userId={userId} profile={profile} />
            <CompanySettingsLite userId={userId} profile={profile} />
            <CacheClearSettingsLite />
          </div>;
      case 'data':
        return <div className="space-y-6">
            <BudgetImportExportLite />
          </div>;
      case 'policies':
        return <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.open('/terms', '_blank')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Termos de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Consulte os termos e condições de uso da plataforma
                </p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.open('/privacy', '_blank')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Política de Privacidade
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Saiba como protegemos e utilizamos seus dados
                </p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.open('/cookies', '_blank')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cookie className="h-5 w-5" />
                  Política de Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Entenda como utilizamos cookies em nosso site
                </p>
              </CardContent>
            </Card>
          </div>;
      case 'advanced':
        return <div className="space-y-6">
            <AdvancedFeaturesSettingsLite userId={userId} profile={profile} />
          </div>;
      default:
        return null;
    }
  };
  return <div className="h-[100dvh] bg-background flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        
      </div>

      <div className="flex-1 overflow-auto">
        {/* Section tabs */}
        <div className="p-4 border-b">
          <div className="flex gap-2 overflow-x-auto">
            {sections.map(section => {
            const Icon = section.icon;
            return <Button 
              key={section.id} 
              variant={activeSection === section.id ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveSection(section.id)} 
              className="flex items-center justify-center min-w-[40px]">
                  <Icon className="h-4 w-4" />
                </Button>;
          })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>;
};