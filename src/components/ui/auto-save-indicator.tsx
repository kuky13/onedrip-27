/**
 * Componente Indicador de Auto-Save
 * Sistema Oliver Blueberry - Feedback Visual UX
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Save, AlertCircle, Clock } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: Error | null;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  error,
  className
}) => {
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertCircle,
        text: 'Erro ao salvar',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
    
    if (isSaving) {
      return {
        icon: Save,
        text: 'Salvando...',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        icon: Clock,
        text: 'Alterações não salvas',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
    
    if (lastSaved) {
      return {
        icon: Check,
        text: `Salvo ${formatLastSaved(lastSaved)}`,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
    
    return {
      icon: Clock,
      text: 'Não salvo',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'agora';
    } else if (diffInMinutes < 60) {
      return `há ${diffInMinutes}min`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `há ${diffInHours}h`;
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
        statusInfo.bgColor,
        statusInfo.borderColor,
        statusInfo.color,
        className
      )}
    >
      <Icon 
        className={cn(
          'h-3 w-3',
          isSaving && 'animate-spin'
        )} 
      />
      <span>{statusInfo.text}</span>
    </div>
  );
};

/**
 * Versão compacta do indicador para uso em headers
 */
export const AutoSaveIndicatorCompact: React.FC<AutoSaveIndicatorProps> = (props) => {
  const { isSaving, hasUnsavedChanges, error } = props;
  
  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">Erro</span>
      </div>
    );
  }
  
  if (isSaving) {
    return (
      <div className="flex items-center gap-1 text-blue-500">
        <Save className="h-4 w-4 animate-spin" />
        <span className="text-xs">Salvando</span>
      </div>
    );
  }
  
  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-1 text-orange-500">
        <Clock className="h-4 w-4" />
        <span className="text-xs">Não salvo</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 text-green-500">
      <Check className="h-4 w-4" />
      <span className="text-xs">Salvo</span>
    </div>
  );
};

/**
 * Hook para usar o indicador com estado local
 */
export const useAutoSaveIndicator = () => {
  const [state, setState] = React.useState({
    isSaving: false,
    lastSaved: null as Date | null,
    hasUnsavedChanges: false,
    error: null as Error | null
  });

  const updateState = React.useCallback((newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  const markAsSaving = React.useCallback(() => {
    updateState({ isSaving: true, error: null });
  }, [updateState]);

  const markAsSaved = React.useCallback(() => {
    updateState({ 
      isSaving: false, 
      lastSaved: new Date(), 
      hasUnsavedChanges: false,
      error: null 
    });
  }, [updateState]);

  const markAsUnsaved = React.useCallback(() => {
    updateState({ hasUnsavedChanges: true });
  }, [updateState]);

  const markAsError = React.useCallback((error: Error) => {
    updateState({ isSaving: false, error });
  }, [updateState]);

  return {
    ...state,
    markAsSaving,
    markAsSaved,
    markAsUnsaved,
    markAsError
  };
};