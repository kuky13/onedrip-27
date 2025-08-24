import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Home, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransactionStatus } from '@/hooks/useTransactionStatus';
import { auditService } from '@/services/auditService';
import type { PixTransaction } from '../../shared/types/pix';

interface PaymentSuccessProps {
  className?: string;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ className }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState<PixTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { getTransactionStatus } = useTransactionStatus();

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
          
          // Log do acesso à página de sucesso
          await auditService.logPixEvent({
            transactionId,
            event: 'success_page_viewed',
            details: {
              status: txn.status,
              planType: txn.planData.type,
              isVip: txn.planData.isVip,
              amount: txn.amount
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
  }, [transactionId, navigate, getTransactionStatus]);

  const handleDownloadReceipt = () => {
    if (!transaction) return;

    const receiptData = {
      transactionId: transaction.id,
      date: new Date(transaction.createdAt).toLocaleString('pt-BR'),
      plan: `${transaction.planData.type === 'monthly' ? 'Mensal' : 'Anual'}${transaction.planData.isVip ? ' VIP' : ''}`,
      amount: `R$ ${transaction.amount.toFixed(2)}`,
      status: transaction.status,
      paymentMethod: 'PIX',
      userEmail: transaction.userEmail
    };

    const receiptText = `
=== COMPROVANTE DE PAGAMENTO ===

ID da Transação: ${receiptData.transactionId}
Data: ${receiptData.date}
Plano: ${receiptData.plan}
Valor: ${receiptData.amount}
Método: ${receiptData.paymentMethod}
Status: ${receiptData.status}
E-mail: ${receiptData.userEmail}

=== OneDrip - Sistema de Pagamentos ===
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovante-${transaction.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Log do download do comprovante
    auditService.logPixEvent({
      transactionId: transaction.id,
      event: 'receipt_downloaded',
      details: { downloadTime: new Date().toISOString() }
    });
  };

  const getStatusIcon = () => {
    if (!transaction) return <Clock className="h-8 w-8 text-yellow-500" />;
    
    switch (transaction.status) {
      case 'paid':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'expired':
      case 'cancelled':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!transaction) return 'Carregando...';
    
    switch (transaction.status) {
      case 'paid':
        return 'Pagamento Confirmado!';
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
        return 'default'; // Verde
      case 'pending':
        return 'secondary'; // Amarelo
      case 'expired':
      case 'cancelled':
        return 'destructive'; // Vermelho
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações do pagamento...</p>
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
            <CardTitle className="text-2xl mb-2">{getStatusText()}</CardTitle>
            <Badge variant={getStatusColor()} className="mx-auto">
              {transaction.status.toUpperCase()}
            </Badge>
          </CardHeader>
        </Card>

        {/* Detalhes da Transação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Detalhes do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID da Transação</label>
                <p className="font-mono text-sm bg-muted p-2 rounded">{transaction.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data</label>
                <p className="text-sm">{new Date(transaction.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plano</label>
                <p className="text-sm">
                  {transaction.planData.type === 'monthly' ? 'Mensal' : 'Anual'}
                  {transaction.planData.isVip && ' VIP'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor</label>
                <p className="text-lg font-semibold text-primary">
                  R$ {transaction.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Método</label>
                <p className="text-sm">PIX</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <p className="text-sm">{transaction.userEmail}</p>
              </div>
            </div>

            {transaction.status === 'paid' && transaction.paidAt && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <CheckCircle className="inline mr-2 h-4 w-4" />
                  Pagamento confirmado em {new Date(transaction.paidAt).toLocaleString('pt-BR')}
                </p>
              </div>
            )}

            {transaction.status === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <Clock className="inline mr-2 h-4 w-4" />
                  Aguardando confirmação do pagamento PIX
                </p>
              </div>
            )}

            {(transaction.status === 'expired' || transaction.status === 'cancelled') && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="inline mr-2 h-4 w-4" />
                  {transaction.status === 'expired' 
                    ? 'Este pagamento expirou. Você pode tentar novamente.' 
                    : 'Este pagamento foi cancelado.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
          
          {transaction.status === 'paid' && (
            <Button 
              onClick={handleDownloadReceipt}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Comprovante
            </Button>
          )}
          
          {(transaction.status === 'expired' || transaction.status === 'cancelled') && (
            <Button 
              onClick={() => navigate('/plans')}
              className="flex-1"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;