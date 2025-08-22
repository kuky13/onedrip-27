/**
 * Sistema Unificado de Gestão de Storage Local
 * Organiza todos os dados do usuário de forma estruturada e otimizada
 */

export interface UserStorageData {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    avatar_url?: string;
  };
  settings: {
    theme?: string;
    notifications?: boolean;
    budgetWarning?: boolean;
    budgetWarningDays?: number;
    painelEnabled?: boolean;
    forceNormalDashboard?: boolean;
    socialQrEnabled?: boolean;
  };
  cache: {
    lastSync?: number;
    profileData?: any;
    licenseInfo?: any;
    expiry?: number; // TTL para cache
  };
  sessionBackup?: {
    hasValidSession?: boolean;
    lastLogin?: number;
    deviceInfo?: string;
  };
}

class LocalStorageManager {
  private readonly APP_KEY = 'onedrip_app_data';
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutos
  private readonly BACKUP_KEY = 'onedrip_backup';

  /**
   * Obter todos os dados do app
   */
  getData(): UserStorageData {
    try {
      const data = localStorage.getItem(this.APP_KEY);
      if (!data) return this.getDefaultData();
      
      const parsed = JSON.parse(data);
      
      // Verificar se cache expirou
      if (parsed.cache?.expiry && Date.now() > parsed.cache.expiry) {
        parsed.cache = { lastSync: Date.now() };
      }
      
      return { ...this.getDefaultData(), ...parsed };
    } catch (error) {
      console.warn('Erro ao ler dados do localStorage:', error);
      return this.getDefaultData();
    }
  }

  /**
   * Salvar dados do app de forma otimizada
   */
  setData(data: Partial<UserStorageData>, merge = true): void {
    try {
      const currentData = merge ? this.getData() : this.getDefaultData();
      const newData = { ...currentData, ...data };
      
      // Definir TTL para cache
      if (newData.cache) {
        newData.cache.expiry = Date.now() + this.CACHE_TTL;
      }
      
      localStorage.setItem(this.APP_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  /**
   * Atualizar dados do usuário
   */
  setUserData(userData: UserStorageData['user']): void {
    this.setData({ user: userData });
  }

  /**
   * Atualizar configurações
   */
  setSettings(settings: Partial<UserStorageData['settings']>): void {
    const currentData = this.getData();
    this.setData({
      settings: { ...currentData.settings, ...settings }
    });
  }

  /**
   * Atualizar cache
   */
  setCache(cacheData: Partial<UserStorageData['cache']>): void {
    const currentData = this.getData();
    this.setData({
      cache: { ...currentData.cache, ...cacheData, lastSync: Date.now() }
    });
  }

  /**
   * Criar backup da sessão
   */
  createSessionBackup(): void {
    const backupData = {
      hasValidSession: true,
      lastLogin: Date.now(),
      deviceInfo: navigator.userAgent.substring(0, 50)
    };
    
    this.setData({ sessionBackup: backupData });
    
    // Backup adicional separado para emergências
    try {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify({
        timestamp: Date.now(),
        userData: this.getData().user
      }));
    } catch (error) {
      console.warn('Erro ao criar backup:', error);
    }
  }

  /**
   * Verificar se há backup válido
   */
  hasValidBackup(): boolean {
    const data = this.getData();
    const backup = data.sessionBackup;
    
    if (!backup?.hasValidSession) return false;
    
    // Backup válido por 7 dias
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    return backup.lastLogin && (Date.now() - backup.lastLogin) < maxAge;
  }

  /**
   * Limpeza inteligente - preserva dados essenciais
   */
  smartClear(): void {
    const currentData = this.getData();
    const preservedSettings = {
      theme: currentData.settings.theme,
      painelEnabled: currentData.settings.painelEnabled
    };

    // Manter apenas configurações essenciais
    const cleanData: UserStorageData = {
      ...this.getDefaultData(),
      settings: preservedSettings
    };

    localStorage.setItem(this.APP_KEY, JSON.stringify(cleanData));
    
    // Limpar dados específicos antigos
    this.clearLegacyData();
  }

  /**
   * Limpeza completa (para logout)
   */
  fullClear(): void {
    localStorage.removeItem(this.APP_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
    this.clearLegacyData();
  }

  /**
   * Migrar dados antigos para nova estrutura
   */
  migrateOldData(): void {
    const migrations = [
      'painel-enabled',
      'force-normal-dashboard', 
      'ext-social-qr-enabled',
      'admin-mode',
      'budgetCopyData',
      'user-feedback'
    ];

    const settings: any = {};
    const migrated: string[] = [];

    migrations.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        switch (key) {
          case 'painel-enabled':
            settings.painelEnabled = value === 'true';
            break;
          case 'force-normal-dashboard':
            settings.forceNormalDashboard = value === 'true';
            break;
          case 'ext-social-qr-enabled':
            settings.socialQrEnabled = value === 'true';
            break;
        }
        migrated.push(key);
      }
    });

    if (migrated.length > 0) {
      this.setSettings(settings);
      migrated.forEach(key => localStorage.removeItem(key));
      console.log('Dados migrados:', migrated);
    }
  }

  /**
   * Limpar dados legados/antigos
   */
  private clearLegacyData(): void {
    const legacyKeys = [
      'painel-enabled',
      'force-normal-dashboard',
      'ext-social-qr-enabled',
      'admin-mode',
      'pwa-prompt-dismissed',
      'pwa-prompt-last-dismissed',
      'update-dismissed',
      'budgetCopyData'
    ];

    legacyKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Obter dados padrão
   */
  private getDefaultData(): UserStorageData {
    return {
      settings: {
        notifications: true,
        budgetWarning: true,
        budgetWarningDays: 15,
        painelEnabled: false,
        forceNormalDashboard: false,
        socialQrEnabled: false
      },
      cache: {
        lastSync: Date.now()
      }
    };
  }

  /**
   * Obter estatísticas de uso
   */
  getStorageStats(): { size: number; keys: number; lastSync?: number } {
    const data = this.getData();
    const size = new Blob([JSON.stringify(data)]).size;
    
    return {
      size,
      keys: Object.keys(localStorage).length,
      lastSync: data.cache.lastSync
    };
  }
}

export const storageManager = new LocalStorageManager();