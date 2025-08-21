import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export const PaymentFailure: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Pagamento Rejeitado
        </h1>
        <p className="text-gray-600 mb-6">
          Houve um problema com seu pagamento. Verifique os dados do cartão e tente novamente.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Possíveis causas:</h3>
          <ul className="text-sm text-red-700 text-left space-y-1">
            <li>• Dados do cartão incorretos</li>
            <li>• Limite insuficiente</li>
            <li>• Cartão bloqueado</li>
            <li>• Problema temporário no sistema</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/plans')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Tentar Novamente
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato conosco pelo WhatsApp
          </p>
          <Button 
            variant="link" 
            onClick={() => window.open('https://wa.me/64996028022', '_blank')}
            className="text-green-600 hover:text-green-700 p-0 h-auto"
          >
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
};