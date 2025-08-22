/**
 * Monitor de Recarregamentos
 * Detecta e previne recarregamentos desnecessários
 */

import { useEffect, useRef } from 'react';
import { debugLogger } from '@/utils/debugLogger';

export const ReloadMonitor = () => {
  const mountCountRef = useRef(0);
  const lastReloadRef = useRef(0);

  useEffect(() => {
    mountCountRef.current++;
    const now = Date.now();
    
    // Detectar recarregamentos frequentes
    if (mountCountRef.current > 1 && now - lastReloadRef.current < 10000) {
      debugLogger.warn('ReloadMonitor', 'Recarregamento frequente detectado', {
        count: mountCountRef.current,
        timeSinceLastReload: now - lastReloadRef.current
      });
    }
    
    lastReloadRef.current = now;
    
    // Log apenas a primeira montagem
    if (mountCountRef.current === 1) {
      debugLogger.log('ReloadMonitor', 'Aplicação inicializada');
    }
  }, []);

  return null;
};