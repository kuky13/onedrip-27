/**
 * Sistema de Debug Logging Otimizado
 * Previne logs excessivos que causam recarregamentos
 */

class DebugLogger {
  private lastLogTime = 0;
  private logCount = 0;
  private readonly LOG_THROTTLE_LIMIT = 5;
  private readonly LOG_RESET_INTERVAL = 1000;
  private isProduction = !import.meta.env.DEV;

  log(category: string, message: string, data?: any) {
    if (this.isProduction) return;

    const now = Date.now();
    
    // Reset contador se passou o intervalo
    if (now - this.lastLogTime > this.LOG_RESET_INTERVAL) {
      this.logCount = 0;
      this.lastLogTime = now;
    }
    
    // Limitar logs para prevenir spam
    if (this.logCount < this.LOG_THROTTLE_LIMIT) {
      console.log(`[${category}] ${message}`, data || '');
      this.logCount++;
    } else if (this.logCount === this.LOG_THROTTLE_LIMIT) {
      console.warn('⚠️ Logs throttled to prevent spam');
      this.logCount++;
    }
  }

  error(category: string, message: string, error?: any) {
    console.error(`[${category}] ${message}`, error || '');
  }

  warn(category: string, message: string, data?: any) {
    console.warn(`[${category}] ${message}`, data || '');
  }
}

export const debugLogger = new DebugLogger();