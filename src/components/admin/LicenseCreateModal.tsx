import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Key,
  Plus,
  Shuffle,
  Copy,
  Calendar,
  User,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  name: string;
}

interface LicenseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseCreateModal = ({ isOpen, onClose }: LicenseCreateModalProps) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [validityPeriod, setValidityPeriod] = useState('30');
  const [useCustomExpiration, setUseCustomExpiration] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [activeTab, setActiveTab] = useState('single');
  
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      return data as User[];
    },
    enabled: isOpen
  });

  // Generate new license code
  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLicenseCode(result);
  };

  // Copy license code to clipboard
  const copyLicenseCode = () => {
    navigator.clipboard.writeText(licenseCode);
    showSuccess({
      title: 'Copiado!',
      description: 'Código da licença copiado para a área de transferência.'
    });
  };

  // Calculate expiration date based on validity period
  const getCalculatedExpirationDate = () => {
    if (useCustomExpiration && expirationDate) {
      return new Date(expirationDate);
    }
    
    const days = parseInt(validityPeriod);
    if (isNaN(days)) return null;
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Create single license mutation
  const createLicenseMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      expiresAt: string | null;
      userId: string | null;
      notes: string;
      activateImmediately: boolean;
    }) => {
      const { data: result, error } = await supabase.rpc('admin_create_license_advanced', {
        p_code: data.code,
        p_expires_at: data.expiresAt,
        p_user_id: data.userId,
        p_notes: data.notes,
        p_activate_immediately: data.activateImmediately
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      showSuccess({
        title: 'Licença Criada!',
        description: `Nova licença criada: ${licenseCode}`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Criar Licença',
        description: error.message
      });
    }
  });

  // Create multiple licenses mutation
  const createMultipleLicensesMutation = useMutation({
    mutationFn: async (data: {
      quantity: number;
      expiresAt: string | null;
      notes: string;
      activateImmediately: boolean;
    }) => {
      const { data: result, error } = await supabase.rpc('admin_create_multiple_licenses', {
        p_quantity: data.quantity,
        p_expires_at: data.expiresAt,
        p_notes: data.notes,
        p_activate_immediately: data.activateImmediately
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      showSuccess({
        title: 'Licenças Criadas!',
        description: `${quantity} licenças foram criadas com sucesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Criar Licenças',
        description: error.message
      });
    }
  });

  const resetForm = () => {
    setLicenseCode('');
    setExpirationDate('');
    setSelectedUserId('');
    setNotes('');
    setActivateImmediately(true);
    setValidityPeriod('30');
    setUseCustomExpiration(false);
    setQuantity('1');
    setActiveTab('single');
  };

  const handleCreateSingle = () => {
    if (!licenseCode.trim()) {
      showError({
        title: 'Código Obrigatório',
        description: 'Por favor, gere ou insira um código para a licença.'
      });
      return;
    }
    
    const calculatedExpiration = getCalculatedExpirationDate();
    
    createLicenseMutation.mutate({
      code: licenseCode,
      expiresAt: calculatedExpiration ? calculatedExpiration.toISOString() : null,
      userId: selectedUserId || null,
      notes,
      activateImmediately
    });
  };

  const handleCreateMultiple = () => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0 || qty > 100) {
      showError({
        title: 'Quantidade Inválida',
        description: 'Por favor, insira uma quantidade entre 1 e 100.'
      });
      return;
    }
    
    const calculatedExpiration = getCalculatedExpirationDate();
    
    createMultipleLicensesMutation.mutate({
      quantity: qty,
      expiresAt: calculatedExpiration ? calculatedExpiration.toISOString() : null,
      notes,
      activateImmediately
    });
  };

  // Auto-generate code when modal opens
  React.useEffect(() => {
    if (isOpen && !licenseCode) {
      generateLicenseCode();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova Licença
          </DialogTitle>
          <DialogDescription>
            Crie uma ou múltiplas licenças com configurações personalizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Licença Única</TabsTrigger>
              <TabsTrigger value="multiple">Múltiplas Licenças</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              {/* Single License Creation */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="license-code">Código da Licença</Label>
                  <div className="flex gap-2">
                    <Input
                      id="license-code"
                      value={licenseCode}
                      onChange={(e) => setLicenseCode(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateLicenseCode}
                      className="shrink-0"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyLicenseCode}
                      className="shrink-0"
                      disabled={!licenseCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-select">Atribuir a Usuário (Opcional)</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não atribuir agora</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="multiple" className="space-y-4">
              {/* Multiple Licenses Creation */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Criação em Lote
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Crie múltiplas licenças de uma vez. Os códigos serão gerados automaticamente.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade de Licenças</Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 licença</SelectItem>
                    <SelectItem value="5">5 licenças</SelectItem>
                    <SelectItem value="10">10 licenças</SelectItem>
                    <SelectItem value="25">25 licenças</SelectItem>
                    <SelectItem value="50">50 licenças</SelectItem>
                    <SelectItem value="100">100 licenças</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Settings */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações de Validade
            </h4>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="use-custom-expiration"
                checked={useCustomExpiration}
                onCheckedChange={setUseCustomExpiration}
              />
              <Label htmlFor="use-custom-expiration">Usar data de expiração personalizada</Label>
            </div>

            {useCustomExpiration ? (
              <div className="space-y-2">
                <Label htmlFor="expiration">Data de Expiração</Label>
                <Input
                  id="expiration"
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="validity-period">Período de Validade</Label>
                <Select value={validityPeriod} onValueChange={setValidityPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias (1 mês)</SelectItem>
                    <SelectItem value="60">60 dias (2 meses)</SelectItem>
                    <SelectItem value="90">90 dias (3 meses)</SelectItem>
                    <SelectItem value="180">180 dias (6 meses)</SelectItem>
                    <SelectItem value="365">365 dias (1 ano)</SelectItem>
                    <SelectItem value="0">Sem expiração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium mb-1">Prévia da Configuração</h5>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {activeTab === 'single' ? (
                        <p>• 1 licença será criada</p>
                      ) : (
                        <p>• {quantity} licenças serão criadas</p>
                      )}
                      {(() => {
                        const expDate = getCalculatedExpirationDate();
                        return expDate ? (
                          <p>• Expira em: {expDate.toLocaleDateString('pt-BR')} às {expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        ) : (
                          <p>• Sem data de expiração</p>
                        );
                      })()}
                      <p>• Status inicial: {activateImmediately ? 'Ativa' : 'Inativa'}</p>
                      {activeTab === 'single' && selectedUserId && (
                        <p>• Será atribuída ao usuário selecionado</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {activateImmediately ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Switch
                id="activate-immediately"
                checked={activateImmediately}
                onCheckedChange={setActivateImmediately}
              />
              <Label htmlFor="activate-immediately">Ativar licença(s) imediatamente</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (Opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre esta criação de licença..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          
          {activeTab === 'single' ? (
            <Button 
              onClick={handleCreateSingle}
              disabled={createLicenseMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createLicenseMutation.isPending ? 'Criando...' : 'Criar Licença'}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateMultiple}
              disabled={createMultipleLicensesMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createMultipleLicensesMutation.isPending ? 'Criando...' : `Criar ${quantity} Licenças`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};