
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const UserManagementLoading = () => (
  <Card>
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    </CardContent>
  </Card>
);
