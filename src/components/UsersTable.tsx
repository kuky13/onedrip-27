
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings, FileText, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User } from '@/types/user';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRenew: (user: User) => void;
}

export const UsersTable = ({ users, onEdit, onDelete, onRenew }: UsersTableProps) => {
  const getRoleBadge = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      manager: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      user: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return colors[role as keyof typeof colors] || 'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getStatusBadge = (user: User) => {
    const now = new Date();
    // Expiration removed - now handled by license system
    
    if (!(user as any).license_active) {
      return <Badge className="border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Licença Inativa</Badge>;
    }
    return <Badge className="border-transparent bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Ativo</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Orçamentos</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{getStatusBadge(user)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5" />
                <span>{user.budget_count}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-80">
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <h4 className="font-medium leading-none">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="grid grid-cols-2 items-center">
                        <strong>Função:</strong>
                        <Badge className={`${getRoleBadge(user.role)} justify-self-start`}>
                          {user.role === 'admin' ? 'Administrador' : 
                           user.role === 'manager' ? 'Gerente' : 'Usuário'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 items-center">
                        <strong>Expira em:</strong>
                        <span>-</span>
                      </div>
                       <div className="grid grid-cols-2 items-center">
                        <strong>Criado em:</strong>
                        <span>{format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      <div className="grid grid-cols-2 items-center">
                        <strong>Último login:</strong>
                        <span>
                          {user.last_sign_in_at 
                            ? format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) 
                            : 'Nunca'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => onRenew(user)}>
                        <CalendarClock className="h-4 w-4 mr-1" /> Renovar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(user)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Deletar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
