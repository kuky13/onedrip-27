import { useState, useEffect } from 'react';

export interface IOSInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isIPhone: boolean;
  isSafari: boolean;
  isIOSSafari: boolean;
  version: number | null;
  shouldUseLite: boolean;
}

const detectIOSSafari = (): IOSInfo => {
  if (typeof window === 'undefined' || !navigator) {
    return {
      isIOS: false,
      isAndroid: false,
      isIPhone: false,
      isSafari: false,
      isIOSSafari: false,
      version: null,
      shouldUseLite: false,
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Detectar Android especificamente
  const isAndroid = /Android/i.test(userAgent);
  
  // Detecção mais robusta para iOS incluindo iPadOS 13+
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Detectar especificamente iPhone (qualquer navegador) - detecção melhorada
  const isIPhone = /iPhone/.test(userAgent) && !isAndroid;
  
  // Detectar Safari (não Chrome ou outros browsers)
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  
  // Versão do iOS - detecção melhorada
  let version: number | null = null;
  if (isIOS) {
    const versionMatch = userAgent.match(/OS (\d+)[._](\d+)?/) || 
      userAgent.match(/Version\/(\d+)\.(\d+)/);
    if (versionMatch) {
      version = parseInt(versionMatch[1], 10);
    }
  }

  const isIOSSafari = isIOS && isSafari;
  
  // Detectar qualquer dispositivo móvel/tablet
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  
  // Usar dashboard iOS para TODOS os dispositivos móveis:
  // 1. Qualquer dispositivo móvel (Android, iOS, tablets, etc.)
  // 2. Incluindo iPads, tablets Android, phones, etc.
  const shouldUseLite = isMobile;

  return {
    isIOS,
    isAndroid,
    isIPhone,
    isSafari,
    isIOSSafari,
    version,
    shouldUseLite,
  };
};

export const useIOSDetection = (): IOSInfo => {
  const [iosInfo, setIOSInfo] = useState<IOSInfo>(() => detectIOSSafari());

  useEffect(() => {
    // Verificar localStorage para preferências de admin
    const manualLiteEnabled = localStorage.getItem('painel-enabled') === 'true';
    const forceNormalDashboard = localStorage.getItem('force-normal-dashboard') === 'true';
    
    if (forceNormalDashboard) {
      // Admin forçou dashboard normal - desabilitar lite
      setIOSInfo(prev => ({
        ...prev,
        shouldUseLite: false,
        isIOS: false, // Simular não iOS para usar dashboard normal
      }));
    } else if (manualLiteEnabled) {
      // Admin habilitou Painel manualmente - simular iPhone real
      setIOSInfo(prev => ({
        ...prev,
        isIOS: true, // Simular iOS
        isAndroid: false, // Garantir que não é Android
        isIPhone: true, // Simular iPhone
        isSafari: true, // Simular Safari
        isIOSSafari: true, // Simular iOS Safari
        version: 16, // Versão iOS moderna
        shouldUseLite: true,
      }));
    }
  }, []);

  return iosInfo;
};