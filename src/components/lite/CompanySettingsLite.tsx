import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save } from 'lucide-react';
import { useShopProfile } from '@/hooks/useShopProfile';
import { LogoUploadZone } from '@/components/logo/LogoUploadZone';

interface CompanySettingsLiteProps {
  userId: string;
  profile: any;
}

export const CompanySettingsLite = ({ userId, profile }: CompanySettingsLiteProps) => {
  const { 
    shopProfile, 
    isLoading, 
    saveProfile, 
    isSaving, 
    uploadLogo, 
    isUploadingLogo, 
    removeLogo 
  } = useShopProfile();

  const [formData, setFormData] = useState({
    shop_name: '',
    cnpj: '',
    address: '',
    contact_phone: '',
  });

  useEffect(() => {
    if (shopProfile) {
      setFormData({
        shop_name: shopProfile.shop_name || '',
        cnpj: shopProfile.cnpj || '',
        address: shopProfile.address || '',
        contact_phone: shopProfile.contact_phone || '',
      });
    }
  }, [shopProfile]);

  const handleSave = () => {
    saveProfile(formData);
  };

  const handleLogoUpload = (file: File) => {
    uploadLogo(file);
  };

  const handleRemoveLogo = () => {
    removeLogo();
  };

  const formatCNPJ = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length <= 14) {
      return numeric.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
    }
    return numeric.substring(0, 14).replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Building2 className="h-5 w-5 mr-2 text-primary" />
          Informações da Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Section */}
        <div className="space-y-2">
          <Label>Logo da Empresa</Label>
          <LogoUploadZone
            currentLogoUrl={shopProfile?.logo_url}
            onUpload={handleLogoUpload}
            onRemove={handleRemoveLogo}
            isUploading={isUploadingLogo}
            isRemoving={false}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop_name">Nome da Empresa</Label>
          <Input
            id="shop_name"
            type="text"
            value={formData.shop_name}
            onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
            placeholder="Nome da sua empresa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            type="text"
            value={formData.cnpj}
            onChange={(e) => handleCNPJChange(e.target.value)}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Endereço completo da empresa"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Telefone de Contato</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Salvando...' : 'Salvar Informações'}
        </Button>
      </CardContent>
    </Card>
  );
};