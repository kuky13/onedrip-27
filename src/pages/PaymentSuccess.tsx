import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Simular verificação de pagamento
        // Em produção, aqui você faria uma chamada para verificar o status
        const externalReference = localStorage.getItem('payment_reference');
        if (externalReference) {
          // Simular dados do pagamento
          setPaymentData({
            plan_type: 'monthly',
            amount: 68.90,
            status: 'approved'
          });
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Verificando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Aprovado!
        </h1>
        <p className="text-gray-600 mb-6">
          Seu plano foi ativado com sucesso. Você já pode acessar todas as funcionalidades.
        </p>
        
        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">Detalhes do Pagamento:</h3>
            <p><strong>Plano:</strong> {paymentData.plan_type === 'monthly' ? 'Mensal' : 'Anual'}</p>
            <p><strong>Valor:</strong> R$ {paymentData.amount.toFixed(2)}</p>
            <p><strong>Status:</strong> Aprovado</p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
          >
            Ir para Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/plans')} 
            className="w-full"
          >
            Ver Planos
          </Button>
        </div>
      </div>
    </div>
  );
};