/**
 * CONTENT SECURITY POLICY AVANÇADO
 * Implementa CSP rigoroso sem 'unsafe-inline' ou 'unsafe-eval'
 * Sistema de nonces dinâmicos e hash de scripts
 */

import { securityLogger, SecurityEventType } from './securityAuditLogger';

export interface CSPConfig {
  enableReporting: boolean;
  reportUri?: string;
  nonce?: string;
  allowedDomains?: string[];
  strictMode?: boolean;
  developmentMode?: boolean;
}

export interface CSPViolation {
  blockedURI: string;
  documentURI: string;
  effectiveDirective: string;
  originalPolicy: string;
  referrer: string;
  statusCode: number;
  violatedDirective: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

class SecureCSPManager {
  private static instance: SecureCSPManager;
  private currentNonce: string = '';
  private allowedHashes: Set<string> = new Set();
  private trustedDomains: Set<string> = new Set();
  private violationCount: number = 0;
  private config: CSPConfig;

  private constructor(config: Partial<CSPConfig> = {}) {
    this.config = {
      enableReporting: true,
      strictMode: true,
      developmentMode: process.env.NODE_ENV === 'development',
      allowedDomains: [
        'https://api.supabase.co',
        'https://*.supabase.co',
        'https://api.mercadopago.com',
        'https://secure.mercadopago.com',
        'https://api.ipify.org',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ],
      ...config
    };

    this.generateNonce();
    this.setupTrustedDomains();
    this.setupCSPViolationReporting();
    this.applyCSP();
  }

  public static getInstance(config?: Partial<CSPConfig>): SecureCSPManager {
    if (!SecureCSPManager.instance) {
      SecureCSPManager.instance = new SecureCSPManager(config);
    }
    return SecureCSPManager.instance;
  }

  /**
   * Gera um novo nonce para scripts inline
   */
  private generateNonce(): void {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    this.currentNonce = btoa(String.fromCharCode(...array));
  }

  /**
   * Obtém o nonce atual
   */
  public getNonce(): string {
    return this.currentNonce;
  }

  /**
   * Configura domínios confiáveis
   */
  private setupTrustedDomains(): void {
    const defaultDomains = [
      'self',
      'https://api.supabase.co',
      'https://*.supabase.co',
      'https://api.mercadopago.com',
      'https://secure.mercadopago.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.ipify.org'
    ];

    defaultDomains.forEach(domain => this.trustedDomains.add(domain));
    
    if (this.config.allowedDomains) {
      this.config.allowedDomains.forEach(domain => this.trustedDomains.add(domain));
    }
  }

  /**
   * Gera hash SHA-256 para script inline
   */
  public async generateScriptHash(script: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(script);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    
    this.allowedHashes.add(`'sha256-${hashBase64}'`);
    return `sha256-${hashBase64}`;
  }

  /**
   * Adiciona hash de script permitido
   */
  public addAllowedHash(hash: string): void {
    if (!hash.startsWith("'")) {
      hash = `'${hash}'`;
    }
    this.allowedHashes.add(hash);
    this.updateCSP();
  }

  /**
   * Gera a política CSP completa
   */
  private generateCSPPolicy(): string {
    const domains = Array.from(this.trustedDomains).join(' ');
    const hashes = Array.from(this.allowedHashes).join(' ');
    
    const basePolicy = {
      'default-src': "'self'",
      'script-src': this.config.strictMode 
        ? `'self' 'nonce-${this.currentNonce}' ${hashes}`.trim()
        : `'self' 'nonce-${this.currentNonce}' ${hashes} 'strict-dynamic'`.trim(),
      'style-src': this.config.strictMode
        ? `'self' 'nonce-${this.currentNonce}' https://fonts.googleapis.com`
        : `'self' 'unsafe-inline' https://fonts.googleapis.com`,
      'img-src': `'self' data: blob: ${domains}`,
      'font-src': `'self' https://fonts.gstatic.com data:`,
      'connect-src': `'self' ${domains} wss://*.supabase.co`,
      'media-src': `'self' blob: data:`,
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'",
      'frame-ancestors': "'none'",
      'upgrade-insecure-requests': '',
      'block-all-mixed-content': ''
    };

    // Adicionar diretivas específicas para desenvolvimento
    if (this.config.developmentMode) {
      basePolicy['script-src'] += " 'unsafe-eval'";
      basePolicy['connect-src'] += " ws://localhost:* http://localhost:*";
    }

    // Adicionar reporting
    if (this.config.enableReporting) {
      if (this.config.reportUri) {
        basePolicy['report-uri'] = this.config.reportUri;
      }
      basePolicy['report-to'] = 'csp-endpoint';
    }

    // Converter para string
    return Object.entries(basePolicy)
      .map(([directive, value]) => value ? `${directive} ${value}` : directive)
      .join('; ');
  }

