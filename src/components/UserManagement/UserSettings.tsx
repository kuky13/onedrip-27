import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  Database, 
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Save,
  RefreshCw,
  Users,
  Clock,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface UserSettingsProps {
  onExportUsers: () => void;
  onImportUsers: (file: File) => void;
  onBackupData: () => void;
  onCleanupInactiveUsers: () => void;
}

export const UserSettings = ({ 
  onExportUsers, 
  onImportUsers, 
  onBackupData, 
  onCleanupInactiveUsers 
}: UserSettingsProps) => {
  const [settings, setSettings] = useState({
    // Configurações de notificação
    emailNotifications: true,
    newUserNotifications: true,
    licenseExpirationNotifications: true,
    systemAlerts: true,
    
    // Configurações de segurança
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: '24',
    passwordPolicy: 'medium',
    
    // Configurações de sistema
    autoCleanupInactive: false,
    inactiveUserDays: '90',
    maxBudgetsPerUser: '10',
    defaultBudgetLimit: '5',
    
    // Configurações de interface
    defaultView: 'table',
    itemsPerPage: '25',
    showDebugInfo: false,
    enableAdvancedFilters: true,
    
    // Configurações de backup
    autoBackup: false,
    backupFrequency: 'weekly',
    retentionDays: '30'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportUsers(file);
    }
  };

  const handleCleanupConfirm = () => {
    if (confirm('Tem certeza que deseja remover usuários inativos? Esta ação não pode ser desfeita.')) {
      onCleanupInactiveUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAdvanced ? 'Ocultar Avançado' : 'Mostrar Avançado'}
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de Notificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receber notificações gerais por email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Novos Usuários</Label>
                <p className="text-sm text-muted-foreground">Notificar quando novos usuários se cadastrarem</p>
              </div>
              <Switch
                checked={settings.newUserNotifications}
                onCheckedChange={(checked) => handleSettingChange('newUserNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Expiração de Licenças</Label>
                <p className="text-sm text-muted-foreground">Alertas sobre licenças próximas do vencimento</p>
              </div>
              <Switch
                checked={settings.licenseExpirationNotifications}
                onCheckedChange={(checked) => handleSettingChange('licenseExpirationNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas do Sistema</Label>
                <p className="text-sm text-muted-foreground">Notificações sobre problemas do sistema</p>
              </div>
              <Switch
                checked={settings.systemAlerts}
                onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Verificação de Email</Label>
                <p className="text-sm text-muted-foreground">Exigir verificação de email para novos usuários</p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Timeout de Sessão</Label>
              <Select 
                value={settings.sessionTimeout} 
                onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="8">8 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="168">7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Política de Senha</Label>
              <Select 
                value={settings.passwordPolicy} 
                onValueChange={(value) => handleSettingChange('passwordPolicy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa (mín. 6 caracteres)</SelectItem>
                  <SelectItem value="medium">Média (mín. 8 caracteres + números)</SelectItem>
                  <SelectItem value="high">Alta (mín. 12 caracteres + símbolos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showAdvanced && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">Habilitar 2FA para administradores</p>
                </div>
                <Switch
                  checked={settings.enableTwoFactor}
                  onCheckedChange={(checked) => handleSettingChange('enableTwoFactor', checked)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciamento de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Limite Padrão de Orçamentos</Label>
              <Input
                type="number"
                value={settings.defaultBudgetLimit}
                onChange={(e) => handleSettingChange('defaultBudgetLimit', e.target.value)}
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Máximo de Orçamentos por Usuário</Label>
              <Input
                type="number"
                value={settings.maxBudgetsPerUser}
                onChange={(e) => handleSettingChange('maxBudgetsPerUser', e.target.value)}
                min="1"
                max="1000"
              />
            </div>

            <div className="space-y-2">
              <Label>Visualização Padrão</Label>
              <Select 
                value={settings.defaultView} 
                onValueChange={(value) => handleSettingChange('defaultView', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Tabela</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Itens por Página</Label>
              <Select 
                value={settings.itemsPerPage} 
                onValueChange={(value) => handleSettingChange('itemsPerPage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ferramentas de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciamento de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onExportUsers} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Usuários
              </Button>
              
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileImport}
                  className="hidden"
                  id="import-users"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('import-users')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Usuários
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={onBackupData} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Backup Completo
            </Button>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Limpeza Automática</Label>
                  <p className="text-sm text-muted-foreground">Remover usuários inativos automaticamente</p>
                </div>
                <Switch
                  checked={settings.autoCleanupInactive}
                  onCheckedChange={(checked) => handleSettingChange('autoCleanupInactive', checked)}
                />
              </div>

              {settings.autoCleanupInactive && (
                <div className="space-y-2">
                  <Label>Dias de Inatividade</Label>
                  <Input
                    type="number"
                    value={settings.inactiveUserDays}
                    onChange={(e) => handleSettingChange('inactiveUserDays', e.target.value)}
                    min="30"
                    max="365"
                  />
                </div>
              )}

              <Button 
                variant="destructive" 
                onClick={handleCleanupConfirm}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Usuários Inativos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações Avançadas */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Configurações Avançadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Interface</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar Informações de Debug</Label>
                    <p className="text-sm text-muted-foreground">Exibir dados técnicos na interface</p>
                  </div>
                  <Switch
                    checked={settings.showDebugInfo}
                    onCheckedChange={(checked) => handleSettingChange('showDebugInfo', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Filtros Avançados</Label>
                    <p className="text-sm text-muted-foreground">Habilitar filtros complexos</p>
                  </div>
                  <Switch
                    checked={settings.enableAdvancedFilters}
                    onCheckedChange={(checked) => handleSettingChange('enableAdvancedFilters', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Backup Automático</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">Fazer backup dos dados automaticamente</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </div>

                {settings.autoBackup && (
                  <>
                    <div className="space-y-2">
                      <Label>Frequência do Backup</Label>
                      <Select 
                        value={settings.backupFrequency} 
                        onValueChange={(value) => handleSettingChange('backupFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Retenção (dias)</Label>
                      <Input
                        type="number"
                        value={settings.retentionDays}
                        onChange={(e) => handleSettingChange('retentionDays', e.target.value)}
                        min="7"
                        max="365"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-300">
                    Atenção: Configurações Avançadas
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Estas configurações podem afetar o desempenho e a segurança do sistema. 
                    Altere apenas se souber o que está fazendo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};