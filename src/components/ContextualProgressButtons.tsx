import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Settings, 
  Send, 
  Archive, 
  RotateCcw, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Heart, 
  ThumbsUp, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Info, 
  Truck, 
  Users,
  Package,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextualActions } from '@/hooks/useContextualActions';
import { toast } from 'sonner';

interface ServiceOrder {
  id: string;
  status: string;
  [key: string]: any;
}

interface ContextualAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  nextStatus: string;
  description?: string;
  requiresConfirmation?: boolean;
  variant?: 'default' | 'destructive' | 'secondary';
}

interface ContextualProgressButtonsProps {
  serviceOrder: ServiceOrder;
  onStatusUpdate?: (newStatus: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

// Estados de loading individuais por botão
type LoadingActions = Set<string>;

// Estado para confirmação de ações críticas
type ConfirmAction = ContextualAction | null;

// Mapeamento centralizado de ícones
const iconMap: Record<string, React.ComponentType<any>> = {
  // Ícones básicos
  'play': Play,
  'pause': Pause,
  'clock': Clock,
  'archive': Archive,
  'check': CheckCircle,
  'circle': Clock,
  'package': Package,
  
  // Ícones com hífens (formato do hook)
  'play-circle': PlayCircle,
  'pause-circle': PauseCircle,
  'check-circle': CheckCircle,
  'package-check': Truck,
  'rotate-ccw': RotateCcw,
  'x-circle': XCircle,
  'user-clock': User,
  
  // Ícones sem hífens (formato alternativo)
  'playcircle': PlayCircle,
  'pausecircle': PauseCircle,
  'checkcircle': CheckCircle,
  'packagecheck': Truck,
  'rotateccw': RotateCcw,
  'xcircle': XCircle,
  'userclock': User,
  
  // Outros ícones
  'alertcircle': AlertCircle,
  'settings': Settings,
  'send': Send,
  'filetext': FileText,
  'user': User,
  'calendar': Calendar,
  'mappin': MapPin,
  'phone': Phone,
  'mail': Mail,
  'star': Star,
  'heart': Heart,
  'thumbsup': ThumbsUp,
  'eye': Eye,
  'edit': Edit,
  'trash2': Trash2,
  'plus': Plus,
  'minus': Minus,
  'arrowright': ArrowRight,
  'arrowleft': ArrowLeft,
  'arrowup': ArrowUp,
  'arrowdown': ArrowDown,
  'x': X,
  'info': Info,
  'warning': AlertCircle,
  'error': XCircle,
  'success': CheckCircle
};

// Ações críticas que requerem confirmação
const criticalActions = ['archive', 'delete', 'cancel'];

// Atalhos de teclado
const keyboardShortcuts: Record<string, string> = {
  'start': 'Ctrl+S',
  'pause': 'Ctrl+P',
  'complete': 'Ctrl+Enter',
  'archive': 'Ctrl+A',
  'delete': 'Delete'
};

export const ContextualProgressButtons = React.memo<ContextualProgressButtonsProps>(function ContextualProgressButtons({
  serviceOrder,
  onStatusUpdate,
  className,
  size = 'md',
  variant = 'default'
}) {
  const {
    loading: globalLoading,
    getAvailableActions,
    executeAction,
    canExecuteAction
  } = useContextualActions();

  // Estados locais
  const [loadingActions, setLoadingActions] = React.useState<LoadingActions>(new Set());
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction>(null);
  const [successStates, setSuccessStates] = React.useState<Record<string, boolean>>({});
  const [hoveredAction, setHoveredAction] = React.useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  const availableActions = getAvailableActions(serviceOrder.status);

  // Função para executar ação com loading individual
  const executeActionWithLoading = async (action: ContextualAction) => {
    setLoadingActions(prev => new Set(prev).add(action.id));
    try {
      const success = await executeAction(serviceOrder.id, action);
      if (success && onStatusUpdate) {
        onStatusUpdate(action.nextStatus);
        toast.success(`Ação "${action.label}" executada com sucesso!`);
      }
      return success;
    } catch (error) {
      toast.error(`Erro ao executar ação "${action.label}"`);
      return false;
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
    }
  };

  // Handler principal para ações
  const handleAction = async (action: ContextualAction) => {
    if (action.requiresConfirmation || criticalActions.includes(action.id)) {
      setConfirmAction(action);
      return;
    }

    if (!serviceOrder.id) {
      toast.error('ID da ordem de serviço não encontrado');
      return;
    }

    setLoadingActions(prev => new Set(prev).add(action.id));
    
    try {
      const success = await executeAction(serviceOrder.id, action);
      if (success) {
        // Feedback visual de sucesso
        if (onStatusUpdate) {
          onStatusUpdate(action.nextStatus);
        }
        toast.success(`Ação "${action.label}" executada com sucesso!`);
        
        // Show success state
        setSuccessStates(prev => ({ ...prev, [action.id]: true }));
        setTimeout(() => {
          setSuccessStates(prev => ({ ...prev, [action.id]: false }));
        }, 2000);
      } else {
        // O erro já foi tratado no executeAction, apenas log adicional se necessário
        console.warn(`Ação ${action.label} não foi executada com sucesso`);
      }
    } catch (error) {
      // Fallback para erros não capturados
      console.error('Erro inesperado ao executar ação:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
    }
  };

  // Handler para confirmar ação crítica
  const handleConfirmAction = async () => {
    if (confirmAction) {
      await executeActionWithLoading(confirmAction);
      setConfirmAction(null);
    }
  };

  // Handler para cancelar ação crítica
  const handleCancelAction = () => {
    setConfirmAction(null);
  };

  // Handlers para tooltip
  const handleMouseEnter = (action: ContextualAction, event: React.MouseEvent) => {
    setHoveredAction(action.id);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredAction(null);
  };

  if (availableActions.length === 0) {
    return null;
  }

  const buttonSizeClasses = {
    sm: 'h-10 px-4 text-sm min-w-[4rem] sm:min-w-[5rem]',
    md: 'h-12 px-6 text-base min-w-[5rem] sm:min-w-[6rem]',
    lg: 'h-14 px-8 text-lg min-w-[6rem] sm:min-w-[8rem]'
  };

  const containerClasses = {
    default: 'flex flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg',
    compact: 'flex gap-2 sm:gap-3 p-2'
  };

  return (
    <>
      <div className={cn(containerClasses[variant], className)}>
        {availableActions.map((action) => {
          // Tentar múltiplos formatos de ícone para garantir compatibilidade
          const iconKey = action.icon.toLowerCase();
          const Icon = iconMap[iconKey] || 
                      iconMap[iconKey.replace('-', '')] || 
                      iconMap[iconKey.replace(/[^a-z]/g, '')] || 
                      CheckCircle;
          const isLoading = globalLoading || loadingActions.has(action.id);
          const shortcut = keyboardShortcuts[action.id];
          
          return (
            <Button
              key={action.id}
              onClick={() => handleAction(action)}
              onMouseEnter={(e) => handleMouseEnter(action, e)}
              onMouseLeave={handleMouseLeave}
              disabled={globalLoading || isLoading}
              className={cn(
                buttonSizeClasses[size],
                action.color.includes('red') || action.color.includes('destructive')
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-500 shadow-lg hover:shadow-red-500/30' 
                  : action.color.includes('blue') || action.color.includes('secondary')
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-500 shadow-lg hover:shadow-blue-500/30'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-500 shadow-lg hover:shadow-green-500/30',
                'relative overflow-hidden',
                'text-white font-semibold',
                'transition-all duration-300 ease-out',
                'hover:scale-110 hover:shadow-xl hover:-translate-y-1',
                'active:scale-95 active:translate-y-0',
                'focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-sm',
                'before:absolute before:inset-0 before:bg-white before:opacity-0',
                'before:transition-opacity before:duration-300',
                'hover:before:opacity-10',
                'rounded-lg border-2 border-white/20',
                'backdrop-blur-sm'
              )}
              title={`${action.label}: ${action.description || 'Executar ação'}${shortcut ? ` (${shortcut})` : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs opacity-90">Processando...</span>
                </div>
              ) : successStates[action.id] ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-medium">Sucesso!</span>
                </div>
              ) : (
                <>
                  {Icon && <Icon className={cn(
                    variant === 'compact' ? 'w-5 h-5' : 'w-5 h-5 mr-3',
                    'drop-shadow-sm'
                  )} />}
                  {variant === 'default' && (
                    <span className="font-semibold tracking-wide">{action.label}</span>
                  )}
                  {variant === 'compact' && (
                    <span className="sr-only">{action.label}</span>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </div>

      {/* Tooltip avançado e melhorado */}
      {hoveredAction && (
        <div 
          className="fixed z-50 px-4 py-3 text-sm bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-100 text-white dark:text-black rounded-lg shadow-2xl backdrop-blur-md pointer-events-none border border-white/20 dark:border-black/20 max-w-xs"
          style={{
            left: Math.min(tooltipPosition.x + 15, window.innerWidth - 300),
            top: tooltipPosition.y - 60
          }}
        >
          <div className="font-semibold mb-1">
            {availableActions.find(a => a.id === hoveredAction)?.label}
          </div>
          <div className="text-xs opacity-90 leading-relaxed">
            {availableActions.find(a => a.id === hoveredAction)?.description || 'Executar ação'}
          </div>
          {keyboardShortcuts[hoveredAction] && (
            <div className="mt-2 pt-2 border-t border-white/20 dark:border-black/20">
              <span className="text-xs font-mono bg-white/20 dark:bg-black/20 px-2 py-1 rounded">
                {keyboardShortcuts[hoveredAction]}
              </span>
            </div>
          )}
          {/* Seta do tooltip */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-white"></div>
        </div>
      )}

      {/* Diálogo de confirmação para ações críticas */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl dark:shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirmar Ação
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tem certeza que deseja executar a ação "{confirmAction.label}"?
              {confirmAction.description && (
                <span className="block text-sm mt-1 text-gray-500 dark:text-gray-400">
                  {confirmAction.description}
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancelAction}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                className={cn(
                  confirmAction.color,
                  'text-white focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400'
                )}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ContextualProgressButtons.displayName = 'ContextualProgressButtons';

// Componente para exibir o status atual com indicador visual
interface StatusIndicatorProps {
  status: string;
  className?: string;
  showText?: boolean;
}

export const StatusIndicator = React.memo<StatusIndicatorProps>(function StatusIndicator({ 
  status, 
  className, 
  showText = true 
}) {
  const { getStatusColor, getStatusIcon, getStatusText } = useContextualActions();
  
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status);
  
  // Tentar múltiplos formatos de ícone para garantir compatibilidade
  const iconKey = statusIcon?.toLowerCase() || 'clock';
  const Icon = iconMap[iconKey] || 
              iconMap[iconKey.replace('-', '')] || 
              iconMap[iconKey.replace(/[^a-z]/g, '')] || 
              Clock;
  
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
      'transition-all duration-200',
      statusColor,
      className
    )}>
      <Icon className="w-4 h-4" />
      {showText && (
        <span className="text-white">{statusText}</span>
      )}
    </div>
  );
});

StatusIndicator.displayName = 'StatusIndicator';

// Componente para exibir timeline de status
interface StatusTimelineProps {
  currentStatus: string;
  className?: string;
}

const defaultStatuses = [
  { id: 'opened', label: 'Aberto', icon: 'clock', color: 'bg-yellow-500' },
  { id: 'in_progress', label: 'Em Andamento', icon: 'play', color: 'bg-blue-500' },
  { id: 'completed', label: 'Concluído', icon: 'checkcircle', color: 'bg-green-500' },
  { id: 'delivered', label: 'Entregue', icon: 'check', color: 'bg-emerald-500' }
];

export const StatusTimeline = React.memo<StatusTimelineProps>(function StatusTimeline({ 
  currentStatus, 
  className 
}) {
  const { getStatusColor, getStatusIcon, getStatusText } = useContextualActions();
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {defaultStatuses.map((status, index) => {
        const iconKey = getStatusIcon(status.id)?.toLowerCase() || status.icon;
        const Icon = iconMap[iconKey] || 
                    iconMap[iconKey.replace('-', '')] || 
                    iconMap[iconKey.replace(/[^a-z]/g, '')] || 
                    Clock;
        const isActive = status.id === currentStatus;
        const isPast = defaultStatuses.findIndex(s => s.id === currentStatus) > index;
        const statusColor = getStatusColor(status.id);
        const statusText = getStatusText(status.id);
        
        return (
          <React.Fragment key={status.id}>
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
              isActive ? statusColor + ' text-white shadow-md' : 
              isPast ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
              'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            )}>
              <Icon className="w-4 h-4" />
              <span>{statusText}</span>
            </div>
            {index < defaultStatuses.length - 1 && (
              <ArrowRight className={cn(
                'w-4 h-4 transition-colors duration-200',
                isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

StatusTimeline.displayName = 'StatusTimeline';

export default ContextualProgressButtons;