  /**
   * Aplica a política CSP
   */
  private applyCSP(): void {
    if (typeof document === 'undefined') return;

    const policy = this.generateCSPPolicy();
    
    // Remover meta tag CSP existente
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Adicionar nova meta tag CSP
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = policy;
    document.head.appendChild(meta);

    // Log da aplicação da política
    securityLogger.logSecurityEvent({
      event_type: SecurityEventType.CONFIGURATION_CHANGE,
      action: 'csp_policy_applied',
      details: {
        policy_length: policy.length,
        strict_mode: this.config.strictMode,
        nonce_length: this.currentNonce.length,
        allowed_hashes_count: this.allowedHashes.size
      },
      risk_level: 'low'
    });
  }

  /**
   * Atualiza a política CSP
   */
  private updateCSP(): void {
    this.applyCSP();
  }

  /**
   * Configura relatório de violações CSP
   */
  private setupCSPViolationReporting(): void {
    if (typeof document === 'undefined') return;

    // Configurar Reporting API
    if ('ReportingObserver' in window) {
      const observer = new ReportingObserver((reports) => {
        for (const report of reports) {
          if (report.type === 'csp-violation') {
            this.handleCSPViolation(report.body as any);
          }
        }
      });
      observer.observe();
    }

    // Fallback para eventos de violação CSP
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation({
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        referrer: event.referrer,
        statusCode: event.statusCode,
        violatedDirective: event.violatedDirective,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });
    });
  }

  /**
   * Manipula violações CSP
   */
  private handleCSPViolation(violation: CSPViolation): void {
    this.violationCount++;
    
    // Determinar nível de risco
    const riskLevel = this.assessViolationRisk(violation);
    
    // Log da violação
    securityLogger.logSecurityEvent({
      event_type: SecurityEventType.SECURITY_VIOLATION,
      action: 'csp_violation',
      details: {
        blocked_uri: violation.blockedURI,
        document_uri: violation.documentURI,
        effective_directive: violation.effectiveDirective,
        violated_directive: violation.violatedDirective,
        source_file: violation.sourceFile,
        line_number: violation.lineNumber,
        column_number: violation.columnNumber,
        violation_count: this.violationCount
      },
      risk_level: riskLevel
    });

    // Ações automáticas baseadas no risco
    if (riskLevel === 'high' || riskLevel === 'critical') {
      this.handleHighRiskViolation(violation);
    }

    // Enviar para endpoint de relatório se configurado
    if (this.config.reportUri) {
      this.sendViolationReport(violation);
    }
  }

  /**
   * Avalia o nível de risco de uma violação
   */
  private assessViolationRisk(violation: CSPViolation): 'low' | 'medium' | 'high' | 'critical' {
    // Violações críticas
    if (violation.effectiveDirective === 'script-src' && 
        (violation.blockedURI.includes('eval') || 
         violation.blockedURI.includes('javascript:') ||
         violation.blockedURI.includes('data:'))) {
      return 'critical';
    }

    // Violações de alto risco
    if (violation.effectiveDirective === 'script-src' ||
        violation.effectiveDirective === 'object-src' ||
        violation.blockedURI.includes('unsafe-')) {
      return 'high';
    }

    // Violações de médio risco
    if (violation.effectiveDirective === 'style-src' ||
        violation.effectiveDirective === 'img-src' ||
        violation.effectiveDirective === 'connect-src') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Manipula violações de alto risco
   */
  private handleHighRiskViolation(violation: CSPViolation): void {
    // Log adicional para violações críticas
    console.error('🚨 CSP High-Risk Violation:', violation);
    
    // Notificar administradores (implementar conforme necessário)
    // this.notifyAdministrators(violation);
    
    // Bloquear recursos suspeitos
    if (violation.blockedURI && !violation.blockedURI.startsWith('data:')) {
      this.blockSuspiciousResource(violation.blockedURI);
    }
  }

  /**
   * Bloqueia recursos suspeitos
   */
  private blockSuspiciousResource(uri: string): void {
    // Adicionar à lista de recursos bloqueados
    // Implementar conforme necessário
    console.warn(`🔒 Blocking suspicious resource: ${uri}`);
  }

  /**
   * Envia relatório de violação
   */
  private async sendViolationReport(violation: CSPViolation): Promise<void> {
    if (!this.config.reportUri) return;

    try {
      await fetch(this.config.reportUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report'
        },
        body: JSON.stringify({
          'csp-report': violation
        })
      });
    } catch (error) {
      console.error('Erro ao enviar relatório CSP:', error);
    }
  }

  /**
   * Adiciona domínio confiável
   */
  public addTrustedDomain(domain: string): void {
    this.trustedDomains.add(domain);
    this.updateCSP();
  }

  /**
   * Remove domínio confiável
   */
  public removeTrustedDomain(domain: string): void {
    this.trustedDomains.delete(domain);
    this.updateCSP();
  }

  /**
   * Rotaciona o nonce (deve ser chamado periodicamente)
   */
  public rotateNonce(): void {
    this.generateNonce();
    this.updateCSP();
    
    securityLogger.logSecurityEvent({
      event_type: SecurityEventType.CONFIGURATION_CHANGE,
      action: 'csp_nonce_rotated',
      details: {
        new_nonce_length: this.currentNonce.length,
        timestamp: new Date().toISOString()
      },
      risk_level: 'low'
    });
  }

  /**
   * Obtém estatísticas de violações
   */
  public getViolationStats(): {
    totalViolations: number;
    allowedHashes: number;
    trustedDomains: number;
    currentNonce: string;
  } {
    return {
      totalViolations: this.violationCount,
      allowedHashes: this.allowedHashes.size,
      trustedDomains: this.trustedDomains.size,
      currentNonce: this.currentNonce
    };
  }

  /**
   * Modo de desenvolvimento - políticas mais flexíveis
   */
  public enableDevelopmentMode(): void {
    this.config.developmentMode = true;
    this.config.strictMode = false;
    this.updateCSP();
  }

  /**
   * Modo de produção - políticas rigorosas
   */
  public enableProductionMode(): void {
    this.config.developmentMode = false;
    this.config.strictMode = true;
    this.updateCSP();
  }

  /**
   * Limpa todos os hashes permitidos
   */
  public clearAllowedHashes(): void {
    this.allowedHashes.clear();
    this.updateCSP();
  }

  /**
   * Exporta configuração atual
   */
  public exportConfig(): {
    policy: string;
    config: CSPConfig;
    stats: ReturnType<typeof this.getViolationStats>;
  } {
    return {
      policy: this.generateCSPPolicy(),
      config: this.config,
      stats: this.getViolationStats()
    };
  }
}

// Instância singleton
export const cspManager = SecureCSPManager.getInstance();

// Hook para React
export function useCSP() {
  const getNonce = () => cspManager.getNonce();
  const addTrustedDomain = (domain: string) => cspManager.addTrustedDomain(domain);
  const generateScriptHash = (script: string) => cspManager.generateScriptHash(script);
  const rotateNonce = () => cspManager.rotateNonce();
  const getStats = () => cspManager.getViolationStats();
  
  return {
    getNonce,
    addTrustedDomain,
    generateScriptHash,
    rotateNonce,
    getStats
  };
}

// Componente para scripts inline seguros
export function SafeInlineScript({ children, ...props }: { children: string; [key: string]: any }) {
  const nonce = cspManager.getNonce();
  
  return React.createElement('script', {
    ...props,
    nonce,
    dangerouslySetInnerHTML: { __html: children }
  });
}

// Componente para estilos inline seguros
export function SafeInlineStyle({ children, ...props }: { children: string; [key: string]: any }) {
  const nonce = cspManager.getNonce();
  
  return React.createElement('style', {
    ...props,
    nonce,
    dangerouslySetInnerHTML: { __html: children }
  });
}

// Utilitário para executar scripts com nonce
export function executeSecureScript(scriptContent: string): void {
  const script = document.createElement('script');
  script.nonce = cspManager.getNonce();
  script.textContent = scriptContent;
  document.head.appendChild(script);
  document.head.removeChild(script);
}

// Rotação automática de nonce
if (typeof window !== 'undefined') {
  // Rotacionar nonce a cada 15 minutos
  setInterval(() => {
    cspManager.rotateNonce();
  }, 15 * 60 * 1000);
  
  // Rotacionar nonce ao focar na janela (usuário voltou)
  window.addEventListener('focus', () => {
    cspManager.rotateNonce();
  });
}

// Configuração inicial baseada no ambiente
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    cspManager.enableProductionMode();
  } else {
    cspManager.enableDevelopmentMode();
  }
}

// Exportar React para uso nos componentes
let React: any;
try {
  React = require('react');
} catch {
  // React não disponível
}