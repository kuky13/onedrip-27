
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
}

export const UserManagementRestricted = ({ showDebugInfo, setShowDebugInfo }: Props) => (
  <Card>
    <CardContent className="p-6">
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-yellow-600 mb-2 font-semibold">Acesso Restrito</p>
        <p className="text-sm text-muted-foreground mb-4">
          Você não tem permissões de administrador para acessar esta seção.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setShowDebugInfo(!showDebugInfo)}
        >
          {showDebugInfo ? 'Ocultar' : 'Mostrar'} Debug
        </Button>
      </div>
    </CardContent>
  </Card>
);
