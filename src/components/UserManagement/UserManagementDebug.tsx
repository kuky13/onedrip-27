
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { DebugInfo } from '@/types/user';

interface Props {
  debugInfo: DebugInfo | null;
  error: Error | null;
}

export const UserManagementDebug = ({ debugInfo, error }: Props) => (
  <Card className="mb-4 border-yellow-500/30 bg-yellow-500/10">
    <CardHeader className="py-3 px-4">
      <CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-300 text-base font-semibold">
        <AlertTriangle className="h-5 w-5" />
        <span>Informações de Debug</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm px-4 pb-4 text-yellow-900 dark:text-yellow-200">
      {debugInfo ? (
        <div className="space-y-2">
          <p><strong>ID do Usuário:</strong> {debugInfo.user_id || 'N/A'}</p>
          <p><strong>Email:</strong> {debugInfo.user_email || 'N/A'}</p>
          <p><strong>Role:</strong> {debugInfo.user_role || 'N/A'}</p>
          <p><strong>Licença Válida:</strong> {debugInfo.license_valid ? 'Sim' : 'Não'}</p>
          <p><strong>É Admin:</strong> {debugInfo.is_admin ? 'Sim' : 'Não'}</p>
        </div>
      ) : (
        <p>Carregando informações de debug...</p>
      )}
      {error && (
        <div className="mt-3 p-3 bg-red-500/10 rounded border border-red-500/20">
          <p className="text-red-800 dark:text-red-300 font-semibold"><strong>Erro:</strong> {typeof error === 'string' ? error : error?.message || 'Erro desconhecido'}</p>
        </div>
      )}
    </CardContent>
  </Card>
);
