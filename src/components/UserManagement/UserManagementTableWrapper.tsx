
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { UsersTable } from '@/components/UsersTable';
import { User } from '@/types/user';

interface Props {
  filteredUsers: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRenew: (user: User) => void;
  searchTerm: string;
}

export const UserManagementTableWrapper = ({ filteredUsers, onEdit, onDelete, onRenew, searchTerm }: Props) => (
  <CardContent>
    {filteredUsers && filteredUsers.length > 0 ? (
      <UsersTable 
        users={filteredUsers} 
        onEdit={onEdit}
        onDelete={onDelete}
        onRenew={onRenew}
      />
    ) : (
      <div className="text-center py-8 text-muted-foreground">
        {searchTerm ? (
          <p>Nenhum usuário encontrado para "{searchTerm}"</p>
        ) : (
          <p>Nenhum usuário encontrado no sistema</p>
        )}
      </div>
    )}
  </CardContent>
);
