import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ValidatedInput, PhoneInput } from '@/components/ui/validated-input';
import { useFormValidation } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

interface InlineClientFormProps {
  onClientCreated: (client: { id: string; name: string; phone: string; email: string }) => void;
  trigger?: React.ReactNode;
  className?: string;
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

const clientValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email deve ter um formato válido',
  },
  phone: {
    required: true,
    pattern: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
    message: 'Telefone deve ter formato válido (ex: (11) 99999-9999)',
  },
  address: {
    maxLength: 200,
  },
  notes: {
    maxLength: 500,
  },
};

export function InlineClientForm({ onClientCreated, trigger, className }: InlineClientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const validation = useFormValidation(formData as unknown as Record<string, unknown>, clientValidationRules);

  const updateFormData = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validation.updateField(field, value);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    validation.reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validate form
    const isValid = validation.validateAll();
    if (!isValid) {
      const firstError = Object.entries(validation.validationState)
        .find(([_, state]) => !state.isValid)?.[1]?.error;
      
      if (firstError) {
        toast.error(firstError);
      } else {
        toast.error('Por favor, corrija os erros no formulário');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Create client in Supabase
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim(),
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
          user_id: user.id,
        })
        .select('id, name, phone, email')
        .single();

      if (error) {
        console.error('Error creating client:', error);
        
        if (error.code === '23505') {
          toast.error('Já existe um cliente com este telefone');
        } else if (error.code === '42501') {
          toast.error('Você não tem permissão para criar clientes');
        } else {
          toast.error('Erro ao criar cliente. Tente novamente.');
        }
        return;
      }

      if (!client) {
        toast.error('Erro ao criar cliente. Dados não retornados.');
        return;
      }

      toast.success('Cliente criado com sucesso!');
      onClientCreated(client);
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Unexpected error creating client:', error);
      toast.error('Erro inesperado ao criar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      className={className}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      Criar Novo Cliente
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Novo Cliente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidatedInput
            label="Nome Completo"
            value={formData.name}
            onChange={(value) => updateFormData('name', value)}
            onBlur={() => validation.touchField('name')}
            placeholder="Ex: João Silva"
            required
            error={validation.getFieldError('name')}
            isValid={validation.isFieldValid('name')}
            touched={validation.isFieldTouched('name')}
            description="Nome completo do cliente"
            autoFocus
          />

          <ValidatedInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => updateFormData('email', value)}
            onBlur={() => validation.touchField('email')}
            placeholder="cliente@email.com"
            error={validation.getFieldError('email')}
            isValid={validation.isFieldValid('email')}
            touched={validation.isFieldTouched('email')}
            description="Email para contato (opcional)"
          />

          <PhoneInput
            label="Telefone"
            value={formData.phone}
            onChange={(value) => updateFormData('phone', value)}
            onBlur={() => validation.touchField('phone')}
            required
            error={validation.getFieldError('phone')}
            isValid={validation.isFieldValid('phone')}
            touched={validation.isFieldTouched('phone')}
            description="Telefone principal para contato"
          />

          <ValidatedInput
            label="Endereço"
            value={formData.address}
            onChange={(value) => updateFormData('address', value)}
            placeholder="Rua, número, bairro, cidade"
            description="Endereço completo (opcional)"
          />

          <ValidatedInput
            label="Observações"
            value={formData.notes}
            onChange={(value) => updateFormData('notes', value)}
            placeholder="Informações adicionais sobre o cliente"
            description="Notas extras (opcional)"
            maxLength={500}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting || !validation.formState.isValid}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Criar Cliente
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Quick client selector with inline creation
interface QuickClientSelectorProps {
  clients: Array<{ id: string; name: string; phone: string; email: string }>;
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
  onClientCreated: (client: { id: string; name: string; phone: string; email: string }) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function QuickClientSelector({
  clients,
  selectedClientId,
  onClientSelect,
  onClientCreated,
  placeholder = "Selecione um cliente",
  required = false,
  error,
}: QuickClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedClient = clients.find(client => client.id === selectedClientId);

  const handleClientCreated = (newClient: { id: string; name: string; phone: string; email: string }) => {
    onClientCreated(newClient);
    onClientSelect(newClient.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <ValidatedInput
            label={`Cliente ${required ? '*' : ''}`}
            value={selectedClient ? `${selectedClient.name} - ${selectedClient.phone}` : searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setIsSearching(true);
              if (!value) {
                onClientSelect('');
              }
            }}
            placeholder={placeholder}
            error={error}
            description="Digite para buscar ou selecione um cliente"
          />
          
          {isSearching && searchTerm && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      onClientSelect(client.id);
                      setSearchTerm('');
                      setIsSearching(false);
                    }}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                    {client.email && (
                      <div className="text-sm text-gray-400">{client.email}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-center">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <InlineClientForm
            onClientCreated={handleClientCreated}
            trigger={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mt-6"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}