// Utility para redirecionamentos seguros
export class SecureRedirect {
  private static allowedDomains = [
    'https://lovable.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  /**
   * Valida se um domínio está na lista de domínios permitidos
   */
  static isDomainAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const origin = urlObj.origin;
      return this.allowedDomains.includes(origin);
    } catch {
      return false;
    }
  }

  /**
   * Retorna uma URL segura para redirecionamento
   * Se a URL atual não for segura, retorna uma URL padrão
   */
  static getSafeRedirectUrl(path: string = '/'): string {
    const currentOrigin = window.location.origin;
    
    if (this.isDomainAllowed(currentOrigin)) {
      return `${currentOrigin}${path}`;
    }
    
    // Fallback para domínio padrão se o atual não for permitido
    return `https://lovable.app${path}`;
  }

  /**
   * Valida e retorna URLs de redirecionamento para auth
   */
  static getAuthRedirectUrls() {
    const baseUrl = this.getSafeRedirectUrl();
    
    return {
      signup: baseUrl,
      verify: `${baseUrl.replace(/\/$/, '')}/verify`,
      resetPassword: `${baseUrl.replace(/\/$/, '')}/reset-password`
    };
  }
}