import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

/**
 * Get admin image URL by name
 * Returns a fallback URL if image not found
 */
export const getAdminImageUrl = async (imageName: string, fallbackUrl?: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('admin_images')
      .select('file_url')
      .eq('name', imageName)
      .single();

    if (error || !data) {
      return fallbackUrl || '';
    }

    return data.file_url;
  } catch (error) {
    console.error('Error fetching admin image:', error);
    return fallbackUrl || '';
  }
};

/**
 * React hook to get admin image URL
 * Useful for components that need reactive image URLs
 */
export const useAdminImageUrl = (imageName: string, fallbackUrl?: string) => {
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl || '');

  useEffect(() => {
    getAdminImageUrl(imageName, fallbackUrl).then(setImageUrl);
  }, [imageName, fallbackUrl]);

  return imageUrl;
};

// Common admin image names for easy reference
export const ADMIN_IMAGE_NAMES = {
  SYSTEM_LOGO: 'system-logo',
  LICENSE_ACTIVE: 'license-active-icon',
  LICENSE_EXPIRED: 'license-expired-icon',
  LICENSE_EXPIRING: 'license-expiring-icon',
  HERO_BACKGROUND: 'hero-background',
  PROMOTIONAL_BANNER: 'promotional-banner'
} as const;