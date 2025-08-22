/**
 * Hook para Validações de Formulário em Tempo Real
 * Sistema Oliver Blueberry - Melhorias UX
 */

import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  email?: boolean;
  phone?: boolean;
  imei?: boolean;
  numeric?: boolean;
  min?: number;
  max?: number;
}

export interface FieldValidation {
  isValid: boolean;
  error: string | null;
  touched: boolean;
}

export interface FormValidationState {
  [fieldName: string]: FieldValidation;
}

/**
 * Validadores específicos para o domínio
 */
const validators = {
  required: (value: unknown): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'Este campo é obrigatório';
    }
    return null;
  },

  minLength: (value: string, min: number): string | null => {
    if (value && value.length < min) {
      return `Deve ter pelo menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (value: string, max: number): string | null => {
    if (value && value.length > max) {
      return `Deve ter no máximo ${max} caracteres`;
    }
    return null;
  },

  pattern: (value: string, pattern: RegExp): string | null => {
    if (value && !pattern.test(value)) {
      return 'Formato inválido';
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email inválido';
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    // Remove todos os caracteres não numéricos
    const cleanPhone = value.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (telefone brasileiro)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return 'Telefone deve ter 10 ou 11 dígitos';
    }
    
    // Verifica se não são todos os dígitos iguais
    if (/^(\d)\1+$/.test(cleanPhone)) {
      return 'Telefone inválido';
    }
    
    return null;
  },

  imei: (value: string): string | null => {
    if (!value) return null;
    
    // Remove espaços e hífens
    const cleanImei = value.replace(/[\s-]/g, '');
    
    // IMEI deve ter 15 dígitos
    if (!/^\d{15}$/.test(cleanImei)) {
      return 'IMEI deve ter 15 dígitos';
    }
    
    // Validação do algoritmo de Luhn para IMEI
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(cleanImei[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== parseInt(cleanImei[14])) {
      return 'IMEI inválido';
    }
    
    return null;
  },

  numeric: (value: string): string | null => {
    if (!value) return null;
    
    // Normalizar valor monetário brasileiro (vírgula para ponto)
    const normalizedValue = typeof value === 'string' 
      ? value.replace(',', '.') 
      : String(value);
    
    if (isNaN(Number(normalizedValue))) {
      return 'Deve ser um número válido';
    }
    return null;
  },

  min: (value: string, min: number): string | null => {
    if (!value) return null;
    
    // Normalizar valor monetário brasileiro (vírgula para ponto)
    const normalizedValue = typeof value === 'string' 
      ? value.replace(',', '.') 
      : String(value);
    
    const numValue = Number(normalizedValue);
    if (!isNaN(numValue) && numValue < min) {
      return `Valor deve ser maior ou igual a ${min}`;
    }
    return null;
  },

  max: (value: string, max: number): string | null => {
    if (!value) return null;
    
    // Normalizar valor monetário brasileiro (vírgula para ponto)
    const normalizedValue = typeof value === 'string' 
      ? value.replace(',', '.') 
      : String(value);
    
    const numValue = Number(normalizedValue);
    if (!isNaN(numValue) && numValue > max) {
      return `Valor deve ser menor ou igual a ${max}`;
    }
    return null;
  }
};

/**
 * Hook principal para validação de formulários
 */
export const useFormValidation = <T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [validationState, setValidationState] = useState<FormValidationState>({});

  // Função para validar um campo específico
  const validateField = useCallback(
    (fieldName: keyof T, value: unknown): FieldValidation => {
      const rules = validationRules[fieldName];
      if (!rules) {
        return { isValid: true, error: null, touched: true };
      }

      // Executar validações em ordem
      let error: string | null = null;

      // Required
      if (rules.required && !error) {
        error = validators.required(value);
      }

      // Se o campo está vazio e não é obrigatório, pular outras validações
      if (!value && !rules.required) {
        return { isValid: true, error: null, touched: true };
      }

      // MinLength
      if (rules.minLength && !error) {
        error = validators.minLength(String(value || ''), rules.minLength);
      }

      // MaxLength
      if (rules.maxLength && !error) {
        error = validators.maxLength(String(value || ''), rules.maxLength);
      }

      // Pattern
      if (rules.pattern && !error) {
        error = validators.pattern(String(value || ''), rules.pattern);
      }

      // Email
      if (rules.email && !error) {
        error = validators.email(String(value || ''));
      }

      // Phone
      if (rules.phone && !error) {
        error = validators.phone(String(value || ''));
      }

      // IMEI
      if (rules.imei && !error) {
        error = validators.imei(String(value || ''));
      }

      // Numeric
      if (rules.numeric && !error) {
        error = validators.numeric(String(value || ''));
      }

      // Min
      if (rules.min !== undefined && !error) {
        error = validators.min(String(value || ''), rules.min);
      }

      // Max
      if (rules.max !== undefined && !error) {
        error = validators.max(String(value || ''), rules.max);
      }

      // Custom validation
      if (rules.custom && !error) {
        error = rules.custom(value);
      }

      return {
        isValid: !error,
        error,
        touched: true
      };
    },
    [validationRules]
  );

  // Função para atualizar um campo e validá-lo
  const updateField = useCallback(
    (fieldName: keyof T, value: unknown) => {
      setValues(prev => ({ ...prev, [fieldName]: value }));
      
      const validation = validateField(fieldName, value);
      setValidationState(prev => ({
        ...prev,
        [fieldName as string]: validation
      }));
    },
    [validateField]
  );

  // Função para marcar um campo como tocado (para validação on blur)
  const touchField = useCallback(
    (fieldName: keyof T) => {
      const value = values[fieldName];
      const validation = validateField(fieldName, value);
      setValidationState(prev => ({
        ...prev,
        [fieldName as string]: validation
      }));
    },
    [values, validateField]
  );

  // Função para validar todos os campos
  const validateAll = useCallback(() => {
    const newValidationState: FormValidationState = {};
    let isFormValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const validation = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      newValidationState[fieldName] = validation;
      if (!validation.isValid) {
        isFormValid = false;
      }
    });

    setValidationState(newValidationState);
    return isFormValid;
  }, [values, validationRules, validateField]);

  // Função para resetar o formulário
  const reset = useCallback(() => {
    setValues(initialValues);
    setValidationState({});
  }, [initialValues]);

  // Função para definir valores em lote
  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Computar estado geral do formulário
  const formState = useMemo(() => {
    const touchedFields = Object.keys(validationState);
    const invalidFields = Object.values(validationState).filter(v => !v.isValid);
    
    return {
      isValid: invalidFields.length === 0 && touchedFields.length > 0,
      hasErrors: invalidFields.length > 0,
      touchedFieldsCount: touchedFields.length,
      totalFieldsCount: Object.keys(validationRules).length,
      isDirty: JSON.stringify(values) !== JSON.stringify(initialValues)
    };
  }, [validationState, values, initialValues, validationRules]);

  // Função para obter erro de um campo específico
  const getFieldError = useCallback(
    (fieldName: keyof T): string | null => {
      return validationState[fieldName as string]?.error || null;
    },
    [validationState]
  );

  // Função para verificar se um campo é válido
  const isFieldValid = useCallback(
    (fieldName: keyof T): boolean => {
      return validationState[fieldName as string]?.isValid !== false;
    },
    [validationState]
  );

  // Função para verificar se um campo foi tocado
  const isFieldTouched = useCallback(
    (fieldName: keyof T): boolean => {
      return validationState[fieldName as string]?.touched || false;
    },
    [validationState]
  );

  return {
    values,
    validationState,
    formState,
    updateField,
    touchField,
    validateAll,
    reset,
    setFormValues,
    getFieldError,
    isFieldValid,
    isFieldTouched
  };
};

/**
 * Hook específico para validação de Service Order
 */
export const useServiceOrderValidation = (initialValues: Record<string, unknown>) => {
  const validationRules = {
    deviceModel: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    reportedIssue: {
      required: true,
      minLength: 10,
      maxLength: 1000
    },
    imeiSerial: {
      imei: true,
      required: false
    },
    laborCost: {
      numeric: true,
      min: 0,
      max: 99999
    },
    partsCost: {
      numeric: true,
      min: 0,
      max: 99999
    },
    totalPrice: {
      numeric: true,
      min: 0,
      max: 99999
    },
    warrantyMonths: {
      numeric: true,
      min: 0,
      max: 60
    }
  };

  return useFormValidation(initialValues, validationRules);
};