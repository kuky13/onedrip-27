/**
 * Utility functions for hCaptcha configuration
 */

/**
 * Checks if hCaptcha is properly configured and enabled
 * @returns {boolean} True if hCaptcha is enabled with a valid site key
 */
export const isHCaptchaEnabled = (): boolean => {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  
  // Check if site key exists and is not the placeholder value
  return !!siteKey && 
         siteKey !== 'your_hcaptcha_site_key_here' && 
         siteKey.trim().length > 0;
};

/**
 * Gets the hCaptcha site key if enabled
 * @returns {string | null} The site key or null if not enabled
 */
export const getHCaptchaSiteKey = (): string | null => {
  if (!isHCaptchaEnabled()) {
    return null;
  }
  return import.meta.env.VITE_HCAPTCHA_SITE_KEY;
};

/**
 * Logs hCaptcha configuration status for debugging
 */
export const logHCaptchaStatus = (): void => {
  const enabled = isHCaptchaEnabled();
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  
  if (enabled) {
    console.log('✅ hCaptcha está habilitado');
  } else {
    console.log('⚠️ hCaptcha está desabilitado');
    if (!siteKey || siteKey === 'your_hcaptcha_site_key_here') {
      console.log('💡 Para habilitar o hCaptcha, configure VITE_HCAPTCHA_SITE_KEY no arquivo .env');
    }
  }
};