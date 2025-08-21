import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDropzone } from 'react-dropzone';
import { useAdminImages } from '@/hooks/useAdminImages';
import { Upload, Trash2, Image as ImageIcon, FileImage, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGE_CATEGORIES = [
  { value: 'system-icons', label: 'Ícones do Sistema' },
  { value: 'logos', label: 'Logos' },
  { value: 'promotional', label: 'Imagens Promocionais' }
];

export const AdminImageManager = () => {
  const { images, isLoading, uploading, uploadImage, deleteImage, getImagesByCategory, isDeleting } = useAdminImages();
  const [selectedCategory, setSelectedCategory] = useState('system-icons');
  const [imageName, setImageName] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1
  });

  const handleUpload = () => {
    if (!selectedFile || !imageName.trim()) return;

    uploadImage({
      file: selectedFile,
      name: imageName.trim(),
      category: selectedCategory,
      description: imageDescription.trim() || undefined
    });

    // Reset form
    setSelectedFile(null);
    setImageName('');
    setImageDescription('');
  };

  const handleDelete = (imageId: string) => {
    if (confirm('Tem certeza que deseja remover esta imagem?')) {
      deleteImage(imageId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Nova Imagem
          </CardTitle>
          <CardDescription>
            Faça upload de imagens para usar no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image-name">Nome da Imagem*</Label>
              <Input
                id="image-name"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="Ex: license-expired-icon"
              />
            </div>
            <div>
              <Label htmlFor="image-category">Categoria*</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="image-description">Descrição</Label>
            <Textarea
              id="image-description"
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              placeholder="Descrição opcional da imagem"
              rows={2}
            />
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileImage className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? "Solte a imagem aqui" : "Clique ou arraste uma imagem aqui"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG, GIF ou WEBP (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !imageName.trim() || uploading}
            className="w-full"
          >
            {uploading ? "Enviando..." : "Enviar Imagem"}
          </Button>
        </CardContent>
      </Card>

      {/* Images Gallery by Category */}
      {IMAGE_CATEGORIES.map((category) => {
        const categoryImages = getImagesByCategory(category.value);
        
        return (
          <Card key={category.value}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{category.label}</span>
                <Badge variant="secondary">{categoryImages.length} imagens</Badge>
              </CardTitle>
              <CardDescription>
                Imagens da categoria {category.label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryImages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma imagem nesta categoria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryImages.map((image) => (
                    <div key={image.id} className="border rounded-lg p-4 space-y-3">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={image.file_url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{image.name}</h4>
                        {image.description && (
                          <p className="text-xs text-muted-foreground">{image.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(image.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                        disabled={isDeleting}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};