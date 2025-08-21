import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useToast } from '@/hooks/use-toast';

export const PWAInstallButton: React.FC = () => {
  const { isDesktop } = useDeviceDetection();
  const { isInstalled, isInstallable, installApp } = usePWA();
  const device = useDeviceDetection();
  const { toast } = useToast();

  const handleInstall = async () => {
    if (device.isIOS) {
      // Instruções para iOS
      toast({
        title: "Instalar OneDrip no iPhone/iPad",
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Share className="h-4 w-4" />
              <span>1. Toque no botão compartilhar (Safari)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              <span>2. Selecione "Adicionar à Tela Inicial"</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              <span>3. Toque em "Adicionar"</span>
            </div>
          </div>
        ),
        duration: 10000,
      });
    } else if (device.isAndroid) {
      // Tentar instalação automática primeiro, senão mostrar instruções
      const success = await installApp();
      if (!success) {
        toast({
          title: "Instalar OneDrip no Android",
          description: (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                <span>1. Abra o menu do Chrome (⋮)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                <span>2. Toque em "Instalar app"</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                <span>3. Confirme a instalação</span>
              </div>
            </div>
          ),
          duration: 10000,
        });
      } else {
        toast({
          title: "App Instalado!",
          description: "OneDrip foi instalado com sucesso no seu Android.",
        });
      }
    } else {
      // Desktop ou outros dispositivos
      const success = await installApp();
      if (!success) {
        toast({
          title: "Instalar OneDrip",
          description: (
            <div className="space-y-2">
              <p>Para instalar o app:</p>
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                <span>1. Procure o ícone de instalação na barra de endereços</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                <span>2. Ou use Ctrl+Shift+A (Chrome)</span>
              </div>
            </div>
          ),
          duration: 8000,
        });
      } else {
        toast({
          title: "App Instalado!",
          description: "OneDrip foi instalado com sucesso.",
        });
      }
    }
  };

  // Sempre mostrar o botão, independente do dispositivo ou status

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      <span>Instalar App</span>
    </Button>
  );
};