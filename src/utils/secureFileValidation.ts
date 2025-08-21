// File validation utilities
export interface FileValidationOptions {
  allowedTypes: string[];
  allowedExtensions?: string[];
  maxSize: number;
  enableMalwareScanning?: boolean;
  quarantineOnSuspicion?: boolean;
  scanTimeout?: number;
  requireSignatureValidation?: boolean;
  scanForMalware?: boolean;
  validateImageDimensions?: boolean;
  maxDimensions?: { width: number; height: number };
  minDimensions?: { width: number; height: number };
  stripMetadata?: boolean;
  sanitizeFilename?: boolean;
}

export const defaultFileValidationOptions: FileValidationOptions = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  maxSize: 10 * 1024 * 1024, // 10MB
  enableMalwareScanning: true,
  quarantineOnSuspicion: true,
  scanTimeout: 30000
};

export function validateFile(file: File, options: FileValidationOptions = defaultFileValidationOptions): boolean {
  // Type validation
  if (!options.allowedTypes.includes(file.type)) {
    return false;
  }
  
  // Size validation
  if (file.size > options.maxSize) {
    return false;
  }
  
  return true;
}