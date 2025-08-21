import { useState, useRef, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface UseHCaptchaReturn {
  captchaRef: React.RefObject<HCaptcha>;
  captchaToken: string | null;
  captchaError: string | null;
  isLoading: boolean;
  resetCaptcha: () => void;
  onCaptchaVerify: (token: string) => void;
  onCaptchaError: (err: string) => void;
  onCaptchaExpire: () => void;
}

export const useHCaptcha = (): UseHCaptchaReturn => {
  const captchaRef = useRef<HCaptcha>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaError(null);
    setIsLoading(false);
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  }, []);

  const onCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaError(null);
    setIsLoading(false);
  }, []);

  const onCaptchaError = useCallback((err: string) => {
    setCaptchaError(err || 'Erro na verificação do captcha');
    setCaptchaToken(null);
    setIsLoading(false);
  }, []);

  const onCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaError('Captcha expirado. Tente novamente.');
    setIsLoading(false);
  }, []);

  return {
    captchaRef,
    captchaToken,
    captchaError,
    isLoading,
    resetCaptcha,
    onCaptchaVerify,
    onCaptchaError,
    onCaptchaExpire,
  };
};