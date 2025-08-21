import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { usePWAContext } from './PWAProvider';

export const PWAStatusIndicator: React.FC = () => {
  const device = useDeviceDetection();
  const { platform, isInstalled } = usePWAContext();

  // Só mostrar em desenvolvimento ou para admins
  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = localStorage.getItem('admin-mode') === 'true';
  
  if (!isDev && !isAdmin) {
    return null;
  }

  const getIcon = () => {
    if (device.isMobile) return <Smartphone className="h-3 w-3" />;
    if (device.isTablet) return <Tablet className="h-3 w-3" />;
    return <Monitor className="h-3 w-3" />;
  };

  const getLabel = () => {
    if (isInstalled) return 'PWA Instalado';
    if (platform === 'standalone') return 'Standalone';
    if (device.isIOS) return 'iOS Safari';
    if (device.isAndroid) return 'Android';
    return 'Web';
  };

  const getVariant = () => {
    if (isInstalled) return 'default';
    if (platform === 'standalone') return 'secondary';
    return 'outline';
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Badge variant={getVariant() as any} className="flex items-center gap-2 text-xs">
        {getIcon()}
        {getLabel()}
      </Badge>
    </div>
  );
};

export default PWAStatusIndicator;