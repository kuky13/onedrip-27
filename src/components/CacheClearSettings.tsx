import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CacheClearSettings = () => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const clearSiteCache = async (): Promise<void> => {
    setIsClearing(true);
    try {
      // 1. LIMPAR COMPLETAMENTE TODO O localStorage
      localStorage.clear();
      
      // 2. LIMPAR COMPLETAMENTE O sessionStorage
      sessionStorage.clear();
      
      // 3. LIMPAR TODOS os Service Worker caches
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
          if (databases) {
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise<void>((resolve) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => {
                      console.warn(`Erro ao remover IndexedDB: ${db.name}`);
                      resolve(); // Continue anyway
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
      try {
        if ('openDatabase' in window) {
          // @ts-ignore - WebSQL é deprecated mas ainda pode existir
          const db = window.openDatabase('', '', '', '');
          if (db) {
            db.transaction((tx: any) => {
              tx.executeSql('DROP TABLE IF EXISTS data');
            });
          }
        }
      } catch (error) {
        console.warn('WebSQL cleanup error:', error);
      }

      // 6. LIMPAR cookies do domínio atual
      try {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        });
      } catch (error) {
        console.warn('Cookie cleanup error:', error);
      }

      // 7. LIMPAR registros de Service Worker
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

      console.log('🧹 LIMPEZA COMPLETA: Todos os dados locais removidos');

      toast({
        title: "Limpeza completa realizada! 🧹",
        description: "TODOS os dados locais foram removidos. Os dados do backend permanecem intactos.",
      });

      // Navigate instead of reloading
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Erro ao limpar cache",
        description: "Ocorreu um erro ao tentar limpar o cache.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-warning/20">
      <CardHeader>
        <CardTitle className="text-warning flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpar Todos os Dados Locais
        </CardTitle>
        <CardDescription>
          Remove TODOS os dados salvos localmente no dispositivo (cache, banco de dados, cookies, etc.). Os dados do backend (Supabase) não serão afetados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 border-warning text-warning hover:bg-warning/10"
              disabled={isClearing}
            >
              {isClearing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Limpar Todos os Dados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Confirmar Limpeza Total de Dados</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
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
                <p className="text-sm text-muted-foreground">
                  ✅ <strong>Os dados do backend (Supabase) NÃO serão afetados</strong>
                </p>
                <p className="font-medium text-destructive">
                  Você precisará fazer login novamente e reconfigurar suas preferências.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearSiteCache}
                className="bg-warning hover:bg-warning/90 text-warning-foreground"
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Limpando...
                  </>
                ) : (
                  'Confirmar Limpeza'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};