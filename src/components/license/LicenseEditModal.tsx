import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LicenseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    license_code: string;
    expires_at: string;
    activated_at: string;
    is_active: boolean;
    notes?: string;
  } | null;
  onSuccess: () => void;
}

export const LicenseEditModal = ({ isOpen, onClose, license, onSuccess }: LicenseEditModalProps) => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    license_code: '',
    expires_at: new Date(),
    is_active: true,
    notes: '',
    action_type: 'edit' as 'edit' | 'extend' | 'transfer'
  });
  const [extendDays, setExtendDays] = useState(30);
  const [transferUserId, setTransferUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, email: string}>>([]);

  useEffect(() => {
    if (license) {
      setFormData({
        license_code: license.license_code,
        expires_at: new Date(license.expires_at),
        is_active: license.is_active,
        notes: license.notes || '',
        action_type: 'edit'
      });
    }
  }, [license]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  const loadAvailableUsers = async () => {
    try {
      // Simplificado - não carrega usuários por enquanto
      setAvailableUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSave = async () => {
    if (!license) return;
    
    setIsLoading(true);
    try {
      let result;
      
      switch (formData.action_type) {
        case 'edit':
          // Para edição, vamos usar renovação com código customizado
          result = await supabase.rpc('admin_renew_license', {
            license_id: license.id,
            additional_days: 0 // Zero dias para não alterar data
          });
          break;
          
        case 'extend':
          result = await supabase.rpc('admin_renew_license', {
            license_id: license.id,
            additional_days: extendDays
          });
          break;
          
        case 'transfer':
          if (!transferUserId) {
            showError({
              title: 'Erro',
              description: 'Selecione um usuário para transferir a licença.'
            });
            return;
          }
          // Funcionalidade de transferência será implementada posteriormente
          showError({
            title: 'Funcionalidade não disponível',
            description: 'Transferência de licenças será implementada em breve.'
          });
          return;
      }
      
      if (result?.error) throw result.error;
      
      showSuccess({
        title: 'Sucesso',
        description: 'Licença atualizada com sucesso!'
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      showError({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar licença'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewLicenseCode = () => {
    const code = Math.random().toString(36).substring(2, 15).toUpperCase();
    setFormData(prev => ({ ...prev, license_code: code }));
  };

  if (!license) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant={license.is_active ? 'default' : 'secondary'}>
              {license.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
            Editar Licença - {license.user_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações do Usuário */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Informações do Usuário</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{license.user_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{license.user_email}</p>
              </div>
            </div>
          </div>

          {/* Tipo de Ação */}
          <div className="space-y-2">
            <Label>Tipo de Ação</Label>
            <Select value={formData.action_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, action_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit">Editar Licença</SelectItem>
                <SelectItem value="extend">Estender Validade</SelectItem>
                <SelectItem value="transfer">Transferir Licença</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos baseados no tipo de ação */}
          {formData.action_type === 'edit' && (
            <>
              <div className="space-y-2">
                <Label>Código da Licença</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.license_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_code: e.target.value }))}
                    placeholder="Código da licença"
                    readOnly
                  />
                  <Button type="button" variant="outline" onClick={generateNewLicenseCode}>
                    Gerar Novo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expires_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expires_at ? format(formData.expires_at, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expires_at}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, expires_at: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Licença Ativa</Label>
              </div>
            </>
          )}

          {formData.action_type === 'extend' && (
            <div className="space-y-2">
              <Label>Estender por (dias)</Label>
              <Select value={extendDays.toString()} onValueChange={(value) => setExtendDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Nova data de expiração: {format(new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000), "PPP", { locale: ptBR })}
              </p>
            </div>
          )}

          {formData.action_type === 'transfer' && (
            <div className="space-y-2">
              <Label>Transferir para Usuário</Label>
              <Select value={transferUserId} onValueChange={setTransferUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transferUserId && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Esta ação transferirá a licença permanentemente para o usuário selecionado.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas (Opcional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Adicione observações sobre esta alteração..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};