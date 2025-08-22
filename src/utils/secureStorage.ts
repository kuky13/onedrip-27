/**
 * Sistema de Armazenamento Seguro com Criptografia
 * Sistema OneDrip Blueberry - Segurança 2025
 */

// Chave base para criptografia (em produção, deve vir de variável de ambiente)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'onedrip-blueberry-2025-secure-key';

/**
 * Gera uma chave de criptografia baseada na chave base e um salt
 */
const generateKey = async (salt: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY + salt),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Criptografa dados usando AES-GCM
 */
const encryptData = async (data: string, key: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combinar IV + dados criptografados
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Converter para base64
  return btoa(String.fromCharCode(...combined));
};

/**
 * Descriptografa dados usando AES-GCM
 */
const decryptData = async (encryptedData: string, key: CryptoKey): Promise<string> => {
  try {
    // Converter de base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    // Separar IV e dados criptografados
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    throw new Error('Falha na descriptografia');
  }
};

/**
 * Valida se os dados são sensíveis e precisam de criptografia
 */
const isSensitiveData = (key: string, value: any): boolean => {
  const sensitiveKeys = [
    'auth',
    'token',
    'session',
    'user',
    'password',
    'email',
    'phone',
    'cpf',
    'cnpj',
    'credit',
    'payment',
    'license',
    'api_key',
    'secret'
  ];

  const keyLower = key.toLowerCase();
  const hasSensitiveKey = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
  
  // Verificar se o valor contém informações sensíveis
  if (typeof value === 'string') {
    const valueLower = value.toLowerCase();
    const hasSensitiveValue = sensitiveKeys.some(sensitive => valueLower.includes(sensitive));
    return hasSensitiveKey || hasSensitiveValue;
  }

  return hasSensitiveKey;
};

/**
 * Interface para armazenamento seguro
 */
interface SecureStorageOptions {
  encrypt?: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  ttl?: number; // Time to live em milissegundos
}

/**
 * Classe para armazenamento seguro
 */
export class SecureStorage {
  private static instance: SecureStorage;
  private keyCache = new Map<string, CryptoKey>();

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Obtém ou gera uma chave de criptografia para um contexto específico
   */
  private async getKey(context: string): Promise<CryptoKey> {
    if (this.keyCache.has(context)) {
      return this.keyCache.get(context)!;
    }

    const key = await generateKey(context);
    this.keyCache.set(context, key);
    return key;
  }

  /**
   * Armazena dados de forma segura
   */
  async setItem(
    key: string,
    value: any,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    try {
      const {
        encrypt = isSensitiveData(key, value),
        storage = 'localStorage',
        ttl
      } = options;

      let dataToStore = {
        value,
        encrypted: encrypt,
        timestamp: Date.now(),
        ttl
      };

      let serializedData = JSON.stringify(dataToStore);

      if (encrypt) {
        const cryptoKey = await this.getKey(key);
        const encryptedValue = await encryptData(serializedData, cryptoKey);
        serializedData = JSON.stringify({
          encrypted: true,
          data: encryptedValue,
          timestamp: Date.now()
        });
      }

      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      storageObj.setItem(`secure_${key}`, serializedData);
    } catch (error) {
      console.error('Erro ao armazenar dados:', error);
      throw new Error('Falha no armazenamento seguro');
    }
  }

  /**
   * Recupera dados armazenados de forma segura
   */
  async getItem(
    key: string,
    storage: 'localStorage' | 'sessionStorage' = 'localStorage'
  ): Promise<any> {
    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      const storedData = storageObj.getItem(`secure_${key}`);

      if (!storedData) {
        return null;
      }

      let parsedData = JSON.parse(storedData);

      // Verificar se os dados estão criptografados
      if (parsedData.encrypted && parsedData.data) {
        const cryptoKey = await this.getKey(key);
        const decryptedData = await decryptData(parsedData.data, cryptoKey);
        parsedData = JSON.parse(decryptedData);
      }

      // Verificar TTL
      if (parsedData.ttl && parsedData.timestamp) {
        const now = Date.now();
        if (now - parsedData.timestamp > parsedData.ttl) {
          this.removeItem(key, storage);
          return null;
        }
      }

      return parsedData.value;
    } catch (error) {
      console.error('Erro ao recuperar dados:', error);
      // Se houver erro na descriptografia, remover o item corrompido
      this.removeItem(key, storage);
      return null;
    }
  }

  /**
   * Remove item do armazenamento
   */
  removeItem(
    key: string,
    storage: 'localStorage' | 'sessionStorage' = 'localStorage'
  ): void {
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
    storageObj.removeItem(`secure_${key}`);
  }

  /**
   * Limpa todos os dados seguros
   */
  clear(storage: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
    const keysToRemove: string[] = [];

    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key && key.startsWith('secure_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => storageObj.removeItem(key));
  }

  /**
   * Lista todas as chaves seguras
   */
  keys(storage: 'localStorage' | 'sessionStorage' = 'localStorage'): string[] {
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
    const secureKeys: string[] = [];

    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key && key.startsWith('secure_')) {
        secureKeys.push(key.replace('secure_', ''));
      }
    }

    return secureKeys;
  }
}

// Instância singleton
export const secureStorage = SecureStorage.getInstance();

// Funções de conveniência
export const setSecureItem = (key: string, value: any, options?: SecureStorageOptions) => 
  secureStorage.setItem(key, value, options);

export const getSecureItem = (key: string, storage?: 'localStorage' | 'sessionStorage') => 
  secureStorage.getItem(key, storage);

export const removeSecureItem = (key: string, storage?: 'localStorage' | 'sessionStorage') => 
  secureStorage.removeItem(key, storage);

export const clearSecureStorage = (storage?: 'localStorage' | 'sessionStorage') => 
  secureStorage.clear(storage);