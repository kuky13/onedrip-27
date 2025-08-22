import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Image, Upload, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface LogoUploadZoneProps {
  currentLogoUrl?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
  isRemoving: boolean;
  className?: string;
}
export const LogoUploadZone: React.FC<LogoUploadZoneProps> = ({
  currentLogoUrl,
  onUpload,
  onRemove,
  isUploading,
  isRemoving,
  className
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validateFile = useCallback((file: File): string | null => {
    // Validar tamanho (3MB máximo)
    if (file.size > 3 * 1024 * 1024) {
      return 'Arquivo muito grande. Máximo 3MB permitido.';
    }

    // Validar tipo com mensagem mais clara
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não aceito. Este sistema não aceita arquivos do tipo "${file.type}". Use apenas PNG, JPEG, WebP ou GIF.`;
    }

    // Validar se o arquivo não está corrompido
    if (file.size === 0) {
      return 'Arquivo parece estar corrompido ou vazio.';
    }

    // Validar nome do arquivo
    if (file.name.length > 100) {
      return 'Nome do arquivo muito longo. Use um nome mais curto.';
    }
    return null;
  }, []);
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      img.onload = () => {
        // Calcular dimensões mantendo proporção (máximo 512x512)
        const maxSize = 512;
        let {
          width,
          height
        } = img;
        if (width > height) {
          if (width > maxSize) {
            height = height * maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;

        // Desenhar e comprimir
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.8 // 80% de qualidade
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validar arquivo
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);

    // Criar preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Simular progresso de upload
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);
    try {
      // Comprimir imagem se necessário
      const processedFile = file.size > 1024 * 1024 ? await compressImage(file) : file;

      // Upload
      onUpload(processedFile);

      // Completar progresso
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setValidationError('Erro ao processar imagem. Tente novamente.');
    }
  }, [onUpload, validateFile, compressImage, previewUrl]);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false,
    disabled: isUploading || isRemoving
  });
  const hasLogo = currentLogoUrl || previewUrl;
  return <div className={cn("space-y-4", className)}>
      <Card {...getRootProps()} className={cn("relative overflow-hidden transition-all duration-200 cursor-pointer", "border-2 border-dashed hover:border-primary/50", isDragActive && "border-primary bg-primary/5", isDragReject && "border-destructive bg-destructive/5", (isUploading || isRemoving) && "cursor-not-allowed opacity-60", hasLogo ? "aspect-square max-w-48" : "aspect-video max-w-sm")}>
        <input {...getInputProps()} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {hasLogo ? <div className="relative w-full h-full">
              <img src={previewUrl || currentLogoUrl} alt="Logo preview" className="w-full h-full object-contain rounded-lg" />
              
              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={e => {
                e.stopPropagation();
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }} disabled={isUploading || isRemoving}>
                    <Upload className="h-4 w-4" />
                  </Button>
                  {currentLogoUrl && <Button size="sm" variant="destructive" onClick={e => {
                e.stopPropagation();
                onRemove();
              }} disabled={isUploading || isRemoving}>
                      <X className="h-4 w-4" />
                    </Button>}
                </div>
              </div>

              {/* Indicador de estado */}
              {(isUploading || isRemoving) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-sm font-medium">
                    {isUploading ? 'Enviando...' : 'Removendo...'}
                  </div>
                </div>}
            </div> : <Button variant="outline" size="sm" disabled={isUploading || isRemoving} className="h-8 px-3 text-xs">
              <Upload className="h-3 w-3 mr-1" />
              {isDragActive ? 'Solte aqui' : 'Logo'}
            </Button>}
        </div>

        {/* Barra de progresso */}
        {uploadProgress > 0 && uploadProgress < 100 && <div className="absolute bottom-4 left-4 right-4">
            <Progress value={uploadProgress} className="h-2" />
          </div>}

        {/* Indicador de sucesso */}
        {uploadProgress === 100 && <div className="absolute top-4 right-4">
            <div className="bg-green-500 text-white p-1 rounded-full">
              <Check className="h-4 w-4" />
            </div>
          </div>}
      </Card>

      {/* Informações e erros */}
      <div className="space-y-2">
        {validationError && <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {validationError}
          </div>}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Formatos aceitos:</strong> PNG, JPEG, WebP, GIF</p>
          
          <p>• <strong>Recomendado:</strong> 512x512px ou maior para melhor qualidade</p>
          
          
        </div>
      </div>
    </div>;
};