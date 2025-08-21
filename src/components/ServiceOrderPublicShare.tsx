import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Clock, CheckCircle, Calendar, User, Phone, Building2, Share2, Download, ExternalLink, MapPin, Globe, Mail, Package, Wrench, Truck, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCompanyBranding } from '@/hooks/useCompanyBranding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface ServiceOrderData {
  id: string;
  formatted_id: string;
  device_type: string;
  device_model: string;
  reported_issue: string;
  status: string;
  created_at: string;
  updated_at: string;
}
interface CompanyData {
  name: string;
  logo_url: string | null;
  address: string | null;
  whatsapp_phone: string | null;
  description: string | null;
  email: string | null;
  website: string | null;
}
const statusConfig = {
  opened: {
    label: 'Aberto',
    color: '#EF4444',
    icon: Package,
    description: 'Ordem de serviço criada e aguardando início do atendimento',
    step: 1
  },
  in_progress: {
    label: 'Em Andamento',
    color: '#F59E0B',
    icon: Wrench,
    description: 'Técnico trabalhando no reparo do equipamento',
    step: 2
  },
  completed: {
    label: 'Concluído',
    color: '#10B981',
    icon: CheckCircle,
    description: 'Reparo finalizado, equipamento pronto para retirada',
    step: 3
  },
  delivered: {
    label: 'Entregue',
    color: '#3B82F6',
    icon: Truck,
    description: 'Equipamento entregue ao cliente',
    step: 4
  },
  archived: {
    label: 'Arquivado',
    color: '#6B7280',
    icon: Archive,
    description: 'Ordem de serviço arquivada',
    step: 5
  }
};
const statusOrder = ['opened', 'in_progress', 'completed', 'delivered'];

