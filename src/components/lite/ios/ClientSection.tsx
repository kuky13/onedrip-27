
import React from 'react';
import { User, Search, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Client {
  id?: string;
  name: string;
  phone: string;
  is_default?: boolean;
  is_favorite?: boolean;
}

interface ClientSectionProps {
  formData: {
    client_name: string;
    client_phone: string;
  };
  existingClients: Client[];
  showClientSearch: boolean;
  clientSearchTerm: string;
  isLoadingClients: boolean;
  onInputChange: (field: string, value: string) => void;
  onToggleClientSearch: () => void;
  onSearchTermChange: (term: string) => void;
  onClientSelect: (client: Client) => void;
}

export const ClientSection = ({
  formData,
  existingClients,
  showClientSearch,
  clientSearchTerm,
  isLoadingClients,
  onInputChange,
  onToggleClientSearch,
  onSearchTermChange,
  onClientSelect
}: ClientSectionProps) => {
  const filteredClients = existingClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.phone.includes(clientSearchTerm)
  );

  // Encontrar cliente padrão
  const defaultClient = existingClients.find(client => client.is_default === true);

  // Função para selecionar cliente padrão
  const handleSelectDefaultClient = () => {
    if (defaultClient) {
      onClientSelect(defaultClient);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleClientSearch}
            className="shrink-0"
          >
            <Search className="h-4 w-4 mr-2" />
            {showClientSearch ? 'Fechar' : 'Buscar Cliente'}
          </Button>
          
          {defaultClient && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectDefaultClient}
              className="shrink-0 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Star className="h-4 w-4 mr-2" />
              Selecionar Cliente Padrão
            </Button>
          )}
        </div>

        {showClientSearch && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <Input
              type="text"
              value={clientSearchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="text-sm"
              inputMode="search"
              autoComplete="off"
              autoFocus={false}
            />
            
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Carregando clientes...</span>
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client, index) => (
                    <div
                      key={client.id || index}
                      onClick={() => onClientSelect(client)}
                      className="p-2 text-sm bg-background hover:bg-accent/50 rounded cursor-pointer transition-colors flex items-center justify-between"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {client.name}
                          {client.is_default && (
                            <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                          )}
                          {client.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {client.phone && (
                          <div className="text-xs text-muted-foreground">{client.phone}</div>
                        )}
                      </div>
                      {client.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Padrão
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {clientSearchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <Label className="text-sm font-medium text-foreground">Nome do Cliente</Label>
          <Input
            type="text"
            value={formData.client_name}
            onChange={(e) => onInputChange('client_name', e.target.value)}
            placeholder="Nome completo do cliente"
            className="mt-1"
            autoComplete="off"
            autoFocus={false}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Telefone do Cliente</Label>
          <Input
            type="tel"
            value={formData.client_phone}
            onChange={(e) => onInputChange('client_phone', e.target.value)}
            placeholder="(00) 00000-0000"
            className="mt-1"
            autoComplete="off"
            autoFocus={false}
          />
        </div>
      </CardContent>
    </Card>
  );
};
