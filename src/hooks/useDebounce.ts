import { useState, useEffect } from 'react';

/**
 * Hook de debounce otimizado para iOS
 * Evita execuções desnecessárias durante digitação
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value (no delay) if it's the first time or if value is empty
    if (value === '' || value === null || value === undefined) {
      setDebouncedValue(value);
      return;
    }

    // Set up timeout for debouncing
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel timeout if value changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook de debounce para callbacks
 * Útil para funções que não devem ser executadas a cada mudança
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      callback(...args);
      setDebounceTimer(null);
    }, delay);

    setDebounceTimer(newTimer);
  }) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}