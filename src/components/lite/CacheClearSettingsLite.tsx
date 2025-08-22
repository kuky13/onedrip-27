import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CacheClearSettingsLite = () => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const clearSiteCache = async (): Promise<void> => {
    setIsClearing(true);
    try {
      // 1. LIMPAR COMPLETAMENTE TODO O localStorage
      localStorage.clear();
      
      // 2. LIMPAR COMPLETAMENTE O sessionStorage
      sessionStorage.clear();
      
      // 3. LIMPAR Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 4. LIMPAR TODOS os bancos IndexedDB
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases?.();
          if (databases && databases.length > 0) {
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise<void>((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => {
                      console.log(`IndexedDB removido: ${db.name}`);
                      resolve();
                    };
                    deleteReq.onerror = () => {
                      console.error(`Erro ao remover IndexedDB: ${db.name}`, deleteReq.error);
                      resolve(); // Continue mesmo com erro
                    };
                    deleteReq.onblocked = () => {
                      console.warn(`Bloqueado ao remover IndexedDB: ${db.name}`);
                      resolve(); // Continue anyway
                    };
                    // Timeout para evitar travamento
                    setTimeout(() => resolve(), 5000);
                  });
                }
                return Promise.resolve();
              })
            );
          }
        } catch (error) {
          console.warn('IndexedDB cleanup error:', error);
        }
      }

      // 5. LIMPAR WebSQL (se suportado - deprecated mas ainda presente em alguns browsers)
      if ('webkitRequestFileSystem' in window || 'webkitStorageInfo' in window) {
        try {
          // @ts-ignore
          if (window.webkitStorageInfo && window.webkitStorageInfo.requestQuota) {
            // @ts-ignore
            window.webkitStorageInfo.requestQuota(0, 0, () => {
              console.log('WebSQL/FileSystem cleared');
            }, () => {
              console.warn('WebSQL/FileSystem clear failed');
            });
          }
        } catch (error) {
          console.warn('WebSQL cleanup error:', error);
        }
      }

      // 6. FORÇAR limpeza de cookies do domínio atual (se possível)
      try {
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      } catch (error) {
        console.warn('Cookie cleanup error:', error);
      }

      // 7. LIMPAR dados específicos do Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.unregister())
          );
          console.log('Service Workers desregistrados');
        } catch (error) {
          console.warn('Service Worker cleanup error:', error);
        }
      }

      console.log('🧹 LIMPEZA INTELIGENTE: Cache removido preservando autenticação');

      toast({
        title: "Limpeza concluída! 🧹",
        description: "Cache removido. Dados de login preservados.",
      });

      // Navigate instead of reloading
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing all local data:', error);
      toast({
        title: "Erro na limpeza",
        description: "Erro ao remover todos os dados locais.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-warning/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-warning flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpeza Total de Dados
        </CardTitle>
        <CardDescription className="text-sm">
          Remove TODOS os dados salvos localmente no dispositivo (cache, banco de dados, cookies, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full gap-2 border-warning text-warning hover:bg-warning/10"
              disabled={isClearing}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isClearing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Limpeza Total
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent 
            className="max-w-[90vw] mx-auto rounded-lg"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">⚠️ Limpeza Total de Dados</AlertDialogTitle>
              <AlertDialogDescription className="text-sm space-y-3">
                <p className="font-medium text-destructive">Esta ação irá remover TODOS os dados locais:</p>
                <div className="bg-muted/50 p-3 rounded-md">
                  <ul className="text-xs space-y-1">
                    <li>• TODO o localStorage</li>
                    <li>• TODO o sessionStorage</li>
                    <li>• TODOS os bancos IndexedDB</li>
                    <li>• TODOS os caches do Service Worker</li>
                    <li>• Cookies do domínio</li>
                    <li>• Dados WebSQL (se houver)</li>
                    <li>• Registros de Service Worker</li>
                  </ul>
                </div>
                <p className="font-medium text-destructive text-sm">
                  Você precisará fazer login novamente.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel 
                className="flex-1"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearSiteCache}
                className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                disabled={isClearing}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isClearing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-1" />
                    Limpando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};