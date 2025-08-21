import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isServiceWorkerReady: boolean;
}

interface UserPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isServiceWorkerReady: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<UserPushSubscription[]>([]);

  // Chave pública VAPID - em produção, isso deve vir de variáveis de ambiente
  const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrfuWjdMcGSGZXhMjAoMiZFXl3t6SRUjzk9d_2NuVdMQeXSaONIBSM';

  // Verificar suporte e estado inicial
  useEffect(() => {
    checkNotificationSupport();
  }, []);

  // Registrar service worker quando o usuário fizer login
  useEffect(() => {
    if (user && permissionState.isSupported) {
      registerServiceWorker();
    }
  }, [user, permissionState.isSupported]);

  // Carregar subscriptions do usuário
  const loadUserSubscriptions = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      setUserSubscriptions(data || []);
      setIsSubscribed((data || []).length > 0);
    } catch (error) {
      console.error('Erro ao carregar subscriptions:', error);
    }
  }, [user]);

  const checkNotificationSupport = async () => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    const permission = Notification.permission;
    
    let serviceWorkerReady = false;
    if (isSupported) {
      try {
        const registration = await navigator.serviceWorker.ready;
        serviceWorkerReady = !!registration;
        
        // Verificar se já existe uma subscription ativa
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription({
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(existingSubscription.getKey('auth')!),
            },
          });
        }
      } catch (error) {
        console.error('Service Worker não está pronto:', error);
      }
    }
    
    setPermissionState({
      permission,
      isSupported,
      isServiceWorkerReady: serviceWorkerReady,
    });
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      
      // Aguardar o service worker estar pronto
      await navigator.serviceWorker.ready;
      
      // Verificar se já existe uma subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setPermissionState(prev => ({ ...prev, subscription: existingSubscription }));
      }
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  };

  // Salvar subscription no Supabase
  const saveSubscriptionToDatabase = useCallback(async (subscriptionData: PushSubscription) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          user_agent: navigator.userAgent,
          is_active: true,
        }, {
          onConflict: 'user_id,endpoint'
        });
      
      if (error) throw error;
      
      await loadUserSubscriptions();
      return true;
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
      return false;
    }
  }, [user, loadUserSubscriptions]);
  
  // Remover subscription do Supabase
  const removeSubscriptionFromDatabase = useCallback(async (endpoint: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', endpoint);
      
      if (error) throw error;
      
      await loadUserSubscriptions();
      return true;
    } catch (error) {
      console.error('Erro ao remover subscription:', error);
      return false;
    }
  }, [user, loadUserSubscriptions]);

  const requestPermission = async (): Promise<boolean> => {
    if (!permissionState.isSupported) {
      toast.error('Notificações push não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast.success('Permissão concedida para notificações!');
        return true;
      } else {
        toast.error('Permissão negada. Você pode alterar isso nas configurações do navegador.');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão de notificação');
      return false;
    }
  };

  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para se inscrever em notificações');
      return false;
    }
    
    if (!permissionState.isSupported || !permissionState.isServiceWorkerReady) {
      toast.error('Notificações push não são suportadas');
      return false;
    }
    
    if (permissionState.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
        },
      };
      
      // Salvar no Supabase
      const saved = await saveSubscriptionToDatabase(subscriptionData);
      if (!saved) {
        throw new Error('Falha ao salvar subscription no banco de dados');
      }
      
      setSubscription(subscriptionData);
      setIsSubscribed(true);
      toast.success('Inscrito em notificações push com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      toast.error('Erro ao se inscrever em notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, permissionState, requestPermission, saveSubscriptionToDatabase]);

  const unsubscribe = useCallback(async () => {
    if (!subscription || !user) {
      toast.error('Nenhuma inscrição ativa encontrada');
      return false;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      
      // Remover do banco de dados
      const removed = await removeSubscriptionFromDatabase(subscription.endpoint);
      if (!removed) {
        throw new Error('Falha ao remover subscription do banco de dados');
      }
      
      setSubscription(null);
      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
      return true;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      toast.error('Erro ao desativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, subscription, removeSubscriptionFromDatabase]);

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }
    
    if (!isSubscribed) {
      toast.error('Você precisa estar inscrito em notificações push');
      return false;
    }
    
    try {
      const { error } = await supabase.rpc('send_push_notification', {
        p_user_id: user.id,
        p_title: 'Notificação de Teste',
        p_message: 'Esta é uma notificação de teste do sistema!',
        p_type: 'test',
        p_data: { test: true }
      });
      
      if (error) throw error;
      
      toast.success('Notificação de teste enviada!');
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação de teste');
      return false;
    }
  }, [user, isSubscribed]);

  // Função para converter VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Função para converter ArrayBuffer para Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  return {
    // Estados
    permissionState,
    isSubscribed,
    isLoading,
    subscription,
    userSubscriptions,
    
    // Ações
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    loadUserSubscriptions,
    
    // Utilitários
    isSupported: permissionState.isSupported,
    hasPermission: permissionState.permission === 'granted',
    isServiceWorkerReady: permissionState.isServiceWorkerReady,
  };
};

export default usePushNotifications;