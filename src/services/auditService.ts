// ============================================
// SERVIÇO DE AUDITORIA - LOGS E RASTREAMENTO
// ============================================
// Serviço para registro de auditoria e logs de transações

import type { AuditLog } from '../../shared/types/pix';
import { securityService } from './securityService';

// Classe principal do serviço de auditoria
export class AuditService {
  private logs: AuditLog[] = [];
  private maxLogs = 10000; // Máximo de logs em memória

  constructor() {
    this.loadLogsFromStorage();
  }

  // Carregar logs do armazenamento local
  private loadLogsFromStorage(): void {
    try {
      const storedLogs = localStorage.getItem('audit_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      this.logs = [];
    }
  }

  // Salvar logs no armazenamento local
  private saveLogsToStorage(): void {
    try {
      // Manter apenas os logs mais recentes
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs de auditoria:', error);
    }
  }

// Registrar evento de auditoria
  async logEvent(event: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
    try {
      // Gerar ID único para o log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Obter informações do navegador
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getClientIP();
      
      // Criar log de auditoria
      const auditLog: AuditLog = {
        id: logId,
        timestamp: new Date(),
        createdAt: new Date(),
        action: event.action,
        details: event.details,
        userId: event.userId,
        userEmail: event.userEmail,
        transactionId: event.transactionId,
        ipAddress,
        userAgent,
        severity: event.severity || 'info'
      };
      
      // Adicionar à lista de logs
      this.logs.push(auditLog);
      
      // Salvar no armazenamento
      this.saveLogsToStorage();
      
      // Log no console para desenvolvimento
      console.log(`[AUDIT] ${auditLog.action}:`, auditLog.details);
      
      // Em produção, enviar para servidor de logs
      if (import.meta.env.PROD) {
        await this.sendLogToServer(auditLog);
      }
      
    } catch (error) {
      console.error('Erro ao registrar evento de auditoria:', error);
    }
  }

  // Obter IP do cliente (simulado para desenvolvimento)
  private async getClientIP(): Promise<string> {
    try {
      // Em produção, usar serviço real de IP
      // const response = await fetch('https://api.ipify.org?format=json');
      // const data = await response.json();
      // return data.ip;
      
      // Para desenvolvimento, retornar IP local
      return '127.0.0.1';
    } catch (error) {
      return 'unknown';
    }
  }

  // Enviar log para servidor (implementar em produção)
  private async sendLogToServer(log: AuditLog): Promise<void> {
    try {
      // Criptografar dados sensíveis antes de enviar
      const encryptedLog = {
        ...log,
        details: await securityService.encryptSensitiveData(log.details),
        userEmail: log.userEmail ? await securityService.encryptData(log.userEmail) : undefined
      };
      
      // Enviar para endpoint de logs
      // await fetch('/api/audit/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(encryptedLog)
      // });
      
      console.log('Log enviado para servidor:', log.id);
    } catch (error) {
      console.error('Erro ao enviar log para servidor:', error);
    }
  }

  // Buscar logs por filtros
  getLogs(filters?: {
    action?: string;
    userId?: string;
    userEmail?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: 'info' | 'warning' | 'error';
    limit?: number;
  }): AuditLog[] {
    let filteredLogs = [...this.logs];
    
    if (filters) {
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(filters.action!.toLowerCase())
        );
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.userEmail) {
        filteredLogs = filteredLogs.filter(log => log.userEmail === filters.userEmail);
      }
      
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
      
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
      
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(-filters.limit);
      }
    }
    
    // Ordenar por timestamp (mais recentes primeiro)
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Obter estatísticas de logs
  getLogStatistics(): {
    total: number;
    byAction: Record<string, number>;
    bySeverity: Record<string, number>;
    last24Hours: number;
    last7Days: number;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const byAction: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let last24HoursCount = 0;
    let last7DaysCount = 0;
    
    this.logs.forEach(log => {
      // Contar por ação
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      
      // Contar por severidade
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      
      // Contar por período
      if (log.timestamp >= last24Hours) {
        last24HoursCount++;
      }
      if (log.timestamp >= last7Days) {
        last7DaysCount++;
      }
    });
    
    return {
      total: this.logs.length,
      byAction,
      bySeverity,
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount
    };
  }

  // Limpar logs antigos
  clearOldLogs(olderThanDays: number = 30): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.logs.length;
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    
    this.saveLogsToStorage();
    
    const removedCount = initialCount - this.logs.length;
    console.log(`Removidos ${removedCount} logs antigos`);
    
    return removedCount;
  }

  // Exportar logs para análise
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Action', 'User Email', 'IP Address', 'Severity', 'Details'];
      const rows = this.logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.action,
        log.userEmail || '',
        log.ipAddress,
        log.severity,
        JSON.stringify(log.details)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  // Logs específicos para transações PIX
  async logPixTransaction(action: string, transactionId: string, details: any, userEmail?: string): Promise<void> {
    await this.logEvent({
      action: `pix_${action}`,
      transactionId,
      details: {
        transactionId,
        ...details
      },
      userEmail,
      severity: 'info'
    });
  }

  // Logs de erro para transações PIX
  async logPixError(error: string, details: any, userEmail?: string, transactionId?: string): Promise<void> {
    await this.logEvent({
      action: 'pix_error',
      transactionId,
      details: {
        error,
        ...details
      },
      userEmail,
      severity: 'error'
    });
  }

  // Logs de segurança
  async logSecurityEvent(action: string, details: any, userEmail?: string): Promise<void> {
    await this.logEvent({
      action: `security_${action}`,
      details,
      userEmail,
      severity: 'warning'
    });
  }
}

// Instância singleton do serviço
export const auditService = new AuditService();

// Funções de conveniência para uso direto
export const logAuditEvent = (event: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>) => 
  auditService.logEvent(event);

export const getAuditLogs = (filters?: any) => 
  auditService.getLogs(filters);

export const getLogStatistics = () => 
  auditService.getLogStatistics();

export const logPixTransaction = (action: string, transactionId: string, details: any, userEmail?: string) => 
  auditService.logPixTransaction(action, transactionId, details, userEmail);

export const logPixError = (error: string, details: any, userEmail?: string, transactionId?: string) => 
  auditService.logPixError(error, details, userEmail, transactionId);

export const logSecurityEvent = (action: string, details: any, userEmail?: string) => 
  auditService.logSecurityEvent(action, details, userEmail);

export default auditService;