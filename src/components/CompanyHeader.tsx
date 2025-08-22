import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useCompanyBranding } from '@/hooks/useCompanyBranding';
import { cn } from '@/lib/utils';

interface CompanyHeaderProps {
  className?: string;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  themeColor?: string;
}

export function CompanyHeader({ 
  className, 
  showActions = true, 
  variant = 'default',
  themeColor = '#3B82F6'
}: CompanyHeaderProps) {
  const { companyInfo, shareSettings, loading } = useCompanyBranding();

  if (loading || !companyInfo || !shareSettings) {
    return null;
  }

  const showLogo = shareSettings.show_logo && companyInfo.logo_url;
  const showName = shareSettings.show_company_name && companyInfo.name;
  const showMessage = shareSettings.custom_message;

  if (!showLogo && !showName && !showMessage) {
    return null;
  }

  const openWhatsApp = () => {
    if (companyInfo.whatsapp_phone) {
      const message = encodeURIComponent('Olá! Gostaria de mais informações.');
      const url = `https://wa.me/${companyInfo.whatsapp_phone}?text=${message}`;
      window.open(url, '_blank');
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'minimal':
        return 'p-2';
      default:
        return 'p-4 md:p-6';
    }
  };

  const getLogoSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-8 h-8';
      case 'minimal':
        return 'w-6 h-6';
      default:
        return 'w-12 h-12';
    }
  };

  const getTitleSize = () => {
    switch (variant) {
      case 'compact':
        return 'text-lg';
      case 'minimal':
        return 'text-base';
      default:
        return 'text-xl md:text-2xl';
    }
  };

  const getMessageSize = () => {
    switch (variant) {
      case 'compact':
      case 'minimal':
        return 'text-xs';
      default:
        return 'text-sm';
    }
  };

  return (
    <div 
      className={cn(
        'bg-white border-b',
        getVariantClasses(),
        className
      )}
      style={{ borderColor: themeColor + '20' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4 flex-1">
            {showLogo && (
              <div className="flex-shrink-0">
                <img
                  src={companyInfo.logo_url!}
                  alt={companyInfo.name || 'Logo da empresa'}
                  className={cn(
                    'object-contain rounded-lg',
                    getLogoSize()
                  )}
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {showName && (
                <h1 
                  className={cn(
                    'font-bold truncate',
                    getTitleSize()
                  )}
                  style={{ color: themeColor }}
                >
                  {companyInfo.name}
                </h1>
              )}
              
              {showMessage && (
                <p className={cn(
                  'text-gray-600 mt-1 line-clamp-2',
                  getMessageSize()
                )}>
                  {shareSettings.custom_message}
                </p>
              )}
              
              {companyInfo.description && variant === 'default' && (
                <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                  {companyInfo.description}
                </p>
              )}
            </div>
          </div>
          
          {showActions && variant !== 'minimal' && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {companyInfo.whatsapp_phone && (
                <Button
                  variant="outline"
                  size={variant === 'compact' ? 'sm' : 'default'}
                  onClick={openWhatsApp}
                  className="hidden sm:flex"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              )}
              

            </div>
          )}
        </div>
        
        {/* Mobile Actions */}
        {showActions && variant !== 'minimal' && (
          <div className="flex sm:hidden mt-3 space-x-2">
            {companyInfo.whatsapp_phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={openWhatsApp}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            )}
            

          </div>
        )}
      </div>
    </div>
  );
}

// Utility component for simple company branding display
export function CompanyBranding({ 
  className,
  size = 'default',
  themeColor = '#3B82F6'
}: {
  className?: string;
  size?: 'small' | 'default' | 'large';
  themeColor?: string;
}) {
  const { companyInfo, shareSettings, loading } = useCompanyBranding();

  if (loading || !companyInfo || !shareSettings) {
    return null;
  }

  const showLogo = shareSettings.show_logo && companyInfo.logo_url;
  const showName = shareSettings.show_company_name && companyInfo.name;

  if (!showLogo && !showName) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'space-x-2',
          logo: 'w-6 h-6',
          text: 'text-sm'
        };
      case 'large':
        return {
          container: 'space-x-4',
          logo: 'w-16 h-16',
          text: 'text-2xl'
        };
      default:
        return {
          container: 'space-x-3',
          logo: 'w-10 h-10',
          text: 'text-lg'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={cn('flex items-center', sizeClasses.container, className)}>
      {showLogo && (
        <img
          src={companyInfo.logo_url!}
          alt={companyInfo.name || 'Logo da empresa'}
          className={cn('object-contain rounded-lg', sizeClasses.logo)}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      
      {showName && (
        <span 
          className={cn('font-bold', sizeClasses.text)}
          style={{ color: themeColor }}
        >
          {companyInfo.name}
        </span>
      )}
    </div>
  );
}

// Hook for getting company branding data
export function useCompanyHeaderData() {
  const { companyInfo, shareSettings, loading } = useCompanyBranding();

  const isVisible = !loading && companyInfo && shareSettings && (
    (shareSettings.show_logo && companyInfo.logo_url) ||
    (shareSettings.show_company_name && companyInfo.name) ||
    shareSettings.custom_message
  );

  return {
    companyInfo,
    shareSettings,
    loading,
    isVisible,
    themeColor: shareSettings?.theme_color || '#3B82F6'
  };
}