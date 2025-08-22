
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  error: Error;
  handleRetry: () => void;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
}

export const UserManagementError = ({ error, handleRetry, showDebugInfo, setShowDebugInfo }: Props) => (
  <Card>
    <CardContent className="p-6">
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2 font-semibold">Erro ao carregar usuários</p>
        <p className="text-sm text-muted-foreground mb-4">{typeof error === 'string' ? error : error?.message || 'Erro desconhecido'}</p>
        <div className="space-y-2">
          <Button onClick={handleRetry} className="mr-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            {showDebugInfo ? 'Ocultar' : 'Mostrar'} Debug
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
