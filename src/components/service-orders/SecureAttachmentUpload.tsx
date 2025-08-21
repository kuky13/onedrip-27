/**
 * Componente Seguro para Upload de Anexos de Ordens de Serviço
 * Sistema OneDrip Blueberry - Interface com Validação Rigorosa
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSecureServiceOrderAttachments } from '@/hooks/useSecureServiceOrderAttachments';
import { Upload, FileText, AlertTriangle, CheckCircle, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type ServiceOrderAttachment = Tables<'service_order_attachments'>;

interface SecureAttachmentUploadProps {
  serviceOrderId: string;
  existingAttachments?: ServiceOrderAttachment[];
  onAttachmentUploaded?: (attachment: ServiceOrderAttachment) => void;
  onAttachmentDeleted?: (attachmentId: string) => void;
  maxFiles?: number;
  disabled?: boolean;
}

/**
 * Formatos de arquivo permitidos com suas extensões e tipos MIME
 */
const ALLOWED_FILE_TYPES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    label: 'Imagens'
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    label: 'Documentos'
  },
  spreadsheets: {
    extensions: ['.xls', '.xlsx', '.csv'],
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    label: 'Planilhas'
  }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_ORDER = 10;

/**
 * Componente para upload seguro de anexos
 */
export const SecureAttachmentUpload: React.FC<SecureAttachmentUploadProps> = ({
  serviceOrderId,
  existingAttachments = [],
  onAttachmentUploaded,
  onAttachmentDeleted,
  maxFiles = MAX_FILES_PER_ORDER,
  disabled = false
}) => {
  const {
    uploadAttachment,
    deleteAttachment,
    isUploading,
    uploadProgress,
    error
  } = useSecureServiceOrderAttachments();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Valida arquivo selecionado
   */
  const validateFile = useCallback((file: File): string[] => {
    const errors: string[] = [];

    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Arquivo muito grande. Máximo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
    }

    // Verificar tipo MIME
    const allAllowedMimeTypes = Object.values(ALLOWED_FILE_TYPES)
      .flatMap(type => type.mimeTypes);
    
    if (!allAllowedMimeTypes.includes(file.type)) {
      errors.push('Tipo de arquivo não permitido');
    }

    // Verificar extensão
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allAllowedExtensions = Object.values(ALLOWED_FILE_TYPES)
      .flatMap(type => type.extensions);
    
    if (!allAllowedExtensions.includes(fileExtension)) {
      errors.push('Extensão de arquivo não permitida');
    }

    // Verificar limite de arquivos
    if (existingAttachments.length >= maxFiles) {
      errors.push(`Limite de ${maxFiles} arquivos por ordem atingido`);
    }

    // Verificar nome do arquivo
    if (file.name.length > 100) {
      errors.push('Nome do arquivo muito longo (máximo 100 caracteres)');
    }

    // Verificar caracteres especiais no nome
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      errors.push('Nome do arquivo contém caracteres inválidos');
    }

    return errors;
  }, [existingAttachments.length, maxFiles]);

  /**
   * Manipula seleção de arquivo
   */
  const handleFileSelect = useCallback((file: File) => {
    const errors = validateFile(file);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  }, [validateFile]);

  /**
   * Manipula mudança no input de arquivo
   */
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  /**
   * Manipula drag and drop
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  /**
   * Executa upload
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const attachment = await uploadAttachment(
        serviceOrderId,
        selectedFile,
        description.trim() || undefined
      );

      if (attachment) {
        setSelectedFile(null);
        setDescription('');
        setValidationErrors([]);
        onAttachmentUploaded?.(attachment);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
    }
  }, [selectedFile, serviceOrderId, description, uploadAttachment, onAttachmentUploaded]);

  /**
   * Executa exclusão de anexo
   */
  const handleDelete = useCallback(async (attachmentId: string) => {
    const success = await deleteAttachment(attachmentId);
    if (success) {
      onAttachmentDeleted?.(attachmentId);
    }
  }, [deleteAttachment, onAttachmentDeleted]);

  /**
   * Formata tamanho do arquivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Obtém ícone do tipo de arquivo
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Anexos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste um arquivo aqui ou clique para selecionar
            </p>
            <Input
              type="file"
              onChange={handleFileChange}
              disabled={disabled || isUploading}
              className="hidden"
              id="file-upload"
              accept={Object.values(ALLOWED_FILE_TYPES)
                .flatMap(type => type.extensions)
                .join(',')}
            />
            <Label
              htmlFor="file-upload"
              className={cn(
                "inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90",
                (disabled || isUploading) && "opacity-50 cursor-not-allowed"
              )}
            >
              Selecionar Arquivo
            </Label>
          </div>

          {/* Tipos de arquivo permitidos */}
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Tipos permitidos:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ALLOWED_FILE_TYPES).map(([key, type]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {type.label}: {type.extensions.join(', ')}
                </Badge>
              ))}
            </div>
            <p className="mt-1">Tamanho máximo: {(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB</p>
          </div>

          {/* Erros de validação */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Arquivo selecionado */}
          {selectedFile && validationErrors.length === 0 && (
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationErrors([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Descrição opcional */}
              <div className="mt-4">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo do arquivo..."
                  maxLength={500}
                  rows={3}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/500 caracteres
                </p>
              </div>

              {/* Botão de upload */}
              <div className="mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
                </Button>
              </div>
            </div>
          )}

          {/* Progresso do upload */}
          {uploadProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando: {uploadProgress.fileName}</span>
                <span>{uploadProgress.progress}%</span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
              <p className="text-xs text-gray-500 capitalize">
                Status: {uploadProgress.status}
              </p>
            </div>
          )}

          {/* Erro geral */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de anexos existentes */}
      {existingAttachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anexos ({existingAttachments.length}/{maxFiles})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getFileIcon(attachment.mime_type || '')}
                    </span>
                    <div>
                      <p className="font-medium">{attachment.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatFileSize(attachment.file_size || 0)}</span>
                        {attachment.description && (
                          <>
                            <span>•</span>
                            <span>{attachment.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                    >
                      Visualizar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecureAttachmentUpload;