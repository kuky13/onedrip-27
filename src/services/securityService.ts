// ============================================
// SERVIÇO DE SEGURANÇA - CRIPTOGRAFIA
// ============================================
// Serviço para criptografia e descriptografia de dados sensíveis

import type { SecurityConfig } from '../../shared/types/pix';

// Configuração de segurança
const getSecurityConfig = (): SecurityConfig => {
  return {
    encryptionKey: import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production',
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12
  };
};

// Classe principal do serviço de segurança
export class SecurityService {
  private config: SecurityConfig;

  constructor() {
    this.config = getSecurityConfig();
  }

  // Gerar chave de criptografia a partir da string
  private async generateKey(keyString: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString.padEnd(32, '0').substring(0, 32));
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.config.algorithm },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Criptografar dados
  async encryptData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Gerar IV aleatório
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
      
      // Gerar chave
      const key = await this.generateKey(this.config.encryptionKey);
      
      // Criptografar
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );
      
      // Combinar IV + dados criptografados
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Converter para base64
      return btoa(String.fromCharCode(...combined));
      
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      throw new Error('Falha na criptografia');
    }
  }

  // Descriptografar dados
  async decryptData(encryptedData: string): Promise<string> {
    try {
      // Converter de base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Separar IV e dados criptografados
      const iv = combined.slice(0, this.config.ivLength);
      const encryptedBuffer = combined.slice(this.config.ivLength);
      
      // Gerar chave
      const key = await this.generateKey(this.config.encryptionKey);
      
      // Descriptografar
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv: iv
        },
        key,
        encryptedBuffer
      );
      
      // Converter para string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
      
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      throw new Error('Falha na descriptografia');
    }
  }

  // Criptografar objeto com dados sensíveis
  async encryptSensitiveData(data: Record<string, any>): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      return await this.encryptData(jsonString);
    } catch (error) {
      console.error('Erro ao criptografar dados sensíveis:', error);
      throw error;
    }
  }

  // Descriptografar objeto com dados sensíveis
  async decryptSensitiveData(encryptedData: string): Promise<Record<string, any>> {
    try {
      const jsonString = await this.decryptData(encryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erro ao descriptografar dados sensíveis:', error);
      throw error;
    }
  }

  // Gerar hash seguro para validação
  async generateHash(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      
      return btoa(String.fromCharCode(...hashArray));
    } catch (error) {
      console.error('Erro ao gerar hash:', error);
      throw new Error('Falha ao gerar hash');
    }
  }

  // Validar integridade dos dados
  async validateDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.generateHash(data);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Erro ao validar integridade:', error);
      return false;
    }
  }

  // Sanitizar dados de entrada
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>"'&]/g, '') // Remove caracteres perigosos
      .trim() // Remove espaços
      .substring(0, 1000); // Limita tamanho
  }

  // Validar email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar CPF (formato brasileiro)
  validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // Todos os dígitos iguais
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
  }

  // Mascarar dados sensíveis para logs
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - (visibleChars * 2));
    
    return `${start}${middle}${end}`;
  }
}

// Instância singleton do serviço
export const securityService = new SecurityService();

// Funções de conveniência para uso direto
export const encryptSensitiveData = (data: Record<string, any>) => 
  securityService.encryptSensitiveData(data);

export const decryptSensitiveData = (encryptedData: string) => 
  securityService.decryptSensitiveData(encryptedData);

export const generateHash = (data: string) => 
  securityService.generateHash(data);

export const validateDataIntegrity = (data: string, expectedHash: string) => 
  securityService.validateDataIntegrity(data, expectedHash);

export const sanitizeInput = (input: string) => 
  securityService.sanitizeInput(input);

export const validateEmail = (email: string) => 
  securityService.validateEmail(email);

export const validateCPF = (cpf: string) => 
  securityService.validateCPF(cpf);

export const maskSensitiveData = (data: string, visibleChars?: number) => 
  securityService.maskSensitiveData(data, visibleChars);

export default securityService;