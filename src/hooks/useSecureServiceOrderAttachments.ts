/**
 * Hook Seguro para Anexos de Ordens de Serviço
 * Sistema OneDrip Blueberry - Implementação com Validação Rigorosa
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSecureFileUpload } from '@/hooks/useSecurity';
import { toast } from 'sonner';
import { validateInput, logSecurityEvent } from '@/utils/security/inputValidation';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ServiceOrderAttachment = Tables<'service_order_attachments'>;
type ServiceOrderAttachmentInsert = TablesInsert<'service_order_attachments'>;

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface UseSecureServiceOrderAttachmentsReturn {
  uploadAttachment: (serviceOrderId: string, file: File, description?: string) => Promise<ServiceOrderAttachment | null>;
  deleteAttachment: (attachmentId: string) => Promise<boolean>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
}

/**
 * Hook para gerenciamento seguro de anexos de ordens de serviço
 */
export const useSecureServiceOrderAttachments = (): UseSecureServiceOrderAttachmentsReturn => {
  const queryClient = useQueryClient();
  const validateFile = useSecureFileUpload('COMPANY_LOGO'); // Usar configuração similar
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida UUID de ordem de serviço
   */
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  /**
   * Sanitiza nome do arquivo
   */
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Substituir caracteres especiais
      .replace(/_{2,}/g, '_') // Remover underscores duplos
      .substring(0, 100); // Limitar tamanho
  };

  /**
   * Gera caminho seguro para o arquivo
   */
  const generateSecureFilePath = (serviceOrderId: string, fileName: string): string => {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(fileName);
    return `${serviceOrderId}/${timestamp}_${sanitizedName}`;
  };

  /**
   * Upload seguro de anexo
   */
  const uploadAttachment = useCallback(async (
    serviceOrderId: string,
    file: File,
    description?: string
  ): Promise<ServiceOrderAttachment | null> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      // 1. Validações de entrada
      if (!isValidUUID(serviceOrderId)) {
        throw new Error('ID da ordem de serviço inválido');
      }

      // 2. Validar arquivo
      setUploadProgress(prev => prev ? { ...prev, progress: 10, status: 'processing' } : null);
      
      const isFileValid = await validateFile(file);
      if (!isFileValid) {
        throw new Error('Arquivo não passou na validação de segurança');
      }

      // 3. Validar descrição se fornecida
      if (description) {
        const descriptionValidation = await validateInput(description, {
          maxLength: 500,
          inputType: 'text'
        });
        
        if (!descriptionValidation.isValid) {
          throw new Error(`Descrição inválida: ${descriptionValidation.errors?.join(', ')}`);
        }
      }

      // 4. Verificar se a ordem de serviço existe e pertence ao usuário
      setUploadProgress(prev => prev ? { ...prev, progress: 20 } : null);
      
      const { data: serviceOrder, error: serviceOrderError } = await supabase
        .from('service_orders')
        .select('id, owner_id')
        .eq('id', serviceOrderId)
        .is('deleted_at', null)
        .single();

      if (serviceOrderError || !serviceOrder) {
        await logSecurityEvent('INVALID_SERVICE_ORDER_ACCESS', {
          serviceOrderId,
          error: serviceOrderError?.message
        });
        throw new Error('Ordem de serviço não encontrada ou acesso negado');
      }

      // 5. Verificar limites antes do upload
      setUploadProgress(prev => prev ? { ...prev, progress: 30 } : null);
      
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_service_order_attachment_upload', {
          p_service_order_id: serviceOrderId,
          p_file_name: file.name,
          p_file_size: file.size,
          p_mime_type: file.type
        });

      if (validationError || !validationResult) {
        await logSecurityEvent('ATTACHMENT_VALIDATION_FAILED', {
          serviceOrderId,
          fileName: file.name,
          fileSize: file.size,
          error: validationError?.message
        });
        throw new Error(validationError?.message || 'Falha na validação do arquivo');
      }

      // 6. Upload do arquivo para o Storage
      setUploadProgress(prev => prev ? { ...prev, progress: 50 } : null);
      
      const filePath = generateSecureFilePath(serviceOrderId, file.name);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-orders')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        await logSecurityEvent('STORAGE_UPLOAD_FAILED', {
          serviceOrderId,
          fileName: file.name,
          error: uploadError.message
        });
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // 7. Obter URL pública do arquivo
      setUploadProgress(prev => prev ? { ...prev, progress: 70 } : null);
      
      const { data: urlData } = supabase.storage
        .from('service-orders')
        .getPublicUrl(uploadData.path);

      // 8. Criar registro na tabela de anexos
      setUploadProgress(prev => prev ? { ...prev, progress: 80 } : null);
      
      const attachmentData: ServiceOrderAttachmentInsert = {
        service_order_id: serviceOrderId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
        uploaded_by: serviceOrder.owner_id
      };

      const { data: attachment, error: attachmentError } = await supabase
        .from('service_order_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (attachmentError) {
        // Se falhar ao criar o registro, remover o arquivo do storage
        await supabase.storage
          .from('service-orders')
          .remove([uploadData.path]);
          
        await logSecurityEvent('ATTACHMENT_RECORD_FAILED', {
          serviceOrderId,
          fileName: file.name,
          error: attachmentError.message
        });
        throw new Error(`Erro ao salvar anexo: ${attachmentError.message}`);
      }

      // 9. Finalizar upload
      setUploadProgress(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
      
      // Invalidar cache das queries relacionadas
      await queryClient.invalidateQueries({ 
        queryKey: ['service-order-attachments', serviceOrderId] 
      });
      
      await logSecurityEvent('ATTACHMENT_UPLOADED_SUCCESS', {
        serviceOrderId,
        attachmentId: attachment.id,
        fileName: file.name,
        fileSize: file.size
      });

      toast.success(`Anexo "${file.name}" enviado com sucesso!`);
      
      return attachment;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no upload';
      setError(errorMessage);
      setUploadProgress(prev => prev ? { 
        ...prev, 
        status: 'error', 
        error: errorMessage 
      } : null);
      
      toast.error(`Erro no upload: ${errorMessage}`);
      return null;
      
    } finally {
      setIsUploading(false);
      // Limpar progresso após 3 segundos
      setTimeout(() => setUploadProgress(null), 3000);
    }
  }, [validateFile, queryClient]);

  /**
   * Exclusão segura de anexo
   */
  const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
    try {
      setError(null);

      // 1. Validar ID do anexo
      if (!isValidUUID(attachmentId)) {
        throw new Error('ID do anexo inválido');
      }

      // 2. Buscar dados do anexo
      const { data: attachment, error: fetchError } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (fetchError || !attachment) {
        throw new Error('Anexo não encontrado');
      }

      // 3. Verificar se o usuário tem permissão para deletar
      const { data: serviceOrder, error: serviceOrderError } = await supabase
        .from('service_orders')
        .select('owner_id')
        .eq('id', attachment.service_order_id)
        .single();

      if (serviceOrderError || !serviceOrder) {
        await logSecurityEvent('UNAUTHORIZED_ATTACHMENT_DELETE', {
          attachmentId,
          serviceOrderId: attachment.service_order_id
        });
        throw new Error('Acesso negado para deletar este anexo');
      }

      // 4. Extrair caminho do arquivo da URL
      const url = new URL(attachment.file_url);
      const filePath = url.pathname.split('/').slice(-2).join('/'); // service-order-id/filename

      // 5. Remover arquivo do Storage
      const { error: storageError } = await supabase.storage
        .from('service-orders')
        .remove([filePath]);

      if (storageError) {
        console.warn('Erro ao remover arquivo do storage:', storageError.message);
        // Continuar mesmo com erro no storage
      }

      // 6. Remover registro da tabela
      const { error: deleteError } = await supabase
        .from('service_order_attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        throw new Error(`Erro ao deletar anexo: ${deleteError.message}`);
      }

      // 7. Invalidar cache
      await queryClient.invalidateQueries({ 
        queryKey: ['service-order-attachments', attachment.service_order_id] 
      });
      
      await logSecurityEvent('ATTACHMENT_DELETED_SUCCESS', {
        attachmentId,
        serviceOrderId: attachment.service_order_id,
        fileName: attachment.file_name
      });

      toast.success(`Anexo "${attachment.file_name}" removido com sucesso!`);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na exclusão';
      setError(errorMessage);
      toast.error(`Erro ao deletar anexo: ${errorMessage}`);
      return false;
    }
  }, [queryClient]);

  return {
    uploadAttachment,
    deleteAttachment,
    isUploading,
    uploadProgress,
    error
  };
};

export default useSecureServiceOrderAttachments;