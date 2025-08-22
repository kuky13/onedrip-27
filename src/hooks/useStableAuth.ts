/**
 * Hook de Autenticação Otimizado
 * Previne recarregamentos desnecessários
 */

import { useAuth as useBaseAuth } from './useAuth';
import { useMemo, useRef } from 'react';

export const useStableAuth = () => {
  const auth = useBaseAuth();
  const lastValidStateRef = useRef(auth);
  
  // Memoizar o estado para evitar re-renderizações desnecessárias
  const stableAuth = useMemo(() => {
    // Só atualizar se houve mudança real no estado
    if (
      auth.user !== lastValidStateRef.current.user ||
      auth.loading !== lastValidStateRef.current.loading ||
      auth.isInitialized !== lastValidStateRef.current.isInitialized
    ) {
      lastValidStateRef.current = auth;
    }
    
    return lastValidStateRef.current;
  }, [auth.user?.id, auth.loading, auth.isInitialized]);
  
  return stableAuth;
};