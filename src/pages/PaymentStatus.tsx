import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, RefreshCw, Home, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QRCodeDisplay } from '@/components/pix';
import { useTransactionStatus } from '@/hooks/useTransactionStatus';
import { auditService } from '@/services/auditService';
import type { PixTransaction } from '../../shared/types/pix';

interface PaymentStatusProps {
  className?: string;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ className }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState<PixTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(100);
  
  const { 
    getTransactionStatus, 
    checkWithMercadoPago, 
    startMonitoring, 
    stopMonitoring,
    calculateTimeLeft 
  } = useTransactionStatus();

  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) {
        navigate('/plans');
        return;
      }

      try {
        const txn = await getTransactionStatus(transactionId);
        if (txn) {
          setTransaction(txn);
          
          // Se o pagamento já foi confirmado, redirecionar para página de sucesso
          if (txn.status === 'paid') {
            navigate(`/payment-success?transactionId=${transactionId}`);
            return;
          }
          
          // Se expirado ou cancelado, parar aqui
          if (txn.status === 'expired' || txn.status === 'cancelled') {
            setLoading(false);
            return;
          }
          
          // Iniciar monitoramento para transações pendentes
          if (txn.status === 'pending') {
            startMonitoring(transactionId, {
              onStatusChange: (newStatus) => {
                setTransaction(prev => prev ? { ...prev, status: newStatus } : null);
                if (newStatus === 'paid') {
                  navigate(`/payment-success?transactionId=${transactionId}`);
                }
              },
              onTimeUpdate: (remaining) => {
                setTimeLeft(remaining);
                // Calcular progresso (assumindo 15 minutos = 900 segundos)
                const totalTime = 15 * 60; // 15 minutos em segundos
                const progressPercent = (remaining / totalTime) * 100;
                setProgress(Math.max(0, progressPercent));
              }
            });
          }
          
          // Log do acesso à página de status
          await auditService.logPixEvent({
            transactionId,
            event: 'status_page_viewed',
            details: {
              status: txn.status,
              planType: txn.planData.type,
              isVip: txn.planData.isVip
            }
          });
        } else {
          navigate('/plans');
        }
      } catch (error) {
        console.error('Erro ao carregar transação:', error);
        navigate('/plans');
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();

    // Cleanup: parar monitoramento quando sair da página
    return () => {
      if (transactionId) {
        stopMonitoring(transactionId);
      }
    };
  }, [transactionId, navigate, getTransactionStatus, startMonitoring, stopMonitoring]);

  const handleRefreshStatus = async () => {
    if (!transactionId) return;
    
    setLoading(true);
    try {
      await checkWithMercadoPago(transactionId);
      const updatedTxn = await getTransactionStatus(transactionId);
      if (updatedTxn) {
        setTransaction(updatedTxn);
        if (updatedTxn.status === 'paid') {
          navigate(`/payment-success?transactionId=${transactionId}`);
        }
      }
      
      // Log da verificação manual
      await auditService.logPixEvent({
        transactionId,
        event: 'manual_status_check',
        details: { checkTime: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (!transaction?.pixCode?.code) return;
    
    navigator.clipboard.writeText(transaction.pixCode.code);
    
    // Log da cópia do código
    auditService.logPixEvent({
      transactionId: transaction.id,
      event: 'pix_code_copied',
      details: { copyTime: new Date().toISOString() }
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (!transaction) return <Clock className="h-6 w-6 text-yellow-500" />;
    
    switch (transaction.status) {
      case 'paid':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />;
      case 'expired':
      case 'cancelled':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!transaction) return 'Carregando...';
    
    switch (transaction.status) {
      case 'paid':
        return 'Pagamento Confirmado';
      case 'pending':
        return 'Aguardando Pagamento';
      case 'expired':
        return 'Pagamento Expirado';
      case 'cancelled':
        return 'Pagamento Cancelado';
      default:
        return 'Status Desconhecido';
    }
  };

  const getStatusColor = () => {
    if (!transaction) return 'secondary';
    
    switch (transaction.status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando status do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Transação não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar as informações desta transação.
            </p>
            <Button onClick={() => navigate('/plans')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Voltar aos Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-8 px-4 ${className || ''}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header com Status */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-xl mb-2">{getStatusText()}</CardTitle>
            <Badge variant={getStatusColor()} className="mx-auto">
              {transaction.status.toUpperCase()}
            </Badge>
            
            {/* Timer e Progress para transações pendentes */}
            {transaction.status === 'pending' && timeLeft > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(timeLeft)}
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Tempo restante para pagamento
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* QR Code e Código PIX para transações pendentes */}
        {transaction.status === 'pending' && transaction.pixCode && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pague com PIX</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeDisplay
                qrCodeUrl={transaction.pixCode.qrCodeUrl}
                pixCode={transaction.pixCode.code}
                onCopy={handleCopyPixCode}
                className="mb-4"
              />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código PIX
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyPixCode}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshStatus}
                    disabled={loading}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Verificar Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhes da Transação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes da Transação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="font-mono text-sm bg-muted p-2 rounded">{transaction.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor</label>
                <p className="text-lg font-semibold text-primary">
                  R$ {transaction.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plano</label>
                <p className="text-sm">
                  {transaction.planData.type === 'monthly' ? 'Mensal' : 'Anual'}
                  {transaction.planData.isVip && ' VIP'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p className="text-sm">{new Date(transaction.createdAt).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções baseadas no status */}
        {transaction.status === 'pending' && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Como pagar com PIX:
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha a opção PIX</li>
                  <li>Escaneie o QR Code ou cole o código PIX</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {transaction.status === 'expired' && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Pagamento Expirado
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                  O tempo limite para este pagamento foi atingido. Você pode gerar um novo pagamento.
                </p>
                <Button onClick={() => navigate('/plans')} className="w-full">
                  Gerar Novo Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {transaction.status === 'cancelled' && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Pagamento Cancelado
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-4">
                  Este pagamento foi cancelado. Você pode tentar novamente.
                </p>
                <Button onClick={() => navigate('/plans')} className="w-full">
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => navigate('/plans')} 
            variant="outline" 
            className="flex-1"
          >
            <Home className="mr-2 h-4 w-4" />
            Voltar aos Planos
          </Button>
          
          {transaction.status === 'pending' && (
            <Button 
              onClick={handleRefreshStatus}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Verificar Pagamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;