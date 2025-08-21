import React from 'react';
import { ServiceOrderTrash } from '@/components/ServiceOrderTrash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

export const ServiceOrderTrashPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Lixeira de Ordens de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceOrderTrash />
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceOrderTrashPage;