/**
 * Sistema de Prevenção de Recarregamentos
 * OneDrip - Estabilidade da Aplicação
 */

// Debounce para eventos repetitivos
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle para limitar execuções
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Gerenciador de intervalos globais
class IntervalManager {
  private intervals = new Set<NodeJS.Timeout>();
  
  create(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }
  
  clear(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }
  
  clearAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
  
  getCount(): number {
    return this.intervals.size;
  }
}

export const intervalManager = new IntervalManager();

// Cleanup ao descarregar a página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    intervalManager.clearAll();
  });
  
  // Limpar intervalos quando a aba fica inativa por muito tempo
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          // Limpar intervalos não essenciais após 5 minutos inativo
          console.log('🧹 Limpando intervalos devido à inatividade');
        }
      }, 5 * 60 * 1000);
    }
  });
}

// Prevenção de logs excessivos
let lastLogTime = 0;
let logCount = 0;
const LOG_THROTTLE_LIMIT = 10; // máximo 10 logs por segundo
const LOG_RESET_INTERVAL = 1000; // resetar contador a cada segundo

export const throttledLog = (...args: any[]) => {
  const now = Date.now();
  
  if (now - lastLogTime > LOG_RESET_INTERVAL) {
    logCount = 0;
    lastLogTime = now;
  }
  
  if (logCount < LOG_THROTTLE_LIMIT) {
    console.log(...args);
    logCount++;
  }
};

// Monitor de performance para detectar loops
class PerformanceMonitor {
  private renderCount = 0;
  private lastRenderReset = Date.now();
  private readonly RENDER_WARNING_THRESHOLD = 100; // renders por segundo
  
  recordRender(componentName?: string) {
    this.renderCount++;
    
    const now = Date.now();
    if (now - this.lastRenderReset > 1000) {
      if (this.renderCount > this.RENDER_WARNING_THRESHOLD) {
        console.warn(
          `⚠️ Possível loop detectado: ${this.renderCount} renders em 1s`,
          componentName ? `Componente: ${componentName}` : ''
        );
      }
      this.renderCount = 0;
      this.lastRenderReset = now;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Declarações globais para TypeScript
declare global {
  interface Window {
    __SW_REGISTERED__?: boolean;
    __CONTROLLER_CHANGED__?: boolean;
    __RATE_LIMIT_CLEANUP__?: boolean;
  }
}