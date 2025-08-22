import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanyInfo {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  whatsapp_phone?: string;
  email?: string;
  business_hours?: string;
  description?: string;
  additional_images?: string[];
  created_at: string;
  updated_at: string;
}

export interface CompanyShareSettings {
  id: string;
  welcome_message?: string;
  special_instructions?: string;
  warranty_info?: string;
  show_contact_info?: boolean;
  show_company_description?: boolean;
  show_logo?: boolean;
  show_company_name?: boolean;
  show_whatsapp_button?: boolean;
  custom_message?: string;
  theme_color?: string;
  created_at: string;
  updated_at: string;
}

export function useCompanyBranding() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [shareSettings, setShareSettings] = useState<CompanyShareSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyBranding = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar informações da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Buscar configurações de compartilhamento
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_share_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      setCompanyInfo(companyData || null);
      setShareSettings(settingsData || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar informações da empresa';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyInfo = async (updates: Partial<CompanyInfo>) => {
    try {
      if (!companyInfo) {
        // Criar nova entrada se não existir
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');
        
        const insertData = {
          ...updates,
          owner_id: userData.user.id
        };
        
        const { data, error } = await supabase
          .from('company_info')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        setCompanyInfo(data);
        toast.success('Informações da empresa criadas com sucesso!');
        return data;
      } else {
        // Atualizar entrada existente
        const { data, error } = await supabase
          .from('company_info')
          .update(updates)
          .eq('id', companyInfo.id)
          .select()
          .single();

        if (error) throw error;
        setCompanyInfo(data);
        toast.success('Informações da empresa atualizadas com sucesso!');
        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar informações da empresa';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateShareSettings = async (updates: Partial<CompanyShareSettings>) => {
    try {
      if (!shareSettings) {
        // Criar nova entrada se não existir
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');
        
        const insertData = {
          ...updates,
          owner_id: userData.user.id
        };
        
        const { data, error } = await supabase
          .from('company_share_settings')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        setShareSettings(data);
        toast.success('Configurações de compartilhamento criadas com sucesso!');
        return data;
      } else {
        // Atualizar entrada existente
        const { data, error } = await supabase
          .from('company_share_settings')
          .update(updates)
          .eq('id', shareSettings.id)
          .select()
          .single();

        if (error) throw error;
        setShareSettings(data);
        toast.success('Configurações de compartilhamento atualizadas com sucesso!');
        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações de compartilhamento';
      toast.error(errorMessage);
      throw err;
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `company/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload da logo';
      toast.error(errorMessage);
      throw err;
    }
  };

  const removeLogo = async () => {
    try {
      if (!companyInfo?.logo_url) return;

      // Extrair o caminho do arquivo da URL
      const url = new URL(companyInfo.logo_url);
      const filePath = url.pathname.split('/storage/v1/object/public/public/')[1];

      if (filePath) {
        await supabase.storage
          .from('public')
          .remove([filePath]);
      }

      await updateCompanyInfo({ logo_url: null });
      toast.success('Logo removida com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover logo';
      toast.error(errorMessage);
      throw err;
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Formata como (XX) XXXXX-XXXX para números brasileiros
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  };

  const getWhatsAppLink = (message: string = ''): string => {
    if (!companyInfo?.whatsapp_phone) return '';
    
    const phone = companyInfo.whatsapp_phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/55${phone}?text=${encodedMessage}`;
  };

  useEffect(() => {
    fetchCompanyBranding();
  }, []);

  return {
    companyInfo,
    shareSettings,
    loading,
    error,
    fetchCompanyBranding,
    refreshData: fetchCompanyBranding,
    createCompanyInfo: updateCompanyInfo,
    updateCompanyInfo,
    createShareSettings: updateShareSettings,
    updateShareSettings,
    uploadLogo,
    removeLogo,
    formatPhoneNumber,
    generateWhatsAppLink: getWhatsAppLink
  };
}