// Componente StatusTimeline
interface StatusTimelineProps {
  currentStatus: string;
  themeColor: string;
  createdAt: string;
  updatedAt: string;
}
function StatusTimeline({
  currentStatus,
  themeColor,
  createdAt,
  updatedAt
}: StatusTimelineProps) {
  const currentStatusInfo = getStatusInfo(currentStatus);
  const currentStep = currentStatusInfo.step;
  const progressPercentage = currentStep === 0 ? 0 : currentStep / 4 * 100;
  const getTimeElapsed = () => {
    const now = new Date();
    const created = new Date(createdAt);
    const days = differenceInDays(now, created);
    const hours = differenceInHours(now, created) % 24;
    const minutes = differenceInMinutes(now, created) % 60;
    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''} e ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h e ${minutes}min`;
    } else {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  };
  const getEstimatedCompletion = () => {
    if (currentStatus === 'delivered') return 'Concluído';
    if (currentStatus === 'delivered') return 'Concluído';
    const avgDays = {
      opened: 2,
      in_progress: 1,
      completed: 0.5
    };
    const daysToAdd = avgDays[currentStatus as keyof typeof avgDays] || 1;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    return format(estimatedDate, 'dd/MM/yyyy', {
      locale: ptBR
    });
  };
  return <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Progresso</span>
          <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2 transition-all duration-500 ease-in-out" style={{
        '--progress-background': themeColor
      } as React.CSSProperties} />
      </div>

      {/* Timeline Steps */}
      <div className="space-y-4">
        {statusOrder.map((status, index) => {
        const statusInfo = getStatusInfo(status);
        const isActive = status === currentStatus;
        const isCompleted = statusInfo.step <= currentStep && currentStep > 0;
        const StatusIcon = statusInfo.icon;
        return <TooltipProvider key={status}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 cursor-pointer", isActive && "ring-2 ring-offset-2 shadow-md", isCompleted ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/50")} style={{
                backgroundColor: isActive ? `${themeColor}10` : undefined
              }}>
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300", isCompleted || isActive ? "text-white" : "text-muted-foreground")} style={{
                  backgroundColor: isCompleted || isActive ? statusInfo.color : '#E5E7EB'
                }}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-medium transition-colors duration-300", isActive ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground")}>
                        {statusInfo.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {statusInfo.description}
                      </p>
                    </div>
                    {isActive && <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{
                    backgroundColor: statusInfo.color
                  }} />
                        <span className="text-sm font-medium" style={{
                    color: statusInfo.color
                  }}>
                          Atual
                        </span>
                      </div>}
                    {isCompleted && !isActive && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusInfo.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>;
      })}
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Tempo Decorrido</p>
          <p className="font-semibold text-foreground">{getTimeElapsed()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Previsão</p>
          <p className="font-semibold text-foreground">{getEstimatedCompletion()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
          <p className="font-semibold text-foreground">
            {format(new Date(updatedAt), 'dd/MM HH:mm', {
            locale: ptBR
          })}
          </p>
        </div>
      </div>
    </div>;
}
function getStatusInfo(status: string) {
  return statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: '#6B7280',
    icon: AlertCircle,
    description: 'Status desconhecido',
    step: 0
  };
}
export function ServiceOrderPublicShare() {
  const {
    shareToken: token
  } = useParams<{
    shareToken: string;
  }>();
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Hook para configurações de branding
  const {
    companyInfo: brandingInfo,
    shareSettings
  } = useCompanyBranding();
  const loadData = async () => {
    if (!token || hasLoaded) {
      console.log('🚫 Carregamento bloqueado - Token:', !!token, 'HasLoaded:', hasLoaded);
      return;
    }
    console.log('🚀 Iniciando carregamento para token:', token);
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Carregando dados para token:', token);

      // Carregar dados da ordem de serviço
      const {
        data: serviceOrderData,
        error: serviceOrderError
      } = await supabase.rpc('get_service_order_by_share_token', {
        p_share_token: token
      });
      if (serviceOrderError) {
        console.error('❌ Erro ao buscar ordem de serviço:', serviceOrderError);
        throw new Error(serviceOrderError.message);
      }
      if (!serviceOrderData || serviceOrderData.length === 0) {
        console.log('❌ Nenhum dado retornado para o token');
        throw new Error('Token de compartilhamento inválido ou expirado');
      }
      console.log('📋 Ordem de serviço encontrada:', serviceOrderData[0]);
      setServiceOrder(serviceOrderData[0]);

      // Carregar informações da empresa
      const {
        data: companyData,
        error: companyError
      } = await supabase.rpc('get_company_info_by_share_token', {
        p_share_token: token
      });
      if (!companyError && companyData && companyData.length > 0) {
        console.log('🏢 Informações da empresa carregadas:', companyData[0]);
        const data = companyData[0];
        setCompanyInfo({
          name: data.name,
          logo_url: data.logo_url,
          address: data.address,
          whatsapp_phone: data.whatsapp_phone,
          description: null,
          email: null,
          website: null
        });
      } else {
        console.log('⚠️ Informações da empresa não encontradas');
      }
      console.log('✅ Dados carregados com sucesso');
    } catch (err) {
      console.error('💥 Erro ao carregar dados:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setHasLoaded(true);
      console.log('🏁 Carregamento finalizado - HasLoaded definido como true');
    }
  };
  useEffect(() => {
    if (token && !hasLoaded) {
      loadData();
    }
  }, [token, hasLoaded]);
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  const handleShare = async () => {
    if (navigator.share && serviceOrder) {
      try {
        await navigator.share({
          title: `Ordem de Serviço ${serviceOrder.formatted_id}`,
          text: `Acompanhe o status do reparo: ${serviceOrder.device_type} ${serviceOrder.device_model}`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback para copiar
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };
  const handleWhatsAppContact = () => {
    if (companyInfo?.whatsapp_phone && serviceOrder) {
      const message = `Olá! Gostaria de saber sobre a ordem de serviço ${serviceOrder.formatted_id} (${serviceOrder.device_model})`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/55${companyInfo.whatsapp_phone.replace(/\D/g, '')}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Usa configurações de branding se disponíveis, senão usa dados da empresa
  const themeColor = shareSettings?.theme_color || '#3B82F6';
  const showLogo = shareSettings?.show_logo ?? true;
  const showCompanyName = shareSettings?.show_company_name ?? true;
  const showWhatsAppButton = shareSettings?.show_whatsapp_button ?? true;
  const customMessage = shareSettings?.custom_message;
  const finalCompanyInfo = brandingInfo || companyInfo;
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{
          borderColor: themeColor
        }}></div>
          <p className="text-muted-foreground">Carregando ordem de serviço...</p>
        </div>
      </div>;
  }
  if (error || !serviceOrder) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Erro</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Ordem de serviço não encontrada'}
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  const statusInfo = getStatusInfo(serviceOrder.status);
  const StatusIcon = statusInfo.icon;
  return <div className="min-h-screen bg-background">
      {/* Company Header */}
      {(showLogo || showCompanyName) && finalCompanyInfo && <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center space-x-4">
              {showLogo && finalCompanyInfo.logo_url && <div className="flex-shrink-0">
                  <img src={finalCompanyInfo.logo_url} alt={finalCompanyInfo.name} className="w-16 h-16 object-contain rounded-lg" />
                </div>}
              
              <div className="flex-1">
                {showCompanyName && finalCompanyInfo.name && <h1 className="text-2xl font-bold mb-1" style={{
              color: themeColor
            }}>
                    {finalCompanyInfo.name}
                  </h1>}
                
                {customMessage ? <p className="text-muted-foreground">
                    {customMessage}
                  </p> : <p className="text-muted-foreground">
                    Acompanhe o status do seu reparo
                  </p>}
              </div>
            </div>
          </div>
        </div>}

      <div className="max-w-4xl mx-auto p-6">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl" style={{
            backgroundColor: themeColor + '20'
          }}>
              <Building2 className="w-6 h-6" style={{
              color: themeColor
            }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {serviceOrder.formatted_id}
              </h1>
              <p className="text-muted-foreground">
                Ordem de Serviço
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            
            
            
            {showWhatsAppButton && finalCompanyInfo?.whatsapp_phone && <Button onClick={handleWhatsAppContact} style={{
            backgroundColor: themeColor
          }} className="text-white hover:opacity-90">
                <Phone className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Timeline - Full Width */}
          <Card className="lg:col-span-3 border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-foreground">Status e Progresso</span>
                <Badge className="text-white transition-all duration-300 hover:scale-105" style={{
                backgroundColor: statusInfo.color,
                boxShadow: `0 4px 12px ${statusInfo.color}30`
              }}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {statusInfo.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={serviceOrder.status} themeColor={themeColor} createdAt={serviceOrder.created_at} updatedAt={serviceOrder.updated_at} />
            </CardContent>
          </Card>

          {/* Quick Info Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${themeColor}20`
                }}>
                    <Calendar className="w-5 h-5" style={{
                    color: themeColor
                  }} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-semibold text-foreground">{formatDateTime(serviceOrder.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${statusInfo.color}20`
                }}>
                    <StatusIcon className="w-5 h-5" style={{
                    color: statusInfo.color
                  }} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status Atual</p>
                    <p className="font-semibold text-foreground">{statusInfo.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${themeColor}20`
                }}>
                    <Clock className="w-5 h-5" style={{
                    color: themeColor
                  }} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="font-semibold text-foreground">{formatDateTime(serviceOrder.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Details */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Detalhes do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                
                
              </div>
              
              
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Modelo</p>
                <p className="font-semibold text-foreground">{serviceOrder.device_model}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Problema Relatado</p>
                <p className="text-foreground leading-relaxed">{serviceOrder.reported_issue}</p>
              </div>
            </CardContent>
          </Card>

          {/* Company Contact Info */}
          {finalCompanyInfo && <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Building2 className="w-5 h-5" />
                  <span>Contato</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                  <p className="font-semibold text-foreground">{finalCompanyInfo.name}</p>
                </div>
                
                {finalCompanyInfo.whatsapp_phone && <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        WhatsApp
                      </p>
                      <Button variant="outline" size="sm" onClick={handleWhatsAppContact} className="w-full justify-start">
                        {finalCompanyInfo.whatsapp_phone}
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  </>}
                
                {finalCompanyInfo.address && <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Endereço
                      </p>
                      <p className="text-sm text-foreground">{finalCompanyInfo.address}</p>
                    </div>
                  </>}
                
                {finalCompanyInfo.description && <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                      <p className="text-sm text-foreground">{finalCompanyInfo.description}</p>
                    </div>
                  </>}
                
              </CardContent>
            </Card>}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          
          {finalCompanyInfo?.name && <p className="text-sm text-muted-foreground mt-1">
              © {new Date().getFullYear()} {finalCompanyInfo.name}
            </p>}
        </div>
      </div>
    </div>;
}