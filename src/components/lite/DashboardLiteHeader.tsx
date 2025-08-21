import React from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
interface DashboardLiteHeaderProps {
  profile: any;
  onMenuClick: () => void;
}
export const DashboardLiteHeader = ({
  profile,
  onMenuClick
}: DashboardLiteHeaderProps) => {
  return <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onMenuClick} className="p-2">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">OneDrip</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {profile?.name?.charAt(0) || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>;
};